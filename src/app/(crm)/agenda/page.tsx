import { CalendarCheck2, RefreshCcw } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { AgendaTable } from "@/components/tables/agenda-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgendaEvents } from "@/services/crm/api";

export default async function AgendaPage() {
  const events = await getAgendaEvents();

  return (
    <>
      <AppHeader
        title="Agenda"
        subtitle="Calendário operacional com reservas, slots e sincronização em tempo real."
      />
      <PageContainer className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Agenda compartilhada</CardTitle>
            <div className="flex items-center gap-2">
              <Badge tone="success">Realtime</Badge>
              <Button variant="secondary" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Sincronizar Google Calendar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600">
              <CalendarCheck2 className="h-4 w-4 text-[var(--brand-primary)]" />
              Atualizações de agenda prontas para canais por `company_id`.
            </p>
            <AgendaTable data={events} />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
