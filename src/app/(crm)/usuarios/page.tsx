import { UsuariosControlShell } from "@/components/usuarios/usuarios-control-shell";
import type { UsuarioControleRow } from "@/components/usuarios/types";
import { PageContainer } from "@/components/layout/page-container";
import { getUsuariosControleRows } from "@/services/crm/api";

const fallbackRows: UsuarioControleRow[] = [
  {
    id: "120",
    nome: "120-Felipe P.",
    telefone: "47992257826",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "felipe.po@verdetec.com",
    meet: "https://meet.google.com/uqc-vzjh-uea",
    dispoLeads: true,
    ativo: true,
  },
  {
    id: "66",
    nome: "66-Edson T.",
    telefone: "4830368695",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "vendas16@verdetec.com",
    meet: "http://meet.google.com/uaq-vfqo-oyo",
    dispoLeads: true,
    ativo: true,
  },
  {
    id: "63",
    nome: "63-Lazaro S.",
    telefone: "4830368696",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "vendas18@verdetec.com",
    meet: "http://meet.google.com/gig-ukpe-kmw",
    dispoLeads: true,
    ativo: true,
  },
  {
    id: "98",
    nome: "98-Evanderson U.",
    telefone: "47992348350",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "evanderson.ur@verdetec.com",
    meet: "https://meet.google.com/stq-fisv-yix",
    dispoLeads: true,
    ativo: true,
  },
  {
    id: "62",
    nome: "62-Jaqueline O.",
    telefone: "4830272661",
    tipoAcesso: "Time Negócios",
    tipoAcesso2: "Time Negócios",
    email: "vendas19@verdetec.com",
    meet: "http://meet.google.com/afs-zdnc-jmi",
    dispoLeads: true,
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
          tipoAcesso2: item.tipoAcesso2,
          email: item.email,
          meet: item.meet,
          l100: item.l100,
          dispoLeads: item.dispoLeads,
          ativo: item.ativo,
        }))
      : fallbackRows;

  return (
    <PageContainer className="space-y-5 bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <div className="h-[calc(100dvh-180px)] overflow-auto">
          <UsuariosControlShell initialRows={rows} />
        </div>
      </div>
    </PageContainer>
  );
}
