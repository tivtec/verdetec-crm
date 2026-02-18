"use client";

import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MoreVertical,
  Pencil,
  UserMinus,
  UserX,
  X,
} from "lucide-react";

import type { UsuarioControleRow, UsuarioFormValues } from "@/components/usuarios/types";
import { Button } from "@/components/ui/button";

type UsuariosControlShellProps = {
  initialRows: UsuarioControleRow[];
};

type MenuAnchor = {
  rowId: string;
  top: number;
  left: number;
};

const PAGE_SIZE = 10;
const MENU_WIDTH = 340;
const MENU_HEIGHT = 320;
const MENU_GAP = 8;
const MENU_MARGIN = 12;
const TIPO_ACESSO_OPTIONS = ["Time Negócios", "Prime", "CRV", "Gestor"] as const;
const USUARIO_EDIT_OPTIONS = [
  "SuperAdm",
  "Gestor",
  "Representante",
  "Prime",
  "CRV",
  "Time Negócios",
  "Representante + Prime",
] as const;

function normalizeOption(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveOption(
  value: string | null | undefined,
  options: readonly string[],
  fallback: string,
) {
  const normalized = normalizeOption(value ?? "");
  const found = options.find((option) => normalizeOption(option) === normalized);
  return found ?? fallback;
}

const EMPTY_FORM: UsuarioFormValues = {
  nome: "",
  email: "",
  telefone: "",
  linkMeet: "",
  identificadorUmbler: "",
  senha: "",
  tipoAcesso: "Time Negócios",
  permissao: "Representante",
  tipoAcesso2: "Time Negócios",
  ativo: true,
};

export function UsuariosControlShell({ initialRows }: UsuariosControlShellProps) {
  const [rows, setRows] = useState<UsuarioControleRow[]>(initialRows);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] = useState(false);
  const [statusTargetRowId, setStatusTargetRowId] = useState<string | null>(null);
  const [isSubmittingStatusChange, setIsSubmittingStatusChange] = useState(false);
  const [isL100ModalOpen, setIsL100ModalOpen] = useState(false);
  const [l100TargetRowId, setL100TargetRowId] = useState<string | null>(null);
  const [l100InputValue, setL100InputValue] = useState("");
  const [isSubmittingL100, setIsSubmittingL100] = useState(false);
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<UsuarioFormValues>(EMPTY_FORM);
  const [isSubmittingCadastro, setIsSubmittingCadastro] = useState(false);
  const [isSubmittingDispoLeads, setIsSubmittingDispoLeads] = useState(false);
  const [isDispoLeadsResultModalOpen, setIsDispoLeadsResultModalOpen] = useState(false);
  const [dispoLeadsResultMessage, setDispoLeadsResultMessage] = useState("");
  const [isResetSenhaNoticeModalOpen, setIsResetSenhaNoticeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (
      !menuAnchor &&
      !isCadastroModalOpen &&
      !isStatusConfirmModalOpen &&
      !isL100ModalOpen &&
      !isDispoLeadsResultModalOpen &&
      !isResetSenhaNoticeModalOpen
    ) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isCadastroModalOpen) {
        setIsCadastroModalOpen(false);
        setEditingRowId(null);
        setFormValues(EMPTY_FORM);
        return;
      }

      if (isStatusConfirmModalOpen) {
        setIsStatusConfirmModalOpen(false);
        setStatusTargetRowId(null);
        setIsSubmittingStatusChange(false);
        return;
      }

      if (isL100ModalOpen) {
        setIsL100ModalOpen(false);
        setL100TargetRowId(null);
        setL100InputValue("");
        setIsSubmittingL100(false);
        return;
      }

      if (isDispoLeadsResultModalOpen) {
        setIsDispoLeadsResultModalOpen(false);
        setDispoLeadsResultMessage("");
        return;
      }

      if (isResetSenhaNoticeModalOpen) {
        setIsResetSenhaNoticeModalOpen(false);
        return;
      }

      setMenuAnchor(null);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    isCadastroModalOpen,
    isL100ModalOpen,
    isStatusConfirmModalOpen,
    isDispoLeadsResultModalOpen,
    isResetSenhaNoticeModalOpen,
    menuAnchor,
  ]);

  const visibleRows = showInactiveUsers ? rows : rows.filter((row) => row.ativo);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const currentRows = visibleRows.slice(start, start + PAGE_SIZE);

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

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(clamped);
  };

  const menuTargetRow = menuAnchor ? rows.find((row) => row.id === menuAnchor.rowId) ?? null : null;
  const menuTargetDispoLeads = menuTargetRow?.dispoLeads ?? true;
  const statusTargetRow = statusTargetRowId
    ? rows.find((row) => row.id === statusTargetRowId) ?? null
    : null;
  const isStatusTargetInactive = statusTargetRow ? !statusTargetRow.ativo : false;
  const isActivateAction = isStatusTargetInactive;
  const statusTitle = isActivateAction ? "Ativar usuário" : "Desativar usuário";
  const statusQuestion = isActivateAction
    ? "Deseja ativar este usuário novamente?"
    : "Confirma a desativação deste usuário?";
  const statusDetail = isActivateAction
    ? "O acesso ao sistema será liberado imediatamente."
    : "O acesso será bloqueado, mas pode ser reativado depois.";
  const statusPrimaryLabel = isSubmittingStatusChange
    ? "Processando..."
    : isActivateAction
      ? "Ativar"
      : "Desativar";

  const openStatusConfirmModal = () => {
    if (!menuAnchor) {
      return;
    }

    setStatusTargetRowId(menuAnchor.rowId);
    setIsSubmittingStatusChange(false);
    setIsStatusConfirmModalOpen(true);
    setMenuAnchor(null);
  };

  const openL100Modal = async () => {
    if (!menuAnchor) {
      return;
    }

    const rowId = menuAnchor.rowId;
    const targetRow = rows.find((row) => row.id === rowId) ?? null;
    setL100TargetRowId(rowId);
    setL100InputValue(typeof targetRow?.l100 === "number" ? String(targetRow.l100) : "");
    setIsSubmittingL100(false);
    setIsL100ModalOpen(true);
    setMenuAnchor(null);

    const parsedUserId = Number(rowId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      return;
    }

    try {
      const response = await fetch(
        `/api/usuarios/atualizar-l100?id_usuario=${encodeURIComponent(String(Math.trunc(parsedUserId)))}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; valor?: number | null }
        | null;

      if (!response.ok || !payload?.ok || typeof payload.valor !== "number") {
        return;
      }

      setL100InputValue(String(payload.valor));
      setRows((current) =>
        current.map((row) =>
          row.id === rowId
            ? {
                ...row,
                l100: payload.valor,
              }
            : row,
        ),
      );
    } catch {
      // Mantem valor atual no popup quando a consulta falha.
    }
  };

  const closeStatusConfirmModal = () => {
    setIsStatusConfirmModalOpen(false);
    setStatusTargetRowId(null);
    setIsSubmittingStatusChange(false);
  };

  const closeL100Modal = () => {
    setIsL100ModalOpen(false);
    setL100TargetRowId(null);
    setL100InputValue("");
    setIsSubmittingL100(false);
  };

  const closeDispoLeadsResultModal = () => {
    setIsDispoLeadsResultModalOpen(false);
    setDispoLeadsResultMessage("");
  };

  const openResetSenhaNoticeModal = () => {
    setMenuAnchor(null);
    setIsResetSenhaNoticeModalOpen(true);
  };

  const closeResetSenhaNoticeModal = () => {
    setIsResetSenhaNoticeModalOpen(false);
  };

  const handleToggleDispoLeads = async () => {
    if (!menuAnchor) {
      return;
    }

    const targetRow = rows.find((row) => row.id === menuAnchor.rowId) ?? null;
    setMenuAnchor(null);
    if (!targetRow) {
      return;
    }

    const parsedId = Number(targetRow.id);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      setFeedback("Não foi possível resolver o id do usuário.");
      return;
    }

    const nextDispoLeads = !(targetRow.dispoLeads ?? true);
    setIsSubmittingDispoLeads(true);

    try {
      const response = await fetch("/api/usuarios/atualizar-dispo-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: Math.trunc(parsedId),
          dispo_leads: nextDispoLeads,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; id?: number; dispo_leads?: boolean }
        | null;

      if (!response.ok || !payload?.ok || typeof payload.dispo_leads !== "boolean") {
        setFeedback(payload?.error ?? "Falha ao atualizar disponibilidade de leads.");
        return;
      }

      const persisted = payload.dispo_leads;
      setRows((current) =>
        current.map((row) =>
          row.id === targetRow.id
            ? {
                ...row,
                dispoLeads: persisted,
              }
            : row,
        ),
      );

      setDispoLeadsResultMessage(
        persisted ? "Reativado para receber Leads" : "Desativado para receber Leads",
      );
      setIsDispoLeadsResultModalOpen(true);
    } catch {
      setFeedback("Falha ao atualizar disponibilidade de leads.");
    } finally {
      setIsSubmittingDispoLeads(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTargetRow) {
      closeStatusConfirmModal();
      return;
    }

    setIsSubmittingStatusChange(true);

    try {
      const shouldActivate = !statusTargetRow.ativo;
      const parsedId = Number(statusTargetRow.id);
      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        setFeedback("Não foi possível resolver o id do usuário.");
        setIsSubmittingStatusChange(false);
        return;
      }

      const response = await fetch("/api/usuarios/atualizar-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: Math.trunc(parsedId),
          usuario_ativo: shouldActivate,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; id?: number; usuario_ativo?: boolean }
        | null;

      if (!response.ok || !payload?.ok || typeof payload.usuario_ativo !== "boolean") {
        setFeedback(payload?.error ?? "Falha ao atualizar status do usuário.");
        setIsSubmittingStatusChange(false);
        return;
      }

      const nextAtivo = payload.usuario_ativo;

      setRows((current) =>
        current.map((row) =>
          row.id === statusTargetRow.id
            ? {
                ...row,
                ativo: nextAtivo,
              }
            : row,
        ),
      );

      setFeedback(nextAtivo ? "Usuário reativado com sucesso." : "Usuário desativado com sucesso.");
      closeStatusConfirmModal();
    } catch {
      setFeedback("Falha ao atualizar status do usuário.");
      setIsSubmittingStatusChange(false);
    }
  };

  const handleL100InputChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "");
    setL100InputValue(sanitized);
  };

  const handleSaveL100 = async () => {
    if (!l100TargetRowId) {
      closeL100Modal();
      return;
    }

    if (!l100InputValue.trim()) {
      setFeedback("Informe um valor inteiro para L100.");
      return;
    }

    const parsedValue = Number(l100InputValue);
    if (!Number.isInteger(parsedValue)) {
      setFeedback("L100 deve ser um numero inteiro.");
      return;
    }

    setIsSubmittingL100(true);

    try {
      const parsedUserId = Number(l100TargetRowId);
      if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
        setFeedback("Não foi possível resolver o id do usuário.");
        setIsSubmittingL100(false);
        return;
      }

      const response = await fetch("/api/usuarios/atualizar-l100", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: Math.trunc(parsedUserId),
          valor: parsedValue,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; id?: number | null; usuario_id?: number | null; valor?: number | null }
        | null;

      if (!response.ok || !payload?.ok || typeof payload.valor !== "number") {
        setFeedback(payload?.error ?? "Falha ao atualizar L100.");
        setIsSubmittingL100(false);
        return;
      }

      const persistedValue = payload.valor;
      setRows((current) =>
        current.map((row) =>
          row.id === l100TargetRowId
            ? {
                ...row,
                l100: persistedValue,
              }
            : row,
        ),
      );

      setFeedback("L100 atualizado com sucesso.");
      closeL100Modal();
    } catch {
      setFeedback("Falha ao atualizar L100.");
      setIsSubmittingL100(false);
    }
  };

  const openCreateModal = () => {
    setMenuAnchor(null);
    setEditingRowId(null);
    setFormValues({
      ...EMPTY_FORM,
      email: "",
      senha: "",
    });
    setIsCadastroModalOpen(true);
  };

  const openEditModal = (row: UsuarioControleRow) => {
    setMenuAnchor(null);
    setEditingRowId(row.id);
    const normalizedTipoAcesso2 = resolveOption(
      row.tipoAcesso2 ?? row.tipoAcesso,
      USUARIO_EDIT_OPTIONS,
      "Time Negócios",
    );
    setFormValues({
      nome: row.nome.includes("-") ? row.nome.split("-").slice(1).join("-").trim() : row.nome,
      email: row.email ?? "",
      telefone: row.telefone ?? "",
      linkMeet: row.meet ?? "",
      identificadorUmbler: "",
      senha: "",
      tipoAcesso: normalizedTipoAcesso2,
      permissao: "Representante",
      tipoAcesso2: normalizedTipoAcesso2,
      ativo: row.ativo,
    });
    setIsCadastroModalOpen(true);
  };

  const closeCadastroModal = () => {
    setIsCadastroModalOpen(false);
    setEditingRowId(null);
    setIsSubmittingCadastro(false);
    setFormValues(EMPTY_FORM);
  };

  const handleEditFromMenu = () => {
    if (!menuAnchor) {
      return;
    }

    const row = rows.find((item) => item.id === menuAnchor.rowId);
    if (!row) {
      setMenuAnchor(null);
      return;
    }

    openEditModal(row);
  };

  const handleSubmitUsuario = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nome = formValues.nome.trim();
    if (!nome) {
      setFeedback("Informe o nome do usuário.");
      return;
    }

    const email = formValues.email.trim();
    const senha = formValues.senha.trim();
    const telefone = formValues.telefone.trim();
    const linkMeet = formValues.linkMeet.trim();
    const identificadorUmbler = formValues.identificadorUmbler.trim();
    const tipoAcesso = formValues.tipoAcesso.trim();
    const permissao = formValues.permissao.trim();
    const tipoAcesso2 = formValues.tipoAcesso2.trim();

    if (!email) {
      setFeedback("Informe o email.");
      return;
    }

    if (!senha && !editingRowId) {
      setFeedback("Informe a senha.");
      return;
    }

    if (!tipoAcesso && !editingRowId) {
      setFeedback("Selecione o tipo de acesso.");
      return;
    }

    if (editingRowId && !tipoAcesso2) {
      setFeedback("Selecione o Tipo de Acesso 2.");
      return;
    }

    if (editingRowId) {
      setRows((current) =>
        current.map((row) =>
          row.id === editingRowId
            ? {
                ...row,
                nome: `${row.id}-${nome}`,
                telefone: telefone || null,
                tipoAcesso: tipoAcesso2 || "-",
                tipoAcesso2: tipoAcesso2 || null,
                email: email || null,
                meet: linkMeet || null,
                ativo: formValues.ativo,
              }
            : row,
        ),
      );
      setFeedback(
        `Usuário editado com sucesso. Permissão: ${permissao || "Representante"} | Tipo 2: ${tipoAcesso2}.`,
      );
      closeCadastroModal();
      return;
    }

    setIsSubmittingCadastro(true);

    try {
      const response = await fetch("/api/usuarios/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
          nome,
          fone: telefone,
          telefone,
          link_meet: linkMeet,
          id_umbler: identificadorUmbler,
          identificador_umbler: identificadorUmbler,
          permissao: "gestor",
          tipo_acesso: tipoAcesso,
          setor: "",
          vertical: "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setFeedback(payload?.error ?? "Falha ao cadastrar usuário.");
        return;
      }
    } catch {
      setFeedback("Erro ao chamar webhook de cadastro.");
      return;
    } finally {
      setIsSubmittingCadastro(false);
    }

    const nextId =
      rows.reduce((max, row) => {
        const parsed = Number(row.id);
        if (!Number.isFinite(parsed)) {
          return max;
        }
        return Math.max(max, Math.trunc(parsed));
      }, 0) + 1;

    const created: UsuarioControleRow = {
      id: String(nextId),
      nome: `${nextId}-${nome}`,
      telefone: telefone || null,
      tipoAcesso: tipoAcesso || "-",
      tipoAcesso2: tipoAcesso || null,
      email: email || null,
      meet: linkMeet || null,
      dispoLeads: true,
      ativo: formValues.ativo,
    };

    setRows((current) => [created, ...current]);
    setPage(1);
    setFeedback("Usuário cadastrado com sucesso.");
    closeCadastroModal();
  };

  return (
    <div className="space-y-4">
      {feedback ? (
        <div className="fixed top-6 right-6 z-[90] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-[#30343a] md:text-4xl">Usuários</h1>
          <label className="inline-flex items-center gap-2 text-sm text-[#2f3538]">
            <input
              type="checkbox"
              checked={showInactiveUsers}
              onChange={(event) => {
                setShowInactiveUsers(event.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-[#0f5050]"
            />
            <span>Mostrar usuários inativos</span>
          </label>
        </div>
        <Button
          type="button"
          onClick={openCreateModal}
          className="h-11 min-w-[200px] rounded-xl border-0 bg-[#0f5050] px-5 text-base font-semibold text-white hover:bg-[#0c4343]"
        >
          Cadastrar Usuários
        </Button>
      </div>

      <div className="space-y-3">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="bg-[#c8dfde] text-[#1d4d50]">
                <th className="rounded-l-xl px-4 py-3 text-left text-base font-semibold">Ativo</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Nome</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Telefone</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Tipo de acesso</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-base font-semibold">Meet</th>
                <th className="rounded-r-xl px-4 py-3 text-right text-base font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((row) => (
                  <tr key={row.id} className="bg-[#eceeef] text-[#3a3f43]">
                    <td className="rounded-l-xl px-4 py-3">
                      {row.ativo ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6ca79d] text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-block h-6 w-6 rounded-full border-2 border-[#b2b8bc]" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.nome}</td>
                    <td className="px-4 py-3 text-sm">{row.telefone ?? "-"}</td>
                    <td className="px-4 py-3 text-sm">{row.tipoAcesso || "-"}</td>
                    <td className="px-4 py-3 text-sm">{row.email ?? "-"}</td>
                    <td className="max-w-[280px] px-4 py-3 text-sm break-all">{row.meet ?? "-"}</td>
                    <td className="rounded-r-xl px-4 py-3 text-right">
                      <button
                        type="button"
                        data-usuario-menu-trigger="true"
                        onClick={(event) => toggleMenu(row.id, event)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#4a4f53] hover:bg-[#dfe3e5]"
                        aria-label={`Abrir menu do usuário ${row.nome}`}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-[#eceeef]">
                  <td colSpan={7} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                    Nenhum usuário encontrado.
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
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="h-11 min-w-[150px] rounded-xl border-0 bg-[#8cc8c3] text-base font-semibold text-[#184f52] hover:bg-[#80b8b3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <p className="text-base text-[#444a4f]">Página {safePage}</p>

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

      {menuAnchor ? (
        <div className="fixed inset-0 z-[70] bg-black/35" onClick={() => setMenuAnchor(null)} role="presentation">
          <div
            className="fixed w-[340px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#f4f6f6] p-4 shadow-2xl"
            style={{ top: menuAnchor.top, left: menuAnchor.left }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="false"
            aria-label="Menu de Opções"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-[#1d4d50]">Menu de Opções</h3>
              <button
                type="button"
                onClick={() => setMenuAnchor(null)}
                aria-label="Fechar menu de opções"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={openStatusConfirmModal}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserMinus className="h-5 w-5 text-[#a8acac]" />
                {menuTargetRow?.ativo === false ? "Reativar Usuário" : "Desativar Usuário"}
              </button>
              <button
                type="button"
                onClick={openL100Modal}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <Pencil className="h-5 w-5 text-[#a8acac]" />
                Alterar L100
              </button>
              <button
                type="button"
                onClick={handleEditFromMenu}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <Pencil className="h-5 w-5 text-[#a8acac]" />
                Editar Usuário
              </button>
              <button
                type="button"
                onClick={handleToggleDispoLeads}
                disabled={isSubmittingDispoLeads}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <UserX className="h-5 w-5 text-[#a8acac]" />
                {isSubmittingDispoLeads
                  ? "Atualizando..."
                  : menuTargetDispoLeads
                    ? "Desativar Leads"
                    : "Ativar Leads"}
              </button>
              <button
                type="button"
                onClick={openResetSenhaNoticeModal}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <KeyRound className="h-5 w-5 text-[#a8acac]" />
                Redefinir Senha
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isStatusConfirmModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          onClick={closeStatusConfirmModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[560px] rounded-3xl bg-[#f4f6f6] p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={isStatusTargetInactive ? "Ativar usuário" : "Desativar usuário"}
          >
            <div className="mb-3 flex justify-center">
              {isActivateAction ? (
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0f5050] text-white">
                  <Check className="h-8 w-8" />
                </div>
              ) : (
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ffd7e4] text-[#ff2f68]">
                  <AlertTriangle className="h-9 w-9" strokeWidth={2.3} />
                </div>
              )}
            </div>

            <h3 className="text-center text-3xl font-semibold text-[#4b4f55] sm:text-4xl">{statusTitle}</h3>

            <p className="mt-4 text-center text-lg font-semibold text-[#4b4f55] sm:text-xl">{statusQuestion}</p>
            <p className="mt-1 text-center text-base font-medium text-[#4b4f55] sm:text-lg">{statusDetail}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeStatusConfirmModal}
                className="h-11 w-full rounded-xl border-0 bg-[#b8cecd] text-base font-semibold text-[#1d4d50] hover:bg-[#a8c2c1]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isSubmittingStatusChange}
                className={
                  isActivateAction
                    ? "h-11 w-full rounded-xl border-0 bg-[#0f5050] text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-70"
                    : "h-11 w-full rounded-xl border-0 bg-[#ff2f68] text-base font-semibold text-white hover:bg-[#e22a5d] disabled:cursor-not-allowed disabled:opacity-70"
                }
              >
                {statusPrimaryLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isL100ModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          onClick={closeL100Modal}
          role="presentation"
        >
          <div
            className="w-full max-w-[500px] rounded-2xl bg-[#f4f6f6] p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Editar L100"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-[#1d4d50] sm:text-3xl">Editar L100</h3>
              <button
                type="button"
                onClick={closeL100Modal}
                aria-label="Fechar editar L100"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div>
              <label htmlFor="usuario-l100" className="mb-2 block text-base font-medium leading-none text-[#2f3538]">
                Valor
              </label>
              <input
                id="usuario-l100"
                name="usuario-l100"
                type="text"
                inputMode="numeric"
                value={l100InputValue}
                onChange={(event) => handleL100InputChange(event.target.value)}
                placeholder="0"
                className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-xl font-medium text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={handleSaveL100}
                disabled={isSubmittingL100}
                className="h-11 min-w-[180px] rounded-xl border-0 bg-[#0f5050] px-6 text-base font-semibold text-white hover:bg-[#0c4343] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingL100 ? "Salvando..." : "Salvar Valor"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDispoLeadsResultModalOpen ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 p-4"
          onClick={closeDispoLeadsResultModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[340px] rounded-2xl bg-[#f4f0fa] px-6 py-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Alteração de leads"
          >
            <h3 className="text-4xl leading-none font-medium text-[#2d2d2f]">Alterado!</h3>
            <p className="mt-5 text-2xl leading-snug text-[#2f2f33]">{dispoLeadsResultMessage}</p>
            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={closeDispoLeadsResultModal}
                className="text-2xl font-medium text-[#6e5bb0] hover:text-[#604e9f]"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isResetSenhaNoticeModalOpen ? (
        <div
          className="fixed inset-0 z-[86] flex items-center justify-center bg-black/45 p-4"
          onClick={closeResetSenhaNoticeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-[440px] rounded-2xl bg-[#f4f0fa] px-6 py-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Aviso"
          >
            <h3 className="text-4xl leading-none font-medium text-[#2d2d2f]">Aviso</h3>
            <p className="mt-5 text-xl leading-snug text-[#2f2f33]">
              Esta função está sendo construída e estará disponível em breve!
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeResetSenhaNoticeModal}
                className="text-2xl font-medium text-[#6e5bb0] hover:text-[#604e9f]"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCadastroModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4"
          onClick={closeCadastroModal}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-[#f4f6f6] p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editingRowId ? "Editar usuários" : "Cadastrar usuário"}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-3xl font-semibold text-[#1d4d50] sm:text-4xl">
                {editingRowId ? "Editar Usuários" : "Cadastrar Usuários"}
              </h3>
              <button
                type="button"
                onClick={closeCadastroModal}
                aria-label="Fechar cadastro de usuário"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <form onSubmit={handleSubmitUsuario} className="space-y-3" autoComplete="off">
              <label className="block space-y-1">
                <span className="text-xl leading-none text-[#2f3538]">Nome</span>
                <input
                  id="usuario-nome"
                  name="usuario-nome"
                  type="text"
                  value={formValues.nome}
                  onChange={(event) => setFormValues((current) => ({ ...current, nome: event.target.value }))}
                  placeholder="Digite o nome"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xl leading-none text-[#2f3538]">Telefone</span>
                <input
                  id="usuario-telefone"
                  name="usuario-telefone"
                  type="text"
                  value={formValues.telefone}
                  onChange={(event) => setFormValues((current) => ({ ...current, telefone: event.target.value }))}
                  placeholder="Digite o telefone"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xl leading-none text-[#2f3538]">Email</span>
                <input
                  id="usuario-email"
                  name="email_novo_usuario"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Digite o email"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              {!editingRowId ? (
                <label className="block space-y-1">
                  <span className="text-xl leading-none text-[#2f3538]">Tipo de acesso</span>
                  <div className="relative">
                    <select
                      id="usuario-tipo-acesso"
                      name="usuario-tipo-acesso"
                      value={formValues.tipoAcesso}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, tipoAcesso: event.target.value }))
                      }
                      className="h-11 w-full appearance-none rounded-xl border-0 bg-[#c8dfde] px-4 pr-10 text-base text-[#2a4f51] outline-none"
                    >
                      {TIPO_ACESSO_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#355c5f]" />
                  </div>
                </label>
              ) : null}

              <label className="block space-y-1">
                <span className="text-xl leading-none text-[#2f3538]">Link do Meet</span>
                <input
                  id="usuario-link-meet"
                  name="usuario-link-meet"
                  type="url"
                  value={formValues.linkMeet}
                  onChange={(event) => setFormValues((current) => ({ ...current, linkMeet: event.target.value }))}
                  placeholder="Link do Meet"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xl leading-none text-[#2f3538]">Identificador Umbler</span>
                <input
                  id="usuario-identificador-umbler"
                  name="usuario-identificador-umbler"
                  type="text"
                  value={formValues.identificadorUmbler}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, identificadorUmbler: event.target.value }))
                  }
                  placeholder="Identificador"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              {editingRowId ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-[#c8dfde] p-2.5">
                    <label htmlFor="usuario-permissao" className="mb-1 block px-1 text-xl text-[#2f3538]">
                      Permissão
                    </label>
                    <div className="relative">
                      <select
                        id="usuario-permissao"
                        name="usuario-permissao"
                        value={formValues.permissao}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, permissao: event.target.value }))
                        }
                        className="h-11 w-full appearance-none rounded-xl border-0 bg-[#f4f6f6] px-4 pr-10 text-base text-[#3a3f43] outline-none"
                      >
                        {USUARIO_EDIT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#4a4f53]" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#c8dfde] p-2.5">
                    <label htmlFor="usuario-tipo-acesso-2" className="mb-1 block px-1 text-xl text-[#2f3538]">
                      Tipo de Acesso 2
                    </label>
                    <div className="relative">
                      <select
                        id="usuario-tipo-acesso-2"
                        name="usuario-tipo-acesso-2"
                        value={formValues.tipoAcesso2}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, tipoAcesso2: event.target.value }))
                        }
                        className="h-11 w-full appearance-none rounded-xl border-0 bg-[#f4f6f6] px-4 pr-10 text-base text-[#3a3f43] outline-none"
                      >
                        {USUARIO_EDIT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#4a4f53]" />
                    </div>
                  </div>
                </div>
              ) : (
                <label className="block space-y-1">
                  <span className="text-xl leading-none text-[#2f3538]">Senha</span>
                  <input
                    id="usuario-senha"
                    name="senha_novo_usuario"
                    type="password"
                    value={formValues.senha}
                    onChange={(event) => setFormValues((current) => ({ ...current, senha: event.target.value }))}
                    placeholder="*******"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                  />
                </label>
              )}

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingCadastro}
                  className="h-11 min-w-[180px] rounded-xl border-0 bg-[#0f5050] px-8 text-base font-semibold text-white hover:bg-[#0c4343]"
                >
                  {isSubmittingCadastro ? "Cadastrando..." : editingRowId ? "Editar Usuário" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


