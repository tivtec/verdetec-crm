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
