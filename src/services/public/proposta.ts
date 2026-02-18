const PROPOSTA_WEBHOOK_URL = "https://webh.verdetec.dev.br/webhook/fc99342f-4b56-4859-a362-e98196aee9e5";

export type PropostaWebhookResponse = {
  nome_pessoa?: string | null;
  telefone_pessoa?: string | null;
  id_proposta_valor?: number | string | null;
  valor_equipamento_texto?: string | null;
  codigo_equipamento?: number | string | null;
  nome_equipamento?: string | null;
};

export type PropostaViewModel = {
  nome: string;
  valor: string;
  idProposta: string;
  telefone: string;
  equipamento: number;
  nomeEquipamento: string;
};

const defaultPropostaData: PropostaViewModel = {
  nome: "Cliente",
  valor: "R$ 0,00",
  idProposta: "000000",
  telefone: "(00) 00000-0000",
  equipamento: 0,
  nomeEquipamento: "",
};

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function formatPhoneNumber(phone: string) {
  if (!phone) {
    return "(00) 00000-0000";
  }

  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
}

function toViewModel(data: PropostaWebhookResponse | null | undefined): PropostaViewModel {
  if (!data) {
    return defaultPropostaData;
  }

  const nome = asString(data.nome_pessoa, "Cliente").trim() || "Cliente";
  const valorEquipamento = asString(data.valor_equipamento_texto).trim();
  const idPropostaRaw = asString(data.id_proposta_valor).trim();
  const telefone = formatPhoneNumber(asString(data.telefone_pessoa));
  const codigoEquipamento = Math.max(0, Math.trunc(asNumber(data.codigo_equipamento, 0)));
  const nomeEquipamento = asString(data.nome_equipamento).trim();

  return {
    nome,
    valor: valorEquipamento.length > 0 ? `R$ ${valorEquipamento}` : "R$ 0,00",
    idProposta: idPropostaRaw.length > 0 ? idPropostaRaw : "000000",
    telefone,
    equipamento: codigoEquipamento,
    nomeEquipamento,
  };
}

async function callPropostaWebhook(payload: Record<string, unknown>): Promise<PropostaWebhookResponse | null> {
  try {
    const response = await fetch(PROPOSTA_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json().catch(() => null)) as unknown;
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return null;
    }

    return json as PropostaWebhookResponse;
  } catch {
    return null;
  }
}

export async function getPropostaByUrlCode(cod: string): Promise<PropostaViewModel> {
  if (!cod.trim()) {
    return defaultPropostaData;
  }

  const data = await callPropostaWebhook({ url_proposta: cod.trim() });
  return toViewModel(data);
}

export async function getPropostaByCod(cod: string): Promise<PropostaViewModel | null> {
  if (!cod.trim()) {
    return null;
  }

  const data = await callPropostaWebhook({ cod: cod.trim() });
  if (!data) {
    return null;
  }

  return toViewModel(data);
}

