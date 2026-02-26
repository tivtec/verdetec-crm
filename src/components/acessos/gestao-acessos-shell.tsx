"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Search, X, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  AccessMatrixRow,
  AccessModuleOption,
  AccessOrganizationOption,
  CrmPage,
} from "@/services/access-control/types";

type GestaoAcessosShellProps = {
  initialRows: AccessMatrixRow[];
  pages: CrmPage[];
  modules: AccessModuleOption[];
  initialModuleId?: string;
  organizations: AccessOrganizationOption[];
  selectedOrganizationId: string;
  initialSearch: string;
  currentPage: number;
  hasNextPage: boolean;
};

type PendingToggle = {
  idUsuario: number;
  pageKey: string;
  allow: boolean;
  label: string;
};

type TogglePageResponse = {
  ok?: boolean;
  error?: string;
  access?: {
    pageKey?: string;
    allow?: boolean;
  };
};

function resolveInitialModuleId(modules: AccessModuleOption[], requested?: string) {
  if (requested && modules.some((item) => item.id === requested)) {
    return requested;
  }
  return modules[0]?.id ?? "";
}

export function GestaoAcessosShell({
  initialRows,
  pages,
  modules,
  initialModuleId,
  organizations,
  selectedOrganizationId,
  initialSearch,
  currentPage,
  hasNextPage,
}: GestaoAcessosShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [rows, setRows] = useState<AccessMatrixRow[]>(initialRows);
  const [organizationId, setOrganizationId] = useState(selectedOrganizationId);
  const [moduleId, setModuleId] = useState(resolveInitialModuleId(modules, initialModuleId));
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
    setOrganizationId(selectedOrganizationId);
  }, [selectedOrganizationId]);

  useEffect(() => {
    setModuleId(resolveInitialModuleId(modules, initialModuleId));
  }, [initialModuleId, modules]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const selectedModule = useMemo(
    () => modules.find((item) => item.id === moduleId) ?? null,
    [moduleId, modules],
  );

  const modulePages = useMemo(() => {
    if (!selectedModule) {
      return pages;
    }
    const pageKeys = new Set(selectedModule.pageKeys);
    return pages.filter((page) => pageKeys.has(page.key));
  }, [pages, selectedModule]);

  const pageLabel = useMemo(() => `Pagina ${currentPage}`, [currentPage]);
  const tableMinWidth = useMemo(() => {
    const columns = modulePages.length + 1;
    return Math.max(980, columns * 160);
  }, [modulePages.length]);

  const pushFilters = (nextPage: number, nextOrganizationId?: string, nextModuleId?: string) => {
    const params = new URLSearchParams();
    const trimmed = search.trim();
    const orgId = (nextOrganizationId ?? organizationId).trim();
    const modId = (nextModuleId ?? moduleId).trim();
    if (orgId) {
      params.set("org_id", orgId);
    }
    if (modId) {
      params.set("module_id", modId);
    }
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
    const key = `${payload.idUsuario}:page:${payload.pageKey}`;
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
          org_id: organizationId,
        }),
      });

      const result = (await response.json().catch(() => null)) as TogglePageResponse | null;
      if (!response.ok || !result?.ok) {
        setFeedback(result?.error ?? "Falha ao atualizar acesso da pagina.");
        return;
      }

      const patchKey = result.access?.pageKey ?? payload.pageKey;
      const patchAllow = result.access?.allow ?? payload.allow;
      updateLocalRow(payload.idUsuario, patchKey, patchAllow);
      setFeedback(payload.allow ? "Acesso liberado." : "Acesso bloqueado.");
    } catch {
      setFeedback("Erro de rede ao atualizar acesso.");
    } finally {
      setSubmittingKey(null);
      setPendingToggle(null);
    }
  };

  const requestToggle = (payload: PendingToggle) => {
    if (!payload.allow) {
      setPendingToggle(payload);
      return;
    }
    void executeToggle(payload);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {feedback ? (
        <div className="rounded-lg border border-[#bad8d4] bg-[#d7ebe8] px-3 py-2 text-sm text-[#184c4c]">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-xl bg-[#e9ebed] p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px]">
            <label htmlFor="acl-org" className="mb-1 block text-xs font-medium text-[#4a6169]">
              Organizacao
            </label>
            <select
              id="acl-org"
              value={organizationId}
              onChange={(event) => {
                const nextOrgId = event.target.value;
                setOrganizationId(nextOrgId);
                pushFilters(1, nextOrgId);
              }}
              className="h-11 w-full rounded-xl border border-[#d0d6db] bg-white px-3 text-sm text-[#254247] outline-none transition focus:border-[#66a9a1] focus:ring-2 focus:ring-[#66a9a14a]"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[260px]">
            <label htmlFor="acl-module" className="mb-1 block text-xs font-medium text-[#4a6169]">
              Modulo
            </label>
            <select
              id="acl-module"
              value={moduleId}
              onChange={(event) => {
                const nextModuleId = event.target.value;
                setModuleId(nextModuleId);
                pushFilters(1, undefined, nextModuleId);
              }}
              className="h-11 w-full rounded-xl border border-[#d0d6db] bg-white px-3 text-sm text-[#254247] outline-none transition focus:border-[#66a9a1] focus:ring-2 focus:ring-[#66a9a14a]"
            >
              {modules.map((moduleOption) => (
                <option key={moduleOption.id} value={moduleOption.id}>
                  {moduleOption.nome}
                </option>
              ))}
            </select>
          </div>

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
            className="h-11 min-w-[130px] bg-[var(--brand-primary)] text-white hover:bg-[#2d8458]"
          >
            Buscar
          </Button>
        </div>
      </div>

      <div className="min-h-0 max-h-[calc(100dvh-360px)] flex-1 overflow-auto rounded-xl border border-[#d8dde1] bg-[#eceef0]">
        <table className="w-full border-separate border-spacing-y-2 px-3 py-2" style={{ minWidth: `${tableMinWidth}px` }}>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 rounded-l-xl bg-[#c6dedd] px-3 py-3 text-left text-base font-semibold text-[#164b4f]">
                Usuario
              </th>
              {modulePages.map((page) => (
                <th
                  key={page.key}
                  className="sticky top-0 z-20 bg-[#c6dedd] px-3 py-3 text-center text-sm font-semibold text-[#164b4f]"
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
                  colSpan={Math.max(1, modulePages.length + 1)}
                  className="rounded-xl bg-[#f0f2f3] px-3 py-8 text-center text-[#4e6971]"
                >
                  Nenhum usuario ativo encontrado.
                </td>
              </tr>
            ) : modulePages.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, modulePages.length + 1)}
                  className="rounded-xl bg-[#f0f2f3] px-3 py-8 text-center text-[#4e6971]"
                >
                  O modulo selecionado nao possui paginas configuradas.
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

                  {modulePages.map((page) => {
                    const allowed = row.acessos[page.key] !== false;
                    const toggleKey = `${row.idUsuario}:page:${page.key}`;
                    const isSubmitting = submittingKey === toggleKey;
                    return (
                      <td key={toggleKey} className="bg-[#f5f6f7] px-2 py-3 text-center">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() =>
                            requestToggle({
                              idUsuario: row.idUsuario,
                              pageKey: page.key,
                              allow: !allowed,
                              label: page.label,
                            })
                          }
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
              Confirma o bloqueio de{" "}
              <span className="font-semibold text-[#2f3338]">{pendingToggle.label}</span>{" "}
              para o usuario selecionado?
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
