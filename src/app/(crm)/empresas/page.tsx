import { Building2, Plus } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { EmpresasTable } from "@/components/tables/empresas-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEmpresas } from "@/services/crm/api";

export default async function EmpresasPage() {
  const empresas = await getEmpresas();

  return (
    <>
      <AppHeader title="Empresas" subtitle="Cadastro e associação com usuários, setores e verticais." />
      <PageContainer className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative min-w-[260px] flex-1">
              <Input placeholder="Buscar por razão social ou CNPJ" />
            </div>
            <Badge tone="info" className="h-10 rounded-lg px-3">
              Máscara CNPJ habilitada
            </Badge>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova empresa
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="h-4 w-4 text-[var(--brand-primary)]" />
              Estrutura pronta para CRUD completo com associação usuário/vertical.
            </p>
            <EmpresasTable data={empresas} />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
