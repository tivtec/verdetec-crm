import Link from "next/link";
import { Suspense } from "react";

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
  type DashboardEvolucaoLeadComparativoRow,
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
  { key: "orcAbertos", label: "Or\u00e7. Abertos", widthClass: "w-[9%]" },
  { key: "n10", label: "#10", widthClass: "w-[9%]" },
  { key: "orcFeitos", label: "Or\u00e7. Feitos", widthClass: "w-[9%]" },
  { key: "orcAprovado", label: "Or\u00e7. Aprovado", widthClass: "w-[9%]" },
  { key: "orcRep", label: "Or\u00e7. Rep", widthClass: "w-[9%]" },
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
    raw === "Time Neg\u00f3cios" ||
    raw === "Time de Neg\u00f3cios" ||
    raw === "Time de Negocios" ||
    raw === "Time Negocios"
  ) {
    return "Time Neg\u00f3cios";
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

function baseCellClass(widthClass?: string) {
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

function getVisibleDashboardViews(verticalDescricao: string): DashboardView[] {
  const scope = normalizeDashboardVerticalScope(verticalDescricao);

  if (scope === "gerencia" || scope === "prime") {
    return ["dashboard", "retrato", "evolucao-leads", "orcamentos"];
  }

  if (scope === "crv") {
    return ["orcamentos"];
  }

  if (scope === "time-negocios") {
    return ["dashboard", "retrato", "evolucao-leads"];
  }

  return ["dashboard", "retrato", "evolucao-leads", "orcamentos"];
}

const EVOLUCAO_CHART_HEIGHT = 480;
const EVOLUCAO_BASELINE_MAX = 200;
const EVOLUCAO_THRESHOLDS = [
  { label: "Critico (150)", value: 150, borderClass: "border-red-500/50", textClass: "text-red-500" },
  {
    label: "Atencao (100)",
    value: 100,
    borderClass: "border-amber-500/50",
    textClass: "text-amber-500",
  },
  {
    label: "Meta (70)",
    value: 70,
    borderClass: "border-emerald-500/50",
    textClass: "text-emerald-500",
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

function formatComparativoPeriodLabel(dataInicioInput: string, dataFimInput: string) {
  return `${formatDateLabel(dataInicioInput)} - ${formatDateLabel(dataFimInput)}`;
}

function formatEvolutionPerformancePercent(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function resolveEvolutionChartMax(rows: DashboardEvolucaoLeadComparativoRow[]) {
  const highestValue = rows.reduce((maxValue, row) => Math.max(maxValue, row.performancePercent), 0);
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
    return "Carregando evolucao de leads...";
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

    return (
      <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-white/20 bg-white/60 backdrop-blur-md shadow-lg">
        <table className="w-max min-w-full border-collapse">
          <thead className="bg-[#d6d6d8]/80 backdrop-blur-sm">
            <tr>
              {visibleFunilColumns.map((column) => (
                <th
                  key={column.key}
                  className={`${baseCellClass(column.widthClass)} ${
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
                      className={`${baseCellClass(column.widthClass)} ${
                        column.key === "min"
                          ? "text-[0.84rem] tracking-wide text-slate-700"
                          : "text-[0.95rem] text-slate-700"
                      } ${isFunilNumericColumn(column.key) ? "text-right tabular-nums" : "text-left"}`}
                    >
                      <span className={column.key === "min" ? "inline-block min-w-[5.4rem] text-right" : ""}>
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
                  className={`${baseCellClass(column.widthClass)} font-semibold ${
                    column.key === "min"
                      ? "text-[0.86rem] tracking-wide text-[#18484a]"
                      : "text-[1.02rem] text-[#18484a]"
                  } ${isFunilNumericColumn(column.key) ? "text-right tabular-nums" : "text-left"}`}
                >
                  <span className={column.key === "min" ? "inline-block min-w-[5.4rem] text-right" : ""}>
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
    const periodoAnteriorInicio = shiftInputDate(evolucaoSnapshot.dataInicioInput, -30);
    const periodoAnteriorFim = shiftInputDate(evolucaoSnapshot.dataFimInput, -30);
    const periodoAtualLabel = formatComparativoPeriodLabel(
      evolucaoSnapshot.dataInicioInput,
      evolucaoSnapshot.dataFimInput,
    );
    const periodoAnteriorLabel = formatComparativoPeriodLabel(periodoAnteriorInicio, periodoAnteriorFim);
    const chartRows = [evolucaoSnapshot.periodoAnterior, evolucaoSnapshot.periodoAtual];
    const chartMax = resolveEvolutionChartMax(chartRows);
    const tickValues = [4, 3, 2, 1, 0].map((step) => Math.round((chartMax * step) / 4));
    const yAnterior = chartValueToY(evolucaoSnapshot.periodoAnterior.performancePercent, chartMax);
    const yAtual = chartValueToY(evolucaoSnapshot.periodoAtual.performancePercent, chartMax);
    const chartLinePath = `M 0,${yAnterior} L 1000,${yAtual}`;
    const chartAreaPath = `M 0,${yAnterior} L 1000,${yAtual} V ${EVOLUCAO_CHART_HEIGHT} H 0 Z`;

    return (
      <div className="rounded-[30px] border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-md sm:p-8">
        <div className="mb-10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#16423c]">Evolucao de Leads</h3>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#16423c]" />
            <span className="text-xs font-medium text-slate-500">Performance (%)</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/30 bg-white/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Periodo Anterior</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{periodoAnteriorLabel}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <span>#10: {evolucaoSnapshot.periodoAnterior.qtd10}</span>
              <span>#61: {evolucaoSnapshot.periodoAnterior.qtd61}</span>
              <span>#50: {evolucaoSnapshot.periodoAnterior.qtd50}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#16423c]">
              {formatEvolutionPerformancePercent(evolucaoSnapshot.periodoAnterior.performancePercent)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Periodo Atual</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{periodoAtualLabel}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <span>#10: {evolucaoSnapshot.periodoAtual.qtd10}</span>
              <span>#61: {evolucaoSnapshot.periodoAtual.qtd61}</span>
              <span>#50: {evolucaoSnapshot.periodoAtual.qtd50}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#16423c]">
              {formatEvolutionPerformancePercent(evolucaoSnapshot.periodoAtual.performancePercent)}
            </p>
          </div>
        </div>

        <div className="relative h-[480px] w-full px-4">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {tickValues.map((value, index) => (
              <div key={value} className="relative w-full border-t border-slate-200/70">
                <span className="absolute top-0 right-[calc(100%+10px)] -translate-y-1/2 text-xs text-slate-400">
                  {index === tickValues.length - 1 ? 0 : value}
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
                className={`absolute top-[-24px] right-0 bg-white/90 px-2 text-[10px] font-bold tracking-widest uppercase ${threshold.textClass}`}
              >
                {threshold.label}
              </span>
            </div>
          ))}

          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 480">
            <path
              d={chartLinePath}
              fill="none"
              stroke="#16423C"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
            <path
              d={chartAreaPath}
              fill="url(#evolucao-gradient)"
              opacity="0.1"
            />
            <defs>
              <linearGradient id="evolucao-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#16423C", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#16423C", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <circle cx="0" cy={yAnterior} r="5" fill="#16423C" />
            <circle cx="1000" cy={yAtual} r="5" fill="#16423C" />
          </svg>
        </div>

        <div className="mt-6 flex justify-between px-4">
          <div className="text-xs font-medium text-slate-400">Anterior ({periodoAnteriorLabel})</div>
          <div className="text-xs font-medium text-slate-400">Atual ({periodoAtualLabel})</div>
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
  const dataInicioInput = normalizeInputDate(getSearchValue(params.data_inicio), defaultRange.dataInicio);
  const dataFimInput = normalizeInputDate(getSearchValue(params.data_fim), defaultRange.dataFim);
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
  const visibleViews = getVisibleDashboardViews(dashboardAccessScope.viewerVerticalDescricao);
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
              Evolucao de Leads
            </Link>
          ) : null}
          {visibleViews.includes("orcamentos") ? (
            <Link
              href="/dashboard?view=orcamentos"
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white ${
                activeView === "orcamentos" ? "bg-[#0f5050]" : "bg-[#6ca89a]"
              }`}
            >
              {"Or\u00e7amentos"}
            </Link>
          ) : null}
        </div>

        <div>
          <h2 className="text-5xl font-semibold leading-tight text-slate-800 sm:text-[46px]">
            {activeView === "retrato"
              ? "Retrato"
              : activeView === "evolucao-leads"
                ? "Dashboard de Evolucao de Leads"
              : activeView === "orcamentos"
                ? "Or\u00e7amentos"
                : "Funil comercial"}
          </h2>
          {activeView === "dashboard" ? (
            <p className="mt-2 text-xl text-slate-600">Informacoes do Funil de vendas</p>
          ) : null}
          {activeView === "evolucao-leads" ? (
            <p className="mt-2 text-xl text-slate-600">
              Acompanhe o crescimento e performance da sua base de leads.
            </p>
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
                  <label className="mb-1.5 ml-1 block text-xs font-bold uppercase text-slate-400">Inicio</label>
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
          />
        </Suspense>
      </PageContainer>
  );
}

