import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

type CampanhasCadastroEndpointKey = "list" | "create" | "update" | "delete" | "add_note";

const CAMPANHAS_ENDPOINT_PATHS: Record<CampanhasCadastroEndpointKey, string> = {
  list: "/webhook/campaigns-list",
  create: "/webhook/campaigns-create",
  update: "/webhook/campaigns-update",
  delete: "/webhook/campaigns-delete",
  add_note: "/webhook/observations-add",
};

const CAMPANHAS_ENDPOINT_ENVS: Record<CampanhasCadastroEndpointKey, string | undefined> = {
  list: process.env.N8N_CAMPANHAS_LIST_URL,
  create: process.env.N8N_CAMPANHAS_CREATE_URL,
  update: process.env.N8N_CAMPANHAS_UPDATE_URL,
  delete: process.env.N8N_CAMPANHAS_DELETE_URL,
  add_note: process.env.N8N_CAMPANHAS_ADD_NOTE_URL,
};

type CampanhasRequestContext = {
  userId: string | null;
  usuarioId: number | null;
  organizacaoId: string | null;
};

function asString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

export function asNullableString(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

export function asPositiveInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const intValue = Math.trunc(value);
    return intValue > 0 ? intValue : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      const intValue = Math.trunc(parsed);
      return intValue > 0 ? intValue : null;
    }
  }

  return null;
}

export function asNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value !== 0;
  }

  return fallback;
}

function resolveN8nEndpoint(key: CampanhasCadastroEndpointKey) {
  const explicit = CAMPANHAS_ENDPOINT_ENVS[key];
  if (explicit && explicit.trim().length > 0) {
    const endpoint = explicit.trim();
    if (/example\.com/i.test(endpoint)) {
      return null;
    }
    return endpoint;
  }

  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  if (!baseUrl || baseUrl.trim().length === 0) {
    return null;
  }

  try {
    const endpoint = new URL(CAMPANHAS_ENDPOINT_PATHS[key], baseUrl).toString();
    if (/example\.com/i.test(endpoint)) {
      return null;
    }
    return endpoint;
  } catch {
    return null;
  }
}

export async function resolveCampanhasRequestContext(): Promise<CampanhasRequestContext> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        userId: null,
        usuarioId: null,
        organizacaoId: null,
      };
    }

    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .from("usuarios")
      .select("id,id_organizacao")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = (data ?? null) as Record<string, unknown> | null;
    return {
      userId: user.id,
      usuarioId: asPositiveInt(row?.id),
      organizacaoId: asNullableString(row?.id_organizacao),
    };
  } catch {
    return {
      userId: null,
      usuarioId: null,
      organizacaoId: null,
    };
  }
}

type ForwardToN8nInput = {
  key: CampanhasCadastroEndpointKey;
  method: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | null | undefined>;
  payload?: Record<string, unknown>;
};

type ForwardToN8nResult = {
  ok: boolean;
  status: number;
  data: unknown;
  error: string | null;
};

export async function forwardToN8n({ key, method, query, payload }: ForwardToN8nInput): Promise<ForwardToN8nResult> {
  const endpoint = resolveN8nEndpoint(key);
  if (!endpoint) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: "Endpoint n8n não configurado para campanhas/cadastro.",
    };
  }

  const secret = process.env.N8N_WEBHOOK_SECRET?.trim() || "";
  const headers: Record<string, string> = {};
  if (secret.length > 0) {
    headers["x-webhook-secret"] = secret;
  }

  const targetUrl = new URL(endpoint);
  if (query) {
    for (const [keyName, rawValue] of Object.entries(query)) {
      if (rawValue === undefined || rawValue === null) {
        continue;
      }
      const value = String(rawValue).trim();
      if (!value) {
        continue;
      }
      targetUrl.searchParams.set(keyName, value);
    }
  }

  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && payload) {
    headers["Content-Type"] = "application/json";
    requestInit.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(targetUrl.toString(), requestInit);
    const text = await response.text();
    const data = text.length > 0 ? JSON.parse(text) : null;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
        error:
          (typeof data === "object" && data && "error" in data ? asString((data as Record<string, unknown>).error) : "") ||
          `Falha ao chamar n8n (${response.status}).`,
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: null,
      error: error instanceof Error ? error.message : "Falha de rede ao chamar n8n.",
    };
  }
}

export type CadastroCampanhaRow = {
  id: string;
  apelido: string;
  nomeCampanha: string;
  utmCampanha: string;
  orcamento: number | null;
  ativo: boolean;
  ultimaAtualizacao: string | null;
  raw: Record<string, unknown>;
};

function normalizeCampanhaRow(value: unknown): CadastroCampanhaRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = asNullableString(row.id ?? row.campanha_id ?? row.id_campanha);
  if (!id) {
    return null;
  }

  return {
    id,
    apelido: asNullableString(row.apelido) ?? "",
    nomeCampanha: asNullableString(row.nome_campanha ?? row.nomeCampanha) ?? "",
    utmCampanha: asNullableString(row.utm_campanha ?? row.utmCampanha ?? row.utm) ?? "",
    orcamento: asNullableNumber(row.orcamento ?? row.valor),
    ativo: asBoolean(row.ativo, true),
    ultimaAtualizacao:
      asNullableString(row.ultima_atualizacao ?? row.updated_at ?? row.data_atualizacao ?? row.data_criacao) ?? null,
    raw: row,
  };
}

export function normalizeCampanhasListPayload(data: unknown): CadastroCampanhaRow[] {
  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (Array.isArray((data as Record<string, unknown>).items)
          ? (data as Record<string, unknown>).items
          : Array.isArray((data as Record<string, unknown>).data)
            ? (data as Record<string, unknown>).data
            : [])
      : [];

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map((item) => normalizeCampanhaRow(item)).filter((row): row is CadastroCampanhaRow => row !== null);
}

type ListCampanhasFallbackInput = {
  q?: string | null;
  organizacaoId?: string | null;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function listCampanhasFallbackFromSupabase({
  q,
  organizacaoId,
}: ListCampanhasFallbackInput): Promise<CadastroCampanhaRow[]> {
  const admin = createAdminSupabaseClient();

  let query = admin.from("campanhas").select("*").order("created_at", { ascending: false }).limit(500);
  const orgId = asNullableString(organizacaoId);
  if (orgId) {
    query = query.eq("id_organizacao", orgId);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    throw new Error(error?.message ?? "Falha ao consultar campanhas no Supabase.");
  }

  const normalizedQ = normalizeSearch(asNullableString(q) ?? "");
  const filtered = normalizedQ
    ? data.filter((value) => {
        const row = value as Record<string, unknown>;
        const haystack = normalizeSearch(
          [
            asNullableString(row.apelido),
            asNullableString(row.nome_campanha),
            asNullableString(row.nome_fluxo),
            asNullableString(row.nome_api),
            asNullableString(row.texto_chave),
            asNullableString(row.telefone),
          ]
            .filter((item): item is string => Boolean(item))
            .join(" "),
        );
        return haystack.includes(normalizedQ);
      })
    : data;

  return filtered
    .map((value) => {
      const row = value as Record<string, unknown>;
      const id = asNullableString(row.id);
      if (!id) {
        return null;
      }

      return {
        id,
        apelido: asNullableString(row.apelido) ?? "",
        nomeCampanha: asNullableString(row.nome_campanha) ?? "",
        utmCampanha: asNullableString(row.utm_campanha ?? row.texto_chave) ?? "",
        orcamento: asNullableNumber(row.orcamento ?? row.valor),
        ativo: asBoolean(row.ativo, true),
        ultimaAtualizacao:
          asNullableString(row.ultima_atualizacao ?? row.updated_at ?? row.created_at ?? row.data_criacao) ?? null,
        raw: row,
      } satisfies CadastroCampanhaRow;
    })
    .filter((row): row is CadastroCampanhaRow => row !== null);
}
