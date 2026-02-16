"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, List, Pencil, Plus, Search, X } from "lucide-react";

import type {
  EmpresaCadastroForm,
  EmpresaControleRow,
  EmpresaRepresentanteOption,
} from "@/components/empresas/types";
import { Button } from "@/components/ui/button";

type EmpresasControlShellProps = {
  initialRows: EmpresaControleRow[];
  representantes: EmpresaRepresentanteOption[];
  initialSearch: string;
};

type EmpresaEdicaoForm = EmpresaCadastroForm & {
  statusCliente: string;
};

type EmpresaEdicaoBaseline = {
  id: string;
  nome: string;
  endereco: string | null;
  cnpj: string | null;
  cep: string | null;
  status: boolean;
  fone: string | null;
  whatsapp: string | null;
  link_ista: string | null;
  email: string | null;
  id_consistem: number | null;
  id_usuario: number | null;
};

type PedidoEmpresaRow = {
  id: string;
  nome: string;
  telefone: string;
  metragem: string;
  cep: string;
  data: string;
};

type PedidosApiResponse = {
  ok?: boolean;
  rows?: PedidoEmpresaRow[];
  error?: string;
};

type PedidoProximoRow = {
  id: string;
  nome: string;
  telefone: string;
  metragem: string;
  cep: string;
};

type PedidosProximosApiResponse = {
  ok?: boolean;
  rows?: PedidoProximoRow[];
  error?: string;
};

type AdicionarPedidoApiResponse = {
  ok?: boolean;
  error?: string;
};

type ToastState = {
  message: string;
  variant: "success" | "error";
};

const PAGE_SIZE = 10;

const EMPTY_FORM: EmpresaCadastroForm = {
  codigoCliente: "",
  nome: "",
  representanteId: "",
  email: "",
  telefone: "",
  whatsapp: "",
  cnpj: "",
  cep: "",
  endereco: "",
  linkInstagram: "",
};

const EMPTY_EDIT_FORM: EmpresaEdicaoForm = {
  ...EMPTY_FORM,
  statusCliente: "Ativo",
};

const STATUS_OPTIONS = ["Ativo", "Inativo"];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function safeText(value: string | null | undefined, fallback = "") {
  const text = (value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function toNullableText(value: string | null | undefined) {
  const text = (value ?? "").trim();
  return text.length > 0 ? text : null;
}

function toPositiveInt(value: string | number | null | undefined) {
  const text = typeof value === "number" ? String(value) : (value ?? "").trim();
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const integer = Math.trunc(parsed);
  return integer > 0 ? integer : null;
}

function toStatusBoolean(value: string) {
  return normalizeText(value) !== "inativo";
}

function toStatusLabel(value: boolean) {
  return value ? "Ativo" : "Inativo";
}

export function EmpresasControlShell({ initialRows, representantes, initialSearch }: EmpresasControlShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchDraft, setSearchDraft] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<EmpresaCadastroForm>(EMPTY_FORM);
  const [isSubmittingCadastro, setIsSubmittingCadastro] = useState(false);
  const [cadastroError, setCadastroError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormValues, setEditFormValues] = useState<EmpresaEdicaoForm>(EMPTY_EDIT_FORM);
  const [editingBaseline, setEditingBaseline] = useState<EmpresaEdicaoBaseline | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isPedidosModalOpen, setIsPedidosModalOpen] = useState(false);
  const [pedidosEmpresa, setPedidosEmpresa] = useState<EmpresaControleRow | null>(null);
  const [pedidosRows, setPedidosRows] = useState<PedidoEmpresaRow[]>([]);
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);
  const [pedidosError, setPedidosError] = useState<string | null>(null);
  const [isPedidosProximosModalOpen, setIsPedidosProximosModalOpen] = useState(false);
  const [pedidosProximosRows, setPedidosProximosRows] = useState<PedidoProximoRow[]>([]);
  const [isLoadingPedidosProximos, setIsLoadingPedidosProximos] = useState(false);
  const [pedidosProximosError, setPedidosProximosError] = useState<string | null>(null);
  const [isAddingPedidoId, setIsAddingPedidoId] = useState<string | null>(null);
  const [adicionarPedidoError, setAdicionarPedidoError] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, variant: ToastState["variant"] = "success") => {
    setToast({ message, variant });
  };

  const representanteIdByNome = useMemo(() => {
    const map = new Map<string, number>();

    for (const representante of representantes) {
      const key = normalizeText(representante.nome);
      if (!key || map.has(key)) {
        continue;
      }
      map.set(key, representante.id);
    }

    return map;
  }, [representantes]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isCadastroModalOpen && !isEditModalOpen && !isPedidosModalOpen && !isPedidosProximosModalOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isPedidosProximosModalOpen) {
        setIsPedidosProximosModalOpen(false);
        return;
      }

      if (isEditModalOpen) {
        setIsEditModalOpen(false);
        return;
      }

      if (isPedidosModalOpen) {
        setIsPedidosModalOpen(false);
        return;
      }

      if (isCadastroModalOpen) {
        setIsCadastroModalOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isCadastroModalOpen, isEditModalOpen, isPedidosModalOpen, isPedidosProximosModalOpen]);

  const totalPages = Math.max(1, Math.ceil(initialRows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageRows = initialRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = () => {
    const search = searchDraft.trim();
    const params = new URLSearchParams();
    if (search.length > 0) {
      params.set("search", search);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(clamped);
  };

  const openCadastroModal = () => {
    setFormValues(EMPTY_FORM);
    setCadastroError(null);
    setIsSubmittingCadastro(false);
    setIsCadastroModalOpen(true);
  };

  const closeCadastroModal = () => {
    setIsCadastroModalOpen(false);
    setCadastroError(null);
    setIsSubmittingCadastro(false);
  };

  const handleFormField = (field: keyof EmpresaCadastroForm, value: string) => {
    setCadastroError(null);
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmitCadastro = async () => {
    const nome = formValues.nome.trim();
    if (!nome) {
      setCadastroError("Nome obrigatorio.");
      return;
    }

    setIsSubmittingCadastro(true);
    setCadastroError(null);

    try {
      const response = await fetch("/api/empresas/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          endereco: formValues.endereco,
          cnpj: formValues.cnpj,
          cep: formValues.cep,
          status: true,
          fone: formValues.telefone,
          whatsapp: formValues.whatsapp,
          link_ista: formValues.linkInstagram,
          email: formValues.email,
          id_consistem: formValues.codigoCliente,
          id_usuario: formValues.representanteId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setCadastroError(payload?.error ?? "Falha ao cadastrar empresa.");
        return;
      }

      showToast("Empresa cadastrada com sucesso.");
      setFormValues(EMPTY_FORM);
      setIsCadastroModalOpen(false);
      router.refresh();
    } catch {
      setCadastroError("Erro ao cadastrar empresa.");
    } finally {
      setIsSubmittingCadastro(false);
    }
  };

  const openEditModal = (row: EmpresaControleRow) => {
    const representanteId =
      row.representanteId && row.representanteId > 0
        ? row.representanteId
        : representanteIdByNome.get(normalizeText(row.usuario ?? ""));
    const baseline: EmpresaEdicaoBaseline = {
      id: safeText(row.id),
      nome: safeText(row.nome),
      endereco: row.endereco === "[s.endereco]" ? null : toNullableText(row.endereco),
      cnpj: toNullableText(row.cnpj),
      cep: toNullableText(row.cep),
      status: row.status !== "Inativo",
      fone: toNullableText(row.telefone),
      whatsapp: toNullableText(row.whatsapp),
      link_ista: toNullableText(row.linkInstagram),
      email: toNullableText(row.email),
      id_consistem: toPositiveInt(row.codigoCliente),
      id_usuario: toPositiveInt(representanteId ?? null),
    };

    setEditFormValues({
      codigoCliente: baseline.id_consistem ? String(baseline.id_consistem) : "",
      nome: baseline.nome,
      representanteId: baseline.id_usuario ? String(baseline.id_usuario) : "",
      email: safeText(baseline.email),
      telefone: safeText(baseline.fone),
      whatsapp: safeText(baseline.whatsapp),
      cnpj: safeText(baseline.cnpj),
      cep: safeText(baseline.cep),
      endereco: safeText(baseline.endereco),
      linkInstagram: safeText(baseline.link_ista),
      statusCliente: toStatusLabel(baseline.status),
    });
    setEditingBaseline(baseline);
    setEditError(null);
    setIsSubmittingEdit(false);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormValues(EMPTY_EDIT_FORM);
    setEditingBaseline(null);
    setEditError(null);
    setIsSubmittingEdit(false);
  };

  const handleEditField = (field: keyof EmpresaEdicaoForm, value: string) => {
    setEditError(null);
    setEditFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmitEdit = async () => {
    if (!editingBaseline || !editingBaseline.id) {
      setEditError("Empresa invalida para edicao.");
      return;
    }

    const nome = editFormValues.nome.trim();
    if (!nome) {
      setEditError("Nome obrigatorio.");
      return;
    }

    const normalized = {
      nome,
      endereco: toNullableText(editFormValues.endereco),
      cnpj: toNullableText(editFormValues.cnpj),
      cep: toNullableText(editFormValues.cep),
      status: toStatusBoolean(editFormValues.statusCliente),
      fone: toNullableText(editFormValues.telefone),
      whatsapp: toNullableText(editFormValues.whatsapp),
      link_ista: toNullableText(editFormValues.linkInstagram),
      email: toNullableText(editFormValues.email),
      id_consistem: toPositiveInt(editFormValues.codigoCliente),
      id_usuario: toPositiveInt(editFormValues.representanteId),
    } satisfies Omit<EmpresaEdicaoBaseline, "id">;

    const updatePayload: Record<string, unknown> = {};
    if (normalized.nome !== editingBaseline.nome) {
      updatePayload.nome = normalized.nome;
    }
    if (normalized.endereco !== editingBaseline.endereco) {
      updatePayload.endereco = normalized.endereco;
    }
    if (normalized.cnpj !== editingBaseline.cnpj) {
      updatePayload.cnpj = normalized.cnpj;
    }
    if (normalized.cep !== editingBaseline.cep) {
      updatePayload.cep = normalized.cep;
    }
    if (normalized.status !== editingBaseline.status) {
      updatePayload.status = normalized.status;
    }
    if (normalized.fone !== editingBaseline.fone) {
      updatePayload.fone = normalized.fone;
    }
    if (normalized.whatsapp !== editingBaseline.whatsapp) {
      updatePayload.whatsapp = normalized.whatsapp;
    }
    if (normalized.link_ista !== editingBaseline.link_ista) {
      updatePayload.link_ista = normalized.link_ista;
    }
    if (normalized.email !== editingBaseline.email) {
      updatePayload.email = normalized.email;
    }
    if (normalized.id_consistem !== editingBaseline.id_consistem) {
      updatePayload.id_consistem = normalized.id_consistem;
    }
    if (normalized.id_usuario !== editingBaseline.id_usuario) {
      updatePayload.id_usuario = normalized.id_usuario;
    }

    if (Object.keys(updatePayload).length === 0) {
      showToast("Nenhuma alteracao para salvar.");
      closeEditModal();
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const response = await fetch("/api/empresas/editar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingBaseline.id,
          ...updatePayload,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setEditError(payload?.error ?? "Falha ao atualizar empresa.");
        return;
      }

      showToast("Empresa atualizada com sucesso.");
      closeEditModal();
      router.refresh();
    } catch {
      setEditError("Erro ao atualizar empresa.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const loadPedidosEmpresa = async (row: EmpresaControleRow) => {
    setPedidosRows([]);
    setPedidosError(null);
    setIsLoadingPedidos(true);
    try {
      const response = await fetch("/api/empresas/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid_empresa: row.id,
          limit: "0",
          ofsett: "0",
        }),
      });

      const payload = (await response.json().catch(() => null)) as PedidosApiResponse | null;

      if (!response.ok || !payload?.ok) {
        setPedidosError(payload?.error ?? "Falha ao carregar pedidos da empresa.");
        return;
      }

      setPedidosRows(Array.isArray(payload.rows) ? payload.rows : []);
    } catch {
      setPedidosError("Erro ao carregar pedidos da empresa.");
    } finally {
      setIsLoadingPedidos(false);
    }
  };

  const openPedidosModal = async (row: EmpresaControleRow) => {
    setPedidosEmpresa(row);
    setIsPedidosModalOpen(true);
    await loadPedidosEmpresa(row);
  };

  const closePedidosModal = () => {
    setIsPedidosModalOpen(false);
    setPedidosEmpresa(null);
    setPedidosRows([]);
    setPedidosError(null);
    setIsLoadingPedidos(false);
    setIsPedidosProximosModalOpen(false);
    setPedidosProximosRows([]);
    setPedidosProximosError(null);
    setIsLoadingPedidosProximos(false);
    setIsAddingPedidoId(null);
    setAdicionarPedidoError(null);
  };

  const openPedidosProximosModal = async () => {
    if (!pedidosEmpresa) {
      return;
    }

    setPedidosProximosRows([]);
    setPedidosProximosError(null);
    setIsLoadingPedidosProximos(true);
    setAdicionarPedidoError(null);
    setIsAddingPedidoId(null);
    setIsPedidosProximosModalOpen(true);

    try {
      const response = await fetch("/api/empresas/pedidos-proximos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: "10",
          ofsett: "0",
          cep: safeText(pedidosEmpresa.cep),
          id_empresa: safeText(pedidosEmpresa.id),
        }),
      });

      const payload = (await response.json().catch(() => null)) as PedidosProximosApiResponse | null;
      if (!response.ok || !payload?.ok) {
        setPedidosProximosError(payload?.error ?? "Falha ao carregar solicitacoes proximas.");
        return;
      }

      setPedidosProximosRows(Array.isArray(payload.rows) ? payload.rows : []);
    } catch {
      setPedidosProximosError("Erro ao carregar solicitacoes proximas.");
    } finally {
      setIsLoadingPedidosProximos(false);
    }
  };

  const closePedidosProximosModal = () => {
    setIsPedidosProximosModalOpen(false);
    setPedidosProximosError(null);
    setIsLoadingPedidosProximos(false);
    setIsAddingPedidoId(null);
    setAdicionarPedidoError(null);
  };

  const handleAdicionarPedidoProximo = async (pedidoUuid: string) => {
    const empresaUuid = safeText(pedidosEmpresa?.id);
    if (!pedidoUuid || !empresaUuid) {
      setAdicionarPedidoError("Pedido ou empresa invalidos para vinculacao.");
      showToast("Pedido ou empresa invalidos para vinculacao.", "error");
      return;
    }

    setIsAddingPedidoId(pedidoUuid);
    setAdicionarPedidoError(null);

    try {
      const response = await fetch("/api/empresas/adicionar-pedido", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_uuid: pedidoUuid,
          empresa_uuid: empresaUuid,
        }),
      });

      const payload = (await response.json().catch(() => null)) as AdicionarPedidoApiResponse | null;
      if (!response.ok || !payload?.ok) {
        const errorMessage = payload?.error ?? "Falha ao adicionar pedido na empresa.";
        setAdicionarPedidoError(errorMessage);
        showToast(errorMessage, "error");
        return;
      }

      showToast("Pedido adicionado com sucesso.");
      setPedidosProximosRows((current) => current.filter((row) => row.id !== pedidoUuid));
      if (pedidosEmpresa) {
        await loadPedidosEmpresa(pedidosEmpresa);
      }
    } catch {
      const errorMessage = "Erro ao adicionar pedido na empresa.";
      setAdicionarPedidoError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsAddingPedidoId(null);
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={`fixed top-6 right-6 z-[140] max-w-[360px] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-xl ${
            toast.variant === "error" ? "bg-[#8a2f2f]" : "bg-[#0f5050]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[34px] font-semibold text-[#2f3538]">Empresa - Hidrossemeadores</h1>

        <Button
          type="button"
          onClick={openCadastroModal}
          className="h-11 min-w-[170px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343]"
        >
          Cadastrar Empresa
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full min-w-[240px] flex-1 sm:w-[300px] sm:flex-none">
          <label htmlFor="empresas-search" className="sr-only">
            Buscar empresa
          </label>
          <input
            id="empresas-search"
            name="empresas-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Digite para Buscar"
            className="h-10 w-full rounded-lg border border-[#cad2d4] bg-[#c8dfde] px-3 text-sm text-[#2c5052] outline-none placeholder:text-[#5a7f81]"
          />
        </div>

        <Button
          type="button"
          onClick={handleSearch}
          className="h-10 min-w-[120px] rounded-lg border-0 bg-[#0f5050] text-sm font-semibold text-white hover:bg-[#0c4343]"
        >
          <Search className="mr-1 h-4 w-4" />
          Buscar
        </Button>
      </div>

      <div className="space-y-3">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="bg-[#c8dfde] text-[#1d4d50]">
                <th className="rounded-l-xl px-3 py-3 text-left text-sm font-semibold">Nome</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">Data</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">Usuario</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">Endereco</th>
                <th className="rounded-r-xl px-3 py-3 text-right text-sm font-semibold" />
              </tr>
            </thead>
            <tbody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => (
                  <tr key={row.id} className="bg-[#eceeef] text-[#3b4447]">
                    <td className="rounded-l-xl px-3 py-3 text-sm font-medium text-[#2d3438]">{row.nome}</td>
                    <td className="px-3 py-3 text-xs text-[#5f666a]">{row.data}</td>
                    <td className="px-3 py-3 text-xs text-[#5f666a]">{row.status}</td>
                    <td className="px-3 py-3 text-xs text-[#5f666a]">{row.usuario}</td>
                    <td className="px-3 py-3 text-xs text-[#5f666a]">{row.endereco}</td>
                    <td className="rounded-r-xl px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          aria-label={`Editar empresa ${row.nome}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5a5f61] hover:bg-[#dde3e5]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void openPedidosModal(row);
                          }}
                          aria-label={`Ver pedidos da empresa ${row.nome}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5a5f61] hover:bg-[#dde3e5]"
                        >
                          <List className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-[#eceeef]">
                  <td colSpan={6} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <p className="text-base text-[#444a4f]">Pagina [{safePage}]</p>

          <Button
            type="button"
            size="lg"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Proxima
          </Button>
        </div>
      </div>

      {isCadastroModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4"
          onClick={closeCadastroModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[980px] rounded-2xl bg-[#f4f6f6] p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar Empresa"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-4xl font-semibold text-[#2f3538]">Cadastrar Empresa</h3>
              <button
                type="button"
                onClick={closeCadastroModal}
                aria-label="Fechar cadastro de empresa"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="max-w-[240px]">
                <label htmlFor="empresa-codigo" className="mb-1 block text-xs text-[#597678]">
                  Codigo do Cliente (Consistem)
                </label>
                <input
                  id="empresa-codigo"
                  name="empresa-codigo"
                  value={formValues.codigoCliente}
                  onChange={(event) => handleFormField("codigoCliente", event.target.value)}
                  placeholder="000"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>

              <div>
                <label htmlFor="empresa-nome" className="mb-1 block text-xs text-[#597678]">
                  Nome
                </label>
                <input
                  id="empresa-nome"
                  name="empresa-nome"
                  value={formValues.nome}
                  onChange={(event) => handleFormField("nome", event.target.value)}
                  placeholder="Jose Moura"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="empresa-representante" className="mb-1 block text-xs text-[#597678]">
                    Representante
                  </label>
                  <div className="relative">
                    <select
                      id="empresa-representante"
                      name="empresa-representante"
                      value={formValues.representanteId}
                      onChange={(event) => handleFormField("representanteId", event.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 pr-9 text-sm text-[#2f4f52] outline-none"
                    >
                      <option value="">Representante</option>
                      {representantes.map((representante) => (
                        <option key={representante.id} value={String(representante.id)}>
                          {representante.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#4f6467]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="empresa-email" className="mb-1 block text-xs text-[#597678]">
                    E-mail
                  </label>
                  <input
                    id="empresa-email"
                    name="empresa-email"
                    value={formValues.email}
                    onChange={(event) => handleFormField("email", event.target.value)}
                    placeholder="usuario123@email.com"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="empresa-telefone" className="mb-1 block text-xs text-[#597678]">
                    Telefone
                  </label>
                  <input
                    id="empresa-telefone"
                    name="empresa-telefone"
                    value={formValues.telefone}
                    onChange={(event) => handleFormField("telefone", event.target.value)}
                    placeholder="47 99999-9999"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>

                <div>
                  <label htmlFor="empresa-whatsapp" className="mb-1 block text-xs text-[#597678]">
                    whatsapp
                  </label>
                  <input
                    id="empresa-whatsapp"
                    name="empresa-whatsapp"
                    value={formValues.whatsapp}
                    onChange={(event) => handleFormField("whatsapp", event.target.value)}
                    placeholder="47 99999-9999"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="empresa-cnpj" className="mb-1 block text-xs text-[#597678]">
                    CNPJ
                  </label>
                  <input
                    id="empresa-cnpj"
                    name="empresa-cnpj"
                    value={formValues.cnpj}
                    onChange={(event) => handleFormField("cnpj", event.target.value)}
                    placeholder="079450001/58"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>

                <div>
                  <label htmlFor="empresa-cep" className="mb-1 block text-xs text-[#597678]">
                    CEP
                  </label>
                  <input
                    id="empresa-cep"
                    name="empresa-cep"
                    value={formValues.cep}
                    onChange={(event) => handleFormField("cep", event.target.value)}
                    placeholder="86075-060"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="empresa-endereco" className="mb-1 block text-xs text-[#597678]">
                  Endereco
                </label>
                <input
                  id="empresa-endereco"
                  name="empresa-endereco"
                  value={formValues.endereco}
                  onChange={(event) => handleFormField("endereco", event.target.value)}
                  placeholder="Rua Jk 345, centro"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>

              <div>
                <label htmlFor="empresa-instagram" className="mb-1 block text-xs text-[#597678]">
                  Link Instagram
                </label>
                <input
                  id="empresa-instagram"
                  name="empresa-instagram"
                  value={formValues.linkInstagram}
                  onChange={(event) => handleFormField("linkInstagram", event.target.value)}
                  placeholder="https://www.instagram.com/verdetecbrasil/"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>
            </div>

            {cadastroError ? <p className="mt-3 text-sm text-[#7b2323]">{cadastroError}</p> : null}

            <div className="mt-5">
              <Button
                type="button"
                onClick={handleSubmitCadastro}
                disabled={isSubmittingCadastro}
                className="h-11 w-full rounded-lg border-0 bg-[#6ca79d] text-base font-semibold text-white hover:bg-[#5d978d]"
              >
                {isSubmittingCadastro ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-3"
          onClick={closeEditModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[1180px] rounded-2xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Editar Empresa"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-4xl font-semibold text-[#2f3538]">Editar Empresa</h3>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Fechar editar empresa"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr),240px]">
                <div className="max-w-[320px]">
                  <label htmlFor="editar-empresa-codigo" className="mb-1 block text-xs text-[#597678]">
                    Codigo do Cliente (Consistem)
                  </label>
                  <input
                    id="editar-empresa-codigo"
                    name="editar-empresa-codigo"
                    value={editFormValues.codigoCliente}
                    onChange={(event) => handleEditField("codigoCliente", event.target.value)}
                    placeholder="id_consistem"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>

                <div>
                  <label htmlFor="editar-empresa-status" className="mb-1 block text-xs text-[#597678]">
                    Status do Cliente
                  </label>
                  <div className="relative">
                    <select
                      id="editar-empresa-status"
                      name="editar-empresa-status"
                      value={editFormValues.statusCliente}
                      onChange={(event) => handleEditField("statusCliente", event.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-[#d4d9db] bg-[#f1f2f2] px-3 pr-9 text-sm text-[#4e5458] outline-none"
                    >
                      <option value="">Altere o status</option>
                      {STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b7478]" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="editar-empresa-nome" className="mb-1 block text-xs text-[#597678]">
                  Nome
                </label>
                <input
                  id="editar-empresa-nome"
                  name="editar-empresa-nome"
                  value={editFormValues.nome}
                  onChange={(event) => handleEditField("nome", event.target.value)}
                  placeholder="nome"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="editar-empresa-representante" className="mb-1 block text-xs text-[#597678]">
                    Representante
                  </label>
                  <div className="relative">
                    <select
                      id="editar-empresa-representante"
                      name="editar-empresa-representante"
                      value={editFormValues.representanteId}
                      onChange={(event) => handleEditField("representanteId", event.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 pr-9 text-sm text-[#2f4f52] outline-none"
                    >
                      <option value="">Representante</option>
                      {representantes.map((representante) => (
                        <option key={representante.id} value={String(representante.id)}>
                          {representante.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#4f6467]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="editar-empresa-email" className="mb-1 block text-xs text-[#597678]">
                    E-mail
                  </label>
                  <input
                    id="editar-empresa-email"
                    name="editar-empresa-email"
                    value={editFormValues.email}
                    onChange={(event) => handleEditField("email", event.target.value)}
                    placeholder="email"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="editar-empresa-telefone" className="mb-1 block text-xs text-[#597678]">
                    Telefone
                  </label>
                  <input
                    id="editar-empresa-telefone"
                    name="editar-empresa-telefone"
                    value={editFormValues.telefone}
                    onChange={(event) => handleEditField("telefone", event.target.value)}
                    placeholder="(47)99999-9999"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>

                <div>
                  <label htmlFor="editar-empresa-whatsapp" className="mb-1 block text-xs text-[#597678]">
                    whatsapp
                  </label>
                  <input
                    id="editar-empresa-whatsapp"
                    name="editar-empresa-whatsapp"
                    value={editFormValues.whatsapp}
                    onChange={(event) => handleEditField("whatsapp", event.target.value)}
                    placeholder="(47)99999-9999"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="editar-empresa-cnpj" className="mb-1 block text-xs text-[#597678]">
                    CNPJ
                  </label>
                  <input
                    id="editar-empresa-cnpj"
                    name="editar-empresa-cnpj"
                    value={editFormValues.cnpj}
                    onChange={(event) => handleEditField("cnpj", event.target.value)}
                    placeholder="cnpj"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>

                <div>
                  <label htmlFor="editar-empresa-cep" className="mb-1 block text-xs text-[#597678]">
                    CEP
                  </label>
                  <input
                    id="editar-empresa-cep"
                    name="editar-empresa-cep"
                    value={editFormValues.cep}
                    onChange={(event) => handleEditField("cep", event.target.value)}
                    placeholder="89075050"
                    className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="editar-empresa-endereco" className="mb-1 block text-xs text-[#597678]">
                  Endereco
                </label>
                <input
                  id="editar-empresa-endereco"
                  name="editar-empresa-endereco"
                  value={editFormValues.endereco}
                  onChange={(event) => handleEditField("endereco", event.target.value)}
                  placeholder="JK,312 Itajai -SC"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>

              <div>
                <label htmlFor="editar-empresa-instagram" className="mb-1 block text-xs text-[#597678]">
                  Link Instagram
                </label>
                <input
                  id="editar-empresa-instagram"
                  name="editar-empresa-instagram"
                  value={editFormValues.linkInstagram}
                  onChange={(event) => handleEditField("linkInstagram", event.target.value)}
                  placeholder="INSTA"
                  className="h-10 w-full rounded-lg border border-[#d4d9db] bg-[#c8dfde] px-3 text-sm text-[#2f4f52] outline-none placeholder:text-[#6d8a8c]"
                />
              </div>
            </div>

            {editError ? <p className="mt-3 text-sm text-[#7b2323]">{editError}</p> : null}

            <div className="mt-4">
              <Button
                type="button"
                onClick={handleSubmitEdit}
                disabled={isSubmittingEdit}
                className="h-11 w-full rounded-lg border-0 bg-[#6ca79d] text-base font-semibold text-white hover:bg-[#5d978d]"
              >
                {isSubmittingEdit ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isPedidosModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          onClick={closePedidosModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[1020px] rounded-xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Pedidos da Empresa"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-4xl font-semibold text-[#2f3538]">Empresa - Hidrossemeador</h3>
              <button
                type="button"
                onClick={closePedidosModal}
                aria-label="Fechar pedidos da empresa"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-1 text-sm text-[#2f3538]">
              <p>
                <span className="text-xs text-[#677174]">Nome da Empresa (Hidrossemeador)</span>
                <span className="ml-2 font-semibold text-[#1f4f52]">
                  {safeText(pedidosEmpresa?.nome, "nome")}
                </span>
              </p>
              <p className="text-base text-[#1f4f52]">
                <span className="mr-4 text-xs text-[#677174]">EMAIL</span>
                {safeText(pedidosEmpresa?.email, "vertec@verdetec.com")}
                <span className="ml-4 mr-2 text-xs text-[#677174]">CEP</span>
                {safeText(pedidosEmpresa?.cep, "86078662")}
              </p>
            </div>

            <div className="my-4 h-[2px] w-full bg-[#2d6b6f]" />

            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-[30px] font-semibold text-[#2f3538]">Solicitações</h4>
              <Button
                type="button"
                onClick={openPedidosProximosModal}
                className="h-9 min-w-[170px] rounded-lg border-0 bg-[#6ca79d] text-sm font-semibold text-white hover:bg-[#5d978d]"
              >
                Adicionar Novo Pedido
              </Button>
            </div>

            <div className="rounded-xl bg-[#cfe6e4] p-3">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#edf1f2] text-[#254d4f]">
                    <th className="rounded-l-lg px-3 py-2 text-left text-sm font-semibold">Nome</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Telefone</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Metragem</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Cep</th>
                    <th className="rounded-r-lg px-3 py-2 text-left text-sm font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPedidos ? (
                    <tr className="bg-[#d8ecea] text-[#285154]">
                      <td colSpan={5} className="rounded-lg px-3 py-3 text-center text-sm">
                        Carregando pedidos...
                      </td>
                    </tr>
                  ) : pedidosError ? (
                    <tr className="bg-[#d8ecea] text-[#7b2323]">
                      <td colSpan={5} className="rounded-lg px-3 py-3 text-center text-sm">
                        {pedidosError}
                      </td>
                    </tr>
                  ) : pedidosRows.length > 0 ? (
                    pedidosRows.map((pedido) => (
                      <tr key={pedido.id} className="bg-[#d8ecea] text-[#285154]">
                        <td className="rounded-l-lg px-3 py-2 text-sm">{pedido.nome}</td>
                        <td className="px-3 py-2 text-sm">{pedido.telefone}</td>
                        <td className="px-3 py-2 text-sm">{pedido.metragem}</td>
                        <td className="px-3 py-2 text-sm">{pedido.cep}</td>
                        <td className="rounded-r-lg px-3 py-2 text-sm">{pedido.data}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-[#d8ecea] text-[#285154]">
                      <td colSpan={5} className="rounded-lg px-3 py-3 text-center text-sm">
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {isPedidosProximosModalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
          onClick={closePedidosProximosModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[980px] rounded-xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Solicitacoes mais proximas"
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[34px] leading-tight font-semibold text-[#2f3538]">Solicitacoes mais proximas</h3>
                <p className="mt-1 text-xs text-[#5a6265]">Selecione o pedido para adicionar na empresa</p>
              </div>
              <button
                type="button"
                onClick={closePedidosProximosModal}
                aria-label="Fechar solicitacoes proximas"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-[#cfe6e4] p-3">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#edf1f2] text-[#254d4f]">
                    <th className="rounded-l-lg px-3 py-2 text-left text-sm font-semibold">Nome</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Telefone</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Metragem</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Cep</th>
                    <th className="rounded-r-lg px-3 py-2 text-right text-sm font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPedidosProximos ? (
                    <tr className="bg-[#d8ecea] text-[#285154]">
                      <td colSpan={5} className="rounded-lg px-3 py-3 text-center text-sm">
                        Carregando solicitacoes...
                      </td>
                    </tr>
                  ) : pedidosProximosError ? (
                    <tr className="bg-[#d8ecea] text-[#7b2323]">
                      <td colSpan={5} className="rounded-lg px-3 py-3 text-center text-sm">
                        {pedidosProximosError}
                      </td>
                    </tr>
                  ) : pedidosProximosRows.length > 0 ? (
                    pedidosProximosRows.map((pedido) => (
                      <tr key={pedido.id} className="bg-[#d8ecea] text-[#285154]">
                        <td className="rounded-l-lg px-3 py-2 text-sm font-medium">{pedido.nome}</td>
                        <td className="px-3 py-2 text-sm">{pedido.telefone}</td>
                        <td className="px-3 py-2 text-sm">{pedido.metragem}</td>
                        <td className="px-3 py-2 text-sm">{pedido.cep}</td>
                        <td className="rounded-r-lg px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              void handleAdicionarPedidoProximo(pedido.id);
                            }}
                            disabled={isAddingPedidoId === pedido.id}
                            aria-label="Adicionar pedido"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#cae0dd] text-[#2b5658] hover:bg-[#bdd6d2] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-[#d8ecea] text-[#285154]">
                      <td colSpan={5} className="rounded-lg px-3 py-3 text-center text-sm">
                        Nenhuma solicitacao encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {adicionarPedidoError ? (
              <p className="mt-3 text-sm text-[#7b2323]">{adicionarPedidoError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
