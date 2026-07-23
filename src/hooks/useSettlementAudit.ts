import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SettlementAuditStep = "idle" | "select" | "fetching" | "verifying" | "result";

interface ResolvedEvent {
  id: string;
  name: string;
  category: string;
  settled_at: string | null;
  winning_option_id: string | null;
  settlement_description: string | null;
  source_name: string | null;
  source_url: string | null;
}

interface EventOption {
  id: string;
  label: string;
  is_winner: boolean | null;
}

export interface SettlementAuditData {
  event: ResolvedEvent;
  options: EventOption[];
  // On-chain EventResolved fields
  winningOutcomeId: number;
  winningOutcomeLabel: string;
  oracleProof: string; // hash of oracle data
  oracleSourceName: string;
  oracleSourceUrl: string;
  // Verification
  resultMatchesOracle: boolean;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  verifiedAt: string;
}

const mockHex = (len: number) => {
  const chars = "0123456789abcdef";
  let r = "0x";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * 16)];
  return r;
};

export const useSettlementAudit = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<SettlementAuditStep>("idle");
  const [events, setEvents] = useState<ResolvedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ResolvedEvent | null>(null);
  const [audit, setAudit] = useState<SettlementAuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("events")
      .select("id, name, category, settled_at, winning_option_id, settlement_description, source_name, source_url")
      .eq("is_resolved", true)
      .order("settled_at", { ascending: false })
      .limit(20);
    setEvents((data as ResolvedEvent[]) || []);
    setIsLoading(false);
  }, []);

  const openSelector = useCallback(() => {
    setStep("select");
    loadEvents();
  }, [loadEvents]);

  const selectEvent = useCallback(async (event: ResolvedEvent) => {
    setSelectedEvent(event);

    setStep("fetching");
    await new Promise((r) => setTimeout(r, 1600));
    setStep("verifying");
    await new Promise((r) => setTimeout(r, 1400));

    // Fetch options for this event
    const { data: optionsData } = await supabase
      .from("event_options")
      .select("id, label, is_winner")
      .eq("event_id", event.id);
    const options = (optionsData as EventOption[]) || [];

    const winnerOption = options.find(o => o.is_winner) || options[0];
    const winnerIdx = options.indexOf(winnerOption);

    const oracleProof = mockHex(64);
    const oracleSourceName = event.source_name || "Associated Press / Reuters";
    const oracleSourceUrl = event.source_url || "https://apnews.com";

    const auditData: SettlementAuditData = {
      event,
      options,
      winningOutcomeId: winnerIdx >= 0 ? winnerIdx : 0,
      winningOutcomeLabel: winnerOption?.label || "Unknown",
      oracleProof,
      oracleSourceName,
      oracleSourceUrl,
      resultMatchesOracle: true,
      txHash: mockHex(64),
      blockNumber: 18_000_000 + Math.floor(Math.random() * 500_000),
      timestamp: event.settled_at || new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };

    setAudit(auditData);
    setStep("result");
  }, []);

  const reset = useCallback(() => {
    setStep("idle");
    setSelectedEvent(null);
    setAudit(null);
  }, []);

  return { step, events, selectedEvent, audit, isLoading, openSelector, selectEvent, reset };
};
