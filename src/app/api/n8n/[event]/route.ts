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
    return NextResponse.json({ error: "Evento invalido" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  try {
    if (event === "lead-created") {
      const admin = createAdminSupabaseClient();
      const row = {
        nome: (payload.nome as string | undefined) ?? "Lead sem nome",
        email: (payload.email as string | undefined) ?? null,
        telefone: (payload.telefone as string | undefined) ?? null,
        telefone_webhook: (payload.telefone as string | undefined) ?? null,
        tipo_pessoa: "lead_portal",
        data_criacao: new Date().toISOString(),
        id_organizacao: (payload.id_organizacao as string | undefined) ?? null,
      };

      const { error } = await admin.from("pessoa").insert(row);

      if (error) {
        throw error;
      }
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
