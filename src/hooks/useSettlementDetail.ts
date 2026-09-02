import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { parseSideLabels } from "@/lib/eventUtils";
import { orphanSpotSideLabels } from "@/lib/orphanSpotSideLabels";

export interface TradeRecord {
  id: string;
  time: string;
  action: string;
  qty: number;
  price: number;
  total: number;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface SettlementData {
  id: string;
  event: string;
  option: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  margin: number;
  fee: number;
  pnl: number;
  pnlPercent: number;
  settledAt: string;
  openedAt: string;
  result: "win" | "lose";
  trades: TradeRecord[];
  /** REAL recorded prices only — empty when the market has no history stored. */
  priceHistory: PricePoint[];
  /** Single-market binary 别名（如体育队名）。其它事件为 undefined。 */
  sideLabels?: { yes: string; no: string };
  /** 4B: drives spot branches (hide leverage / funding / position value). */
  productLine: "futures" | "spot";
  /** Why the position left the book. */
  closeReason: "settlement" | "cashout" | "auto_close";
  /** Event id for "View event" links, when resolvable. */
  eventId?: string | null;
  /** True when the event resolved and this leg is the winning outcome. */
  outcomeWon: boolean;
}

interface UseSettlementDetailOptions {
  settlementId?: string;
  eventName?: string; // Support querying by event name
}

export const useSettlementDetail = ({ settlementId, eventName }: UseSettlementDetailOptions) => {
  const { user } = useUserProfile();

  return useQuery({
    queryKey: ["settlement-detail", settlementId, eventName, user?.id],
    queryFn: async (): Promise<SettlementData | null> => {
      if ((!settlementId && !eventName) || !user) return null;

      let position: any = null;

      if (settlementId) {
        const { data } = await supabase
          .from("positions")
          .select("*")
          .eq("id", settlementId)
          .eq("user_id", user.id)
          .maybeSingle();
        position = data;
      }

      if (!position && (eventName || settlementId)) {
        // Router params arrive decoded — decoding again breaks titles with `%`.
        const searchName = eventName || settlementId || "";

        const { data } = await supabase
          .from("positions")
          .select("*")
          .eq("user_id", user.id)
          .eq("event_name", searchName)
          .eq("status", "Closed")
          .order("closed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        position = data;
      }

      if (!position) return null;

      // Fill ledger for the ACTIVITY block.
      const { data: relatedTrades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_name", position.event_name)
        .eq("option_label", position.option_label)
        .order("created_at", { ascending: true });

      // Event row: side aliases + resolution truth.
      const { data: eventData } = await supabase
        .from("events")
        .select("id, side_labels, is_resolved, winning_option_id")
        .eq("name", position.event_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sideLabels = orphanSpotSideLabels(
        position.product_line,
        parseSideLabels((eventData as any)?.side_labels),
        position.option_label,
      );

      // REAL price history only — no synthesis. When the option has no stored
      // series the detail page renders without a chart.
      let priceHistory: PricePoint[] = [];
      if (position.option_id) {
        const { data: historyData } = await supabase
          .from("price_history")
          .select("price, recorded_at")
          .eq("option_id", position.option_id)
          .gte("recorded_at", position.created_at)
          .order("recorded_at", { ascending: true });
        priceHistory = (historyData ?? []).map((h: any) => ({
          date: h.recorded_at,
          price: Number(h.price),
        }));
      }

      const fills = relatedTrades ?? [];
      const firstSide = fills[0]?.side;
      const trades: TradeRecord[] = fills.map((trade: any, index: number) => ({
        id: trade.id,
        time: trade.created_at,
        action: index === 0 ? "Open" : trade.side === firstSide ? "Add" : "Reduce",
        qty: Number(trade.quantity),
        price: Number(trade.price),
        total: Number(trade.amount),
      }));

      const closeReason: SettlementData["closeReason"] =
        position.close_reason === "cashout" || position.close_reason === "auto_close"
          ? position.close_reason
          : "settlement";

      const entryPrice = Number(position.entry_price) || 0;
      // Exit price = the recorded close. For a settled binary that IS the
      // resolution value ($1 winner / $0 loser) written at settlement time —
      // never guessed from the sign of PnL.
      const exitPrice = Number(position.mark_price) || 0;
      const size = Number(position.size) || 0;
      const margin = Number(position.margin) || 0;
      const pnl = Number(position.pnl) || 0;
      const fee = fills.reduce((sum: number, t: any) => sum + (Number(t.fee) || 0), 0);
      const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;

      const outcomeWon =
        closeReason === "settlement" && !!(eventData as any)?.is_resolved && exitPrice >= 1;

      return {
        id: position.id,
        event: position.event_name,
        option: position.option_label,
        side: position.side === "short" ? "short" : "long",
        entryPrice,
        exitPrice,
        size,
        leverage: Number(position.leverage) || 1,
        margin,
        fee,
        pnl,
        pnlPercent,
        settledAt: position.closed_at ?? position.updated_at,
        openedAt: position.created_at,
        result: pnl > 0 ? "win" : "lose",
        trades,
        priceHistory,
        sideLabels,
        productLine: position.product_line === "spot" ? "spot" : "futures",
        closeReason,
        eventId: (eventData as any)?.id ?? null,
        outcomeWon,
      };
    },
    enabled: (!!settlementId || !!eventName) && !!user,
  });
};
