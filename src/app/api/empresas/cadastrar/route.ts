import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

type CadastrarEmpresaPayload = {
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

async function resolveCurrentOrganizacaoId() {
  try {
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
      .select("id_organizacao")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return asNullableString((data as Record<string, unknown>).id_organizacao);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as CadastrarEmpresaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const nome = asString(payload.nome).trim();
  if (!nome) {
    return NextResponse.json({ ok: false, error: "nome obrigatorio." }, { status: 400 });
  }

  const status = asBoolean(payload.status) ?? true;
  const idUsuario = asPositiveInt(payload.id_usuario);
  const idConsistem = asPositiveInt(payload.id_consistem);
  const organizacaoId = await resolveCurrentOrganizacaoId();

  try {
    const admin = createAdminSupabaseClient();
    const insertPayload: Record<string, unknown> = {
      nome,
      endereco: asNullableString(payload.endereco),
      cnpj: asLimitedNullableString(payload.cnpj, 18),
      cep: asLimitedNullableString(payload.cep, 9),
      status,
      fone: asNullableString(payload.fone),
      whatsapp: asNullableString(payload.whatsapp),
      link_ista: asNullableString(payload.link_ista),
      email: asNullableString(payload.email),
      id_usuario: idUsuario,
      id_consistem: idConsistem,
      updated_at: new Date().toISOString(),
    };

    if (organizacaoId) {
      insertPayload.id_organizacao = organizacaoId;
    }

    const { data, error } = await admin
      .from("empresa")
      .insert(insertPayload)
      .select("id,nome,id_usuario,id_consistem,status")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error: "Empresa ja cadastrada (campo unico duplicado, ex: CNPJ).",
            details: error.message,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao cadastrar empresa no Supabase.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Cadastro nao retornou dados da empresa criada." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, empresa: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro interno ao cadastrar empresa." }, { status: 500 });
  }
}
