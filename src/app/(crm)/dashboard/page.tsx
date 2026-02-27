import Link from "next/link";
import { Suspense } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { DashboardFiltersForm } from "@/components/dashboard/dashboard-filters-form";
import { OrcamentosFiltersForm } from "@/components/dashboard/orcamentos-filters-form";
import { RetratoFiltersForm } from "@/components/dashboard/retrato-filters-form";
import { DashboardRetratoTable } from "@/components/dashboard/retrato-table";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getDashboardEvolucaoLeadsSnapshot,
  getDashboardFunilSnapshot,
  getDashboardOrcamentosSnapshot,
  getDashboardRepresentantesByTipo,
  getDashboardRetratoSnapshot,
  getDashboardViewerAccessScope,
  type DashboardEvolucaoLeadPoint,
  type DashboardFunilRow,
  type DashboardFunilTotals,
  type DashboardOrcamentosRow,
  type DashboardOrcamentosTotals,
} from "@/services/crm/api";

export const dynamic = "force-dynamic";

type DashboardView = "dashboard" | "retrato" | "evolucao-leads" | "orcamentos";

type FunilColumnKey =
  | "nome"
  | "lead"
  | "plusL100"
  | "l100"
  | "n00"
  | "n10"
  | "n21"
  | "n14"
  | "n15"
  | "n05"
  | "n30"
  | "n40"
  | "n50"
  | "n60"
  | "n61"
  | "n62"
  | "n66"
  | "tv"
  | "min"
  | "qtd"
  | "umbler";

type FunilColumn = {
  key: FunilColumnKey;
  label: string;
  widthClass?: string;
  tooltip?: string;
};

type OrcamentosColumnKey =
  | "nome"
  | "carteira"
  | "atend"
  | "orcAbertos"
  | "n10"
  | "orcFeitos"
  | "orcAprovado"
  | "orcRep"
  | "perfGanhosFeitos"
  | "umbler";

type OrcamentosColumn = {
  key: OrcamentosColumnKey;
  label: string;
  widthClass?: string;
};

const funilColumns: FunilColumn[] = [
  { key: "nome", label: "Nome", widthClass: "min-w-[180px]" },
  { key: "lead", label: "Lead", widthClass: "min-w-[84px]" },
  { key: "plusL100", label: "+L100", widthClass: "min-w-[84px]" },
  { key: "l100", label: "L100", widthClass: "min-w-[84px]" },
  { key: "n00", label: "#00", widthClass: "min-w-[84px]", tooltip: "Cliente fez contato" },
  { key: "n10", label: "#10", widthClass: "min-w-[84px]", tooltip: "Cliente interagiu com Bot" },
  {
    key: "n14",
    label: "#14",
    widthClass: "min-w-[84px]",
    tooltip: "Cliente recebeu link da reuniao enviado pelo representante",
  },
  {
    key: "n15",
    label: "#15",
    widthClass: "min-w-[84px]",
    tooltip: "Cliente recebeu o link da reuniao selecionando as opcoes oferecidas pelo San",
  },
  { key: "n21", label: "#21", widthClass: "min-w-[84px]", tooltip: "Cliente prospectado (outbound)" },
  { key: "n05", label: "#05", widthClass: "min-w-[84px]", tooltip: "Cliente clicou no link da reuniao" },
  { key: "n30", label: "#30", widthClass: "min-w-[84px]", tooltip: "Cliente recebeu uma proposta" },
  { key: "n40", label: "#40", widthClass: "min-w-[84px]", tooltip: "Cliente enviou documentos para analise" },
  { key: "n50", label: "#50", widthClass: "min-w-[84px]", tooltip: "Cliente comprou equipamento (Hidrossemeador)" },
  {
    key: "n60",
    label: "#60",
    widthClass: "min-w-[84px]",
    tooltip: "Cliente enviou a primeira mensagem e depois nao interagiu mais",
  },
  {
    key: "n61",
    label: "#61",
    widthClass: "min-w-[84px]",
    tooltip: "Cliente buscando aplicacao, encaminhado para o CRV",
  },
  { key: "n62", label: "#62", widthClass: "min-w-[84px]" },
  { key: "n66", label: "#66", widthClass: "min-w-[84px]" },
  { key: "tv", label: "TV", widthClass: "min-w-[84px]" },
  { key: "min", label: "Min", widthClass: "min-w-[104px]" },
  { key: "qtd", label: "Qtd", widthClass: "min-w-[84px]" },
  { key: "umbler", label: "Umbler", widthClass: "min-w-[92px]" },
];

const orcamentosColumns: OrcamentosColumn[] = [
  { key: "nome", label: "Nome", widthClass: "w-[18%]" },
  { key: "carteira", label: "Carteira", widthClass: "w-[9%]" },
  { key: "atend", label: "Atend.", widthClass: "w-[9%]" },
  { key: "orcAbertos", label: "Orç. Abertos", widthClass: "w-[9%]" },
  { key: "n10", label: "#10", widthClass: "w-[9%]" },
  { key: "orcFeitos", label: "Orç. Feitos", widthClass: "w-[9%]" },
  { key: "orcAprovado", label: "Orç. Aprovado", widthClass: "w-[9%]" },
  { key: "orcRep", label: "Orç. Rep", widthClass: "w-[9%]" },
  { key: "perfGanhosFeitos", label: "Perf. Ganhos/Feitos", widthClass: "w-[10%]" },
  { key: "umbler", label: "Umbler", widthClass: "w-[9%]" },
];

function getDefaultDateRangeInput() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  return {
    dataInicio: startDate.toISOString().slice(0, 10),
    dataFim: endDate.toISOString().slice(0, 10),
  };
}

function getYesterdayInputDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getSearchValues(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }

  return [] as string[];
}

function normalizeInputDate(value: string | undefined, fallbackInputDate: string) {
  if (!value) {
    return fallbackInputDate;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackInputDate;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeTipoAcessoSelection(value: string | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "";
  }

  if (
    raw === "Time Negócios" ||
    raw === "Time de Negócios" ||
    raw === "Time de Negocios" ||
    raw === "Time Negocios"
  ) {
    return "Time Negócios";
  }

  if (raw === "Prime") {
    return "Prime";
  }

  return "";
}

function normalizeUsuarioSelection(value: string | undefined) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeViewSelection(value: string | undefined): DashboardView {
  if (value === "retrato") {
    return "retrato";
  }

  if (value === "evolucao-leads") {
    return "evolucao-leads";
  }

  if (value === "orcamentos") {
    return "orcamentos";
  }

  return "dashboard";
}

function normalizeCarteiraSelection(value: string | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "";
  }

  if (raw === "CRV" || raw === "Prime") {
    return raw;
  }

  return "";
}

function normalizeFullscreenSelection(value: string | undefined) {
  return value === "1";
}

function buildDashboardFunilHref(args: {
  dataInicioInput: string;
  dataFimInput: string;
  selectedTipoAcesso: string;
  selectedUsuario: number;
  selectedColumnKeys: FunilColumnKey[];
  percentageMode: boolean;
  fullscreen: boolean;
}) {
  const params = new URLSearchParams();
  params.set("view", "dashboard");
  params.set("data_inicio", args.dataInicioInput);
  params.set("data_fim", args.dataFimInput);

  if (args.selectedTipoAcesso) {
    params.set("tipo_acesso_2", args.selectedTipoAcesso);
  }

  if (args.selectedUsuario > 0) {
    params.set("usuario", String(args.selectedUsuario));
  }

  if (args.percentageMode) {
    params.set("porcentagem", "1");
  }

  for (const columnKey of args.selectedColumnKeys) {
    params.append("colunas", columnKey);
  }

  if (args.fullscreen) {
    params.set("fullscreen", "1");
  }

  return `/dashboard?${params.toString()}`;
}

const ORCAMENTOS_VERTICAL_IDS = {
  prime: "b9ba82ab-b666-4b6f-a084-32be9577830a",
  timeNegocios: "31ab857a-bac4-415b-b9bd-7cf811e40601",
  crv: "122019f0-5160-4774-8779-efaf484afdbc",
} as const;

function resolveForcedOrcamentosVertical(
  viewerVerticalDescricao: string,
  viewerTipoAcesso2: string,
  viewerVerticalId: string,
) {
  const normalizedVertical = viewerVerticalDescricao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const normalizedTipo = viewerTipoAcesso2
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const normalizedVerticalId = viewerVerticalId.trim();

  if (normalizedVerticalId === ORCAMENTOS_VERTICAL_IDS.prime) {
    return "Prime";
  }

  if (
    normalizedVerticalId === ORCAMENTOS_VERTICAL_IDS.crv ||
    normalizedVerticalId === ORCAMENTOS_VERTICAL_IDS.timeNegocios
  ) {
    return "CRV";
  }

  if (normalizedVertical.includes("prime")) {
    return "Prime";
  }

  if (normalizedVertical.includes("crv")) {
    return "CRV";
  }

  if (normalizedVertical.includes("time de negocios") || normalizedVertical.includes("time negocios")) {
    return "CRV";
  }

  if (normalizedVertical.includes("gerencia")) {
    return "";
  }

  if (normalizedTipo === "prime") {
    return "Prime";
  }

  if (
    normalizedTipo === "crv" ||
    normalizedTipo === "time de negocios" ||
    normalizedTipo === "time negocios" ||
    normalizedTipo === "gestor"
  ) {
    return "CRV";
  }

  return "";
}

function getFunilRowCellValue(row: DashboardFunilRow, key: FunilColumnKey) {
  return row[key];
}

function getFunilTotalCellValue(totals: DashboardFunilTotals, key: FunilColumnKey) {
  if (key === "nome") {
    return "";
  }

  return totals[key as keyof DashboardFunilTotals];
}

function formatFunilFooterCellValue(key: FunilColumnKey, value: string | number) {
  if (key === "tv") {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }

  return String(value);
}

function getOrcamentosRowCellValue(row: DashboardOrcamentosRow, key: OrcamentosColumnKey) {
  return row[key];
}

function getOrcamentosTotalCellValue(totals: DashboardOrcamentosTotals, key: OrcamentosColumnKey) {
  if (key === "nome") {
    return "";
  }

  return totals[key as keyof DashboardOrcamentosTotals];
}

function formatOrcamentosCellValue(key: OrcamentosColumnKey, value: string | number) {
  if (key === "perfGanhosFeitos") {
    return `${Number(value).toFixed(2)}%`;
  }

  return String(value);
}

function baseCellClass(widthClass?: string, compactMode = false) {
  if (compactMode) {
    return "px-2 py-2 text-xs leading-tight whitespace-normal break-words";
  }

  return `px-3 py-2.5 text-sm whitespace-nowrap ${widthClass ?? ""}`;
}

function isFunilNumericColumn(key: FunilColumnKey) {
  return key !== "nome";
}

function normalizeFunilColumnsSelection(
  value: string | string[] | undefined,
  availableColumns: FunilColumn[] = funilColumns,
) {
  const allowedKeys = new Set(availableColumns.map((column) => column.key));
  const rawValues = getSearchValues(value).flatMap((entry) => entry.split(","));
  const selected = rawValues
    .map((entry) => entry.trim() as FunilColumnKey)
    .filter((entry) => allowedKeys.has(entry));

  if (selected.length === 0) {
    return availableColumns.map((column) => column.key);
  }

  const uniqueSelected = Array.from(new Set(selected));
  return availableColumns.map((column) => column.key).filter((key) => uniqueSelected.includes(key));
}

const HASH_FUNIL_COLUMN_KEYS: FunilColumnKey[] = [
  "n00",
  "n10",
  "n14",
  "n15",
  "n21",
  "n05",
  "n30",
  "n40",
  "n50",
  "n60",
  "n61",
  "n62",
  "n66",
];

function normalizePercentageToggle(value: string | undefined) {
  return value === "1" || value === "true";
}

function parseNumericValue(value: string | number) {
  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFunilRowBackgroundColor(l100Value: string | number) {
  const numeric = parseNumericValue(l100Value);
  if (numeric === null) {
    return "#f4f4f5";
  }

  if (numeric <= 0) {
    return "#DF8282";
  }

  if (numeric <= 50) {
    return "#DCBF7E";
  }

  return "#f4f4f5";
}

function formatPercentageValue(current: string | number, base: string | number) {
  const currentNumeric = parseNumericValue(current);
  const baseNumeric = parseNumericValue(base);

  if (currentNumeric === null || baseNumeric === null || baseNumeric === 0) {
    return "0%";
  }

  const ratio = (currentNumeric / baseNumeric) * 100;
  return `${ratio.toFixed(1)}%`;
}

function resolveFunilPercentageBaseKey(columns: FunilColumn[]) {
  const candidate = columns.find(
    (column) => HASH_FUNIL_COLUMN_KEYS.includes(column.key) && column.key !== "n21",
  );

  return candidate?.key ?? null;
}

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DashboardRepresentanteOption = Awaited<ReturnType<typeof getDashboardRepresentantesByTipo>>[number];

function normalizeDashboardVerticalScope(
  verticalDescricao: string,
): "gerencia" | "prime" | "crv" | "time-negocios" | "other" {
  const normalized = verticalDescricao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("gerencia")) {
    return "gerencia";
  }

  if (normalized.includes("prime")) {
    return "prime";
  }

  if (normalized.includes("crv")) {
    return "crv";
  }

  if (normalized.includes("time de negocios") || normalized.includes("time negocios")) {
    return "time-negocios";
  }

  return "other";
}

function isSuperAdmTipoAcesso(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  return normalized === "superadm";
}

function canViewEvolucaoLeads(verticalDescricao: string, tipoAcesso2: string) {
  const scope = normalizeDashboardVerticalScope(verticalDescricao);
  return scope === "gerencia" || isSuperAdmTipoAcesso(tipoAcesso2);
}

function getVisibleDashboardViews(verticalDescricao: string, tipoAcesso2: string): DashboardView[] {
  const scope = normalizeDashboardVerticalScope(verticalDescricao);
  const allowEvolucaoLeads = canViewEvolucaoLeads(verticalDescricao, tipoAcesso2);

  if (scope === "gerencia" || scope === "prime") {
    return allowEvolucaoLeads
      ? ["dashboard", "retrato", "evolucao-leads", "orcamentos"]
      : ["dashboard", "retrato", "orcamentos"];
  }

  if (scope === "crv") {
    return ["orcamentos"];
  }

  if (scope === "time-negocios") {
    return allowEvolucaoLeads ? ["dashboard", "retrato", "evolucao-leads"] : ["dashboard", "retrato"];
  }

  return allowEvolucaoLeads
    ? ["dashboard", "retrato", "evolucao-leads", "orcamentos"]
    : ["dashboard", "retrato", "orcamentos"];
}

const EVOLUCAO_CHART_HEIGHT = 480;
const EVOLUCAO_BASELINE_MAX = 200;
const EVOLUCAO_THRESHOLDS = [
  { label: "CRÍTICO (150)", value: 150, borderClass: "border-[#ef9a9a]", textClass: "text-[#ef4444]" },
  {
    label: "ATENÇÃO (100)",
    value: 100,
    borderClass: "border-[#eebf6f]",
    textClass: "text-[#e89b17]",
  },
  {
    label: "META (70)",
    value: 70,
    borderClass: "border-[#8ad9c0]",
    textClass: "text-[#16a34a]",
  },
] as const;

function formatDateLabel(inputDate: string) {
  const parsed = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return inputDate;
  }

  return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function shiftInputDate(inputDate: string, days: number) {
  const parsed = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return inputDate;
  }

  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function resolveEvolutionChartMax(points: DashboardEvolucaoLeadPoint[]) {
  const highestValue = points.reduce((maxValue, point) => Math.max(maxValue, point.performance), 0);
  const rawMax = Math.max(EVOLUCAO_BASELINE_MAX, highestValue, ...EVOLUCAO_THRESHOLDS.map((item) => item.value));
  return Math.max(EVOLUCAO_BASELINE_MAX, Math.ceil(rawMax / 50) * 50);
}

function chartValueToY(value: number, chartMax: number) {
  if (chartMax <= 0) {
    return EVOLUCAO_CHART_HEIGHT;
  }

  const clamped = Math.min(Math.max(value, 0), chartMax);
  return Number((EVOLUCAO_CHART_HEIGHT - (clamped / chartMax) * EVOLUCAO_CHART_HEIGHT).toFixed(2));
}

type DashboardListLoadingProps = {
  label: string;
};

function DashboardListLoading({ label }: DashboardListLoadingProps) {
  return (
    <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-white/20 bg-white/60 backdrop-blur-md shadow-lg">
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner size="lg" label={label} />
      </div>
    </div>
  );
}

function getDashboardLoadingLabel(activeView: DashboardView) {
  if (activeView === "orcamentos") {
    return "Carregando orcamentos...";
  }

  if (activeView === "evolucao-leads") {
    return "Carregando evolução de leads...";
  }

  if (activeView === "retrato") {
    return "Carregando retrato...";
  }

  return "Carregando funil...";
}

type DashboardListContentProps = {
  activeView: DashboardView;
  dataInicioInput: string;
  dataFimInput: string;
  selectedTipoAcesso: string;
  selectedUsuario: number;
  selectedVerticalId: string;
  representantes: DashboardRepresentanteOption[];
  visibleFunilColumns: FunilColumn[];
  percentageMode: boolean;
  percentageBaseKey: FunilColumnKey | null;
  selectedTipoRepre: string;
  orcamentosScopedUsuarioId: number | undefined;
  fullscreenDashboardMode?: boolean;
};

async function DashboardListContent({
  activeView,
  dataInicioInput,
  dataFimInput,
  selectedTipoAcesso,
  selectedUsuario,
  selectedVerticalId,
  representantes,
  visibleFunilColumns,
  percentageMode,
  percentageBaseKey,
  selectedTipoRepre,
  orcamentosScopedUsuarioId,
  fullscreenDashboardMode = false,
}: DashboardListContentProps) {
  if (activeView === "dashboard") {
    const dashboardSnapshot = await getDashboardFunilSnapshot({
      dataInicioInput,
      dataFimInput,
      tipoAcesso2: selectedTipoAcesso,
      usuarioId: selectedUsuario || undefined,
      verticalId: selectedVerticalId,
      allowedUsuarioIds: representantes.map((representante) => representante.id),
      allowedUsuarioNomes: representantes.map((representante) => representante.nome),
      allowedRepresentantes: representantes,
    });

    const listContainerClass = fullscreenDashboardMode
      ? "h-full overflow-hidden rounded-xl border border-white/20 bg-white/80 backdrop-blur-md shadow-lg"
      : "max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-white/20 bg-white/60 backdrop-blur-md shadow-lg";
    const tableClass = fullscreenDashboardMode ? "w-full table-fixed border-collapse" : "w-max min-w-full border-collapse";

    return (
      <div className={listContainerClass}>
        <table className={tableClass}>
          <thead className="bg-[#d6d6d8]/80 backdrop-blur-sm">
            <tr>
              {visibleFunilColumns.map((column) => (
                <th
                  key={column.key}
                  className={`${baseCellClass(
                    fullscreenDashboardMode ? undefined : column.widthClass,
                    fullscreenDashboardMode,
                  )} ${
                    isFunilNumericColumn(column.key) ? "text-right" : "text-left"
                  } text-[0.92rem] font-semibold text-[#18484a]`}
                >
                  {column.tooltip ? (
                    <span className="group relative inline-flex items-center gap-1">
                      <span>{column.label}</span>
                      <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 hidden w-max max-w-[36rem] -translate-x-1/2 whitespace-normal break-words rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-medium leading-relaxed text-white shadow-xl group-hover:block">
                        {column.tooltip}
                      </span>
                    </span>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dashboardSnapshot.rows.map((row, rowIndex) => {
              const rowKey = `${
                Number.isFinite(row.usuarioId) && row.usuarioId > 0
                  ? `u${Math.trunc(row.usuarioId)}`
                  : `n${row.nome}`
              }-${rowIndex}`;

              return (
                <tr
                  key={rowKey}
                  className="border-t border-white/10"
                  style={{ backgroundColor: getFunilRowBackgroundColor(row.l100) }}
                >
                  {visibleFunilColumns.map((column) => (
                    <td
                      key={`${rowKey}-${column.key}`}
                      className={`${baseCellClass(
                        fullscreenDashboardMode ? undefined : column.widthClass,
                        fullscreenDashboardMode,
                      )} ${
                        fullscreenDashboardMode ? "py-3.5" : ""
                      } ${
                        column.key === "min"
                          ? "text-[0.84rem] tracking-wide text-slate-700"
                          : "text-[0.95rem] text-slate-700"
                      } ${isFunilNumericColumn(column.key) ? "text-right tabular-nums" : "text-left"}`}
                    >
                      <span
                        className={
                          column.key === "min"
                            ? fullscreenDashboardMode
                              ? "inline-block text-right"
                              : "inline-block min-w-[5.4rem] text-right"
                            : ""
                        }
                      >
                        {(() => {
                          const rowValue = getFunilRowCellValue(row, column.key);

                          if (!percentageMode || !percentageBaseKey) {
                            return String(rowValue);
                          }

                          if (column.key === "n21" || !HASH_FUNIL_COLUMN_KEYS.includes(column.key)) {
                            return String(rowValue);
                          }

                          if (column.key === percentageBaseKey) {
                            return "100%";
                          }

                          const baseValue = getFunilRowCellValue(row, percentageBaseKey);
                          return formatPercentageValue(rowValue, baseValue);
                        })()}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#c9c9cb] bg-[#d6d6d8]">
              {visibleFunilColumns.map((column) => (
                <td
                  key={`total-${column.key}`}
                  className={`${baseCellClass(
                    fullscreenDashboardMode ? undefined : column.widthClass,
                    fullscreenDashboardMode,
                  )} font-semibold ${
                    column.key === "min"
                      ? "text-[0.86rem] tracking-wide text-[#18484a]"
                      : "text-[1.02rem] text-[#18484a]"
                  } ${isFunilNumericColumn(column.key) ? "text-right tabular-nums" : "text-left"}`}
                >
                  <span
                    className={
                      column.key === "min"
                        ? fullscreenDashboardMode
                          ? "inline-block text-right"
                          : "inline-block min-w-[5.4rem] text-right"
                        : ""
                    }
                  >
                    {(() => {
                      const totalValue = getFunilTotalCellValue(dashboardSnapshot.totals, column.key);

                      if (!percentageMode || !percentageBaseKey) {
                        return formatFunilFooterCellValue(column.key, totalValue);
                      }

                      if (column.key === "n21" || !HASH_FUNIL_COLUMN_KEYS.includes(column.key)) {
                        return formatFunilFooterCellValue(column.key, totalValue);
                      }

                      if (column.key === percentageBaseKey) {
                        return "100%";
                      }

                      const totalBaseValue = getFunilTotalCellValue(dashboardSnapshot.totals, percentageBaseKey);
                      return formatPercentageValue(totalValue, totalBaseValue);
                    })()}
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  if (activeView === "retrato") {
    const retratoSnapshot = await getDashboardRetratoSnapshot({
      tipoAcesso2: selectedTipoAcesso,
      usuarioId: selectedUsuario || undefined,
      verticalId: selectedVerticalId || undefined,
    });

    return <DashboardRetratoTable rows={retratoSnapshot.rows} totals={retratoSnapshot.totals} />;
  }

  if (activeView === "evolucao-leads") {
    const evolucaoSnapshot = await getDashboardEvolucaoLeadsSnapshot({
      dataInicioInput,
      dataFimInput,
    });
    const chartPoints =
      evolucaoSnapshot.points.length > 0
        ? evolucaoSnapshot.points
        : [{ dia: evolucaoSnapshot.dataInicioInput, performance: 0 }];
    const chartMax = resolveEvolutionChartMax(chartPoints);
    const tickValues = [4, 3, 2, 1, 0].map((step) => Math.round((chartMax * step) / 4));
    const chartInsetX = 56;
    const chartStartX = chartInsetX;
    const chartEndX = 1000 - chartInsetX;
    const chartStepX = chartPoints.length > 1 ? (chartEndX - chartStartX) / (chartPoints.length - 1) : 0;
    const plottedPoints = chartPoints.map((point, index) => ({
      ...point,
      x: Number((chartStartX + chartStepX * index).toFixed(2)),
      y: chartValueToY(point.performance, chartMax),
    }));
    const chartLinePath = plottedPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
      .join(" ");
    const firstPoint = plottedPoints[0] ?? {
      dia: evolucaoSnapshot.dataInicioInput,
      performance: 0,
      x: chartStartX,
      y: chartValueToY(0, chartMax),
    };
    const chartAreaPath = `${chartLinePath} V ${EVOLUCAO_CHART_HEIGHT} H ${firstPoint.x} Z`;
    const startLabel = formatDateLabel(
      plottedPoints[0]?.dia ?? evolucaoSnapshot.dataInicioInput,
    );
    const endLabel = formatDateLabel(
      plottedPoints[plottedPoints.length - 1]?.dia ?? evolucaoSnapshot.dataFimInput,
    );

    return (
      <div className="rounded-[30px] border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-md sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#16423c]">Evolução de Leads</h3>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#174f46]" />
            <span className="text-sm font-semibold text-slate-500">Real</span>
          </div>
        </div>

        <div className="relative h-[480px] w-full px-6">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {tickValues.map((value) => (
              <div key={value} className="relative w-full border-t border-slate-200/70 pl-11">
                <span className="absolute -top-2 left-0 w-9 pr-1 text-right text-xs font-medium text-[#95a4b8]">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {EVOLUCAO_THRESHOLDS.map((threshold) => (
            <div
              key={threshold.label}
              className={`pointer-events-none absolute inset-x-0 border-t-2 border-dashed ${threshold.borderClass}`}
              style={{ bottom: `${Math.max(0, Math.min(100, (threshold.value / chartMax) * 100))}%` }}
            >
              <span
                className={`absolute top-[-22px] right-2 rounded-sm bg-white/90 px-2 py-0.5 text-[11px] font-bold tracking-widest ${threshold.textClass}`}
              >
                {threshold.label}
              </span>
            </div>
          ))}

          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 480">
            <path
              d={chartLinePath}
              fill="none"
              stroke="#174f46"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
            <path d={chartAreaPath} fill="url(#evolucao-gradient)" opacity="0.32" />
            <defs>
              <linearGradient id="evolucao-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#667a78", stopOpacity: 0.35 }} />
                <stop offset="100%" style={{ stopColor: "#667a78", stopOpacity: 0.02 }} />
              </linearGradient>
            </defs>
            {plottedPoints.map((point) => (
              <g key={`${point.dia}-${point.x}`} className="group">
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={0}
                  y2={EVOLUCAO_CHART_HEIGHT}
                  stroke="#174f46"
                  strokeDasharray="4 4"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                  className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  pointerEvents="none"
                />
                <circle cx={point.x} cy={point.y} r="4" fill="#174f46" />
              </g>
            ))}
          </svg>
        </div>

        <div className="relative mt-6 h-6 px-6">
          {plottedPoints.map((point) => (
            <span
              key={`x-label-${point.dia}-${point.x}`}
              className="absolute top-0 -translate-x-1/2 text-xs font-medium text-[#95a4b8] whitespace-nowrap"
              style={{ left: `${(point.x / 1000) * 100}%` }}
            >
              {formatDateLabel(point.dia)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const orcamentosSnapshot = await getDashboardOrcamentosSnapshot({
    dataInicioInput,
    dataFimInput,
    tipoRepre: selectedTipoRepre,
    usuarioId: orcamentosScopedUsuarioId,
  });

  return (
    <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-white/20 bg-white/60 backdrop-blur-md shadow-lg">
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-[#d6d6d8]/80 backdrop-blur-sm">
          <tr>
            {orcamentosColumns.map((column) => (
              <th
                key={column.key}
                className={`${baseCellClass(column.widthClass)} text-left text-[clamp(0.82rem,0.98vw,1rem)] font-semibold text-[#18484a]`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orcamentosSnapshot.rows.length > 0 ? (
            <>
              {orcamentosSnapshot.rows.map((row, rowIndex) => (
                <tr key={`${row.idUsuario}-${rowIndex}`} className="border-t border-white/10 bg-white/40">
                  {orcamentosColumns.map((column) => (
                    <td
                      key={`${row.idUsuario}-${rowIndex}-${column.key}`}
                      className={`${baseCellClass(column.widthClass)} text-[clamp(0.8rem,0.95vw,0.98rem)] text-slate-700`}
                    >
                      {formatOrcamentosCellValue(column.key, getOrcamentosRowCellValue(row, column.key))}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ) : null}
        </tbody>
        {orcamentosSnapshot.rows.length > 0 ? (
          <tfoot>
            <tr className="border-t border-white/20 bg-[#d6d6d8]/60 backdrop-blur-sm">
              {orcamentosColumns.map((column) => (
                <td
                  key={`orcamentos-total-${column.key}`}
                  className={`${baseCellClass(column.widthClass)} text-[clamp(0.92rem,1.06vw,1.1rem)] font-semibold text-[#18484a]`}
                >
                  {formatOrcamentosCellValue(column.key, getOrcamentosTotalCellValue(orcamentosSnapshot.totals, column.key))}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : (
          <tfoot>
            <tr className="border-t border-white/10 bg-white/40">
              <td colSpan={orcamentosColumns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                Nenhum registro encontrado para os filtros selecionados.
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const requestedView = normalizeViewSelection(getSearchValue(params.view));
  const defaultRange = getDefaultDateRangeInput();
  const defaultFimInput = requestedView === "orcamentos" ? getYesterdayInputDate() : defaultRange.dataFim;
  const defaultInicioInput =
    requestedView === "orcamentos" ? shiftInputDate(defaultFimInput, -30) : defaultRange.dataInicio;
  const dataInicioInput = normalizeInputDate(getSearchValue(params.data_inicio), defaultInicioInput);
  const dataFimInput = normalizeInputDate(getSearchValue(params.data_fim), defaultFimInput);
  const fullscreenRequested = normalizeFullscreenSelection(getSearchValue(params.fullscreen));
  const requestedTipoAcesso = normalizeTipoAcessoSelection(getSearchValue(params.tipo_acesso_2));
  const requestedUsuario = normalizeUsuarioSelection(getSearchValue(params.usuario));
  const requestedTipoRepre = normalizeCarteiraSelection(
    getSearchValue(params.tipo_repre) ?? getSearchValue(params.carteira),
  );
  const percentageMode = normalizePercentageToggle(getSearchValue(params.porcentagem));
  const dashboardAccessScope = await getDashboardViewerAccessScope();
  const canViewInternalFunilTags = dashboardAccessScope.isGerencia || dashboardAccessScope.isGestor;
  const allowedFunilColumns = canViewInternalFunilTags
    ? funilColumns
    : funilColumns.filter((column) => column.key !== "n14" && column.key !== "n15");
  const selectedFunilColumnKeys = normalizeFunilColumnsSelection(params.colunas, allowedFunilColumns);
  const visibleFunilColumns = allowedFunilColumns.filter((column) => selectedFunilColumnKeys.includes(column.key));
  const percentageBaseKey = resolveFunilPercentageBaseKey(visibleFunilColumns);
  const visibleViews = getVisibleDashboardViews(
    dashboardAccessScope.viewerVerticalDescricao,
    dashboardAccessScope.viewerTipoAcesso2,
  );
  const activeView = visibleViews.includes(requestedView) ? requestedView : visibleViews[0] ?? "dashboard";
  const canViewOrcamentosAllVertical = dashboardAccessScope.isGerencia;
  const forcedOrcamentosVertical = resolveForcedOrcamentosVertical(
    dashboardAccessScope.viewerVerticalDescricao,
    dashboardAccessScope.viewerTipoAcesso2,
    dashboardAccessScope.viewerVerticalId,
  );
  const selectedTipoRepre = canViewOrcamentosAllVertical
    ? requestedTipoRepre
    : forcedOrcamentosVertical || requestedTipoRepre;
  const orcamentosScopedUsuarioId =
    dashboardAccessScope.isGerencia || dashboardAccessScope.isGestor
      ? undefined
      : Math.max(0, Math.trunc(dashboardAccessScope.viewerUsuarioId || 0));

  const selectedTipoAcesso = dashboardAccessScope.allowTipoSelection
    ? requestedTipoAcesso
    : dashboardAccessScope.forcedTipoAcesso2;

  const baseRepresentantes = dashboardAccessScope.allowTipoSelection
    ? await getDashboardRepresentantesByTipo(selectedTipoAcesso, { includeAllEligibleWhenTipoEmpty: true })
    : await getDashboardRepresentantesByTipo(dashboardAccessScope.forcedTipoAcesso2, {
        verticalId: dashboardAccessScope.viewerVerticalId,
      });

  const representantes = !dashboardAccessScope.allowUsuarioSelection
    ? (() => {
        const selfId = Math.max(0, Math.trunc(dashboardAccessScope.viewerUsuarioId));
        if (selfId <= 0) {
          return [] as typeof baseRepresentantes;
        }

        const selfRow = baseRepresentantes.find((representante) => representante.id === selfId);
        if (selfRow) {
          return [selfRow];
        }

        return [
          {
            id: selfId,
            nome: dashboardAccessScope.viewerNome || "Representante",
            verticalId: dashboardAccessScope.viewerVerticalId,
          },
        ];
      })()
    : baseRepresentantes;

  const requestedUsuarioAllowed =
    requestedUsuario > 0 && representantes.some((representante) => representante.id === requestedUsuario);

  const selectedUsuario = dashboardAccessScope.allowUsuarioSelection
    ? requestedUsuarioAllowed
      ? requestedUsuario
      : 0
    : Math.max(0, Math.trunc(dashboardAccessScope.viewerUsuarioId));

  const selectedRepresentante = representantes.find((representante) => representante.id === selectedUsuario);
  const selectedVerticalId =
    selectedUsuario > 0
      ? selectedRepresentante?.verticalId || dashboardAccessScope.viewerVerticalId
      : dashboardAccessScope.allowTipoSelection
        ? selectedTipoAcesso
          ? (representantes[0]?.verticalId ?? "")
          : ""
        : dashboardAccessScope.viewerVerticalId;
  const isDashboardFullscreen = activeView === "dashboard" && fullscreenRequested;
  const dashboardNormalHref = buildDashboardFunilHref({
    dataInicioInput,
    dataFimInput,
    selectedTipoAcesso,
    selectedUsuario,
    selectedColumnKeys: selectedFunilColumnKeys,
    percentageMode,
    fullscreen: false,
  });
  const dashboardFullscreenHref = buildDashboardFunilHref({
    dataInicioInput,
    dataFimInput,
    selectedTipoAcesso,
    selectedUsuario,
    selectedColumnKeys: selectedFunilColumnKeys,
    percentageMode,
    fullscreen: true,
  });

  if (isDashboardFullscreen) {
    return (
      <section className="flex h-full min-h-0 flex-col bg-[#eef0f2] p-2 lg:p-4">
        <div className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-white/30 bg-white/65 p-3 shadow-xl backdrop-blur-md lg:p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-slate-800 lg:text-4xl">Funil comercial</h2>
            <Link
              href={dashboardNormalHref}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f5050] px-4 text-sm font-semibold text-white transition hover:bg-[#0c4343]"
              title="Minimizar tela"
            >
              <Minimize2 className="h-4 w-4" />
              Minimizar
            </Link>
          </div>

          <DashboardFiltersForm
            key={`${dataInicioInput}:${dataFimInput}:${selectedTipoAcesso}:${selectedUsuario}:${dashboardAccessScope.allowTipoSelection}:${dashboardAccessScope.allowUsuarioSelection}:dashboard:fullscreen`}
            dataInicioInput={dataInicioInput}
            dataFimInput={dataFimInput}
            selectedTipoAcesso={selectedTipoAcesso}
            selectedUsuario={selectedUsuario}
            representantes={representantes}
            lockTipoSelection={!dashboardAccessScope.allowTipoSelection}
            lockUsuarioSelection={!dashboardAccessScope.allowUsuarioSelection}
            columnOptions={allowedFunilColumns.map((column) => ({ key: column.key, label: column.label }))}
            selectedColumnKeys={selectedFunilColumnKeys}
            percentageMode={percentageMode}
            fullscreenMode
          />

          <div className="min-h-0 flex-1 overflow-hidden">
            <Suspense
              key={`${activeView}:${dataInicioInput}:${dataFimInput}:${selectedTipoAcesso}:${selectedUsuario}:${selectedTipoRepre}:${percentageMode}:${selectedFunilColumnKeys.join(",")}:fullscreen`}
              fallback={<DashboardListLoading label={getDashboardLoadingLabel(activeView)} />}
            >
              <DashboardListContent
                activeView={activeView}
                dataInicioInput={dataInicioInput}
                dataFimInput={dataFimInput}
                selectedTipoAcesso={selectedTipoAcesso}
                selectedUsuario={selectedUsuario}
                selectedVerticalId={selectedVerticalId}
                representantes={representantes}
                visibleFunilColumns={visibleFunilColumns}
                percentageMode={percentageMode}
                percentageBaseKey={percentageBaseKey}
                selectedTipoRepre={selectedTipoRepre}
                orcamentosScopedUsuarioId={orcamentosScopedUsuarioId}
                fullscreenDashboardMode
              />
            </Suspense>
          </div>
        </div>
      </section>
    );
  }

  return (
    <PageContainer className="space-y-5 bg-[#eef0f2]">
        <div className="flex flex-wrap items-center gap-3">
          {visibleViews.includes("dashboard") ? (
            <Link
              href="/dashboard"
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white ${
                activeView === "dashboard" ? "bg-[#0f5050]" : "bg-[#6ca89a]"
              }`}
            >
              Dashboard
            </Link>
          ) : null}
          {visibleViews.includes("retrato") ? (
            <Link
              href="/dashboard?view=retrato"
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white ${
                activeView === "retrato" ? "bg-[#0f5050]" : "bg-[#6ca89a]"
              }`}
            >
              Retrato
            </Link>
          ) : null}
          {visibleViews.includes("evolucao-leads") ? (
            <Link
              href={`/dashboard?view=evolucao-leads&data_inicio=${dataInicioInput}&data_fim=${dataFimInput}`}
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white ${
                activeView === "evolucao-leads" ? "bg-[#0f5050]" : "bg-[#6ca89a]"
              }`}
            >
              Evolução de Leads
            </Link>
          ) : null}
          {visibleViews.includes("orcamentos") ? (
            <Link
              href="/dashboard?view=orcamentos"
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white ${
                activeView === "orcamentos" ? "bg-[#0f5050]" : "bg-[#6ca89a]"
              }`}
            >
              {"Orçamentos"}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-5xl font-semibold leading-tight text-slate-800 sm:text-[46px]">
              {activeView === "retrato"
                ? "Retrato"
                : activeView === "evolucao-leads"
                  ? "Dashboard de Evolução de Leads"
                : activeView === "orcamentos"
                  ? "Orçamentos"
                  : "Funil comercial"}
            </h2>
            {activeView === "dashboard" ? (
              <p className="mt-2 text-xl text-slate-600">Informações do Funil de vendas</p>
            ) : null}
            {activeView === "evolucao-leads" ? (
              <p className="mt-2 text-xl text-slate-600">
                Acompanhe o crescimento e performance da sua base de leads.
              </p>
            ) : null}
          </div>
          {activeView === "dashboard" ? (
            <Link
              href={dashboardFullscreenHref}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f5050] px-4 text-sm font-semibold text-white transition hover:bg-[#0c4343]"
              title="Maximizar tela"
            >
              <Maximize2 className="h-4 w-4" />
              Maximizar
            </Link>
          ) : null}
        </div>

        {activeView === "dashboard" ? (
          <DashboardFiltersForm
            key={`${dataInicioInput}:${dataFimInput}:${selectedTipoAcesso}:${selectedUsuario}:${dashboardAccessScope.allowTipoSelection}:${dashboardAccessScope.allowUsuarioSelection}:dashboard`}
            dataInicioInput={dataInicioInput}
            dataFimInput={dataFimInput}
            selectedTipoAcesso={selectedTipoAcesso}
            selectedUsuario={selectedUsuario}
            representantes={representantes}
            lockTipoSelection={!dashboardAccessScope.allowTipoSelection}
            lockUsuarioSelection={!dashboardAccessScope.allowUsuarioSelection}
            columnOptions={allowedFunilColumns.map((column) => ({ key: column.key, label: column.label }))}
            selectedColumnKeys={selectedFunilColumnKeys}
            percentageMode={percentageMode}
            fullscreenMode={false}
          />
        ) : (
          <>
            {activeView === "retrato" ? (
              <RetratoFiltersForm
                key={`${selectedTipoAcesso}:${selectedUsuario}:${dashboardAccessScope.allowTipoSelection}:${dashboardAccessScope.allowUsuarioSelection}:retrato`}
                selectedTipoAcesso={selectedTipoAcesso}
                selectedUsuario={selectedUsuario}
                representantes={representantes}
                lockTipoSelection={!dashboardAccessScope.allowTipoSelection}
                lockUsuarioSelection={!dashboardAccessScope.allowUsuarioSelection}
              />
            ) : activeView === "evolucao-leads" ? (
              <form
                action="/dashboard"
                method="get"
                className="flex flex-wrap items-end gap-4 rounded-2xl border border-white/20 bg-white/65 p-4 shadow-lg backdrop-blur-md"
              >
                <input type="hidden" name="view" value="evolucao-leads" />

                <div className="min-w-[200px] flex-1">
                  <label className="mb-1.5 ml-1 block text-xs font-bold uppercase text-slate-400">Início</label>
                  <input
                    type="date"
                    name="data_inicio"
                    defaultValue={dataInicioInput}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-[#0f5050] focus:ring-2 focus:ring-[#0f50503a]"
                  />
                </div>

                <div className="min-w-[200px] flex-1">
                  <label className="mb-1.5 ml-1 block text-xs font-bold uppercase text-slate-400">Fim</label>
                  <input
                    type="date"
                    name="data_fim"
                    defaultValue={dataFimInput}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-[#0f5050] focus:ring-2 focus:ring-[#0f50503a]"
                  />
                </div>

                <button
                  type="submit"
                  className="h-11 rounded-xl bg-[#0f5050] px-8 text-sm font-semibold text-white transition hover:bg-[#0c4343]"
                >
                  Buscar
                </button>

                <Link
                  href={`/dashboard?view=evolucao-leads&data_inicio=${defaultRange.dataInicio}&data_fim=${defaultRange.dataFim}`}
                  className="inline-flex h-11 items-center rounded-xl bg-slate-200 px-8 text-sm font-semibold text-slate-600 transition hover:bg-slate-300"
                >
                  Limpar
                </Link>

                <div className="ml-auto flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    className="rounded-lg px-4 py-1.5 text-sm font-medium text-slate-500"
                  >
                    Barras
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-[#0f5050] px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                  >
                    Linhas
                  </button>
                </div>
              </form>
            ) : (
              <OrcamentosFiltersForm
                key={`${selectedTipoRepre}:${dataInicioInput}:${dataFimInput}:${canViewOrcamentosAllVertical}:orcamentos`}
                selectedTipoRepre={selectedTipoRepre}
                dataInicioInput={dataInicioInput}
                dataFimInput={dataFimInput}
                lockTipoRepreSelection={!canViewOrcamentosAllVertical}
              />
            )}
          </>
        )}

        <Suspense
          key={`${activeView}:${dataInicioInput}:${dataFimInput}:${selectedTipoAcesso}:${selectedUsuario}:${selectedTipoRepre}:${percentageMode}:${selectedFunilColumnKeys.join(",")}`}
          fallback={
            <DashboardListLoading label={getDashboardLoadingLabel(activeView)} />
          }
        >
          <DashboardListContent
            activeView={activeView}
            dataInicioInput={dataInicioInput}
            dataFimInput={dataFimInput}
            selectedTipoAcesso={selectedTipoAcesso}
            selectedUsuario={selectedUsuario}
            selectedVerticalId={selectedVerticalId}
            representantes={representantes}
            visibleFunilColumns={visibleFunilColumns}
            percentageMode={percentageMode}
            percentageBaseKey={percentageBaseKey}
            selectedTipoRepre={selectedTipoRepre}
            orcamentosScopedUsuarioId={orcamentosScopedUsuarioId}
            fullscreenDashboardMode={false}
          />
        </Suspense>
      </PageContainer>
  );
}

