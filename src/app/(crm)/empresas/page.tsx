import { EmpresasControlShell } from "@/components/empresas/empresas-control-shell";
import type { EmpresaControleRow } from "@/components/empresas/types";
import { PageContainer } from "@/components/layout/page-container";
import { getClientesRepresentantes, getEmpresasControleRows } from "@/services/crm/api";

const fallbackRows: EmpresaControleRow[] = [
  {
    id: "fallback-1",
    nome: "[s.nome]",
    data: "data",
    status: "Ativo",
    usuario: "usuario",
    endereco: "[s.endereco]",
  },
  {
    id: "fallback-2",
    nome: "[s.nome]",
    data: "data",
    status: "Ativo",
    usuario: "usuario",
    endereco: "[s.endereco]",
  },
  {
    id: "fallback-3",
    nome: "[s.nome]",
    data: "data",
    status: "Ativo",
    usuario: "usuario",
    endereco: "[s.endereco]",
  },
  {
    id: "fallback-4",
    nome: "[s.nome]",
    data: "data",
    status: "Ativo",
    usuario: "usuario",
    endereco: "[s.endereco]",
  },
];

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

type EmpresasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmpresasPage({ searchParams }: EmpresasPageProps) {
  const params = await searchParams;
  const search = (getSearchValue(params.search) ?? "").trim();

  const [empresas, representantes] = await Promise.all([
    getEmpresasControleRows({
      searchText: search,
      limit: 500,
      offset: 0,
      userIdText: null,
    }),
    getClientesRepresentantes(),
  ]);

  const rows: EmpresaControleRow[] = empresas.length > 0 ? empresas : fallbackRows;

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-[calc(100dvh-180px)] overflow-auto">
          <EmpresasControlShell key={`empresas:${search}`} initialRows={rows} representantes={representantes} initialSearch={search} />
        </div>
      </div>
    </PageContainer>
  );
}
