import { NextResponse, type NextRequest } from "next/server";

type RetratoClientesRequest = {
  etiqueta?: string | null;
  id_usuario?: number | string | null;
  limit?: number | string | null;
  offset?: number | string | null;
  telefone?: string | null;
};

type RetratoClientesRpcPayload = {
  etiqueta_param: string;
  id_usuario_param: number;
  limit_param: string;
  offset_param: string;
  telefone_param: string;
};

type RetratoClientesRpcRow = Record<string, unknown>;

type RetratoClienteListItem = {
  id: string;
  etiqueta: string;
  nome: string;
  telefone: string;
};

const RETRATO_CLIENTES_RPC_ENDPOINT =
  process.env.RETRATO_CLIENTES_RPC_ENDPOINT ??
  "https://zosdxuntvhrzjutmvduu.supabase.co/rest/v1/rpc/leads_buscar_agregacao_id_user11";

const RETRATO_CLIENTES_RPC_API_KEY =
  process.env.RETRATO_CLIENTES_RPC_API_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const TOTAL_KEYS = [
  "total",
  "total_count",
  "count_total",
  "qtde_total",
  "total_clientes",
  "total_registros",
  "records_total",
] as const;

const NOME_KEYS = [
  "nome",
  "nome_pessoa",
  "pessoa_nome",
  "nome_cliente",
  "cliente",
  "razao_social",
] as const;

const TELEFONE_KEYS = [
  "pessoa_telefone",
  "telefone",
  "fone",
  "fone_cliente",
  "telefone_cliente",
  "celular",
  "whatsapp",
] as const;

const ETIQUETA_KEYS = [
  "etiqueta",
  "tag",
  "nome_etiqueta",
  "desc_etiqueta",
  "etiqueta_nome",
] as const;

const ID_KEYS = ["id", "id_agregacao", "agregacao_id", "id_pessoa", "pessoa_id"] as const;

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function asNonNegativeInt(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }
  return Math.max(0, Math.trunc(fallback));
}

function asNullableInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

function asPositiveInt(value: unknown, fallback = 0) {
  const parsed = asNonNegativeInt(value, fallback);
  return parsed > 0 ? parsed : 0;
}

function firstNonEmptyString(row: RetratoClientesRpcRow, keys: readonly string[]) {
  for (const key of keys) {
    const current = asString(row[key], "").trim();
    if (current) {
      return current;
    }
  }
  return "";
}

function normalizeEtiqueta(value: string | null | undefined) {
  const raw = asString(value, "").trim();
  if (!raw) {
    return "#40";
  }

  const numericMatch = raw.match(/(\d{1,2})/);
  if (numericMatch) {
    return `#${numericMatch[1].padStart(2, "0")}`;
  }

  if (raw.startsWith("#")) {
    return raw;
  }

  return `#${raw}`;
}

function normalizePhone(value: string | null | undefined) {
  return asString(value, "").replace(/\D/g, "");
}

function extractTotalFromRows(rows: RetratoClientesRpcRow[]) {
  if (!rows.length) {
    return 0;
  }

  for (const key of TOTAL_KEYS) {
    const parsed = asNullableInt(rows[0]?.[key]);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function mapRpcRowsToItems(rows: RetratoClientesRpcRow[], fallbackEtiqueta: string): RetratoClienteListItem[] {
  return rows.map((row, index) => {
    const id = firstNonEmptyString(row, ID_KEYS) || String(index + 1);
    const etiqueta = normalizeEtiqueta(firstNonEmptyString(row, ETIQUETA_KEYS) || fallbackEtiqueta);
    const nome = firstNonEmptyString(row, NOME_KEYS) || "Sem nome";
    const telefone = firstNonEmptyString(row, TELEFONE_KEYS) || "-";

    return {
      id,
      etiqueta,
      nome,
      telefone,
    };
  });
}

async function fetchRetratoClientesRpcRows(payload: RetratoClientesRpcPayload) {
  const response = await fetch(RETRATO_CLIENTES_RPC_ENDPOINT, {
    method: "POST",
    headers: {
      apikey: RETRATO_CLIENTES_RPC_API_KEY,
      Authorization: `Bearer ${RETRATO_CLIENTES_RPC_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar RPC (${response.status})`);
  }

  const rawText = await response.text();
  if (!rawText.trim()) {
    return [] as RetratoClientesRpcRow[];
  }

  const parsed = JSON.parse(rawText) as unknown;
  if (Array.isArray(parsed)) {
    return parsed as RetratoClientesRpcRow[];
  }

  if (parsed && typeof parsed === "object") {
    return [parsed as RetratoClientesRpcRow];
  }

  return [] as RetratoClientesRpcRow[];
}

export async function POST(request: NextRequest) {
  if (!RETRATO_CLIENTES_RPC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "RETRATO_CLIENTES_RPC_API_KEY nao configurada." },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as RetratoClientesRequest;
  const idUsuario = asPositiveInt(payload.id_usuario, 0);
  const limit = Math.min(100, Math.max(1, asNonNegativeInt(payload.limit, 10) || 10));
  const offset = asNonNegativeInt(payload.offset, 0);
  const etiqueta = normalizeEtiqueta(payload.etiqueta);
  const telefone = normalizePhone(payload.telefone);

  if (!idUsuario) {
    return NextResponse.json({ ok: false, error: "id_usuario invalido." }, { status: 400 });
  }

  try {
    const rpcPayload: RetratoClientesRpcPayload = {
      etiqueta_param: etiqueta,
      id_usuario_param: idUsuario,
      limit_param: String(limit),
      offset_param: String(offset),
      telefone_param: telefone,
    };

    const rows = await fetchRetratoClientesRpcRows(rpcPayload);
    const items = mapRpcRowsToItems(rows, etiqueta);

    let total = extractTotalFromRows(rows);
    if (total === null) {
      const countRows = await fetchRetratoClientesRpcRows({
        ...rpcPayload,
        limit_param: "10000",
        offset_param: "0",
      });
      total = countRows.length;
    }

    const hasNextPage = offset + items.length < total;

    return NextResponse.json({
      ok: true,
      items,
      total,
      hasNextPage,
      page: Math.trunc(offset / limit) + 1,
      pageSize: limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar clientes do retrato.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
