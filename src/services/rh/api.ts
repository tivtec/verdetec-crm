import { createServerSupabaseClient } from "@/services/supabase/server";
import { getDashboardViewerAccessScope } from "@/services/crm/api";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

export type RhRegistroPontoFilters = {
  nome?: string;
  organizacaoId?: string;
};

export type RhOrganizationOption = {
  id: string;
  nome: string;
};

export type RhRegistroPontoRow = {
  idUsuario: number;
  nome: string;
  email: string | null;
  pis: string | null;
  organizacaoId: string | null;
  organizacaoNome: string;
  ativo: boolean;
};

export type RhRegistroPontoSnapshot = {
  rows: RhRegistroPontoRow[];
  organizations: RhOrganizationOption[];
};

type RhAfdDownloadResult =
  | {
      ok: true;
      fileName: string;
      contentType: string;
      content: string;
      rpcName: string;
    }
  | {
      ok: false;
      error: string;
    };

export type RhAfdEdgeGenerateInput = {
  idUsuario?: number;
  idOrganizacao: string;
  startDate: string;
  endDate: string;
};

export type RhAfdEdgeGenerateResult =
  | {
      ok: true;
      fileName: string;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

export type RhAfdDirectGenerateInput = {
  idUsuario: number;
  idOrganizacao: string;
  startDate: string;
  endDate: string;
};

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "t", "yes", "sim"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "f", "no", "nao", "não"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function asNullableString(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

function normalizeLoose(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseAllowedUsuarioIdsFromEnv() {
  const raw = asString(process.env.RH_REGISTRO_PONTOS_USUARIO_IDS, "");
  if (!raw.trim()) {
    return [] as number[];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => Math.max(0, Math.trunc(asNumber(item.trim(), 0))))
        .filter((value) => value > 0),
    ),
  );
}

function resolveRhAfdEdgeFunctionUrl() {
  const explicitUrl = asString(process.env.RH_AFD_EDGE_FUNCTION_URL, "").trim();
  if (explicitUrl.length > 0) {
    return explicitUrl;
  }

  const supabaseUrl = asString(process.env.NEXT_PUBLIC_SUPABASE_URL, "").trim();
  if (!supabaseUrl) {
    return "";
  }

  const functionName = asString(process.env.RH_AFD_EDGE_FUNCTION_NAME, "gerar-afd").trim();
  if (!functionName) {
    return "";
  }

  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/${functionName}`;
}

async function getViewerOrganizationId() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const baseSelect = "id_organizacao";
    let { data, error } = await supabase
      .from("usuarios")
      .select(baseSelect)
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1);

    if ((!data || data.length === 0) && user.email) {
      const byEmail = await supabase
        .from("usuarios")
        .select(baseSelect)
        .eq("email", user.email)
        .order("id", { ascending: false })
        .limit(1);
      data = byEmail.data;
      error = byEmail.error;
    }

    if (error || !data?.length) {
      return null;
    }

    return asNullableString((data[0] as Record<string, unknown>).id_organizacao);
  } catch {
    return null;
  }
}

function buildOrganizationName(row: Record<string, unknown>) {
  return (
    asNullableString(row.nome_fantasia) ??
    asNullableString(row.razao_social) ??
    asNullableString(row.id) ??
    "Organizacao"
  );
}

export async function getRhRegistroPontoSnapshot(
  filters: RhRegistroPontoFilters = {},
): Promise<RhRegistroPontoSnapshot> {
  try {
    const [scope, viewerOrganizationId] = await Promise.all([
      getDashboardViewerAccessScope(),
      getViewerOrganizationId(),
    ]);

    const viewerUsuarioId = Math.max(0, Math.trunc(asNumber(scope.viewerUsuarioId, 0)));
    const viewerVerticalId = asString(scope.viewerVerticalId, "").trim();

    if (!scope.isGerencia && !scope.isGestor && viewerUsuarioId <= 0) {
      return {
        rows: [],
        organizations: [],
      };
    }

    if (!scope.isGerencia && scope.isGestor && viewerVerticalId.length === 0) {
      return {
        rows: [],
        organizations: [],
      };
    }

    const nomeFilter = asString(filters.nome, "").trim();
    const organizacaoFilter = asString(filters.organizacaoId, "").trim();
    const allowedUsuarioIds = parseAllowedUsuarioIdsFromEnv();

    const supabase = await createServerSupabaseClient();
    let usuariosQuery = supabase
      .from("usuarios")
      .select("id,nome,email,pis,usuario_ativo,id_organizacao,id_vertical")
      .eq("usuario_ativo", true)
      .order("nome", { ascending: true })
      .limit(5000);

    if (!scope.isGerencia && scope.isGestor) {
      usuariosQuery = usuariosQuery.eq("id_vertical", viewerVerticalId);
    } else if (!scope.isGerencia) {
      usuariosQuery = usuariosQuery.eq("id", viewerUsuarioId);
    }

    if (viewerOrganizationId && !scope.isGerencia) {
      usuariosQuery = usuariosQuery.eq("id_organizacao", viewerOrganizationId);
    }

    if (allowedUsuarioIds.length > 0) {
      usuariosQuery = usuariosQuery.in("id", allowedUsuarioIds);
    }

    if (nomeFilter.length > 0) {
      usuariosQuery = usuariosQuery.ilike("nome", `%${nomeFilter}%`);
    }

    if (organizacaoFilter.length > 0) {
      usuariosQuery = usuariosQuery.eq("id_organizacao", organizacaoFilter);
    }

    const { data: usuariosRows, error: usuariosError } = await usuariosQuery;
    if (usuariosError || !usuariosRows) {
      return {
        rows: [],
        organizations: [],
      };
    }

    const organizationIds = Array.from(
      new Set(
        (usuariosRows as Array<Record<string, unknown>>)
          .map((row) => asNullableString(row.id_organizacao))
          .filter((value): value is string => Boolean(value)),
      ),
    );

    let organizationsQuery = supabase
      .from("organizacao")
      .select("id,nome_fantasia,razao_social,status")
      .eq("status", true)
      .order("nome_fantasia", { ascending: true })
      .limit(2000);

    if (viewerOrganizationId && !scope.isGerencia) {
      organizationsQuery = organizationsQuery.eq("id", viewerOrganizationId);
    }

    const { data: organizationRows } = await organizationsQuery;
    const organizationById = new Map<string, string>();
    const organizations = ((organizationRows as Array<Record<string, unknown>> | null) ?? [])
      .map((row) => {
        const id = asNullableString(row.id);
        if (!id) {
          return null;
        }

        const nome = buildOrganizationName(row);
        organizationById.set(id, nome);
        return {
          id,
          nome,
        } satisfies RhOrganizationOption;
      })
      .filter((value): value is RhOrganizationOption => Boolean(value))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    if (organizationIds.length > 0) {
      const missingOrganizationIds = organizationIds.filter((id) => !organizationById.has(id));
      if (missingOrganizationIds.length > 0) {
        const { data: missingRows } = await supabase
          .from("organizacao")
          .select("id,nome_fantasia,razao_social,status")
          .in("id", missingOrganizationIds);
        for (const row of (missingRows as Array<Record<string, unknown>> | null) ?? []) {
          const id = asNullableString(row.id);
          if (!id) {
            continue;
          }
          organizationById.set(id, buildOrganizationName(row));
        }
      }
    }

    const rows = (usuariosRows as Array<Record<string, unknown>>)
      .map((row) => {
        const idUsuario = Math.max(0, Math.trunc(asNumber(row.id, 0)));
        if (idUsuario <= 0) {
          return null;
        }

        const organizationId = asNullableString(row.id_organizacao);
        const organizationName = organizationId ? organizationById.get(organizationId) ?? "Sem organizacao" : "Sem organizacao";

        return {
          idUsuario,
          nome: asString(row.nome, "Sem nome"),
          email: asNullableString(row.email),
          pis: asNullableString(row.pis),
          organizacaoId: organizationId,
          organizacaoNome: organizationName,
          ativo: asBoolean(row.usuario_ativo, true),
        } satisfies RhRegistroPontoRow;
      })
      .filter((value): value is RhRegistroPontoRow => Boolean(value))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return {
      rows,
      organizations,
    };
  } catch {
    return {
      rows: [],
      organizations: [],
    };
  }
}

export async function generateRhAfdByEdgeFunction(
  input: RhAfdEdgeGenerateInput,
): Promise<RhAfdEdgeGenerateResult> {
  const endpoint = resolveRhAfdEdgeFunctionUrl();
  if (!endpoint) {
    return {
      ok: false,
      error:
        "Endpoint da Edge Function não configurado. Defina RH_AFD_EDGE_FUNCTION_URL ou RH_AFD_EDGE_FUNCTION_NAME.",
    };
  }

  const serviceRoleKey = asString(process.env.SUPABASE_SERVICE_KEY, "").trim();
  const anonKey = asString(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "").trim();
  const authToken = serviceRoleKey || anonKey;

  if (!authToken) {
    return {
      ok: false,
      error: "Credenciais Supabase ausentes para chamar a Edge Function.",
    };
  }

  const safeOrganizacaoId = asString(input.idOrganizacao, "").trim();
  if (!safeOrganizacaoId) {
    return {
      ok: false,
      error: "idOrganizacao é obrigatório para gerar o AFD.",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      startDate: input.startDate,
      endDate: input.endDate,
      idOrganizacao: safeOrganizacaoId,
    };

    if (typeof input.idUsuario === "number" && input.idUsuario > 0) {
      payload.idUsuario = Math.trunc(input.idUsuario);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: authToken,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const bodyError =
        asNullableString(body.error) ??
        asNullableString(body.message) ??
        asNullableString(body.error_description) ??
        asNullableString(body.msg) ??
        asNullableString(body.code);
      const functionName = endpoint.split("/").filter(Boolean).pop() ?? "desconhecida";
      const isNotFound =
        normalizeLoose(asString(body.code)) === "not_found" ||
        normalizeLoose(bodyError).includes("requested function was not found");

      if (isNotFound) {
        return {
          ok: false,
          error: `Edge Function '${functionName}' nao encontrada no Supabase. Defina RH_AFD_EDGE_FUNCTION_NAME/RH_AFD_EDGE_FUNCTION_URL com o nome correto e faca deploy da funcao.`,
        };
      }

      return {
        ok: false,
        error:
          bodyError ??
          `Falha ao chamar Edge Function de AFD (HTTP ${response.status}).`,
      };
    }

    const fileName = asString(body.fileName, "").trim();
    const url = asString(body.url, "").trim();
    const message = asString(body.message, "").trim();

    if (!url) {
      return {
        ok: false,
        error: message || "A Edge Function não retornou URL do arquivo AFD.",
      };
    }

    return {
      ok: true,
      fileName: fileName || "AFD.txt",
      url,
    };
  } catch {
    return {
      ok: false,
      error: "Erro de rede ao chamar a Edge Function de AFD.",
    };
  }
}

function formatAfdDateTimeCompact(value: string) {
  const d = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    pad(d.getUTCDate()) +
    pad(d.getUTCMonth() + 1) +
    d.getUTCFullYear() +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes())
  );
}

function sanitizeAfdFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export async function generateRhAfdByDirectQuery(
  input: RhAfdDirectGenerateInput,
): Promise<RhAfdDownloadResult> {
  const safeUsuarioId = Math.max(0, Math.trunc(input.idUsuario));
  const safeOrganizacaoId = asString(input.idOrganizacao, "").trim();
  const safeStartDate = asString(input.startDate, "").trim();
  const safeEndDate = asString(input.endDate, "").trim();

  if (safeUsuarioId <= 0 || !safeOrganizacaoId || !safeStartDate || !safeEndDate) {
    return {
      ok: false,
      error: "Parametros obrigatorios invalidos para gerar AFD.",
    };
  }

  try {
    const admin = createAdminSupabaseClient();

    const { data: usuarioRow, error: usuarioError } = await admin
      .from("usuarios")
      .select("id,nome,pis")
      .eq("id", safeUsuarioId)
      .limit(1)
      .maybeSingle();

    if (usuarioError || !usuarioRow) {
      return {
        ok: false,
        error: "Nao foi possivel localizar os dados do colaborador para gerar AFD.",
      };
    }

    const { data: registrosRows, error: registrosError } = await admin
      .from("registro_ponto")
      .select("nsr,marcacao,created_at")
      .eq("id_organizacao", safeOrganizacaoId)
      .eq("id_usuario", safeUsuarioId)
      .gte("created_at", safeStartDate)
      .lte("created_at", safeEndDate)
      .order("created_at", { ascending: true });

    if (registrosError) {
      return {
        ok: false,
        error: `Falha ao consultar registro_ponto: ${registrosError.message}`,
      };
    }

    if (!registrosRows || registrosRows.length === 0) {
      return {
        ok: false,
        error: "Sem dados no periodo informado para este colaborador.",
      };
    }

    const pis = asString(usuarioRow.pis ?? "", "").padStart(11, "0");
    const content = (registrosRows as Array<Record<string, unknown>>)
      .map((row) => {
        const nsr = asString(row.nsr ?? 0, "0").padStart(9, "0");
        const marcacao = asString(row.marcacao ?? 0, "0").padStart(1, "0");
        const dataHora = formatAfdDateTimeCompact(asString(row.created_at, ""));
        return `${nsr}${marcacao}${dataHora}${pis}`;
      })
      .join("\n");

    const nomeUsuario = asString(usuarioRow.nome, "USUARIO");
    const dataInicio = safeStartDate.slice(0, 10);
    const dataFim = safeEndDate.slice(0, 10);
    const fileName = `AFD_${sanitizeAfdFileName(nomeUsuario)}_${dataInicio}_${dataFim}.txt`;

    return {
      ok: true,
      fileName,
      contentType: "text/plain; charset=utf-8",
      content: `${content}\n`,
      rpcName: "direct_query",
    };
  } catch {
    return {
      ok: false,
      error: "Falha inesperada ao gerar AFD direto do banco.",
    };
  }
}

function decodeBase64ToUtf8(value: string) {
  try {
    return Buffer.from(value, "base64").toString("utf-8");
  } catch {
    return value;
  }
}

function extractAfdContentFromUnknown(data: unknown): string | null {
  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return "";
    }

    if (data.every((item) => typeof item === "string")) {
      return (data as string[]).join("\n");
    }

    if (data.every((item) => typeof item === "object" && item !== null)) {
      const preferredObjectKeys = [
        "arquivo",
        "content",
        "conteudo",
        "afd",
        "linha",
        "registro",
        "texto",
      ];

      const lines: string[] = [];
      for (const item of data as Array<Record<string, unknown>>) {
        for (const key of preferredObjectKeys) {
          const value = asNullableString(item[key]);
          if (value) {
            lines.push(value);
            break;
          }
        }
      }

      if (lines.length > 0) {
        return lines.join("\n");
      }

      return JSON.stringify(data, null, 2);
    }

    return JSON.stringify(data, null, 2);
  }

  if (typeof data === "object" && data !== null) {
    const row = data as Record<string, unknown>;
    const base64 = asNullableString(
      row.arquivo_base64 ?? row.base64 ?? row.afd_base64 ?? row.file_base64,
    );
    if (base64) {
      return decodeBase64ToUtf8(base64);
    }

    const textCandidate = asNullableString(
      row.arquivo ?? row.content ?? row.conteudo ?? row.afd ?? row.texto,
    );
    if (textCandidate) {
      return textCandidate;
    }

    return JSON.stringify(data, null, 2);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return String(data);
  }

  return null;
}

function getRhAfdRpcCandidates() {
  const envName = asString(process.env.RH_AFD_RPC_NAME, "").trim();
  const fallbackCandidates = [
    "rh_afd",
    "rh_afd_download",
    "rh_download_afd",
    "download_afd",
    "download_afd_pontos",
    "gerar_afd",
    "gerar_afd_pontos",
    "baixar_afd",
    "baixar_afd_pontos",
    "registro_pontos_afd",
  ];

  return Array.from(new Set([envName, ...fallbackCandidates].filter((value) => value.length > 0)));
}

function buildRhAfdRpcArgs(usuarioId: number) {
  return [
    { p_id_usuario: usuarioId },
    { id_usuario: usuarioId },
    { p_usuario_id: usuarioId },
    { usuario_id: usuarioId },
    { p_id_colaborador: usuarioId },
    { id_colaborador: usuarioId },
  ];
}

export async function downloadRhAfdByUsuarioId(usuarioId: number): Promise<RhAfdDownloadResult> {
  const safeUsuarioId = Math.max(0, Math.trunc(usuarioId));
  if (safeUsuarioId <= 0) {
    return {
      ok: false,
      error: "ID do colaborador inválido para gerar AFD.",
    };
  }

  try {
    const admin = createAdminSupabaseClient();
    const rpcCandidates = getRhAfdRpcCandidates();
    const argsCandidates = buildRhAfdRpcArgs(safeUsuarioId);

    for (const rpcName of rpcCandidates) {
      for (const rpcArgs of argsCandidates) {
        const { data, error } = await admin.rpc(rpcName as never, rpcArgs as never);
        if (error) {
          continue;
        }

        const content = extractAfdContentFromUnknown(data);
        if (content === null) {
          continue;
        }

        const stamp = new Date().toISOString().slice(0, 10);
        return {
          ok: true,
          fileName: `afd-${safeUsuarioId}-${stamp}.txt`,
          contentType: "text/plain; charset=utf-8",
          content,
          rpcName,
        };
      }
    }

    return {
      ok: false,
      error:
        "Nenhuma função de AFD respondeu com dados. Configure RH_AFD_RPC_NAME com o nome exato da função no banco.",
    };
  } catch {
    return {
      ok: false,
      error: "Falha ao gerar arquivo AFD.",
    };
  }
}
