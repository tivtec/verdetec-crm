"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import type { AgendaControleRow } from "@/components/agenda/types";
import { Button } from "@/components/ui/button";

type AgendaControlShellProps = {
  initialRows: AgendaControleRow[];
  allowedRepresentantes?: string[];
};

const PAGE_SIZE = 10;

type AgendaFilters = {
  representante: string;
  dataInicio: string;
  dataFim: string;
};

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

export function AgendaControlShell({ initialRows, allowedRepresentantes = [] }: AgendaControlShellProps) {
  const [activeTab, setActiveTab] = useState<"agendamentos" | "horarios">("agendamentos");
  const [draftFilters, setDraftFilters] = useState<AgendaFilters>(() => buildDefaultDateRangeFilters());
  const [appliedFilters, setAppliedFilters] = useState<AgendaFilters>(() => buildDefaultDateRangeFilters());
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRepresentante, setNewRepresentante] = useState("");
  const [newInicioReuniao, setNewInicioReuniao] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

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

  const representanteOptions = useMemo(
    () => {
      const source =
        allowedRepresentantes.length > 0
          ? allowedRepresentantes
          : initialRows.map((row) => row.representante.trim());

      return Array.from(new Set(source.map((value) => value.trim()).filter((value) => value.length > 0))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      );
    },
    [allowedRepresentantes, initialRows],
  );

  const filteredRows = useMemo(() => {
    return initialRows.filter((row) => {
      const selectedRepresentante = appliedFilters.representante.trim();
      const hasRepresentanteFilter =
        selectedRepresentante.length > 0 && selectedRepresentante.toLowerCase() !== "selecione";

      if (
        hasRepresentanteFilter &&
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

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = () => {
    setAppliedFilters(draftFilters);
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
      setModalError("Informe o horário de início.");
      return;
    }

    setIsCreateModalOpen(false);
    setModalError(null);
    setFeedback("Design de cadastro pronto. Integração será conectada na próxima etapa.");
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
          onClick={() => setActiveTab("agendamentos")}
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
            setFeedback("Aba Horários será construída na próxima etapa.");
            setActiveTab("agendamentos");
          }}
          className="h-11 min-w-[200px] rounded-xl border-0 bg-[#6ca79d] text-base font-semibold text-white hover:bg-[#5d978d]"
        >
          Horários
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
              <option value="">Selecione</option>
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
              Data início
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
              className="h-11 min-w-[230px] rounded-xl border-0 bg-[#0f5050] text-lg font-semibold text-white hover:bg-[#0c4343]"
            >
              Adicionar agendamento
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="bg-[#c8dfde] text-[#1d4d50]">
                <th className="rounded-l-xl px-4 py-3 text-left text-base font-semibold">Início Reunião</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Cliente</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Fone</th>
                <th className="rounded-r-xl px-4 py-3 text-left text-base font-semibold">Representante</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => (
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

          <p className="text-base text-[#444a4f]">Página {safePage}</p>

          <Button
            type="button"
            size="lg"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Próxima
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
            className="w-full max-w-[650px] rounded-3xl bg-[#f4f6f6] p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar Horário"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-3xl font-semibold text-[#1d4d50]">Cadastrar Horário</h3>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                aria-label="Fechar cadastro de horário"
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
                <div className="relative max-w-[390px]">
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
                  Horário
                </label>
                <div className="relative">
                  <input
                    id="novo-horario-inicio"
                    name="novo-horario-inicio"
                    type="datetime-local"
                    value={newInicioReuniao}
                    onChange={(event) => {
                      setNewInicioReuniao(event.target.value);
                      setModalError(null);
                    }}
                    className="h-11 w-full rounded-xl border border-[#d8dbe0] bg-[#f4f6f6] px-4 pr-4 text-base text-[#4b5358] outline-none"
                  />
                </div>
              </div>

              {modalError ? <p className="text-sm text-[#7b2323]">{modalError}</p> : null}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={handleSubmitCreate}
                className="h-11 w-full max-w-[260px] rounded-2xl border-0 bg-[#0f5050] text-lg font-semibold text-white hover:bg-[#0c4343]"
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


