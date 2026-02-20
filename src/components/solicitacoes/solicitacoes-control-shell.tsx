"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SolicitacaoControleRow = {
  id: string;
  data: string;
  nome: string;
  cep: string;
  cidade: string;
  estado: string;
  metragem: string;
};

type SolicitacoesControlShellProps = {
  initialRows: SolicitacaoControleRow[];
  initialBusca: string;
  currentPage: number;
  hasNextPage: boolean;
};

export function SolicitacoesControlShell({
  initialRows,
  initialBusca,
  currentPage,
  hasNextPage,
}: SolicitacoesControlShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [draftSearch, setDraftSearch] = useState(initialBusca);
  const rows = initialRows;
  const appliedBusca = initialBusca.trim();

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    const busca = draftSearch.trim();

    if (busca.length > 0) {
      searchParams.set("busca", busca);
    }
    searchParams.set("page", "1");

    const query = searchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handlePageChange = (nextPage: number) => {
    const searchParams = new URLSearchParams();
    const busca = appliedBusca;

    if (busca.length > 0) {
      searchParams.set("busca", busca);
    }
    searchParams.set("page", String(Math.max(1, nextPage)));

    const query = searchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[34px] font-semibold text-[#30343a]">Solicitações Time de Negócio</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="solicitacoes-busca"
          name="solicitacoes-busca"
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Nome da empresa ou CEP"
          className="h-10 w-full max-w-[190px] rounded-lg border border-[#d4e6e3] bg-[#c6dfde] px-3 text-sm text-[#2f5153] placeholder:text-[#5f7b7c]"
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
        <table className="w-full min-w-[900px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="bg-[#c6dfde] text-[#244e50]">
              <th className="rounded-l-xl px-4 py-2 text-left text-xs font-medium">Data</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Nome</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Cep</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Cidade</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Estado</th>
              <th className="rounded-r-xl px-4 py-2 text-left text-xs font-medium">Metragem</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="bg-[#eef0f1] text-[#285154]">
                  <td className="rounded-l-xl px-4 py-2.5 text-sm">{row.data}</td>
                  <td className="px-4 py-2.5 text-sm">{row.nome}</td>
                  <td className="px-4 py-2.5 text-sm">{row.cep}</td>
                  <td className="px-4 py-2.5 text-sm">{row.cidade}</td>
                  <td className="px-4 py-2.5 text-sm">{row.estado}</td>
                  <td className="rounded-r-xl px-4 py-2.5 text-sm">{row.metragem}</td>
                </tr>
              ))
            ) : (
              <tr className="bg-[#eef0f1] text-[#4f5f60]">
                <td colSpan={6} className="rounded-xl px-4 py-8 text-center text-sm">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
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
          className="h-10 min-w-[95px] rounded-lg border-0 bg-[#a6dfda] px-4 text-sm font-semibold text-[#244e50] hover:bg-[#97d2cd] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="mr-1 h-4 w-4" />
          Proxima
        </Button>
      </div>
    </div>
  );
}
