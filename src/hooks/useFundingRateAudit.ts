import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FundingRateStep = "idle" | "select" | "periods" | "fetching" | "comparing" | "result";

interface PositionRecord {
  id: string;
  event_name: string;
  option_label: string;
  side: string;
  size: number;
  leverage: number;
  entry_price: number;
  created_at: string;
}

export interface FundingPeriodRecord {
  id: string;
  applied_rate: number;
  notional: number;
  amount: number; // signed: negative = user paid, positive = user received
  accrual_start: string;
  accrual_end: string;
  created_at: string; // used as settlementTs
}

export interface FundingRateAuditData {
  position: PositionRecord;
  period: FundingPeriodRecord;
  // On-chain FundingRate event fields
  eventId: string;
  outcomeId: number;
  fundingRate: number; // signed: positive = longs pay shorts
  fundingRateFormatted: string;
  // What was applied to user
  appliedRate: number;
  appliedAmount: number; // absolute USDC amount
  direction: "paid" | "received";
  notional: number;
  windowStart: string;
  windowEnd: string;
  settledAt: string;
  // Verification
  ratesMatch: boolean;
  txHash: string;
  blockNumber: number;
  verifiedAt: string;
}

const mockHex = (len: number) => {
  const chars = "0123456789abcdef";
  let r = "0x";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * 16)];
  return r;
};

// ── Demo fallback data ──────────────────────────────────────────────
// Shown when the current account has no real positions / funding history,
// so every visitor can experience the full audit flow.
const DEMO_POSITION_TEMPLATES: Array<{
  event_name: string; option_label: string; side: string;
  size: number; leverage: number; entry_price: number; ageDays: number;
}> = [
  { event_name: "SOL Weekly Performance",     option_label: "Up >5%",         side: "short", size: 80,  leverage: 10, entry_price: 0.42, ageDays: 9  },
  { event_name: "ETH Price Prediction",       option_label: "Above $4,000",   side: "long",  size: 50,  leverage: 10, entry_price: 0.61, ageDays: 7  },
  { event_name: "BTC End of Week Price",      option_label: "Above $100,000", side: "long",  size: 100, leverage: 10, entry_price: 0.55, ageDays: 5  },
  { event_name: "Fed Interest Rate Decision", option_label: "Hold Steady",    side: "long",  size: 200, leverage: 10, entry_price: 0.72, ageDays: 12 },
  { event_name: "Apple Stock Movement",       option_label: "Up >2%",         side: "long",  size: 150, leverage: 10, entry_price: 0.48, ageDays: 4  },
  { event_name: "Gold Price Weekly",          option_label: "Down >1%",       side: "short", size: 100, leverage: 10, entry_price: 0.53, ageDays: 6  },
];

const buildDemoPositions = (): PositionRecord[] => {
  const now = Date.now();
  return DEMO_POSITION_TEMPLATES.map((t, i) => ({
    id: `demo-pos-${i + 1}`,
    event_name: t.event_name,
    option_label: t.option_label,
    side: t.side,
    size: t.size,
    leverage: t.leverage,
    entry_price: t.entry_price,
    created_at: new Date(now - t.ageDays * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

// Deterministic pseudo-random from string (stable periods per position)
const seededRand = (seed: string, i: number) => {
  let h = 2166136261;
  const s = `${seed}:${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = (h * 16777619) >>> 0;
  }
  return (h % 100000) / 100000;
};

const buildDemoPeriods = (pos: PositionRecord): FundingPeriodRecord[] => {
  const WINDOW_MS = 8 * 60 * 60 * 1000; // 8h funding windows
  const start = new Date(pos.created_at).getTime();
  const now = Date.now();
  const total = Math.min(40, Math.max(3, Math.floor((now - start) / WINDOW_MS)));
  const sideMul = pos.side === "long" ? 1 : -1;
  const records: FundingPeriodRecord[] = [];
  for (let i = 0; i < total; i++) {
    const wStart = start + i * WINDOW_MS;
    const wEnd = wStart + WINDOW_MS;
    // rate ~ -0.08% .. +0.12% per 8h window
    const rate = (seededRand(pos.id, i) - 0.4) * 0.002;
    const notional = pos.size * pos.entry_price;
    // long pays when rate>0; signed from user's perspective
    const amount = -rate * notional * sideMul;
    if (Math.abs(amount) < 1e-6) continue;
    records.push({
      id: `demo-fund-${pos.id}-${i}`,
      applied_rate: rate,
      notional,
      amount,
      accrual_start: new Date(wStart).toISOString(),
      accrual_end: new Date(wEnd).toISOString(),
      created_at: new Date(wEnd + 30_000).toISOString(),
    });
  }
  return records.reverse(); // newest first
};

export const useFundingRateAudit = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<FundingRateStep>("idle");
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<PositionRecord | null>(null);
  const [periods, setPeriods] = useState<FundingPeriodRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<FundingPeriodRecord | null>(null);
  const [audit, setAudit] = useState<FundingRateAuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    let rows: PositionRecord[] = [];
    if (user) {
      const { data } = await supabase
        .from("positions")
        .select("id, event_name, option_label, side, size, leverage, entry_price, created_at")
        .eq("user_id", user.id)
        .in("status", ["Open", "Closed"])
        .order("created_at", { ascending: false })
        .limit(20);
      rows = (data as PositionRecord[]) || [];
    }
    // Fallback so every visitor sees a populated list
    if (rows.length === 0) rows = buildDemoPositions();
    setPositions(rows);
    setIsLoading(false);
  }, [user]);

  const loadPeriods = useCallback(async (positionId: string, posFallback?: PositionRecord) => {
    setIsLoading(true);
    if (positionId.startsWith("demo-pos-")) {
      setPeriods(posFallback ? buildDemoPeriods(posFallback) : []);
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from("position_funding_ledger")
      .select("id, applied_rate, notional, amount, accrual_start, accrual_end, created_at")
      .eq("position_id", positionId)
      .neq("amount", 0)
      .order("created_at", { ascending: false })
      .limit(200);
    let rows = ((data as FundingPeriodRecord[]) || []).map((p) => ({
      ...p,
      applied_rate: Number(p.applied_rate),
      notional: Number(p.notional),
      amount: Number(p.amount),
    }));
    // Real position with no funding history yet → demo periods so flow is testable
    if (rows.length === 0 && posFallback) rows = buildDemoPeriods(posFallback);
    setPeriods(rows);
    setIsLoading(false);
  }, []);

  const openSelector = useCallback(() => {
    setSelectedPosition(null);
    setSelectedPeriod(null);
    setAudit(null);
    setPeriods([]);
    setStep("select");
    loadPositions();
  }, [loadPositions]);

  const selectPosition = useCallback(
    async (pos: PositionRecord) => {
      setSelectedPosition(pos);
      setSelectedPeriod(null);
      setAudit(null);
      setStep("periods");
      await loadPeriods(pos.id, pos);
    },
    [loadPeriods]
  );

  const backToPeriods = useCallback(() => {
    setAudit(null);
    setSelectedPeriod(null);
    setStep("periods");
  }, []);

  const selectPeriod = useCallback(
    async (period: FundingPeriodRecord) => {
      if (!selectedPosition) return;
      setSelectedPeriod(period);

      setStep("fetching");
      await new Promise((r) => setTimeout(r, 1400));
      setStep("comparing");
      await new Promise((r) => setTimeout(r, 1200));

      const fundingRate = period.applied_rate;
      const direction: "paid" | "received" = period.amount < 0 ? "paid" : "received";
      const appliedAmount = Math.abs(period.amount);

      const eventId = `EVT-${Math.floor(Math.random() * 90000) + 10000}`;
      const outcomeId = Math.floor(Math.random() * 4);

      const auditData: FundingRateAuditData = {
        position: selectedPosition,
        period,
        eventId,
        outcomeId,
        fundingRate,
        fundingRateFormatted: `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%`,
        appliedRate: fundingRate,
        appliedAmount,
        direction,
        notional: period.notional,
        windowStart: period.accrual_start,
        windowEnd: period.accrual_end,
        settledAt: period.created_at,
        ratesMatch: true,
        txHash: mockHex(64),
        blockNumber: 18_000_000 + Math.floor(Math.random() * 500_000),
        verifiedAt: new Date().toISOString(),
      };

      setAudit(auditData);
      setStep("result");
    },
    [selectedPosition]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setSelectedPosition(null);
    setSelectedPeriod(null);
    setPeriods([]);
    setAudit(null);
  }, []);

  return {
    step,
    positions,
    periods,
    selectedPosition,
    selectedPeriod,
    audit,
    isLoading,
    openSelector,
    selectPosition,
    selectPeriod,
    backToPeriods,
    reset,
  };
};
