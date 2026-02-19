"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type DashboardRepresentanteOption = {
  id: number;
  nome: string;
};

type DashboardFiltersFormProps = {
  dataInicioInput: string;
  dataFimInput: string;
  selectedTipoAcesso: string;
  selectedUsuario: number;
  representantes: DashboardRepresentanteOption[];
  lockTipoSelection?: boolean;
  lockUsuarioSelection?: boolean;
  columnOptions?: Array<{ key: string; label: string }>;
  selectedColumnKeys?: string[];
  percentageMode?: boolean;
};

const tipoAcessoOptions = [
  { label: "Time de Neg\u00f3cios", value: "Time Neg\u00f3cios" },
  { label: "Prime", value: "Prime" },
];

export function DashboardFiltersForm({
  dataInicioInput,
  dataFimInput,
  selectedTipoAcesso,
  selectedUsuario,
  representantes,
  lockTipoSelection = false,
  lockUsuarioSelection = false,
  columnOptions = [],
  selectedColumnKeys = [],
  percentageMode = false,
}: DashboardFiltersFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const [tipoAcesso, setTipoAcesso] = useState(selectedTipoAcesso);
  const [usuario, setUsuario] = useState(selectedUsuario > 0 ? String(selectedUsuario) : "");
  const [dataInicio, setDataInicio] = useState(dataInicioInput);
  const [dataFim, setDataFim] = useState(dataFimInput);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isPercentageMode, setIsPercentageMode] = useState(percentageMode);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    selectedColumnKeys.length > 0 ? selectedColumnKeys : columnOptions.map((option) => option.key),
  );

  useEffect(() => {
    setIsPercentageMode(percentageMode);
  }, [percentageMode]);

  useEffect(() => {
    if (selectedColumnKeys.length > 0) {
      setSelectedColumns(selectedColumnKeys);
      return;
    }

    setSelectedColumns(columnOptions.map((option) => option.key));
  }, [columnOptions, selectedColumnKeys]);

  useEffect(() => {
    if (!isColumnsOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (columnsDropdownRef.current?.contains(target)) {
        return;
      }

      setIsColumnsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsColumnsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isColumnsOpen]);

  const handleTipoChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (lockTipoSelection) {
      return;
    }

    const form = formRef.current;
    setTipoAcesso(event.target.value);
    setUsuario("");

    if (!form) {
      return;
    }

    const usuarioField = form.elements.namedItem("usuario") as HTMLSelectElement | null;
    if (usuarioField) {
      usuarioField.value = "";
    }

    form.requestSubmit();
  };

  const handleToggleColumn = (columnKey: string) => {
    setSelectedColumns((current) => {
      let nextSelection: string[] = current;

      if (current.includes(columnKey)) {
        if (current.length === 1) {
          return current;
        }

        nextSelection = current.filter((value) => value !== columnKey);
      } else {
        nextSelection = columnOptions
          .map((option) => option.key)
          .filter((key) => current.includes(key) || key === columnKey);
      }

      // Auto reload da tabela quando o usuario altera a visibilidade de colunas.
      window.requestAnimationFrame(() => {
        if (!formRef.current) {
          return;
        }

        formRef.current.requestSubmit();
      });

      return nextSelection;
    });
  };

  return (
    <form ref={formRef} method="GET" className="flex flex-wrap items-end gap-3">
      {selectedColumns.map((columnKey) => (
        <input key={`selected-column-${columnKey}`} type="hidden" name="colunas" value={columnKey} />
      ))}
      {isPercentageMode ? <input type="hidden" name="porcentagem" value="1" /> : null}

      <div className="relative">
        <select
          name="tipo_acesso_2"
          value={tipoAcesso}
          onChange={handleTipoChange}
          disabled={lockTipoSelection}
          className="h-12 min-w-[220px] appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Selecione</option>
          {tipoAcessoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {lockTipoSelection ? <input type="hidden" name="tipo_acesso_2" value={tipoAcesso} /> : null}
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="relative">
        <select
          name="usuario"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
          disabled={lockUsuarioSelection || representantes.length === 0}
          className="h-12 min-w-[220px] appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Selecione</option>
          {representantes.map((representante) => (
            <option key={representante.id} value={representante.id}>
              {representante.nome}
            </option>
          ))}
        </select>
        {lockUsuarioSelection && usuario ? <input type="hidden" name="usuario" value={usuario} /> : null}
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="rounded-xl border border-slate-300 bg-white px-4 py-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Inicio</p>
        <input
          type="date"
          name="data_inicio"
          value={dataInicio}
          onChange={(event) => setDataInicio(event.target.value)}
          className="text-sm text-slate-700 outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-300 bg-white px-4 py-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Fim</p>
        <input
          type="date"
          name="data_fim"
          value={dataFim}
          onChange={(event) => setDataFim(event.target.value)}
          className="text-sm text-slate-700 outline-none"
        />
      </div>

      <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPercentageMode}
            onChange={(event) => {
              setIsPercentageMode(event.target.checked);
              window.requestAnimationFrame(() => {
                formRef.current?.requestSubmit();
              });
            }}
            className="h-4 w-4 accent-[#0f5050]"
          />
          <span>Transformar em porcentagem</span>
        </label>

        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
          Beta/Teste
        </span>

        <div className="group relative">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-xs font-semibold text-slate-600">
            ?
          </span>
          <div className="pointer-events-none absolute top-7 right-0 z-20 hidden w-72 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-xl group-hover:block">
            Usa a primeira coluna visivel iniciada por # (exceto #21) como base de 100%. As demais colunas # (exceto #21) viram percentual relativo a essa base.
          </div>
        </div>
      </div>

      {columnOptions.length > 0 ? (
        <div className="relative" ref={columnsDropdownRef}>
          <button
            type="button"
            onClick={() => setIsColumnsOpen((current) => !current)}
            className="flex h-12 min-w-[220px] items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
            aria-haspopup="menu"
            aria-expanded={isColumnsOpen}
          >
            <span className="flex items-center gap-2">
              <span>Colunas ({selectedColumns.length}/{columnOptions.length})</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
                Beta/Teste
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {isColumnsOpen ? (
            <div className="absolute top-14 right-0 z-20 min-w-[260px] rounded-xl border border-slate-300 bg-white p-3 shadow-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Escolha as colunas
              </p>
              <div className="max-h-64 space-y-1 overflow-auto">
                {columnOptions.map((option) => {
                  const checked = selectedColumns.includes(option.key);
                  return (
                    <label
                      key={option.key}
                      className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <span>{option.label}</span>
                      <input
                        type="checkbox"
                        value={option.key}
                        checked={checked}
                        onChange={() => handleToggleColumn(option.key)}
                        className="h-4 w-4 accent-[#0f5050]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        className="h-12 min-w-[170px] rounded-xl bg-[#6ca89a] px-6 text-lg font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
}
