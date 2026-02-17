import { NextResponse, type NextRequest } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

type AtualizarStatusUsuarioPayload = {
  id_usuario?: number | string | null;
  user_id?: number | string | null;
  id?: number | string | null;
  usuario_ativo?: boolean | string | number | null;
  ativo?: boolean | string | number | null;
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
  const guardResponse = await guardApiRouteAccess("/usuarios");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as AtualizarStatusUsuarioPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const idUsuario =
    asPositiveInt(payload.id_usuario) ?? asPositiveInt(payload.user_id) ?? asPositiveInt(payload.id);
  const usuarioAtivo = asBoolean(payload.usuario_ativo ?? payload.ativo);

  if (!idUsuario) {
    return NextResponse.json({ ok: false, error: "id_usuario obrigatorio." }, { status: 400 });
  }

  if (usuarioAtivo === null) {
    return NextResponse.json({ ok: false, error: "usuario_ativo obrigatorio." }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("usuarios")
      .update({ usuario_ativo: usuarioAtivo })
      .eq("id", idUsuario)
      .select("id,usuario_ativo")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao atualizar status no Supabase.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Usuario nao encontrado para atualizacao.",
        },
        { status: 404 },
      );
    }

    const updated = data as { id?: number; usuario_ativo?: boolean };

    return NextResponse.json({
      ok: true,
      id: updated.id ?? idUsuario,
      usuario_ativo: typeof updated.usuario_ativo === "boolean" ? updated.usuario_ativo : usuarioAtivo,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro interno ao atualizar status do usuario." },
      { status: 500 },
    );
  }
}
