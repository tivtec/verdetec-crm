import { NextResponse, type NextRequest } from "next/server";

const PEDIDOS_PROXIMOS_ENDPOINT =
  process.env.EMPRESA_PEDIDOS_PROXIMOS_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/b3c41fae-7329-44f2-ac1d-6731c033d384";

const PEDIDOS_PROXIMOS_AUTHORIZATION =
  process.env.EMPRESA_PEDIDOS_PROXIMOS_AUTHORIZATION ?? "Basic YXBpUG9ydGFsLTAyOm85MmVtMExRNHNKRTM5";

type PedidosProximosPayload = {
  limit?: string | number | null;
  ofsett?: string | number | null;
  offset?: string | number | null;
  cep?: string | null;
  id_empresa?: string | null;
};

type PedidosProximosRow = {
  id: string;
  nome: string;
  telefone: string;
  metragem: string;
  cep: string;
};

type LooseObject = Record<string, unknown>;

function asString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function parseResponseBody(text: string) {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractRows(payload: unknown): LooseObject[] {
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === "object") as LooseObject[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as LooseObject;
  const listKeys = ["rows", "data", "items", "result", "lista", "pedidos", "solicitacoes", "output"];

  for (const key of listKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item) => item && typeof item === "object") as LooseObject[];
    }
  }

  if (Object.keys(record).length === 0) {
    return [];
  }

  return [record];
}

function firstNonEmptyString(row: LooseObject, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]).trim();
    if (value.length > 0) {
      return value;
    }
  }

  return fallback;
}

function normalizeRows(rows: LooseObject[]) {
  return rows.map((row, index) => ({
    id: firstNonEmptyString(row, ["pedido_uuid", "id", "uuid", "pedido_id"], String(index + 1)),
    nome: firstNonEmptyString(row, ["nome", "nome_pessoa", "pessoa_nome", "cliente", "nome_cliente"], "-"),
    telefone: firstNonEmptyString(
      row,
      ["telefone", "fone", "whatsapp", "telefone_cliente", "pessoa_telefone"],
      "-",
    ),
    metragem: firstNonEmptyString(row, ["metragem", "m2", "sqm", "area"], "-"),
    cep: firstNonEmptyString(row, ["cep", "codigo_postal"], "-"),
  })) satisfies PedidosProximosRow[];
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as PedidosProximosPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const webhookPayload = {
    limit: asString(payload.limit).trim() || "10",
    ofsett: asString(payload.ofsett ?? payload.offset).trim() || "0",
    cep: asString(payload.cep).trim(),
    id_empresa: asString(payload.id_empresa).trim(),
  };

  if (!webhookPayload.cep) {
    return NextResponse.json({ ok: false, error: "cep obrigatorio." }, { status: 400 });
  }

  if (!webhookPayload.id_empresa) {
    return NextResponse.json({ ok: false, error: "id_empresa obrigatorio." }, { status: 400 });
  }

  try {
    const response = await fetch(PEDIDOS_PROXIMOS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: PEDIDOS_PROXIMOS_AUTHORIZATION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    const responseText = await response.text();
    const parsed = parseResponseBody(responseText);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de pedidos proximos retornou erro.",
          status: response.status,
          details: parsed,
          sent: webhookPayload,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      rows: normalizeRows(extractRows(parsed)),
      sent: webhookPayload,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha de rede ao carregar pedidos proximos." }, { status: 502 });
  }
}
