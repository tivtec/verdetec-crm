import { createServerSupabaseClient } from "@/services/supabase/server";

export type SidebarProfile = {
  userName: string;
  organizationName: string;
  organizationLogoUrl: string | null;
};

const FALLBACK_PROFILE: SidebarProfile = {
  userName: "Usuário",
  organizationName: "Organização",
  organizationLogoUrl: null,
};

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function asNullableString(value: unknown) {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function firstFilledString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const candidate = asNullableString(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

export async function getSidebarProfile(): Promise<SidebarProfile> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return FALLBACK_PROFILE;
    }

    const userNameFromAuth =
      asNullableString((user.user_metadata as Record<string, unknown> | null)?.nome) ??
      asNullableString((user.user_metadata as Record<string, unknown> | null)?.name) ??
      asNullableString(user.email?.split("@")[0]);

    let usuarioRow: Record<string, unknown> | null = null;
    const { data: byUuidRows } = await supabase
      .from("usuarios")
      .select("id,nome,id_organizacao")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1);

    if (byUuidRows && byUuidRows.length > 0) {
      usuarioRow = byUuidRows[0] as Record<string, unknown>;
    } else if (user.email) {
      const { data: byEmailRows } = await supabase
        .from("usuarios")
        .select("id,nome,id_organizacao")
        .eq("email", user.email)
        .order("id", { ascending: false })
        .limit(1);

      if (byEmailRows && byEmailRows.length > 0) {
        usuarioRow = byEmailRows[0] as Record<string, unknown>;
      }
    }

    const userName = asNullableString(usuarioRow?.nome) ?? userNameFromAuth ?? FALLBACK_PROFILE.userName;
    const organizacaoId = asNullableString(usuarioRow?.id_organizacao);

    if (!organizacaoId) {
      return {
        ...FALLBACK_PROFILE,
        userName,
      };
    }

    const { data: organizacaoRows } = await supabase
      .from("organizacao")
      .select("*")
      .eq("id", organizacaoId)
      .limit(1);

    const organizacaoRow = (organizacaoRows?.[0] as Record<string, unknown> | undefined) ?? null;
    if (!organizacaoRow) {
      return {
        ...FALLBACK_PROFILE,
        userName,
      };
    }

    const organizationLogoUrl =
      firstFilledString(organizacaoRow, ["url_logo", "logo_url", "logo", "url_foto", "foto"]) ?? null;

    const organizationName =
      firstFilledString(organizacaoRow, [
        "nome",
        "razao_social",
        "nome_fantasia",
        "fantasia",
        "descricao",
      ]) ?? FALLBACK_PROFILE.organizationName;

    return {
      userName,
      organizationName,
      organizationLogoUrl,
    };
  } catch {
    return FALLBACK_PROFILE;
  }
}

