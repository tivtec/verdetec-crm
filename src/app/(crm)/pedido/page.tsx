import { PedidosControlShell } from "@/components/pedidos/pedidos-control-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getPedidosControleRows } from "@/services/crm/api";

export default async function PedidoPage() {
  const rows = await getPedidosControleRows({ limit: 0, offset: 0 });

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-[calc(100dvh-180px)] overflow-auto">
          <PedidosControlShell initialRows={rows} />
        </div>
      </div>
    </PageContainer>
  );
}
