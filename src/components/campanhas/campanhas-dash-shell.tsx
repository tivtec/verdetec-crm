import { ChevronsUpDown, Pencil, Trash2 } from "lucide-react";

type CampanhaTabKey = "dash" | "analytics" | "cadastrar" | "tintim" | "filtros" | "jornada";

type CampanhaRow = {
  campanha: string;
  lead: number;
  n00: number;
  n10: number;
  n05: number;
  n30: number;
  n35: number;
  n40: number;
  n50: number;
  n60: number;
  n61: number;
  n62: number;
  n66: number;
};

type CampanhasDashShellProps = {
  activeTab: CampanhaTabKey;
  dataInicio: string;
  dataFim: string;
};

type TintimRow = {
  id: string;
  data: string;
  usuarioId: number;
  nome: string;
  utm: string;
  linkTintim: string;
  frase: string;
};

const tabs: Array<{ key: CampanhaTabKey; label: string }> = [
  { key: "dash", label: "Dash" },
  { key: "analytics", label: "Analytics" },
  { key: "cadastrar", label: "Cadastrar" },
  { key: "tintim", label: "Tintim" },
  { key: "filtros", label: "Filtros" },
  { key: "jornada", label: "Jornada" },
];

const rows: CampanhaRow[] = [
  {
    campanha: "Franquia/Investidor",
    lead: 7,
    n00: 7,
    n10: 7,
    n05: 0,
    n30: 0,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 0,
    n61: 2,
    n62: 5,
    n66: 0,
  },
  {
    campanha: "#50 Prime",
    lead: 6,
    n00: 6,
    n10: 6,
    n05: 0,
    n30: 0,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 0,
    n61: 0,
    n62: 0,
    n66: 0,
  },
  {
    campanha: "Vendas - #50",
    lead: 4,
    n00: 4,
    n10: 4,
    n05: 0,
    n30: 0,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 0,
    n61: 0,
    n62: 4,
    n66: 0,
  },
  {
    campanha: "Engenheiro/Terraplanagem II",
    lead: 3,
    n00: 3,
    n10: 3,
    n05: 0,
    n30: 1,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 0,
    n61: 0,
    n62: 2,
    n66: 0,
  },
  {
    campanha: "Youtube",
    lead: 2,
    n00: 2,
    n10: 2,
    n05: 1,
    n30: 1,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 1,
    n61: 0,
    n62: 1,
    n66: 0,
  },
  {
    campanha: "Organico",
    lead: 1,
    n00: 1,
    n10: 1,
    n05: 0,
    n30: 0,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 0,
    n61: 0,
    n62: 0,
    n66: 0,
  },
  {
    campanha: "Grameiro#4",
    lead: 1,
    n00: 1,
    n10: 1,
    n05: 0,
    n30: 0,
    n35: 0,
    n40: 0,
    n50: 0,
    n60: 1,
    n61: 0,
    n62: 0,
    n66: 0,
  },
];

const tintimRows: TintimRow[] = [
  {
    id: "62-20250820",
    data: "20/08/2025",
    usuarioId: 62,
    nome: "Jaqueline O.",
    utm: "DK-Bofu-Url-Lall-LT-GRAMEIROS-PAISAGISMO-4",
    linkTintim: "https://tintim.link/redirect-to-whatsapp/58falf16-77a0-4fa2-a4a8-b82be542e896/cdfad11a-6aa8-4a89-9aed-f2c912ee3753",
    frase: "?text=Ol%C3%A1!%20Procuro%20atendimento%20com%20um%20especialista%20da%20VERDETEC%20(Obrigat%C3%B3rio%20o%20envio%20desta%20mensagem%20para%20ter%20atendimento%20priorit%C3%A1rio)&",
  },
  {
    id: "92-20250821",
    data: "21/08/2025",
    usuarioId: 92,
    nome: "Lauriane A.",
    utm: "DK-Bofu-Url-Lall-LT-GRAMEIROS-PAISAGISMO-4",
    linkTintim: "https://tintim.link/redirect-to-whatsapp/a581d985-56a6-4e85-b493-7ed1767a9a87/c4898079-bb55-49c7-be00-1e267f1de3b4",
    frase: "?text=Ol%C3%A1!%20Procuro%20atendimento%20com%20um%20especialista%20da%20VERDETEC%20(Obrigat%C3%B3rio%20o%20envio%20desta%20mensagem%20para%20ter%20atendimento%20priorit%C3%A1rio)&",
  },
];

function toTotalRow(sourceRows: CampanhaRow[]): CampanhaRow {
  return sourceRows.reduce(
    (acc, row) => ({
      campanha: "Total",
      lead: acc.lead + row.lead,
      n00: acc.n00 + row.n00,
      n10: acc.n10 + row.n10,
      n05: acc.n05 + row.n05,
      n30: acc.n30 + row.n30,
      n35: acc.n35 + row.n35,
      n40: acc.n40 + row.n40,
      n50: acc.n50 + row.n50,
      n60: acc.n60 + row.n60,
      n61: acc.n61 + row.n61,
      n62: acc.n62 + row.n62,
      n66: acc.n66 + row.n66,
    }),
    {
      campanha: "Total",
      lead: 0,
      n00: 0,
      n10: 0,
      n05: 0,
      n30: 0,
      n35: 0,
      n40: 0,
      n50: 0,
      n60: 0,
      n61: 0,
      n62: 0,
      n66: 0,
    },
  );
}

function normalizeTab(value: string): CampanhaTabKey {
  if (value === "analytics") return "analytics";
  if (value === "cadastrar") return "cadastrar";
  if (value === "tintim") return "tintim";
  if (value === "filtros") return "filtros";
  if (value === "jornada") return "jornada";
  return "dash";
}

export function normalizeCampanhaTab(value: string | undefined) {
  return normalizeTab((value ?? "").trim().toLowerCase());
}

export function CampanhasDashShell({ activeTab, dataInicio, dataFim }: CampanhasDashShellProps) {
  const totalRow = toTotalRow(rows);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="rounded-xl border border-[#cfd4d8] bg-[#e8ebef] px-5 py-3">
        <h1 className="text-4xl font-semibold tracking-wide text-[#5a6576]">CAMPANHAS</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-2xl bg-[#e4e6e8] p-3">
        <div className="flex flex-wrap items-end gap-2 border-b border-[#2f3742]/40 pb-1.5">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`/campanhas?tab=${tab.key}&data_inicio=${dataInicio}&data_fim=${dataFim}`}
              className={
                tab.key === activeTab
                  ? "inline-flex h-10 min-w-[104px] items-center justify-center rounded-t-xl border border-[#2c3d48] bg-[#0f5050] px-3 text-base font-semibold text-white"
                  : "inline-flex h-10 min-w-[104px] items-center justify-center rounded-t-xl border border-[#9da4aa] bg-[#f2f3f4] px-3 text-base font-medium text-[#1c2730]"
              }
            >
              {tab.label}
            </a>
          ))}
        </div>

        {activeTab === "dash" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <form method="get" className="flex flex-wrap items-end justify-end gap-2 pt-1">
              <input type="hidden" name="tab" value={activeTab} />

              <div className="mr-1 text-base text-[#1f4f52]">Dias pre definidos</div>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-[#7c868d]">Inicio</span>
                <input
                  type="date"
                  name="data_inicio"
                  defaultValue={dataInicio}
                  className="h-10 w-[150px] rounded-lg border border-[#cfd4d8] bg-[#f3f5f6] px-3 text-sm text-[#153b3d] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-[#7c868d]">Fim</span>
                <input
                  type="date"
                  name="data_fim"
                  defaultValue={dataFim}
                  className="h-10 w-[150px] rounded-lg border border-[#cfd4d8] bg-[#f3f5f6] px-3 text-sm text-[#153b3d] outline-none"
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-lg bg-[#0f5050] px-4 text-sm font-semibold text-white"
              >
                Buscar
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-auto rounded-xl">
              <table className="w-full min-w-[1120px] border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="bg-[#c8dfde] text-[#001d55]">
                    <th className="rounded-l-xl px-4 py-2.5 text-left text-base font-semibold">Campanha</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">Lead</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#00</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#10</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#05</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#30</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#35</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#40</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#50</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#60</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#61</th>
                    <th className="px-3 py-2.5 text-left text-base font-semibold">#62</th>
                    <th className="rounded-r-xl px-3 py-2.5 text-left text-base font-semibold">#66</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.campanha} className={index % 2 === 0 ? "bg-[#d4d4d6]" : "bg-[#f2f3f4]"}>
                      <td className="rounded-l-xl px-4 py-2.5 text-base font-semibold text-[#061b4a]">{row.campanha}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.lead}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n00}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n10}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n05}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n30}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n35}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n40}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n50}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n60}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n61}</td>
                      <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n62}</td>
                      <td className="rounded-r-xl px-3 py-2.5 text-base font-semibold text-[#061b4a]">{row.n66}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#ece5e0]">
                    <td className="rounded-l-xl px-4 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.campanha}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.lead}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n00}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n10}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n05}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n30}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n35}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n40}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n50}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n60}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n61}</td>
                    <td className="px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n62}</td>
                    <td className="rounded-r-xl px-3 py-2.5 text-base font-semibold text-[#061b4a]">{totalRow.n66}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : activeTab === "tintim" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
            <form method="get" className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="tab" value={activeTab} />
              <input type="hidden" name="data_inicio" value={dataInicio} />
              <input type="hidden" name="data_fim" value={dataFim} />

              <div className="relative">
                <select
                  name="usuario"
                  defaultValue=""
                  className="h-11 min-w-[200px] appearance-none rounded-lg border border-[#d0d4d8] bg-[#f3f5f6] px-3 pr-9 text-base text-[#2f4e51] outline-none"
                >
                  <option value="">Usuario</option>
                  <option value="62">Jaqueline O.</option>
                  <option value="92">Lauriane A.</option>
                </select>
                <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#8a8f94]" />
              </div>

              <input
                type="text"
                name="utm"
                placeholder="Digite a UTM"
                className="h-11 min-w-[250px] rounded-lg border border-[#d0d4d8] bg-[#f3f5f6] px-3 text-base text-[#2f4e51] placeholder:text-[#a0a7ad] outline-none"
              />

              <span className="mx-auto inline-flex h-10 w-10 items-center justify-center text-[#8a8f94]">
                <ChevronsUpDown className="h-6 w-6" />
              </span>

              <button
                type="submit"
                className="ml-auto inline-flex h-11 min-w-[150px] items-center justify-center rounded-lg bg-[#0f7d71] px-4 text-base font-semibold text-white"
              >
                Cadastrar
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#d7dde0] bg-[#f4f6f6]">
              <table className="w-full min-w-[1220px] border-collapse">
                <thead className="bg-[#c8dfde] text-[#0f4e52]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xl font-semibold">Data</th>
                    <th className="px-4 py-3 text-left text-xl font-semibold">Id</th>
                    <th className="px-4 py-3 text-left text-xl font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-xl font-semibold">UTM</th>
                    <th className="px-4 py-3 text-left text-xl font-semibold">LinkTimTin</th>
                    <th className="px-4 py-3 text-left text-xl font-semibold">Frase</th>
                    <th className="w-16 px-2 py-3" />
                    <th className="w-16 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {tintimRows.map((row) => (
                    <tr key={row.id} className="border-t border-[#d8dddf] bg-[#f4f6f6] align-top">
                      <td className="px-4 py-3 text-xl text-[#1b2930]">{row.data}</td>
                      <td className="px-4 py-3 text-xl text-[#1b2930]">{row.usuarioId}</td>
                      <td className="px-4 py-3 text-xl text-[#1b2930]">{row.nome}</td>
                      <td className="px-4 py-3 text-xl text-[#1b2930]">{row.utm}</td>
                      <td className="max-w-[350px] break-all px-4 py-3 text-xl text-[#1b2930]">{row.linkTintim}</td>
                      <td className="max-w-[370px] break-all px-4 py-3 text-xl text-[#1b2930]">{row.frase}</td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#f6e4ea] text-[#e38fa7]"
                          aria-label="Excluir registro Tintim"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#dff3f1] text-[#118d82]"
                          aria-label="Editar registro Tintim"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "analytics" ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[#d2d6da] bg-white">
            <iframe
              src="/widgets/campanhas-analytics.html"
              title="Campanhas Analytics"
              className="h-full min-h-[520px] w-full border-0"
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center rounded-xl border border-[#d2d6da] bg-[#f2f3f4] px-5 py-6 text-base text-[#46565f]">
            Aba <span className="font-semibold">{tabs.find((tab) => tab.key === activeTab)?.label}</span> em
            construcao.
          </div>
        )}
      </div>
    </div>
  );
}
