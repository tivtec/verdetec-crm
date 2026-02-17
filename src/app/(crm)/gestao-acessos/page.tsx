import { redirect } from "next/navigation";

import { GestaoAcessosShell } from "@/components/acessos/gestao-acessos-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getAccessMatrixSnapshot } from "@/services/access-control/server";
import type { AccessMatrixRow, CrmPage } from "@/services/access-control/types";

type GestaoAcessosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.trunc(parsed));
}

export default async function GestaoAcessosPage({ searchParams }: GestaoAcessosPageProps) {
  const params = await searchParams;
  const search = (getSearchValue(params.search) ?? "").trim();
  const page = parsePositiveInt(getSearchValue(params.page), 1);

  const snapshotResult = await getAccessMatrixSnapshot({
    search,
    page,
    pageSize: 10,
  });

  if (!snapshotResult.ok) {
    if (snapshotResult.status === 401) {
      redirect("/login");
    }

    redirect("/dashboard?access_denied=1");
  }

  const snapshot = snapshotResult.value;

  return (
    <PageContainer className="flex h-full min-h-0 flex-col gap-5 bg-[#eceef0]">
      <header>
        <h1 className="text-5xl font-semibold text-[#30343a]">Gestao de Acessos</h1>
      </header>

      <div className="min-h-0 flex-1 rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-full overflow-hidden">
          <GestaoAcessosShell
            key={`gestao-acessos:${search}:${page}`}
            initialRows={snapshot.rows as AccessMatrixRow[]}
            pages={snapshot.pages as CrmPage[]}
            initialSearch={search}
            currentPage={snapshot.currentPage}
            hasNextPage={snapshot.hasNextPage}
          />
        </div>
      </div>
    </PageContainer>
  );
}
