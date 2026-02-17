"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Search, X, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccessMatrixRow, CrmPage } from "@/services/access-control/types";

type GestaoAcessosShellProps = {
  initialRows: AccessMatrixRow[];
  pages: CrmPage[];
  initialSearch: string;
  currentPage: number;
  hasNextPage: boolean;
};

type PendingToggle = {
  idUsuario: number;
  pageKey: string;
  allow: boolean;
};

export function GestaoAcessosShell({
  initialRows,
  pages,
  initialSearch,
  currentPage,
  hasNextPage,
}: GestaoAcessosShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [rows, setRows] = useState<AccessMatrixRow[]>(initialRows);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const pageLabel = useMemo(() => `Pagina ${currentPage}`, [currentPage]);

  const pushFilters = (nextPage: number) => {
    const params = new URLSearchParams();
    const trimmed = search.trim();
    if (trimmed) {
      params.set("search", trimmed);
    }
    params.set("page", String(Math.max(1, nextPage)));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const submitSearch = () => {
    pushFilters(1);
  };

  const updateLocalRow = (idUsuario: number, pageKey: string, allow: boolean) => {
    setRows((current) =>
      current.map((row) =>
        row.idUsuario === idUsuario
          ? {
              ...row,
              acessos: {
                ...row.acessos,
                [pageKey]: allow,
              },
            }
          : row,
      ),
    );
  };

  const executeToggle = async (payload: PendingToggle) => {
    const key = `${payload.idUsuario}:${payload.pageKey}`;
    setSubmittingKey(key);
    setFeedback(null);

    try {
      const response = await fetch("/api/acessos/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: payload.idUsuario,
          page_key: payload.pageKey,
          allow: payload.allow,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        setFeedback(result?.error ?? "Falha ao atualizar acesso.");
        return;
      }

      updateLocalRow(payload.idUsuario, payload.pageKey, payload.allow);
      setFeedback(payload.allow ? "Acesso liberado." : "Acesso bloqueado.");
    } catch {
      setFeedback("Erro de rede ao atualizar acesso.");
    } finally {
      setSubmittingKey(null);
      setPendingToggle(null);
    }
  };

  const requestToggle = (idUsuario: number, pageKey: string, allow: boolean) => {
    if (!allow) {
      setPendingToggle({
        idUsuario,
        pageKey,
        allow,
      });
      return;
    }

    void executeToggle({
      idUsuario,
      pageKey,
      allow,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {feedback ? (
        <div className="rounded-lg border border-[#bad8d4] bg-[#d7ebe8] px-3 py-2 text-sm text-[#184c4c]">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-xl bg-[#e9ebed] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="acl-search" className="sr-only">
            Buscar usuario
          </label>
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b737b]" />
            <input
              id="acl-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="Buscar por nome ou e-mail"
              className="h-11 w-full rounded-xl border border-[#d0d6db] bg-white pl-10 pr-3 text-sm text-[#254247] outline-none transition focus:border-[#66a9a1] focus:ring-2 focus:ring-[#66a9a14a]"
            />
          </div>
          <Button
            type="button"
            onClick={submitSearch}
            className="h-11 min-w-[130px] bg-[var(--brand-primary-soft-hover)] text-white hover:bg-[var(--brand-primary)]"
          >
            Buscar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#d8dde1] bg-[#eceef0]">
        <table className="min-w-[980px] border-separate border-spacing-y-2 px-3 py-2">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 rounded-l-xl bg-[#c6dedd] px-3 py-3 text-left text-base font-semibold text-[#164b4f]">
                Usuario
              </th>
              {pages.map((page) => (
                <th
                  key={page.key}
                  className="bg-[#c6dedd] px-3 py-3 text-center text-sm font-semibold text-[#164b4f]"
                >
                  {page.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, pages.length + 1)}
                  className="rounded-xl bg-[#f0f2f3] px-3 py-8 text-center text-[#4e6971]"
                >
                  Nenhum usuario ativo encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.idUsuario}>
                  <td className="sticky left-0 z-10 rounded-l-xl bg-[#f5f6f7] px-3 py-3 text-left align-middle">
                    <p className="text-sm font-semibold text-[#1f4950]">{row.nome}</p>
                    <p className="text-xs text-[#6a7f85]">{row.email ?? "-"}</p>
                    <p className="text-xs text-[#6a7f85]">{row.tipoAcesso ?? "-"}</p>
                  </td>
                  {pages.map((page) => {
                    const allowed = row.acessos[page.key] !== false;
                    const toggleKey = `${row.idUsuario}:${page.key}`;
                    const isSubmitting = submittingKey === toggleKey;
                    return (
                      <td key={`${row.idUsuario}:${page.key}`} className="bg-[#f5f6f7] px-2 py-3 text-center">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => requestToggle(row.idUsuario, page.key, !allowed)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition hover:border-[#9dc5c1] hover:bg-[#e6f2f0] disabled:cursor-not-allowed disabled:opacity-50"
                          title={allowed ? "Bloquear acesso" : "Liberar acesso"}
                          aria-label={allowed ? "Bloquear acesso" : "Liberar acesso"}
                        >
                          {allowed ? (
                            <CheckCircle2 className="h-5 w-5 text-[#1f8d54]" />
                          ) : (
                            <XCircle className="h-5 w-5 text-[#bf455f]" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => pushFilters(currentPage - 1)}
          className="h-10 min-w-[110px] rounded-lg border-0 bg-[#9ec6c2] px-4 text-sm font-semibold text-[#184c4c] hover:bg-[#89bbb5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>

        <p className="text-sm text-[#444a4f]">{pageLabel}</p>

        <Button
          type="button"
          variant="secondary"
          disabled={!hasNextPage}
          onClick={() => pushFilters(currentPage + 1)}
          className="h-10 min-w-[110px] rounded-lg border-0 bg-[#0f5050] px-4 text-sm font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="mr-1 h-4 w-4" />
          Proxima
        </Button>
      </div>

      {pendingToggle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#f3f4f6] p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe9e9]">
                <AlertTriangle className="h-6 w-6 text-[#d84e62]" />
              </div>
              <button
                type="button"
                onClick={() => setPendingToggle(null)}
                className="rounded-md p-1 text-[#6f7a80] transition hover:bg-white hover:text-[#2b3a40]"
                aria-label="Fechar modal de confirmacao"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="text-2xl font-semibold text-[#2f3338]">Bloquear acesso</h3>
            <p className="mt-2 text-sm text-[#4f5f66]">
              Confirma o bloqueio desta pagina para o usuario selecionado?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setPendingToggle(null)}
                className="h-11 rounded-xl bg-[#c8dbd9] text-[#1d5053] hover:bg-[#b8cfcc]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void executeToggle(pendingToggle)}
                className="h-11 rounded-xl bg-[#d84e62] text-white hover:bg-[#c03f54]"
              >
                Bloquear
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
