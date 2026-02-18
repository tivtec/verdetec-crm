import { PropostaPage } from "@/components/public/proposta-page";
import { getPropostaByUrlCode } from "@/services/public/proposta";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

type PropostaRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropostaRoute({ searchParams }: PropostaRouteProps) {
  const params = await searchParams;
  const cod = (getSearchValue(params.cod) ?? "").trim();
  const proposta = await getPropostaByUrlCode(cod);

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

