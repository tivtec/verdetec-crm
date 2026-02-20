import { PedidosControlShell } from "@/components/pedidos/pedidos-control-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getPedidosControleRows } from "@/services/crm/api";

const PAGE_SIZE = 10;

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

type PedidoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PedidoPage({ searchParams }: PedidoPageProps) {
  const params = await searchParams;
  const nome = (getSearchValue(params.nome) ?? "").trim();
  const cep = (getSearchValue(params.cep) ?? "").trim();
  const requestedPage = Math.max(1, Math.trunc(Number(getSearchValue(params.page) ?? "1") || 1));
  const offset = (requestedPage - 1) * PAGE_SIZE;

  const rows = await getPedidosControleRows({
    limit: PAGE_SIZE + 1,
    offset,
    nome,
    cep,
  });

  const hasNextPage = rows.length > PAGE_SIZE;
  const currentRows = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows;

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-[calc(100dvh-180px)] overflow-auto">
          <PedidosControlShell
            key={`pedidos:${nome}:${cep}:${requestedPage}`}
            initialRows={currentRows}
            initialFilters={{ nome, cep }}
            currentPage={requestedPage}
            hasNextPage={hasNextPage}
          />
        </div>
      </div>
    </PageContainer>
  );
}
