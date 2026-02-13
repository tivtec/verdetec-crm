import { MailPlus, ShieldPlus } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { UsuariosTable, type UsuarioRow } from "@/components/tables/usuarios-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const usuarios: UsuarioRow[] = [
  {
    id: "1",
    nome: "Bruno Gestor",
    email: "bruno@verdetec.com.br",
    role: "Gestor",
    scope: "org",
    unit: "Operações",
  },
  {
    id: "2",
    nome: "Ana Representante",
    email: "ana@verdetec.com.br",
    role: "Representante",
    scope: "unit",
    unit: "Vertical Hidrossemeadura",
  },
  {
    id: "3",
    nome: "Carlos Comercial",
    email: "carlos@verdetec.com.br",
    role: "Comercial",
    scope: "self",
    unit: "Regional Campinas",
  },
];

export default function UsuariosPage() {
  return (
    <>
      <AppHeader
        title="Usuários e Permissões"
        subtitle="Gestão de invites, roles e escopos dinâmicos por empresa/setor/vertical."
      />
      <PageContainer className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <Select defaultValue="org" className="max-w-[220px]">
              <option value="org">Escopo organizacional</option>
              <option value="unit">Escopo por setor</option>
              <option value="self">Escopo individual</option>
            </Select>
            <Badge tone="warning">RBAC dinâmico ativo</Badge>
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
