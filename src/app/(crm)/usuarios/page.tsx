import { UsuariosControlShell } from "@/components/usuarios/usuarios-control-shell";
import type { UsuarioControleRow } from "@/components/usuarios/types";
import { PageContainer } from "@/components/layout/page-container";
import { getUsuariosControleRows } from "@/services/crm/api";

const fallbackRows: UsuarioControleRow[] = [
  {
    id: "120",
    nome: "120-Felipe P.",
    telefone: "47992257826",
    tipoAcesso: "Time Negocios",
    email: "felipe.po@verdetec.com",
    meet: "https://meet.google.com/uqc-vzjh-uea",
    ativo: true,
  },
  {
    id: "66",
    nome: "66-Edson T.",
    telefone: "4830368695",
    tipoAcesso: "Time Negocios",
    email: "vendas16@verdetec.com",
    meet: "http://meet.google.com/uaq-vfqo-oyo",
    ativo: true,
  },
  {
    id: "63",
    nome: "63-Lazaro S.",
    telefone: "4830368696",
    tipoAcesso: "Time Negocios",
    email: "vendas18@verdetec.com",
    meet: "http://meet.google.com/gig-ukpe-kmw",
    ativo: true,
  },
  {
    id: "98",
    nome: "98-Evanderson U.",
    telefone: "47992348350",
    tipoAcesso: "Time Negocios",
    email: "evanderson.ur@verdetec.com",
    meet: "https://meet.google.com/stq-fisv-yix",
    ativo: true,
  },
  {
    id: "62",
    nome: "62-Jaqueline O.",
    telefone: "4830272661",
    tipoAcesso: "Time Negocios",
    email: "vendas19@verdetec.com",
    meet: "http://meet.google.com/afs-zdnc-jmi",
    ativo: true,
  },
];

export default async function UsuariosPage() {
  const usuarios = await getUsuariosControleRows();

  const rows: UsuarioControleRow[] =
    usuarios.length > 0
      ? usuarios.map((item) => ({
          id: item.id,
          nome: item.nome,
          telefone: item.telefone,
          tipoAcesso: item.tipoAcesso,
          email: item.email,
          meet: item.meet,
          ativo: item.ativo,
        }))
      : fallbackRows;

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="max-h-[calc(100vh-180px)] overflow-auto">
          <UsuariosControlShell initialRows={rows} />
        </div>
      </div>
    </PageContainer>
  );
}
