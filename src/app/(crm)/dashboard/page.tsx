import Link from "next/link";

import { DashboardFiltersForm } from "@/components/dashboard/dashboard-filters-form";
import { OrcamentosFiltersForm } from "@/components/dashboard/orcamentos-filters-form";
import { RetratoFiltersForm } from "@/components/dashboard/retrato-filters-form";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import {
  getDashboardFunilSnapshot,
  getDashboardOrcamentosSnapshot,
  getDashboardRepresentantesByTipo,
  getDashboardRetratoSnapshot,
  getDashboardViewerAccessScope,
  type DashboardFunilRow,
  type DashboardFunilTotals,
  type DashboardOrcamentosRow,
  type DashboardOrcamentosTotals,
  type DashboardRetratoRow,
  type DashboardRetratoTotals,
} from "@/services/crm/api";

export const dynamic = "force-dynamic";

type DashboardView = "dashboard" | "retrato" | "orcamentos";

type FunilColumnKey =
  | "nome"
  | "lead"
  | "plusL100"
  | "l100"
  | "n00"
  | "n10"
  | "n21"
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
};

type RetratoDataColumnKey = "lead" | "n00" | "n10" | "n21" | "n30" | "n35" | "n40" | "n50";
type RetratoColumnKey = "nome" | RetratoDataColumnKey;

type RetratoColumn = {
  key: RetratoColumnKey;
  label: string;
  widthClass?: string;
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
  { key: "n00", label: "#00", widthClass: "min-w-[84px]" },
  { key: "n10", label: "#10", widthClass: "min-w-[84px]" },
  { key: "n21", label: "#21", widthClass: "min-w-[84px]" },
  { key: "n05", label: "#05", widthClass: "min-w-[84px]" },
  { key: "n30", label: "#30", widthClass: "min-w-[84px]" },
  { key: "n40", label: "#40", widthClass: "min-w-[84px]" },
  { key: "n50", label: "#50", widthClass: "min-w-[84px]" },
  { key: "n60", label: "#60", widthClass: "min-w-[84px]" },
  { key: "n61", label: "#61", widthClass: "min-w-[84px]" },
  { key: "n62", label: "#62", widthClass: "min-w-[84px]" },
  { key: "n66", label: "#66", widthClass: "min-w-[84px]" },
  { key: "tv", label: "TV", widthClass: "min-w-[84px]" },
  { key: "min", label: "Min", widthClass: "min-w-[104px]" },
  { key: "qtd", label: "Qtd", widthClass: "min-w-[84px]" },
  { key: "umbler", label: "Umbler", widthClass: "min-w-[92px]" },
];

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

function normalizeFunilColumnsSelection(value: string | string[] | undefined) {
  const allowedKeys = new Set(funilColumns.map((column) => column.key));
  const rawValues = getSearchValues(value).flatMap((entry) => entry.split(","));
  const selected = rawValues
    .map((entry) => entry.trim() as FunilColumnKey)
    .filter((entry) => allowedKeys.has(entry));

  if (selected.length === 0) {
    return funilColumns.map((column) => column.key);
  }

  const uniqueSelected = Array.from(new Set(selected));
  return funilColumns.map((column) => column.key).filter((key) => uniqueSelected.includes(key));
}

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
    return ["dashboard", "retrato", "orcamentos"];
  }

  if (scope === "crv") {
    return ["orcamentos"];
  }

  if (scope === "time-negocios") {
    return ["dashboard", "retrato"];
  }

  return ["dashboard", "retrato", "orcamentos"];
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
  const selectedFunilColumnKeys = normalizeFunilColumnsSelection(params.colunas);
  const visibleFunilColumns = funilColumns.filter((column) => selectedFunilColumnKeys.includes(column.key));
  const dashboardAccessScope = await getDashboardViewerAccessScope();
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

  let dashboardSnapshot: Awaited<ReturnType<typeof getDashboardFunilSnapshot>> | null = null;
  let retratoSnapshot: Awaited<ReturnType<typeof getDashboardRetratoSnapshot>> | null = null;
  let orcamentosSnapshot: Awaited<ReturnType<typeof getDashboardOrcamentosSnapshot>> | null = null;

  if (activeView === "dashboard") {
    dashboardSnapshot = await getDashboardFunilSnapshot({
      dataInicioInput,
      dataFimInput,
      tipoAcesso2: selectedTipoAcesso,
      usuarioId: selectedUsuario || undefined,
      verticalId: selectedVerticalId,
      allowedUsuarioIds: representantes.map((representante) => representante.id),
      allowedUsuarioNomes: representantes.map((representante) => representante.nome),
    });
  } else {
    if (activeView === "retrato") {
      retratoSnapshot = await getDashboardRetratoSnapshot({
        tipoAcesso2: selectedTipoAcesso,
        usuarioId: selectedUsuario || undefined,
        verticalId: selectedVerticalId || undefined,
      });
    } else {
      orcamentosSnapshot = await getDashboardOrcamentosSnapshot({
        dataInicioInput,
        dataFimInput,
        tipoRepre: selectedTipoRepre,
        usuarioId: orcamentosScopedUsuarioId,
      });
    }
  }

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle="Painel de funil comercial"
        showUtilities={false}
      />

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
              : activeView === "orcamentos"
                ? "Or\u00e7amentos"
                : "Funil comercial"}
          </h2>
          {activeView === "dashboard" ? (
            <p className="mt-2 text-xl text-slate-600">Informacoes do Funil de vendas</p>
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
            columnOptions={funilColumns.map((column) => ({ key: column.key, label: column.label }))}
            selectedColumnKeys={selectedFunilColumnKeys}
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

        {activeView === "dashboard" ? (
          <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-slate-300 bg-white">
            <table className="w-max min-w-full border-collapse">
              <thead className="bg-[#d6d6d8]">
                <tr>
                  {visibleFunilColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`${baseCellClass(column.widthClass)} ${
                        isFunilNumericColumn(column.key) ? "text-right" : "text-left"
                      } text-[0.92rem] font-semibold text-[#18484a]`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboardSnapshot!.rows.map((row) => (
                  <tr key={row.nome} className="border-t border-[#e5e7ea] bg-[#f4f4f5]">
                    {visibleFunilColumns.map((column) => (
                      <td
                        key={`${row.nome}-${column.key}`}
                        className={`${baseCellClass(column.widthClass)} ${
                          column.key === "min"
                            ? "text-[0.84rem] tracking-wide text-slate-700"
                            : "text-[0.95rem] text-slate-700"
                        } ${isFunilNumericColumn(column.key) ? "text-right tabular-nums" : "text-left"}`}
                      >
                        <span className={column.key === "min" ? "inline-block min-w-[5.4rem] text-right" : ""}>
                          {String(getFunilRowCellValue(row, column.key))}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
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
                        {String(getFunilTotalCellValue(dashboardSnapshot!.totals, column.key))}
                      </span>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        ) : activeView === "retrato" ? (
          <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-slate-300 bg-white">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-[#d6d6d8]">
                <tr>
                  {retratoColumns.map((column) => (
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
                {retratoSnapshot!.rows.map((row, rowIndex) => (
                  <tr key={`${row.nome}-${rowIndex}`} className="border-t border-[#e5e7ea] bg-[#f4f4f5]">
                    {retratoColumns.map((column) => (
                      <td
                        key={`${row.nome}-${rowIndex}-${column.key}`}
                        className={`${baseCellClass(column.widthClass)} text-[clamp(0.8rem,0.95vw,0.98rem)] text-slate-700`}
                      >
                        {String(getRetratoRowCellValue(row, column.key))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#c9c9cb] bg-[#d6d6d8]">
                  {retratoColumns.map((column) => (
                    <td
                      key={`retrato-total-${column.key}`}
                      className={`${baseCellClass(column.widthClass)} text-[clamp(0.92rem,1.06vw,1.2rem)] font-semibold text-[#18484a]`}
                    >
                      {String(getRetratoTotalCellValue(retratoSnapshot!.totals, column.key))}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="max-h-[calc(100dvh-330px)] overflow-auto rounded-xl border border-slate-300 bg-white">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-[#d6d6d8]">
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
                {orcamentosSnapshot!.rows.length > 0 ? (
                  <>
                    {orcamentosSnapshot!.rows.map((row, rowIndex) => (
                      <tr key={`${row.idUsuario}-${rowIndex}`} className="border-t border-[#e5e7ea] bg-[#f4f4f5]">
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
              {orcamentosSnapshot!.rows.length > 0 ? (
                <tfoot>
                  <tr className="border-t border-[#c9c9cb] bg-[#d6d6d8]">
                    {orcamentosColumns.map((column) => (
                      <td
                        key={`orcamentos-total-${column.key}`}
                        className={`${baseCellClass(column.widthClass)} text-[clamp(0.92rem,1.06vw,1.1rem)] font-semibold text-[#18484a]`}
                      >
                        {formatOrcamentosCellValue(column.key, getOrcamentosTotalCellValue(orcamentosSnapshot!.totals, column.key))}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              ) : (
                <tfoot>
                  <tr className="border-t border-[#e5e7ea] bg-[#f4f4f5]">
                    <td
                      colSpan={orcamentosColumns.length}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </PageContainer>
    </>
  );
}
