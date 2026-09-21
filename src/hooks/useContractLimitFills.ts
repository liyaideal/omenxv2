// ============================================================
// 交易页收尾 #1 · DEMO-STATE touch fill for resting futures Buy · Limit orders.
// Mounted on both /trade shells (DesktopTrading, mobile TradingCharts) so a
// resting order fills whichever surface the user is watching. Mirrors the
// spot sweep in useSpotTerminal: mark ≤ limit → fillContractLimitOrder,
// entry = limit, toast `Limit buy filled at your price`.
// ============================================================
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { fillContractLimitOrder } from "@/services/tradingService";
import type { UnifiedOrder } from "@/hooks/useOrders";

interface Args {
  userId: string | null | undefined;
  eventName: string | null | undefined;
  orders: UnifiedOrder[];
  /** Live mark for an option label of the current event. */
  markFor: (optionLabel: string) => number;
  refetchOrders: () => void;
  refetchPositions: () => void;
}

export const useContractLimitFills = ({ userId, eventName, orders, markFor, refetchOrders, refetchPositions }: Args) => {
  const filling = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!userId || !eventName) return;
    for (const o of orders) {
      if (!o.id || o.reduceOnly || o.status !== "Pending" || o.orderType !== "Limit" || o.type !== "buy") continue;
      if (o.event !== eventName || (o.productLine ?? "futures") === "spot") continue;
      if (filling.current.has(o.id)) continue;
      const limit = parseFloat(String(o.price).replace(/[$,]/g, "")) || 0;
      const mark = markFor(o.option);
      if (!(limit > 0) || !(mark > 0) || mark > limit + 1e-9) continue;
      const id = o.id;
      filling.current.add(id);
      (async () => {
        try {
          const res = await fillContractLimitOrder(userId, id);
          if (res.intent !== "noop") {
            toast.success("Limit buy filled at your price");
            refetchOrders();
            refetchPositions();
          }
        } catch {
          // realtime tick retries on the next pass
        } finally {
          filling.current.delete(id);
        }
      })();
    }
  }, [userId, eventName, orders, markFor, refetchOrders, refetchPositions]);
};
