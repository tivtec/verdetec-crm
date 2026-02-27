"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCcw, Search, X } from "lucide-react";

type CampanhaRow = {
  id: string;
  nomeCampanha: string;
  apelido: string;
  textoChave: string;
  ativo: boolean;
};

type ApiListResponse = {
  ok?: boolean;
  error?: string;
  rows?: CampanhaRow[];
  currentPage?: number;
  pageSize?: number;
  totalCount?: number | null;
  hasNextPage?: boolean;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
};

type CampanhaForm = {
  nome_campanha: string;
  apelido: string;
  texto_chave: string;
};

type CampanhaStatusFilter = "todos" | "ativo" | "inativo";

const EMPTY_FORM: CampanhaForm = {
  nome_campanha: "",
  apelido: "",
  texto_chave: "",
};

export function CampanhasCadastroShell() {
  const [rows, setRows] = useState<CampanhaRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CampanhaStatusFilter>("todos");

  const [form, setForm] = useState<CampanhaForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const total = useMemo(() => totalCount ?? rows.length, [rows.length, totalCount]);
  const totalPages = useMemo(() => {
    if (typeof totalCount !== "number" || totalCount <= 0) {
      return null;
    }
    return Math.max(1, Math.ceil(totalCount / 10));
  }, [totalCount]);

  const loadRows = async (search: string, page = 1, status: CampanhaStatusFilter = "todos") => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/campanhas/cadastro/list?q=${encodeURIComponent(search.trim())}&page=${page}&page_size=10&ativo=${status}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload = (await response.json().catch(() => null)) as ApiListResponse | null;
      if (!response.ok || !payload?.ok) {
        setRows([]);
        setCurrentPage(page);
        setHasNextPage(false);
        setTotalCount(0);
        setError(payload?.error ?? "Falha ao carregar campanhas.");
        return;
      }

      setRows(Array.isArray(payload.rows) ? payload.rows : []);
      setCurrentPage(typeof payload.currentPage === "number" ? payload.currentPage : page);
      setHasNextPage(Boolean(payload.hasNextPage));
      setTotalCount(typeof payload.totalCount === "number" ? payload.totalCount : null);
    } catch {
      setRows([]);
      setCurrentPage(page);
      setHasNextPage(false);
      setTotalCount(0);
      setError("Erro de rede ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows("", 1, "todos");
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows(query, 1, statusFilter);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [query, statusFilter]);

  useEffect(() => {
    if (!formOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFormOpen(false);
      setFormError(null);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [formOpen]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (row: CampanhaRow) => {
    setForm({
      nome_campanha: row.nomeCampanha || "",
      apelido: row.apelido || "",
      texto_chave: row.textoChave || "",
    });
    setEditingId(row.id);
    setFormError(null);
    setFormOpen(true);
  };

  const saveCampanha = async () => {
    if (!form.nome_campanha.trim() || !form.apelido.trim()) {
      setFormError("Campos obrigatorios: nome da campanha e apelido.");
      return;
    }

    setFormSaving(true);
    setFormError(null);

    try {
      const response = await fetch(editingId ? "/api/campanhas/cadastro/update" : "/api/campanhas/cadastro/create", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          nome_campanha: form.nome_campanha.trim(),
          apelido: form.apelido.trim(),
          texto_chave: form.texto_chave.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !payload?.ok) {
        setFormError(payload?.error ?? "Falha ao cadastrar campanha.");
        return;
      }

      setFormOpen(false);
      setEditingId(null);
      setFeedback(editingId ? "Campanha atualizada com sucesso." : "Campanha cadastrada com sucesso.");
      void loadRows(query, 1, statusFilter);
    } catch {
      setFormError(editingId ? "Erro de rede ao atualizar campanha." : "Erro de rede ao cadastrar campanha.");
    } finally {
      setFormSaving(false);
    }
  };

  const goToPage = (nextPage: number) => {
    const page = Math.max(1, Math.trunc(nextPage));
    void loadRows(query, page, statusFilter);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
      {feedback ? (
        <div className="fixed top-6 right-6 z-[95] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-xl bg-[#e9ebed] p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b737b]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void loadRows(query, 1, statusFilter);
                }
              }}
              placeholder="Buscar por nome, apelido ou texto-chave"
              className="h-11 w-full rounded-xl border border-[#d0d6db] bg-white pl-10 pr-3 text-sm text-[#254247] outline-none transition focus:border-[#66a9a1] focus:ring-2 focus:ring-[#66a9a14a]"
            />
          </div>

          <div className="min-w-[160px]">
            <label htmlFor="campanhas-status-filter" className="sr-only">
              Filtrar por status
            </label>
            <select
              id="campanhas-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CampanhaStatusFilter)}
              className="h-11 w-full rounded-xl border border-[#d0d6db] bg-white px-3 text-sm text-[#254247] outline-none transition focus:border-[#66a9a1] focus:ring-2 focus:ring-[#66a9a14a]"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadRows(query, 1, statusFilter)}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-lg bg-[#0f5050] px-4 text-sm font-semibold text-white"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={() => void loadRows(query, 1, statusFilter)}
            className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-lg bg-[#9ec6c2] px-4 text-sm font-semibold text-[#184c4c]"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="ml-auto inline-flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-lg bg-[#0f7d71] px-4 text-base font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nova campanha
          </button>
        </div>

        <p className="mt-2 text-sm text-[#4d5c64]">
          Mostrando <span className="font-semibold text-[#184c4c]">{total}</span> campanhas
        </p>
      </div>

      {error ? <div className="rounded-lg border border-[#d7b5b5] bg-[#f5e1e1] px-3 py-2 text-sm text-[#7b2323]">{error}</div> : null}

      <div className="min-h-0 flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="min-h-[220px] flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-[#d7dde0] bg-[#f4f6f6] pr-3 [scrollbar-gutter:stable] lg:max-h-[calc(100vh-430px)]">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-[#c8dfde] text-[#0f4e52]">
              <tr>
                <th className="px-3 py-2.5 text-left text-sm font-semibold">Nome da Campanha</th>
                <th className="px-3 py-2.5 text-left text-sm font-semibold">Apelido</th>
                <th className="px-3 py-2.5 text-left text-sm font-semibold">Texto-chave</th>
                <th className="px-3 py-2.5 text-left text-sm font-semibold">Ativo</th>
                <th className="px-3 py-2.5 text-left text-sm font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-t border-[#d8dddf] bg-[#f4f6f6]">
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#466568]">
                    Carregando campanhas...
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#d8dddf] bg-[#f4f6f6]">
                    <td className="px-3 py-3 text-base text-[#1b2930]">{row.nomeCampanha || "-"}</td>
                    <td className="px-3 py-3 text-base text-[#1b2930]">{row.apelido || "-"}</td>
                    <td className="px-3 py-3 text-base text-[#1b2930]">{row.textoChave || "-"}</td>
                    <td className="px-3 py-3 text-base text-[#1b2930]">{row.ativo ? "Sim" : "Nao"}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#dff3f1] text-[#118d82]"
                        title="Editar campanha"
                        aria-label="Editar campanha"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-[#d8dddf] bg-[#f4f6f6]">
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#466568]">
                    Nenhuma campanha encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-[#8cc8c3] px-4 text-sm font-semibold text-[#184f52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          <p className="text-sm text-[#444a4f]">
            Pagina {Math.max(1, currentPage)}
            {typeof totalPages === "number" ? ` de ${totalPages}` : ""}
          </p>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!hasNextPage || loading}
            className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-[#0f5050] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proxima
          </button>
        </div>
      </div>

      {formOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setFormOpen(false);
            setFormError(null);
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-[620px] overflow-hidden rounded-2xl bg-[#f4f6f6] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Editar campanha" : "Nova campanha"}
          >
            <div className="flex items-center justify-between bg-[#0f7d71] px-5 py-3">
              <h3 className="text-2xl font-semibold text-white">{editingId ? "Editar campanha" : "Nova campanha"}</h3>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setEditingId(null);
                  setFormError(null);
                }}
                className="rounded-md p-1 text-white/90 hover:bg-white/10"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block space-y-1">
                <span className="text-sm text-[#1f4f52]">Nome da campanha</span>
                <input
                  value={form.nome_campanha}
                  onChange={(event) => setForm((current) => ({ ...current, nome_campanha: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-[#1f4f52]">Apelido</span>
                <input
                  value={form.apelido}
                  onChange={(event) => setForm((current) => ({ ...current, apelido: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-[#1f4f52]">Texto-chave</span>
                <input
                  value={form.texto_chave}
                  onChange={(event) => setForm((current) => ({ ...current, texto_chave: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                />
              </label>

              {formError ? <p className="text-sm text-[#7b2323]">{formError}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingId(null);
                    setFormError(null);
                  }}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-lg bg-[#d3ece9] px-4 text-base font-semibold text-[#205255]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveCampanha()}
                  disabled={formSaving}
                  className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-lg bg-[#0f8f82] px-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formSaving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Salvar campanha"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
