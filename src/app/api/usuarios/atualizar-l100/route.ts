import { NextResponse, type NextRequest } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

type AtualizarL100Payload = {
  id_usuario?: number | string | null;
  user_id?: number | string | null;
  id?: number | string | null;
  valor?: number | string | null;
  l100?: number | string | null;
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

function asInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/usuarios");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as AtualizarL100Payload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const idUsuario =
    asPositiveInt(payload.id_usuario) ?? asPositiveInt(payload.user_id) ?? asPositiveInt(payload.id);
  const valor = asInteger(payload.valor ?? payload.l100);

  if (!idUsuario) {
    return NextResponse.json({ ok: false, error: "id_usuario obrigatorio." }, { status: 400 });
  }

  if (valor === null) {
    return NextResponse.json({ ok: false, error: "valor obrigatorio e inteiro." }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("l100")
      .update({
        valor,
      })
      .eq("usuario_id", idUsuario)
      .select("id,usuario_id,valor")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao atualizar valor na tabela l100.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Registro l100 nao encontrado para este usuario.",
        },
        { status: 404 },
      );
    }

    const updated = data as { id?: number; usuario_id?: number; valor?: number };

    return NextResponse.json({
      ok: true,
      id: updated.id ?? null,
      usuario_id: updated.usuario_id ?? idUsuario,
      valor: typeof updated.valor === "number" ? updated.valor : valor,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro interno ao atualizar l100." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/usuarios");
  if (guardResponse) {
    return guardResponse;
  }

  const search = request.nextUrl.searchParams;
  const idUsuario =
    asPositiveInt(search.get("id_usuario")) ??
    asPositiveInt(search.get("user_id")) ??
    asPositiveInt(search.get("id"));

  if (!idUsuario) {
    return NextResponse.json({ ok: false, error: "id_usuario obrigatorio." }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("l100")
      .select("id,usuario_id,valor")
      .eq("usuario_id", idUsuario)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao consultar valor na tabela l100.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Registro l100 nao encontrado para este usuario.",
        },
        { status: 404 },
      );
    }

    const row = data as { id?: number; usuario_id?: number; valor?: number };

    return NextResponse.json({
      ok: true,
      id: row.id ?? null,
      usuario_id: row.usuario_id ?? idUsuario,
      valor: typeof row.valor === "number" ? row.valor : 0,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro interno ao consultar l100." }, { status: 500 });
  }
}
