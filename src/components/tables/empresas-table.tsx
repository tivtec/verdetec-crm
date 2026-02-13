"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/tables/data-grid";
import type { Empresa } from "@/schemas/domain";
import { formatDateTime } from "@/utils/format";

const columns: ColumnDef<Empresa>[] = [
  {
    accessorKey: "razao_social",
    header: "Razão social",
  },
  {
    accessorKey: "cnpj",
    header: "CNPJ",
    cell: ({ row }) => row.original.cnpj || "-",
  },
  {
    accessorKey: "vertical",
    header: "Vertical",
    cell: ({ row }) => <Badge tone="info">{row.original.vertical || "Não definida"}</Badge>,
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
];

type EmpresasTableProps = {
  data: Empresa[];
};

export function EmpresasTable({ data }: EmpresasTableProps) {
  return <DataGrid columns={columns} data={data} />;
}
