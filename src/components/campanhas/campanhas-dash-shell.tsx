"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, Pencil, Trash2, X } from "lucide-react";

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
  representantes?: Array<{
    id: number;
    nome: string;
  }>;
  tintimRows?: TintimRow[];
  tintimCurrentPage?: number;
  tintimHasNextPage?: boolean;
  tintimSelectedUsuario?: string;
  tintimSearchUtm?: string;
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

export function CampanhasDashShell({
  activeTab,
  dataInicio,
  dataFim,
  representantes = [],
  tintimRows = [],
  tintimCurrentPage = 1,
  tintimHasNextPage = false,
  tintimSelectedUsuario = "",
  tintimSearchUtm = "",
}: CampanhasDashShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const totalRow = toTotalRow(rows);
  const [isTintimModalOpen, setIsTintimModalOpen] = useState(false);
  const [isSavingTintim, setIsSavingTintim] = useState(false);
  const [tintimModalError, setTintimModalError] = useState<string | null>(null);
  const [isTintimEditModalOpen, setIsTintimEditModalOpen] = useState(false);
  const [isSavingTintimEdit, setIsSavingTintimEdit] = useState(false);
  const [tintimEditModalError, setTintimEditModalError] = useState<string | null>(null);
  const [editingTintimId, setEditingTintimId] = useState<string | null>(null);
  const [isTintimDeleteModalOpen, setIsTintimDeleteModalOpen] = useState(false);
  const [isDeletingTintim, setIsDeletingTintim] = useState(false);
  const [tintimDeleteModalError, setTintimDeleteModalError] = useState<string | null>(null);
  const [tintimDeleteTarget, setTintimDeleteTarget] = useState<TintimRow | null>(null);
  const [tintimSuccessAlert, setTintimSuccessAlert] = useState<string | null>(null);
  const [tintimRowsState, setTintimRowsState] = useState<TintimRow[]>(tintimRows);
  const [tintimFilterUsuario, setTintimFilterUsuario] = useState(tintimSelectedUsuario);
  const [tintimFilterUtm, setTintimFilterUtm] = useState(tintimSearchUtm);
  const [tintimForm, setTintimForm] = useState({
    utmPagina: "",
    linkTintim: "",
    frase: "",
    representante: "",
  });
  const [tintimEditForm, setTintimEditForm] = useState({
    utmPagina: "",
    linkTintim: "",
    frase: "",
    representante: "",
  });

  const tintimRepresentantes = useMemo(() => {
    if (representantes.length > 0) {
      return representantes
        .map((item) => ({
          id: String(item.id),
          nome: item.nome,
        }))
        .filter((item) => item.id.length > 0 && item.nome.trim().length > 0);
    }

    return Array.from(
      new Map(
        tintimRows.map((item) => [
          String(item.usuarioId),
          {
            id: String(item.usuarioId),
            nome: item.nome,
          },
        ]),
      ).values(),
    );
  }, [representantes, tintimRows]);

  useEffect(() => {
    if (!isTintimModalOpen && !isTintimEditModalOpen && !isTintimDeleteModalOpen) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTintimModalOpen(false);
        setIsTintimEditModalOpen(false);
        setIsTintimDeleteModalOpen(false);
        setTintimModalError(null);
        setTintimEditModalError(null);
        setTintimDeleteModalError(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isTintimDeleteModalOpen, isTintimEditModalOpen, isTintimModalOpen]);

  useEffect(() => {
    if (!tintimSuccessAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTintimSuccessAlert(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [tintimSuccessAlert]);

  useEffect(() => {
    setTintimRowsState(tintimRows);
  }, [tintimRows]);

  useEffect(() => {
    setTintimFilterUsuario(tintimSelectedUsuario);
    setTintimFilterUtm(tintimSearchUtm);
  }, [tintimSearchUtm, tintimSelectedUsuario]);

  const openTintimModal = () => {
    setIsTintimEditModalOpen(false);
    setIsTintimDeleteModalOpen(false);
    setTintimForm({
      utmPagina: "",
      linkTintim: "",
      frase: "",
      representante: "",
    });
    setTintimModalError(null);
    setIsSavingTintim(false);
    setIsTintimModalOpen(true);
  };

  const closeTintimModal = () => {
    setIsTintimModalOpen(false);
    setIsSavingTintim(false);
    setTintimModalError(null);
  };

  const openTintimDeleteModal = (row: TintimRow) => {
    setIsTintimModalOpen(false);
    setIsTintimEditModalOpen(false);
    setTintimDeleteTarget(row);
    setTintimDeleteModalError(null);
    setIsDeletingTintim(false);
    setIsTintimDeleteModalOpen(true);
  };

  const closeTintimDeleteModal = () => {
    setIsTintimDeleteModalOpen(false);
    setIsDeletingTintim(false);
    setTintimDeleteModalError(null);
    setTintimDeleteTarget(null);
  };

  const openTintimEditModal = (row: TintimRow) => {
    setIsTintimModalOpen(false);
    setIsTintimDeleteModalOpen(false);
    setEditingTintimId(row.id);
    setTintimEditForm({
      utmPagina: row.utm,
      linkTintim: row.linkTintim,
      frase: row.frase,
      representante: row.usuarioId > 0 ? String(row.usuarioId) : "",
    });
    setTintimEditModalError(null);
    setIsSavingTintimEdit(false);
    setIsTintimEditModalOpen(true);
  };

  const closeTintimEditModal = () => {
    setIsTintimEditModalOpen(false);
    setIsSavingTintimEdit(false);
    setTintimEditModalError(null);
    setEditingTintimId(null);
    setTintimEditForm({
      utmPagina: "",
      linkTintim: "",
      frase: "",
      representante: "",
    });
  };

  const buildTintimHref = (nextPage: number, usuario: string, utm: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("tab", "tintim");
    searchParams.set("data_inicio", dataInicio);
    searchParams.set("data_fim", dataFim);
    searchParams.set("tintim_page", String(Math.max(1, nextPage)));

    const normalizedUsuario = usuario.trim();
    if (normalizedUsuario.length > 0) {
      searchParams.set("tintim_usuario", normalizedUsuario);
    }

    const normalizedUtm = utm.trim();
    if (normalizedUtm.length > 0) {
      searchParams.set("tintim_utm", normalizedUtm);
    }

    return `${pathname}?${searchParams.toString()}`;
  };

  const handleApplyTintimFilters = () => {
    router.push(buildTintimHref(1, tintimFilterUsuario, tintimFilterUtm));
  };

  const handleTintimPageChange = (nextPage: number) => {
    router.push(buildTintimHref(nextPage, tintimFilterUsuario, tintimFilterUtm));
  };

  const formatDateToBR = (value: string | null | undefined) => {
    if (!value) {
      return new Date().toLocaleDateString("pt-BR");
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toLocaleDateString("pt-BR");
    }

    return parsed.toLocaleDateString("pt-BR");
  };

  const resolveRepresentanteNome = (usuarioId: number) => {
    const match = tintimRepresentantes.find((item) => Number(item.id) === usuarioId);
    return match?.nome ?? `Usuario ${usuarioId}`;
  };

  const handleSubmitTintim = async () => {
    if (!tintimForm.utmPagina.trim()) {
      setTintimModalError("Preencha Utm da Pagina.");
      return;
    }

    if (!tintimForm.linkTintim.trim()) {
      setTintimModalError("Preencha LinkTinTim.");
      return;
    }

    if (!tintimForm.representante.trim()) {
      setTintimModalError("Selecione um representante.");
      return;
    }

    setIsSavingTintim(true);
    setTintimModalError(null);

    try {
      const response = await fetch("/api/campanhas/tintim/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagina: tintimForm.utmPagina.trim(),
          link_tintim: tintimForm.linkTintim.trim(),
          frase: tintimForm.frase.trim() || null,
          id_usuario: Number(tintimForm.representante),
          campanha_id: null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            row?: {
              id?: string;
              created_at?: string | null;
              id_usuario?: number | null;
              pagina?: string | null;
              link_tintim?: string | null;
              frase?: string | null;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.row) {
        setTintimModalError(payload?.error ?? "Falha ao salvar pagina Tintim.");
        return;
      }

      const representanteSelecionado = tintimRepresentantes.find(
        (item) => item.id === String(payload.row?.id_usuario ?? tintimForm.representante),
      );

      const newRow: TintimRow = {
        id: payload.row.id ?? `${Date.now()}`,
        data: formatDateToBR(payload.row.created_at),
        usuarioId: Number(payload.row.id_usuario ?? tintimForm.representante),
        nome: representanteSelecionado?.nome ?? "Usuario",
        utm: payload.row.pagina ?? tintimForm.utmPagina.trim(),
        linkTintim: payload.row.link_tintim ?? tintimForm.linkTintim.trim(),
        frase: payload.row.frase ?? tintimForm.frase.trim(),
      };

      setTintimRowsState((current) => [newRow, ...current]);
      closeTintimModal();
      setTintimSuccessAlert("Pagina TinTim cadastrada com sucesso.");
      router.refresh();
    } catch {
      setTintimModalError("Erro ao salvar pagina Tintim.");
    } finally {
      setIsSavingTintim(false);
    }
  };

  const handleDeleteTintim = async () => {
    if (!tintimDeleteTarget?.id) {
      return;
    }

    setIsDeletingTintim(true);
    setTintimDeleteModalError(null);

    try {
      const response = await fetch("/api/campanhas/tintim/deletar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: tintimDeleteTarget.id,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            id?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        setTintimDeleteModalError(payload?.error ?? "Falha ao excluir registro Tintim.");
        return;
      }

      const deletedId = String(payload.id ?? tintimDeleteTarget.id);
      setTintimRowsState((current) => current.filter((row) => row.id !== deletedId));
      closeTintimDeleteModal();
      setTintimSuccessAlert("Registro TinTim excluido com sucesso.");
      router.refresh();
    } catch {
      setTintimDeleteModalError("Erro ao excluir registro Tintim.");
    } finally {
      setIsDeletingTintim(false);
    }
  };

  const handleSubmitTintimEdit = async () => {
    if (!editingTintimId) {
      setTintimEditModalError("Registro invalido para edicao.");
      return;
    }

    if (!tintimEditForm.utmPagina.trim()) {
      setTintimEditModalError("Preencha Utm da Pagina.");
      return;
    }

    if (!tintimEditForm.linkTintim.trim()) {
      setTintimEditModalError("Preencha LinkTinTim.");
      return;
    }

    if (!tintimEditForm.representante.trim()) {
      setTintimEditModalError("Selecione um representante.");
      return;
    }

    setIsSavingTintimEdit(true);
    setTintimEditModalError(null);

    try {
      const response = await fetch("/api/campanhas/tintim/editar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingTintimId,
          pagina: tintimEditForm.utmPagina.trim(),
          link_tintim: tintimEditForm.linkTintim.trim(),
          frase: tintimEditForm.frase.trim() || null,
          id_usuario: Number(tintimEditForm.representante),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            row?: {
              id?: string | null;
              created_at?: string | null;
              id_usuario?: number | null;
              pagina?: string | null;
              link_tintim?: string | null;
              frase?: string | null;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.row) {
        setTintimEditModalError(payload?.error ?? "Falha ao atualizar pagina Tintim.");
        return;
      }

      const updatedId = String(payload.row.id ?? editingTintimId);
      const updatedUsuarioId = Number(payload.row.id_usuario ?? tintimEditForm.representante);
      const updatedData = formatDateToBR(payload.row.created_at);
      const updatedNome = resolveRepresentanteNome(updatedUsuarioId);

      setTintimRowsState((current) =>
        current.map((row) =>
          row.id === updatedId
            ? {
                ...row,
                data: updatedData || row.data,
                usuarioId: updatedUsuarioId,
                nome: updatedNome,
                utm: payload.row?.pagina ?? tintimEditForm.utmPagina.trim(),
                linkTintim: payload.row?.link_tintim ?? tintimEditForm.linkTintim.trim(),
                frase: payload.row?.frase ?? tintimEditForm.frase.trim(),
              }
            : row,
        ),
      );

      closeTintimEditModal();
      setTintimSuccessAlert("Registro TinTim atualizado com sucesso.");
      router.refresh();
    } catch {
      setTintimEditModalError("Erro ao atualizar pagina Tintim.");
    } finally {
      setIsSavingTintimEdit(false);
    }
  };

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

        {tintimSuccessAlert ? (
          <div className="fixed top-6 right-6 z-[95] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
            {tintimSuccessAlert}
          </div>
        ) : null}

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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleApplyTintimFilters();
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <div className="relative">
                <select
                  id="tintim-filtro-usuario"
                  name="tintim-filtro-usuario"
                  value={tintimFilterUsuario}
                  onChange={(event) => setTintimFilterUsuario(event.target.value)}
                  className="h-11 min-w-[200px] appearance-none rounded-lg border border-[#d0d4d8] bg-[#f3f5f6] px-3 pr-9 text-base text-[#2f4e51] outline-none"
                >
                  <option value="">Usuario</option>
                  {tintimRepresentantes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
                <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#8a8f94]" />
              </div>

              <input
                id="tintim-filtro-utm"
                type="text"
                name="tintim-filtro-utm"
                value={tintimFilterUtm}
                onChange={(event) => setTintimFilterUtm(event.target.value)}
                placeholder="Digite a UTM"
                className="h-11 min-w-[250px] rounded-lg border border-[#d0d4d8] bg-[#f3f5f6] px-3 text-base text-[#2f4e51] placeholder:text-[#a0a7ad] outline-none"
              />

              <button
                type="submit"
                className="inline-flex h-11 min-w-[96px] items-center justify-center rounded-lg bg-[#0f5050] px-4 text-sm font-semibold text-white"
              >
                Buscar
              </button>

              <button
                type="button"
                onClick={openTintimModal}
                className="ml-auto inline-flex h-11 min-w-[150px] items-center justify-center rounded-lg bg-[#0f7d71] px-4 text-base font-semibold text-white"
              >
                Cadastrar
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#d7dde0] bg-[#f4f6f6] pr-3 [scrollbar-gutter:stable]">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead className="bg-[#c8dfde] text-[#0f4e52]">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-sm font-semibold">Data</th>
                    <th className="px-3 py-2.5 text-left text-sm font-semibold">Id</th>
                    <th className="px-3 py-2.5 text-left text-sm font-semibold">Name</th>
                    <th className="px-3 py-2.5 text-left text-sm font-semibold">UTM</th>
                    <th className="px-3 py-2.5 text-left text-sm font-semibold">LinkTimTin</th>
                    <th className="px-3 py-2.5 text-left text-sm font-semibold">Frase</th>
                    <th className="w-14 px-2 py-2.5 pr-4" />
                    <th className="w-14 px-2 py-2.5 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {tintimRowsState.length > 0 ? (
                    tintimRowsState.map((row) => (
                      <tr key={row.id} className="border-t border-[#d8dddf] bg-[#f4f6f6] align-top">
                        <td className="px-3 py-2.5 text-base leading-snug text-[#1b2930]">{row.data}</td>
                        <td className="px-3 py-2.5 text-base leading-snug text-[#1b2930]">{row.usuarioId}</td>
                        <td className="px-3 py-2.5 text-base leading-snug text-[#1b2930]">{row.nome}</td>
                        <td className="px-3 py-2.5 text-base leading-snug text-[#1b2930]">{row.utm}</td>
                        <td className="max-w-[300px] break-all px-3 py-2.5 text-base leading-snug text-[#1b2930]">
                          {row.linkTintim}
                        </td>
                        <td className="max-w-[320px] break-all px-3 py-2.5 text-base leading-snug text-[#1b2930]">
                          {row.frase}
                        </td>
                        <td className="px-2 py-2.5 pr-4">
                          <button
                            type="button"
                            onClick={() => openTintimDeleteModal(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#f6e4ea] text-[#e38fa7]"
                            aria-label="Excluir registro Tintim"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-2 py-2.5 pr-4">
                          <button
                            type="button"
                            onClick={() => openTintimEditModal(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#dff3f1] text-[#118d82]"
                            aria-label="Editar registro Tintim"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[#d8dddf] bg-[#f4f6f6]">
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#466568]">
                        Nenhum registro Tintim encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleTintimPageChange(Math.max(1, tintimCurrentPage - 1))}
                disabled={tintimCurrentPage <= 1}
                className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-[#8cc8c3] px-4 text-sm font-semibold text-[#184f52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <p className="text-sm text-[#444a4f]">Pagina {Math.max(1, tintimCurrentPage)}</p>

              <button
                type="button"
                onClick={() => handleTintimPageChange(Math.max(1, tintimCurrentPage + 1))}
                disabled={!tintimHasNextPage}
                className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-[#0f5050] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proxima
              </button>
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

        {isTintimDeleteModalOpen ? (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4"
            onClick={closeTintimDeleteModal}
            role="presentation"
          >
            <div
              className="w-full max-w-[460px] rounded-2xl bg-[#f4f6f6] p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Excluir registro Tintim"
            >
              <h3 className="text-3xl font-semibold text-[#1d4d50]">Excluir registro</h3>
              <p className="mt-3 text-base text-[#35595b]">Deseja realmente excluir este registro TinTim?</p>
              {tintimDeleteTarget ? (
                <p className="mt-1 text-sm text-[#5a6f70]">
                  UTM: <span className="font-semibold text-[#1d4d50]">{tintimDeleteTarget.utm}</span>
                </p>
              ) : null}

              {tintimDeleteModalError ? (
                <p className="mt-3 text-sm text-[#7b2323]">{tintimDeleteModalError}</p>
              ) : null}

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeTintimDeleteModal}
                  disabled={isDeletingTintim}
                  className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg bg-[#d3ece9] px-4 text-base font-semibold text-[#205255] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTintim}
                  disabled={isDeletingTintim}
                  className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg bg-[#cf4b5d] px-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingTintim ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isTintimEditModalOpen ? (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4"
            onClick={closeTintimEditModal}
            role="presentation"
          >
            <div
              className="w-full max-w-[760px] overflow-hidden rounded-2xl bg-[#f4f6f6] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Editar pagina TinTim"
            >
              <div className="flex items-center justify-between bg-[#0f7d71] px-5 py-3">
                <h3 className="text-2xl font-semibold text-white">Editar Pagina TinTim</h3>
                <button
                  type="button"
                  onClick={closeTintimEditModal}
                  className="rounded-md p-1 text-white/90 hover:bg-white/10"
                  aria-label="Fechar edicao Tintim"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <label htmlFor="tintim-edit-utm" className="block text-lg text-[#1f4f52]">
                    Utm da Pagina
                  </label>
                  <input
                    id="tintim-edit-utm"
                    name="tintim-edit-utm"
                    value={tintimEditForm.utmPagina}
                    onChange={(event) =>
                      setTintimEditForm((current) => ({
                        ...current,
                        utmPagina: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tintim-edit-link" className="block text-lg text-[#1f4f52]">
                    LinkTinTim
                  </label>
                  <input
                    id="tintim-edit-link"
                    name="tintim-edit-link"
                    value={tintimEditForm.linkTintim}
                    onChange={(event) =>
                      setTintimEditForm((current) => ({
                        ...current,
                        linkTintim: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tintim-edit-frase" className="block text-lg text-[#1f4f52]">
                    Frase
                  </label>
                  <input
                    id="tintim-edit-frase"
                    name="tintim-edit-frase"
                    value={tintimEditForm.frase}
                    onChange={(event) =>
                      setTintimEditForm((current) => ({
                        ...current,
                        frase: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tintim-edit-representante" className="block text-lg text-[#1f4f52]">
                    Representante
                  </label>
                  <div className="relative">
                    <select
                      id="tintim-edit-representante"
                      name="tintim-edit-representante"
                      value={tintimEditForm.representante}
                      onChange={(event) =>
                        setTintimEditForm((current) => ({
                          ...current,
                          representante: event.target.value,
                        }))
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 pr-10 text-base text-[#1f4f52] outline-none"
                    >
                      <option value="">Usuario</option>
                      {tintimRepresentantes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#8a8f94]" />
                  </div>
                </div>

                {tintimEditModalError ? <p className="text-sm text-[#7b2323]">{tintimEditModalError}</p> : null}

                <div className="pt-2">
                  <div className="ml-auto w-full max-w-[220px]">
                    <button
                      type="button"
                      onClick={handleSubmitTintimEdit}
                      disabled={isSavingTintimEdit}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0f8f82] text-xl font-semibold text-white"
                    >
                      {isSavingTintimEdit ? "Salvando..." : "Salvar alteracoes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isTintimModalOpen ? (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4"
            onClick={closeTintimModal}
            role="presentation"
          >
            <div
              className="w-full max-w-[760px] overflow-hidden rounded-2xl bg-[#f4f6f6] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Formulario Pagina TinTim"
            >
              <div className="flex items-center justify-between bg-[#0f7d71] px-5 py-3">
                <h3 className="text-2xl font-semibold text-white">Formulario Pagina TinTim</h3>
                <button
                  type="button"
                  onClick={closeTintimModal}
                  className="rounded-md p-1 text-white/90 hover:bg-white/10"
                  aria-label="Fechar formulario Tintim"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <label htmlFor="tintim-utm" className="block text-lg text-[#1f4f52]">
                    Utm da Pagina
                  </label>
                  <input
                    id="tintim-utm"
                    name="tintim-utm"
                    value={tintimForm.utmPagina}
                    onChange={(event) =>
                      setTintimForm((current) => ({
                        ...current,
                        utmPagina: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tintim-link" className="block text-lg text-[#1f4f52]">
                    LinkTinTim
                  </label>
                  <input
                    id="tintim-link"
                    name="tintim-link"
                    value={tintimForm.linkTintim}
                    onChange={(event) =>
                      setTintimForm((current) => ({
                        ...current,
                        linkTintim: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tintim-frase" className="block text-lg text-[#1f4f52]">
                    Frase
                  </label>
                  <input
                    id="tintim-frase"
                    name="tintim-frase"
                    value={tintimForm.frase}
                    onChange={(event) =>
                      setTintimForm((current) => ({
                        ...current,
                        frase: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 text-base text-[#1f4f52] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tintim-representante" className="block text-lg text-[#1f4f52]">
                    Representante
                  </label>
                  <div className="relative">
                    <select
                      id="tintim-representante"
                      name="tintim-representante"
                      value={tintimForm.representante}
                      onChange={(event) =>
                        setTintimForm((current) => ({
                          ...current,
                          representante: event.target.value,
                        }))
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-[#d8dddf] bg-[#f4f6f6] px-4 pr-10 text-base text-[#1f4f52] outline-none"
                    >
                      <option value="">Usuario</option>
                      {tintimRepresentantes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#8a8f94]" />
                  </div>
                </div>

                {tintimModalError ? <p className="text-sm text-[#7b2323]">{tintimModalError}</p> : null}

                <div className="pt-2">
                  <div className="ml-auto w-full max-w-[220px]">
                    <button
                      type="button"
                      onClick={handleSubmitTintim}
                      disabled={isSavingTintim}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0f8f82] text-xl font-semibold text-white"
                    >
                      {isSavingTintim ? "Salvando..." : "Salvar Pagina"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
