import { Download, Filter, Plus } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { ClientesTable } from "@/components/tables/clientes-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getClientes } from "@/services/crm/api";

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <>
      <AppHeader title="Clientes" subtitle="Busca, filtros por etiqueta/status, paginação e ações em lote." />
      <PageContainer className="space-y-4">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto_auto]">
            <Input placeholder="Buscar cliente..." />
            <Select defaultValue="">
              <option value="">Todas etiquetas</option>
              <option value="lead-quente">Lead quente</option>
              <option value="negociacao">Negociação</option>
              <option value="sem-contato">Sem contato</option>
            </Select>
            <Select defaultValue="">
              <option value="">Todos status</option>
              <option value="novo">Novo</option>
              <option value="em-progresso">Em progresso</option>
              <option value="ativo">Ativo</option>
            </Select>
            <Button variant="secondary" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="ghost" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <ClientesTable data={clientes} />
      </PageContainer>
    </>
  );
}
