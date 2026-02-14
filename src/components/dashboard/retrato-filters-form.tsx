"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type DashboardRepresentanteOption = {
  id: number;
  nome: string;
};

type RetratoFiltersFormProps = {
  selectedTipoAcesso: string;
  selectedUsuario: number;
  representantes: DashboardRepresentanteOption[];
};

const tipoAcessoOptions = [
  { label: "Time de Neg\u00f3cios", value: "Time Neg\u00f3cios" },
  { label: "Prime", value: "Prime" },
];

export function RetratoFiltersForm({
  selectedTipoAcesso,
  selectedUsuario,
  representantes,
}: RetratoFiltersFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [tipoAcesso, setTipoAcesso] = useState(selectedTipoAcesso);
  const [usuario, setUsuario] = useState(selectedUsuario > 0 ? String(selectedUsuario) : "");

  const handleTipoChange = (event: ChangeEvent<HTMLSelectElement>) => {
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

  return (
    <form ref={formRef} method="GET" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="view" value="retrato" />

      <div className="relative">
        <select
          name="tipo_acesso_2"
          value={tipoAcesso}
          onChange={handleTipoChange}
          className="h-12 min-w-[200px] appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700"
        >
          <option value="">Selecione</option>
          {tipoAcessoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="relative">
        <select
          name="usuario"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
          disabled={!tipoAcesso}
          className="h-12 min-w-[160px] appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Selecione</option>
          {representantes.map((representante) => (
            <option key={representante.id} value={representante.id}>
              {representante.nome}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
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

