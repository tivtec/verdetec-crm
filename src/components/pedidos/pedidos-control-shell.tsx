"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PedidoControleRow = {
  id: string;
  data: string;
  nome: string;
  cep: string;
  cidade: string;
  estado: string;
  metragem: string;
  status: string;
};

export type PedidosControlFiltersValue = {
  nome: string;
  cep: string;
};

type PedidosControlShellProps = {
  initialRows: PedidoControleRow[];
  initialFilters: PedidosControlFiltersValue;
  currentPage: number;
  hasNextPage: boolean;
};

function buildPedidosQuery(filters: PedidosControlFiltersValue, page: number) {
  const searchParams = new URLSearchParams();
  const nome = filters.nome.trim();
  const cep = filters.cep.trim();

  if (nome.length > 0) {
    searchParams.set("nome", nome);
  }

  if (cep.length > 0) {
    searchParams.set("cep", cep);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  return searchParams.toString();
}

export function PedidosControlShell({
  initialRows,
  initialFilters,
  currentPage,
  hasNextPage,
}: PedidosControlShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [draftFilters, setDraftFilters] = useState<PedidosControlFiltersValue>(initialFilters);

  const handleSearch = () => {
    const query = buildPedidosQuery(draftFilters, 1);
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.trunc(nextPage));
    const query = buildPedidosQuery(initialFilters, safePage);
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-4xl font-semibold text-[#30343a]">Solicitacoes</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="pedidos-nome"
          name="pedidos-nome"
          value={draftFilters.nome}
          onChange={(event) => setDraftFilters((current) => ({ ...current, nome: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Nome"
          className="h-10 w-full max-w-[220px] rounded-lg border border-[#d4e6e3] bg-[#c6dfde] px-3 text-sm text-[#2f5153] placeholder:text-[#5f7b7c]"
        />
        <Input
          id="pedidos-cep"
          name="pedidos-cep"
          value={draftFilters.cep}
          onChange={(event) => setDraftFilters((current) => ({ ...current, cep: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="CEP"
          className="h-10 w-full max-w-[220px] rounded-lg border border-[#d4e6e3] bg-[#c6dfde] px-3 text-sm text-[#2f5153] placeholder:text-[#5f7b7c]"
        />
        <Button
          type="button"
          onClick={handleSearch}
          className="h-10 min-w-[100px] rounded-lg border-0 bg-[#5f9f92] px-6 text-sm font-semibold text-white hover:bg-[#528e83]"
        >
          Buscar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-[#c6dfde] text-[#1d4d50]">
              <th className="rounded-l-xl px-4 py-2.5 text-left text-sm font-semibold">Data</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Nome</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Cep</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Cidade</th>
              <th className="px-4 py-2.5 text-left text-sm font-semibold">Estado</th>
              <th className="rounded-r-xl px-4 py-2.5 text-left text-sm font-semibold">Metragem</th>
            </tr>
          </thead>
          <tbody>
            {initialRows.length > 0 ? (
              initialRows.map((row) => (
                <tr key={row.id} className="bg-[#eef0f1] text-[#567275]">
                  <td className="rounded-l-xl px-4 py-3 text-sm">{row.data || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.nome || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.cep || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.cidade || "-"}</td>
                  <td className="px-4 py-3 text-sm">{row.estado || "-"}</td>
                  <td className="rounded-r-xl px-4 py-3 text-sm">{row.metragem || "-"}</td>
                </tr>
              ))
            ) : (
              <tr className="bg-[#eef0f1] text-[#567275]">
                <td colSpan={6} className="rounded-xl px-4 py-10 text-center text-sm">
                  Nenhuma solicitacao encontrada.
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
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-10 min-w-[95px] rounded-lg border-0 bg-[#0f5050] px-4 text-sm font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>

        <p className="text-sm text-[#444a4f]">Pagina[{currentPage}]</p>

        <Button
          type="button"
          size="lg"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="h-10 min-w-[95px] rounded-lg border-0 bg-[#0f5050] px-4 text-sm font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="mr-1 h-4 w-4" />
          Proxima
        </Button>
      </div>
    </div>
  );
}
