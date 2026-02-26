"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Leaf, Plus, Search, Tractor, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/utils/cn";

type ExpedicaoTab = "agenda-retiradas" | "gestao-horarios";

type AgendaEvento = {
  titulo: string;
  descricao: string;
  tone:
    | "blue"
    | "green"
    | "amber"
    | "rose"
    | "indigo"
    | "slate"
    | "primary";
};

const DAY_LABELS = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"] as const;
const FIRST_DAY_OFFSET = 4;
const DAYS_IN_MONTH = 29;
const CALENDAR_CELLS = 42;

const EVENTS_BY_DAY: Partial<Record<number, AgendaEvento[]>> = {
  1: [{ titulo: "Fazenda Primavera", descricao: "Trator 7J", tone: "blue" }],
  5: [
    { titulo: "H. Silva", descricao: "Plantadeira X", tone: "green" },
    { titulo: "Rec. Vale", descricao: "Pulverizador", tone: "amber" },
  ],
  6: [{ titulo: "Manutencao interna", descricao: "Oficina Norte", tone: "slate" }],
  11: [{ titulo: "Mega Retirada", descricao: "Polo Industrial", tone: "primary" }],
  15: [{ titulo: "V. Fernandes", descricao: "Urgente", tone: "rose" }],
  21: [{ titulo: "Lote Sementes", descricao: "Soja Premium", tone: "indigo" }],
};

type SlotStatus = "available" | "blocked";

type HorarioConfig = {
  inicioComercial: string;
  fimComercial: string;
  inicioAlmoco: string;
  fimAlmoco: string;
  atendeSegundaASexta: boolean;
  atendeSabado: boolean;
  atendeDomingo: boolean;
};

const GESTAO_DIAS = [
  { label: "Seg", weekend: false },
  { label: "Ter", weekend: false },
  { label: "Qua", weekend: false },
  { label: "Qui", weekend: false },
  { label: "Sex", weekend: false },
  { label: "Sab", weekend: true },
  { label: "Dom", weekend: true },
] as const;

const GESTAO_HORAS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function createInitialSlots() {
  return GESTAO_HORAS.map((hora) =>
    GESTAO_DIAS.map((dia) => {
      const almocoBloqueado = hora === "12:00";
      const finalSemanaTarde = dia.weekend && hora >= "13:00";
      return almocoBloqueado || finalSemanaTarde ? "blocked" : "available";
    }),
  ) satisfies SlotStatus[][];
}

function formatWeekRange(start: Date, end: Date) {
  const startLabel = `${String(start.getDate()).padStart(2, "0")} ${MONTHS_SHORT[start.getMonth()]}`;
  const endLabel = `${String(end.getDate()).padStart(2, "0")} ${MONTHS_SHORT[end.getMonth()]}, ${end.getFullYear()}`;
  return `${startLabel} - ${endLabel}`;
}

function getToneClasses(tone: AgendaEvento["tone"]) {
  switch (tone) {
    case "blue":
      return "border-blue-500 bg-blue-100 text-blue-800";
    case "green":
      return "border-emerald-500 bg-emerald-100 text-emerald-800";
    case "amber":
      return "border-amber-500 bg-amber-100 text-amber-800";
    case "rose":
      return "border-rose-500 bg-rose-100 text-rose-800";
    case "indigo":
      return "border-indigo-500 bg-indigo-100 text-indigo-800";
    case "primary":
      return "border-[#0f5050] bg-[#0f5050] text-white";
    default:
      return "border-slate-400 bg-slate-100 text-slate-700";
  }
}

export function ExpedicaoShell() {
  const [activeTab, setActiveTab] = useState<ExpedicaoTab>("agenda-retiradas");
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<SlotStatus[][]>(() => createInitialSlots());
  const [config, setConfig] = useState<HorarioConfig>({
    inicioComercial: "08:00",
    fimComercial: "18:00",
    inicioAlmoco: "12:00",
    fimAlmoco: "13:00",
    atendeSegundaASexta: true,
    atendeSabado: false,
    atendeDomingo: false,
  });
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    return Array.from({ length: CALENDAR_CELLS }, (_, index) => {
      const dayNumber = index - FIRST_DAY_OFFSET + 1;
      if (dayNumber < 1 || dayNumber > DAYS_IN_MONTH) {
        return null;
      }
      return dayNumber;
    });
  }, []);

  const weekDates = useMemo(() => {
    const start = new Date(2026, 0, 22);
    start.setDate(start.getDate() + weekOffset * 7);
    return GESTAO_DIAS.map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [weekOffset]);

  const weekRangeLabel = useMemo(
    () => formatWeekRange(weekDates[0], weekDates[weekDates.length - 1]),
    [weekDates],
  );

  const slotSummary = useMemo(() => {
    let disponiveis = 0;
    let bloqueados = 0;
    for (const row of slots) {
      for (const slot of row) {
        if (slot === "available") {
          disponiveis += 1;
        } else {
          bloqueados += 1;
        }
      }
    }
    return {
      disponiveis,
      bloqueados,
      total: disponiveis + bloqueados,
    };
  }, [slots]);

  const toggleSlot = (rowIndex: number, colIndex: number) => {
    setSlots((current) =>
      current.map((row, currentRowIndex) =>
        row.map((slot, currentColIndex) => {
          if (currentRowIndex !== rowIndex || currentColIndex !== colIndex) {
            return slot;
          }
          return slot === "available" ? "blocked" : "available";
        }),
      ),
    );
  };

  const saveConfiguracoes = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setLastSavedAt(`${hours}:${minutes}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("agenda-retiradas")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
            activeTab === "agenda-retiradas"
              ? "bg-[#0f5050] text-white"
              : "bg-[#c6dfde] text-[#0f5050] hover:bg-[#b5d5d3]",
          )}
        >
          Agenda de retiradas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gestao-horarios")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
            activeTab === "gestao-horarios"
              ? "bg-[#0f5050] text-white"
              : "bg-[#c6dfde] text-[#0f5050] hover:bg-[#b5d5d3]",
          )}
        >
          Gestao de horarios
        </button>
      </div>

      {activeTab === "agenda-retiradas" ? (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-semibold text-[#0f5050]">Calendario de Retiradas</h1>
            </div>
            <Button
              type="button"
              className="h-11 rounded-xl border-0 bg-[#0f5050] px-5 text-sm font-semibold text-white hover:bg-[#0d4444]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>

          <div className="rounded-2xl border border-[#d7dddd] bg-[#f3f5f6] p-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6a7c7d]">
                  Mes de Referencia
                </label>
                <Select className="h-10 rounded-lg border-[#d5dfe0] bg-[#eef2f2] text-sm text-[#244f52]">
                  <option>Janeiro 2026</option>
                  <option>Fevereiro 2026</option>
                  <option>Marco 2026</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6a7c7d]">
                  Status
                </label>
                <Select className="h-10 rounded-lg border-[#d5dfe0] bg-[#eef2f2] text-sm text-[#244f52]">
                  <option>Todos</option>
                  <option>Pendente</option>
                  <option>Em andamento</option>
                  <option>Finalizado</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6a7c7d]">
                  Tecnico Responsavel
                </label>
                <Select className="h-10 rounded-lg border-[#d5dfe0] bg-[#eef2f2] text-sm text-[#244f52]">
                  <option>Todos</option>
                  <option>Gustavo M.</option>
                  <option>Yasmin V.</option>
                  <option>Vinicius F.</option>
                </Select>
              </div>

              <div className="xl:self-end">
                <Button
                  type="button"
                  className="h-10 min-w-[120px] rounded-lg border-0 bg-[#5f9f92] px-6 text-sm font-semibold text-white hover:bg-[#548f84]"
                >
                  <Search className="mr-1.5 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d7dddd] bg-white">
            <div className="grid grid-cols-7 border-b border-[#e3e8e9] bg-[#f4f7f7]">
              {DAY_LABELS.map((label) => (
                <div key={label} className="px-3 py-3 text-center text-xs font-bold uppercase text-[#6a7c7d]">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((dayNumber, index) => {
                const eventos = dayNumber ? EVENTS_BY_DAY[dayNumber] ?? [] : [];
                const isToday = dayNumber === 5;
                const isLastCol = (index + 1) % 7 === 0;

                return (
                  <div
                    key={`expedicao-day-${index}-${dayNumber ?? "empty"}`}
                    className={cn(
                      "min-h-[120px] border-b border-[#eef1f2] p-2",
                      !isLastCol && "border-r border-[#eef1f2]",
                      dayNumber ? "bg-white hover:bg-[#f8fafb]" : "bg-[#fafcfc]",
                      isToday && "bg-[#0f5050]/5",
                    )}
                  >
                    {dayNumber ? (
                      <>
                        <div className={cn("mb-2 text-right text-xs font-bold text-[#809193]", isToday && "text-[#0f5050]")}>
                          {dayNumber}
                        </div>

                        <div className="space-y-1.5">
                          {eventos.map((evento, eventIndex) => (
                            <div
                              key={`${dayNumber}-${eventIndex}-${evento.titulo}`}
                              className={cn(
                                "rounded-md border-l-2 px-1.5 py-1",
                                getToneClasses(evento.tone),
                              )}
                            >
                              <p className="truncate text-[10px] font-semibold">{evento.titulo}</p>
                              <p className={cn("truncate text-[9px]", evento.tone === "primary" ? "text-white/90" : "opacity-90")}>
                                {evento.descricao}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
            <div className="rounded-2xl border border-[#d7dddd] bg-white p-5">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#7d8f91]">Resumo do Mes</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-[#0f5050]">12</p>
                  <p className="text-[10px] font-medium uppercase text-[#7a8d8f]">Retiradas</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#5f9f92]">08</p>
                  <p className="text-[10px] font-medium uppercase text-[#7a8d8f]">Concluidas</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-500">04</p>
                  <p className="text-[10px] font-medium uppercase text-[#7a8d8f]">Pendentes</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7dddd] bg-white p-5">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#7d8f91]">Legenda</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="inline-flex items-center gap-2 text-sm text-[#33595c]">
                  <Tractor className="h-4 w-4 text-blue-600" />
                  Maquinario leve
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-[#33595c]">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  Maquinario pesado
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-[#33595c]">
                  <Leaf className="h-4 w-4 text-amber-600" />
                  Sementes e insumos
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-[#33595c]">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Urgencia
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-semibold text-[#0f5050]">Gerenciar Horarios Disponiveis</h1>
            <p className="mt-1 text-sm text-[#587174]">
              Configure a disponibilidade para agendamentos de visitas tecnicas e entregas.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="overflow-hidden rounded-2xl border border-[#d7dddd] bg-white shadow-sm xl:col-span-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6ecec] bg-[#f3f6f7] p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((current) => current - 1)}
                    className="rounded-full p-2 text-[#476669] transition-colors hover:bg-[#dce8e8] hover:text-[#1f4f52]"
                    aria-label="Semana anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <h2 className="text-base font-semibold text-[#244f52]">{weekRangeLabel}</h2>

                  <button
                    type="button"
                    onClick={() => setWeekOffset((current) => current + 1)}
                    className="rounded-full p-2 text-[#476669] transition-colors hover:bg-[#dce8e8] hover:text-[#1f4f52]"
                    aria-label="Proxima semana"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-[#4f686b]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Disponivel
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Bloqueado
                  </span>
                </div>
              </div>

              <div className="max-h-[560px] overflow-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafb]">
                      <th className="sticky top-0 z-10 w-20 border-r border-b border-[#e9eeee] bg-[#f8fafb] p-3 text-left text-xs font-semibold text-[#74898b]" />
                      {GESTAO_DIAS.map((dia, index) => (
                        <th
                          key={`${dia.label}-${index}`}
                          className={cn(
                            "sticky top-0 z-10 border-b border-[#e9eeee] p-3 text-center",
                            dia.weekend ? "bg-[#ebf6f5]" : "bg-[#f8fafb]",
                          )}
                        >
                          <span className="block text-[11px] font-bold uppercase text-[#7b8e90]">{dia.label}</span>
                          <span className="text-sm font-semibold text-[#274f52]">{weekDates[index].getDate()}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {GESTAO_HORAS.map((hora, rowIndex) => (
                      <tr key={`hora-${hora}`}>
                        <td className="border-r border-b border-[#eef2f2] p-3 text-sm font-medium text-[#667d80]">{hora}</td>
                        {GESTAO_DIAS.map((dia, colIndex) => {
                          const status = slots[rowIndex][colIndex];
                          const blocked = status === "blocked";
                          return (
                            <td key={`slot-${hora}-${dia.label}`} className="border-b border-[#eef2f2] p-2">
                              <button
                                type="button"
                                onClick={() => toggleSlot(rowIndex, colIndex)}
                                className={cn(
                                  "w-full rounded-lg border px-2 py-2 text-[10px] font-bold uppercase transition-colors",
                                  blocked
                                    ? "border-red-400 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                                )}
                              >
                                {blocked ? "Bloqueado" : "Disponivel"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="space-y-6 xl:col-span-4">
              <div className="rounded-2xl border border-[#d7dddd] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-[#244f52]">Configuracao Padrao</h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#7b8f91]">
                      Horario Comercial
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="mb-1 block text-xs text-[#7a8f91]">Inicio</span>
                        <input
                          type="time"
                          value={config.inicioComercial}
                          onChange={(event) =>
                            setConfig((current) => ({ ...current, inicioComercial: event.target.value }))
                          }
                          className="h-10 w-full rounded-lg border border-[#d8e2e3] bg-[#f6f8f8] px-3 text-sm text-[#244f52] outline-none focus:border-[#5f9f92] focus:ring-2 focus:ring-[#5f9f92]/20"
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-[#7a8f91]">Fim</span>
                        <input
                          type="time"
                          value={config.fimComercial}
                          onChange={(event) => setConfig((current) => ({ ...current, fimComercial: event.target.value }))}
                          className="h-10 w-full rounded-lg border border-[#d8e2e3] bg-[#f6f8f8] px-3 text-sm text-[#244f52] outline-none focus:border-[#5f9f92] focus:ring-2 focus:ring-[#5f9f92]/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#7b8f91]">
                      Intervalo de Almoco
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="mb-1 block text-xs text-[#7a8f91]">De</span>
                        <input
                          type="time"
                          value={config.inicioAlmoco}
                          onChange={(event) => setConfig((current) => ({ ...current, inicioAlmoco: event.target.value }))}
                          className="h-10 w-full rounded-lg border border-[#d8e2e3] bg-[#f6f8f8] px-3 text-sm text-[#244f52] outline-none focus:border-[#5f9f92] focus:ring-2 focus:ring-[#5f9f92]/20"
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-[#7a8f91]">Ate</span>
                        <input
                          type="time"
                          value={config.fimAlmoco}
                          onChange={(event) => setConfig((current) => ({ ...current, fimAlmoco: event.target.value }))}
                          className="h-10 w-full rounded-lg border border-[#d8e2e3] bg-[#f6f8f8] px-3 text-sm text-[#244f52] outline-none focus:border-[#5f9f92] focus:ring-2 focus:ring-[#5f9f92]/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#edf1f2] pt-4">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#7b8f91]">
                      Dias de Atendimento
                    </label>

                    <div className="space-y-2">
                      <label className="inline-flex items-center gap-2 text-sm text-[#385a5e]">
                        <input
                          type="checkbox"
                          checked={config.atendeSegundaASexta}
                          onChange={(event) =>
                            setConfig((current) => ({ ...current, atendeSegundaASexta: event.target.checked }))
                          }
                          className="rounded border-[#bfd0d1] text-[#0f5050] focus:ring-[#0f5050]/30"
                        />
                        Segunda a sexta
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-[#385a5e]">
                        <input
                          type="checkbox"
                          checked={config.atendeSabado}
                          onChange={(event) =>
                            setConfig((current) => ({ ...current, atendeSabado: event.target.checked }))
                          }
                          className="rounded border-[#bfd0d1] text-[#0f5050] focus:ring-[#0f5050]/30"
                        />
                        Sabado
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-[#385a5e]">
                        <input
                          type="checkbox"
                          checked={config.atendeDomingo}
                          onChange={(event) =>
                            setConfig((current) => ({ ...current, atendeDomingo: event.target.checked }))
                          }
                          className="rounded border-[#bfd0d1] text-[#0f5050] focus:ring-[#0f5050]/30"
                        />
                        Domingo
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d7dddd] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-[#244f52]">Resumo da Semana</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5f7679]">Slots disponiveis</span>
                    <span className="font-semibold text-emerald-600">{slotSummary.disponiveis}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5f7679]">Slots bloqueados</span>
                    <span className="font-semibold text-red-600">{slotSummary.bloqueados}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5f7679]">Capacidade total</span>
                    <span className="font-semibold text-[#2e5053]">{slotSummary.total}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={saveConfiguracoes}
                  className="mt-5 h-11 w-full rounded-xl border-0 bg-[#0f5050] text-sm font-semibold text-white hover:bg-[#0d4444]"
                >
                  Salvar Configuracoes
                </Button>

                {lastSavedAt ? (
                  <p className="mt-2 text-center text-xs text-[#5f7679]">Ultimo salvamento: {lastSavedAt}</p>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
