"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/tables/data-grid";
import type { Pedido } from "@/schemas/domain";
import { formatCurrency, formatDateTime } from "@/utils/format";

const columns: ColumnDef<Pedido>[] = [
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => row.original.cliente || "Sem vínculo",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge tone="info">{row.original.status}</Badge>,
  },
  {
    accessorKey: "valor_total",
    header: "Valor",
    cell: ({ row }) => formatCurrency(row.original.valor_total),
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
];

type PedidosTableProps = {
  data: Pedido[];
};

export function PedidosTable({ data }: PedidosTableProps) {
  return <DataGrid columns={columns} data={data} />;
}
