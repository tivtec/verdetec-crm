import { type NextRequest, NextResponse } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";

import {
  asNullableNumber,
  asNullableString,
  forwardToN8n,
  resolveCampanhasRequestContext,
} from "../_shared";

type AddNotePayload = {
  id_campanha?: unknown;
  observacao?: unknown;
  utm_campanha?: unknown;
  valor?: unknown;
};

export async function POST(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/campanhas");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as AddNotePayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload inválido." }, { status: 400 });
  }

  const idCampanha = asNullableString(payload.id_campanha);
  const observacao = asNullableString(payload.observacao);
  if (!idCampanha) {
    return NextResponse.json({ ok: false, error: "id_campanha é obrigatório." }, { status: 400 });
  }
  if (!observacao) {
    return NextResponse.json({ ok: false, error: "observação é obrigatória." }, { status: 400 });
  }

  const context = await resolveCampanhasRequestContext();
  const result = await forwardToN8n({
    key: "add_note",
    method: "POST",
    payload: {
      id_campanha: idCampanha,
      observacao,
      utm_campanha: asNullableString(payload.utm_campanha),
      valor: asNullableNumber(payload.valor),
      id_organizacao: context.organizacaoId,
      id_usuario: context.usuarioId,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "Falha ao salvar observação.",
      },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
  });
}
