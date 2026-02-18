import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";

const CADASTRAR_LEAD_ENDPOINT =
  process.env.CLIENTES_CADASTRAR_LEAD_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/4f9cb6b9-5ce4-4ad1-886b-b321b22641e1";

type CadastrarLeadPayload = {
  fone?: string | null;
  email?: string | null;
  nome?: string | null;
  id_usuario?: number | string | null;
  id_user?: number | string | null;
  id_usuario_param?: number | string | null;
  label?: string | null;
};

type PessoaDuplicateRow = {
  id: number;
  nome: string;
  telefone: string;
  telefoneWebhook: string;
  telefoneAlternativo: string;
  telefoneCobranca: string;
  email: string;
  createdAt: string;
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

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toUnique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

function buildPhoneCandidates(rawPhone: string) {
  const raw = rawPhone.trim();
  const digits = normalizePhoneDigits(raw);

  const candidates = [raw, digits];
  if (digits.length === 13 && digits.startsWith("55")) {
    candidates.push(digits.slice(2));
  }

  const local = digits.length >= 10 ? digits.slice(-11) : digits;
  if (local.length === 11) {
    const ddd = local.slice(0, 2);
    const n1 = local.slice(2, 7);
    const n2 = local.slice(7);
    candidates.push(
      local,
      `${ddd}${n1}${n2}`,
      `(${ddd}) ${n1}-${n2}`,
      `(${ddd})${n1}-${n2}`,
      `${ddd} ${n1}-${n2}`,
      `+55${ddd}${n1}${n2}`,
      `55${ddd}${n1}${n2}`,
    );
  } else if (local.length === 10) {
    const ddd = local.slice(0, 2);
    const n1 = local.slice(2, 6);
    const n2 = local.slice(6);
    candidates.push(
      local,
      `${ddd}${n1}${n2}`,
      `(${ddd}) ${n1}-${n2}`,
      `(${ddd})${n1}-${n2}`,
      `${ddd} ${n1}-${n2}`,
      `+55${ddd}${n1}${n2}`,
      `55${ddd}${n1}${n2}`,
    );
  }

  return toUnique(candidates.map((value) => value.trim()));
}

function asPessoaDuplicateRow(row: Record<string, unknown>): PessoaDuplicateRow {
  return {
    id: Math.max(0, Math.trunc(asPositiveInt(row.id) ?? 0)),
    nome: asString(row.nome),
    telefone: asString(row.telefone),
    telefoneWebhook: asString(row.telefone_webhook),
    telefoneAlternativo: asString(row.fone_alternativo),
    telefoneCobranca: asString(row.telefone_cobranca),
    email: asString(row.email),
    createdAt: asString(row.created_at),
  };
}

async function findExistingPessoaByLeadData({
  fone,
  email,
}: {
  fone: string;
  email: string;
}) {
  try {
    const admin = createAdminSupabaseClient();
    const phoneCandidates = buildPhoneCandidates(fone);

    if (phoneCandidates.length > 0) {
      const phoneOrParts = phoneCandidates.flatMap((candidate) => [
        `telefone.eq.${candidate}`,
        `telefone_webhook.eq.${candidate}`,
        `fone_alternativo.eq.${candidate}`,
        `telefone_cobranca.eq.${candidate}`,
      ]);

      const { data: byPhone } = await admin
        .from("pessoa")
        .select("id,nome,telefone,telefone_webhook,fone_alternativo,telefone_cobranca,email,created_at")
        .or(phoneOrParts.join(","))
        .order("id", { ascending: false })
        .limit(1);

      if (byPhone && byPhone.length > 0) {
        return asPessoaDuplicateRow(byPhone[0] as Record<string, unknown>);
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 0) {
      const { data: byEmail } = await admin
        .from("pessoa")
        .select("id,nome,telefone,telefone_webhook,fone_alternativo,telefone_cobranca,email,created_at")
        .ilike("email", normalizedEmail)
        .order("id", { ascending: false })
        .limit(1);

      if (byEmail && byEmail.length > 0) {
        return asPessoaDuplicateRow(byEmail[0] as Record<string, unknown>);
      }
    }

    return null;
  } catch {
    return null;
  }
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
  const idUsuario =
    asPositiveInt(payload.id_usuario) ??
    asPositiveInt(payload.id_user) ??
    asPositiveInt(payload.id_usuario_param);
  const label = asString(payload.label || "21").trim() || "21";

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
    id_user: idUsuario,
    id_usuario_param: idUsuario,
    label,
  };

  try {
    const existingPessoa = await findExistingPessoaByLeadData({ fone, email });
    if (existingPessoa) {
      return NextResponse.json(
        {
          ok: false,
          duplicate: true,
          error: "Cliente ja cadastrado.",
          existing: existingPessoa,
        },
        { status: 409 },
      );
    }

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
