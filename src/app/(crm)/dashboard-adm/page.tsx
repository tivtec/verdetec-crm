import { ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardAdmPage() {
  return (
    <>
      <AppHeader title="Dashboard Admin" subtitle="Painel dedicado para gestores e administradores." />
      <PageContainer className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Governança e permissões</CardTitle>
            <Badge tone="success">Admin</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--brand-primary)]" />
              Controle de acesso por empresa, setor (unit) e escopo individual.
            </p>
            <p>Esta tela está pronta para conectar os widgets de auditoria e provisionamento de usuários.</p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
