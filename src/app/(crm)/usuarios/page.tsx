import { UsuariosControlShell } from "@/components/usuarios/usuarios-control-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getUsuariosControleRows } from "@/services/crm/api";

export default async function UsuariosPage() {
  const usuarios = await getUsuariosControleRows();

  const rows = usuarios.map((item) => ({
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
  }));

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
