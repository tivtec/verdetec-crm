import { type NextRequest, NextResponse } from "next/server";

import { triggerN8nWebhook, type N8nEvent } from "@/services/n8n/client";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

const allowedEvents = new Set<N8nEvent>([
  "lead-created",
  "update-etiqueta",
  "send-notification",
]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ event: string }> },
) {
  const { event } = await context.params;

  if (!allowedEvents.has(event as N8nEvent)) {
    return NextResponse.json({ error: "Evento inválido" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    if (event === "lead-created") {
      const admin = createAdminSupabaseClient();

      await admin.from("leads").insert({
        company_id:
          (payload.company_id as string | undefined) ||
          "00000000-0000-0000-0000-000000000000",
        nome: (payload.nome as string) ?? "Lead sem nome",
        email: (payload.email as string | undefined) ?? null,
        telefone: (payload.telefone as string | undefined) ?? null,
        origem: "portal",
        status: "provisorio",
      });
    }

    const result = await triggerN8nWebhook({
      event: event as N8nEvent,
      payload,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao processar webhook",
      },
      { status: 500 },
    );
  }
}
