import { cache } from "react";

import type { AgendaEvent, Cliente, Empresa, Pedido } from "@/schemas/domain";
import { createServerSupabaseClient } from "@/services/supabase/server";

export type DashboardMetric = {
  title: string;
  value: string;
  delta: string;
};

const mockDashboardMetrics: DashboardMetric[] = [
  { title: "Clientes ativos", value: "1.284", delta: "+8.2% no mês" },
  { title: "Empresas", value: "302", delta: "+2.1% no mês" },
  { title: "Pedidos", value: "489", delta: "+13.4% no mês" },
  { title: "Ticket médio", value: "R$ 2.430", delta: "-1.3% no mês" },
];

export const getDashboardMetrics = cache(async () => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("view_dashboard_metrics").select("*").limit(1);

    if (error || !data?.length) {
      return mockDashboardMetrics;
    }

    const row = data[0];
    return [
      {
        title: "Clientes ativos",
        value: `${row.total_clientes ?? 0}`,
        delta: "Base Supabase",
      },
      {
        title: "Empresas",
        value: `${row.total_empresas ?? 0}`,
        delta: "Base Supabase",
      },
      {
        title: "Pedidos",
        value: `${row.total_pedidos ?? 0}`,
        delta: "Base Supabase",
      },
      {
        title: "Ticket médio",
        value: `R$ ${Number(row.ticket_medio ?? 0).toFixed(2)}`,
        delta: "Base Supabase",
      },
    ] satisfies DashboardMetric[];
  } catch {
    return mockDashboardMetrics;
  }
});

const mockClientes: Cliente[] = [
  {
    id: "f3f6d012-1cd2-4b5a-a8e8-101111111111",
    nome: "Agro Flora Norte",
    email: "contato@agroflora.com",
    telefone: "(11) 99999-1010",
    etiqueta: "Lead quente",
    status: "Ativo",
    created_at: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "f3f6d012-1cd2-4b5a-a8e8-202222222222",
    nome: "Jardins Aurora",
    email: "gestao@jardinsaurora.com.br",
    telefone: "(19) 98888-2121",
    etiqueta: "Negociação",
    status: "Em progresso",
    created_at: "2026-02-08T11:40:00.000Z",
  },
  {
    id: "f3f6d012-1cd2-4b5a-a8e8-303333333333",
    nome: "Verde Prime",
    email: "comercial@verdeprime.com",
    telefone: "(31) 97777-3232",
    etiqueta: "Sem contato",
    status: "Novo",
    created_at: "2026-02-04T09:20:00.000Z",
  },
];

export async function getClientes(search?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const query = supabase.from("clientes").select("*").order("created_at", { ascending: false }).limit(50);
    const { data, error } = search ? await query.ilike("nome", `%${search}%`) : await query;

    if (error || !data) {
      return mockClientes;
    }

    return data as unknown as Cliente[];
  } catch {
    return mockClientes;
  }
}

const mockEmpresas: Empresa[] = [
  {
    id: "a00db9f9-0d3a-4d05-a1b0-414444444444",
    razao_social: "Verdetec Serviços Ambientais LTDA",
    cnpj: "13.532.670/0001-89",
    vertical: "Hidrossemeadura",
    created_at: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "a00db9f9-0d3a-4d05-a1b0-525555555555",
    razao_social: "Portal Agro Comercial SA",
    cnpj: "71.930.120/0001-35",
    vertical: "Irrigação",
    created_at: "2026-01-19T12:30:00.000Z",
  },
];

export async function getEmpresas() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return mockEmpresas;
    }

    return data as unknown as Empresa[];
  } catch {
    return mockEmpresas;
  }
}

const mockPedidos: Pedido[] = [
  {
    id: "e53c79ef-79f5-49f7-b5fc-616666666666",
    cliente: "Agro Flora Norte",
    status: "Aprovado",
    valor_total: 18340.0,
    created_at: "2026-02-12T15:20:00.000Z",
  },
  {
    id: "e53c79ef-79f5-49f7-b5fc-727777777777",
    cliente: "Verde Prime",
    status: "Orçamento enviado",
    valor_total: 7420.5,
    created_at: "2026-02-09T16:45:00.000Z",
  },
];

export async function getPedidos() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return mockPedidos;
    }

    const rows = data as unknown as Array<{
      id: string;
      status: string;
      valor_total: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      ...row,
      cliente: null,
    })) satisfies Pedido[];
  } catch {
    return mockPedidos;
  }
}

const mockAgenda: AgendaEvent[] = [
  {
    id: "a5d75a76-4c66-4f19-ad84-838888888888",
    title: "Visita técnica - Campinas",
    starts_at: "2026-02-15T13:00:00.000Z",
    ends_at: "2026-02-15T14:00:00.000Z",
    status: "Confirmado",
  },
  {
    id: "a5d75a76-4c66-4f19-ad84-949999999999",
    title: "Follow-up proposta - Agro Flora",
    starts_at: "2026-02-16T10:30:00.000Z",
    ends_at: "2026-02-16T11:00:00.000Z",
    status: "Pendente",
  },
];

export async function getAgendaEvents() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("agenda_events")
      .select("*")
      .order("starts_at", { ascending: true })
      .limit(100);

    if (error || !data) {
      return mockAgenda;
    }

    return data as unknown as AgendaEvent[];
  } catch {
    return mockAgenda;
  }
}
