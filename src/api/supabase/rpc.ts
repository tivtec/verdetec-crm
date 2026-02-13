export async function callRpc<T>(name: string, args?: Record<string, unknown>) {
  const response = await fetch(`/api/supabase/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args ?? {}),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RPC ${name} failed: ${response.status} - ${body}`);
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}
