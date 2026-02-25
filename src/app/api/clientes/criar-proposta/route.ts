import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

const CRIAR_PROPOSTA_ENDPOINT =
  process.env.CLIENTES_CRIAR_PROPOSTA_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/68fb6120-1f8d-473e-b8f3-2c1b5f09f99a";

type CriarPropostaPayload = {
  id_agregacao?: number | string | null;
  id_pessoa?: number | string | null;
  id_equipamento?: number | string | null;
  id_usuario?: number | string | null;
};

type AgregacaoContext = {
  idPessoa: number | null;
  idUsuario: number | null;
};

type EquipamentoContext = {
  id: number;
  codigo: number | null;
  nome: string | null;
  valorTexto: string | null;
  produto: string | null;
  classificacao: string | null;
};

type DebugEntry = {
  at: string;
  step: string;
  data?: unknown;
};

function asPositiveInt(value: unknown) {
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

function asNullableString(value: unknown) {
  if (typeof value === "string") {
    const parsed = value.trim();
    return parsed.length > 0 ? parsed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function isDebugEnabled(request: NextRequest) {
  if (process.env.CRM_DEBUG_LOGS === "true") {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return request.headers.get("x-debug") === "1";
}

async function parseResponseBody(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

async function resolveCurrentUsuarioId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("usuarios")
    .select("id")
    .eq("uuid_user", user.id)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return asPositiveInt((data[0] as Record<string, unknown>).id);
}

async function resolveAgregacaoIdByPessoa(pessoaId: number, usuarioId: number | null) {
  const admin = createAdminSupabaseClient();

  if (usuarioId) {
    const { data, error } = await admin
      .from("agregacao")
      .select("id")
      .eq("id_pessoa", pessoaId)
      .eq("id_usuario", usuarioId)
      .order("id", { ascending: false })
      .limit(1);

    if (!error && data?.length) {
      return asPositiveInt((data[0] as Record<string, unknown>).id);
    }
  }

  const { data, error } = await admin
    .from("agregacao")
    .select("id")
    .eq("id_pessoa", pessoaId)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return asPositiveInt((data[0] as Record<string, unknown>).id);
}

async function resolveAgregacaoContextById(agregacaoId: number): Promise<AgregacaoContext | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("agregacao")
    .select("id_pessoa,id_usuario")
    .eq("id", agregacaoId)
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return {
    idPessoa: asPositiveInt(row.id_pessoa),
    idUsuario: asPositiveInt(row.id_usuario),
  };
}

async function resolveEquipamentoContextById(equipamentoId: number): Promise<EquipamentoContext | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("equipamento")
    .select("id,cod_equipamento,nome_equipamento,valor_equipamento_texto,Produto,classificacao")
    .eq("id", equipamentoId)
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  const resolvedId = asPositiveInt(row.id);
  if (!resolvedId) {
    return null;
  }

  return {
    id: resolvedId,
    codigo: asPositiveInt(row.cod_equipamento),
    nome: asNullableString(row.nome_equipamento),
    valorTexto: asNullableString(row.valor_equipamento_texto),
    produto: asNullableString(row.Produto),
    classificacao: asNullableString(row.classificacao),
  };
}

async function resolveAgregacaoPropostaId(agregacaoId: number) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("agregacao")
    .select("id_proposta_valor")
    .eq("id", agregacaoId)
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return asPositiveInt(row.id_proposta_valor);
}

async function syncPropostaEquipamentoByAgregacao(agregacaoId: number, equipamentoId: number) {
  const propostaId = await resolveAgregacaoPropostaId(agregacaoId);
  if (!propostaId) {
    return {
      propostaId: null,
      synced: false,
      reason: "id_proposta_valor ausente na agregacao",
    } as const;
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("proposta_valor").update({ id_equipamento: equipamentoId }).eq("id", propostaId);
  if (error) {
    return {
      propostaId,
      synced: false,
      reason: error.message,
    } as const;
  }

  return {
    propostaId,
    synced: true,
  } as const;
}

export async function POST(request: NextRequest) {
  const debugId = randomUUID();
  const startedAt = Date.now();
  const debugEnabled = isDebugEnabled(request);
  const debugEntries: DebugEntry[] = [];
  const pushDebug = (step: string, data?: unknown) => {
    if (!debugEnabled) {
      return;
    }

    debugEntries.push({
      at: new Date().toISOString(),
      step,
      data,
    });
    console.log(`[clientes/criar-proposta][${debugId}] ${step}`, data ?? "");
  };

  pushDebug("request.received");
  const payload = (await request.json().catch(() => null)) as CriarPropostaPayload | null;
  pushDebug("request.parsed_payload", payload);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload invalido.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  const idEquipamento = asPositiveInt(payload.id_equipamento);
  if (!idEquipamento) {
    return NextResponse.json(
      {
        ok: false,
        error: "id_equipamento obrigatorio.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  let idUsuario = asPositiveInt(payload.id_usuario);
  if (!idUsuario) {
    pushDebug("resolve.id_usuario.from_session.start");
    idUsuario = await resolveCurrentUsuarioId();
    pushDebug("resolve.id_usuario.from_session.end", { value: idUsuario });
  }

  let idAgregacao = asPositiveInt(payload.id_agregacao);
  if (!idAgregacao) {
    const idPessoa = asPositiveInt(payload.id_pessoa);
    if (!idPessoa) {
      return NextResponse.json(
        {
          ok: false,
          error: "id_agregacao obrigatorio quando id_pessoa nao for informado.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    pushDebug("resolve.id_agregacao.from_agregacao.start", {
      id_pessoa: idPessoa,
      id_usuario: idUsuario,
    });
    idAgregacao = await resolveAgregacaoIdByPessoa(idPessoa, idUsuario);
    pushDebug("resolve.id_agregacao.from_agregacao.end", { value: idAgregacao });
  } else {
    pushDebug("resolve.id_agregacao.from_payload", { value: idAgregacao });
  }

  if (!idAgregacao) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nao foi possivel resolver id_agregacao para o cliente selecionado.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  const parsedPessoaFromPayload = asPositiveInt(payload.id_pessoa);
  const agregacaoContext = await resolveAgregacaoContextById(idAgregacao);
  const equipamentoContext = await resolveEquipamentoContextById(idEquipamento);
  const idPessoaResolved = agregacaoContext?.idPessoa ?? parsedPessoaFromPayload ?? null;
  const idUsuarioResolved = agregacaoContext?.idUsuario ?? idUsuario ?? null;

  pushDebug("resolve.context", {
    id_agregacao: idAgregacao,
    id_pessoa_payload: parsedPessoaFromPayload,
    id_pessoa_resolved: idPessoaResolved,
    id_usuario_payload: asPositiveInt(payload.id_usuario),
    id_usuario_resolved: idUsuarioResolved,
    equipamento: equipamentoContext,
  });

  const webhookPayload: Record<string, unknown> = {
    id_agregacao: idAgregacao,
    id_equipamento: equipamentoContext?.id ?? idEquipamento,
    equipamento_id: equipamentoContext?.id ?? idEquipamento,
    id_equip: equipamentoContext?.id ?? idEquipamento,
  };

  if (idPessoaResolved) {
    webhookPayload.id_pessoa = idPessoaResolved;
  }

  if (idUsuarioResolved) {
    webhookPayload.id_usuario = idUsuarioResolved;
  }

  if (equipamentoContext?.codigo) {
    webhookPayload.cod_equipamento = equipamentoContext.codigo;
    webhookPayload.codigo_equipamento = equipamentoContext.codigo;
  }

  if (equipamentoContext?.nome) {
    webhookPayload.nome_equipamento = equipamentoContext.nome;
  }

  if (equipamentoContext?.valorTexto) {
    webhookPayload.valor_equipamento_texto = equipamentoContext.valorTexto;
  }

  if (equipamentoContext?.produto) {
    webhookPayload.Produto = equipamentoContext.produto;
    webhookPayload.produto = equipamentoContext.produto;
  }

  if (equipamentoContext?.classificacao) {
    webhookPayload.classificacao = equipamentoContext.classificacao;
  }

  pushDebug("webhook.request", {
    endpoint: CRIAR_PROPOSTA_ENDPOINT,
    payload: webhookPayload,
  });

  const equipamentoIdToPersist = equipamentoContext?.id ?? idEquipamento;
  const preWebhookSync = await syncPropostaEquipamentoByAgregacao(idAgregacao, equipamentoIdToPersist);
  pushDebug("sync.pre_webhook", preWebhookSync);

  try {
    const response = await fetch(CRIAR_PROPOSTA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    const result = await parseResponseBody(response);
    pushDebug("webhook.response", {
      status: response.status,
      ok: response.ok,
      body: result,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de criar proposta retornou erro.",
          status: response.status,
          details: result,
          sent: webhookPayload,
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 502 },
      );
    }

    const postWebhookSync = await syncPropostaEquipamentoByAgregacao(idAgregacao, equipamentoIdToPersist);
    pushDebug("sync.post_webhook", postWebhookSync);

    const durationMs = Date.now() - startedAt;
    pushDebug("request.success", { duration_ms: durationMs });

    return NextResponse.json({
      ok: true,
      duration_ms: durationMs,
      result,
      sent: webhookPayload,
      debug_id: debugId,
      debug: debugEnabled ? debugEntries : undefined,
    });
  } catch (error) {
    pushDebug("request.network_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Falha de rede ao chamar webhook de criar proposta.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 502 },
    );
  }
}
