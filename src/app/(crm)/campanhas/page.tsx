import { CampanhasDashShell, normalizeCampanhaTab } from "@/components/campanhas/campanhas-dash-shell";
import { PageContainer } from "@/components/layout/page-container";

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

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackValue;
  }

  return parsed.toISOString().slice(0, 10);
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

  return (
    <PageContainer className="flex h-full min-h-0 flex-col bg-[#eceef0]">
      <div className="min-h-0 flex-1 rounded-2xl bg-[#e4e6e8] p-4">
        <CampanhasDashShell activeTab={activeTab} dataInicio={dataInicio} dataFim={dataFim} />
      </div>
    </PageContainer>
  );
}
