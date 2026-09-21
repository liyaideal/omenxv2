// ============================================================
// DK-1 · Order gating for the Pro contract terminal (/trade, /trade/order,
// desktop /trade). Mirrors the Lite contract page exactly:
//   resolved → "Settled" · lifecycle REVIEW → "In review" ·
//   lifecycle SUSPENDED → "Suspended · cancel only" (交易页收尾 #5, same wording
//   as spot; open orders stay cancellable) · past freeze_time or end_date →
//   "Closed". Nothing else blocks.
// Spot keeps its own gate in useSpotTerminal (lifecycle states + freeze).
// ============================================================
import { useEffect, useState } from "react";
import type { TradingEvent } from "@/hooks/useEvents";

export interface ContractGate {
  blocked: boolean;
  /** CTA / dock text while blocked; "" when orderable. */
  reason: string;
}

export const contractGate = (event: TradingEvent | null | undefined, now: number = Date.now()): ContractGate => {
  if (!event) return { blocked: false, reason: "" };
  if (event.isResolved) return { blocked: true, reason: "Settled" };
  if (event.lifecycle === "REVIEW") return { blocked: true, reason: "In review" };
  if (event.lifecycle === "SUSPENDED") return { blocked: true, reason: "Suspended · cancel only" };
  const freezeAt = event.freezeTime?.getTime();
  const endAt = event.endTime?.getTime();
  if ((freezeAt && freezeAt <= now) || (endAt && endAt <= now)) return { blocked: true, reason: "Closed" };
  return { blocked: false, reason: "" };
};

/** Re-evaluates the gate every `tickMs` so a freeze that lands mid-view is picked up. */
export const useContractGate = (event: TradingEvent | null | undefined, tickMs = 15000): ContractGate => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(t);
  }, [tickMs]);
  return contractGate(event, now);
};
