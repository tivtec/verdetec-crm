"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/tables/data-grid";
import type { AgendaEvent } from "@/schemas/domain";
import { formatDateTime } from "@/utils/format";

const columns: ColumnDef<AgendaEvent>[] = [
  {
    accessorKey: "title",
    header: "Evento",
  },
  {
    accessorKey: "starts_at",
    header: "Início",
    cell: ({ row }) => formatDateTime(row.original.starts_at),
  },
  {
    accessorKey: "ends_at",
    header: "Fim",
    cell: ({ row }) => formatDateTime(row.original.ends_at),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge tone="success">{row.original.status}</Badge>,
  },
];

type AgendaTableProps = {
  data: AgendaEvent[];
};

export function AgendaTable({ data }: AgendaTableProps) {
  return <DataGrid columns={columns} data={data} />;
}
