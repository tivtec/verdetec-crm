"use client";
/* eslint-disable react-hooks/incompatible-library */

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableHead,
  TableWrapper,
  TD,
  TH,
} from "@/components/ui/table";

type DataGridProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
};

export function DataGrid<TData>({ columns, data }: DataGridProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TableWrapper>
      <Table>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TH key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TH>
              ))}
            </tr>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TD key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TD>
              ))}
            </tr>
          ))}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
