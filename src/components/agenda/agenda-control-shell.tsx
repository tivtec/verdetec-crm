"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, MoreVertical, X } from "lucide-react";

import type { AgendaControleRow } from "@/components/agenda/types";
import { Button } from "@/components/ui/button";

type AgendaRepresentanteOption = {
  id: number;
  nome: string;
};

type AgendaControlShellProps = {
  initialRows: AgendaControleRow[];
  representantes?: AgendaRepresentanteOption[];
};

const PAGE_SIZE = 10;
const MOCK_VERTICAL_ID = "0ec7796e-16d8-469f-a098-6c33063d7384";

type AgendaFilters = {
  representante: string;
  dataInicio: string;
  dataFim: string;
};

type HorarioRow = {
  id: string;
  dataInicio: string;
  dataInicioIso: string;
  representantes: string;
};

type HorariosApiResponse = {
  ok?: boolean;
  rows?: HorarioRow[];
  error?: string;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function hasRepresentanteFilter(value: string) {
  const normalized = normalizeName(value);
  return normalized.length > 0 && normalized !== "selecione";
}

function parseAgendaDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const normalizedTimezone = value.replace(/([+-]\d{2})$/, "$1:00");
  const parsedNormalizedTimezone = new Date(normalizedTimezone);
  if (!Number.isNaN(parsedNormalizedTimezone.getTime())) {
    return parsedNormalizedTimezone;
  }

  const brazilianFormat = value.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (brazilianFormat) {
    const [, dd, mm, yyyy, hh = "00", mi = "00"] = brazilianFormat;
    const parsedBrazilian = new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00`);
    if (!Number.isNaN(parsedBrazilian.getTime())) {
      return parsedBrazilian;
    }
  }

  return null;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDefaultDateRangeFilters(): AgendaFilters {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  return {
    representante: "",
    dataInicio: formatInputDate(startDate),
    dataFim: formatInputDate(endDate),
  };
}

function mapAgendaRowsToHorarios(rows: AgendaControleRow[]): HorarioRow[] {
  return rows.map((row) => ({
    id: row.id,
    dataInicio: row.inicioReuniao,
    dataInicioIso: row.inicioReuniaoIso,
    representantes: row.representante,
  }));
}

export function AgendaControlShell({ initialRows, representantes = [] }: AgendaControlShellProps) {
  const [activeTab, setActiveTab] = useState<"agendamentos" | "horarios">("agendamentos");
  const [draftFilters, setDraftFilters] = useState<AgendaFilters>(() => buildDefaultDateRangeFilters());
  const [appliedFilters, setAppliedFilters] = useState<AgendaFilters>(() => buildDefaultDateRangeFilters());
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRepresentante, setNewRepresentante] = useState("");
  const [newInicioReuniao, setNewInicioReuniao] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const [horarioRows, setHorarioRows] = useState<HorarioRow[]>(() => mapAgendaRowsToHorarios(initialRows));
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [horariosError, setHorariosError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
        setModalError(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isCreateModalOpen]);

  const representanteOptions = useMemo(() => {
    const source =
      representantes.length > 0 ? representantes.map((item) => item.nome) : initialRows.map((row) => row.representante);

    return Array.from(new Set(source.map((value) => value.trim()).filter((value) => value.length > 0))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [representantes, initialRows]);

  const representanteIdByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of representantes) {
      const key = normalizeName(item.nome);
      if (!key || map.has(key)) {
        continue;
      }
      map.set(key, item.id);
    }
    return map;
  }, [representantes]);

  const fetchHorarios = useCallback(
    async (filters: AgendaFilters) => {
      const selectedName = filters.representante.trim();
      const selectedUserId = hasRepresentanteFilter(selectedName)
        ? (representanteIdByName.get(normalizeName(selectedName)) ?? 0)
        : 0;

      setIsLoadingHorarios(true);
      setHorariosError(null);

      try {
        const response = await fetch("/api/agenda/horarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_usuario: selectedUserId,
            data_inicio: filters.dataInicio,
            data_fim: filters.dataFim,
            limit: 0,
            offset: 0,
            id_vertical: MOCK_VERTICAL_ID,
          }),
        });

        const payload = (await response.json().catch(() => null)) as HorariosApiResponse | null;

        if (!response.ok || !payload?.ok) {
          setHorarioRows([]);
          setHorariosError(payload?.error ?? "Falha ao carregar horarios.");
          return;
        }

        setHorarioRows(Array.isArray(payload.rows) ? payload.rows : []);
      } catch {
        setHorarioRows([]);
        setHorariosError("Erro de rede ao carregar horarios.");
      } finally {
        setIsLoadingHorarios(false);
      }
    },
    [representanteIdByName],
  );

  useEffect(() => {
    if (activeTab !== "horarios") {
      return;
    }

    void fetchHorarios(appliedFilters);
  }, [activeTab, appliedFilters, fetchHorarios]);

  const filteredAgendaRows = useMemo(() => {
    return initialRows.filter((row) => {
      const selectedRepresentante = appliedFilters.representante.trim();

      if (
        hasRepresentanteFilter(selectedRepresentante) &&
        row.representante.trim().toLowerCase() !== selectedRepresentante.toLowerCase()
      ) {
        return false;
      }

      const startsAt = parseAgendaDate(row.inicioReuniaoIso) ?? parseAgendaDate(row.inicioReuniao);
      if (!startsAt) {
        return true;
      }

      if (appliedFilters.dataInicio) {
        const startLimit = new Date(`${appliedFilters.dataInicio}T00:00:00`);
        if (!Number.isNaN(startLimit.getTime()) && startsAt < startLimit) {
          return false;
        }
      }

      if (appliedFilters.dataFim) {
        const endLimit = new Date(`${appliedFilters.dataFim}T23:59:59.999`);
        if (!Number.isNaN(endLimit.getTime()) && startsAt > endLimit) {
          return false;
        }
      }

      return true;
    });
  }, [appliedFilters, initialRows]);

  const filteredHorarioRows = useMemo(() => {
    return horarioRows.filter((row) => {
      const selectedRepresentante = appliedFilters.representante.trim();
      if (
        hasRepresentanteFilter(selectedRepresentante) &&
        !row.representantes.toLowerCase().includes(selectedRepresentante.toLowerCase())
      ) {
        return false;
      }

      const startsAt = parseAgendaDate(row.dataInicioIso) ?? parseAgendaDate(row.dataInicio);
      if (!startsAt) {
        return true;
      }

      if (appliedFilters.dataInicio) {
        const startLimit = new Date(`${appliedFilters.dataInicio}T00:00:00`);
        if (!Number.isNaN(startLimit.getTime()) && startsAt < startLimit) {
          return false;
        }
      }

      if (appliedFilters.dataFim) {
        const endLimit = new Date(`${appliedFilters.dataFim}T23:59:59.999`);
        if (!Number.isNaN(endLimit.getTime()) && startsAt > endLimit) {
          return false;
        }
      }

      return true;
    });
  }, [appliedFilters, horarioRows]);

  const totalItems = activeTab === "agendamentos" ? filteredAgendaRows.length : filteredHorarioRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageAgendaRows = filteredAgendaRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageHorarioRows = filteredHorarioRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(clamped);
  };

  const handleOpenCreateModal = () => {
    setNewRepresentante("");
    setNewInicioReuniao("");
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setModalError(null);
  };

  const handleSubmitCreate = () => {
    if (!newRepresentante) {
      setModalError("Selecione o representante.");
      return;
    }

    if (!newInicioReuniao) {
      setModalError("Informe o horario de inicio.");
      return;
    }

    setIsCreateModalOpen(false);
    setModalError(null);
    setFeedback("Design pronto. Integracao do backend sera conectada na proxima etapa.");
  };

  return (
    <div className="space-y-4">
      {feedback ? (
        <div className="fixed top-6 right-6 z-[90] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {feedback}
        </div>
      ) : null}

      <header>
        <h1 className="text-4xl font-semibold text-[#30343a]">Agenda</h1>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => {
            setActiveTab("agendamentos");
            setPage(1);
          }}
          className={
            activeTab === "agendamentos"
              ? "h-11 min-w-[200px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343]"
              : "h-11 min-w-[200px] rounded-xl border-0 bg-[#6ca79d] text-base font-semibold text-white hover:bg-[#5d978d]"
          }
        >
          Agendamentos
        </Button>

        <Button
          type="button"
          onClick={() => {
            setActiveTab("horarios");
            setPage(1);
          }}
          className={
            activeTab === "horarios"
              ? "h-11 min-w-[200px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343]"
              : "h-11 min-w-[200px] rounded-xl border-0 bg-[#6ca79d] text-base font-semibold text-white hover:bg-[#5d978d]"
          }
        >
          Horarios
        </Button>
      </div>

      <div className="rounded-2xl bg-[#e4e6e8] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[180px] flex-1 sm:w-[220px] sm:flex-none">
            <label htmlFor="agenda-representante" className="sr-only">
              Representante
            </label>
            <select
              id="agenda-representante"
              name="agenda-representante"
              value={draftFilters.representante}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, representante: event.target.value }))
              }
              className="h-11 w-full appearance-none rounded-xl border border-[#d0d4d8] bg-[#f4f6f6] px-4 pr-10 text-base text-[#4b5358] outline-none"
            >
              <option value="">Representante</option>
              {representanteOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#4b5358]" />
          </div>

          <div className="relative w-full min-w-[180px] flex-1 sm:w-[190px] sm:flex-none">
            <label htmlFor="agenda-data-inicio" className="sr-only">
              Data inicio
            </label>
            <input
              id="agenda-data-inicio"
              name="agenda-data-inicio"
              type="date"
              value={draftFilters.dataInicio}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, dataInicio: event.target.value }))
              }
              className="h-11 w-full rounded-xl border border-[#d0d4d8] bg-[#f4f6f6] px-4 pr-4 text-base text-[#4b5358] outline-none"
            />
          </div>

          <div className="relative w-full min-w-[180px] flex-1 sm:w-[190px] sm:flex-none">
            <label htmlFor="agenda-data-fim" className="sr-only">
              Data fim
            </label>
            <input
              id="agenda-data-fim"
              name="agenda-data-fim"
              type="date"
              value={draftFilters.dataFim}
              onChange={(event) => setDraftFilters((current) => ({ ...current, dataFim: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d0d4d8] bg-[#f4f6f6] px-4 pr-4 text-base text-[#4b5358] outline-none"
            />
          </div>

          <Button
            type="button"
            onClick={handleSearch}
            className="h-11 min-w-[170px] rounded-xl border-0 bg-[#6ca79d] text-lg font-semibold text-white hover:bg-[#5d978d]"
          >
            Buscar
          </Button>

          <div className="ml-auto">
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-11 min-w-[220px] rounded-xl border-0 bg-[#0f5050] text-lg font-semibold text-white hover:bg-[#0c4343]"
            >
              {activeTab === "horarios" ? "Adicionar Horario" : "Adicionar agendamento"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="overflow-x-auto rounded-2xl">
          {activeTab === "agendamentos" ? (
            <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="bg-[#c8dfde] text-[#1d4d50]">
                  <th className="rounded-l-xl px-4 py-3 text-left text-base font-semibold">Inicio Reuniao</th>
                  <th className="px-4 py-3 text-left text-base font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left text-base font-semibold">Fone</th>
                  <th className="rounded-r-xl px-4 py-3 text-left text-base font-semibold">Representante</th>
                </tr>
              </thead>
              <tbody>
                {pageAgendaRows.length > 0 ? (
                  pageAgendaRows.map((row) => (
                    <tr key={row.id} className="bg-[#eceeef] text-[#1f4f52]">
                      <td className="rounded-l-xl px-4 py-3 text-base font-semibold">{row.inicioReuniao}</td>
                      <td className="px-4 py-3 text-base font-semibold">{row.cliente || "-"}</td>
                      <td className="px-4 py-3 text-base font-semibold">{row.fone || "-"}</td>
                      <td className="rounded-r-xl px-4 py-3 text-base font-semibold">{row.representante || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-[#eceeef]">
                    <td colSpan={4} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                      Nenhum agendamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="bg-[#c8dfde] text-[#1d4d50]">
                  <th className="rounded-l-xl px-4 py-3 text-left text-base font-semibold">Data Inicio</th>
                  <th className="px-4 py-3 text-left text-base font-semibold">Representantes</th>
                  <th className="rounded-r-xl px-4 py-3 text-right text-base font-semibold" />
                </tr>
              </thead>
              <tbody>
                {isLoadingHorarios ? (
                  <tr className="bg-[#eceeef]">
                    <td colSpan={3} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                      Carregando horarios...
                    </td>
                  </tr>
                ) : horariosError ? (
                  <tr className="bg-[#eceeef]">
                    <td colSpan={3} className="rounded-xl px-4 py-10 text-center text-sm text-[#7b2323]">
                      {horariosError}
                    </td>
                  </tr>
                ) : pageHorarioRows.length > 0 ? (
                  pageHorarioRows.map((row) => (
                    <tr key={row.id} className="bg-[#eceeef] text-[#1f4f52]">
                      <td className="rounded-l-xl px-4 py-3 text-base font-semibold">{row.dataInicio}</td>
                      <td className="px-4 py-3 text-base font-semibold">{row.representantes || "-"}</td>
                      <td className="rounded-r-xl px-4 py-3 text-right">
                        <button
                          type="button"
                          aria-label="Acoes do horario"
                          className="inline-flex items-center rounded-md p-1 text-[#3f4a4d] hover:bg-[#d7dcde]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-[#eceeef]">
                    <td colSpan={3} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                      Nenhum horario encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#8cc8c3] text-base font-semibold text-[#184f52] hover:bg-[#80b8b3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <p className="text-base text-[#444a4f]">{activeTab === "horarios" ? `Pagina - [${safePage}]` : `Pagina ${safePage}`}</p>

          <Button
            type="button"
            size="lg"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Proxima
          </Button>
        </div>
      </div>

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4"
          onClick={handleCloseCreateModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[620px] rounded-3xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar Horario"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-3xl font-semibold text-[#1d4d50]">Cadastrar Horario</h3>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                aria-label="Fechar cadastro de horario"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="novo-horario-representante" className="mb-2 block text-2xl text-[#2f3538]">
                  Representante
                </label>
                <div className="relative max-w-[280px]">
                  <select
                    id="novo-horario-representante"
                    name="novo-horario-representante"
                    value={newRepresentante}
                    onChange={(event) => {
                      setNewRepresentante(event.target.value);
                      setModalError(null);
                    }}
                    className="h-11 w-full appearance-none rounded-xl border border-[#d8dbe0] bg-[#f4f6f6] px-4 pr-10 text-base text-[#4b5358] outline-none"
                  >
                    <option value="">Representante</option>
                    {representanteOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#4b5358]" />
                </div>
              </div>

              <div>
                <label htmlFor="novo-horario-inicio" className="mb-2 block text-2xl text-[#2f3538]">
                  Horario
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-2 left-4 text-xs text-[#8c969a]">Inicio Reuniao</span>
                  <input
                    id="novo-horario-inicio"
                    name="novo-horario-inicio"
                    type="datetime-local"
                    value={newInicioReuniao}
                    onChange={(event) => {
                      setNewInicioReuniao(event.target.value);
                      setModalError(null);
                    }}
                    className="h-12 w-full rounded-xl border border-[#d8dbe0] bg-[#f4f6f6] px-4 pt-4 pr-4 text-base text-[#4b5358] outline-none"
                  />
                </div>
              </div>

              {modalError ? <p className="text-sm text-[#7b2323]">{modalError}</p> : null}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={handleSubmitCreate}
                className="h-11 w-full max-w-[230px] rounded-2xl border-0 bg-[#0f5050] text-lg font-semibold text-white hover:bg-[#0c4343]"
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
