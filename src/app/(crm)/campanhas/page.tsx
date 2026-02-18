import { CampanhasDashShell } from "@/components/campanhas/campanhas-dash-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getCampanhasDashSnapshot, getClientesRepresentantes, getTintimLinksSnapshot } from "@/services/crm/api";

type CampanhaTabKey = "dash" | "analytics" | "cadastrar" | "tintim" | "filtros" | "jornada";
export const dynamic = "force-dynamic";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getDefaultDateRange() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  return {
    dataInicio: startDate.toISOString().slice(0, 10),
    dataFim: endDate.toISOString().slice(0, 10),
  };
}

function normalizeInputDate(value: string | undefined, fallbackValue: string) {
  if (!value) {
    return fallbackValue;
  }

  const normalized = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    const [dd, mm, yyyy] = normalized.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    const [dd, mm, yyyy] = normalized.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackValue;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeCampanhaTab(value: string | undefined): CampanhaTabKey {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "analytics") return "analytics";
  if (normalized === "cadastrar") return "cadastrar";
  if (normalized === "tintim") return "tintim";
  if (normalized === "filtros") return "filtros";
  if (normalized === "jornada") return "jornada";
  return "dash";
}

function parsePositiveInt(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const intValue = Math.trunc(parsed);
  return intValue > 0 ? intValue : null;
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.trunc(parsed));
}

type CampanhasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CampanhasPage({ searchParams }: CampanhasPageProps) {
  const params = await searchParams;
  const defaultRange = getDefaultDateRange();
  const activeTab = normalizeCampanhaTab(getSearchValue(params.tab));
  const dataInicio = normalizeInputDate(getSearchValue(params.data_inicio), defaultRange.dataInicio);
  const dataFim = normalizeInputDate(getSearchValue(params.data_fim), defaultRange.dataFim);
  const tintimUsuarioParam = (getSearchValue(params.tintim_usuario) ?? "").trim();
  const tintimUtmParam = (getSearchValue(params.tintim_utm) ?? "").trim();
  const tintimPage = parsePage(getSearchValue(params.tintim_page));
  const tintimUsuarioId = parsePositiveInt(tintimUsuarioParam);
  const [representantes, tintimSnapshot, dashRows] = await Promise.all([
    getClientesRepresentantes(),
    getTintimLinksSnapshot({
      limit: 10,
      offset: (tintimPage - 1) * 10,
      usuarioId: tintimUsuarioId,
      utm: tintimUtmParam,
    }),
    activeTab === "dash"
      ? getCampanhasDashSnapshot({
          dataInicioInput: dataInicio,
          dataFimInput: dataFim,
        })
      : Promise.resolve([]),
  ]);

  const representanteById = new Map<number, string>();
  for (const representante of representantes) {
    representanteById.set(representante.id, representante.nome);
  }

  const tintimRows = tintimSnapshot.rows.map((row) => {
    const parsedDate = new Date(row.createdAt);
    const createdAt =
      !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");

    const usuarioId = row.usuarioId ?? 0;
    const nome = usuarioId > 0 ? (representanteById.get(usuarioId) ?? `Usuario ${usuarioId}`) : "Usuario";

    return {
      id: row.id,
      data: createdAt,
      usuarioId,
      nome,
      utm: row.pagina,
      linkTintim: row.linkTintim,
      frase: row.frase,
    };
  });

  return (
    <PageContainer className="flex h-full min-h-0 flex-col bg-[#eceef0]">
      <div className="min-h-0 flex-1 rounded-2xl bg-[#e4e6e8] p-4">
        <CampanhasDashShell
          activeTab={activeTab}
          dataInicio={dataInicio}
          dataFim={dataFim}
          dashRows={dashRows}
          representantes={representantes}
          tintimRows={tintimRows}
          tintimCurrentPage={tintimPage}
          tintimHasNextPage={tintimSnapshot.hasNextPage}
          tintimSelectedUsuario={tintimUsuarioParam}
          tintimSearchUtm={tintimUtmParam}
        />
      </div>
    </PageContainer>
  );
}
