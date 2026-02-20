"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

import { ClientesControlFilters } from "@/components/clientes/clientes-control-filters";
import { ClientesControlTable } from "@/components/clientes/clientes-control-table";
import type {
  ClienteControleRow,
  ClienteEquipamentoOption,
  ClienteRepresentanteOption,
  ClientesControlFiltersValue,
} from "@/components/clientes/types";
import { Button } from "@/components/ui/button";

type ClientesControlShellProps = {
  initialRows: ClienteControleRow[];
  representantes: ClienteRepresentanteOption[];
  equipamentos: ClienteEquipamentoOption[];
  initialFilters: ClientesControlFiltersValue;
  currentPage: number;
  hasNextPage: boolean;
  currentUserId: number | null;
  lockUsuarioSelection?: boolean;
  canShowEtiqueta50?: boolean;
};

type LeadDuplicateInfo = {
  id?: number;
  nome?: string;
  telefone?: string;
  telefoneWebhook?: string;
  telefoneAlternativo?: string;
  telefoneCobranca?: string;
  email?: string;
  createdAt?: string;
};

export function ClientesControlShell({
  initialRows,
  representantes,
  equipamentos,
  initialFilters,
  currentPage,
  hasNextPage,
  currentUserId,
  lockUsuarioSelection = false,
  canShowEtiqueta50 = false,
}: ClientesControlShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [draftFilters, setDraftFilters] = useState<ClientesControlFiltersValue>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchRepresentanteModalOpen, setIsBatchRepresentanteModalOpen] = useState(false);
  const [selectedBatchRepresentanteId, setSelectedBatchRepresentanteId] = useState("");
  const [isSubmittingBatchRepresentante, setIsSubmittingBatchRepresentante] = useState(false);
  const [batchRepresentanteFeedback, setBatchRepresentanteFeedback] = useState<string | null>(null);
  const [batchSuccessAlert, setBatchSuccessAlert] = useState<string | null>(null);
  const [isCadastrarLeadModalOpen, setIsCadastrarLeadModalOpen] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ nome: "", telefone: "", email: "", representante: "" });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadFeedback, setLeadFeedback] = useState<string | null>(null);
  const [leadSuccessAlert, setLeadSuccessAlert] = useState<string | null>(null);
  const [isLeadDuplicateModalOpen, setIsLeadDuplicateModalOpen] = useState(false);
  const [leadDuplicateInfo, setLeadDuplicateInfo] = useState<LeadDuplicateInfo | null>(null);

  const triggerTransferListRefresh = () => {
    router.refresh();
    window.setTimeout(() => router.refresh(), 1200);
    window.setTimeout(() => router.refresh(), 2600);
    window.setTimeout(() => router.refresh(), 4200);
  };

  const triggerLeadListRefresh = () => {
    router.refresh();
    window.setTimeout(() => router.refresh(), 900);
    window.setTimeout(() => router.refresh(), 2000);
    window.setTimeout(() => router.refresh(), 3600);
  };

  useEffect(() => {
    if (!isBatchRepresentanteModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBatchRepresentanteModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isBatchRepresentanteModalOpen]);

  useEffect(() => {
    if (!batchSuccessAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setBatchSuccessAlert(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [batchSuccessAlert]);

  useEffect(() => {
    if (!leadSuccessAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLeadSuccessAlert(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [leadSuccessAlert]);

  const safePage = Math.max(1, Math.trunc(currentPage));

  const buildClientesQuery = (filters: ClientesControlFiltersValue, page: number) => {
    const searchParams = new URLSearchParams();

    if (filters.usuario) {
      searchParams.set("usuario", filters.usuario);
    }
    if (filters.telefone.trim()) {
      searchParams.set("telefone", filters.telefone.trim());
    }
    if (filters.nome.trim()) {
      searchParams.set("nome", filters.nome.trim());
    }
    if (filters.etiqueta.trim()) {
      searchParams.set("etiqueta", filters.etiqueta.trim());
    }
    if (page > 1) {
      searchParams.set("page", String(page));
    }

    return searchParams.toString();
  };

  const handleSearch = (next: ClientesControlFiltersValue) => {
    const query = buildClientesQuery(next, 1);
    router.push(query ? `${pathname}?${query}` : pathname);
    setSelectedIds([]);
  };

  const handlePageChange = (next: number) => {
    const clampedPage = Math.max(next, 1);
    const query = buildClientesQuery(initialFilters, clampedPage);
    router.push(query ? `${pathname}?${query}` : pathname);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id],
    );
  };

  const openBatchRepresentanteModal = () => {
    setSelectedBatchRepresentanteId("");
    setIsSubmittingBatchRepresentante(false);
    setBatchRepresentanteFeedback(null);
    setIsBatchRepresentanteModalOpen(true);
  };

  const closeBatchRepresentanteModal = () => {
    setIsBatchRepresentanteModalOpen(false);
    setSelectedBatchRepresentanteId("");
    setIsSubmittingBatchRepresentante(false);
    setBatchRepresentanteFeedback(null);
  };

  const closeCadastrarLeadModal = () => {
    setIsCadastrarLeadModalOpen(false);
    setIsSubmittingLead(false);
    setLeadFeedback(null);
  };

  const closeLeadDuplicateModal = () => {
    setIsLeadDuplicateModalOpen(false);
    setLeadDuplicateInfo(null);
  };

  const resetLeadForm = () => {
    setLeadFormData({ nome: "", telefone: "", email: "", representante: "" });
  };

  const handleCadastrarLead = async () => {
    const nome = leadFormData.nome.trim();
    const fone = leadFormData.telefone.trim();
    const email = leadFormData.email.trim();
    const idUsuario = Number(leadFormData.representante);

    if (!nome) {
      setLeadFeedback("Preencha o nome do lead.");
      return;
    }

    if (!fone) {
      setLeadFeedback("Preencha o telefone do lead.");
      return;
    }

    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      setLeadFeedback("Selecione um representante.");
      return;
    }

    setIsSubmittingLead(true);
    setLeadFeedback(null);

    try {
      const response = await fetch("/api/clientes/cadastrar-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fone,
          email,
          nome,
          id_usuario: Math.trunc(idUsuario),
          id_user: Math.trunc(idUsuario),
          id_usuario_param: Math.trunc(idUsuario),
          label: "21",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            details?: unknown;
            duplicate?: boolean;
            existing?: LeadDuplicateInfo;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        if (response.status === 409 || payload?.duplicate) {
          setLeadDuplicateInfo(payload?.existing ?? null);
          setIsLeadDuplicateModalOpen(true);
        }
        setLeadFeedback(payload?.error ?? "Falha ao cadastrar lead.");
        return;
      }

      closeCadastrarLeadModal();
      resetLeadForm();
      setLeadSuccessAlert("Lead cadastrado com sucesso.");
      triggerLeadListRefresh();
    } catch {
      setLeadFeedback("Erro ao cadastrar lead.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleBatchRepresentanteSubmit = async () => {
    if (!selectedBatchRepresentanteId.trim()) {
      setBatchRepresentanteFeedback("Selecione um representante.");
      return;
    }

    if (!selectedIds.length) {
      setBatchRepresentanteFeedback("Selecione pelo menos um cliente.");
      return;
    }

    const newUsuario = Number(selectedBatchRepresentanteId);
    if (!Number.isFinite(newUsuario) || newUsuario <= 0) {
      setBatchRepresentanteFeedback("Representante invalido.");
      return;
    }

    const idsPessoas = Array.from(
      new Set(
        selectedIds
          .map((selectedId) => initialRows.find((row) => row.id === selectedId))
          .map((row) => {
            if (!row) {
              return null;
            }

            if (typeof row.pessoaId === "number" && row.pessoaId > 0) {
              return row.pessoaId;
            }

            const parsed = Number(row.id);
            return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
          })
          .filter((id): id is number => Boolean(id)),
      ),
    );

    if (!idsPessoas.length) {
      setBatchRepresentanteFeedback("Nao foi possivel resolver os ids dos clientes selecionados.");
      return;
    }

    setIsSubmittingBatchRepresentante(true);
    setBatchRepresentanteFeedback(null);

    try {
      const response = await fetch("/api/clientes/transferir-pessoas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_usuario: Math.trunc(newUsuario),
          id_usuario_novo: Math.trunc(newUsuario),
          ids_pessoas: idsPessoas,
          p_ids_pessoa: idsPessoas,
          autor: currentUserId ?? null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; debug_id?: string; debug?: unknown }
        | null;

      if (process.env.NODE_ENV !== "production") {
        console.debug("[clientes/transferir-pessoas] response", {
          httpStatus: response.status,
          payload,
        });
      }

      if (!response.ok || !payload?.ok) {
        setBatchRepresentanteFeedback(payload?.error ?? "Falha ao transferir clientes.");
        return;
      }

      closeBatchRepresentanteModal();
      setSelectedIds([]);
      setBatchSuccessAlert("Clientes transferidos com sucesso.");
      triggerTransferListRefresh();
    } catch {
      setBatchRepresentanteFeedback("Erro ao transferir clientes.");
    } finally {
      setIsSubmittingBatchRepresentante(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {batchSuccessAlert ? (
        <div className="fixed top-6 right-6 z-[80] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {batchSuccessAlert}
        </div>
      ) : null}

      {leadSuccessAlert ? (
        <div className="fixed top-6 right-6 z-[80] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {leadSuccessAlert}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ClientesControlFilters
          values={draftFilters}
          representantes={representantes}
          lockUsuarioSelection={lockUsuarioSelection}
          onChange={setDraftFilters}
          onSearch={handleSearch}
        />

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 ? (
            <Button
              type="button"
              onClick={openBatchRepresentanteModal}
              className="h-11 min-w-[210px] rounded-xl border-0 bg-[#f09a0a] text-base font-semibold text-white hover:bg-[#e28e08]"
            >
              Alterar representante
            </Button>
          ) : null}

          <Button
            type="button"
            onClick={() => {
              setLeadFeedback(null);
              setIsLeadDuplicateModalOpen(false);
              setLeadDuplicateInfo(null);
              setIsCadastrarLeadModalOpen(true);
            }}
            className="h-11 min-w-[140px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343]"
          >
            Novo Leads
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ClientesControlTable
          rows={initialRows}
          representantes={representantes}
          equipamentos={equipamentos}
          page={safePage}
          hasNextPage={hasNextPage}
          currentUserId={currentUserId}
          canShowEtiqueta50={canShowEtiqueta50}
          selectedIds={selectedIds}
          onPageChange={handlePageChange}
          onToggleSelect={handleToggleSelect}
        />
      </div>

      {isBatchRepresentanteModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
          onClick={closeBatchRepresentanteModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[800px] rounded-3xl bg-[#f4f6f6] p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Alterar de Representante em Lote"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-4xl font-semibold text-[#1d4d50] sm:text-5xl">Alterar de Representante</h3>
              <button
                type="button"
                onClick={closeBatchRepresentanteModal}
                aria-label="Fechar alteracao em lote"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <p className="mb-6 text-2xl text-[#2a4f51] sm:text-4xl">Alteracao de Usuario em Lote</p>

            <div className="rounded-2xl bg-[#c8dfde] p-4">
              <p className="mb-2 text-[30px] leading-none text-[#2f3538]">Representante</p>
              <div className="relative max-w-[520px]">
                <select
                  id="batch-representante-select"
                  name="batch-representante-select"
                  value={selectedBatchRepresentanteId}
                  onChange={(event) => {
                    setSelectedBatchRepresentanteId(event.target.value);
                    setBatchRepresentanteFeedback(null);
                  }}
                  className="h-12 w-full appearance-none rounded-xl border-0 bg-[#f4f6f6] px-4 pr-10 text-[29px] text-[#2a4f51] outline-none"
                >
                  <option value="">Selecione</option>
                  {representantes.map((representante) => (
                    <option key={representante.id} value={String(representante.id)}>
                      {representante.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#355c5f]" />
              </div>
            </div>

            {batchRepresentanteFeedback ? (
              <p className="mt-3 text-sm text-[#7b2323]">{batchRepresentanteFeedback}</p>
            ) : null}

            <div className="mt-10 flex justify-end">
              <Button
                type="button"
                onClick={handleBatchRepresentanteSubmit}
                disabled={isSubmittingBatchRepresentante}
                className="h-14 w-full max-w-[330px] rounded-2xl border-0 bg-[#0f5050] text-4xl font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingBatchRepresentante ? "Alterando..." : "Alterar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isCadastrarLeadModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={closeCadastrarLeadModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[720px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar Leads"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-semibold text-[#0f5050]">Cadastrar Leads</h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={closeCadastrarLeadModal}
                className="text-slate-600 hover:text-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nome</label>
                <input
                  type="text"
                  value={leadFormData.nome}
                  onChange={(e) => setLeadFormData({ ...leadFormData, nome: e.target.value })}
                  placeholder="Seu Nome"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Telefone</label>
                <input
                  type="tel"
                  value={leadFormData.telefone}
                  onChange={(e) => setLeadFormData({ ...leadFormData, telefone: e.target.value })}
                  placeholder="Seu Telefone"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={leadFormData.email}
                  onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                  placeholder="Seu email"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div className="rounded-lg bg-[#e6f3ef] p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Representante</label>
                <select
                  id="lead-representante-select"
                  name="lead-representante-select"
                  value={leadFormData.representante}
                  onChange={(e) => setLeadFormData({ ...leadFormData, representante: e.target.value })}
                  className="w-full rounded-md border border-transparent bg-white px-4 py-3 text-slate-700"
                >
                  <option value="">Selecione</option>
                  {representantes.map((rep) => (
                    <option key={rep.id} value={String(rep.id)}>
                      {rep.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {leadFeedback ? <p className="mt-3 text-sm text-[#7b2323]">{leadFeedback}</p> : null}

            <div className="mt-6 flex justify-end">
              <Button variant="primary" size="md" onClick={handleCadastrarLead} disabled={isSubmittingLead}>
                {isSubmittingLead ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isLeadDuplicateModalOpen ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/45 p-4"
          onClick={closeLeadDuplicateModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Lead duplicado"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#7b2323]">Cliente ja cadastrado</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Ja existe um cliente com os dados informados. Revise antes de tentar cadastrar novamente.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar aviso de duplicidade"
                onClick={closeLeadDuplicateModal}
                className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                <strong>Nome:</strong> {leadDuplicateInfo?.nome?.trim() || "-"}
              </p>
              <p>
                <strong>Telefone:</strong>{" "}
                {leadDuplicateInfo?.telefone?.trim() ||
                  leadDuplicateInfo?.telefoneWebhook?.trim() ||
                  leadDuplicateInfo?.telefoneAlternativo?.trim() ||
                  leadDuplicateInfo?.telefoneCobranca?.trim() ||
                  "-"}
              </p>
              <p>
                <strong>Email:</strong> {leadDuplicateInfo?.email?.trim() || "-"}
              </p>
              <p>
                <strong>ID cliente:</strong> {leadDuplicateInfo?.id ? String(leadDuplicateInfo.id) : "-"}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" variant="primary" size="md" onClick={closeLeadDuplicateModal}>
                Entendi
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


