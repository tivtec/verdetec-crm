import { NextResponse, type NextRequest } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";

const EMPRESA_ADICIONAR_PEDIDO_ENDPOINT =
  process.env.EMPRESA_ADICIONAR_PEDIDO_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/957ba772-3ca5-48da-8d22-bfff9319b1d0";

const EMPRESA_ADICIONAR_PEDIDO_AUTHORIZATION =
  process.env.EMPRESA_ADICIONAR_PEDIDO_AUTHORIZATION ?? "Basic YXBpUG9ydGFsLTAyOm85MmVtMExRNHNKRTM5";

type AdicionarPedidoPayload = {
  pedido_uuid?: string | null;
  empresa_uuid?: string | null;
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

function parseResponseBody(text: string) {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function POST(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/empresas");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as AdicionarPedidoPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const pedidoUuid = asString(payload.pedido_uuid).trim();
  const empresaUuid = asString(payload.empresa_uuid).trim();

  if (!pedidoUuid) {
    return NextResponse.json({ ok: false, error: "pedido_uuid obrigatorio." }, { status: 400 });
  }

  if (!empresaUuid) {
    return NextResponse.json({ ok: false, error: "empresa_uuid obrigatorio." }, { status: 400 });
  }

  const webhookPayload = {
    pedido_uuid: pedidoUuid,
    empresa_uuid: empresaUuid,
  };

  try {
    const response = await fetch(EMPRESA_ADICIONAR_PEDIDO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: EMPRESA_ADICIONAR_PEDIDO_AUTHORIZATION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    const responseText = await response.text();
    const parsed = parseResponseBody(responseText);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de adicionar pedido retornou erro.",
          status: response.status,
          details: parsed,
          sent: webhookPayload,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      result: parsed,
      sent: webhookPayload,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha de rede ao adicionar pedido." }, { status: 502 });
  }
}
