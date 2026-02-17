import { NextResponse, type NextRequest } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";

const CADASTRAR_USUARIO_ENDPOINT =
  process.env.USUARIOS_CADASTRAR_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/16fab987-ad47-43f8-93ec-bb254ab15fc2";

type CadastrarUsuarioPayload = {
  email?: string | null;
  senha?: string | null;
  nome?: string | null;
  fone?: string | null;
  telefone?: string | null;
  link_meet?: string | null;
  id_umbler?: string | null;
  identificador_umbler?: string | null;
  permissao?: string | null;
  tipo_acesso?: string | null;
  setor?: string | null;
  vertical?: string | null;
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

async function parseResponseBody(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  const trimmed = responseText.length > 4000 ? `${responseText.slice(0, 4000)}...` : responseText;

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

export async function POST(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/usuarios");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as CadastrarUsuarioPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const email = asString(payload.email).trim();
  const senha = asString(payload.senha).trim();
  const nome = asString(payload.nome).trim();
  const telefone = asString(payload.telefone ?? payload.fone).trim();
  const linkMeet = asString(payload.link_meet).trim();
  const idUmbler = asString(payload.identificador_umbler ?? payload.id_umbler).trim();
  const permissao = asString(payload.permissao).trim() || "gestor";
  const tipoAcesso = asString(payload.tipo_acesso).trim();
  const setor = asString(payload.setor).trim();
  const vertical = asString(payload.vertical).trim();

  if (!email) {
    return NextResponse.json({ ok: false, error: "email obrigatorio." }, { status: 400 });
  }

  if (!senha) {
    return NextResponse.json({ ok: false, error: "senha obrigatoria." }, { status: 400 });
  }

  if (!nome) {
    return NextResponse.json({ ok: false, error: "nome obrigatorio." }, { status: 400 });
  }

  if (!tipoAcesso) {
    return NextResponse.json({ ok: false, error: "tipo_acesso obrigatorio." }, { status: 400 });
  }

  const webhookPayload = {
    email,
    senha,
    nome,
    fone: telefone,
    telefone,
    link_meet: linkMeet,
    id_umbler: idUmbler,
    identificador_umbler: idUmbler,
    permissao,
    tipo_acesso: tipoAcesso,
    setor,
    vertical,
  };

  try {
    const response = await fetch(CADASTRAR_USUARIO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    if (!response.ok) {
      const parsedBody = await parseResponseBody(response);
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de cadastro de usuario retornou erro.",
          status: response.status,
          details: parsedBody,
          sent: webhookPayload,
        },
        { status: 502 },
      );
    }

    response.body?.cancel();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Falha de rede ao chamar webhook de cadastro de usuario." },
      { status: 502 },
    );
  }
}
