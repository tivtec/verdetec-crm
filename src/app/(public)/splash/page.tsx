import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/services/supabase/server";

function resolveRouteByRole(role?: string | null, vertical?: string | null) {
  if (!role) {
    return "/dashboard";
  }

  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "superadm" || normalizedRole === "org_admin" || normalizedRole === "admin") {
    return "/dashboard";
  }

  if (normalizedRole === "gestor" || normalizedRole === "manager") {
    if (vertical?.toLowerCase().includes("hidro")) {
      return "/dashboard-adm";
    }
    return "/empresas";
  }

  if (normalizedRole === "representante") {
    if (vertical?.toLowerCase().includes("pedido")) {
      return "/pedido";
    }
    return "/dashboard-representante";
  }

  return "/dashboard";
}

type LegacyProfileRow = {
  tipo_acesso: string | null;
  verticais?: { descricao?: string | null } | Array<{ descricao?: string | null }> | null;
};

function getVerticalDescription(row: LegacyProfileRow | null) {
  const relation = row?.verticais;

  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.descricao ?? null;
  }

  return relation.descricao ?? null;
}

async function getLegacyProfile(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(
        `
          tipo_acesso,
          verticais:verticais!usuarios_id_vertical_fkey(descricao)
        `,
      )
      .eq("uuid_user", userId)
      .order("id", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return null;
    }

    return data[0] as unknown as LegacyProfileRow;
  } catch {
    return null;
  }
}

export default async function SplashPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const legacyProfile = await getLegacyProfile(user.id);

  const role =
    legacyProfile?.tipo_acesso ??
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.tipoAcesso as string | undefined);

  const vertical =
    getVerticalDescription(legacyProfile) ??
    (user.user_metadata?.vertical as string | undefined);

  redirect(resolveRouteByRole(role, vertical));
}
