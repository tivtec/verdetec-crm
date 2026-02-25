"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Tag, X } from "lucide-react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { DashboardRetratoRow, DashboardRetratoTotals } from "@/services/crm/api";

type RetratoColumnKey = "nome" | "lead" | "n00" | "n10" | "n21" | "n30" | "n35" | "n40" | "n50";

type RetratoColumn = {
  key: RetratoColumnKey;
  label: string;
  widthClass?: string;
};

type RetratoEtiquetaOption = {
  value: string;
  label: string;
  countKey: Exclude<RetratoColumnKey, "nome" | "lead">;
};

type RetratoClienteItem = {
  id: string;
  etiqueta: string;
  nome: string;
  telefone: string;
};

type RetratoRpcResponse = {
  ok?: boolean;
  items?: RetratoClienteItem[];
  total?: number;
  hasNextPage?: boolean;
  error?: string;
};

type RetratoTableProps = {
  rows: DashboardRetratoRow[];
  totals: DashboardRetratoTotals;
};

const retratoColumns: RetratoColumn[] = [
  { key: "nome", label: "Nome", widthClass: "w-[18%]" },
  { key: "lead", label: "Lead", widthClass: "w-[9%]" },
  { key: "n00", label: "#00", widthClass: "w-[9%]" },
  { key: "n10", label: "#10", widthClass: "w-[9%]" },
  { key: "n21", label: "#21", widthClass: "w-[9%]" },
  { key: "n30", label: "#30", widthClass: "w-[9%]" },
  { key: "n35", label: "#35", widthClass: "w-[9%]" },
  { key: "n40", label: "#40", widthClass: "w-[9%]" },
  { key: "n50", label: "#50", widthClass: "w-[9%]" },
];

const etiquetaOptions: RetratoEtiquetaOption[] = [
  { value: "#00", label: "00 Agendamento", countKey: "n00" },
  { value: "#10", label: "10 Ligar", countKey: "n10" },
  { value: "#21", label: "21 Painel Ligacao", countKey: "n21" },
  { value: "#30", label: "30 Conseguir Contrato Social", countKey: "n30" },
  { value: "#35", label: "35 Pre Contrato", countKey: "n35" },
  { value: "#40", label: "40 Fechamento", countKey: "n40" },
  { value: "#50", label: "50 Hidrossemeador", countKey: "n50" },
];

const etiquetaOpenPriority = ["#40", "#50", "#30", "#35", "#21", "#10", "#00"] as const;
const pageSize = 10;

function getCellClass(widthClass?: string) {
  return `px-3 py-2.5 text-sm whitespace-nowrap ${widthClass ?? ""}`;
}

function getRetratoRowCellValue(row: DashboardRetratoRow, key: RetratoColumnKey) {
  if (key === "nome") {
    return row.nome;
  }
  return row[key];
}

function getRetratoTotalCellValue(totals: DashboardRetratoTotals, key: RetratoColumnKey) {
  if (key === "nome") {
    return "";
  }
  return totals[key as keyof DashboardRetratoTotals];
}

function getDefaultEtiquetaForRow(row: DashboardRetratoRow) {
  for (const preferred of etiquetaOpenPriority) {
    const option = etiquetaOptions.find((item) => item.value === preferred);
    if (!option) {
      continue;
    }
    if ((row[option.countKey] ?? 0) > 0) {
      return option.value;
    }
  }
  return "#40";
}

function safePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function DashboardRetratoTable({ rows, totals }: RetratoTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DashboardRetratoRow | null>(null);
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<string>("#40");
  const [draftTelefone, setDraftTelefone] = useState("");
  const [appliedTelefone, setAppliedTelefone] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalItems, setModalItems] = useState<RetratoClienteItem[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableEtiquetaOptions = useMemo(() => {
    if (!selectedRow) {
      return etiquetaOptions;
    }

    const filtered = etiquetaOptions.filter((option) => (selectedRow[option.countKey] ?? 0) > 0);
    if (filtered.length === 0) {
      return etiquetaOptions;
    }

    if (filtered.some((option) => option.value === selectedEtiqueta)) {
      return filtered;
    }

    const current = etiquetaOptions.find((option) => option.value === selectedEtiqueta);
    return current ? [current, ...filtered] : filtered;
  }, [selectedEtiqueta, selectedRow]);

  useEffect(() => {
    if (!isModalOpen || !selectedRow) {
      return;
    }

    const userId = Math.max(0, Math.trunc(Number(selectedRow.idUsuario ?? 0)));
    if (userId <= 0) {
      setFeedback("Nao foi possivel identificar o representante selecionado.");
      setModalItems([]);
      setTotalClientes(0);
      setHasNextPage(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setFeedback(null);

      try {
        const response = await fetch("/api/dashboard/retrato-clientes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            etiqueta: selectedEtiqueta,
            id_usuario: userId,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            telefone: appliedTelefone,
          }),
        });

        const payload = (await response.json().catch(() => null)) as RetratoRpcResponse | null;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Falha ao carregar clientes do retrato.");
        }

        const items = Array.isArray(payload.items) ? payload.items : [];
        setModalItems(items);
        setTotalClientes(Math.max(0, Math.trunc(Number(payload.total) || 0)));
        setHasNextPage(Boolean(payload.hasNextPage));
      } catch (error) {
        setModalItems([]);
        setTotalClientes(0);
        setHasNextPage(false);
        setFeedback(error instanceof Error ? error.message : "Falha ao carregar clientes.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [appliedTelefone, currentPage, isModalOpen, selectedEtiqueta, selectedRow]);

  const openModal = (row: DashboardRetratoRow) => {
    if (Math.max(0, Math.trunc(Number(row.idUsuario ?? 0))) <= 0) {
      return;
    }

    const defaultEtiqueta = getDefaultEtiquetaForRow(row);
    setSelectedRow(row);
    setSelectedEtiqueta(defaultEtiqueta);
    setDraftTelefone("");
    setAppliedTelefone("");
    setCurrentPage(1);
    setModalItems([]);
    setTotalClientes(0);
    setHasNextPage(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-white/20 bg-white/60 backdrop-blur-md shadow-lg">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-[#d6d6d8]/80 backdrop-blur-sm">
            <tr>
              {retratoColumns.map((column) => (
                <th
                  key={column.key}
                  className={`${getCellClass(column.widthClass)} text-left text-[clamp(0.82rem,0.98vw,1rem)] font-semibold text-[#18484a]`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const canOpen = Math.max(0, Math.trunc(Number(row.idUsuario ?? 0))) > 0;
              const rowKey = `${canOpen ? String(row.idUsuario) : row.nome}-${rowIndex}`;

              return (
                <tr
                  key={rowKey}
                  className={`border-t border-white/10 bg-white/40 ${canOpen ? "cursor-pointer hover:bg-[#edf5f4]" : ""}`}
                  onClick={canOpen ? () => openModal(row) : undefined}
                >
                  {retratoColumns.map((column) => (
                    <td
                      key={`${rowKey}-${column.key}`}
                      className={`${getCellClass(column.widthClass)} text-[clamp(0.8rem,0.95vw,0.98rem)] text-slate-700`}
                    >
                      {String(getRetratoRowCellValue(row, column.key))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20 bg-[#d6d6d8]/60 backdrop-blur-sm">
              {retratoColumns.map((column) => (
                <td
                  key={`retrato-total-${column.key}`}
                  className={`${getCellClass(column.widthClass)} text-[clamp(0.92rem,1.06vw,1.2rem)] font-semibold text-[#18484a]`}
                >
                  {String(getRetratoTotalCellValue(totals, column.key))}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[920px] overflow-hidden rounded-2xl border border-[#1d4d50]/45 bg-[#f4f6f6] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Clientes Retrato"
          >
            <div className="flex items-center justify-between bg-[#1d7b72] px-5 py-3">
              <h3 className="text-[36px] font-semibold leading-none text-white">Clientes Retrato</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-white/90 hover:bg-white/10"
                aria-label="Fechar"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select
                      value={selectedEtiqueta}
                      onChange={(event) => {
                        setSelectedEtiqueta(event.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-11 min-w-[220px] appearance-none rounded-lg border border-[#d7dcde] bg-white px-4 pr-10 text-base text-[#2a4f51] outline-none"
                    >
                      {availableEtiquetaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
                  </div>

                  <input
                    type="text"
                    value={draftTelefone}
                    onChange={(event) => setDraftTelefone(event.target.value)}
                    placeholder="Telefone"
                    className="h-11 min-w-[180px] rounded-lg border border-[#d7dcde] bg-white px-3 text-sm text-[#274a4d] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setAppliedTelefone(safePhone(draftTelefone));
                    }}
                    className="h-11 rounded-lg bg-[#6ca89a] px-4 text-sm font-semibold text-white hover:bg-[#5e978a]"
                  >
                    Filtrar
                  </button>
                </div>

                <div className="rounded-lg bg-[#ececed] px-5 py-3 text-lg text-[#7a7f83]">
                  Total de clientes <span className="ml-2 text-[32px] font-semibold leading-none text-[#1d4d50]">{totalClientes}</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#d8dddf] bg-white">
                <div className="grid grid-cols-[160px_1fr_220px] gap-3 bg-[#f6f7f8] px-4 py-2 text-sm font-semibold text-[#1d4d50]">
                  <p>Etiqueta</p>
                  <p>Nome</p>
                  <p>Telefone</p>
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {isLoading ? (
                    <div className="py-8">
                      <LoadingSpinner label="Carregando clientes..." />
                    </div>
                  ) : feedback ? (
                    <p className="px-4 py-8 text-center text-sm text-[#7b2323]">{feedback}</p>
                  ) : modalItems.length > 0 ? (
                    modalItems.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="grid grid-cols-[160px_1fr_220px] gap-3 border-t border-[#e3e6e7] px-4 py-3 text-sm text-[#2f3538]"
                      >
                        <p className="flex items-center gap-2 font-semibold text-[#1d4d50]">
                          <Tag className="h-4 w-4 text-[#d75f8e]" />
                          {item.etiqueta}
                        </p>
                        <p>{item.nome}</p>
                        <p>{item.telefone}</p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-[#466568]">Nenhum cliente encontrado.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-lg bg-[#0f5050] px-4 text-sm font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </button>

                <p className="text-sm text-[#444a4f]">Pagina[{currentPage}]</p>

                <button
                  type="button"
                  onClick={() => setCurrentPage((value) => value + 1)}
                  disabled={!hasNextPage || isLoading}
                  className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-lg bg-[#a6dfda] px-4 text-sm font-semibold text-[#244e50] hover:bg-[#97d2cd] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="mr-1 h-4 w-4" />
                  Proxima
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
