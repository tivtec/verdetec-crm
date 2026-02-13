export async function triggerWebhook(
  event: "lead-created" | "update-etiqueta" | "send-notification",
  payload: Record<string, unknown>,
) {
  const response = await fetch(`/api/n8n/${event}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
