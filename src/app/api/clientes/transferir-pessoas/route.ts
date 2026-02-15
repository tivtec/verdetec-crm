import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

const TRANSFERIR_PESSOAS_ENDPOINT =
  process.env.CLIENTES_TRANSFERIR_PESSOAS_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/flutterFlow_transferir_pessoas";

type TransferirPessoasPayload = {
  new_usuario?: number | string | null;
  id_usuario_novo?: number | string | null;
  ids_pessoas?: Array<number | string | null> | string | null;
  p_ids_pessoa?: Array<number | string | null> | string | null;
  autor?: number | string | null;
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

function normalizeIdsPessoas(value: TransferirPessoasPayload["ids_pessoas"]) {
  let source: unknown = value;

  if (typeof source === "string") {
    const trimmed = source.trim();

    if (!trimmed) {
      source = [];
    } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        source = JSON.parse(trimmed);
      } catch {
        source = trimmed.split(",");
      }
    } else {
      source = trimmed.split(",");
    }
  }

  if (!Array.isArray(source)) {
    return [] as number[];
  }

  const normalized = source
    .map((item) => asPositiveInt(item))
    .filter((item): item is number => Boolean(item));

  return Array.from(new Set(normalized));
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
    console.log(`[clientes/transferir-pessoas][${debugId}] ${step}`, data ?? "");
  };

  pushDebug("request.received");
  const payload = (await request.json().catch(() => null)) as TransferirPessoasPayload | null;
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

  const newUsuario = asPositiveInt(payload.new_usuario) ?? asPositiveInt(payload.id_usuario_novo);
  if (!newUsuario) {
    return NextResponse.json(
      {
        ok: false,
        error: "new_usuario/id_usuario_novo obrigatorio.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  const idsPessoas = normalizeIdsPessoas(payload.ids_pessoas ?? payload.p_ids_pessoa);
  if (!idsPessoas.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "ids_pessoas/p_ids_pessoa obrigatorio com pelo menos 1 id valido.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }

  const webhookPayload = {
    new_usuario: newUsuario,
    id_usuario_novo: newUsuario,
    ids_pessoas: idsPessoas,
    p_ids_pessoa: idsPessoas,
    autor: asPositiveInt(payload.autor) ?? null,
  };

  pushDebug("webhook.request", {
    endpoint: TRANSFERIR_PESSOAS_ENDPOINT,
    payload: webhookPayload,
  });

  try {
    const response = await fetch(TRANSFERIR_PESSOAS_ENDPOINT, {
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
          error: "Webhook de transferencia em lote retornou erro.",
          status: response.status,
          details: result,
          sent: webhookPayload,
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
        error: "Falha de rede ao chamar webhook de transferencia em lote.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 502 },
    );
  }
}
