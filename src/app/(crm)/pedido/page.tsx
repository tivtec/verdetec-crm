import { ClipboardPlus, Link2 } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { PedidosTable } from "@/components/tables/pedidos-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPedidos } from "@/services/crm/api";

export default async function PedidoPage() {
  const pedidos = await getPedidos();

  return (
    <>
      <AppHeader title="Pedidos" subtitle="Gestão de compras, orçamentos e integrações externas." />
      <PageContainer className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <Badge tone="success">Integração Supabase</Badge>
            <Badge tone="info">API externa ready</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" className="gap-2">
                <Link2 className="h-4 w-4" />
                Conectar ERP
              </Button>
              <Button className="gap-2">
                <ClipboardPlus className="h-4 w-4" />
                Novo pedido
              </Button>
            </div>
          </CardContent>
        </Card>

        <PedidosTable data={pedidos} />
      </PageContainer>
    </>
  );
}
