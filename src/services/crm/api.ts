import { cache } from "react";

import type { AgendaEvent, Cliente, Empresa, Pedido } from "@/schemas/domain";
import { createServerSupabaseClient } from "@/services/supabase/server";

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

function normalizeDate(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
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

const mockEmpresas: Empresa[] = [
  {
    id: "1",
    razao_social: "Empresa exemplo",
    cnpj: "00.000.000/0001-00",
    vertical: "Default",
    created_at: new Date().toISOString(),
  },
];

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

export async function getPedidos() {
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

const mockAgenda: AgendaEvent[] = [
  {
    id: "1",
    title: "Agenda exemplo",
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: "Pendente",
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
      .order("inicio_reuniao", { ascending: true })
      .limit(100);

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
};

export type DashboardRepresentanteOption = {
  id: number;
  nome: string;
  verticalId: string;
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

export async function getDashboardRepresentantesByTipo(
  tipoAcesso2?: string,
): Promise<DashboardRepresentanteOption[]> {
  const normalizedTipo = normalizeTipoAcesso2(tipoAcesso2);
  if (!normalizedTipo) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const candidates = getTipoCandidates(normalizedTipo);
    let query = supabase
      .from("usuarios")
      .select("id,nome,id_vertical,tipo_acesso_2")
      .eq("usuario_ativo", true)
      .limit(300);

    if (candidates.length === 1) {
      query = query.eq("tipo_acesso_2", candidates[0]);
    } else {
      query = query.in("tipo_acesso_2", candidates);
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

function buildDashboardTotals(rows: DashboardFunilRow[], payloadRows: DashboardWebhookRow[]) {
  const source = payloadRows.find((row) => Object.keys(row).length > 0) ?? {};

  return {
    lead: asNumber(source.total_leads_qualificados_geral, sumBy(rows, "lead")),
    plusL100: "-",
    l100: "-",
    n00: asNumber(source.total_etiqueta_00, sumBy(rows, "n00")),
    n10: asNumber(source.total_etiqueta_10, sumBy(rows, "n10")),
    n21: asNumber(source.total_etiqueta_21, sumBy(rows, "n21")),
    n05: asNumber(source.total_etiqueta_05, sumBy(rows, "n05")),
    n30: asNumber(source.total_etiqueta_30, sumBy(rows, "n30")),
    n40: asNumber(source.total_etiqueta_40, sumBy(rows, "n40")),
    n50: asNumber(source.total_etiqueta_50, sumBy(rows, "n50")),
    n60: asNumber(source.total_etiqueta_60, sumBy(rows, "n60")),
    n61: asNumber(source.total_etiqueta_61, sumBy(rows, "n61")),
    n62: asNumber(source.total_etiqueta_62, sumBy(rows, "n62")),
    n66: asNumber(source.total_etiqueta_66, sumBy(rows, "n66")),
    tv: asNumber(source.media_dias_entre_entrada_e_conversao, 0),
    min: asString(source.total_des_dur_falada, "00:00:00"),
    qtd: asNumber(source.total_quantidade_linhas, sumBy(rows, "qtd")),
    umbler: asNumber(source.total_mensagens_gerais, sumBy(rows, "umbler")),
  } satisfies DashboardFunilTotals;
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
  }

  return attempts;
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
  const strictTipo = selectedTipo.length > 0;
  const strictUsuario = selectedUsuario > 0;

  const basePayload: DashboardWebhookPayload = {
    p_data_inicio: toWebhookDate(dataInicioInput),
    p_data_fim: toWebhookDate(dataFimInput),
    vertical: resolveVerticalForPayload(selectedVertical, selectedTipo, context.vertical),
    p_tipo_acesso_2: selectedTipo,
    p_id_usuario: selectedUsuario,
  };

  let payloadRows: DashboardWebhookRow[] = [];

  for (const payload of buildPayloadAttempts(basePayload, { strictTipo, strictUsuario })) {
    payloadRows = await fetchDashboardWebhookRows(payload);
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
    totals: buildDashboardTotals(rows, payloadRows),
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

async function getDashboardRetratoAllowedUserIds(tipoAcesso2?: string) {
  try {
    const normalizedTipo = normalizeTipoAcesso2(tipoAcesso2);
    const selectedTipoCandidates =
      normalizedTipo.length > 0
        ? getTipoCandidates(normalizedTipo)
        : [...getTipoCandidates("Time Neg\u00f3cios"), "Prime"];

    const allowedTipos = Array.from(new Set(selectedTipoCandidates));

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

  const allowedUserIds = await getDashboardRetratoAllowedUserIds(selectedTipo);
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


