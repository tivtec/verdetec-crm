import { type NextRequest, NextResponse } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

import { asNullableString, resolveCampanhasRequestContext } from "../_shared";

type UpdateCampanhaPayload = {
  id?: unknown;
  apelido?: unknown;
  nome_campanha?: unknown;
  texto_chave?: unknown;
};

export async function PUT(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/campanhas");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as UpdateCampanhaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const id = asNullableString(payload.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "id obrigatorio." }, { status: 400 });
  }

  const apelido = asNullableString(payload.apelido);
  const nomeCampanha = asNullableString(payload.nome_campanha);
  const textoChave = asNullableString(payload.texto_chave);

  const updatePayload: Record<string, unknown> = {
    apelido,
    nome_campanha: nomeCampanha,
    texto_chave: textoChave,
  };

  const context = await resolveCampanhasRequestContext();
  const admin = createAdminSupabaseClient();

  let query = admin.from("campanhas").update(updatePayload).eq("id", Number(id));
  const organizacaoId = asNullableString(context.organizacaoId);
  if (organizacaoId) {
    query = query.eq("id_organizacao", organizacaoId);
  }

  const { data, error } = await query.select("id,nome_campanha,apelido,texto_chave").maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Falha ao atualizar campanha.",
      },
      { status: 502 },
    );
  }

  const row = data as Record<string, unknown>;
  return NextResponse.json({
    ok: true,
    row: {
      id: String(row.id ?? ""),
      nomeCampanha: asNullableString(row.nome_campanha) ?? "",
      apelido: asNullableString(row.apelido) ?? "",
      textoChave: asNullableString(row.texto_chave) ?? "",
    },
  });
}
