"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  ClienteRepresentanteOption,
  ClientesControlFiltersValue,
} from "@/components/clientes/types";

type ClientesControlFiltersProps = {
  values: ClientesControlFiltersValue;
  representantes: ClienteRepresentanteOption[];
  onChange: (next: ClientesControlFiltersValue) => void;
  onSearch: (next: ClientesControlFiltersValue) => void;
};

const etiquetaOptions = [
  { label: "Selecione", value: "" },
  { label: "00 Agendamento", value: "00" },
  { label: "10 Ligar", value: "10" },
  { label: "21 Painel Ligação", value: "21" },
  { label: "30 Conseguir Contrato Social", value: "30" },
  { label: "35 Pre Contrato", value: "35" },
  { label: "40 Fechamento", value: "40" },
  { label: "50 Hidrossemeador", value: "50" },
];

export function ClientesControlFilters({
  values,
  representantes,
  onChange,
  onSearch,
}: ClientesControlFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[150px]">
        <Select
          id="clientes-usuario"
          name="usuario"
          value={values.usuario}
          onChange={(event) => onChange({ ...values, usuario: event.target.value })}
          className="h-11 appearance-none rounded-xl border-[#d7dadd] bg-white pr-9 text-sm text-[#2a4f51]"
        >
          <option value="">Selecione</option>
          {representantes.map((representante) => (
            <option key={representante.id} value={String(representante.id)}>
              {representante.nome}
            </option>
          ))}
        </Select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
      </div>

      <Input
        id="clientes-telefone"
        name="telefone"
        value={values.telefone}
        onChange={(event) => onChange({ ...values, telefone: event.target.value })}
        placeholder="Telefone do Cliente"
        className="h-11 min-w-[210px] rounded-xl border-[#b8d8d7] bg-[#bfe1df] text-[#1f5558] placeholder:text-[#2d676a]"
      />

      <Input
        id="clientes-nome"
        name="nome"
        value={values.nome}
        onChange={(event) => onChange({ ...values, nome: event.target.value })}
        placeholder="Nome do Cliente"
        className="h-11 min-w-[210px] rounded-xl border-[#b8d8d7] bg-[#bfe1df] text-[#1f5558] placeholder:text-[#2d676a]"
      />

      <div className="relative min-w-[180px]">
        <Select
          id="clientes-etiqueta"
          name="etiqueta"
          value={values.etiqueta}
          onChange={(event) => onChange({ ...values, etiqueta: event.target.value })}
          className="h-11 appearance-none rounded-xl border-[#b8d8d7] bg-[#bfe1df] pr-9 text-sm text-[#1f5558]"
        >
          {etiquetaOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#2d676a]" />
      </div>

      <Button
        type="button"
        onClick={() => onSearch(values)}
        className="h-11 min-w-[150px] rounded-xl border-0 bg-[#6ca89a] text-lg font-semibold text-white hover:bg-[#5f9a8c]"
      >
        Buscar
      </Button>
    </div>
  );
}

