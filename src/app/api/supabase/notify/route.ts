import { type NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/services/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const channel = body.channel as string | undefined;
  const message = body.message as Record<string, unknown> | undefined;

  if (!channel || !message) {
    return NextResponse.json({ error: "channel e message são obrigatórios" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("rpc_notify_channel", {
      p_channel: channel,
      p_payload: message,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no notify" },
      { status: 500 },
    );
  }
}
