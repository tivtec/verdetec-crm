import Link from "next/link";
import { Building2, Clock3, Download, Search } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getRhRegistroPontoSnapshot } from "@/services/rh/api";

type RhTab = "dashboard" | "registro-pontos";

type RhPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? "";
}

function normalizeTab(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "registro-pontos") {
    return "registro-pontos" satisfies RhTab;
  }

  return "dashboard" satisfies RhTab;
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDefaultDateRange() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    dataInicio: formatDateInput(monthStart),
    dataFim: formatDateInput(today),
  };
}

function normalizeDateInput(value: string, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : fallback;
}

function buildRhTabHref(
  tab: RhTab,
  nome: string,
  organizacaoId: string,
  dataInicio: string,
  dataFim: string,
) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (tab === "registro-pontos") {
    if (nome.trim().length > 0) {
      params.set("nome", nome.trim());
    }
    if (organizacaoId.trim().length > 0) {
      params.set("organizacao", organizacaoId.trim());
    }
    if (dataInicio.trim().length > 0) {
      params.set("data_inicio", dataInicio.trim());
    }
    if (dataFim.trim().length > 0) {
      params.set("data_fim", dataFim.trim());
    }
  }

  return `/rh?${params.toString()}`;
}

export default async function RhPage({ searchParams }: RhPageProps) {
  const params = await searchParams;
  const tab = normalizeTab(getSearchValue(params.tab));
  const nomeFilter = getSearchValue(params.nome).trim();
  const organizacaoFilter = getSearchValue(params.organizacao).trim();
  const defaultRange = resolveDefaultDateRange();
  const dataInicioFilter = normalizeDateInput(getSearchValue(params.data_inicio), defaultRange.dataInicio);
  const dataFimFilter = normalizeDateInput(getSearchValue(params.data_fim), defaultRange.dataFim);

  const snapshot =
    tab === "registro-pontos"
      ? await getRhRegistroPontoSnapshot({
          nome: nomeFilter,
          organizacaoId: organizacaoFilter,
        })
      : {
          rows: [],
          organizations: [],
        };

  const dashboardTabHref = buildRhTabHref(
    "dashboard",
    nomeFilter,
    organizacaoFilter,
    dataInicioFilter,
    dataFimFilter,
  );
  const registroTabHref = buildRhTabHref(
    "registro-pontos",
    nomeFilter,
    organizacaoFilter,
    dataInicioFilter,
    dataFimFilter,
  );
  const clearRegistroHref = "/rh?tab=registro-pontos";

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold text-[#2f3538] sm:text-5xl">Verdetec RH</h1>
        <p className="text-sm text-[#5a6469] sm:text-base">
          Painel de RH com visão de dashboard e registro de pontos dos colaboradores.
        </p>
      </header>

      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href={dashboardTabHref}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === "dashboard"
                ? "bg-[#0f5050] text-white"
                : "bg-[#c8dfde] text-[#1d4d50] hover:bg-[#b8d3d2]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href={registroTabHref}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === "registro-pontos"
                ? "bg-[#0f5050] text-white"
                : "bg-[#c8dfde] text-[#1d4d50] hover:bg-[#b8d3d2]"
            }`}
          >
            Registro de pontos
          </Link>
        </div>

        {tab === "dashboard" ? (
          <section className="flex min-h-[calc(100dvh-280px)] items-center justify-center rounded-2xl border border-[#d6dbde] bg-[#eef0f2] p-6">
            <div className="mx-auto max-w-xl text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c8dfde] text-[#1d4d50]">
                <Clock3 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold text-[#2f3538]">Dashboard em construção</h2>
              <p className="mt-2 text-sm text-[#5a6469] sm:text-base">
                Esta aba será disponibilizada com indicadores de RH nas próximas etapas.
              </p>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <form method="GET" className="grid grid-cols-1 gap-2 rounded-2xl bg-[#eef0f2] p-3 md:grid-cols-12 md:items-end">
              <input type="hidden" name="tab" value="registro-pontos" />

              <div className="md:col-span-5">
                <label htmlFor="rh-nome" className="mb-1 block text-xs font-semibold tracking-wide text-[#516167] uppercase">
                  Nome
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5a6a70]" />
                  <input
                    id="rh-nome"
                    name="nome"
                    defaultValue={nomeFilter}
                    placeholder="Filtrar colaborador por nome"
                    className="h-10 w-full rounded-xl border border-[#cfd6da] bg-white pl-9 pr-3 text-sm text-[#2f3538] outline-none focus:border-[#6ca89a]"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="rh-organizacao" className="mb-1 block text-xs font-semibold tracking-wide text-[#516167] uppercase">
                  Organização
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5a6a70]" />
                  <select
                    id="rh-organizacao"
                    name="organizacao"
                    defaultValue={organizacaoFilter}
                    className="h-10 w-full appearance-none rounded-xl border border-[#cfd6da] bg-white pl-9 pr-3 text-sm text-[#2f3538] outline-none focus:border-[#6ca89a]"
                  >
                    <option value="">Todas</option>
                    {snapshot.organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="rh-data-inicio" className="mb-1 block text-xs font-semibold tracking-wide text-[#516167] uppercase">
                  Inicio
                </label>
                <input
                  id="rh-data-inicio"
                  name="data_inicio"
                  type="date"
                  defaultValue={dataInicioFilter}
                  className="h-10 w-full rounded-xl border border-[#cfd6da] bg-white px-3 text-sm text-[#2f3538] outline-none focus:border-[#6ca89a]"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="rh-data-fim" className="mb-1 block text-xs font-semibold tracking-wide text-[#516167] uppercase">
                  Fim
                </label>
                <input
                  id="rh-data-fim"
                  name="data_fim"
                  type="date"
                  defaultValue={dataFimFilter}
                  className="h-10 w-full rounded-xl border border-[#cfd6da] bg-white px-3 text-sm text-[#2f3538] outline-none focus:border-[#6ca89a]"
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  className="h-10 flex-1 rounded-xl border-0 bg-[#0f5050] text-sm font-semibold text-white hover:bg-[#0c4343]"
                >
                  Buscar
                </Button>
                <Link
                  href={clearRegistroHref}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#c8dfde] px-4 text-sm font-semibold text-[#1d4d50] hover:bg-[#b8d3d2]"
                >
                  Limpar
                </Link>
              </div>
            </form>

            <div className="rounded-2xl border border-[#d6dbde] bg-[#eef0f2] p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-[#2f3538]">Registro de pontos</h2>
                <p className="text-sm text-[#5a6469]">{snapshot.rows.length} colaborador(es)</p>
              </div>

              <div className="max-h-[calc(100dvh-340px)] overflow-auto rounded-xl border border-[#d6dbde] bg-white/80">
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-[#dfe5e8]">
                    <tr>
                      <th className="w-[26%] px-3 py-2.5 text-left text-sm font-semibold text-[#1f4f52]">Colaborador</th>
                      <th className="w-[24%] px-3 py-2.5 text-left text-sm font-semibold text-[#1f4f52]">Email</th>
                      <th className="w-[24%] px-3 py-2.5 text-left text-sm font-semibold text-[#1f4f52]">Organização</th>
                      <th className="w-[12%] px-3 py-2.5 text-left text-sm font-semibold text-[#1f4f52]">PIS</th>
                      <th className="w-[14%] px-3 py-2.5 text-left text-sm font-semibold text-[#1f4f52]">AFD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-[#5a6469]">
                          Nenhum colaborador encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      snapshot.rows.map((row) => (
                        <tr key={row.idUsuario} className="border-t border-[#edf1f3]">
                          <td className="px-3 py-2.5 text-sm text-[#2f3538]">{row.nome}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4f5c61]">{row.email ?? "-"}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4f5c61]">{row.organizacaoNome}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4f5c61]">{row.pis ?? "-"}</td>
                          <td className="px-3 py-2.5 text-sm">
                            {row.organizacaoId ? (
                              <a
                                href={`/api/rh/registro-pontos/afd?id_usuario=${encodeURIComponent(String(row.idUsuario))}&id_organizacao=${encodeURIComponent(row.organizacaoId)}&data_inicio=${encodeURIComponent(dataInicioFilter)}&data_fim=${encodeURIComponent(dataFimFilter)}`}
                                className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#0f5050] px-3 text-sm font-semibold text-white hover:bg-[#0c4343]"
                              >
                                <Download className="h-4 w-4" />
                                Baixar AFD
                              </a>
                            ) : (
                              <span className="text-xs text-[#7a868c]">Sem organização</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-[#c6d1d6] bg-[#f5f7f8] p-3 text-xs text-[#5a6469]">
                <p className="font-semibold">Preparado para operação</p>
                <p className="mt-1">
                  A listagem já está pronta para receber a seleção final de colaboradores. O botão de download está
                  integrado para consumir a função RPC de AFD (configurável por <code>RH_AFD_RPC_NAME</code>).
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
