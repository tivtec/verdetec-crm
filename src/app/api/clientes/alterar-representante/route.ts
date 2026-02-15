import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

const UPDATE_REPRESENTANTE_ENDPOINT =
  process.env.CLIENTES_ALTERAR_REPRESENTANTE_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/7cbc9915-e9a7-4518-9e80-959f99f621b8";

type UpdateRepresentantePayload = {
  id_pessoa?: number | string | null;
  pessoa_id?: number | string | null;
  id_user?: number | string | null;
  id_usuario?: number | string | null;
  autor?: number | string | null;
};

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

async function parseResponseBody(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

async function resolveCurrentUsuarioId() {
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
    .select("id")
    .eq("uuid_user", user.id)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return asPositiveInt((data[0] as Record<string, unknown>).id);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as UpdateRepresentantePayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const idPessoa = asPositiveInt(payload.id_pessoa) ?? asPositiveInt(payload.pessoa_id);
  const idUser = asPositiveInt(payload.id_user) ?? asPositiveInt(payload.id_usuario);
  let autor = asPositiveInt(payload.autor);
  if (!autor) {
    autor = await resolveCurrentUsuarioId();
  }

  if (!idPessoa) {
    return NextResponse.json({ ok: false, error: "id_pessoa obrigatorio." }, { status: 400 });
  }

  if (!idUser) {
    return NextResponse.json({ ok: false, error: "id_user obrigatorio." }, { status: 400 });
  }

  if (!autor) {
    return NextResponse.json({ ok: false, error: "autor obrigatorio." }, { status: 400 });
  }

  const webhookPayload = {
    id_pessoa: idPessoa,
    id_user: idUser,
    autor,
    id_usuario: idUser,
  };

  try {
    const response = await fetch(UPDATE_REPRESENTANTE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    const parsedBody = await parseResponseBody(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de alteracao de representante retornou erro.",
          status: response.status,
          details: parsedBody,
          sent: webhookPayload,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      result: parsedBody,
      sent: webhookPayload,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Falha de rede ao chamar webhook de alteracao de representante." },
      { status: 502 },
    );
  }
}
