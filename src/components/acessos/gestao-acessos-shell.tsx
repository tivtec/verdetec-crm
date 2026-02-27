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

type AccessManagementTab = "pages" | "modules";

type GestaoAcessosShellProps = {
  initialRows: AccessMatrixRow[];
  pages: CrmPage[];
  modules: AccessModuleOption[];
  initialModuleId?: string;
  initialTab: AccessManagementTab;
  organizations: AccessOrganizationOption[];
  selectedOrganizationId: string;
  initialSearch: string;
  currentPage: number;
  hasNextPage: boolean;
};

type PendingToggle = {
  kind: "page" | "module";
  idUsuario: number;
  targetId: string;
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

type ToggleModuleResponse = {
  ok?: boolean;
  error?: string;
  access?: {
    moduleId?: string;
    allow?: boolean;
    acessos?: Record<string, boolean>;
  };
};

function resolveInitialModuleId(modules: AccessModuleOption[], requested?: string) {
  if (requested && modules.some((item) => item.id === requested)) {
    return requested;
  }
  return modules[0]?.id ?? "";
}

function normalizeTab(value: AccessManagementTab | string | undefined): AccessManagementTab {
  if (value === "modules") {
    return "modules";
  }
  return "pages";
}

export function GestaoAcessosShell({
  initialRows,
  pages,
  modules,
  initialModuleId,
  initialTab,
  organizations,
  selectedOrganizationId,
  initialSearch,
  currentPage,
  hasNextPage,
}: GestaoAcessosShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccessManagementTab>(normalizeTab(initialTab));
  const [search, setSearch] = useState(initialSearch);
  const [rows, setRows] = useState<AccessMatrixRow[]>(initialRows);
  const [organizationId, setOrganizationId] = useState(selectedOrganizationId);
  const [moduleId, setModuleId] = useState(resolveInitialModuleId(modules, initialModuleId));
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

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

  const moduleById = useMemo(
    () => new Map(modules.map((moduleOption) => [moduleOption.id, moduleOption])),
    [modules],
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
    const dynamicColumns = activeTab === "modules" ? modules.length : modulePages.length;
    const columns = dynamicColumns + 1;
    return Math.max(980, columns * 160);
  }, [activeTab, modulePages.length, modules.length]);

  const pushFilters = (args?: {
    nextPage?: number;
    nextOrganizationId?: string;
    nextModuleId?: string;
    nextSearch?: string;
    nextTab?: AccessManagementTab;
  }) => {
    const params = new URLSearchParams();
    const targetTab = args?.nextTab ?? activeTab;
    const trimmedSearch = (args?.nextSearch ?? search).trim();
    const orgId = (args?.nextOrganizationId ?? organizationId).trim();
    const modId = (args?.nextModuleId ?? moduleId).trim();
    const nextPage = Math.max(1, Math.trunc(args?.nextPage ?? currentPage));

    params.set("tab", targetTab);
    if (orgId) {
      params.set("org_id", orgId);
    }

    if (targetTab === "pages" && modId) {
      params.set("module_id", modId);
    }

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }

    params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const submitSearch = () => {
    pushFilters({
      nextPage: 1,
      nextTab: activeTab,
    });
  };

  const handleTabChange = (nextTab: AccessManagementTab) => {
    if (nextTab === activeTab) {
      return;
    }
    setActiveTab(nextTab);
    pushFilters({
      nextPage: 1,
      nextTab,
    });
  };

  const patchLocalRowAcessos = (idUsuario: number, acessosPatch: Record<string, boolean>) => {
    setRows((current) =>
      current.map((row) =>
        row.idUsuario === idUsuario
          ? {
              ...row,
              acessos: {
                ...row.acessos,
                ...acessosPatch,
              },
            }
          : row,
      ),
    );
  };

  const updateLocalRowPage = (idUsuario: number, pageKey: string, allow: boolean) => {
    patchLocalRowAcessos(idUsuario, {
      [pageKey]: allow,
    });
  };

  const updateLocalRowModule = (idUsuario: number, targetModuleId: string, allow: boolean) => {
    const targetModule = moduleById.get(targetModuleId);
    if (!targetModule || targetModule.pageKeys.length === 0) {
      return;
    }

    const acessosPatch: Record<string, boolean> = {};
    for (const pageKey of targetModule.pageKeys) {
      acessosPatch[pageKey] = allow;
    }
    patchLocalRowAcessos(idUsuario, acessosPatch);
  };

  const executeToggle = async (payload: PendingToggle) => {
    const key = `${payload.idUsuario}:${payload.kind}:${payload.targetId}`;
    setSubmittingKey(key);
    setFeedback(null);

    try {
      if (payload.kind === "page") {
        const response = await fetch("/api/acessos/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_usuario: payload.idUsuario,
            page_key: payload.targetId,
            allow: payload.allow,
            org_id: organizationId,
          }),
        });

        const result = (await response.json().catch(() => null)) as TogglePageResponse | null;
        if (!response.ok || !result?.ok) {
          setFeedback(result?.error ?? "Falha ao atualizar acesso da pagina.");
          return;
        }

        const patchKey = result.access?.pageKey ?? payload.targetId;
        const patchAllow = result.access?.allow ?? payload.allow;
        updateLocalRowPage(payload.idUsuario, patchKey, patchAllow);
        setFeedback(payload.allow ? "Acesso liberado." : "Acesso bloqueado.");
        return;
      }

      const response = await fetch("/api/acessos/toggle-modulo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: payload.idUsuario,
          module_id: payload.targetId,
          allow: payload.allow,
          org_id: organizationId,
        }),
      });

      const result = (await response.json().catch(() => null)) as ToggleModuleResponse | null;
      if (!response.ok || !result?.ok) {
        setFeedback(result?.error ?? "Falha ao atualizar acesso do modulo.");
        return;
      }

      const patchModuleId = result.access?.moduleId ?? payload.targetId;
      const patchAllow = result.access?.allow ?? payload.allow;
      const patchMap = result.access?.acessos;

      if (patchMap && typeof patchMap === "object") {
        patchLocalRowAcessos(payload.idUsuario, patchMap);
      } else {
        updateLocalRowModule(payload.idUsuario, patchModuleId, patchAllow);
      }

      setFeedback(payload.allow ? "Modulo liberado." : "Modulo bloqueado.");
      router.refresh();
      window.setTimeout(() => {
        router.refresh();
      }, 450);
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("modules")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "modules"
              ? "bg-[#0f5050] text-white"
              : "bg-[#9ec6c2] text-[#184c4c] hover:bg-[#89bbb5]"
          }`}
        >
          Gestão de módulos
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("pages")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "pages"
              ? "bg-[#0f5050] text-white"
              : "bg-[#9ec6c2] text-[#184c4c] hover:bg-[#89bbb5]"
          }`}
        >
          Gestão de páginas
        </button>
      </div>

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
                pushFilters({
                  nextPage: 1,
                  nextOrganizationId: nextOrgId,
                });
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

          {activeTab === "pages" ? (
            <>
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
                    pushFilters({
                      nextPage: 1,
                      nextModuleId,
                    });
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
            </>
          ) : (
            <>
              <label htmlFor="acl-search-modules" className="sr-only">
                Buscar usuario por nome
              </label>
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b737b]" />
                <input
                  id="acl-search-modules"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitSearch();
                    }
                  }}
                  placeholder="Buscar por nome do usuario"
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
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 max-h-[calc(100dvh-360px)] flex-1 overflow-auto rounded-xl border border-[#d8dde1] bg-[#eceef0]">
        <table className="w-full border-separate border-spacing-y-2 px-3 py-2" style={{ minWidth: `${tableMinWidth}px` }}>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 rounded-l-xl bg-[#c6dedd] px-3 py-3 text-left text-base font-semibold text-[#164b4f]">
                Usuario
              </th>
              {activeTab === "pages"
                ? modulePages.map((page) => (
                    <th
                      key={page.key}
                      className="sticky top-0 z-20 bg-[#c6dedd] px-3 py-3 text-center text-sm font-semibold text-[#164b4f]"
                    >
                      {page.label}
                    </th>
                  ))
                : modules.map((moduleOption) => (
                    <th
                      key={moduleOption.id}
                      className="sticky top-0 z-20 bg-[#c6dedd] px-3 py-3 text-center text-sm font-semibold text-[#164b4f]"
                    >
                      {moduleOption.nome}
                    </th>
                  ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, (activeTab === "pages" ? modulePages.length : modules.length) + 1)}
                  className="rounded-xl bg-[#f0f2f3] px-3 py-8 text-center text-[#4e6971]"
                >
                  Nenhum usuario ativo encontrado.
                </td>
              </tr>
            ) : activeTab === "pages" && modulePages.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, modulePages.length + 1)}
                  className="rounded-xl bg-[#f0f2f3] px-3 py-8 text-center text-[#4e6971]"
                >
                  O modulo selecionado nao possui paginas configuradas.
                </td>
              </tr>
            ) : activeTab === "modules" && modules.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="rounded-xl bg-[#f0f2f3] px-3 py-8 text-center text-[#4e6971]"
                >
                  Nenhum modulo ativo encontrado.
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

                  {activeTab === "pages"
                    ? modulePages.map((page) => {
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
                                  kind: "page",
                                  idUsuario: row.idUsuario,
                                  targetId: page.key,
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
                      })
                    : modules.map((moduleOption) => {
                        const hasPageBindings = moduleOption.pageKeys.length > 0;
                        const allowed =
                          hasPageBindings &&
                          moduleOption.pageKeys.every((pageKey) => row.acessos[pageKey] !== false);
                        const toggleKey = `${row.idUsuario}:module:${moduleOption.id}`;
                        const isSubmitting = submittingKey === toggleKey;
                        const isDisabled = !hasPageBindings || isSubmitting;
                        return (
                          <td key={toggleKey} className="bg-[#f5f6f7] px-2 py-3 text-center">
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() =>
                                requestToggle({
                                  kind: "module",
                                  idUsuario: row.idUsuario,
                                  targetId: moduleOption.id,
                                  allow: !allowed,
                                  label: moduleOption.nome,
                                })
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition hover:border-[#9dc5c1] hover:bg-[#e6f2f0] disabled:cursor-not-allowed disabled:opacity-50"
                              title={
                                !hasPageBindings
                                  ? "Modulo sem paginas configuradas"
                                  : allowed
                                    ? "Bloquear modulo"
                                    : "Liberar modulo"
                              }
                              aria-label={
                                !hasPageBindings
                                  ? "Modulo sem paginas configuradas"
                                  : allowed
                                    ? "Bloquear modulo"
                                    : "Liberar modulo"
                              }
                            >
                              {allowed ? (
                                <CheckCircle2 className="h-5 w-5 text-[#1f8d54]" />
                              ) : (
                                <XCircle className={`h-5 w-5 ${hasPageBindings ? "text-[#bf455f]" : "text-[#9ba8ae]"}`} />
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
          onClick={() =>
            pushFilters({
              nextPage: currentPage - 1,
            })
          }
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
          onClick={() =>
            pushFilters({
              nextPage: currentPage + 1,
            })
          }
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
