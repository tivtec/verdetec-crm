"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ClientesControlFilters } from "@/components/clientes/clientes-control-filters";
import { ClientesControlTable } from "@/components/clientes/clientes-control-table";
import type {
  ClienteControleRow,
  ClienteRepresentanteOption,
  ClientesControlFiltersValue,
} from "@/components/clientes/types";
import { Button } from "@/components/ui/button";

type ClientesControlShellProps = {
  initialRows: ClienteControleRow[];
  representantes: ClienteRepresentanteOption[];
  initialFilters: ClientesControlFiltersValue;
  currentUserId: number | null;
};

const PAGE_SIZE = 10;

export function ClientesControlShell({
  initialRows,
  representantes,
  initialFilters,
  currentUserId,
}: ClientesControlShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [draftFilters, setDraftFilters] = useState<ClientesControlFiltersValue>(initialFilters);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(initialRows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const handleSearch = (next: ClientesControlFiltersValue) => {
    const searchParams = new URLSearchParams();

    if (next.usuario) {
      searchParams.set("usuario", next.usuario);
    }
    if (next.telefone.trim()) {
      searchParams.set("telefone", next.telefone.trim());
    }
    if (next.nome.trim()) {
      searchParams.set("nome", next.nome.trim());
    }
    if (next.etiqueta.trim()) {
      searchParams.set("etiqueta", next.etiqueta.trim());
    }

    const query = searchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setPage(1);
    setSelectedIds([]);
  };

  const handlePageChange = (next: number) => {
    const clampedPage = Math.min(Math.max(next, 1), totalPages);
    setPage(clampedPage);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id],
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ClientesControlFilters
          values={draftFilters}
          representantes={representantes}
          onChange={setDraftFilters}
          onSearch={handleSearch}
        />

        <Button
          type="button"
          className="h-11 min-w-[140px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343]"
        >
          Novo Leads
        </Button>
      </div>

      <ClientesControlTable
        rows={initialRows}
        representantes={representantes}
        page={safePage}
        pageSize={PAGE_SIZE}
        currentUserId={currentUserId}
        selectedIds={selectedIds}
        onPageChange={handlePageChange}
        onToggleSelect={handleToggleSelect}
      />
    </div>
  );
}
