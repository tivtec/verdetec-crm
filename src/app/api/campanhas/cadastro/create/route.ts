import { type NextRequest, NextResponse } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

import { asNullableString, resolveCampanhasRequestContext } from "../_shared";

type CreateCampanhaPayload = {
  apelido?: unknown;
  nome_campanha?: unknown;
  texto_chave?: unknown;
};

export async function POST(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/campanhas");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as CreateCampanhaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const apelido = asNullableString(payload.apelido);
  const nomeCampanha = asNullableString(payload.nome_campanha);
  const textoChave = asNullableString(payload.texto_chave);

  if (!apelido || !nomeCampanha) {
    return NextResponse.json(
      { ok: false, error: "Campos obrigatorios: apelido e nome_campanha." },
      { status: 400 },
    );
  }

  const context = await resolveCampanhasRequestContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("campanhas")
    .insert({
      nome_campanha: nomeCampanha,
      apelido,
      texto_chave: textoChave,
      id_organizacao: asNullableString(context.organizacaoId),
    })
    .select("id,nome_campanha,apelido,texto_chave")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Falha ao criar campanha.",
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
