"use client";

import { useEffect } from "react";

import { type RealtimeChannel } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/services/supabase/client";

type UseRealtimeChannelInput = {
  channelName: string;
  onSubscribe?: (channel: RealtimeChannel) => void;
  onCleanup?: (channel: RealtimeChannel) => void;
};

export function useRealtimeChannel({
  channelName,
  onSubscribe,
  onCleanup,
}: UseRealtimeChannelInput) {
  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client.channel(channelName);

    onSubscribe?.(channel);
    channel.subscribe();

    return () => {
      onCleanup?.(channel);
      client.removeChannel(channel);
    };
  }, [channelName, onCleanup, onSubscribe]);
}
