import { randomInt, randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

const INSERT_APRESENTACAO_ENDPOINT =
  process.env.CLIENTES_ENVIAR_LINK_RPC_ENDPOINT ??
  "https://zosdxuntvhrzjutmvduu.supabase.co/rest/v1/rpc/insert_apresentacao";
const INSERT_APRESENTACAO_API_KEY =
  process.env.CLIENTES_ENVIAR_LINK_RPC_API_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2R4dW50dmhyemp1dG12ZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTE3MDQsImV4cCI6MjA0MjQyNzcwNH0.Yz9v10j4W3jG4lkHjuYj_ca3dp66PGcLlVJllQVrYUY";
const INSERT_APRESENTACAO_AUTH_BEARER =
  process.env.CLIENTES_ENVIAR_LINK_RPC_AUTH_BEARER ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2R4dW50dmhyemp1dG12ZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTE3MDQsImV4cCI6MjA0MjQyNzcwNH0.Yz9v10j4W3jG4lkHjuYj_ca3dp66PGcLlVJllQVrYUY";
const ENVIAR_LINK_WEBHOOK_ENDPOINT =
  process.env.CLIENTES_ENVIAR_LINK_WEBHOOK_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/e1b18fae-f85f-4baf-9806-b1352ab235aa";

type EnviarLinkPayload = {
  id_pessoa?: number | string | null;
  pessoa_id?: number | string | null;
  id_usuario?: number | string | null;
  id_agregacao?: number | string | null;
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

function generateNumericCode(length = 10) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const min = index === 0 ? 1 : 0;
    const digit = randomInt(min, 10);
    code += String(digit);
  }
  return code;
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

export async function POST(request: NextRequest) {
  const debugId = randomUUID();
  const startedAt = Date.now();
  const debugEnabled = isDebugEnabled(request);
  const debugEntries: DebugEntry[] = [];
  const pushDebug = (step: string, data?: unknown) => {
    if (!debugEnabled) {
      return;
    }

    const entry: DebugEntry = {
      at: new Date().toISOString(),
      step,
      data,
    };

    debugEntries.push(entry);
    console.log(`[clientes/enviar-link][${debugId}] ${step}`, data ?? "");
  };

  pushDebug("request.received");

  const payload = (await request.json().catch(() => null)) as EnviarLinkPayload | null;
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

  const idPessoa = asPositiveInt(payload.id_pessoa) ?? asPositiveInt(payload.pessoa_id);
  pushDebug("resolve.id_pessoa", { value: idPessoa });
  if (!idPessoa) {
    return NextResponse.json(
      {
        ok: false,
        error: "id_pessoa obrigatorio.",
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

  if (!idUsuario) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nao foi possivel resolver id_usuario atual.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  let idAgregacao = asPositiveInt(payload.id_agregacao);
  if (!idAgregacao) {
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
        error: "Nao foi possivel resolver id_agre para o cliente selecionado.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  const cod = generateNumericCode(10);
  pushDebug("code.generated", { cod });

  const insertApresentacaoPayload = {
    p_adicionado: true,
    p_cod_link: cod,
    p_id_usuario: idUsuario,
    p_pessoa: idPessoa,
    p_status: "Pendente",
  };

  try {
    pushDebug("rpc.insert_apresentacao.request", {
      endpoint: INSERT_APRESENTACAO_ENDPOINT,
      payload: insertApresentacaoPayload,
    });
    const insertResponse = await fetch(INSERT_APRESENTACAO_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: INSERT_APRESENTACAO_API_KEY,
        Authorization: `Bearer ${INSERT_APRESENTACAO_AUTH_BEARER}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(insertApresentacaoPayload),
      cache: "no-store",
    });

    const insertResult = await parseResponseBody(insertResponse);
    pushDebug("rpc.insert_apresentacao.response", {
      status: insertResponse.status,
      ok: insertResponse.ok,
      body: insertResult,
    });
    if (!insertResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao inserir apresentacao (insert_apresentacao).",
          status: insertResponse.status,
          details: insertResult,
          sent: insertApresentacaoPayload,
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 502 },
      );
    }

    const notifyPayload = {
      id_agre: idAgregacao,
      id_agregacao: idAgregacao,
      cod,
    };

    pushDebug("webhook.notify.request", {
      endpoint: ENVIAR_LINK_WEBHOOK_ENDPOINT,
      payload: notifyPayload,
    });
    const notifyResponse = await fetch(ENVIAR_LINK_WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notifyPayload),
      cache: "no-store",
    });

    const notifyResult = await parseResponseBody(notifyResponse);
    pushDebug("webhook.notify.response", {
      status: notifyResponse.status,
      ok: notifyResponse.ok,
      body: notifyResult,
    });
    if (!notifyResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao notificar webhook de envio de link.",
          status: notifyResponse.status,
          details: notifyResult,
          sent: notifyPayload,
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 502 },
      );
    }

    const durationMs = Date.now() - startedAt;
    pushDebug("request.success", { duration_ms: durationMs });
    return NextResponse.json({
      ok: true,
      cod,
      debug_id: debugId,
      duration_ms: durationMs,
      insert_apresentacao: insertResult,
      webhook_result: notifyResult,
      sent: {
        insert_apresentacao: insertApresentacaoPayload,
        webhook: notifyPayload,
      },
      debug: debugEnabled ? debugEntries : undefined,
    });
  } catch (error) {
    pushDebug("request.network_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Falha de rede no fluxo Enviar Link.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 502 },
    );
  }
}
