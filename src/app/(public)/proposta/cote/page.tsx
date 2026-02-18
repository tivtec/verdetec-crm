import { PropostaPage } from "@/components/public/proposta-page";
import { getPropostaByCod } from "@/services/public/proposta";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function renderCenteredMessage(title: string, description: string) {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "640px", textAlign: "center", fontFamily: "var(--font-body), sans-serif" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>{title}</h2>
        <p style={{ fontSize: "16px", color: "#555" }}>{description}</p>
      </div>
    </main>
  );
}

type CoteRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropostaCoteRoute({ searchParams }: CoteRouteProps) {
  const params = await searchParams;
  const cod = (getSearchValue(params.cod) ?? "").trim();

  if (!cod) {
    return renderCenteredMessage(
      "Codigo ausente",
      "Adicione ?cod=SEU_CODIGO na URL para carregar a proposta.",
    );
  }

  const proposta = await getPropostaByCod(cod);
  if (!proposta) {
    return renderCenteredMessage(
      "Nao foi possivel carregar a proposta",
      "Verifique o codigo informado e tente novamente.",
    );
  }

  return (
    <PropostaPage
      nome={proposta.nome}
      valor={proposta.valor}
      idProposta={proposta.idProposta}
      telefone={proposta.telefone}
      equipamento={proposta.equipamento}
      nomeEquipamento={proposta.nomeEquipamento}
    />
  );
}

