"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/tables/data-grid";
import type { Cliente } from "@/schemas/domain";
import { formatDateTime } from "@/utils/format";

const columns: ColumnDef<Cliente>[] = [
  {
    accessorKey: "nome",
    header: "Cliente",
  },
  {
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => row.original.telefone || "-",
  },
  {
    accessorKey: "etiqueta",
    header: "Etiqueta",
    cell: ({ row }) => <Badge tone="warning">{row.original.etiqueta || "Sem etiqueta"}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge tone="success">{row.original.status}</Badge>,
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
];

type ClientesTableProps = {
  data: Cliente[];
};

export function ClientesTable({ data }: ClientesTableProps) {
  return <DataGrid columns={columns} data={data} />;
}
