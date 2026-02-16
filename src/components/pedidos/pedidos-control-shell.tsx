"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";

export type PedidoControleRow = {
  id: string;
  nome: string;
  telefone: string;
  data: string;
  status: string;
};

type PedidosControlShellProps = {
  initialRows: PedidoControleRow[];
};

const PAGE_SIZE = 10;

export function PedidosControlShell({ initialRows }: PedidosControlShellProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(initialRows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const rows = useMemo(
    () => initialRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [initialRows, safePage],
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-4xl font-semibold text-[#30343a]">Solicitações</h1>
      </header>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-[#c6dfde] text-[#1d4d50]">
              <th className="rounded-l-xl px-4 py-2.5 text-left text-sm font-semibold">Nome</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Telefone</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Data</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Status</th>
              <th className="rounded-r-xl px-4 py-2.5 text-right text-sm font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="bg-[#eef0f1] text-[#567275]">
                  <td className="rounded-l-xl px-4 py-3 text-sm">{row.nome || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.telefone || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.data || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.status || "-"}</td>
                  <td className="rounded-r-xl px-4 py-3 text-right">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#4f6668]">
                      <MoreVertical className="h-4 w-4" />
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="bg-[#eef0f1] text-[#567275]">
                <td colSpan={5} className="rounded-xl px-4 py-10 text-center text-sm">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={safePage <= 1}
          className="h-10 min-w-[95px] rounded-lg border-0 bg-[#0f5050] px-4 text-sm font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>

        <p className="text-sm text-[#444a4f]">Página[{safePage}]</p>

        <Button
          type="button"
          size="lg"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={safePage >= totalPages}
          className="h-10 min-w-[95px] rounded-lg border-0 bg-[#0f5050] px-4 text-sm font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="mr-1 h-4 w-4" />
          Próxima
        </Button>
      </div>
    </div>
  );
}