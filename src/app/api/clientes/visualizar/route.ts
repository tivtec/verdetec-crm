import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/services/supabase/server";

type VisualizarPayload = {
  id_pessoa?: number | string | null;
};

type VisualizarEtiqueta = {
  etiqueta: string;
  data_criacao: string | null;
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

function asString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
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

function normalizeEtiquetas(value: unknown) {
  let source: unknown = value;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }

  if (!Array.isArray(source)) {
    return [] as VisualizarEtiqueta[];
  }

  return source
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const etiqueta = asString(row.etiqueta);
      const dataCriacaoRaw = asString(row.data_criacao);

      if (!etiqueta) {
        return null;
      }

      return {
        etiqueta,
        data_criacao: dataCriacaoRaw || null,
      } satisfies VisualizarEtiqueta;
    })
    .filter((item): item is VisualizarEtiqueta => Boolean(item))
    .sort((a, b) => {
      const dateA = a.data_criacao ? Date.parse(a.data_criacao) : 0;
      const dateB = b.data_criacao ? Date.parse(b.data_criacao) : 0;
      return dateB - dateA;
    });
}

export async function POST(request: NextRequest) {
  const debugId = randomUUID();
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
    console.log(`[clientes/visualizar][${debugId}] ${step}`, data ?? "");
  };

  pushDebug("request.received");
  const payload = (await request.json().catch(() => null)) as VisualizarPayload | null;
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

  const idPessoa = asPositiveInt(payload.id_pessoa);
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

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("view_pessoa_com_etiquetas")
      .select("id_pessoa,nome,telefone,email,tipo_pessoa,created_at,etiquetas")
      .eq("id_pessoa", idPessoa)
      .limit(1)
      .maybeSingle();

    pushDebug("supabase.view.response", { hasData: Boolean(data), error: error?.message ?? null });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao buscar dados do cliente.",
          details: error.message,
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cliente nao encontrado.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 404 },
      );
    }

    const row = data as Record<string, unknown>;
    const nome = asString(row.nome) || "Cliente sem nome";
    const telefone = asString(row.telefone) || "Nao informado";
    const email = asString(row.email) || "Email nao existente";
    const documento = String(idPessoa);
    const etiquetas = normalizeEtiquetas(row.etiquetas);

    return NextResponse.json({
      ok: true,
      cliente: {
        id_pessoa: idPessoa,
        nome,
        telefone,
        email,
        documento,
        tipo_pessoa: asString(row.tipo_pessoa) || null,
        created_at: asString(row.created_at) || null,
      },
      etiquetas,
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
        error: "Falha inesperada ao carregar dados do cliente.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 502 },
    );
  }
}

