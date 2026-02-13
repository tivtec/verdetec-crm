"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/tables/data-grid";

export type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  role: string;
  scope: "org" | "unit" | "self";
  unit: string;
};

const columns: ColumnDef<UsuarioRow>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "role",
    header: "Perfil",
    cell: ({ row }) => <Badge tone="info">{row.original.role}</Badge>,
  },
  {
    accessorKey: "scope",
    header: "Escopo",
    cell: ({ row }) => <Badge tone="warning">{row.original.scope}</Badge>,
  },
  {
    accessorKey: "unit",
    header: "Setor/Vertical",
  },
];

type UsuariosTableProps = {
  data: UsuarioRow[];
};

export function UsuariosTable({ data }: UsuariosTableProps) {
  return <DataGrid columns={columns} data={data} />;
}
