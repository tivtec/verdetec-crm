"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type OrcamentosFiltersFormProps = {
  selectedTipoRepre: string;
  dataInicioInput: string;
  dataFimInput: string;
  lockTipoRepreSelection?: boolean;
};

const carteiraOptions = [
  { label: "Todos", value: "" },
  { label: "CRV", value: "CRV" },
  { label: "Prime", value: "Prime" },
];
const ORCAMENTOS_RANGE_DAYS = 30;

function getYesterdayInputDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function shiftInputDate(inputDate: string, days: number) {
  const parsed = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return inputDate;
  }

  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function OrcamentosFiltersForm({
  selectedTipoRepre,
  dataInicioInput,
  dataFimInput,
  lockTipoRepreSelection = false,
}: OrcamentosFiltersFormProps) {
  const maxSelectableDate = getYesterdayInputDate();
  const normalizeToMaxDate = (value: string) => {
    if (!value) {
      return maxSelectableDate;
    }

    return value > maxSelectableDate ? maxSelectableDate : value;
  };
  const resolveRangeStart = (fimInput: string) => shiftInputDate(fimInput, -ORCAMENTOS_RANGE_DAYS);
  const resolveRangeEnd = (inicioInput: string) => shiftInputDate(inicioInput, ORCAMENTOS_RANGE_DAYS);
  const initialDataFim = normalizeToMaxDate(dataFimInput);
  const initialDataInicio = resolveRangeStart(initialDataFim);

  const [tipoRepre, setTipoRepre] = useState(selectedTipoRepre);
  const [dataInicio, setDataInicio] = useState(initialDataInicio);
  const [dataFim, setDataFim] = useState(initialDataFim);

  const handleTipoRepreChange = (value: string, form: HTMLFormElement | null) => {
    if (lockTipoRepreSelection) {
      return;
    }

    setTipoRepre(value);
    form?.requestSubmit();
  };

  return (
    <form method="GET" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="view" value="orcamentos" />

      <div className="relative">
        <select
          name="tipo_repre"
          value={tipoRepre}
          onChange={(event) => handleTipoRepreChange(event.target.value, event.currentTarget.form)}
          disabled={lockTipoRepreSelection}
          className="h-12 min-w-[150px] appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {carteiraOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {lockTipoRepreSelection ? <input type="hidden" name="tipo_repre" value={tipoRepre} /> : null}
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="rounded-xl border border-slate-300 bg-white px-4 py-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Inicio</p>
        <input
          type="date"
          name="data_inicio"
          value={dataInicio}
          max={resolveRangeStart(maxSelectableDate)}
          onChange={(event) => {
            const nextFim = normalizeToMaxDate(resolveRangeEnd(event.target.value));
            setDataFim(nextFim);
            setDataInicio(resolveRangeStart(nextFim));
          }}
          className="text-sm text-slate-700 outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-300 bg-white px-4 py-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Fim</p>
        <input
          type="date"
          name="data_fim"
          value={dataFim}
          max={maxSelectableDate}
          onChange={(event) => {
            const nextFim = normalizeToMaxDate(event.target.value);
            setDataFim(nextFim);
            setDataInicio(resolveRangeStart(nextFim));
          }}
          className="text-sm text-slate-700 outline-none"
        />
      </div>

      <button
        type="submit"
        className="h-12 min-w-[160px] rounded-xl bg-[#6ca89a] px-6 text-lg font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
}
