import { Target } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardRepresentantePage() {
  return (
    <>
      <AppHeader
        title="Dashboard Representante"
        subtitle="Resumo de pipeline, metas e agenda pessoal."
      />
      <PageContainer className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Performance individual</CardTitle>
            <Badge tone="info">Representante</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--brand-primary)]" />
              Metas do mês: 62% concluído (mock pronto para dados reais).
            </p>
            <p>Integração com filtros de vertical e realtime de leads habilitada na camada de serviços.</p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
