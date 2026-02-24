"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Link2,
  MoreVertical,
  Ruler,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import type {
  ClienteControleRow,
  ClienteEquipamentoOption,
  ClienteRepresentanteOption,
} from "@/components/clientes/types";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateTime } from "@/utils/format";

type ClientesControlTableProps = {
  rows: ClienteControleRow[];
  representantes: ClienteRepresentanteOption[];
  equipamentos: ClienteEquipamentoOption[];
  page: number;
  hasNextPage: boolean;
  currentUserId: number | null;
  canShowEtiqueta50?: boolean;
  selectedIds: string[];
  onPageChange: (next: number) => void;
  onToggleSelect: (id: string) => void;
};

type MenuAnchor = {
  rowId: string;
  top: number;
  left: number;
};

type VisualizacaoEtiqueta = {
  etiqueta: string;
  data_criacao: string | null;
};

type VisualizacaoClienteData = {
  id_pessoa: number;
  nome: string;
  telefone: string;
  email: string;
  documento: string;
  tipo_pessoa: string | null;
  created_at: string | null;
  etiquetas: VisualizacaoEtiqueta[];
};

type ClientesTableColumnKey = "etiqueta" | "telefone" | "nome" | "equipamento" | "data30" | "data40";

type ClientesTableColumn = {
  key: ClientesTableColumnKey;
  label: string;
  getValue: (row: ClienteControleRow) => string;
};

const MENU_WIDTH = 332;
const MENU_HEIGHT = 292;
const MENU_MARGIN = 12;
const MENU_GAP = 8;
const CLIENTES_TABLE_COLUMNS: ClientesTableColumn[] = [
  { key: "etiqueta", label: "Etiqueta", getValue: (row) => row.etiqueta || "-" },
  { key: "telefone", label: "Telefone", getValue: (row) => row.telefone || "-" },
  { key: "nome", label: "Nome", getValue: (row) => row.nome || "-" },
  { key: "equipamento", label: "Equipamento", getValue: (row) => row.equipamento || "-" },
  { key: "data30", label: "Data #30", getValue: (row) => row.data30 || "-" },
  { key: "data40", label: "Data #40", getValue: (row) => row.data40 || "-" },
];
const ALL_COLUMN_KEYS = CLIENTES_TABLE_COLUMNS.map((column) => column.key);
const ETIQUETA_OPTIONS_BASE = [
  { label: "Selecione", value: "" },
  { label: "60 Lead perdido", value: "60" as string },
  { label: "61 Pedido no portal de hidrossemeadura", value: "61" as string },
  { label: "62 Pedido sem perfil", value: "62" as string },
  { label: "66 Pedido para concorrente", value: "66" as string },
  { label: "73 Fluxo bloqueado", value: "73" as string },
];

export function ClientesControlTable({
  rows,
  representantes,
  equipamentos,
  page,
  hasNextPage,
  currentUserId,
  canShowEtiqueta50 = false,
  selectedIds,
  onPageChange,
  onToggleSelect,
}: ClientesControlTableProps) {
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [isEtiquetaModalOpen, setIsEtiquetaModalOpen] = useState(false);
  const [isRepresentanteModalOpen, setIsRepresentanteModalOpen] = useState(false);
  const [isPropostaModalOpen, setIsPropostaModalOpen] = useState(false);
  const [isVisualizarModalOpen, setIsVisualizarModalOpen] = useState(false);
  const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
  const [propostaTargetRowId, setPropostaTargetRowId] = useState<string | null>(null);
  const [contratoTargetRowId, setContratoTargetRowId] = useState<string | null>(null);
  const [selectedEquipamentoId, setSelectedEquipamentoId] = useState("");
  const [propostaFeedback, setPropostaFeedback] = useState<string | null>(null);
  const [representanteTargetRowId, setRepresentanteTargetRowId] = useState<string | null>(null);
  const [selectedRepresentanteId, setSelectedRepresentanteId] = useState("");
  const [isSavingRepresentante, setIsSavingRepresentante] = useState(false);
  const [representanteFeedback, setRepresentanteFeedback] = useState<string | null>(null);
  const [etiquetaTargetRowId, setEtiquetaTargetRowId] = useState<string | null>(null);
  const [selectedEtiqueta, setSelectedEtiqueta] = useState("");
  const [etiquetaMetragem, setEtiquetaMetragem] = useState("");
  const [etiquetaCep, setEtiquetaCep] = useState("");
  const [isSavingEtiqueta, setIsSavingEtiqueta] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isCreatingProposta, setIsCreatingProposta] = useState(false);
  const [isLoadingVisualizacao, setIsLoadingVisualizacao] = useState(false);
  const [etiquetaFeedback, setEtiquetaFeedback] = useState<string | null>(null);
  const [visualizacaoFeedback, setVisualizacaoFeedback] = useState<string | null>(null);
  const [visualizacaoData, setVisualizacaoData] = useState<VisualizacaoClienteData | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<ClientesTableColumnKey[]>(
    CLIENTES_TABLE_COLUMNS.map((column) => column.key),
  );
  const [contratoFormData, setContratoFormData] = useState({
    telefoneProposta: "",
    telefoneCobranca: "",
    emailNotaFiscal: "",
    emailResponsavel: "",
    numeroIdentificacao: "",
    arquivosContrato: [] as File[],
  });
  const [isSubmittingContrato, setIsSubmittingContrato] = useState(false);
  const [contratoFeedback, setContratoFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const columnsMenuRef = useRef<HTMLDivElement | null>(null);
  const contratoFileInputRef = useRef<HTMLInputElement | null>(null);

  const safePage = Math.max(1, Math.trunc(page));
  const currentRows = rows;
  const selectedSet = new Set(selectedIds);
  const canGoPrev = safePage > 1;
  const canGoNext = hasNextPage;
  const visibleColumns = CLIENTES_TABLE_COLUMNS.filter((column) => visibleColumnKeys.includes(column.key));
  const totalTableColumns = visibleColumns.length + 2;
  const allColumnsSelected = visibleColumnKeys.length === CLIENTES_TABLE_COLUMNS.length;
  const etiquetaOptions = canShowEtiqueta50
    ? [...ETIQUETA_OPTIONS_BASE.slice(0, 1), { label: "50 Hidrossemeador", value: "50" }, ...ETIQUETA_OPTIONS_BASE.slice(1)]
    : ETIQUETA_OPTIONS_BASE;

  useEffect(() => {
    if (
      !menuAnchor &&
      !isEtiquetaModalOpen &&
      !isRepresentanteModalOpen &&
      !isPropostaModalOpen &&
      !isVisualizarModalOpen &&
      !isContratoModalOpen
    ) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isVisualizarModalOpen) {
        setIsVisualizarModalOpen(false);
        setIsLoadingVisualizacao(false);
        setVisualizacaoFeedback(null);
        setVisualizacaoData(null);
        return;
      }

      if (isContratoModalOpen) {
        closeContratoModal();
        return;
      }

      if (isPropostaModalOpen) {
        setIsPropostaModalOpen(false);
        setPropostaTargetRowId(null);
        setSelectedEquipamentoId("");
        setPropostaFeedback(null);
        return;
      }

      if (isRepresentanteModalOpen) {
        setIsRepresentanteModalOpen(false);
        setRepresentanteTargetRowId(null);
        setSelectedRepresentanteId("");
        setIsSavingRepresentante(false);
        setRepresentanteFeedback(null);
        return;
      }

      if (isEtiquetaModalOpen) {
        setIsEtiquetaModalOpen(false);
        setSelectedEtiqueta("");
        return;
      }

      setMenuAnchor(null);
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (
        isEtiquetaModalOpen ||
        isRepresentanteModalOpen ||
        isPropostaModalOpen ||
        isVisualizarModalOpen ||
        isContratoModalOpen ||
        !menuAnchor
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (menuRef.current?.contains(target)) {
        return;
      }

      if (target.closest("[data-clientes-menu-trigger='true']")) {
        return;
      }

      setMenuAnchor(null);
    };

    const handleViewportChange = () => {
      if (
        menuAnchor &&
        !isEtiquetaModalOpen &&
        !isRepresentanteModalOpen &&
        !isPropostaModalOpen &&
        !isVisualizarModalOpen &&
        !isContratoModalOpen
      ) {
        setMenuAnchor(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isEtiquetaModalOpen, isPropostaModalOpen, isRepresentanteModalOpen, isVisualizarModalOpen, isContratoModalOpen, menuAnchor]);

  useEffect(() => {
    if (!isColumnsMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (columnsMenuRef.current?.contains(target)) {
        return;
      }

      setIsColumnsMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsColumnsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isColumnsMenuOpen]);

  useEffect(() => {
    if (!successAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSuccessAlert(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [successAlert]);

  useEffect(() => {
    if (!errorAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setErrorAlert(null);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [errorAlert]);

  useEffect(() => {
    if (selectedEtiqueta === "61") {
      return;
    }

    setEtiquetaMetragem("");
    setEtiquetaCep("");
  }, [selectedEtiqueta]);

  const toggleMenu = (rowId: string, event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (menuAnchor?.rowId === rowId) {
      setMenuAnchor(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right - MENU_WIDTH;
    if (left < MENU_MARGIN) {
      left = MENU_MARGIN;
    }
    if (left + MENU_WIDTH > viewportWidth - MENU_MARGIN) {
      left = viewportWidth - MENU_WIDTH - MENU_MARGIN;
    }

    let top = rect.bottom + MENU_GAP;
    if (top + MENU_HEIGHT > viewportHeight - MENU_MARGIN) {
      top = rect.top - MENU_HEIGHT - MENU_GAP;
    }
    if (top < MENU_MARGIN) {
      top = MENU_MARGIN;
    }

    setMenuAnchor({ rowId, top, left });
  };

  const openEtiquetaModal = () => {
    if (!menuAnchor) {
      return;
    }

    setEtiquetaTargetRowId(menuAnchor.rowId);
    setSelectedEtiqueta("");
    setEtiquetaMetragem("");
    setEtiquetaCep("");
    setEtiquetaFeedback(null);
    setIsEtiquetaModalOpen(true);
    setMenuAnchor(null);
  };

  const openRepresentanteModal = () => {
    if (!menuAnchor) {
      return;
    }

    setRepresentanteTargetRowId(menuAnchor.rowId);
    setSelectedRepresentanteId("");
    setIsSavingRepresentante(false);
    setRepresentanteFeedback(null);
    setIsRepresentanteModalOpen(true);
    setMenuAnchor(null);
  };

  const openPropostaModal = () => {
    if (!menuAnchor) {
      return;
    }

    setPropostaTargetRowId(menuAnchor.rowId);
    setSelectedEquipamentoId("");
    setPropostaFeedback(null);
    setIsCreatingProposta(false);
    setIsPropostaModalOpen(true);
    setMenuAnchor(null);
  };

  const openVisualizarModal = async () => {
    if (!menuAnchor) {
      return;
    }

    const targetRow = rows.find((row) => row.id === menuAnchor.rowId);
    if (!targetRow) {
      setErrorAlert("Nao foi possivel localizar o cliente selecionado.");
      setMenuAnchor(null);
      return;
    }

    const idPessoaFromRow = (() => {
      if (typeof targetRow.pessoaId === "number" && targetRow.pessoaId > 0) {
        return targetRow.pessoaId;
      }

      const parsed = Number(targetRow.id);
      return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
    })();

    if (!idPessoaFromRow) {
      setErrorAlert("Nao foi possivel resolver id_pessoa para visualizar.");
      setMenuAnchor(null);
      return;
    }

    setMenuAnchor(null);
    setIsVisualizarModalOpen(true);
    setIsLoadingVisualizacao(true);
    setVisualizacaoFeedback(null);
    setVisualizacaoData(null);

    try {
      const response = await fetch("/api/clientes/visualizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_pessoa: idPessoaFromRow,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            cliente?: {
              id_pessoa?: number;
              nome?: string;
              telefone?: string;
              email?: string;
              documento?: string;
              tipo_pessoa?: string | null;
              created_at?: string | null;
            };
            etiquetas?: Array<{ etiqueta?: string; data_criacao?: string | null }>;
            debug_id?: string;
            debug?: unknown;
          }
        | null;

      if (process.env.NODE_ENV !== "production") {
        console.debug("[clientes/visualizar] response", {
          httpStatus: response.status,
          payload,
        });
      }

      if (!response.ok || !payload?.ok || !payload.cliente) {
        setVisualizacaoFeedback(payload?.error ?? "Falha ao carregar dados do cliente.");
        return;
      }

      setVisualizacaoData({
        id_pessoa: payload.cliente.id_pessoa ?? idPessoaFromRow,
        nome: payload.cliente.nome ?? targetRow.nome ?? "Cliente sem nome",
        telefone: payload.cliente.telefone ?? targetRow.telefone ?? "Nao informado",
        email: payload.cliente.email ?? "Email nao existente",
        documento: payload.cliente.documento ?? String(payload.cliente.id_pessoa ?? idPessoaFromRow),
        tipo_pessoa: payload.cliente.tipo_pessoa ?? null,
        created_at: payload.cliente.created_at ?? null,
        etiquetas: Array.isArray(payload.etiquetas)
          ? payload.etiquetas
              .map((item) => ({
                etiqueta: item?.etiqueta ?? "",
                data_criacao: item?.data_criacao ?? null,
              }))
              .filter((item) => item.etiqueta.length > 0)
          : [],
      });
    } catch {
      setVisualizacaoFeedback("Erro ao carregar dados do cliente.");
    } finally {
      setIsLoadingVisualizacao(false);
    }
  };

  const closeEtiquetaModal = () => {
    setIsEtiquetaModalOpen(false);
    setEtiquetaTargetRowId(null);
    setSelectedEtiqueta("");
    setEtiquetaMetragem("");
    setEtiquetaCep("");
    setEtiquetaFeedback(null);
    setIsSavingEtiqueta(false);
  };

  const closeRepresentanteModal = () => {
    setIsRepresentanteModalOpen(false);
    setRepresentanteTargetRowId(null);
    setSelectedRepresentanteId("");
    setIsSavingRepresentante(false);
    setRepresentanteFeedback(null);
  };

  const closePropostaModal = () => {
    setIsPropostaModalOpen(false);
    setPropostaTargetRowId(null);
    setSelectedEquipamentoId("");
    setPropostaFeedback(null);
    setIsCreatingProposta(false);
  };

  const closeVisualizarModal = () => {
    setIsVisualizarModalOpen(false);
    setIsLoadingVisualizacao(false);
    setVisualizacaoFeedback(null);
    setVisualizacaoData(null);
  };

  const openContratoModal = () => {
    if (!menuAnchor) {
      return;
    }

    setContratoTargetRowId(menuAnchor.rowId);
    setContratoFormData({
      telefoneProposta: "",
      telefoneCobranca: "",
      emailNotaFiscal: "",
      emailResponsavel: "",
      numeroIdentificacao: "",
      arquivosContrato: [],
    });
    setContratoFeedback(null);
    setIsSubmittingContrato(false);
    setIsContratoModalOpen(true);
    setMenuAnchor(null);
  };

  const closeContratoModal = () => {
    setIsContratoModalOpen(false);
    setContratoTargetRowId(null);
    setContratoFormData({
      telefoneProposta: "",
      telefoneCobranca: "",
      emailNotaFiscal: "",
      emailResponsavel: "",
      numeroIdentificacao: "",
      arquivosContrato: [],
    });
    setContratoFeedback(null);
    setIsSubmittingContrato(false);
  };

  const handleRemoveContratoArquivo = (fileToRemove: File) => {
    const fileKeyToRemove = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
    setContratoFormData((prev) => ({
      ...prev,
      arquivosContrato: prev.arquivosContrato.filter((file) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        return fileKey !== fileKeyToRemove;
      }),
    }));
  };

  const handleCadastrarContrato = async () => {
    const { telefoneProposta, telefoneCobranca, emailNotaFiscal, emailResponsavel, numeroIdentificacao, arquivosContrato } = contratoFormData;

    if (!telefoneProposta.trim()) {
      setContratoFeedback("Informe o telefone da proposta de valor.");
      return;
    }

    if (!telefoneCobranca.trim()) {
      setContratoFeedback("Informe o telefone para cobrança.");
      return;
    }

    if (!emailNotaFiscal.trim()) {
      setContratoFeedback("Informe o e-mail de nota fiscal e boleto.");
      return;
    }

    if (!emailResponsavel.trim()) {
      setContratoFeedback("Informe o e-mail do responsável pela empresa.");
      return;
    }

    if (!numeroIdentificacao.trim()) {
      setContratoFeedback("Informe o número de identificação da proposta de valor.");
      return;
    }

    if (!contratoTargetRowId) {
      setContratoFeedback("Cliente selecionado inválido.");
      return;
    }

    const targetRow = rows.find((row) => row.id === contratoTargetRowId);
    if (!targetRow) {
      setContratoFeedback("Nao foi possivel localizar o cliente selecionado.");
      return;
    }

    const idPessoaFromRow =
      typeof targetRow.pessoaId === "number" && targetRow.pessoaId > 0
        ? Math.trunc(targetRow.pessoaId)
        : null;
    const idAgregacaoFromRow =
      typeof targetRow.agregacaoId === "number" && targetRow.agregacaoId > 0
        ? Math.trunc(targetRow.agregacaoId)
        : null;
    const idUsuarioFromRow =
      typeof targetRow.usuarioId === "number" && targetRow.usuarioId > 0
        ? Math.trunc(targetRow.usuarioId)
        : null;
    const idUsuarioPayload = currentUserId && currentUserId > 0 ? Math.trunc(currentUserId) : idUsuarioFromRow;

    if (!idPessoaFromRow && !idAgregacaoFromRow) {
      setContratoFeedback("Nao foi possivel resolver id_pessoa ou id_agregacao.");
      return;
    }

    setIsSubmittingContrato(true);
    setContratoFeedback(null);

    try {
      const formData = new FormData();
      if (idPessoaFromRow) {
        formData.append("id_pessoa", String(idPessoaFromRow));
      }
      if (idAgregacaoFromRow) {
        formData.append("id_agregacao", String(idAgregacaoFromRow));
      }
      if (idUsuarioPayload) {
        formData.append("id_usuario", String(idUsuarioPayload));
      }
      formData.append("telefone_proposta", telefoneProposta);
      formData.append("telefone_cobranca", telefoneCobranca);
      formData.append("email_nota_fiscal", emailNotaFiscal);
      formData.append("email_responsavel", emailResponsavel);
      formData.append("numero_identificacao", numeroIdentificacao);
      
      // Adiciona múltiplos arquivos
      for (const file of arquivosContrato) {
        formData.append("arquivo_contrato", file);
      }

      const response = await fetch("/api/clientes/cadastrar-contrato", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; id_contrato?: number; debug_id?: string; debug?: unknown }
        | null;

      if (process.env.NODE_ENV !== "production") {
        console.debug("[clientes/cadastrar-contrato] response", {
          httpStatus: response.status,
          payload,
        });
      }

      if (!response.ok || !payload?.ok) {
        const baseError = payload?.error ?? "Falha ao cadastrar contrato.";
        const debugSuffix = payload?.debug_id ? ` (debug: ${payload.debug_id})` : "";
        setContratoFeedback(`${baseError}${debugSuffix}`);
        return;
      }

      closeContratoModal();
      setSuccessAlert("Contrato cadastrado com sucesso.");
      router.refresh();
      window.setTimeout(() => router.refresh(), 1200);
      window.setTimeout(() => router.refresh(), 2600);
      window.setTimeout(() => router.refresh(), 4200);
    } catch {
      setContratoFeedback("Erro ao cadastrar contrato.");
    } finally {
      setIsSubmittingContrato(false);
    }
  };

  const handleCepChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) {
      setEtiquetaCep(digits);
      return;
    }

    setEtiquetaCep(`${digits.slice(0, 5)}-${digits.slice(5)}`);
  };

  const handleSaveEtiqueta = async () => {
    if (!selectedEtiqueta) {
      setEtiquetaFeedback("Selecione uma etiqueta.");
      return;
    }

    if (!etiquetaTargetRowId) {
      setEtiquetaFeedback("Cliente selecionado invalido.");
      return;
    }

    const targetRow = rows.find((row) => row.id === etiquetaTargetRowId);
    if (!targetRow) {
      setEtiquetaFeedback("Nao foi possivel localizar o cliente selecionado.");
      return;
    }

    if (selectedEtiqueta === "61") {
      if (!etiquetaMetragem.trim()) {
        setEtiquetaFeedback("Informe a metragem.");
        return;
      }

      if (!etiquetaCep.trim()) {
        setEtiquetaFeedback("Informe o CEP.");
        return;
      }
    }

    setIsSavingEtiqueta(true);
    setEtiquetaFeedback(null);

    try {
      const response = await fetch("/api/clientes/alterar-etiqueta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_user: currentUserId ?? targetRow.usuarioId ?? null,
          id_agregacao: targetRow.agregacaoId ?? null,
          id_pessoa: targetRow.pessoaId ?? null,
          label: selectedEtiqueta,
          metragem: selectedEtiqueta === "61" ? etiquetaMetragem.trim() : undefined,
          cep: selectedEtiqueta === "61" ? etiquetaCep.trim() : undefined,
          nome: selectedEtiqueta === "61" ? targetRow.nome : undefined,
          fone: selectedEtiqueta === "61" ? (targetRow.telefone ?? "").trim() : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; deferred?: boolean; confirmed?: boolean; flow?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setEtiquetaFeedback(payload?.error ?? "Falha ao atualizar etiqueta.");
        return;
      }

      closeEtiquetaModal();
      setSuccessAlert("Etiqueta alterada com sucesso.");
      router.refresh();
      if (payload?.confirmed === false || payload?.flow === "61") {
        window.setTimeout(() => router.refresh(), 1200);
        window.setTimeout(() => router.refresh(), 2600);
        window.setTimeout(() => router.refresh(), 4200);
      }
    } catch {
      setEtiquetaFeedback("Erro ao enviar atualizacao de etiqueta.");
    } finally {
      setIsSavingEtiqueta(false);
    }
  };

  const handleSaveRepresentante = async () => {
    if (!selectedRepresentanteId.trim()) {
      setRepresentanteFeedback("Selecione um representante.");
      return;
    }

    if (!representanteTargetRowId) {
      setRepresentanteFeedback("Cliente selecionado invalido.");
      return;
    }

    const targetRow = rows.find((row) => row.id === representanteTargetRowId);
    if (!targetRow) {
      setRepresentanteFeedback("Nao foi possivel localizar o cliente selecionado.");
      return;
    }

    const idPessoaFromRow = (() => {
      if (typeof targetRow.pessoaId === "number" && targetRow.pessoaId > 0) {
        return targetRow.pessoaId;
      }

      const parsed = Number(targetRow.id);
      return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
    })();

    if (!idPessoaFromRow) {
      setRepresentanteFeedback("Nao foi possivel resolver id_pessoa.");
      return;
    }

    const selectedUserId = Number(selectedRepresentanteId);
    if (!Number.isFinite(selectedUserId) || selectedUserId <= 0) {
      setRepresentanteFeedback("Representante invalido.");
      return;
    }

    setIsSavingRepresentante(true);
    setRepresentanteFeedback(null);

    try {
      const response = await fetch("/api/clientes/alterar-representante", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_pessoa: idPessoaFromRow,
          id_user: Math.trunc(selectedUserId),
          autor: currentUserId ? Math.trunc(currentUserId) : null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setRepresentanteFeedback(payload?.error ?? "Falha ao atualizar representante.");
        return;
      }

      closeRepresentanteModal();
      setSuccessAlert("Representante alterado com sucesso.");
      router.refresh();
      window.setTimeout(() => router.refresh(), 1200);
      window.setTimeout(() => router.refresh(), 2600);
    } catch {
      setRepresentanteFeedback("Erro ao enviar atualizacao de representante.");
    } finally {
      setIsSavingRepresentante(false);
    }
  };

  const handleEnviarLink = async () => {
    if (!menuAnchor || isSendingLink) {
      return;
    }

    const targetRow = rows.find((row) => row.id === menuAnchor.rowId);
    if (!targetRow) {
      setErrorAlert("Nao foi possivel localizar o cliente selecionado.");
      setMenuAnchor(null);
      return;
    }

    const idPessoaFromRow = (() => {
      if (typeof targetRow.pessoaId === "number" && targetRow.pessoaId > 0) {
        return targetRow.pessoaId;
      }

      const parsed = Number(targetRow.id);
      return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
    })();

    if (!idPessoaFromRow) {
      setErrorAlert("Nao foi possivel resolver id_pessoa para enviar link.");
      setMenuAnchor(null);
      return;
    }

    setIsSendingLink(true);

    try {
      const response = await fetch("/api/clientes/enviar-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_pessoa: idPessoaFromRow,
          id_agregacao: targetRow.agregacaoId ?? null,
          id_usuario: currentUserId ?? null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; cod?: string; debug_id?: string; debug?: unknown }
        | null;

      if (process.env.NODE_ENV !== "production") {
        console.debug("[clientes/enviar-link] response", {
          httpStatus: response.status,
          payload,
        });
      }

      if (!response.ok || !payload?.ok) {
        setErrorAlert(payload?.error ?? "Falha ao enviar link.");
        return;
      }

      setSuccessAlert(payload?.cod ? `Link enviado com sucesso. Codigo: ${payload.cod}` : "Link enviado com sucesso.");
      setMenuAnchor(null);
      router.refresh();
    } catch {
      setErrorAlert("Erro ao enviar link.");
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleContinuarProposta = async () => {
    if (!propostaTargetRowId) {
      setPropostaFeedback("Cliente selecionado invalido.");
      return;
    }

    if (!selectedEquipamentoId.trim()) {
      setPropostaFeedback("Selecione um equipamento.");
      return;
    }

    const targetRow = rows.find((row) => row.id === propostaTargetRowId);
    if (!targetRow) {
      setPropostaFeedback("Nao foi possivel localizar o cliente selecionado.");
      return;
    }

    const selectedEquipamento = Number(selectedEquipamentoId);
    if (!Number.isFinite(selectedEquipamento) || selectedEquipamento <= 0) {
      setPropostaFeedback("Equipamento invalido.");
      return;
    }

    const idPessoaFromRow = (() => {
      if (typeof targetRow.pessoaId === "number" && targetRow.pessoaId > 0) {
        return targetRow.pessoaId;
      }

      const parsed = Number(targetRow.id);
      return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
    })();

    setIsCreatingProposta(true);
    setPropostaFeedback(null);

    try {
      const response = await fetch("/api/clientes/criar-proposta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_agregacao: targetRow.agregacaoId ?? null,
          id_pessoa: idPessoaFromRow,
          id_equipamento: Math.trunc(selectedEquipamento),
          id_usuario: currentUserId ?? null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; debug_id?: string; debug?: unknown }
        | null;

      if (process.env.NODE_ENV !== "production") {
        console.debug("[clientes/criar-proposta] response", {
          httpStatus: response.status,
          payload,
        });
      }

      if (!response.ok || !payload?.ok) {
        setPropostaFeedback(payload?.error ?? "Falha ao criar proposta.");
        return;
      }

      closePropostaModal();
      setSuccessAlert("Proposta criada com sucesso.");
      router.refresh();
      window.setTimeout(() => router.refresh(), 1200);
    } catch {
      setPropostaFeedback("Erro ao criar proposta.");
    } finally {
      setIsCreatingProposta(false);
    }
  };

  const formatVisualizacaoDateTime = (value: string | null) => {
    if (!value) {
      return "-";
    }

    const formatted = formatDateTime(value);
    return formatted.includes("Invalid") ? "-" : formatted;
  };

  const handleToggleColumn = (key: ClientesTableColumnKey) => {
    setVisibleColumnKeys((current) => {
      if (current.includes(key)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((columnKey) => columnKey !== key);
      }

      return CLIENTES_TABLE_COLUMNS.map((column) => column.key).filter(
        (columnKey) => current.includes(columnKey) || columnKey === key,
      );
    });
  };

  const handleToggleAllColumns = () => {
    setVisibleColumnKeys((current) => {
      if (current.length === CLIENTES_TABLE_COLUMNS.length) {
        return [CLIENTES_TABLE_COLUMNS[0].key];
      }

      return ALL_COLUMN_KEYS;
    });
  };

  return (
    <>
      {successAlert ? (
        <div className="fixed top-6 right-6 z-[80] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {successAlert}
        </div>
      ) : null}
      {errorAlert ? (
        <div className="fixed top-6 right-6 z-[80] rounded-lg bg-[#7b2323] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {errorAlert}
        </div>
      ) : null}

      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-[#e5e7ea] p-2">
          <div className="mb-2 flex justify-end">
            <div className="relative" ref={columnsMenuRef}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsColumnsMenuOpen((current) => !current)}
                className="h-9 rounded-lg border border-[#c7cdd1] bg-white px-3 text-sm font-medium text-[#355c5f] hover:bg-slate-50"
              >
                Colunas ({visibleColumnKeys.length}/{CLIENTES_TABLE_COLUMNS.length})
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>

              {isColumnsMenuOpen ? (
                <div className="absolute top-11 right-0 z-20 min-w-[220px] rounded-xl border border-[#d3d8dc] bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5a6a6d]">
                    Mostrar colunas
                  </p>
                  <label className="mb-2 flex cursor-pointer items-center justify-between gap-3 rounded-md bg-[#f2f5f6] px-2 py-1 text-sm font-medium text-[#274a4d]">
                    <span>Selecionar todas</span>
                    <input
                      type="checkbox"
                      checked={allColumnsSelected}
                      onChange={handleToggleAllColumns}
                      className="h-4 w-4 accent-[#0f5050]"
                    />
                  </label>
                  <div className="space-y-2">
                    {CLIENTES_TABLE_COLUMNS.map((column) => {
                      const checked = visibleColumnKeys.includes(column.key);

                      return (
                        <label
                          key={column.key}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1 text-sm text-[#274a4d] hover:bg-[#f2f5f6]"
                        >
                          <span>{column.label}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleColumn(column.key)}
                            className="h-4 w-4 accent-[#0f5050]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <table className="w-full border-separate border-spacing-y-1">
            <thead>
              <tr className="rounded-xl bg-[#d5d5d7] text-left">
                <th className="w-14 rounded-l-xl px-3 py-3" />
                {visibleColumns.map((column) => (
                  <th key={column.key} className="px-3 py-3 text-sm font-semibold text-[#1d4d50]">
                    {column.label}
                  </th>
                ))}
                <th className="w-14 rounded-r-xl px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((row) => {
                  const isSelected = selectedSet.has(row.id);

                  return (
                    <tr key={row.id} className="bg-[#eceeef]">
                      <td className="rounded-l-xl px-3 py-3">
                        <button
                          type="button"
                          aria-label={`Selecionar ${row.nome}`}
                          onClick={() => onToggleSelect(row.id)}
                          className={`h-6 w-6 rounded-full border-2 transition-colors ${
                            isSelected
                              ? "border-[#0f5050] bg-[#0f5050]"
                              : "border-[#3f3f3f] bg-transparent hover:border-[#0f5050]"
                          }`}
                        />
                      </td>
                      {visibleColumns.map((column) => (
                        <td key={column.key} className="px-3 py-3 text-sm text-[#1d4d50]">
                          {column.getValue(row)}
                        </td>
                      ))}
                      <td className="rounded-r-xl px-3 py-3 text-right">
                        <button
                          type="button"
                          data-clientes-menu-trigger="true"
                          aria-label={`Acoes de ${row.nome}`}
                          onClick={(event) => toggleMenu(row.id, event)}
                          className="rounded-md p-1 text-[#1d4d50] hover:bg-[#d9dddf]"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="bg-[#eceeef]">
                  <td colSpan={totalTableColumns} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => onPageChange(safePage - 1)}
            disabled={!canGoPrev}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#8cc8c3] text-base font-semibold text-[#184f52] hover:bg-[#80b8b3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <p className="text-base text-[#444a4f]">Pagina {safePage}</p>

          <Button
            type="button"
            size="lg"
            onClick={() => onPageChange(safePage + 1)}
            disabled={!canGoNext}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Proxima
          </Button>
        </div>
      </div>

      {menuAnchor ? (
        <div
          ref={menuRef}
          className="fixed z-50 w-[332px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#f4f6f6] p-4 shadow-2xl"
          style={{ top: menuAnchor.top, left: menuAnchor.left }}
          role="dialog"
          aria-modal="false"
          aria-label="Menu de Opcoes"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#1d4d50]">Menu de Opcoes</h3>
            <button
              type="button"
              onClick={() => setMenuAnchor(null)}
              aria-label="Fechar menu de opcoes"
              className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={openEtiquetaModal}
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-sm text-[#4e5659] hover:bg-[#bcd8d6]"
            >
              <Tag className="h-5 w-5 text-[#a8acac]" />
              Alterar etiquetas
            </button>
            <button
              type="button"
              onClick={openRepresentanteModal}
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-sm text-[#4e5659] hover:bg-[#bcd8d6]"
            >
              <UserRound className="h-5 w-5 text-[#a8acac]" />
              Alterar representante
            </button>
            <button
              type="button"
              onClick={handleEnviarLink}
              disabled={isSendingLink}
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-sm text-[#4e5659] hover:bg-[#bcd8d6]"
            >
              <Link2 className="h-5 w-5 text-[#a8acac]" />
              {isSendingLink ? "Enviando..." : "Enviar Link"}
            </button>
            <button
              type="button"
              onClick={openPropostaModal}
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-sm text-[#4e5659] hover:bg-[#bcd8d6]"
            >
              <FileText className="h-5 w-5 text-[#a8acac]" />
              Criar Proposta
            </button>
            <button
              type="button"
              onClick={openContratoModal}
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-sm text-[#4e5659] hover:bg-[#bcd8d6]"
            >
              <FileText className="h-5 w-5 text-[#a8acac]" />
              Cadastrar contrato
            </button>
            <button
              type="button"
              onClick={openVisualizarModal}
              className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-sm text-[#4e5659] hover:bg-[#bcd8d6]"
            >
              <Eye className="h-5 w-5 text-[#a8acac]" />
              Visualizar
            </button>
          </div>
        </div>
      ) : null}

      {isEtiquetaModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={closeEtiquetaModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[650px] rounded-2xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Alterar etiqueta"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-4xl font-semibold text-[#1d4d50]">Alterar etiqueta</h3>
              <button
                type="button"
                onClick={closeEtiquetaModal}
                aria-label="Fechar alterar etiqueta"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="mb-12">
              <div className="relative">
                <select
                  id="etiqueta-select"
                  name="etiqueta-select"
                  value={selectedEtiqueta}
                  onChange={(event) => setSelectedEtiqueta(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border-0 bg-[#c8dfde] px-4 pr-10 text-sm text-[#2a4f51] outline-none"
                >
                  {etiquetaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
              </div>

              {selectedEtiqueta === "61" ? (
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="etiqueta-metragem" className="block text-[30px] font-normal text-[#2f3538]">
                      Metragem
                    </label>
                    <div className="relative">
                      <input
                        id="etiqueta-metragem"
                        name="etiqueta-metragem"
                        type="text"
                        value={etiquetaMetragem}
                        onChange={(event) => setEtiquetaMetragem(event.target.value)}
                        placeholder="5000 m2"
                        className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 pr-10 text-2xl text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                      />
                      <Ruler className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="etiqueta-cep" className="block text-[30px] font-normal text-[#2f3538]">
                      Cep
                    </label>
                    <div className="relative">
                      <input
                        id="etiqueta-cep"
                        name="etiqueta-cep"
                        type="text"
                        value={etiquetaCep}
                        onChange={(event) => handleCepChange(event.target.value)}
                        placeholder="87000-000"
                        className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 pr-10 text-2xl text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                      />
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
                    </div>
                  </div>
                </div>
              ) : null}

              {etiquetaFeedback ? (
                <p className="mt-2 text-sm text-[#7b2323]">{etiquetaFeedback}</p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSaveEtiqueta}
                disabled={isSavingEtiqueta}
                className="h-11 w-full max-w-[270px] rounded-xl border-0 bg-[#0f5050] text-2xl font-semibold text-white hover:bg-[#0c4343]"
              >
                {isSavingEtiqueta ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isRepresentanteModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={closeRepresentanteModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[650px] rounded-2xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Alterar de Representante"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-4xl font-semibold text-[#1d4d50]">Alterar de Representante</h3>
              <button
                type="button"
                onClick={closeRepresentanteModal}
                aria-label="Fechar alterar representante"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="mb-12 rounded-xl bg-[#c8dfde] p-4">
              <p className="mb-2 text-[30px] leading-none text-[#2f3538]">Representante</p>
              <div className="relative">
                <select
                  id="representante-select"
                  name="representante-select"
                  value={selectedRepresentanteId}
                  onChange={(event) => setSelectedRepresentanteId(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border-0 bg-[#f4f6f6] px-4 pr-10 text-sm text-[#2a4f51] outline-none"
                >
                  <option value="">Selecione</option>
                  {representantes.map((representante) => (
                    <option key={representante.id} value={String(representante.id)}>
                      {representante.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
              </div>
              {representanteFeedback ? (
                <p className="mt-2 text-sm text-[#7b2323]">{representanteFeedback}</p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSaveRepresentante}
                disabled={isSavingRepresentante}
                className="h-11 w-full max-w-[270px] rounded-xl border-0 bg-[#0f5050] text-2xl font-semibold text-white hover:bg-[#0c4343]"
              >
                {isSavingRepresentante ? "Alterando..." : "Alterar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isPropostaModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={closePropostaModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[770px] rounded-3xl bg-[#f4f6f6] p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Selecionar Equipamentos"
          >
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-5xl font-semibold text-[#1d4d50]">Selecionar Equipamentos</h3>
              <button
                type="button"
                onClick={closePropostaModal}
                aria-label="Fechar selecionar equipamentos"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-3">
              <label htmlFor="equipamento-select" className="block text-4xl text-[#2f3538]">
                Valor
              </label>
              <div className="relative">
                <select
                  id="equipamento-select"
                  name="equipamento-select"
                  value={selectedEquipamentoId}
                  onChange={(event) => {
                    setSelectedEquipamentoId(event.target.value);
                    setPropostaFeedback(null);
                  }}
                  className="h-14 w-full appearance-none rounded-2xl border-0 bg-[#c8dfde] px-5 pr-12 text-[31px] text-[#2a4f51] outline-none"
                >
                  <option value="">Selecione Equipamento</option>
                  {equipamentos.map((equipamento) => (
                    <option key={equipamento.id} value={String(equipamento.id)}>
                      {equipamento.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-[#355c5f]" />
              </div>
              {propostaFeedback ? (
                <p className="text-sm text-[#7b2323]">{propostaFeedback}</p>
              ) : null}
            </div>

            <div className="mt-14 flex justify-end">
              <Button
                type="button"
                onClick={handleContinuarProposta}
                disabled={isCreatingProposta}
                className="h-14 w-full max-w-[245px] rounded-2xl border border-[#31635f] bg-[#69a79f] text-4xl font-semibold text-white hover:bg-[#5d9890] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingProposta ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isVisualizarModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={closeVisualizarModal}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#1d4d50]/45 bg-[#f4f6f6] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Informacao do Cliente"
          >
            <div className="flex items-center justify-between border-b border-[#d2d7d9] px-5 py-4 sm:px-6">
              <h3 className="text-2xl font-semibold text-[#1d4d50] sm:text-3xl">Informacao do Cliente</h3>
              <button
                type="button"
                onClick={closeVisualizarModal}
                aria-label="Fechar visualizacao"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              {isLoadingVisualizacao ? (
                <div className="py-8 text-center">
                  <LoadingSpinner label="Carregando dados do cliente..." />
                </div>
              ) : visualizacaoFeedback ? (
                <p className="py-8 text-center text-sm text-[#7b2323]">{visualizacaoFeedback}</p>
              ) : visualizacaoData ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#dde2e4] bg-white px-4 py-3">
                    <p className="text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Cliente</p>
                    <p className="mt-1 text-2xl font-semibold text-[#2f3538] break-words">{visualizacaoData.nome}</p>
                    <p className="mt-1 text-sm text-[#2f7437] break-all">{visualizacaoData.email}</p>
                  </div>

                  <div className="rounded-xl border border-[#dde2e4] bg-white p-4">
                    <p className="mb-3 text-lg font-semibold text-[#4d5356]">Informacoes</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Nome</p>
                        <p className="text-base font-semibold text-[#2f3538] break-words">{visualizacaoData.nome}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Telefone</p>
                        <p className="text-base font-semibold text-[#2f3538] break-all">{visualizacaoData.telefone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Email</p>
                        <p className="text-base font-semibold text-[#2f3538] break-all">{visualizacaoData.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium tracking-wide text-[#5a5f62] uppercase">Documento</p>
                        <p className="text-base font-semibold text-[#2f3538] break-all">{visualizacaoData.documento}</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#d8dddf]">
                    <div className="grid grid-cols-2 bg-[#c8dfde] px-4 py-3 text-sm font-semibold text-[#1d4d50]">
                      <p>Etiqueta</p>
                      <p>Data</p>
                    </div>
                    <div className="max-h-56 overflow-y-auto bg-white">
                      {visualizacaoData.etiquetas.length > 0 ? (
                        visualizacaoData.etiquetas.map((etiqueta, index) => (
                          <div
                            key={`${etiqueta.etiqueta}-${etiqueta.data_criacao ?? "sem-data"}-${index}`}
                            className="grid grid-cols-2 border-t border-[#e3e6e7] px-4 py-3 text-sm text-[#2f3538]"
                          >
                            <p>{etiqueta.etiqueta}</p>
                            <p>{formatVisualizacaoDateTime(etiqueta.data_criacao)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="border-t border-[#e3e6e7] px-4 py-3 text-sm text-[#5a5f62]">
                          Nenhuma etiqueta registrada.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-[#466568]">Nenhum dado encontrado.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isContratoModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"
          onClick={closeContratoModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[720px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar Contrato"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-semibold text-[#0f5050]">Cadastrar Contrato</h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={closeContratoModal}
                className="text-slate-600 hover:text-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Telefone Proposta de Valor
                </label>
                <input
                  type="tel"
                  value={contratoFormData.telefoneProposta}
                  onChange={(e) => setContratoFormData({ ...contratoFormData, telefoneProposta: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Telefone para Cobrança
                </label>
                <input
                  type="tel"
                  value={contratoFormData.telefoneCobranca}
                  onChange={(e) => setContratoFormData({ ...contratoFormData, telefoneCobranca: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail de Nota Fiscal e Boleto
                </label>
                <input
                  type="email"
                  value={contratoFormData.emailNotaFiscal}
                  onChange={(e) => setContratoFormData({ ...contratoFormData, emailNotaFiscal: e.target.value })}
                  placeholder="nota fiscal@email.com"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail do Responsável pela Empresa
                </label>
                <input
                  type="email"
                  value={contratoFormData.emailResponsavel}
                  onChange={(e) => setContratoFormData({ ...contratoFormData, emailResponsavel: e.target.value })}
                  placeholder="responsavel@email.com"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Número de Identificação da Proposta de Valor
                </label>
                <input
                  type="text"
                  value={contratoFormData.numeroIdentificacao}
                  onChange={(e) => setContratoFormData({ ...contratoFormData, numeroIdentificacao: e.target.value })}
                  placeholder="Ex: 12345"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Anexar o Contrato Social ou CNH
                </label>
                <input
                  ref={contratoFileInputRef}
                  id="contrato-arquivos-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) {
                      return;
                    }

                    setContratoFormData((prev) => {
                      const seen = new Set(
                        prev.arquivosContrato.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
                      );
                      const merged = [...prev.arquivosContrato];

                      for (const file of files) {
                        const key = `${file.name}-${file.size}-${file.lastModified}`;
                        if (!seen.has(key)) {
                          seen.add(key);
                          merged.push(file);
                        }
                      }

                      return {
                        ...prev,
                        arquivosContrato: merged,
                      };
                    });

                    e.currentTarget.value = "";
                  }}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 rounded-lg bg-[#e6f3ef] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => contratoFileInputRef.current?.click()}
                    className="rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c4343]"
                  >
                    Escolher arquivos
                  </button>
                  <span className="text-sm text-slate-700">
                    {contratoFormData.arquivosContrato.length > 0
                      ? `${contratoFormData.arquivosContrato.length} arquivo(s) selecionado(s)`
                      : "Nenhum arquivo selecionado"}
                  </span>
                </div>
                {contratoFormData.arquivosContrato.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-[#2f7437]">
                      {contratoFormData.arquivosContrato.length} arquivo(s) selecionado(s):
                    </p>
                    <ul className="max-h-32 overflow-y-auto text-sm text-slate-600">
                      {contratoFormData.arquivosContrato.map((file) => (
                        <li
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="truncate">
                            • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveContratoArquivo(file)}
                            className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-[#7b2323] hover:bg-[#f4dddd]"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {contratoFeedback ? (
              <p className="mt-3 text-sm text-[#7b2323]">{contratoFeedback}</p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleCadastrarContrato}
                disabled={isSubmittingContrato}
              >
                {isSubmittingContrato ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
