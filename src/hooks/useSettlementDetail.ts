import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { parseSideLabels } from "@/lib/eventUtils";

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
  priceHistory: PricePoint[];
  /** Single-market binary 别名（如体育队名）。其它事件为 undefined。 */
  sideLabels?: { yes: string; no: string };
  /** 4B: drives spot branches (hide leverage / funding / position value). */
  productLine: "futures" | "spot";
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

      let mainTrade: any = null;

      if (settlementId) {
        // Try fetching by ID first
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("id", settlementId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching settlement by id:", error);
        }
        mainTrade = data;
      }

      // If not found by ID, try by event name
      if (!mainTrade && (eventName || settlementId)) {
        const searchName = eventName || decodeURIComponent(settlementId || "");
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .eq("event_name", searchName)
          .not("closed_at", "is", null)
          .order("closed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching settlement by event name:", error);
        }
        mainTrade = data;
      }

      if (!mainTrade) {
        return null;
      }

      // Fetch all related trades for the same event + option (trade history)
      const { data: relatedTrades, error: relatedError } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_name", mainTrade.event_name)
        .eq("option_label", mainTrade.option_label)
        .order("created_at", { ascending: true });

      if (relatedError) {
        console.error("Error fetching related trades:", relatedError);
      }

      // Fetch event to get event_id for price history (+ side_labels for alias display)
      const { data: eventData } = await supabase
        .from("events")
        .select("id, end_date, side_labels")
        .eq("name", mainTrade.event_name)
        .maybeSingle();

      const sideLabels = parseSideLabels((eventData as any)?.side_labels);

      // Fetch price history if we have event data
      let priceHistory: PricePoint[] = [];
      if (eventData?.id) {
        // Get option_id for this option_label
        const { data: optionData } = await supabase
          .from("event_options")
          .select("id")
          .eq("event_id", eventData.id)
          .eq("label", mainTrade.option_label)
          .maybeSingle();

        if (optionData?.id) {
          const { data: historyData } = await supabase
            .from("price_history")
            .select("price, recorded_at")
            .eq("option_id", optionData.id)
            .gte("recorded_at", mainTrade.created_at)
            .order("recorded_at", { ascending: true });

          if (historyData && historyData.length > 0) {
            priceHistory = historyData.map((h) => ({
              date: h.recorded_at,
              price: Number(h.price),
            }));
          }
        }
      }

      // If no price history, generate continuous mock data based on trade data
      if (priceHistory.length === 0) {
        const startDate = new Date(mainTrade.created_at);
        const endDate = mainTrade.closed_at ? new Date(mainTrade.closed_at) : new Date();
        const daysDiff = Math.max(7, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        const entryPrice = Number(mainTrade.price);
        const isWin = Number(mainTrade.pnl) > 0;
        const exitPrice = isWin ? 1.0 : 0.0; // Binary outcome
        
        // Generate smooth continuous path using bezier-like interpolation
        let currentPrice = entryPrice;
        priceHistory = Array.from({ length: daysDiff }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          // Create a realistic continuous price path
          const progress = i / (daysDiff - 1);
          const targetPrice = exitPrice;
          
          // Smooth transition with momentum - small step changes
          const targetDelta = (targetPrice - currentPrice) * 0.15;
          const noise = (Math.random() - 0.5) * 0.05;
          currentPrice = Math.max(0.01, Math.min(0.99, currentPrice + targetDelta + noise));
          
          // On last point, set to exact exit price
          if (i === daysDiff - 1) {
            currentPrice = exitPrice;
          }
          
          return {
            date: date.toISOString(),
            price: currentPrice,
          };
        });
      }

      // Build trade history with proper action labels
      const allTrades = relatedTrades || [mainTrade];
      const firstTradeSide = allTrades[0]?.side;
      
      const trades: TradeRecord[] = allTrades.map((trade, index) => {
        let action: string;
        
        if (index === 0) {
          action = "Open";
        } else if (trade.side === firstTradeSide) {
          // Same direction as initial trade = adding to position
          action = "Add";
        } else {
          // Opposite direction = reducing position
          action = "Reduce";
        }
        
        return {
          id: trade.id,
          time: trade.created_at,
          action,
          qty: Number(trade.quantity),
          price: Number(trade.price),
          total: Number(trade.amount),
        };
      });

      // Calculate aggregated values
      const totalQty = trades.reduce((sum, t) => sum + t.qty, 0);
      const totalCost = trades.reduce((sum, t) => sum + t.total, 0);
      const avgEntryPrice = totalQty > 0 ? totalCost / totalQty : Number(mainTrade.price);
      const totalFee = (relatedTrades || [mainTrade]).reduce((sum, t) => sum + Number(t.fee), 0);
      const totalMargin = (relatedTrades || [mainTrade]).reduce((sum, t) => sum + Number(t.margin), 0);
      const totalPnl = (relatedTrades || [mainTrade]).reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);

      // Determine exit price based on PnL
      // For binary markets: win = $1.00, lose = $0.00
      const isWin = totalPnl > 0;
      const exitPrice = isWin ? 1.0 : 0.0;
      
      // Calculate PnL percent based on margin
      const pnlPercent = totalMargin > 0 ? (totalPnl / totalMargin) * 100 : 0;

      // Determine side: buy = long, sell = short
      const side: "long" | "short" = mainTrade.side === "buy" ? "long" : "short";

      // Find earliest and latest dates
      const openedAt = trades.length > 0 
        ? trades.reduce((earliest, t) => t.time < earliest ? t.time : earliest, trades[0].time)
        : mainTrade.created_at;
      const settledAt = mainTrade.closed_at || mainTrade.updated_at;

      return {
        id: mainTrade.id,
        event: mainTrade.event_name,
        option: mainTrade.option_label,
        side,
        entryPrice: avgEntryPrice,
        exitPrice,
        size: totalQty,
        leverage: mainTrade.leverage,
        margin: totalMargin,
        fee: totalFee,
        pnl: totalPnl,
        pnlPercent,
        settledAt,
        openedAt,
        result: isWin ? "win" : "lose",
        trades,
        priceHistory,
        sideLabels,
        productLine: (mainTrade as any).product_line === "spot" ? "spot" : "futures",
      };
    },
    enabled: !!settlementId && !!user,
  });
};
