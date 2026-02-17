import { NextResponse, type NextRequest } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

type EditarTintimPayload = {
  id?: string | number | null;
  pagina?: string | null;
  link_tintim?: string | null;
  frase?: string | null;
  id_usuario?: number | string | null;
  campanha_id?: number | string | null;
};

function hasOwn(payload: object, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key);
}

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

function asPositiveInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const intValue = Math.trunc(value);
    return intValue > 0 ? intValue : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      const intValue = Math.trunc(parsed);
      return intValue > 0 ? intValue : null;
    }
  }

  return null;
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

  const payload = (await request.json().catch(() => null)) as EditarTintimPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const id = asNullableString(payload.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "id obrigatorio." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};

  if (hasOwn(payload, "pagina")) {
    const pagina = asString(payload.pagina).trim();
    if (!pagina) {
      return NextResponse.json({ ok: false, error: "pagina obrigatoria." }, { status: 400 });
    }
    updatePayload.pagina = pagina;
  }

  if (hasOwn(payload, "link_tintim")) {
    const linkTintim = asString(payload.link_tintim).trim();
    if (!linkTintim) {
      return NextResponse.json({ ok: false, error: "link_tintim obrigatorio." }, { status: 400 });
    }
    updatePayload.link_tintim = linkTintim;
  }

  if (hasOwn(payload, "frase")) {
    updatePayload.frase = asNullableString(payload.frase);
  }

  if (hasOwn(payload, "id_usuario")) {
    const idUsuario = asPositiveInt(payload.id_usuario);
    if (!idUsuario) {
      return NextResponse.json({ ok: false, error: "id_usuario invalido." }, { status: 400 });
    }
    updatePayload.id_usuario = idUsuario;
  }

  if (hasOwn(payload, "campanha_id")) {
    updatePayload.campanha_id = asPositiveInt(payload.campanha_id);
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      row: { id },
    });
  }

  const organizacaoId = await resolveCurrentOrganizacaoId();

  try {
    const admin = createAdminSupabaseClient();

    let query = admin.from("link_campanha_tintim").update(updatePayload).eq("id", id);
    if (organizacaoId) {
      query = query.eq("id_organizacao", organizacaoId);
    }

    const { data, error } = await query
      .select("id,created_at,id_usuario,pagina,link_tintim,campanha_id,frase,id_organizacao")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao atualizar pagina Tintim no Supabase.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Registro Tintim nao encontrado para atualizacao.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      row: data,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Erro interno ao atualizar pagina Tintim.",
      },
      { status: 500 },
    );
  }
}
