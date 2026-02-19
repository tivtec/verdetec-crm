import { ClientesControlShell } from "@/components/clientes/clientes-control-shell";
import type { ClienteControleRow, ClientesControlFiltersValue } from "@/components/clientes/types";
import { PageContainer } from "@/components/layout/page-container";
import {
  getClientes,
  getClientesControleRows,
  getClientesEquipamentos,
  getClientesRepresentantes,
  getDashboardViewerAccessScope,
  getCurrentUsuarioLegacyId,
} from "@/services/crm/api";
import { formatDateTime } from "@/utils/format";

const fallbackRows: ClienteControleRow[] = [
  {
    id: "1",
    etiqueta: "#10 - 14/02/2026 11:44",
    telefone: "+5492314405665",
    nome: "Gabi Arizcuren",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "2",
    etiqueta: "#10 - 14/02/2026 10:32",
    telefone: "+5493525630012",
    nome: "Eduardo",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "3",
    etiqueta: "#10 - 14/02/2026 09:34",
    telefone: "+5493624126014",
    nome: "Eas",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "4",
    etiqueta: "#60 - 14/02/2026 11:15",
    telefone: "+59891074377",
    nome: "Pablo Orihuela",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "5",
    etiqueta: "#10 - 14/02/2026 07:10",
    telefone: "+5493584024817",
    nome: "Ruc Agro",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "6",
    etiqueta: "#10 - 14/02/2026 06:13",
    telefone: "+5492342508018",
    nome: "Guillermo Anso",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "7",
    etiqueta: "#60 - 14/02/2026 07:44",
    telefone: "31984757163",
    nome: "Divina",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "8",
    etiqueta: "#60 - 14/02/2026 03:14",
    telefone: "44998214843",
    nome: "Blindado E Protegido",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "9",
    etiqueta: "#60 - 14/02/2026 00:00",
    telefone: "+5493515589761",
    nome: "z",
    equipamento: null,
    data30: null,
    data40: null,
  },
  {
    id: "10",
    etiqueta: "#60 - 14/02/2026 00:01",
    telefone: "+5493704258223",
    nome: "Sergio Oviedo",
    equipamento: null,
    data30: null,
    data40: null,
  },
];

function normalizeEtiqueta(value: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "#10";
  }

  if (raw.startsWith("#")) {
    return raw.toUpperCase();
  }

  const numeric = raw.match(/\d+/)?.[0];
  if (numeric) {
    return `#${numeric}`;
  }

  if (raw.toLowerCase() === "lead") {
    return "#10";
  }

  return raw;
}

function safeFormatDateTime(value: string) {
  const formatted = formatDateTime(value);
  return formatted.includes("Invalid") ? "" : formatted;
}

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function normalizeEtiquetaFilterValue(value: string) {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  const digits = raw.match(/\d+/)?.[0];
  if (!digits) {
    return "";
  }

  return digits.slice(0, 2).padStart(2, "0");
}

function normalizeUsuarioFilterValue(value: string) {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  const parsed = Math.max(0, Math.trunc(Number(raw)));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "";
  }

  return String(parsed);
}

type ClientesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const params = await searchParams;
  const requestedUsuario = normalizeUsuarioFilterValue(getSearchValue(params.usuario) ?? "");
  const telefone = getSearchValue(params.telefone) ?? "";
  const nome = getSearchValue(params.nome) ?? "";
  const etiqueta = normalizeEtiquetaFilterValue(getSearchValue(params.etiqueta) ?? "");

  const [dashboardAccessScope, equipamentos, currentUserId] = await Promise.all([
    getDashboardViewerAccessScope(),
    getClientesEquipamentos(),
    getCurrentUsuarioLegacyId(),
  ]);

  const canSelectUsuario = dashboardAccessScope.isGerencia || dashboardAccessScope.isGestor;
  const viewerUsuarioId = Math.max(0, Math.trunc(dashboardAccessScope.viewerUsuarioId));

  let representantes = await getClientesRepresentantes(
    dashboardAccessScope.isGerencia ? {} : { verticalId: dashboardAccessScope.viewerVerticalId },
  );

  if (!canSelectUsuario) {
    if (viewerUsuarioId > 0) {
      const selfRow = representantes.find((representante) => representante.id === viewerUsuarioId);
      representantes = selfRow
        ? [selfRow]
        : [
            {
              id: viewerUsuarioId,
              nome: dashboardAccessScope.viewerNome || "Representante",
            },
          ];
    } else {
      representantes = [];
    }
  }

  const allowedRepresentanteIds = new Set<number>(representantes.map((representante) => representante.id));
  const selectedUsuario =
    !canSelectUsuario
      ? viewerUsuarioId > 0
        ? String(viewerUsuarioId)
        : ""
      : requestedUsuario.length > 0 && allowedRepresentanteIds.has(Number(requestedUsuario))
        ? requestedUsuario
        : "";

  const initialFilters: ClientesControlFiltersValue = {
    usuario: selectedUsuario,
    telefone,
    nome,
    etiqueta,
  };

  const webhookRowsRaw = await getClientesControleRows({
    usuarioId: selectedUsuario,
    telefone,
    etiqueta,
    nome,
  });

  const webhookRows =
    dashboardAccessScope.isGerencia || selectedUsuario.trim().length > 0
      ? webhookRowsRaw
      : webhookRowsRaw.filter((row) => {
          const rowUsuarioId = typeof row.usuarioId === "number" ? row.usuarioId : Number.NaN;
          return Number.isFinite(rowUsuarioId) && allowedRepresentanteIds.has(rowUsuarioId);
        });

  const hasFilters =
    selectedUsuario.trim().length > 0 ||
    telefone.trim().length > 0 ||
    nome.trim().length > 0 ||
    etiqueta.trim().length > 0;

  const clientes =
    dashboardAccessScope.isGerencia && webhookRows.length === 0 && !hasFilters ? await getClientes() : [];

  const fallbackRowsFromSupabase: ClienteControleRow[] = clientes.map((cliente, index) => {
    const etiquetaBase = normalizeEtiqueta(cliente.etiqueta);
    const createdAt = safeFormatDateTime(cliente.created_at);

    return {
      id: cliente.id || String(index + 1),
      etiqueta: createdAt ? `${etiquetaBase} - ${createdAt}` : etiquetaBase,
      telefone: cliente.telefone ?? null,
      nome: cliente.nome,
      equipamento: null,
      data30: null,
      data40: null,
    };
  });

  const rows =
    webhookRows.length > 0
      ? webhookRows
      : fallbackRowsFromSupabase.length > 0
        ? fallbackRowsFromSupabase
        : hasFilters
          ? []
          : fallbackRows;

  return (
    <PageContainer className="flex h-full min-h-0 flex-col gap-5 bg-[#eceef0]">
      <header>
        <h1 className="text-5xl font-semibold text-[#30343a]">Controle de Clientes</h1>
      </header>

      <div className="min-h-0 flex-1 rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-full overflow-hidden">
          <ClientesControlShell
            key={`${selectedUsuario}:${telefone}:${nome}:${etiqueta}`}
            initialRows={rows}
            representantes={representantes}
            equipamentos={equipamentos}
            initialFilters={initialFilters}
            currentUserId={currentUserId}
            lockUsuarioSelection={!canSelectUsuario}
            canShowEtiqueta50={dashboardAccessScope.isGerencia || dashboardAccessScope.isGestor}
          />
        </div>
      </div>
    </PageContainer>
  );
}
