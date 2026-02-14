"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
  type ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
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
  pageSize?: number;
};

export function DataGrid<TData>({
  columns,
  data,
  pageSize = 10,
}: DataGridProps<TData>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalRows = table.getPrePaginationRowModel().rows.length;
  const pageCount = table.getPageCount();
  const pageNumber = pageCount === 0 ? 0 : table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-3">
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TD key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TD>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <TD className="py-10 text-center text-slate-500" colSpan={columns.length}>
                  Nenhum registro encontrado.
                </TD>
              </tr>
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          {totalRows} registro(s) - pagina {pageNumber} de {pageCount || 0}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}
