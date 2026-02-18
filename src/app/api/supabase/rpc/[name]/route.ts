import { type NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/services/supabase/server";

const ALLOWED_RPCS = new Set([
  "rpc_get_clientes_funil",
  "rpc_paginate_clientes",
  "filter3_campanhas_usuarios_por_etiquetas",
]);

function getRpcErrorStatus(error: unknown) {
  if (typeof error !== "object" || !error) {
    return 500;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  if (code === "42501") {
    return 403;
  }

  if (code.startsWith("22")) {
    return 400;
  }

  return 500;
}

function getRpcErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message ?? "Falha ao executar RPC");
  }

  return "Falha ao executar RPC";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;

  if (!ALLOWED_RPCS.has(name)) {
    return NextResponse.json({ error: "RPC não permitida" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const args = Object.fromEntries(searchParams.entries());

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc(name as never, args as never);

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: getRpcErrorMessage(error) },
      { status: getRpcErrorStatus(error) },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;

  if (!ALLOWED_RPCS.has(name)) {
    return NextResponse.json({ error: "RPC não permitida" }, { status: 403 });
  }

  const args = await request.json().catch(() => ({}));

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc(name as never, args as never);

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: getRpcErrorMessage(error) },
      { status: getRpcErrorStatus(error) },
    );
  }
}
