"use client";

import { useEffect } from "react";

import {
  removeCompanyChannel,
  subscribeToAgendaUpdates,
  subscribeToCompanyLeads,
  subscribeToFunilUpdates,
} from "@/services/realtime/channels";

type UseCompanyRealtimeInput = {
  companyId: string;
  onLead?: (payload: unknown) => void;
  onFunil?: (payload: unknown) => void;
  onAgenda?: (payload: unknown) => void;
};

export function useCompanyRealtime({
  companyId,
  onLead,
  onFunil,
  onAgenda,
}: UseCompanyRealtimeInput) {
  useEffect(() => {
    const leadChannel = onLead ? subscribeToCompanyLeads(companyId, onLead) : null;
    const funilChannel = onFunil ? subscribeToFunilUpdates(companyId, onFunil) : null;
    const agendaChannel = onAgenda ? subscribeToAgendaUpdates(companyId, onAgenda) : null;

    return () => {
      if (leadChannel) {
        removeCompanyChannel(leadChannel);
      }
      if (funilChannel) {
        removeCompanyChannel(funilChannel);
      }
      if (agendaChannel) {
        removeCompanyChannel(agendaChannel);
      }
    };
  }, [companyId, onAgenda, onFunil, onLead]);
}
