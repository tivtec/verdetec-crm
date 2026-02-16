import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";

type EditarEmpresaPayload = {
  id?: string | number | null;
  id_empresa?: string | number | null;
  nome?: string | null;
  endereco?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  status?: boolean | string | number | null;
  fone?: string | null;
  whatsapp?: string | null;
  link_ista?: string | null;
  email?: string | null;
  id_consistem?: number | string | null;
  id_usuario?: number | string | null;
};

function hasOwn(payload: object, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key);
}

function asString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function asNullableString(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

function asLimitedNullableString(value: unknown, maxLength: number) {
  const parsed = asNullableString(value);
  if (!parsed) {
    return null;
  }
  return parsed.slice(0, maxLength);
}

function asEmpresaId(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

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

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as EditarEmpresaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const id = asEmpresaId(payload.id) ?? asEmpresaId(payload.id_empresa);
  if (!id) {
    return NextResponse.json({ ok: false, error: "id obrigatorio." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};

  if (hasOwn(payload, "nome")) {
    const nome = asString(payload.nome).trim();
    if (!nome) {
      return NextResponse.json({ ok: false, error: "nome obrigatorio." }, { status: 400 });
    }
    updatePayload.nome = nome;
  }

  if (hasOwn(payload, "endereco")) {
    updatePayload.endereco = asNullableString(payload.endereco);
  }

  if (hasOwn(payload, "cnpj")) {
    updatePayload.cnpj = asLimitedNullableString(payload.cnpj, 18);
  }

  if (hasOwn(payload, "cep")) {
    updatePayload.cep = asLimitedNullableString(payload.cep, 9);
  }

  if (hasOwn(payload, "status")) {
    const status = asBoolean(payload.status);
    if (status === null) {
      return NextResponse.json({ ok: false, error: "status invalido." }, { status: 400 });
    }
    updatePayload.status = status;
  }

  if (hasOwn(payload, "fone")) {
    updatePayload.fone = asNullableString(payload.fone);
  }

  if (hasOwn(payload, "whatsapp")) {
    updatePayload.whatsapp = asNullableString(payload.whatsapp);
  }

  if (hasOwn(payload, "link_ista")) {
    updatePayload.link_ista = asNullableString(payload.link_ista);
  }

  if (hasOwn(payload, "email")) {
    updatePayload.email = asNullableString(payload.email);
  }

  if (hasOwn(payload, "id_consistem")) {
    updatePayload.id_consistem = asPositiveInt(payload.id_consistem);
  }

  if (hasOwn(payload, "id_usuario")) {
    updatePayload.id_usuario = asPositiveInt(payload.id_usuario);
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ ok: true, empresa: { id }, skipped: true });
  }

  updatePayload.updated_at = new Date().toISOString();

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("empresa")
      .update(updatePayload)
      .eq("id", id)
      .select("id,nome,id_usuario,id_consistem,status")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error: "Conflito de campo unico (ex: CNPJ duplicado).",
            details: error.message,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao atualizar empresa no Supabase.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Empresa nao encontrada para atualizacao." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, empresa: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro interno ao atualizar empresa." }, { status: 500 });
  }
}
