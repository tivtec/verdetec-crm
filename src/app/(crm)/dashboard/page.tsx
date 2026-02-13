import { BarChart3, Clock3, Filter } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgendaEvents, getDashboardMetrics } from "@/services/crm/api";
import { formatDateTime } from "@/utils/format";

export default async function DashboardPage() {
  const [metrics, agenda] = await Promise.all([getDashboardMetrics(), getAgendaEvents()]);

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle="Visão consolidada de métricas, funil e agenda da operação."
      />
      <PageContainer className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            Filtros: período, usuário e vertical
          </div>
          <Button variant="secondary" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Atualizar KPIs
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <KpiCard key={item.title} title={item.title} value={item.value} delta={item.delta} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Funil por etapa</CardTitle>
              <Badge tone="info">Realtime ready</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { etapa: "Lead novo", total: 78, progress: "w-[88%]" },
                  { etapa: "Qualificação", total: 51, progress: "w-[63%]" },
                  { etapa: "Proposta enviada", total: 36, progress: "w-[42%]" },
                  { etapa: "Fechamento", total: 19, progress: "w-[26%]" },
                ].map((item) => (
                  <div key={item.etapa}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.etapa}</span>
                      <span className="text-slate-500">{item.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full bg-[var(--brand-primary)] ${item.progress}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos compromissos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agenda.slice(0, 5).map((event) => (
                <div key={event.id} className="rounded-xl border border-[var(--brand-border)] bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(event.starts_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
