import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";

type UpdateNomePayload = {
  id_pessoa?: number | string | null;
  pessoa_id?: number | string | null;
  nome?: string | number | null;
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

function asNome(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as UpdateNomePayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const idPessoa = asPositiveInt(payload.id_pessoa) ?? asPositiveInt(payload.pessoa_id);
  const nome = asNome(payload.nome);

  if (!idPessoa) {
    return NextResponse.json({ ok: false, error: "id_pessoa obrigatorio." }, { status: 400 });
  }

  if (!nome) {
    return NextResponse.json({ ok: false, error: "Nome obrigatorio." }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("pessoa")
      .update({ nome })
      .eq("id", idPessoa)
      .select("id,nome")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Falha ao atualizar nome do cliente.", details: error.message },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Cliente nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      id_pessoa: asPositiveInt((data as Record<string, unknown>).id) ?? idPessoa,
      nome: asNome((data as Record<string, unknown>).nome) || nome,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro ao atualizar nome do cliente." }, { status: 502 });
  }
}
