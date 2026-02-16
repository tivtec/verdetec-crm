import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

type CadastrarTintimPayload = {
  pagina?: string | null;
  link_tintim?: string | null;
  frase?: string | null;
  id_usuario?: number | string | null;
  campanha_id?: number | string | null;
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
  const payload = (await request.json().catch(() => null)) as CadastrarTintimPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const pagina = asString(payload.pagina).trim();
  const linkTintim = asString(payload.link_tintim).trim();

  if (!pagina) {
    return NextResponse.json({ ok: false, error: "pagina obrigatoria." }, { status: 400 });
  }

  if (!linkTintim) {
    return NextResponse.json({ ok: false, error: "link_tintim obrigatorio." }, { status: 400 });
  }

  const idUsuario = asPositiveInt(payload.id_usuario);
  const campanhaId = asPositiveInt(payload.campanha_id);
  const organizacaoId = await resolveCurrentOrganizacaoId();

  try {
    const admin = createAdminSupabaseClient();

    const insertPayload: Record<string, unknown> = {
      pagina,
      link_tintim: linkTintim,
      frase: asNullableString(payload.frase),
      id_usuario: idUsuario,
      campanha_id: campanhaId,
    };

    if (organizacaoId) {
      insertPayload.id_organizacao = organizacaoId;
    }

    const { data, error } = await admin
      .from("link_campanha_tintim")
      .insert(insertPayload)
      .select("id,created_at,id_usuario,pagina,link_tintim,campanha_id,frase,id_organizacao")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao cadastrar pagina Tintim no Supabase.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cadastro de pagina Tintim nao retornou dados.",
        },
        { status: 502 },
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
        error: "Erro interno ao cadastrar pagina Tintim.",
      },
      { status: 500 },
    );
  }
}

