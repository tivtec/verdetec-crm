import { MailPlus, ShieldPlus } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { UsuariosTable, type UsuarioRow } from "@/components/tables/usuarios-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getUsuariosLegacy } from "@/services/crm/api";

export default async function UsuariosPage() {
  const usuarios = (await getUsuariosLegacy()).map(
    (item) =>
      ({
        id: item.id,
        nome: item.nome,
        email: item.email,
        role: item.ativo ? item.role : `${item.role} (inativo)`,
        scope: item.scope,
        unit: item.unit,
      }) satisfies UsuarioRow,
  );

  return (
    <>
      <AppHeader
        title="Usuarios e Permissoes"
        subtitle="Gestao de invites, roles e escopos dinamicos por empresa/setor/vertical."
      />
      <PageContainer className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <Select defaultValue="org" className="max-w-[220px]">
              <option value="org">Escopo organizacional</option>
              <option value="unit">Escopo por setor</option>
              <option value="self">Escopo individual</option>
            </Select>
            <Badge tone="warning">RBAC dinamico ativo</Badge>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-2">
                <ShieldPlus className="h-4 w-4" />
                Gerenciar roles
              </Button>
              <Button className="gap-2">
                <MailPlus className="h-4 w-4" />
                Enviar convite
              </Button>
            </div>
          </CardContent>
        </Card>

        <UsuariosTable data={usuarios} />
      </PageContainer>
    </>
  );
}
