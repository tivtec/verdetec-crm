import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { CRM_SIDEBAR_PAGES } from "@/services/access-control/constants";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/splash",
  "/auth1",
  "/novasenha",
  "/redefinirsenha",
  "/proposta",
  "/proposta/cote",
  "/meet",
]);

const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";
const ACL_ROUTE_CANDIDATES = CRM_SIDEBAR_PAGES.map((page) => page.path);

type PathAclResult = boolean | null;

async function getPathAccess(
  supabase: ReturnType<typeof createServerClient>,
  path: string,
): Promise<PathAclResult> {
  try {
    const { data, error } = await supabase.rpc("crm_can_access_path", {
      p_path: path,
    });

    if (error) {
      return null;
    }

    return data !== false;
  } catch {
    return null;
  }
}

async function resolveFirstAllowedPath(supabase: ReturnType<typeof createServerClient>) {
  for (const candidatePath of ACL_ROUTE_CANDIDATES) {
    const hasAccess = await getPathAccess(supabase, candidatePath);

    if (hasAccess === true) {
      return candidatePath;
    }

    if (hasAccess === null) {
      return DEFAULT_AUTHENTICATED_ROUTE;
    }
  }

  return DEFAULT_AUTHENTICATED_ROUTE;
}

export async function updateAuthSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const isApiRoute = pathname.startsWith("/api");
  const isStaticRoute =
    pathname.startsWith("/_next") || pathname.includes(".") || pathname === "/";

  if (!user && !isPublicRoute && !isApiRoute && !isStaticRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = await resolveFirstAllowedPath(supabase);
    return NextResponse.redirect(url);
  }

  const shouldEvaluateAcl = user && !isPublicRoute && !isApiRoute && !isStaticRoute;
  if (shouldEvaluateAcl) {
    try {
      const hasAccess = await getPathAccess(supabase, pathname);

      if (hasAccess === false) {
        const fallbackPath = await resolveFirstAllowedPath(supabase);
        if (fallbackPath !== pathname) {
          const url = request.nextUrl.clone();
          url.pathname = fallbackPath;
          url.searchParams.set("access_denied", "1");
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // fallback permissivo para nao interromper navegacao caso ACL ainda nao exista
    }
  }

  return response;
}
