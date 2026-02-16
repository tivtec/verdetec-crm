import { AgendaControlShell } from "@/components/agenda/agenda-control-shell";
import type { AgendaControleRow } from "@/components/agenda/types";
import { PageContainer } from "@/components/layout/page-container";
import { getAgendaControleRows, getClientesRepresentantes } from "@/services/crm/api";

export default async function AgendaPage() {
  const [rows, representantes] = await Promise.all([getAgendaControleRows(), getClientesRepresentantes()]);

  const allowedRepresentantes = Array.from(
    new Set(
      representantes
        .map((representante) => representante.nome.trim())
        .filter((nome) => nome.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="max-h-[calc(100vh-180px)] overflow-auto">
          <AgendaControlShell
            initialRows={rows as AgendaControleRow[]}
            allowedRepresentantes={allowedRepresentantes}
          />
        </div>
      </div>
    </PageContainer>
  );
}
