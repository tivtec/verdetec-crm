"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreVertical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SolicitacaoControleRow = {
  id: string;
  data: string;
  nome: string;
  email: string;
  cep: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  metragem: string;
  empresasReceberam: string[];
};

type SolicitacoesControlShellProps = {
  initialRows: SolicitacaoControleRow[];
  initialBusca: string;
  currentPage: number;
  hasNextPage: boolean;
};

function getDisplayValue(value: string | null | undefined, fallback = "-") {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function SolicitacoesControlShell({
  initialRows,
  initialBusca,
  currentPage,
  hasNextPage,
}: SolicitacoesControlShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [draftSearch, setDraftSearch] = useState(initialBusca);
  const [selectedRow, setSelectedRow] = useState<SolicitacaoControleRow | null>(null);

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
        <h1 className="text-[34px] font-semibold text-[#30343a]">Solicita{"\u00e7\u00f5"}es Time de Neg{"\u00f3"}cios</h1>
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
        <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="bg-[#c6dfde] text-[#244e50]">
              <th className="rounded-l-xl px-4 py-2 text-left text-xs font-medium">Data</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Nome</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Cep</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Cidade</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Metragem</th>
              <th className="rounded-r-xl px-4 py-2 text-right text-xs font-medium">Acoes</th>
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
                  <td className="px-4 py-2.5 text-sm">{row.metragem}</td>
                  <td className="rounded-r-xl px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedRow(row)}
                      className="rounded-md p-1 text-[#1d4d50] hover:bg-[#d9dddf]"
                      aria-label={`Acoes da solicitacao ${row.nome}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="bg-[#eef0f1] text-[#4f5f60]">
                <td colSpan={7} className="rounded-xl px-4 py-8 text-center text-sm">
                  Nenhuma solicitacao encontrada.
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

      {selectedRow ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={() => setSelectedRow(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#1d4d50]/45 bg-[#f4f6f6] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes da solicitacao"
          >
            <div className="flex items-center justify-between border-b border-[#d2d7d9] px-5 py-4 sm:px-6">
              <h2 className="text-2xl font-semibold text-[#1d4d50] sm:text-3xl">Solicita{"\u00e7\u00e3"}o</h2>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
                aria-label="Fechar detalhes da solicitacao"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-[#dde2e4] bg-white p-4">
                  <p className="mb-3 text-lg font-semibold text-[#4d5356]">Dados da solicita{"\u00e7\u00e3"}o</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Nome</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.nome)}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">E-mail</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.email)}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Cep</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.cep)}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Metragem</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.metragem)}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Cidade</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.cidade)}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Estado</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.estado)}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Telefone</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.telefone)}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Whatsapp</p>
                      <div className="rounded-xl bg-[#c8dfde] px-4 py-3 text-base font-semibold text-[#214c50]">
                        {getDisplayValue(selectedRow.whatsapp)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#d8dddf]">
                  <div className="bg-[#c8dfde] px-4 py-3">
                    <h3 className="text-xl font-semibold text-[#1d4d50]">Empresas que receberam o pedido</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto bg-white">
                    {selectedRow.empresasReceberam.length > 0 ? (
                      selectedRow.empresasReceberam.map((empresa, index) => (
                        <div
                          key={`empresa-${selectedRow.id}-${index}`}
                          className="border-t border-[#e3e6e7] px-4 py-3 text-sm font-semibold text-[#2f3538]"
                        >
                          {empresa}
                        </div>
                      ))
                    ) : (
                      <div className="border-t border-[#e3e6e7] px-4 py-3 text-sm text-[#5a5f62]">
                        Nenhuma empresa encontrada no retorno atual da consulta.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
