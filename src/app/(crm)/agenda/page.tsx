import { AgendaControlShell } from "@/components/agenda/agenda-control-shell";
import type { AgendaControleRow } from "@/components/agenda/types";
import { PageContainer } from "@/components/layout/page-container";
import { getAgendaControleRows, getClientesRepresentantes, getDashboardViewerAccessScope } from "@/services/crm/api";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export default async function AgendaPage() {
  const [rowsRaw, dashboardAccessScope] = await Promise.all([getAgendaControleRows(), getDashboardViewerAccessScope()]);

  const canSelectRepresentante = dashboardAccessScope.isGerencia || dashboardAccessScope.isGestor;
  const viewerUsuarioId = Math.max(0, Math.trunc(dashboardAccessScope.viewerUsuarioId));

  let representantes = await getClientesRepresentantes(
    dashboardAccessScope.isGerencia ? {} : { verticalId: dashboardAccessScope.viewerVerticalId },
  );

  if (!canSelectRepresentante) {
    if (viewerUsuarioId > 0) {
      const selfRow = representantes.find((representante) => representante.id === viewerUsuarioId);
      representantes = selfRow
        ? [selfRow]
        : [
            {
              id: viewerUsuarioId,
              nome: dashboardAccessScope.viewerNome || "Representante",
            },
          ];
    } else {
      representantes = [];
    }
  }

  const scopedRepresentanteNames = representantes
    .map((representante) => representante.nome.trim())
    .filter((nome) => nome.length > 0);
  const allowedRepresentanteNames = dashboardAccessScope.isGerencia ? [] : scopedRepresentanteNames;
  const allowedRepresentanteNameSet = new Set(allowedRepresentanteNames.map(normalizeName));

  const rows = dashboardAccessScope.isGerencia
    ? rowsRaw
    : rowsRaw.filter((row) => allowedRepresentanteNameSet.has(normalizeName(row.representante)));

  const initialRepresentante = !canSelectRepresentante && scopedRepresentanteNames.length > 0 ? scopedRepresentanteNames[0] : "";

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-[calc(100dvh-180px)] overflow-auto">
          <AgendaControlShell
            initialRows={rows as AgendaControleRow[]}
            representantes={representantes}
            initialRepresentante={initialRepresentante}
            lockRepresentanteSelection={!canSelectRepresentante}
            allowedRepresentanteNames={allowedRepresentanteNames}
          />
        </div>
      </div>
    </PageContainer>
  );
}
