import Image from "next/image";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/services/supabase/server";

function resolveRouteByRole(role?: string | null, vertical?: string | null) {
  if (!role) {
    return "/dashboard";
  }

  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "superadm" || normalizedRole === "org_admin") {
    return "/dashboard";
  }

  if (normalizedRole === "gestor" || normalizedRole === "manager") {
    if (vertical?.toLowerCase().includes("hidro")) {
      return "/dashboard-adm";
    }
    return "/empresas";
  }

  if (normalizedRole === "representante") {
    if (vertical?.toLowerCase().includes("pedidos")) {
      return "/pedido";
    }
    return "/dashboard-representante";
  }

  return "/dashboard";
}

export default async function SplashPage() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const role =
      (user.app_metadata?.role as string | undefined) ??
      (user.user_metadata?.tipoAcesso as string | undefined);
    const vertical = user.user_metadata?.vertical as string | undefined;

    redirect(resolveRouteByRole(role, vertical));
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-surface)] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--brand-border)] bg-white p-8 text-center shadow-sm">
          <Image src="/brand/Icon.png" alt="Verdetec" width={56} height={56} className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">Preparando ambiente</h1>
          <p className="mt-2 text-sm text-slate-500">
            Configure as variáveis do Supabase para habilitar o redirecionamento automático.
          </p>
        </div>
      </div>
    );
  }
}
