import { SolicitacoesControlShell } from "@/components/solicitacoes/solicitacoes-control-shell";
import type { SolicitacaoControleRow } from "@/components/solicitacoes/solicitacoes-control-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getSolicitacoesPortalPageSnapshot } from "@/services/crm/api";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

type SolicitacaoPortalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.trunc(parsed));
}

export default async function SolicitacaoPortalPage({ searchParams }: SolicitacaoPortalPageProps) {
  const params = await searchParams;
  const busca = (getSearchValue(params.busca) ?? "").trim();
  const page = parsePage(getSearchValue(params.page));
  const pageSize = 10;

  const snapshot = await getSolicitacoesPortalPageSnapshot({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    busca,
  });

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-[calc(100dvh-180px)] overflow-auto">
          <SolicitacoesControlShell
            key={`solicitacoes:${busca}:${page}`}
            initialRows={snapshot.rows as SolicitacaoControleRow[]}
            initialBusca={busca}
            currentPage={page}
            hasNextPage={snapshot.hasNextPage}
          />
        </div>
      </div>
    </PageContainer>
  );
}
