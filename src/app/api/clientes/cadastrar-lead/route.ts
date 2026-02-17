import { NextResponse, type NextRequest } from "next/server";

const CADASTRAR_LEAD_ENDPOINT =
  process.env.CLIENTES_CADASTRAR_LEAD_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/4f9cb6b9-5ce4-4ad1-886b-b321b22641e1";

type CadastrarLeadPayload = {
  fone?: string | null;
  email?: string | null;
  nome?: string | null;
  id_usuario?: number | string | null;
  label?: string | null;
};

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
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

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as CadastrarLeadPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const fone = asString(payload.fone).trim();
  const email = asString(payload.email).trim();
  const nome = asString(payload.nome).trim();
  const idUsuario = asPositiveInt(payload.id_usuario);
  const label = asString(payload.label || "10").trim() || "10";

  if (!nome) {
    return NextResponse.json({ ok: false, error: "nome obrigatorio." }, { status: 400 });
  }

  if (!fone) {
    return NextResponse.json({ ok: false, error: "fone obrigatorio." }, { status: 400 });
  }

  if (!idUsuario) {
    return NextResponse.json({ ok: false, error: "id_usuario obrigatorio." }, { status: 400 });
  }

  const webhookPayload = {
    fone,
    email,
    nome,
    id_usuario: idUsuario,
    label,
  };

  try {
    const response = await fetch(CADASTRAR_LEAD_ENDPOINT, {
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
          error: "Webhook de cadastro de lead retornou erro.",
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
      { ok: false, error: "Falha de rede ao chamar webhook de cadastro de lead." },
      { status: 502 },
    );
  }
}
