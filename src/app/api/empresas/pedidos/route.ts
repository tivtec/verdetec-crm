import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { formatDateTime } from "@/utils/format";

const EMPRESA_PEDIDOS_ENDPOINT =
  process.env.EMPRESA_PEDIDOS_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/014afb41-30d0-456e-80eb-38ae4a3f5493";

const EMPRESA_PEDIDOS_AUTHORIZATION =
  process.env.EMPRESA_PEDIDOS_AUTHORIZATION ?? "Basic YXBpUG9ydGFsLTAyOm85MmVtMExRNHNKRTM5";

type PedidosEmpresaPayload = {
  uuid_empresa?: string | null;
  limit?: string | number | null;
  ofsett?: string | number | null;
  offset?: string | number | null;
};

type PedidoEmpresaRow = {
  id: string;
  nome: string;
  telefone: string;
  metragem: string;
  cep: string;
  data: string;
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
  const candidates = ["rows", "data", "items", "result", "pedidos", "solicitacoes", "output", "lista"];

  for (const key of candidates) {
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

function formatPedidoDate(value: unknown) {
  const raw = asString(value).trim();
  if (!raw) {
    return "-";
  }

  const formatted = formatDateTime(raw);
  if (!formatted || formatted.toLowerCase().includes("invalid")) {
    return raw;
  }

  return formatted;
}

function normalizeRows(rows: LooseObject[]) {
  return rows.map((row, index) => {
    const nome = firstNonEmptyString(row, ["nome", "nome_pessoa", "cliente", "nome_cliente"], "-");
    const telefone = firstNonEmptyString(
      row,
      ["telefone", "fone", "whatsapp", "pessoa_telefone", "telefone_cliente"],
      "-",
    );
    const metragem = firstNonEmptyString(row, ["metragem", "m2", "sqm", "area"], "-");
    const cep = firstNonEmptyString(row, ["cep", "codigo_postal"], "-");
    const data = formatPedidoDate(
      firstNonEmptyString(row, ["data", "created_at", "data_criacao", "criado_em", "updated_at"]),
    );

    return {
      id: firstNonEmptyString(row, ["id", "uuid", "pedido_id"], String(index + 1)),
      nome,
      telefone,
      metragem,
      cep,
      data,
    } satisfies PedidoEmpresaRow;
  });
}

type PedidoTableRow = {
  id?: string | null;
  nome?: string | null;
  telefone?: string | null;
  metragem?: number | string | null;
  cep?: string | null;
  criado_em?: string | null;
  created_at?: string | null;
};

async function fetchFallbackPedidosFromSupabase(uuidEmpresa: string, limitText: string) {
  const admin = createAdminSupabaseClient();
  const parsedLimit = Number(limitText);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.trunc(parsedLimit) : 500;

  const [directQuery, listQuery] = await Promise.all([
    admin
      .from("pedidos")
      .select("id,nome,telefone,metragem,cep,criado_em,created_at")
      .or(
        `empresa_1.eq.${uuidEmpresa},empresa_2.eq.${uuidEmpresa},empresa_3.eq.${uuidEmpresa},empresa_4.eq.${uuidEmpresa},empresa_5.eq.${uuidEmpresa}`,
      )
      .order("criado_em", { ascending: false })
      .limit(limit),
    admin
      .from("pedidos")
      .select("id,nome,telefone,metragem,cep,criado_em,created_at")
      .contains("list_empresa", [uuidEmpresa])
      .order("criado_em", { ascending: false })
      .limit(limit),
  ]);

  const rows: PedidoTableRow[] = [];
  if (!directQuery.error && directQuery.data?.length) {
    rows.push(...(directQuery.data as PedidoTableRow[]));
  }
  if (!listQuery.error && listQuery.data?.length) {
    rows.push(...(listQuery.data as PedidoTableRow[]));
  }

  const uniqueById = new Map<string, PedidoTableRow>();
  for (const row of rows) {
    const id = asString(row.id).trim();
    if (!id) {
      continue;
    }
    if (!uniqueById.has(id)) {
      uniqueById.set(id, row);
    }
  }

  const normalized = Array.from(uniqueById.values()).map((row, index) => {
    const rawDate = asString(row.criado_em).trim() || asString(row.created_at).trim();
    return {
      id: asString(row.id).trim() || String(index + 1),
      nome: asString(row.nome).trim() || "-",
      telefone: asString(row.telefone).trim() || "-",
      metragem: asString(row.metragem).trim() || "-",
      cep: asString(row.cep).trim() || "-",
      data: formatPedidoDate(rawDate),
    } satisfies PedidoEmpresaRow;
  });

  return normalized;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as PedidosEmpresaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const uuidEmpresa = asString(payload.uuid_empresa).trim();
  if (!uuidEmpresa) {
    return NextResponse.json({ ok: false, error: "uuid_empresa obrigatorio." }, { status: 400 });
  }

  const limit = asString(payload.limit).trim() || "0";
  const ofsett = asString(payload.ofsett ?? payload.offset).trim() || "0";

  const webhookPayload = {
    uuid_empresa: uuidEmpresa,
    limit,
    ofsett,
  };

  try {
    const response = await fetch(EMPRESA_PEDIDOS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: EMPRESA_PEDIDOS_AUTHORIZATION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    const responseText = await response.text();
    const parsedBody = parseResponseBody(responseText);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de pedidos retornou erro.",
          status: response.status,
          details: parsedBody,
          sent: webhookPayload,
        },
        { status: 502 },
      );
    }

    let rows = normalizeRows(extractRows(parsedBody));
    if (!rows.length) {
      rows = await fetchFallbackPedidosFromSupabase(uuidEmpresa, limit);
    }

    return NextResponse.json({
      ok: true,
      rows,
      sent: webhookPayload,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Falha de rede ao carregar pedidos da empresa." },
      { status: 502 },
    );
  }
}
