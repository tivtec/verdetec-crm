"use client";

import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Check,
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

const EMPTY_FORM: UsuarioFormValues = {
  nome: "",
  email: "",
  telefone: "",
  linkMeet: "",
  identificadorUmbler: "",
  senha: "",
  tipoAcesso: "Time Negocios",
  ativo: true,
};

export function UsuariosControlShell({ initialRows }: UsuariosControlShellProps) {
  const [rows, setRows] = useState<UsuarioControleRow[]>(initialRows);
  const [page, setPage] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<UsuarioFormValues>(EMPTY_FORM);
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
    if (!menuAnchor && !isCadastroModalOpen) {
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

      setMenuAnchor(null);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCadastroModalOpen, menuAnchor]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const currentRows = rows.slice(start, start + PAGE_SIZE);

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

  const openCreateModal = () => {
    setMenuAnchor(null);
    setEditingRowId(null);
    setFormValues(EMPTY_FORM);
    setIsCadastroModalOpen(true);
  };

  const openEditModal = (row: UsuarioControleRow) => {
    setMenuAnchor(null);
    setEditingRowId(row.id);
    setFormValues({
      nome: row.nome.includes("-") ? row.nome.split("-").slice(1).join("-").trim() : row.nome,
      email: row.email ?? "",
      telefone: row.telefone ?? "",
      linkMeet: row.meet ?? "",
      identificadorUmbler: "",
      senha: "",
      tipoAcesso: row.tipoAcesso || "Time Negocios",
      ativo: row.ativo,
    });
    setIsCadastroModalOpen(true);
  };

  const closeCadastroModal = () => {
    setIsCadastroModalOpen(false);
    setEditingRowId(null);
    setFormValues(EMPTY_FORM);
  };

  const handlePlaceholderAction = (message: string) => {
    setMenuAnchor(null);
    setFeedback(message);
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

  const handleSubmitUsuario = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nome = formValues.nome.trim();
    if (!nome) {
      setFeedback("Informe o nome do usuario.");
      return;
    }

    if (editingRowId) {
      setRows((current) =>
        current.map((row) =>
          row.id === editingRowId
            ? {
                ...row,
                nome: `${row.id}-${nome}`,
                telefone: formValues.telefone.trim() || null,
                tipoAcesso: formValues.tipoAcesso.trim() || "-",
                email: formValues.email.trim() || null,
                meet: formValues.linkMeet.trim() || null,
                ativo: formValues.ativo,
              }
            : row,
        ),
      );
      setFeedback("Edicao local concluida. A integracao sera conectada na proxima etapa.");
      closeCadastroModal();
      return;
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
      telefone: formValues.telefone.trim() || null,
      tipoAcesso: formValues.tipoAcesso.trim() || "-",
      email: formValues.email.trim() || null,
      meet: formValues.linkMeet.trim() || null,
      ativo: formValues.ativo,
    };

    setRows((current) => [created, ...current]);
    setPage(1);
    setFeedback("Cadastro local concluido. A integracao sera conectada na proxima etapa.");
    closeCadastroModal();
  };

  return (
    <div className="space-y-4">
      {feedback ? (
        <div className="fixed top-6 right-6 z-[90] rounded-lg bg-[#0f5050] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-[#30343a] md:text-4xl">Usuarios</h1>
        <Button
          type="button"
          onClick={openCreateModal}
          className="h-11 min-w-[200px] rounded-xl border-0 bg-[#0f5050] px-5 text-base font-semibold text-white hover:bg-[#0c4343]"
        >
          Cadastrar Usuarios
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
                        aria-label={`Abrir menu do usuario ${row.nome}`}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-[#eceeef]">
                  <td colSpan={7} className="rounded-xl px-4 py-10 text-center text-sm text-[#466568]">
                    Nenhum usuario encontrado.
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

          <p className="text-base text-[#444a4f]">Pagina {safePage}</p>

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
                onClick={() =>
                  handlePlaceholderAction("Acao de desativar usuario sera conectada na proxima etapa.")
                }
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <UserMinus className="h-5 w-5 text-[#a8acac]" />
                Desativar Usuario
              </button>
              <button
                type="button"
                onClick={() => handlePlaceholderAction("Acao de alterar L100 sera conectada na proxima etapa.")}
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
                Editar Usuario
              </button>
              <button
                type="button"
                onClick={() => handlePlaceholderAction("Acao de desativar leads sera conectada na proxima etapa.")}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <UserX className="h-5 w-5 text-[#a8acac]" />
                Desativar Leads
              </button>
              <button
                type="button"
                onClick={() => handlePlaceholderAction("Acao de redefinir senha sera conectada na proxima etapa.")}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#c8dfde] px-4 text-left text-base text-[#4e5659] hover:bg-[#bcd8d6]"
              >
                <KeyRound className="h-5 w-5 text-[#a8acac]" />
                Redefinir Senha
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
            aria-label={editingRowId ? "Editar usuario" : "Cadastrar usuario"}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-3xl font-semibold text-[#1d4d50] sm:text-4xl">
                {editingRowId ? "Editar Usuario" : "Cadastrar Usuarios"}
              </h3>
              <button
                type="button"
                onClick={closeCadastroModal}
                aria-label="Fechar cadastro de usuario"
                className="rounded-md p-1 text-[#5e6567] hover:bg-[#e3e7e7]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <form onSubmit={handleSubmitUsuario} className="space-y-3">
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
                  name="usuario-email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Digite o email"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

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
                <span className="text-xl leading-none text-[#2f3538]">Indentificador Umbler</span>
                <input
                  id="usuario-identificador-umbler"
                  name="usuario-identificador-umbler"
                  type="text"
                  value={formValues.identificadorUmbler}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, identificadorUmbler: event.target.value }))
                  }
                  placeholder="Indentificador"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xl leading-none text-[#2f3538]">Senha</span>
                <input
                  id="usuario-senha"
                  name="usuario-senha"
                  type="password"
                  value={formValues.senha}
                  onChange={(event) => setFormValues((current) => ({ ...current, senha: event.target.value }))}
                  placeholder="*******"
                  className="h-11 w-full rounded-xl border-0 bg-[#c8dfde] px-4 text-base text-[#2a4f51] outline-none placeholder:text-[#2a4f51]"
                />
              </label>

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  className="h-11 min-w-[180px] rounded-xl border-0 bg-[#0f5050] px-8 text-base font-semibold text-white hover:bg-[#0c4343]"
                >
                  {editingRowId ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
