import type { RealtimeChannel } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/services/supabase/client";

export type CompanyRealtimeTopic = "leads" | "funil" | "agenda";

export function companyChannelName(companyId: string, topic: CompanyRealtimeTopic) {
  return `company:${companyId}:${topic}`;
}

export function subscribeToCompanyLeads(
  companyId: string,
  callback: (payload: unknown) => void,
) {
  const client = createBrowserSupabaseClient();
  const channel = client
    .channel(companyChannelName(companyId, "leads"))
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "leads",
        filter: `company_id=eq.${companyId}`,
      },
      callback,
    );

  channel.subscribe();
  return channel;
}

export function subscribeToFunilUpdates(
  companyId: string,
  callback: (payload: unknown) => void,
) {
  const client = createBrowserSupabaseClient();
  const channel = client
    .channel(companyChannelName(companyId, "funil"))
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pipeline_histories",
        filter: `company_id=eq.${companyId}`,
      },
      callback,
    );

  channel.subscribe();
  return channel;
}

export function subscribeToAgendaUpdates(
  companyId: string,
  callback: (payload: unknown) => void,
) {
  const client = createBrowserSupabaseClient();
  const channel = client
    .channel(companyChannelName(companyId, "agenda"))
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "agenda_events",
        filter: `company_id=eq.${companyId}`,
      },
      callback,
    );

  channel.subscribe();
  return channel;
}

export function removeCompanyChannel(channel: RealtimeChannel) {
  const client = createBrowserSupabaseClient();
  return client.removeChannel(channel);
}
