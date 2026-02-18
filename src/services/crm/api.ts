import { cache } from "react";

import type { AgendaEvent, Cliente, Empresa, Pedido } from "@/schemas/domain";
import { createServerSupabaseClient } from "@/services/supabase/server";
import { formatDateTime } from "@/utils/format";

export type DashboardMetric = {
  title: string;
  value: string;
  delta: string;
};

const mockDashboardMetrics: DashboardMetric[] = [
  { title: "Clientes ativos", value: "1284", delta: "+8.2% no mes" },
  { title: "Empresas", value: "302", delta: "+2.1% no mes" },
  { title: "Pedidos", value: "489", delta: "+13.4% no mes" },
  { title: "Ticket medio", value: "R$ 2430.00", delta: "-1.3% no mes" },
];

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return fallback;
}

function parseDateInput(value: string) {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Handles timestamps like 2026-02-13T13:00:00+00 / -03
  const tzHourOnly = trimmed.match(/([+-]\d{2})$/);
  if (tzHourOnly) {
    const normalized = `${trimmed}:00`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Handles timestamps like 2026-02-13T13:00:00-0300 / +0000
  const tzCompact = trimmed.match(/([+-]\d{2})(\d{2})$/);
  if (tzCompact) {
    const normalized = `${trimmed.slice(0, -5)}${tzCompact[1]}:${tzCompact[2]}`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Handles values like 13-02-2026 09:30 or 13-02-2026
  const brazilianMatch = trimmed.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (brazilianMatch) {
    const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = brazilianMatch;
    const normalized = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    return new Date().toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = parseDateInput(value);
    if (parsed) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

export const getDashboardMetrics = cache(async () => {
  try {
    const supabase = await createServerSupabaseClient();

    const [pessoaCountResult, empresaCountResult, pedidosResult] = await Promise.all([
      supabase.from("pessoa").select("id", { count: "exact", head: true }),
      supabase.from("empresa").select("id", { count: "exact", head: true }),
      supabase.from("pedidos").select("id, metragem"),
    ]);

    const totalClientes = pessoaCountResult.count ?? 0;
    const totalEmpresas = empresaCountResult.count ?? 0;
    const pedidosRows = (pedidosResult.data as Array<{ metragem?: number | string | null }> | null) ?? [];
    const totalPedidos = pedidosRows.length;
    const ticketMedio =
      totalPedidos > 0
        ? pedidosRows.reduce((sum, row) => sum + asNumber(row.metragem, 0), 0) / totalPedidos
        : 0;

    return [
      {
        title: "Clientes ativos",
        value: String(totalClientes),
        delta: "Base pessoa",
      },
      {
        title: "Empresas",
        value: String(totalEmpresas),
        delta: "Base empresa",
      },
      {
        title: "Pedidos",
        value: String(totalPedidos),
        delta: "Base pedidos",
      },
      {
        title: "Ticket medio",
        value: `R$ ${ticketMedio.toFixed(2)}`,
        delta: "Media por metragem",
      },
    ] satisfies DashboardMetric[];
  } catch {
    return mockDashboardMetrics;
  }
});

const mockClientes: Cliente[] = [
  {
    id: "1",
    nome: "Cliente exemplo",
    email: "cliente@exemplo.com",
    telefone: "(11) 99999-0000",
    etiqueta: "Lead",
    status: "Ativo",
    created_at: new Date().toISOString(),
  },
];

export async function getClientes(search?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("pessoa")
      .select("id, nome, email, telefone, created_at, data_criacao, tipo_pessoa")
      .order("id", { ascending: false })
      .limit(100);

    if (search && search.trim().length > 0) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error || !data?.length) {
      return mockClientes;
    }

    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: asString(row.id),
      nome: asString(row.nome, "Sem nome"),
      email: asString(row.email) || null,
      telefone: asString(row.telefone) || null,
      etiqueta: asString(row.tipo_pessoa) || "Lead",
      status: "Ativo",
      created_at: normalizeDate(row.created_at ?? row.data_criacao),
    })) satisfies Cliente[];
  } catch {
    return mockClientes;
  }
}

export type ClienteControleApiRow = {
  id: string;
  etiqueta: string;
  telefone: string | null;
  nome: string;
  equipamento: string | null;
  data30: string | null;
  data40: string | null;
  pessoaId?: number | null;
  agregacaoId?: number | null;
  usuarioId?: number | null;
};

export type ClienteControleApiFilters = {
  usuarioId?: string | number;
  telefone?: string;
  etiqueta?: string;
  nome?: string;
  limit?: number;
  offset?: number;
};

export type ClienteRepresentante = {
  id: number;
  nome: string;
};

export type ClienteEquipamento = {
  id: number;
  nome: string;
};

type ClienteControleWebhookPayload = {
  id_usuario: number;
  limit_para: string;
  off_para: string;
  telefone?: string;
  etiqueta?: string;
  nome?: string;
};

type ClienteControleWebhookRow = Record<string, unknown>;

const CLIENTES_CONTROLE_ENDPOINT =
  process.env.CLIENTES_CONTROLE_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/94f13e26-f2e6-48ef-84b9-db208ee41fe4";

function asNullableString(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

function asNullablePositiveInt(value: unknown) {
  const parsed = Math.max(0, Math.trunc(asNumber(value, 0)));
  return parsed > 0 ? parsed : null;
}

function normalizeLoose(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toEtiquetaCode(value: string, fallback = "") {
  const digits = value.replace(/\D/g, "").slice(0, 2);
  if (!digits) {
    return fallback;
  }

  return `#${digits.padStart(2, "0")}`;
}

function extractEtiquetaCode(value: string | null | undefined, fallback = "") {
  const raw = asString(value).trim();
  if (!raw) {
    return fallback;
  }

  const hashMatch = raw.match(/#\s*(\d{1,2})/);
  if (hashMatch) {
    return toEtiquetaCode(hashMatch[1], fallback);
  }

  const numericMatch = raw.match(/\b(\d{1,2})\b/);
  if (numericMatch) {
    return toEtiquetaCode(numericMatch[1], fallback);
  }

  const normalized = normalizeLoose(raw);
  if (normalized.includes("agenda")) {
    return "#00";
  }

  if (normalized.includes("painel")) {
    return "#21";
  }

  if (normalized.includes("pre contrato")) {
    return "#35";
  }

  if (normalized.includes("contrato social")) {
    return "#30";
  }

  if (normalized.includes("fechamento")) {
    return "#40";
  }

  if (normalized.includes("hidrossemeador")) {
    return "#50";
  }

  if (normalized.includes("ligar") || normalized.includes("lead")) {
    return "#10";
  }

  return fallback;
}

function formatClientesDateTime(value: string | null | undefined) {
  const raw = asString(value).trim();
  if (!raw) {
    return "";
  }

  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  const formatted = formatDateTime(raw);
  if (formatted.includes("Invalid")) {
    return "";
  }

  return formatted;
}

function buildEtiquetaDisplay(rawEtiqueta: string | null | undefined, rawDate: string | null | undefined) {
  const etiquetaCode = extractEtiquetaCode(rawEtiqueta, "#10");
  const etiquetaDate = formatClientesDateTime(rawDate);
  return etiquetaDate ? `${etiquetaCode} - ${etiquetaDate}` : etiquetaCode;
}

function mapPessoaTipoToEtiqueta(tipoPessoa: string | null | undefined) {
  return extractEtiquetaCode(tipoPessoa, "#10");
}

function firstNonEmptyString(row: ClienteControleWebhookRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]).trim();
    if (value.length > 0) {
      return value;
    }
  }
  return fallback;
}

function hasUsableClientesControleRows(rows: ClienteControleWebhookRow[]) {
  return rows.some((row) => {
    if (Object.keys(row).length === 0) {
      return false;
    }

    return firstNonEmptyString(row, ["nome", "nome_pessoa", "pessoa_nome", "cliente", "nome_cliente"]).length > 0;
  });
}

function mapClientesControleRows(rows: ClienteControleWebhookRow[]): ClienteControleApiRow[] {
  return rows
    .filter((row) => Object.keys(row).length > 0)
    .map((row, index) => {
      const rawEtiqueta = firstNonEmptyString(
        row,
        [
          "etiqueta_etiqueta",
          "etiqueta",
          "tag",
          "etiqueta_nome",
          "tipo_pessoa",
          "status",
          "status_etiqueta",
        ],
        "#10",
      );
      const rawData = firstNonEmptyString(
        row,
        ["data_etiqueta", "data_hora", "created_at", "data_criacao", "updated_at", "horario"],
      );
      const etiqueta = buildEtiquetaDisplay(rawEtiqueta, rawData);
      const data30Raw = firstNonEmptyString(row, ["data30", "data_30", "data_etiqueta_30"]);
      const data40Raw = firstNonEmptyString(row, ["data40", "data_40", "data_etiqueta_40"]);
      const data30Formatted = formatClientesDateTime(data30Raw);
      const data40Formatted = formatClientesDateTime(data40Raw);
      const agregacaoId = asNullablePositiveInt(
        firstNonEmptyString(row, ["id_agregacao", "agregacao_id", "agregacao_id_agregacao"]),
      );
      const pessoaId = asNullablePositiveInt(
        firstNonEmptyString(row, ["id_pessoa", "pessoa_id", "agregacao_id_pessoa", "lead_id"]),
      );
      const usuarioId = asNullablePositiveInt(
        firstNonEmptyString(row, ["id_usuario", "agregacao_id_usuario", "usuario_id"]),
      );

      return {
        id: firstNonEmptyString(
          row,
          ["id", "id_pessoa", "pessoa_id", "lead_id", "agregacao_id_pessoa", "agregacao_id_usuario"],
          String(index + 1),
        ),
        etiqueta,
        telefone: asNullableString(
          firstNonEmptyString(
            row,
            ["telefone", "telefone_pessoa", "pessoa_telefone", "fone", "whatsapp", "telefone_cliente"],
          ),
        ),
        nome: firstNonEmptyString(
          row,
          ["nome", "nome_pessoa", "pessoa_nome", "cliente", "nome_cliente"],
          "Sem nome",
        ),
        equipamento: asNullableString(firstNonEmptyString(row, ["equipamento", "produto", "descricao_equipamento"])),
        data30: data30Formatted || asNullableString(data30Raw),
        data40: data40Formatted || asNullableString(data40Raw),
        pessoaId,
        agregacaoId,
        usuarioId,
      } satisfies ClienteControleApiRow;
    });
}

async function fetchClientesControleWebhookRows(payload: ClienteControleWebhookPayload) {
  const response = await fetch(CLIENTES_CONTROLE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as ClienteControleWebhookRow[];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [] as ClienteControleWebhookRow[];
  }

  const json = JSON.parse(text) as unknown;

  if (Array.isArray(json)) {
    return json as ClienteControleWebhookRow[];
  }

  if (json && typeof json === "object") {
    return [json as ClienteControleWebhookRow];
  }

  return [] as ClienteControleWebhookRow[];
}

type AgendamentoClienteRow = {
  id?: number | string | null;
  pessoa?: number | string | null;
};

type AgregacaoClienteRow = {
  id?: number | string | null;
  id_usuario?: number | string | null;
  id_pessoa?: number | string | null;
  id_etiqueta?: number | string | null;
  created_at?: string | null;
  data_criacao?: string | null;
};

type EtiquetaClienteRow = {
  id?: number | string | null;
  etiqueta?: string | null;
  origem?: string | null;
  created_at?: string | null;
  data_criacao?: string | null;
  id_pessoa?: number | string | null;
};

type PessoaClienteRow = {
  id?: number | string | null;
  nome?: string | null;
  telefone?: string | null;
  tipo_pessoa?: string | null;
  created_at?: string | null;
  data_criacao?: string | null;
};

async function fetchPessoaRowsByIds(ids: number[]) {
  if (!ids.length) {
    return [] as PessoaClienteRow[];
  }

  const supabase = await createServerSupabaseClient();
  const chunkSize = 400;
  const rows: PessoaClienteRow[] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);

    const { data, error } = await supabase
      .from("pessoa")
      .select("id,nome,telefone,tipo_pessoa,created_at,data_criacao")
      .in("id", chunk);

    if (error || !data?.length) {
      continue;
    }

    rows.push(...(data as PessoaClienteRow[]));
  }

  return rows;
}

async function fetchEtiquetaRowsByIds(ids: number[]) {
  if (!ids.length) {
    return [] as EtiquetaClienteRow[];
  }

  const supabase = await createServerSupabaseClient();
  const chunkSize = 400;
  const rows: EtiquetaClienteRow[] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);

    const { data, error } = await supabase
      .from("etiqueta")
      .select("id,etiqueta,origem,created_at,data_criacao,id_pessoa")
      .in("id", chunk);

    if (error || !data?.length) {
      continue;
    }

    rows.push(...(data as EtiquetaClienteRow[]));
  }

  return rows;
}

async function getClientesControleRowsFromAgregacao(
  filters: ClienteControleApiFilters,
): Promise<ClienteControleApiRow[]> {
  const usuarioId = Math.max(0, Math.trunc(asNumber(filters.usuarioId, 0)));
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("agregacao")
    .select("id,id_usuario,id_pessoa,id_etiqueta,created_at,data_criacao")
    .order("id", { ascending: false })
    .limit(5000);

  if (usuarioId > 0) {
    query = query.eq("id_usuario", usuarioId);
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    return [];
  }

  const agregacaoRows = data as AgregacaoClienteRow[];
  const pessoaIds = Array.from(
    new Set(
      agregacaoRows
        .map((row) => Math.max(0, Math.trunc(asNumber(row.id_pessoa, 0))))
        .filter((id) => id > 0),
    ),
  );
  const etiquetaIds = Array.from(
    new Set(
      agregacaoRows
        .map((row) => Math.max(0, Math.trunc(asNumber(row.id_etiqueta, 0))))
        .filter((id) => id > 0),
    ),
  );

  const [pessoaRows, etiquetaRows] = await Promise.all([
    fetchPessoaRowsByIds(pessoaIds),
    fetchEtiquetaRowsByIds(etiquetaIds),
  ]);

  const pessoaById = new Map<number, PessoaClienteRow>();
  for (const pessoa of pessoaRows) {
    const pessoaId = Math.max(0, Math.trunc(asNumber(pessoa.id, 0)));
    if (pessoaId > 0) {
      pessoaById.set(pessoaId, pessoa);
    }
  }

  const etiquetaById = new Map<number, EtiquetaClienteRow>();
  for (const etiqueta of etiquetaRows) {
    const etiquetaId = Math.max(0, Math.trunc(asNumber(etiqueta.id, 0)));
    if (etiquetaId > 0) {
      etiquetaById.set(etiquetaId, etiqueta);
    }
  }

  const nomeFilter = normalizeLoose(asString(filters.nome));
  const telefoneFilter = normalizeLoose(asString(filters.telefone));
  const etiquetaFilterRaw = asString(filters.etiqueta);
  const etiquetaFilterNormalized = normalizeLoose(etiquetaFilterRaw);
  const etiquetaFilterCode = extractEtiquetaCode(etiquetaFilterRaw);
  const hasOffset = filters.offset !== undefined && filters.offset !== null;
  const hasLimit = filters.limit !== undefined && filters.limit !== null;
  const offset = hasOffset ? Math.max(0, Math.trunc(asNumber(filters.offset, 0))) : 0;
  const limit = hasLimit ? Math.max(1, Math.trunc(asNumber(filters.limit, 10))) : Number.MAX_SAFE_INTEGER;

  const rows: ClienteControleApiRow[] = [];

  for (const agregacao of agregacaoRows) {
    const pessoaId = Math.max(0, Math.trunc(asNumber(agregacao.id_pessoa, 0)));
    const pessoa = pessoaById.get(pessoaId);
    const etiquetaId = Math.max(0, Math.trunc(asNumber(agregacao.id_etiqueta, 0)));
    const etiquetaRow = etiquetaById.get(etiquetaId);

    const nome = asString(pessoa?.nome, "Sem nome");
    const telefone = asNullableString(pessoa?.telefone);
    const etiquetaCode = extractEtiquetaCode(asString(etiquetaRow?.etiqueta), "#10");
    const dataRaw = asString(
      etiquetaRow?.created_at ??
        etiquetaRow?.data_criacao ??
        agregacao.created_at ??
        agregacao.data_criacao,
    ).trim();
    const etiqueta = buildEtiquetaDisplay(etiquetaCode, dataRaw);

    if (nomeFilter && !normalizeLoose(nome).includes(nomeFilter)) {
      continue;
    }

    if (telefoneFilter && !normalizeLoose(telefone).includes(telefoneFilter)) {
      continue;
    }

    if (etiquetaFilterCode.length > 0) {
      if (etiquetaCode !== etiquetaFilterCode) {
        continue;
      }
    } else if (etiquetaFilterNormalized && !normalizeLoose(etiqueta).includes(etiquetaFilterNormalized)) {
      continue;
    }

    rows.push({
      id: asString(agregacao.id, String(rows.length + 1)),
      etiqueta,
      telefone,
      nome,
      equipamento: null,
      data30: null,
      data40: null,
      pessoaId,
      agregacaoId: asNullablePositiveInt(agregacao.id),
      usuarioId: asNullablePositiveInt(agregacao.id_usuario),
    });
  }

  const end = hasLimit ? offset + limit : undefined;
  return rows.slice(offset, end);
}

async function getClientesControleRowsFromAgendamentos(
  filters: ClienteControleApiFilters,
): Promise<ClienteControleApiRow[]> {
  const usuarioId = Math.max(0, Math.trunc(asNumber(filters.usuarioId, 0)));
  if (usuarioId <= 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .select("id,pessoa")
    .eq("id_usuario", usuarioId)
    .eq("agendamento_ativo", true)
    .not("pessoa", "is", null)
    .order("id", { ascending: false })
    .limit(5000);

  if (error || !data?.length) {
    return [];
  }

  const orderedPessoaIds: number[] = [];
  const seenPessoaIds = new Set<number>();

  for (const row of data as AgendamentoClienteRow[]) {
    const pessoaId = Math.max(0, Math.trunc(asNumber(row.pessoa, 0)));
    if (pessoaId > 0 && !seenPessoaIds.has(pessoaId)) {
      seenPessoaIds.add(pessoaId);
      orderedPessoaIds.push(pessoaId);
    }
  }

  if (!orderedPessoaIds.length) {
    return [];
  }

  const pessoaRows = await fetchPessoaRowsByIds(orderedPessoaIds);
  if (!pessoaRows.length) {
    return [];
  }

  const pessoaById = new Map<number, PessoaClienteRow>();
  for (const pessoa of pessoaRows) {
    const pessoaId = Math.max(0, Math.trunc(asNumber(pessoa.id, 0)));
    if (pessoaId > 0) {
      pessoaById.set(pessoaId, pessoa);
    }
  }

  const nomeFilter = normalizeLoose(asString(filters.nome));
  const telefoneFilter = normalizeLoose(asString(filters.telefone));
  const etiquetaFilterRaw = asString(filters.etiqueta);
  const etiquetaFilterNormalized = normalizeLoose(etiquetaFilterRaw);
  const etiquetaFilterCode = extractEtiquetaCode(etiquetaFilterRaw);
  const hasOffset = filters.offset !== undefined && filters.offset !== null;
  const hasLimit = filters.limit !== undefined && filters.limit !== null;
  const offset = hasOffset ? Math.max(0, Math.trunc(asNumber(filters.offset, 0))) : 0;
  const limit = hasLimit ? Math.max(1, Math.trunc(asNumber(filters.limit, 10))) : Number.MAX_SAFE_INTEGER;

  const rows: ClienteControleApiRow[] = [];

  for (const pessoaId of orderedPessoaIds) {
    const pessoa = pessoaById.get(pessoaId);
    if (!pessoa) {
      continue;
    }

    const nome = asString(pessoa.nome, "Sem nome");
    const telefone = asNullableString(pessoa.telefone);
    const etiquetaBase = mapPessoaTipoToEtiqueta(asString(pessoa.tipo_pessoa));
    const dataRaw = asString(pessoa.created_at ?? pessoa.data_criacao).trim();
    const etiqueta = buildEtiquetaDisplay(etiquetaBase, dataRaw);

    if (nomeFilter && !normalizeLoose(nome).includes(nomeFilter)) {
      continue;
    }

    if (telefoneFilter && !normalizeLoose(telefone).includes(telefoneFilter)) {
      continue;
    }

    if (etiquetaFilterCode.length > 0) {
      const etiquetaCode = extractEtiquetaCode(etiqueta);
      if (etiquetaCode !== etiquetaFilterCode) {
        continue;
      }
    } else if (etiquetaFilterNormalized) {
      const matchesByText = normalizeLoose(etiqueta).includes(etiquetaFilterNormalized);
      if (!matchesByText) {
        continue;
      }
    }

    rows.push({
      id: String(pessoaId),
      etiqueta,
      telefone,
      nome,
      equipamento: null,
      data30: null,
      data40: null,
      pessoaId,
      agregacaoId: null,
      usuarioId,
    });
  }

  const end = hasLimit ? offset + limit : undefined;
  return rows.slice(offset, end);
}

export async function getClientesControleRows(
  filters: ClienteControleApiFilters = {},
): Promise<ClienteControleApiRow[]> {
  const selectedUsuario = Math.max(0, Math.trunc(asNumber(filters.usuarioId, 0)));
  const telefone = asString(filters.telefone).trim();
  const etiqueta = asString(filters.etiqueta).trim();
  const nome = asString(filters.nome).trim();
  const hasLimit = filters.limit !== undefined && filters.limit !== null;
  const hasOffset = filters.offset !== undefined && filters.offset !== null;
  const limitPara = hasLimit ? String(Math.max(1, Math.trunc(asNumber(filters.limit, 10)))) : "";
  const offPara = hasOffset ? String(Math.max(0, Math.trunc(asNumber(filters.offset, 0)))) : "";

  const payload: ClienteControleWebhookPayload = {
    id_usuario: selectedUsuario,
    limit_para: limitPara,
    off_para: offPara,
  };
  if (telefone) {
    payload.telefone = telefone;
  }
  if (etiqueta) {
    payload.etiqueta = etiqueta;
  }
  if (nome) {
    payload.nome = nome;
  }

  const rows = await fetchClientesControleWebhookRows(payload);
  if (!hasUsableClientesControleRows(rows)) {
    const fallbackAgregacaoRows = await getClientesControleRowsFromAgregacao(filters);
    if (fallbackAgregacaoRows.length > 0) {
      return fallbackAgregacaoRows;
    }

    return getClientesControleRowsFromAgendamentos(filters);
  }

  const mappedRows = mapClientesControleRows(rows);
  const etiquetaCodeFilter = extractEtiquetaCode(etiqueta);
  if (etiquetaCodeFilter.length === 0) {
    return mappedRows;
  }

  return mappedRows.filter((row) => extractEtiquetaCode(row.etiqueta) === etiquetaCodeFilter);
}

type ClientesRepresentantesOptions = {
  verticalId?: string;
};

export async function getClientesRepresentantes(
  options: ClientesRepresentantesOptions = {},
): Promise<ClienteRepresentante[]> {
  try {
    const isEligibleTipoAcesso2 = (value: unknown) => {
      const normalized = normalizeLoose(asString(value));
      if (!normalized) {
        return false;
      }

      if (normalized === "time negocios" || normalized === "prime") {
        return true;
      }

      const tokens = normalized
        .split(/[,+/|;-]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      if (tokens.includes("time negocios") || tokens.includes("prime")) {
        return true;
      }

      return normalized.includes("time negocios") && normalized.includes("prime");
    };

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("usuarios")
      .select("id,nome,usuario_ativo,tipo_acesso_2,id_vertical")
      .eq("usuario_ativo", true)
      .not("nome", "is", null)
      .order("nome", { ascending: true })
      .limit(5000);

    const verticalId = asString(options.verticalId, "").trim();
    if (verticalId.length > 0) {
      query = query.eq("id_vertical", verticalId);
    }

    const { data, error } = await query;

    if (error || !data?.length) {
      return [];
    }

    const map = new Map<number, ClienteRepresentante>();
    for (const row of data as Array<Record<string, unknown>>) {
      const id = Math.max(0, Math.trunc(asNumber(row.id, 0)));
      const nome = asString(row.nome, "").trim();
      if (id <= 0 || nome.length === 0 || !isEligibleTipoAcesso2(row.tipo_acesso_2)) {
        continue;
      }
      map.set(id, { id, nome });
    }

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  } catch {
    return [];
  }
}

export async function getClientesEquipamentos(): Promise<ClienteEquipamento[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("equipamento")
      .select("id,nome_equipamento")
      .not("nome_equipamento", "is", null)
      .order("nome_equipamento", { ascending: true })
      .limit(5000);

    if (error || !data?.length) {
      return [];
    }

    return (data as Array<Record<string, unknown>>)
      .map((row) => ({
        id: asNumber(row.id, 0),
        nome: asString(row.nome_equipamento, "").trim(),
      }))
      .filter((row) => row.id > 0 && row.nome.length > 0);
  } catch {
    return [];
  }
}

export async function getCurrentUsuarioLegacyId(): Promise<number | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return null;
    }

    const id = asNumber((data[0] as Record<string, unknown>).id, 0);
    return id > 0 ? id : null;
  } catch {
    return null;
  }
}

const mockEmpresas: Empresa[] = [
  {
    id: "1",
    razao_social: "Empresa exemplo",
    cnpj: "00.000.000/0001-00",
    vertical: "Default",
    created_at: new Date().toISOString(),
  },
];

type EmpresaControleRpcPayload = {
  p_limit_text: string;
  p_offset_text: string;
  p_search_text: string;
  p_user_id_text: string | null;
};

type EmpresaControleRpcRow = {
  id?: string | number | null;
  nome?: string | null;
  created_at?: string | null;
  status?: boolean | string | null;
  id_usuario?: string | number | null;
  endereco?: string | null;
  id_consistem?: string | number | null;
  email?: string | null;
  fone?: string | null;
  whatsapp?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  link_ista?: string | null;
};

export type EmpresaControleApiRow = {
  id: string;
  nome: string;
  data: string;
  status: string;
  usuario: string;
  endereco: string;
  idUsuario?: number | null;
  representanteId?: number | null;
  codigoCliente?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  linkInstagram?: string | null;
};

export type EmpresaControleApiFilters = {
  searchText?: string;
  limit?: number;
  offset?: number;
  userIdText?: string | number | null;
};

const EMPRESAS_CONTROLE_RPC_ENDPOINT =
  process.env.EMPRESAS_CONTROLE_RPC_ENDPOINT ??
  "https://zosdxuntvhrzjutmvduu.supabase.co/rest/v1/rpc/flutterflow_listar_empresas2";

const EMPRESAS_CONTROLE_API_KEY =
  process.env.EMPRESAS_CONTROLE_API_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2R4dW50dmhyemp1dG12ZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTE3MDQsImV4cCI6MjA0MjQyNzcwNH0.Yz9v10j4W3jG4lkHjuYj_ca3dp66PGcLlVJllQVrYUY";

async function fetchUsuariosNomesByIds(ids: number[]) {
  if (!ids.length) {
    return new Map<number, string>();
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nome")
      .in("id", ids)
      .not("nome", "is", null)
      .limit(Math.max(ids.length, 1));

    if (error || !data?.length) {
      return new Map<number, string>();
    }

    const map = new Map<number, string>();
    for (const row of data as Array<Record<string, unknown>>) {
      const id = Math.max(0, Math.trunc(asNumber(row.id, 0)));
      const nome = asString(row.nome, "").trim();
      if (id > 0 && nome.length > 0) {
        map.set(id, nome);
      }
    }

    return map;
  } catch {
    return new Map<number, string>();
  }
}

function mapEmpresasControleRows(
  rows: EmpresaControleRpcRow[],
  usuariosNomesById: Map<number, string>,
) {
  return rows.map((row, index) => {
    const nome = asString(row.nome, "").trim();
    const endereco = asString(row.endereco, "").trim();
    const idUsuario = Math.max(0, Math.trunc(asNumber(row.id_usuario, 0)));
    const statusAtivo = asBoolean(row.status, true);
    const usuarioNome = idUsuario > 0 ? asString(usuariosNomesById.get(idUsuario), "").trim() : "";
    const usuarioDisplay = usuarioNome || (idUsuario > 0 ? String(idUsuario) : "usuario");

    return {
      id: asString(row.id, String(index + 1)),
      nome: nome || "[s.nome]",
      data: formatDateTime(normalizeDate(row.created_at)),
      status: statusAtivo ? "Ativo" : "Inativo",
      usuario: usuarioDisplay,
      endereco: endereco || "[s.endereco]",
      idUsuario: idUsuario > 0 ? idUsuario : null,
      representanteId: idUsuario > 0 ? idUsuario : null,
      codigoCliente: asNullableString(row.id_consistem),
      email: asNullableString(row.email),
      telefone: asNullableString(row.fone),
      whatsapp: asNullableString(row.whatsapp),
      cnpj: asNullableString(row.cnpj),
      cep: asNullableString(row.cep),
      linkInstagram: asNullableString(row.link_ista),
    } satisfies EmpresaControleApiRow;
  });
}

async function fetchEmpresasControleRpcRows(payload: EmpresaControleRpcPayload) {
  const response = await fetch(EMPRESAS_CONTROLE_RPC_ENDPOINT, {
    method: "POST",
    headers: {
      apikey: EMPRESAS_CONTROLE_API_KEY,
      Authorization: `Bearer ${EMPRESAS_CONTROLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as EmpresaControleRpcRow[];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [] as EmpresaControleRpcRow[];
  }

  const json = JSON.parse(text) as unknown;
  if (Array.isArray(json)) {
    return json as EmpresaControleRpcRow[];
  }

  if (json && typeof json === "object") {
    return [json as EmpresaControleRpcRow];
  }

  return [] as EmpresaControleRpcRow[];
}

export async function getEmpresasControleRows(filters: EmpresaControleApiFilters = {}) {
  const limit = Math.max(0, Math.trunc(filters.limit ?? 500));
  const offset = Math.max(0, Math.trunc(filters.offset ?? 0));
  const searchText = (filters.searchText ?? "").trim();
  const userIdTextRaw = asString(filters.userIdText, "").trim();

  const payload: EmpresaControleRpcPayload = {
    p_limit_text: String(limit),
    p_offset_text: String(offset),
    p_search_text: searchText,
    p_user_id_text: userIdTextRaw || null,
  };

  try {
    const rows = await fetchEmpresasControleRpcRows(payload);
    if (!rows.length) {
      return [] as EmpresaControleApiRow[];
    }

    const usuarioIds = Array.from(
      new Set(
        rows
          .map((row) => Math.max(0, Math.trunc(asNumber(row.id_usuario, 0))))
          .filter((id) => id > 0),
      ),
    );
    const usuariosNomesById = await fetchUsuariosNomesByIds(usuarioIds);

    return mapEmpresasControleRows(rows, usuariosNomesById);
  } catch {
    return [] as EmpresaControleApiRow[];
  }
}

export async function getEmpresas() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("empresa")
      .select("id, nome, cnpj, created_at, vendedor, cidade, status")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data?.length) {
      return mockEmpresas;
    }

    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: asString(row.id),
      razao_social: asString(row.nome, "Sem razao social"),
      cnpj: asString(row.cnpj) || null,
      vertical: asString(row.vendedor) || asString(row.cidade) || null,
      created_at: normalizeDate(row.created_at),
    })) satisfies Empresa[];
  } catch {
    return mockEmpresas;
  }
}

const mockPedidos: Pedido[] = [
  {
    id: "1",
    cliente: "Pedido exemplo",
    status: "Ativo",
    valor_total: 0,
    created_at: new Date().toISOString(),
  },
];

type PedidoControleRpcPayload = {
  limit: string;
  offset: string;
  user_id: string;
};

type PedidoControleRpcRow = {
  id?: string | number | null;
  pedido_uuid?: string | null;
  uuid?: string | null;
  nome?: string | null;
  nome_pessoa?: string | null;
  pessoa_nome?: string | null;
  cliente?: string | null;
  telefone?: string | null;
  fone?: string | null;
  whatsapp?: string | null;
  pessoa_telefone?: string | null;
  data?: string | null;
  data_criacao?: string | null;
  created_at?: string | null;
  criado_em?: string | null;
  inicio_reuniao?: string | null;
  status?: string | boolean | null;
  ativo?: string | boolean | null;
  agendamento_ativo?: string | boolean | null;
};

export type PedidoControleApiRow = {
  id: string;
  nome: string;
  telefone: string;
  data: string;
  status: string;
};

export type PedidoControleApiFilters = {
  limit?: number;
  offset?: number;
  userId?: number | null;
};

const PEDIDOS_CONTROLE_RPC_ENDPOINT =
  process.env.PEDIDOS_CONTROLE_RPC_ENDPOINT ??
  "https://zosdxuntvhrzjutmvduu.supabase.co/rest/v1/rpc/fluterflow_listar_pedidos2";

const PEDIDOS_CONTROLE_API_KEY =
  process.env.PEDIDOS_CONTROLE_API_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2R4dW50dmhyemp1dG12ZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTE3MDQsImV4cCI6MjA0MjQyNzcwNH0.Yz9v10j4W3jG4lkHjuYj_ca3dp66PGcLlVJllQVrYUY";

function formatPedidosControleDate(value: unknown) {
  const raw = asString(value).trim();
  if (!raw) {
    return "-";
  }

  if (/^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?$/.test(raw)) {
    return raw;
  }

  const parsed = parseDateInput(raw);
  if (!parsed) {
    return raw;
  }

  return formatDateTime(parsed.toISOString());
}

function mapPedidosControleStatus(row: PedidoControleRpcRow) {
  const explicitStatus = asString(row.status).trim();
  if (explicitStatus) {
    return explicitStatus;
  }

  if (typeof row.status === "boolean") {
    return row.status ? "Ativo" : "Inativo";
  }

  if (typeof row.ativo === "boolean") {
    return row.ativo ? "Ativo" : "Inativo";
  }

  if (typeof row.agendamento_ativo === "boolean") {
    return row.agendamento_ativo ? "Ativo" : "Inativo";
  }

  return "-";
}

function mapPedidosControleRows(rows: PedidoControleRpcRow[]): PedidoControleApiRow[] {
  return rows.map((row, index) => ({
    id: asString(row.id ?? row.pedido_uuid ?? row.uuid, String(index + 1)),
    nome: asString(row.nome ?? row.nome_pessoa ?? row.pessoa_nome ?? row.cliente, "").trim() || "-",
    telefone:
      asString(row.telefone ?? row.fone ?? row.whatsapp ?? row.pessoa_telefone, "").trim() || "-",
    data: formatPedidosControleDate(
      row.data ?? row.data_criacao ?? row.created_at ?? row.criado_em ?? row.inicio_reuniao,
    ),
    status: mapPedidosControleStatus(row),
  }));
}

async function fetchPedidosControleRpcRows(payload: PedidoControleRpcPayload) {
  const response = await fetch(PEDIDOS_CONTROLE_RPC_ENDPOINT, {
    method: "POST",
    headers: {
      apikey: PEDIDOS_CONTROLE_API_KEY,
      Authorization: `Bearer ${PEDIDOS_CONTROLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as PedidoControleRpcRow[];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [] as PedidoControleRpcRow[];
  }

  const json = JSON.parse(text) as unknown;
  if (Array.isArray(json)) {
    return json as PedidoControleRpcRow[];
  }

  if (json && typeof json === "object") {
    return [json as PedidoControleRpcRow];
  }

  return [] as PedidoControleRpcRow[];
}

export async function getPedidosControleRows(filters: PedidoControleApiFilters = {}) {
  const limit = Math.max(0, Math.trunc(filters.limit ?? 0));
  const offset = Math.max(0, Math.trunc(filters.offset ?? 0));
  const resolvedUserId =
    typeof filters.userId === "number" ? filters.userId : await getCurrentUsuarioLegacyId();
  const userId = Math.max(0, Math.trunc(asNumber(resolvedUserId, 0)));

  const payload: PedidoControleRpcPayload = {
    limit: String(limit),
    offset: String(offset),
    user_id: String(userId),
  };

  try {
    const rows = await fetchPedidosControleRpcRows(payload);
    if (!rows.length) {
      return [] as PedidoControleApiRow[];
    }

    return mapPedidosControleRows(rows);
  } catch {
    return [] as PedidoControleApiRow[];
  }
}

export async function getPedidos() {
  try {
    const rows = await getPedidosControleRows({ limit: 0, offset: 0 });
    if (!rows.length) {
      return mockPedidos;
    }

    return rows.map(
      (row) =>
        ({
          id: row.id,
          cliente: row.nome,
          status: row.status,
          valor_total: 0,
          created_at: normalizeDate(row.data),
        }) satisfies Pedido,
    );
  } catch {
    return mockPedidos;
  }
}

export async function getPedidosLegacyFallback() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, nome, status, metragem, criado_em, origem")
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error || !data?.length) {
      return mockPedidos;
    }

    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: asString(row.id),
      cliente: asString(row.nome) || null,
      status: asBoolean(row.status, true) ? "Ativo" : "Inativo",
      valor_total: asNumber(row.metragem, 0),
      created_at: normalizeDate(row.criado_em),
    })) satisfies Pedido[];
  } catch {
    return mockPedidos;
  }
}

type SolicitacoesPortalRpcPayload = {
  limit: string;
  offset: string;
  user_id: string;
  busca: string;
};

type SolicitacoesPortalRpcRow = {
  id?: string | number | null;
  pedido_uuid?: string | null;
  uuid?: string | null;
  data?: string | null;
  data_criacao?: string | null;
  created_at?: string | null;
  criado_em?: string | null;
  nome?: string | null;
  pessoa_nome?: string | null;
  nome_cliente?: string | null;
  cliente?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado?: string | null;
  uf_estado?: string | null;
  uf?: string | null;
  metragem?: string | number | null;
  sqm?: string | number | null;
};

export type SolicitacoesPortalApiRow = {
  id: string;
  data: string;
  nome: string;
  cep: string;
  cidade: string;
  estado: string;
  metragem: string;
};

export type SolicitacoesPortalApiFilters = {
  limit?: number;
  offset?: number;
  userId?: number | null;
  busca?: string;
};

export type SolicitacoesPortalPageSnapshot = {
  rows: SolicitacoesPortalApiRow[];
  hasNextPage: boolean;
};

const SOLICITACOES_PORTAL_RPC_ENDPOINT =
  process.env.SOLICITACOES_PORTAL_RPC_ENDPOINT ??
  "https://zosdxuntvhrzjutmvduu.supabase.co/rest/v1/rpc/flutterflow_listar_pedidos3";

const SOLICITACOES_PORTAL_API_KEY =
  process.env.SOLICITACOES_PORTAL_API_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2R4dW50dmhyemp1dG12ZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTE3MDQsImV4cCI6MjA0MjQyNzcwNH0.Yz9v10j4W3jG4lkHjuYj_ca3dp66PGcLlVJllQVrYUY";

function formatSolicitacoesDate(value: unknown) {
  const raw = asString(value).trim();
  if (!raw) {
    return "0";
  }

  if (/^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?$/.test(raw)) {
    return raw;
  }

  const parsed = parseDateInput(raw);
  if (!parsed) {
    return raw;
  }

  return formatDateTime(parsed.toISOString());
}

function formatSolicitacoesMetragem(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} m2`;
  }

  const raw = asString(value).trim();
  if (!raw) {
    return "[1] m2";
  }

  if (/[a-zA-Z]/.test(raw)) {
    return raw;
  }

  return `${raw} m2`;
}

function mapSolicitacoesPortalRows(rows: SolicitacoesPortalRpcRow[]): SolicitacoesPortalApiRow[] {
  return rows.map((row, index) => ({
    id: asString(row.id ?? row.pedido_uuid ?? row.uuid, String(index + 1)),
    data: formatSolicitacoesDate(row.data ?? row.data_criacao ?? row.created_at ?? row.criado_em),
    nome: asString(row.nome ?? row.pessoa_nome ?? row.nome_cliente ?? row.cliente, "").trim() || "nome",
    cep: asString(row.cep, "").trim() || "cep",
    cidade: asString(row.cidade, "").trim() || "cidade",
    estado: asString(row.estado ?? row.uf_estado ?? row.uf, "").trim() || "estado",
    metragem: formatSolicitacoesMetragem(row.metragem ?? row.sqm),
  }));
}

async function fetchSolicitacoesPortalRpcRows(payload: SolicitacoesPortalRpcPayload) {
  const response = await fetch(SOLICITACOES_PORTAL_RPC_ENDPOINT, {
    method: "POST",
    headers: {
      apikey: SOLICITACOES_PORTAL_API_KEY,
      Authorization: `Bearer ${SOLICITACOES_PORTAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as SolicitacoesPortalRpcRow[];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [] as SolicitacoesPortalRpcRow[];
  }

  const json = JSON.parse(text) as unknown;
  if (Array.isArray(json)) {
    return json as SolicitacoesPortalRpcRow[];
  }

  if (json && typeof json === "object") {
    return [json as SolicitacoesPortalRpcRow];
  }

  return [] as SolicitacoesPortalRpcRow[];
}

export async function getSolicitacoesPortalRows(filters: SolicitacoesPortalApiFilters = {}) {
  const limit = Math.max(0, Math.trunc(filters.limit ?? 10));
  const offset = Math.max(0, Math.trunc(filters.offset ?? 0));
  const resolvedUserId =
    typeof filters.userId === "number" ? filters.userId : await getCurrentUsuarioLegacyId();
  const userId = Math.max(0, Math.trunc(asNumber(resolvedUserId, 0)));
  const busca = asString(filters.busca, "").trim();

  const payload: SolicitacoesPortalRpcPayload = {
    limit: String(limit),
    offset: String(offset),
    user_id: String(userId),
    busca,
  };

  try {
    const rows = await fetchSolicitacoesPortalRpcRows(payload);
    if (!rows.length) {
      return [] as SolicitacoesPortalApiRow[];
    }

    return mapSolicitacoesPortalRows(rows);
  } catch {
    return [] as SolicitacoesPortalApiRow[];
  }
}

export async function getSolicitacoesPortalPageSnapshot(
  filters: SolicitacoesPortalApiFilters = {},
): Promise<SolicitacoesPortalPageSnapshot> {
  const limit = Math.max(1, Math.trunc(filters.limit ?? 10));
  const offset = Math.max(0, Math.trunc(filters.offset ?? 0));
  const resolvedUserId =
    typeof filters.userId === "number" ? filters.userId : await getCurrentUsuarioLegacyId();
  const userId = Math.max(0, Math.trunc(asNumber(resolvedUserId, 0)));
  const busca = asString(filters.busca, "").trim();

  const currentPayload: SolicitacoesPortalRpcPayload = {
    limit: String(limit),
    offset: String(offset),
    user_id: String(userId),
    busca,
  };

  const nextPageProbePayload: SolicitacoesPortalRpcPayload = {
    limit: "1",
    offset: String(offset + limit),
    user_id: String(userId),
    busca,
  };

  try {
    const [rows, probe] = await Promise.all([
      fetchSolicitacoesPortalRpcRows(currentPayload),
      fetchSolicitacoesPortalRpcRows(nextPageProbePayload),
    ]);

    return {
      rows: mapSolicitacoesPortalRows(rows).slice(0, limit),
      hasNextPage: probe.length > 0,
    };
  } catch {
    return {
      rows: [],
      hasNextPage: false,
    };
  }
}

const mockAgenda: AgendaEvent[] = [
  {
    id: "1",
    title: "Agenda exemplo",
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: "Pendente",
  },
];

export type AgendaControleApiRow = {
  id: string;
  inicioReuniao: string;
  inicioReuniaoIso: string;
  cliente: string;
  fone: string;
  representante: string;
};

const mockAgendaControleRows: AgendaControleApiRow[] = [
  {
    id: "1",
    inicioReuniao: "05-01-2026 09:30",
    inicioReuniaoIso: new Date("2026-01-05T09:30:00").toISOString(),
    cliente: "Mario Sergio",
    fone: "11975441418",
    representante: "Ana S.",
  },
  {
    id: "2",
    inicioReuniao: "05-01-2026 09:30",
    inicioReuniaoIso: new Date("2026-01-05T09:30:00").toISOString(),
    cliente: "Erica Nogarah",
    fone: "12982946875",
    representante: "Ana S.",
  },
  {
    id: "3",
    inicioReuniao: "05-01-2026 09:30",
    inicioReuniaoIso: new Date("2026-01-05T09:30:00").toISOString(),
    cliente: "Bruno Jordao",
    fone: "75999297026",
    representante: "Ana S.",
  },
];

type AgendaViewRow = {
  inicio_reuniao?: string | null;
  id_agendamento?: string | number | null;
  id_usuario?: string | number | null;
  nome_usuario?: string | null;
  id_vertical?: string | null;
  id_pessoa?: string | number | null;
  nome_pessoa?: string | null;
  telefone_pessoa?: string | null;
};

function formatAgendaDashDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function mapAgendaViewRow(row: AgendaViewRow, index: number): AgendaEvent {
  const startsAt = normalizeDate(row.inicio_reuniao);
  const oneHourLater = new Date(startsAt).getTime() + 60 * 60 * 1000;
  const titleParts = [asString(row.nome_pessoa), asString(row.nome_usuario)].filter(Boolean);
  const title = titleParts.length > 0 ? titleParts.join(" - ") : "Agendamento";

  return {
    id: asString(row.id_agendamento, String(index + 1)),
    title,
    starts_at: startsAt,
    ends_at: new Date(oneHourLater).toISOString(),
    status: "Ativo",
  };
}

function mapAgendaControleViewRow(row: AgendaViewRow, index: number): AgendaControleApiRow {
  const inicioIso = normalizeDate(row.inicio_reuniao);
  return {
    id: asString(row.id_agendamento, String(index + 1)),
    inicioReuniao: formatAgendaDashDate(inicioIso),
    inicioReuniaoIso: inicioIso,
    cliente: asString(row.nome_pessoa, "Sem cliente"),
    fone: asString(row.telefone_pessoa, "-"),
    representante: asString(row.nome_usuario, "-"),
  };
}

function pickAgendaTitle(row: Record<string, unknown>) {
  return (
    asString(row.title) ||
    asString(row.nome) ||
    asString(row.assunto) ||
    asString(row.evento) ||
    asString(row.descricao) ||
    "Evento"
  );
}

function pickAgendaStart(row: Record<string, unknown>) {
  return normalizeDate(
    row.starts_at ?? row.inicio ?? row.data_inicio ?? row.start_at ?? row.created_at,
  );
}

function pickAgendaEnd(row: Record<string, unknown>, startsAt: string) {
  const explicit = row.ends_at ?? row.fim ?? row.data_fim ?? row.end_at;
  if (explicit) {
    return normalizeDate(explicit);
  }

  const oneHourLater = new Date(startsAt).getTime() + 60 * 60 * 1000;
  return new Date(oneHourLater).toISOString();
}

export async function getAgendaEvents() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: detailedData, error: detailedError } = await supabase
      .from("vw_agendamentos_detalhados2")
      .select(
        "inicio_reuniao,id_agendamento,id_usuario,nome_usuario,id_vertical,id_pessoa,nome_pessoa,telefone_pessoa",
      )
      .order("inicio_reuniao", { ascending: false })
      .limit(1000);

    if (!detailedError && detailedData?.length) {
      return (detailedData as AgendaViewRow[]).map(mapAgendaViewRow);
    }

    const { data, error } = await supabase.from("agenda").select("*").limit(100);

    if (error || !data?.length) {
      return mockAgenda;
    }

    return (data as Array<Record<string, unknown>>).map((row, index) => {
      const startsAt = pickAgendaStart(row);
      return {
        id: asString(row.id, String(index + 1)),
        title: pickAgendaTitle(row),
        starts_at: startsAt,
        ends_at: pickAgendaEnd(row, startsAt),
        status: asString(row.status) || asString(row.situacao) || "Agendado",
      };
    }) satisfies AgendaEvent[];
  } catch {
    return mockAgenda;
  }
}

export async function getAgendaControleRows(): Promise<AgendaControleApiRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("vw_agendamentos_detalhados2")
      .select(
        "inicio_reuniao,id_agendamento,id_usuario,nome_usuario,id_vertical,id_pessoa,nome_pessoa,telefone_pessoa",
      )
      .order("inicio_reuniao", { ascending: false })
      .limit(5000);

    if (!error && data?.length) {
      return (data as AgendaViewRow[]).map(mapAgendaControleViewRow);
    }

    const events = await getAgendaEvents();
    if (events.length > 0) {
      return events.map((event) => {
        const [cliente, representante] = event.title.split(" - ");
        return {
          id: event.id,
          inicioReuniao: formatAgendaDashDate(event.starts_at),
          inicioReuniaoIso: normalizeDate(event.starts_at),
          cliente: asString(cliente, "Sem cliente"),
          fone: "-",
          representante: asString(representante, "-"),
        } satisfies AgendaControleApiRow;
      });
    }

    return mockAgendaControleRows;
  } catch {
    return mockAgendaControleRows;
  }
}

export type UsuarioLegacy = {
  id: string;
  nome: string;
  email: string;
  role: string;
  scope: "org" | "unit" | "self";
  unit: string;
  ativo: boolean;
};

const mockUsuarios: UsuarioLegacy[] = [
  {
    id: "1",
    nome: "Bruno Gestor",
    email: "bruno@verdetec.com.br",
    role: "Gestor",
    scope: "org",
    unit: "Operacoes",
    ativo: true,
  },
  {
    id: "2",
    nome: "Ana Representante",
    email: "ana@verdetec.com.br",
    role: "Representante",
    scope: "unit",
    unit: "Vertical Hidrossemeadura",
    ativo: true,
  },
];

function resolveScopeFromRole(role?: string | null): "org" | "unit" | "self" {
  const normalized = (role ?? "").toLowerCase();

  if (normalized.includes("superadm") || normalized.includes("admin")) {
    return "org";
  }

  if (normalized.includes("gestor") || normalized.includes("manager")) {
    return "unit";
  }

  return "self";
}

export async function getUsuariosLegacy() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(
        `
          id,
          nome,
          email,
          tipo_acesso,
          usuario_ativo,
          setores:setores!usuarios_id_setor_fkey(nome),
          verticais:verticais!usuarios_id_vertical_fkey(descricao)
        `,
      )
      .order("id", { ascending: false })
      .limit(200);

    if (error || !data?.length) {
      return mockUsuarios;
    }

    return (data as Array<Record<string, unknown>>).map((row) => {
      const setor = row.setores as { nome?: string | null } | null;
      const vertical = row.verticais as { descricao?: string | null } | null;
      const role = asString(row.tipo_acesso, "Usuario");

      return {
        id: asString(row.id),
        nome: asString(row.nome, "Sem nome"),
        email: asString(row.email, "-"),
        role,
        scope: resolveScopeFromRole(role),
        unit: vertical?.descricao ?? setor?.nome ?? "Sem setor",
        ativo: asBoolean(row.usuario_ativo, true),
      } satisfies UsuarioLegacy;
    });
  } catch {
    return mockUsuarios;
  }
}

export type UsuarioControleApiRow = {
  id: string;
  nome: string;
  telefone: string | null;
  tipoAcesso: string;
  tipoAcesso2: string | null;
  email: string | null;
  meet: string | null;
  l100: number | null;
  dispoLeads: boolean;
  ativo: boolean;
};

const mockUsuariosControle: UsuarioControleApiRow[] = [
  {
    id: "120",
    nome: "120-Felipe P.",
    telefone: "47992257826",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "felipe.po@verdetec.com",
    meet: "https://meet.google.com/uqc-vzjh-uea",
    l100: null,
    dispoLeads: true,
    ativo: true,
  },
  {
    id: "66",
    nome: "66-Edson T.",
    telefone: "4830368695",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "vendas16@verdetec.com",
    meet: "http://meet.google.com/uaq-vfqo-oyo",
    l100: null,
    dispoLeads: true,
    ativo: true,
  },
  {
    id: "63",
    nome: "63-Lazaro S.",
    telefone: "4830368696",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "vendas18@verdetec.com",
    meet: "http://meet.google.com/gig-ukpe-kmw",
    l100: null,
    dispoLeads: true,
    ativo: true,
  },
];

function normalizeTipoAcessoLabel(value: string | null | undefined) {
  const raw = asString(value).trim();
  if (!raw) {
    return "-";
  }

  const normalized = normalizeLoose(raw);
  if (normalized === "time negocios") {
    return "Time Negócios";
  }
  if (normalized === "prime") {
    return "Prime";
  }
  if (normalized === "crv") {
    return "CRV";
  }

  return raw;
}

export async function getUsuariosControleRows(): Promise<UsuarioControleApiRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nome,telefone,tipo_acesso,tipo_acesso_2,email,link_meet,usuario_ativo,dispo_leads")
      .order("id", { ascending: false })
      .limit(5000);

    if (error || !data?.length) {
      return mockUsuariosControle;
    }

    const usuarioRows = data as Array<Record<string, unknown>>;
    const usuarioIds = usuarioRows
      .map((row) => Math.trunc(asNumber(row.id, 0)))
      .filter((value) => Number.isInteger(value) && value > 0);

    const l100ByUsuarioId = new Map<number, number>();
    if (usuarioIds.length > 0) {
      const { data: l100Data } = await supabase
        .from("l100")
        .select("usuario_id,valor")
        .in("usuario_id", usuarioIds);

      for (const row of (l100Data as Array<Record<string, unknown>> | null) ?? []) {
        const usuarioId = Math.trunc(asNumber(row.usuario_id, 0));
        if (usuarioId <= 0) {
          continue;
        }
        l100ByUsuarioId.set(usuarioId, Math.trunc(asNumber(row.valor, 0)));
      }
    }

    return usuarioRows.map((row) => {
      const id = asString(row.id);
      const idAsNumber = Math.trunc(asNumber(row.id, 0));
      const nomeRaw = asString(row.nome, "Sem nome").trim();

      return {
        id,
        nome: id ? `${id}-${nomeRaw}` : nomeRaw,
        telefone: asNullableString(row.telefone),
        tipoAcesso: normalizeTipoAcessoLabel(
          asString(row.tipo_acesso_2).trim() || asString(row.tipo_acesso).trim(),
        ),
        tipoAcesso2: asNullableString(row.tipo_acesso_2),
        email: asNullableString(row.email),
        meet: asNullableString(row.link_meet),
        l100: idAsNumber > 0 ? l100ByUsuarioId.get(idAsNumber) ?? null : null,
        dispoLeads: asBoolean(row.dispo_leads, true),
        ativo: asBoolean(row.usuario_ativo, true),
      } satisfies UsuarioControleApiRow;
    });
  } catch {
    return mockUsuariosControle;
  }
}

export type DashboardFunilRow = {
  nome: string;
  lead: number;
  plusL100: number;
  l100: number;
  n00: number;
  n10: number;
  n21: number;
  n05: number;
  n30: number;
  n40: number;
  n50: number;
  n60: number;
  n61: number;
  n62: number;
  n66: number;
  tv: number;
  min: string;
  qtd: number;
  umbler: number;
};

export type DashboardFunilTotals = {
  lead: number;
  plusL100: string;
  l100: string;
  n00: number;
  n10: number;
  n21: number;
  n05: number;
  n30: number;
  n40: number;
  n50: number;
  n60: number;
  n61: number;
  n62: number;
  n66: number;
  tv: number;
  min: string;
  qtd: number;
  umbler: number;
};

export type DashboardFunilSnapshot = {
  rows: DashboardFunilRow[];
  totals: DashboardFunilTotals;
};

export type DashboardFunilFilters = {
  dataInicioInput?: string;
  dataFimInput?: string;
  tipoAcesso2?: string;
  usuarioId?: number;
  verticalId?: string;
  allowedUsuarioIds?: number[];
  allowedUsuarioNomes?: string[];
};

export type DashboardRepresentanteOption = {
  id: number;
  nome: string;
  verticalId: string;
};

export type DashboardViewerAccessScope = {
  viewerUsuarioId: number;
  viewerNome: string;
  viewerTipoAcesso2: string;
  viewerVerticalId: string;
  viewerVerticalDescricao: string;
  forcedTipoAcesso2: string;
  allowTipoSelection: boolean;
  allowUsuarioSelection: boolean;
  isGerencia: boolean;
  isGestor: boolean;
};

type DashboardWebhookPayload = {
  p_data_inicio: string;
  p_data_fim: string;
  vertical: string;
  p_tipo_acesso_2: string;
  p_id_usuario: number;
};

type DashboardWebhookRow = Record<string, unknown>;

const DASHBOARD_FUNIL_ENDPOINT =
  process.env.DASHBOARD_FUNIL_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/Rp592KI2Y4BSIlh9/b193da";

const DASHBOARD_VERTICAL_BY_TIPO: Record<string, string> = {
  Prime: "b9ba82ab-b666-4b6f-a084-32be9577830a",
  "Time Neg\u00f3cios": "31ab857a-bac4-415b-b9bd-7cf811e40601",
  CRV: "122019f0-5160-4774-8779-efaf484afdbc",
};

const mockDashboardFunilRows: DashboardFunilRow[] = [
  {
    nome: "Ana S.",
    lead: 17,
    plusL100: 98,
    l100: 98,
    n00: 17,
    n10: 11,
    n21: 0,
    n05: 3,
    n30: 2,
    n40: 0,
    n50: 0,
    n60: 10,
    n61: 0,
    n62: 9,
    n66: 0,
    tv: 0,
    min: "00:09:34",
    qtd: 56,
    umbler: 2298,
  },
  {
    nome: "Edson T.",
    lead: 17,
    plusL100: 45,
    l100: 45,
    n00: 17,
    n10: 13,
    n21: 0,
    n05: 2,
    n30: 2,
    n40: 0,
    n50: 0,
    n60: 3,
    n61: 2,
    n62: 5,
    n66: 0,
    tv: 0,
    min: "00:12:34",
    qtd: 49,
    umbler: 2382,
  },
  {
    nome: "Evanderson U.",
    lead: 16,
    plusL100: 42,
    l100: 42,
    n00: 16,
    n10: 7,
    n21: 0,
    n05: 0,
    n30: 1,
    n40: 0,
    n50: 0,
    n60: 13,
    n61: 4,
    n62: 10,
    n66: 0,
    tv: 0,
    min: "00:23:33",
    qtd: 80,
    umbler: 432,
  },
  {
    nome: "Felipe P.",
    lead: 17,
    plusL100: 88,
    l100: -12,
    n00: 17,
    n10: 11,
    n21: 0,
    n05: 1,
    n30: 1,
    n40: 0,
    n50: 0,
    n60: 12,
    n61: 2,
    n62: 1,
    n66: 0,
    tv: 0,
    min: "00:15:48",
    qtd: 80,
    umbler: 472,
  },
  {
    nome: "Jaqueline O.",
    lead: 16,
    plusL100: 70,
    l100: 70,
    n00: 15,
    n10: 5,
    n21: 1,
    n05: 0,
    n30: 0,
    n40: 0,
    n50: 0,
    n60: 30,
    n61: 0,
    n62: 6,
    n66: 0,
    tv: 0,
    min: "00:03:58",
    qtd: 37,
    umbler: 1540,
  },
  {
    nome: "Lauriane A.",
    lead: 16,
    plusL100: 20,
    l100: 20,
    n00: 16,
    n10: 6,
    n21: 0,
    n05: 1,
    n30: 3,
    n40: 1,
    n50: 0,
    n60: 3,
    n61: 1,
    n62: 19,
    n66: 0,
    tv: 0,
    min: "00:02:22",
    qtd: 53,
    umbler: 1431,
  },
  {
    nome: "Lazaro S.",
    lead: 16,
    plusL100: 13,
    l100: 13,
    n00: 16,
    n10: 11,
    n21: 0,
    n05: 3,
    n30: 2,
    n40: 0,
    n50: 0,
    n60: 6,
    n61: 3,
    n62: 0,
    n66: 0,
    tv: 0,
    min: "00:13:46",
    qtd: 39,
    umbler: 1027,
  },
];

const mockDashboardFunilTotals: DashboardFunilTotals = {
  lead: 117,
  plusL100: "-",
  l100: "-",
  n00: 116,
  n10: 64,
  n21: 0,
  n05: 3,
  n30: 11,
  n40: 1,
  n50: 0,
  n60: 77,
  n61: 12,
  n62: 50,
  n66: 9,
  tv: 0,
  min: "01:21:35",
  qtd: 394,
  umbler: 9582,
};

const emptyDashboardFunilTotals: DashboardFunilTotals = {
  lead: 0,
  plusL100: "-",
  l100: "-",
  n00: 0,
  n10: 0,
  n21: 0,
  n05: 0,
  n30: 0,
  n40: 0,
  n50: 0,
  n60: 0,
  n61: 0,
  n62: 0,
  n66: 0,
  tv: 0,
  min: "00:00:00",
  qtd: 0,
  umbler: 0,
};

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultDateRangeInput() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  return {
    dataInicio: startDate.toISOString().slice(0, 10),
    dataFim: endDate.toISOString().slice(0, 10),
  };
}

function normalizeInputDate(value?: string, fallbackInputDate = todayInputDate()) {
  if (!value) {
    return fallbackInputDate;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackInputDate;
  }

  return parsed.toISOString().slice(0, 10);
}

function toWebhookDate(inputDate: string) {
  if (/^\d{2}-\d{2}-\d{4}$/.test(inputDate)) {
    return inputDate;
  }

  const normalized = normalizeInputDate(inputDate);
  const [yyyy, mm, dd] = normalized.split("-");
  return `${dd}-${mm}-${yyyy}`;
}

function normalizeTipoAcesso2(value?: string) {
  const raw = asString(value).trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (normalized === "time de negocios" || normalized === "time negocios") {
    return "Time Neg\u00f3cios";
  }

  if (normalized === "prime") {
    return "Prime";
  }

  if (normalized === "crv") {
    return "CRV";
  }

  return raw;
}

function getTipoCandidates(tipoAcesso2: string) {
  if (tipoAcesso2 === "Time Neg\u00f3cios") {
    return ["Time Neg\u00f3cios", "Time de Neg\u00f3cios", "Time de Negocios", "Time Negocios"];
  }

  return [tipoAcesso2];
}

function normalizeVerticalDescricao(value: unknown) {
  const normalized = normalizeLoose(asString(value));
  if (!normalized) {
    return "";
  }

  if (normalized.includes("gerencia")) {
    return "Gerencia";
  }

  if (normalized.includes("time de negocios") || normalized.includes("time negocios")) {
    return "Time de Neg\u00f3cios";
  }

  if (normalized.includes("prime")) {
    return "Prime";
  }

  return asString(value).trim();
}

function isGestorTipoAcesso2(value: string) {
  return normalizeLoose(value).includes("gestor");
}

function normalizeDashboardViewerTipo(value: string, verticalDescricao: string) {
  const normalizedTipo = normalizeTipoAcesso2(value);
  if (normalizedTipo) {
    return normalizedTipo;
  }

  if (verticalDescricao === "Time de Neg\u00f3cios") {
    return "Time Neg\u00f3cios";
  }

  if (verticalDescricao === "Prime") {
    return "Prime";
  }

  return "";
}

function resolveVerticalForPayload(selectedVertical: string, selectedTipo: string, contextVertical: string) {
  if (selectedVertical) {
    return selectedVertical;
  }

  if (selectedTipo) {
    return DASHBOARD_VERTICAL_BY_TIPO[selectedTipo] ?? contextVertical;
  }

  return "";
}

function hasUsableDashboardRows(rows: DashboardWebhookRow[]) {
  return rows.some((row) => Object.keys(row).length > 0 && asString(row.nome_usuario).length > 0);
}

function fallbackTipoByVertical(vertical: string) {
  if (vertical === "b9ba82ab-b666-4b6f-a084-32be9577830a") {
    return "Prime";
  }

  if (vertical === "31ab857a-bac4-415b-b9bd-7cf811e40601") {
    return "Time Neg\u00f3cios";
  }

  if (vertical === "122019f0-5160-4774-8779-efaf484afdbc") {
    return "CRV";
  }

  return "";
}

type DashboardRepresentantesQueryOptions = {
  verticalId?: string;
  includeAllEligibleWhenTipoEmpty?: boolean;
};

export async function getDashboardRepresentantesByTipo(
  tipoAcesso2?: string,
  options: DashboardRepresentantesQueryOptions = {},
): Promise<DashboardRepresentanteOption[]> {
  const normalizedTipo = normalizeTipoAcesso2(tipoAcesso2);
  const verticalId = asString(options.verticalId, "").trim();
  const includeAllEligibleWhenTipoEmpty = Boolean(options.includeAllEligibleWhenTipoEmpty);

  const selectedTipoCandidates =
    normalizedTipo.length > 0
      ? getTipoCandidates(normalizedTipo)
      : includeAllEligibleWhenTipoEmpty
        ? [...getTipoCandidates("Time Neg\u00f3cios"), "Prime"]
        : [];

  const allowedTipos = Array.from(new Set(selectedTipoCandidates));
  if (!allowedTipos.length) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("usuarios")
      .select("id,nome,id_vertical,tipo_acesso_2")
      .eq("usuario_ativo", true)
      .limit(300);

    if (allowedTipos.length === 1) {
      query = query.eq("tipo_acesso_2", allowedTipos[0]);
    } else {
      query = query.in("tipo_acesso_2", allowedTipos);
    }

    if (verticalId.length > 0) {
      query = query.eq("id_vertical", verticalId);
    }

    const { data, error } = await query;
    if (error || !data?.length) {
      return [];
    }

    const uniqueById = new Map<number, DashboardRepresentanteOption>();
    for (const rawRow of data as Array<Record<string, unknown>>) {
      const id = asNumber(rawRow.id, 0);
      const nome = asString(rawRow.nome).trim();
      if (id <= 0 || !nome) {
        continue;
      }

      if (!uniqueById.has(id)) {
        uniqueById.set(id, {
          id,
          nome,
          verticalId: asString(rawRow.id_vertical, ""),
        });
      }
    }

    return Array.from(uniqueById.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  } catch {
    return [];
  }
}

export async function getDashboardViewerAccessScope(): Promise<DashboardViewerAccessScope> {
  const fallback: DashboardViewerAccessScope = {
    viewerUsuarioId: 0,
    viewerNome: "",
    viewerTipoAcesso2: "",
    viewerVerticalId: "",
    viewerVerticalDescricao: "",
    forcedTipoAcesso2: "",
    allowTipoSelection: true,
    allowUsuarioSelection: true,
    isGerencia: true,
    isGestor: false,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fallback;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select(
        `
          id,
          nome,
          tipo_acesso_2,
          id_vertical,
          verticais:verticais!usuarios_id_vertical_fkey(descricao)
        `,
      )
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return fallback;
    }

    const row = data[0] as Record<string, unknown>;
    const verticalRelation =
      (row.verticais as { descricao?: string | null } | Array<{ descricao?: string | null }> | null) ?? null;
    const verticalDescricaoRaw = Array.isArray(verticalRelation)
      ? verticalRelation[0]?.descricao
      : verticalRelation?.descricao;
    const viewerVerticalDescricao = normalizeVerticalDescricao(verticalDescricaoRaw);
    const viewerTipoAcesso2 = normalizeDashboardViewerTipo(
      asString(row.tipo_acesso_2, ""),
      viewerVerticalDescricao,
    );
    const isGerencia = viewerVerticalDescricao === "Gerencia";
    const isGestor = isGestorTipoAcesso2(asString(row.tipo_acesso_2, ""));

    let forcedTipoAcesso2 = "";
    if (!isGerencia) {
      if (viewerVerticalDescricao === "Time de Neg\u00f3cios") {
        forcedTipoAcesso2 = "Time Neg\u00f3cios";
      } else if (viewerVerticalDescricao === "Prime") {
        forcedTipoAcesso2 = "Prime";
      } else {
        forcedTipoAcesso2 = viewerTipoAcesso2;
      }
    }

    const allowTipoSelection = isGerencia;
    const allowUsuarioSelection = isGerencia || isGestor;

    return {
      viewerUsuarioId: asNumber(row.id, 0),
      viewerNome: asString(row.nome, "").trim(),
      viewerTipoAcesso2,
      viewerVerticalId: asString(row.id_vertical, "").trim(),
      viewerVerticalDescricao,
      forcedTipoAcesso2,
      allowTipoSelection,
      allowUsuarioSelection,
      isGerencia,
      isGestor,
    };
  } catch {
    return fallback;
  }
}

function buildDashboardRows(rows: DashboardWebhookRow[]): DashboardFunilRow[] {
  return rows
    .filter((row) => asString(row.nome_usuario).length > 0)
    .map((row) => ({
      nome: asString(row.nome_usuario, "Sem nome"),
      lead: asNumber(row.total_leads_qualificados, 0),
      plusL100: asNumber(row.valor, 0),
      l100: asNumber(row.valor_exebicao, 0),
      n00: asNumber(row.etiqueta_00, 0),
      n10: asNumber(row.etiqueta_10, 0),
      n21: asNumber(row.etiqueta_21, 0),
      n05: asNumber(row.etiqueta_05, 0),
      n30: asNumber(row.etiqueta_30, 0),
      n40: asNumber(row.etiqueta_40, 0),
      n50: asNumber(row.etiqueta_50, 0),
      n60: asNumber(row.etiqueta_60, 0),
      n61: asNumber(row.etiqueta_61, 0),
      n62: asNumber(row.etiqueta_62, 0),
      n66: asNumber(row.etiqueta_66, 0),
      tv: asNumber(row.media_dias_entre_entrada_e_conversao_individual, 0),
      min: asString(row.des_dur_falada, "00:00:00"),
      qtd: asNumber(row.quantidade_linhas, 0),
      umbler: asNumber(row.mensagem_umbler, 0),
    }));
}

function sumBy(rows: DashboardFunilRow[], key: keyof DashboardFunilRow) {
  return rows.reduce((acc, row) => acc + asNumber(row[key], 0), 0);
}

function parseDashboardDurationToSeconds(value: string) {
  const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    return 0;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseInt(match[3], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function formatDashboardDuration(secondsTotal: number) {
  const safeSeconds = Math.max(0, Math.trunc(secondsTotal));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildDashboardTotals(
  rows: DashboardFunilRow[],
  payloadRows: DashboardWebhookRow[],
  options?: { usePayloadSourceTotals?: boolean },
) {
  const usePayloadSourceTotals = options?.usePayloadSourceTotals ?? true;
  const source = payloadRows.find((row) => Object.keys(row).length > 0) ?? {};
  const summedMinSeconds = rows.reduce((acc, row) => acc + parseDashboardDurationToSeconds(row.min), 0);
  const avgTv = rows.length > 0 ? rows.reduce((acc, row) => acc + asNumber(row.tv, 0), 0) / rows.length : 0;
  const summedLead = sumBy(rows, "lead");
  const summedN00 = sumBy(rows, "n00");
  const summedN10 = sumBy(rows, "n10");
  const summedN21 = sumBy(rows, "n21");
  const summedN05 = sumBy(rows, "n05");
  const summedN30 = sumBy(rows, "n30");
  const summedN40 = sumBy(rows, "n40");
  const summedN50 = sumBy(rows, "n50");
  const summedN60 = sumBy(rows, "n60");
  const summedN61 = sumBy(rows, "n61");
  const summedN62 = sumBy(rows, "n62");
  const summedN66 = sumBy(rows, "n66");
  const summedQtd = sumBy(rows, "qtd");
  const summedUmbler = sumBy(rows, "umbler");

  return {
    lead: usePayloadSourceTotals ? asNumber(source.total_leads_qualificados_geral, summedLead) : summedLead,
    plusL100: "-",
    l100: "-",
    n00: usePayloadSourceTotals ? asNumber(source.total_etiqueta_00, summedN00) : summedN00,
    n10: usePayloadSourceTotals ? asNumber(source.total_etiqueta_10, summedN10) : summedN10,
    n21: usePayloadSourceTotals ? asNumber(source.total_etiqueta_21, summedN21) : summedN21,
    n05: usePayloadSourceTotals ? asNumber(source.total_etiqueta_05, summedN05) : summedN05,
    n30: usePayloadSourceTotals ? asNumber(source.total_etiqueta_30, summedN30) : summedN30,
    n40: usePayloadSourceTotals ? asNumber(source.total_etiqueta_40, summedN40) : summedN40,
    n50: usePayloadSourceTotals ? asNumber(source.total_etiqueta_50, summedN50) : summedN50,
    n60: usePayloadSourceTotals ? asNumber(source.total_etiqueta_60, summedN60) : summedN60,
    n61: usePayloadSourceTotals ? asNumber(source.total_etiqueta_61, summedN61) : summedN61,
    n62: usePayloadSourceTotals ? asNumber(source.total_etiqueta_62, summedN62) : summedN62,
    n66: usePayloadSourceTotals ? asNumber(source.total_etiqueta_66, summedN66) : summedN66,
    tv: usePayloadSourceTotals ? asNumber(source.media_dias_entre_entrada_e_conversao, avgTv) : avgTv,
    min: usePayloadSourceTotals
      ? asString(source.total_des_dur_falada, formatDashboardDuration(summedMinSeconds))
      : formatDashboardDuration(summedMinSeconds),
    qtd: usePayloadSourceTotals ? asNumber(source.total_quantidade_linhas, summedQtd) : summedQtd,
    umbler: usePayloadSourceTotals ? asNumber(source.total_mensagens_gerais, summedUmbler) : summedUmbler,
  } satisfies DashboardFunilTotals;
}

function normalizeDashboardComparableName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rowBelongsToAllowedDashboardUsers(
  row: DashboardWebhookRow,
  allowedIds: Set<number>,
  allowedNames: Set<string>,
) {
  const nomeUsuario = asString(row.nome_usuario).trim();
  if (!nomeUsuario) {
    return false;
  }

  const rowId = asNumber(
    row.id_usuario ??
      row.usuario_id ??
      row.id_user ??
      row.idUsuario ??
      row.id,
    0,
  );

  if (allowedIds.size > 0 && rowId > 0) {
    return allowedIds.has(rowId);
  }

  if (allowedNames.size > 0) {
    return allowedNames.has(normalizeDashboardComparableName(nomeUsuario));
  }

  if (allowedIds.size > 0) {
    return false;
  }

  return true;
}

async function fetchDashboardWebhookRows(payload: DashboardWebhookPayload) {
  const response = await fetch(DASHBOARD_FUNIL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as DashboardWebhookRow[];
  }

  const json = await response.json().catch(() => []);

  if (Array.isArray(json)) {
    return json as DashboardWebhookRow[];
  }

  if (json && typeof json === "object") {
    return [json as DashboardWebhookRow];
  }

  return [] as DashboardWebhookRow[];
}

async function getCurrentDashboardContext() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        usuarioId: 0,
        tipoAcesso2: "",
        vertical: "",
      };
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id,tipo_acesso_2,id_vertical")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return {
        usuarioId: 0,
        tipoAcesso2: "",
        vertical: "",
      };
    }

    const row = data[0] as Record<string, unknown>;
    return {
      usuarioId: asNumber(row.id, 0),
      tipoAcesso2: asString(row.tipo_acesso_2, ""),
      vertical: asString(row.id_vertical, ""),
    };
  } catch {
    return {
      usuarioId: 0,
      tipoAcesso2: "",
      vertical: "",
    };
  }
}

type DashboardPayloadAttemptOptions = {
  strictTipo: boolean;
  strictUsuario: boolean;
};

function buildPayloadAttempts(
  basePayload: DashboardWebhookPayload,
  options: DashboardPayloadAttemptOptions,
) {
  const attempts: DashboardWebhookPayload[] = [basePayload];

  if (!options.strictUsuario && basePayload.p_id_usuario !== 0) {
    attempts.push({ ...basePayload, p_id_usuario: 0 });
  }

  if (!options.strictTipo) {
    const mappedTipo = fallbackTipoByVertical(basePayload.vertical);
    if (mappedTipo && mappedTipo !== basePayload.p_tipo_acesso_2) {
      attempts.push({
        ...basePayload,
        p_id_usuario: 0,
        p_tipo_acesso_2: mappedTipo,
      });
    }

    if (basePayload.p_tipo_acesso_2 !== "") {
      attempts.push({
        ...basePayload,
        p_id_usuario: 0,
        p_tipo_acesso_2: "",
      });
    }
  } else {
    for (const candidateTipo of getTipoCandidates(basePayload.p_tipo_acesso_2)) {
      if (candidateTipo === basePayload.p_tipo_acesso_2) {
        continue;
      }

      attempts.push({
        ...basePayload,
        p_id_usuario: options.strictUsuario ? basePayload.p_id_usuario : 0,
        p_tipo_acesso_2: candidateTipo,
      });
    }
  }

  const uniqueAttempts = new Map<string, DashboardWebhookPayload>();
  for (const attempt of attempts) {
    const key = [
      attempt.p_data_inicio,
      attempt.p_data_fim,
      attempt.vertical,
      attempt.p_tipo_acesso_2,
      String(attempt.p_id_usuario),
    ].join("|");
    if (!uniqueAttempts.has(key)) {
      uniqueAttempts.set(key, attempt);
    }
  }

  return Array.from(uniqueAttempts.values());
}

export async function getDashboardFunilSnapshot(
  filters: DashboardFunilFilters = {},
): Promise<DashboardFunilSnapshot> {
  const defaultDateRange = getDefaultDateRangeInput();
  const dataInicioInput = normalizeInputDate(filters.dataInicioInput, defaultDateRange.dataInicio);
  const dataFimInput = normalizeInputDate(filters.dataFimInput, defaultDateRange.dataFim);
  const context = await getCurrentDashboardContext();
  const selectedTipo = normalizeTipoAcesso2(filters.tipoAcesso2);
  const selectedUsuario = Math.max(0, Math.trunc(asNumber(filters.usuarioId, 0)));
  const selectedVertical = asString(filters.verticalId, "").trim();
  const allowedIds = new Set<number>(
    (filters.allowedUsuarioIds ?? [])
      .map((id) => Math.max(0, Math.trunc(asNumber(id, 0))))
      .filter((id) => id > 0),
  );
  const allowedNames = new Set<string>(
    (filters.allowedUsuarioNomes ?? [])
      .map((nome) => normalizeDashboardComparableName(asString(nome)))
      .filter((nome) => nome.length > 0),
  );
  const hasEligibilityFilter = allowedIds.size > 0 || allowedNames.size > 0;
  const hasExplicitVerticalFilter = typeof filters.verticalId !== "undefined";
  const strictTipo = selectedTipo.length > 0;
  const strictUsuario = selectedUsuario > 0;

  const basePayload: DashboardWebhookPayload = {
    p_data_inicio: toWebhookDate(dataInicioInput),
    p_data_fim: toWebhookDate(dataFimInput),
    vertical: hasExplicitVerticalFilter
      ? selectedVertical
      : resolveVerticalForPayload(selectedVertical, selectedTipo, context.vertical),
    p_tipo_acesso_2: selectedTipo,
    p_id_usuario: selectedUsuario,
  };

  let payloadRows: DashboardWebhookRow[] = [];

  for (const payload of buildPayloadAttempts(basePayload, { strictTipo, strictUsuario })) {
    payloadRows = await fetchDashboardWebhookRows(payload);
    if (hasEligibilityFilter) {
      payloadRows = payloadRows.filter((row) => rowBelongsToAllowedDashboardUsers(row, allowedIds, allowedNames));
    }
    if (hasUsableDashboardRows(payloadRows)) {
      break;
    }
  }

  if (!hasUsableDashboardRows(payloadRows)) {
    if (strictTipo || strictUsuario) {
      return {
        rows: [],
        totals: emptyDashboardFunilTotals,
      };
    }

    return {
      rows: mockDashboardFunilRows,
      totals: mockDashboardFunilTotals,
    };
  }

  const rows = buildDashboardRows(payloadRows);

  if (!rows.length) {
    if (strictTipo || strictUsuario) {
      return {
        rows: [],
        totals: emptyDashboardFunilTotals,
      };
    }

    return {
      rows: mockDashboardFunilRows,
      totals: mockDashboardFunilTotals,
    };
  }

  return {
    rows,
    totals: buildDashboardTotals(rows, payloadRows, {
      usePayloadSourceTotals: !hasEligibilityFilter,
    }),
  };
}

export type DashboardRetratoRow = {
  nome: string;
  lead: number;
  n00: number;
  n10: number;
  n21: number;
  n30: number;
  n35: number;
  n40: number;
  n50: number;
};

export type DashboardRetratoTotals = {
  lead: number;
  n00: number;
  n10: number;
  n21: number;
  n30: number;
  n35: number;
  n40: number;
  n50: number;
};

export type DashboardRetratoSnapshot = {
  rows: DashboardRetratoRow[];
  totals: DashboardRetratoTotals;
};

export type DashboardRetratoFilters = {
  tipoAcesso2?: string;
  usuarioId?: number;
  verticalId?: string;
};

type DashboardRetratoWebhookPayload = {
  tipo2: string;
  id: number;
};

type DashboardRetratoWebhookRow = Record<string, unknown>;

const DASHBOARD_RETRATO_ENDPOINT =
  process.env.DASHBOARD_RETRATO_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/rRJvKkzgpu4DivLx/2fcf37";

const mockDashboardRetratoRows: DashboardRetratoRow[] = [
  { nome: "TI.VERTEC", lead: 94, n00: 92, n10: 2, n21: 94, n30: 0, n35: 0, n40: 0, n50: 0 },
  { nome: "Jaqueline O.", lead: 149, n00: 6, n10: 42, n21: 149, n30: 3, n35: 2, n40: 8, n50: 54 },
  { nome: "Lazaro S.", lead: 190, n00: 25, n10: 113, n21: 190, n30: 31, n35: 0, n40: 0, n50: 20 },
  { nome: "Edson T.", lead: 166, n00: 22, n10: 60, n21: 166, n30: 29, n35: 0, n40: 1, n50: 35 },
  { nome: "Ana S.", lead: 147, n00: 8, n10: 80, n21: 147, n30: 32, n35: 1, n40: 8, n50: 13 },
  { nome: "Lauriane A.", lead: 138, n00: 22, n10: 35, n21: 138, n30: 45, n35: 0, n40: 16, n50: 11 },
  { nome: "Gustavo M.", lead: 26, n00: 3, n10: 2, n21: 26, n30: 0, n35: 0, n40: 0, n50: 7 },
  { nome: "Evanderson U.", lead: 111, n00: 7, n10: 70, n21: 111, n30: 20, n35: 0, n40: 3, n50: 7 },
  { nome: "Dirceu D.", lead: 150, n00: 105, n10: 23, n21: 150, n30: 18, n35: 1, n40: 1, n50: 2 },
  { nome: "Felipe P.", lead: 33, n00: 2, n10: 20, n21: 33, n30: 9, n35: 0, n40: 1, n50: 1 },
];

const mockDashboardRetratoTotals: DashboardRetratoTotals = {
  lead: 1204,
  n00: 292,
  n10: 447,
  n21: 86,
  n30: 187,
  n35: 4,
  n40: 38,
  n50: 150,
};

const emptyDashboardRetratoTotals: DashboardRetratoTotals = {
  lead: 0,
  n00: 0,
  n10: 0,
  n21: 0,
  n30: 0,
  n35: 0,
  n40: 0,
  n50: 0,
};

function hasUsableDashboardRetratoRows(rows: DashboardRetratoWebhookRow[]) {
  return rows.some((row) => Object.keys(row).length > 0 && asString(row.usuario_nome).length > 0);
}

function buildDashboardRetratoTotals(rows: DashboardRetratoRow[]): DashboardRetratoTotals {
  return rows.reduce(
    (acc, row) => ({
      lead: acc.lead + row.lead,
      n00: acc.n00 + row.n00,
      n10: acc.n10 + row.n10,
      n21: acc.n21 + row.n21,
      n30: acc.n30 + row.n30,
      n35: acc.n35 + row.n35,
      n40: acc.n40 + row.n40,
      n50: acc.n50 + row.n50,
    }),
    emptyDashboardRetratoTotals,
  );
}

function buildDashboardRetratoRows(payloadRows: DashboardRetratoWebhookRow[]): DashboardRetratoRow[] {
  return payloadRows
    .filter((row) => asString(row.usuario_nome).length > 0)
    .map((row) => ({
      nome: asString(row.usuario_nome, "Sem nome"),
      lead: asNumber(row.qtde_etiquetas_selecionadas, 0),
      n00: asNumber(row.qtde_etiqueta_00, 0),
      n10: asNumber(row.qtde_etiqueta_10, 0),
      n21: asNumber(row.qtde_etiqueta_21, 0),
      n30: asNumber(row.qtde_etiqueta_30, 0),
      n35: asNumber(row.qtde_etiqueta_35, 0),
      n40: asNumber(row.qtde_etiqueta_40, 0),
      n50: asNumber(row.qtde_etiqueta_50, 0),
    }));
}

function buildDashboardRetratoTotalsFromPayload(
  rows: DashboardRetratoRow[],
  payloadRows: DashboardRetratoWebhookRow[],
) {
  const source = payloadRows.find((row) => Object.keys(row).length > 0) ?? {};
  const fallback = buildDashboardRetratoTotals(rows);

  return {
    lead: asNumber(source.total_qtde_etiquetas_selecionadas, fallback.lead),
    n00: asNumber(source.total_qtde_etiqueta_00, fallback.n00),
    n10: asNumber(source.total_qtde_etiqueta_10, fallback.n10),
    n21: asNumber(source.total_qtde_etiqueta_21, fallback.n21),
    n30: asNumber(source.total_qtde_etiqueta_30, fallback.n30),
    n35: asNumber(source.total_qtde_etiqueta_35, fallback.n35),
    n40: asNumber(source.total_qtde_etiqueta_40, fallback.n40),
    n50: asNumber(source.total_qtde_etiqueta_50, fallback.n50),
  } satisfies DashboardRetratoTotals;
}

async function fetchDashboardRetratoWebhookRows(payload: DashboardRetratoWebhookPayload) {
  const response = await fetch(DASHBOARD_RETRATO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as DashboardRetratoWebhookRow[];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [] as DashboardRetratoWebhookRow[];
  }

  const json = JSON.parse(text) as unknown;
  if (Array.isArray(json)) {
    return json as DashboardRetratoWebhookRow[];
  }

  if (json && typeof json === "object") {
    return [json as DashboardRetratoWebhookRow];
  }

  return [] as DashboardRetratoWebhookRow[];
}

async function getDashboardRetratoAllowedUserIds(tipoAcesso2?: string, verticalId?: string) {
  try {
    const normalizedTipo = normalizeTipoAcesso2(tipoAcesso2);
    const normalizedVerticalId = asString(verticalId, "").trim();
    const selectedTipoCandidates =
      normalizedTipo.length > 0
        ? getTipoCandidates(normalizedTipo)
        : [...getTipoCandidates("Time Neg\u00f3cios"), "Prime"];

    const allowedTipos = Array.from(new Set(selectedTipoCandidates));

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("usuarios")
      .select("id")
      .eq("usuario_ativo", true)
      .in("tipo_acesso_2", allowedTipos)
      .limit(5000);

    if (normalizedVerticalId.length > 0) {
      query = query.eq("id_vertical", normalizedVerticalId);
    }

    const { data, error } = await query;

    if (error || !data?.length) {
      return new Set<number>();
    }

    const ids = (data as Array<Record<string, unknown>>)
      .map((row) => asNumber(row.id, 0))
      .filter((id) => id > 0);

    return new Set<number>(ids);
  } catch {
    return null;
  }
}

function buildDashboardRetratoPayloadAttempts(
  basePayload: DashboardRetratoWebhookPayload,
  strictTipo: boolean,
  strictUsuario: boolean,
) {
  const attempts: DashboardRetratoWebhookPayload[] = [basePayload];

  if (strictTipo) {
    for (const candidateTipo of getTipoCandidates(basePayload.tipo2)) {
      if (candidateTipo !== basePayload.tipo2) {
        attempts.push({
          ...basePayload,
          tipo2: candidateTipo,
        });
      }
    }
  } else if (basePayload.tipo2 !== "") {
    attempts.push({
      ...basePayload,
      tipo2: "",
    });
  }

  if (!strictUsuario && basePayload.id !== 0) {
    attempts.push({
      ...basePayload,
      id: 0,
    });
  }

  return attempts;
}

export async function getDashboardRetratoSnapshot(
  filters: DashboardRetratoFilters = {},
): Promise<DashboardRetratoSnapshot> {
  const selectedTipo = normalizeTipoAcesso2(filters.tipoAcesso2);
  const selectedUsuario = Math.max(0, Math.trunc(asNumber(filters.usuarioId, 0)));
  const selectedVerticalId = asString(filters.verticalId, "").trim();
  const strictTipo = selectedTipo.length > 0;
  const strictUsuario = selectedUsuario > 0;

  const basePayload: DashboardRetratoWebhookPayload = {
    tipo2: selectedTipo,
    id: selectedUsuario,
  };

  let payloadRows: DashboardRetratoWebhookRow[] = [];
  for (const payload of buildDashboardRetratoPayloadAttempts(basePayload, strictTipo, strictUsuario)) {
    payloadRows = await fetchDashboardRetratoWebhookRows(payload);
    if (hasUsableDashboardRetratoRows(payloadRows)) {
      break;
    }
  }

  const allowedUserIds = await getDashboardRetratoAllowedUserIds(selectedTipo, selectedVerticalId);
  const eligibilityFilterApplied = allowedUserIds !== null;

  if (allowedUserIds) {
    payloadRows = payloadRows.filter((row) => allowedUserIds.has(asNumber(row.id_usuario, 0)));
  }

  if (strictUsuario) {
    payloadRows = payloadRows.filter((row) => asNumber(row.id_usuario, 0) === selectedUsuario);
  }

  if (!hasUsableDashboardRetratoRows(payloadRows)) {
    if (strictTipo || strictUsuario) {
      return {
        rows: [],
        totals: emptyDashboardRetratoTotals,
      };
    }

    if (eligibilityFilterApplied) {
      return {
        rows: [],
        totals: emptyDashboardRetratoTotals,
      };
    }

    return {
      rows: mockDashboardRetratoRows,
      totals: mockDashboardRetratoTotals,
    };
  }

  const rows = buildDashboardRetratoRows(payloadRows);
  if (!rows.length) {
    if (strictTipo || strictUsuario) {
      return {
        rows: [],
        totals: emptyDashboardRetratoTotals,
      };
    }
    return {
      rows: mockDashboardRetratoRows,
      totals: mockDashboardRetratoTotals,
    };
  }

  return {
    rows,
    totals: buildDashboardRetratoTotalsFromPayload(rows, payloadRows),
  };
}

export type DashboardOrcamentosRow = {
  idUsuario: number;
  nome: string;
  carteira: number;
  atend: number;
  orcAbertos: number;
  n10: number;
  orcFeitos: number;
  orcAprovado: number;
  orcRep: number;
  perfGanhosFeitos: number;
  umbler: number;
};

export type DashboardOrcamentosTotals = {
  carteira: number;
  atend: number;
  orcAbertos: number;
  n10: number;
  orcFeitos: number;
  orcAprovado: number;
  orcRep: number;
  perfGanhosFeitos: number;
  umbler: number;
};

export type DashboardOrcamentosSnapshot = {
  rows: DashboardOrcamentosRow[];
  totals: DashboardOrcamentosTotals;
};

export type DashboardOrcamentosFilters = {
  dataInicioInput?: string;
  dataFimInput?: string;
  tipoRepre?: string;
  usuarioId?: number;
};

type DashboardOrcamentosWebhookPayload = {
  data_inicio: string;
  data_fim: string;
  tipo_repre: string;
};

type DashboardOrcamentosWebhookRow = Record<string, unknown>;

const DASHBOARD_ORCAMENTOS_ENDPOINT =
  process.env.DASHBOARD_ORCAMENTOS_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/7d3f46ac-2d10-450f-8074-46dc7e8a1cf9";

const emptyDashboardOrcamentosTotals: DashboardOrcamentosTotals = {
  carteira: 0,
  atend: 0,
  orcAbertos: 0,
  n10: 0,
  orcFeitos: 0,
  orcAprovado: 0,
  orcRep: 0,
  perfGanhosFeitos: 0,
  umbler: 0,
};

function normalizeTipoRepre(value?: string) {
  const raw = asString(value).trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (normalized === "crv") {
    return "CRV";
  }

  if (normalized === "prime") {
    return "Prime";
  }

  return "";
}

function getTipoRepreCandidates(tipoRepre: string) {
  if (tipoRepre === "CRV" || tipoRepre === "Prime") {
    return [tipoRepre];
  }

  return ["CRV", "Prime"];
}

async function getDashboardOrcamentosAllowedUserIds(tipoRepre: string) {
  try {
    const allowedTipos = getTipoRepreCandidates(tipoRepre);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("usuario_ativo", true)
      .in("tipo_acesso_2", allowedTipos)
      .limit(5000);

    if (error || !data?.length) {
      return new Set<number>();
    }

    const ids = (data as Array<Record<string, unknown>>)
      .map((row) => asNumber(row.id, 0))
      .filter((id) => id > 0);

    return new Set<number>(ids);
  } catch {
    return null;
  }
}

function hasUsableDashboardOrcamentosRows(rows: DashboardOrcamentosWebhookRow[]) {
  return rows.some((row) => Object.keys(row).length > 0 && asString(row.nome).length > 0);
}

async function fetchDashboardOrcamentosWebhookRows(payload: DashboardOrcamentosWebhookPayload) {
  const response = await fetch(DASHBOARD_ORCAMENTOS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as DashboardOrcamentosWebhookRow[];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [] as DashboardOrcamentosWebhookRow[];
  }

  const json = JSON.parse(text) as unknown;
  if (Array.isArray(json)) {
    return json as DashboardOrcamentosWebhookRow[];
  }

  if (json && typeof json === "object") {
    return [json as DashboardOrcamentosWebhookRow];
  }

  return [] as DashboardOrcamentosWebhookRow[];
}

function buildDashboardOrcamentosRows(payloadRows: DashboardOrcamentosWebhookRow[]): DashboardOrcamentosRow[] {
  return payloadRows
    .filter((row) => asString(row.nome).length > 0)
    .map((row) => ({
      idUsuario: asNumber(row.id_usuario, 0),
      nome: asString(row.nome, "Sem nome"),
      carteira: asNumber(row.carteira, 0),
      atend: asNumber(row.porcentagem_atendidos, 0),
      orcAbertos: asNumber(row.orc_abertos, 0),
      n10: asNumber(row["#10"], asNumber(row.etiqueta_10, 0)),
      orcFeitos: asNumber(row.orc_feitos, 0),
      orcAprovado: asNumber(row.orc_ganhos, 0),
      orcRep: asNumber(row.orc_reprovado, 0),
      perfGanhosFeitos: asNumber(row.perf_ganhos_feitos, 0),
      umbler: asNumber(row.umbler, 0),
    }));
}

function dedupeDashboardOrcamentosRows(rows: DashboardOrcamentosRow[]) {
  const uniqueRows = new Map<string, DashboardOrcamentosRow>();

  for (const row of rows) {
    const uniqueKey = row.idUsuario > 0 ? `id:${row.idUsuario}` : `nome:${row.nome.toLowerCase()}`;

    if (!uniqueRows.has(uniqueKey)) {
      uniqueRows.set(uniqueKey, row);
    }
  }

  return Array.from(uniqueRows.values());
}

function buildDashboardOrcamentosTotals(rows: DashboardOrcamentosRow[]) {
  if (!rows.length) {
    return emptyDashboardOrcamentosTotals;
  }

  const totals = rows.reduce(
    (acc, row) => ({
      carteira: acc.carteira + row.carteira,
      atend: acc.atend + row.atend,
      orcAbertos: acc.orcAbertos + row.orcAbertos,
      n10: acc.n10 + row.n10,
      orcFeitos: acc.orcFeitos + row.orcFeitos,
      orcAprovado: acc.orcAprovado + row.orcAprovado,
      orcRep: acc.orcRep + row.orcRep,
      perfGanhosFeitos: acc.perfGanhosFeitos + row.perfGanhosFeitos,
      umbler: acc.umbler + row.umbler,
    }),
    emptyDashboardOrcamentosTotals,
  );

  return {
    ...totals,
    perfGanhosFeitos: totals.perfGanhosFeitos / rows.length,
  } satisfies DashboardOrcamentosTotals;
}

export async function getDashboardOrcamentosSnapshot(
  filters: DashboardOrcamentosFilters = {},
): Promise<DashboardOrcamentosSnapshot> {
  const defaultDateRange = getDefaultDateRangeInput();
  const dataInicioInput = normalizeInputDate(filters.dataInicioInput, defaultDateRange.dataInicio);
  const dataFimInput = normalizeInputDate(filters.dataFimInput, defaultDateRange.dataFim);
  const tipoRepre = normalizeTipoRepre(filters.tipoRepre);
  const selectedUsuarioId = Math.max(0, Math.trunc(asNumber(filters.usuarioId, 0)));
  const strictUsuario = selectedUsuarioId > 0;
  const payloadBase = {
    data_inicio: toWebhookDate(dataInicioInput),
    data_fim: toWebhookDate(dataFimInput),
  };

  const payloads: DashboardOrcamentosWebhookPayload[] = getTipoRepreCandidates(tipoRepre).map((tipo) => ({
    ...payloadBase,
    tipo_repre: tipo,
  }));

  const payloadRowsList = await Promise.all(payloads.map((payload) => fetchDashboardOrcamentosWebhookRows(payload)));
  const payloadRows = payloadRowsList.flat();

  if (!hasUsableDashboardOrcamentosRows(payloadRows)) {
    return {
      rows: [],
      totals: emptyDashboardOrcamentosTotals,
    };
  }

  let rows = dedupeDashboardOrcamentosRows(buildDashboardOrcamentosRows(payloadRows));
  const allowedUserIds = await getDashboardOrcamentosAllowedUserIds(tipoRepre);

  if (allowedUserIds) {
    rows = rows.filter((row) => row.idUsuario > 0 && allowedUserIds.has(row.idUsuario));
  }

  if (strictUsuario) {
    rows = rows.filter((row) => row.idUsuario === selectedUsuarioId);
  }

  if (!rows.length) {
    return {
      rows: [],
      totals: emptyDashboardOrcamentosTotals,
    };
  }

  return {
    rows,
    totals: buildDashboardOrcamentosTotals(rows),
  };
}

export type TintimLinkRow = {
  id: string;
  createdAt: string;
  usuarioId: number | null;
  pagina: string;
  linkTintim: string;
  frase: string;
};

export type TintimLinksSnapshot = {
  rows: TintimLinkRow[];
  hasNextPage: boolean;
};

export type TintimLinksFilters = {
  limit?: number;
  offset?: number;
  usuarioId?: number | null;
  utm?: string;
};

export async function getTintimLinksSnapshot(
  filters: TintimLinksFilters = {},
): Promise<TintimLinksSnapshot> {
  const limit = Math.max(1, Math.trunc(asNumber(filters.limit, 10)));
  const offset = Math.max(0, Math.trunc(asNumber(filters.offset, 0)));
  const fetchSize = limit + 1;
  const usuarioId = asNullablePositiveInt(filters.usuarioId);
  const utm = asString(filters.utm).trim();

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("link_campanha_tintim")
      .select("id,created_at,id_usuario,pagina,link_tintim,frase")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + fetchSize - 1);

    if (usuarioId) {
      query = query.eq("id_usuario", usuarioId);
    }

    if (utm.length > 0) {
      query = query.ilike("pagina", `%${utm}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      return {
        rows: [],
        hasNextPage: false,
      };
    }

    const mappedRows = (data as Array<Record<string, unknown>>).map((row) => ({
      id: asString(row.id),
      createdAt: normalizeDate(row.created_at),
      usuarioId: asNullablePositiveInt(row.id_usuario),
      pagina: asString(row.pagina),
      linkTintim: asString(row.link_tintim),
      frase: asString(row.frase),
    }));

    return {
      rows: mappedRows.slice(0, limit),
      hasNextPage: mappedRows.length > limit,
    };
  } catch {
    return {
      rows: [],
      hasNextPage: false,
    };
  }
}

export type CampanhasDashRow = {
  campanha: string;
  lead: number;
  n00: number;
  n10: number;
  n05: number;
  n30: number;
  n35: number;
  n40: number;
  n50: number;
  n60: number;
  n61: number;
  n62: number;
  n66: number;
};

export type CampanhasDashFilters = {
  dataInicioInput?: string;
  dataFimInput?: string;
};

function parseCampanhasDashJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function unwrapCampanhasDashPayload(value: unknown) {
  let current = value;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (typeof current === "string") {
      const parsed = parseCampanhasDashJson(current);
      if (parsed === null) {
        break;
      }
      current = parsed;
      continue;
    }

    if (current && typeof current === "object" && !Array.isArray(current) && "body" in current) {
      current = (current as { body: unknown }).body;
      continue;
    }

    break;
  }

  return current;
}

function toCampanhasDashRows(value: unknown): CampanhasDashRow[] {
  const unwrapped = unwrapCampanhasDashPayload(value);
  if (!Array.isArray(unwrapped)) {
    return [];
  }

  return unwrapped
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    .map((row) => ({
      campanha: asString(row.apelido_campanha, asString(row.id_unico, "Campanha")),
      lead: Math.max(0, Math.trunc(asNumber(row.total_leads, 0))),
      n00: Math.max(0, Math.trunc(asNumber(row.etiqueta_00, 0))),
      n10: Math.max(0, Math.trunc(asNumber(row.etiqueta_10, 0))),
      n05: Math.max(0, Math.trunc(asNumber(row.etiqueta_05, 0))),
      n30: Math.max(0, Math.trunc(asNumber(row.etiqueta_30, 0))),
      n35: Math.max(0, Math.trunc(asNumber(row.etiqueta_35, 0))),
      n40: Math.max(0, Math.trunc(asNumber(row.etiqueta_40, 0))),
      n50: Math.max(0, Math.trunc(asNumber(row.etiqueta_50, 0))),
      n60: Math.max(0, Math.trunc(asNumber(row.etiqueta_60, 0))),
      n61: Math.max(0, Math.trunc(asNumber(row.etiqueta_61, 0))),
      n62: Math.max(0, Math.trunc(asNumber(row.etiqueta_62, 0))),
      n66: Math.max(0, Math.trunc(asNumber(row.etiqueta_66, 0))),
    }));
}

export async function getCampanhasDashSnapshot(
  filters: CampanhasDashFilters = {},
): Promise<CampanhasDashRow[]> {
  const defaultDateRange = getDefaultDateRangeInput();
  const dataInicioInput = normalizeInputDate(filters.dataInicioInput, defaultDateRange.dataInicio);
  const dataFimInput = normalizeInputDate(filters.dataFimInput, defaultDateRange.dataFim);

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("filter3_campanhas_usuarios_por_etiquetas", {
      p_data_inicio: dataInicioInput,
      p_data_fim: dataFimInput,
    });

    if (error || !data) {
      return [];
    }

    return toCampanhasDashRows(data);
  } catch {
    return [];
  }
}



