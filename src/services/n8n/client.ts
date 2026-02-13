const N8N_ENDPOINTS = {
  "lead-created": "/webhook/lead-created",
  "update-etiqueta": "/webhook/update-etiqueta",
  "send-notification": "/webhook/send-notification",
} as const;

export type N8nEvent = keyof typeof N8N_ENDPOINTS;

type TriggerInput = {
  event: N8nEvent;
  payload: Record<string, unknown>;
};

export async function triggerN8nWebhook({ event, payload }: TriggerInput) {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!baseUrl || !secret) {
    throw new Error("Missing N8N_WEBHOOK_BASE_URL or N8N_WEBHOOK_SECRET");
  }

  const response = await fetch(`${baseUrl}${N8N_ENDPOINTS[event]}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`n8n webhook failed: ${response.status} - ${body}`);
  }

  return response.json().catch(() => ({ ok: true }));
}
