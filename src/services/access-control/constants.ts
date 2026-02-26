export const GESTAO_ACESSOS_PAGE_KEY = "gestao-acessos";

export const CRM_SIDEBAR_PAGES = [
  { key: "dashboard", path: "/dashboard", label: "Dashboard", sortOrder: 10 },
  { key: "campanhas", path: "/campanhas", label: "Campanhas", sortOrder: 20 },
  { key: "clientes", path: "/clientes", label: "Clientes", sortOrder: 30 },
  { key: "empresas", path: "/empresas", label: "Empresas", sortOrder: 40 },
  { key: "pedido", path: "/pedido", label: "Pedidos", sortOrder: 50 },
  { key: "usuarios", path: "/usuarios", label: "Usuarios", sortOrder: 60 },
  { key: "agenda", path: "/agenda", label: "Agenda", sortOrder: 70 },
  { key: "expedicao", path: "/expedicao", label: "Expedicao", sortOrder: 75 },
  { key: "solicitacao-portal", path: "/solicitacao-portal", label: "Solicitacoes", sortOrder: 80 },
  { key: "mix-sementes", path: "/mix-sementes", label: "Mix de sementes", sortOrder: 90 },
  { key: "verde-score", path: "/verde-score", label: "Verde Score", sortOrder: 100 },
  { key: "invoice", path: "/invoice", label: "Invoice", sortOrder: 110 },
  { key: GESTAO_ACESSOS_PAGE_KEY, path: "/gestao-acessos", label: "Gestao de acessos", sortOrder: 120 },
] as const;

export type CrmSidebarPageKey = (typeof CRM_SIDEBAR_PAGES)[number]["key"];
