import { NextResponse, type NextRequest } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

type DeletarTintimPayload = {
  id?: string | number | null;
};

function asString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function asNullableString(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

async function resolveCurrentOrganizacaoId() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("usuarios")
      .select("id_organizacao")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return asNullableString((data as Record<string, unknown>).id_organizacao);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/campanhas");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as DeletarTintimPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const id = asNullableString(payload.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "id obrigatorio." }, { status: 400 });
  }

  const organizacaoId = await resolveCurrentOrganizacaoId();

  try {
    const admin = createAdminSupabaseClient();

    let query = admin.from("link_campanha_tintim").delete().eq("id", id);
    if (organizacaoId) {
      query = query.eq("id_organizacao", organizacaoId);
    }

    const { data, error } = await query.select("id").maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao excluir registro Tintim no Supabase.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Registro Tintim nao encontrado para exclusao.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: (data as Record<string, unknown>).id ?? id,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Erro interno ao excluir registro Tintim.",
      },
      { status: 500 },
    );
  }
}
