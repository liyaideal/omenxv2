import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

export type SettlementKind = "settled" | "closed";
export type SettlementProductLine = "futures" | "spot";

export interface SettlementListItem {
  id: string;
  event: string;
  option: string;
  side: "long" | "short";
  entryPrice: string;
  /** Rendered when kind==='settled' ($1/$0). For 'closed' intraday: real close price if available, else "—". */
  exitPrice: string;
  size: string;
  pnl: string;
  /** Numeric PnL for color / sort logic without re-parsing strings. */
  pnlValue: number;
  pnlPercent: string;
  leverage: string;
  settledAt: string;
  /** Legacy field kept for stats card (Win Rate) — DO NOT change semantics. */
  result: "win" | "lose";
  /** New 4B fields — drive display without touching the legacy Win Rate metric. */
  kind: SettlementKind;
  productLine: SettlementProductLine;
}

// ---------------------------------------------------------------------------
// Trade → event matching
// ---------------------------------------------------------------------------
// `trades` carries only event_name (no event_id, no option_id). sim-daily-seed
// re-uses names like "Will NVDA close higher today?" every trading day, so a
// naive `.in("name", …)` join with a Map produces last-write-wins collisions:
// today's still-open event overwrites yesterday's resolved one, mislabeling
// every settled row on the previous day.
//
// Fix: pull ALL event rows sharing a name we care about, then for each trade
// pick the event whose time window
//     [start_date, expected_settlement_time + SETTLEMENT_BUFFER_MS]
// contains the trade's activity time (`closed_at ?? created_at`). Falls back
// to the newest event when no window matches (rare — malformed seed data).
//
// Grouping key adds the resolved eventId (or settlement date) so cross-day
// activity on the same option label never merges into a single row.
// ---------------------------------------------------------------------------

type EventMatchRow = {
  id: string;
  name: string;
  start_date: string | null;
  expected_settlement_time: string | null;
  is_resolved: boolean;
};

// Grace window after expected_settlement_time — sim-settle-spot runs a couple
// of minutes late, so `closed_at` may sit slightly past the settlement mark.
const SETTLEMENT_BUFFER_MS = 15 * 60 * 1000;

const pickEventForTrade = (
  events: EventMatchRow[],
  tradeTimeIso: string,
): EventMatchRow | null => {
  if (!events.length) return null;
  const t = Date.parse(tradeTimeIso);
  const inWindow = events.filter((e) => {
    const start = e.start_date ? Date.parse(e.start_date) : Number.NEGATIVE_INFINITY;
    const end = e.expected_settlement_time
      ? Date.parse(e.expected_settlement_time) + SETTLEMENT_BUFFER_MS
      : Number.POSITIVE_INFINITY;
    return t >= start && t <= end;
  });
  if (inWindow.length === 1) return inWindow[0];
  if (inWindow.length > 1) {
    // Prefer resolved > unresolved, then most recent start.
    return [...inWindow].sort((a, b) => {
      if (a.is_resolved !== b.is_resolved) return a.is_resolved ? -1 : 1;
      const sa = a.start_date ? Date.parse(a.start_date) : 0;
      const sb = b.start_date ? Date.parse(b.start_date) : 0;
      return sb - sa;
    })[0];
  }
  // No window match — fall back to newest event by start_date.
  return [...events].sort((a, b) => {
    const sa = a.start_date ? Date.parse(a.start_date) : 0;
    const sb = b.start_date ? Date.parse(b.start_date) : 0;
    return sb - sa;
  })[0];
};

export const useSettlements = () => {
  const { user } = useUserProfile();

  return useQuery({
    queryKey: ["settlements", user?.id],
    queryFn: async (): Promise<SettlementListItem[]> => {
      if (!user) return [];

      // Fetch closed trades (settlements)
      const { data: trades, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "Filled")
        .not("closed_at", "is", null)
        .order("closed_at", { ascending: false });

      if (error) {
        console.error("Error fetching settlements:", error);
        throw error;
      }

      if (!trades || trades.length === 0) return [];

      // Fetch ALL event rows matching referenced names — including duplicates
      // across days — so we can window-match each trade.
      const eventNames = Array.from(new Set(trades.map((t) => t.event_name)));
      const { data: eventRows } = await supabase
        .from("events")
        .select("id, name, start_date, expected_settlement_time, is_resolved")
        .in("name", eventNames);

      const eventsByName = new Map<string, EventMatchRow[]>();
      for (const e of (eventRows || []) as EventMatchRow[]) {
        const arr = eventsByName.get(e.name) ?? [];
        arr.push(e);
        eventsByName.set(e.name, arr);
      }

      // Resolve every trade to its correct event by time window BEFORE grouping.
      const enriched = trades.map((t) => {
        const candidates = eventsByName.get(t.event_name) ?? [];
        const activityIso = (t.closed_at ?? t.created_at) as string;
        const event = pickEventForTrade(candidates, activityIso);
        return { trade: t, event };
      });

      // Group key must include the resolved event identity so trades from
      // yesterday's settled event and today's live event with the same name
      // NEVER merge. Fall back to settledAt-date when we couldn't identify
      // the event (isolates the group per trading day).
      const groupedTrades = enriched.reduce((acc, row) => {
        const settledDate = ((row.trade.closed_at ?? row.trade.updated_at) as string).split("T")[0];
        const eventKey = row.event?.id ?? `orphan|${settledDate}`;
        const key = `${eventKey}|${row.trade.option_label}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {} as Record<string, typeof enriched>);

      return Object.entries(groupedTrades).map(([, rows]) => {
        const firstRow = rows[0];
        const firstTrade = firstRow.trade;
        const groupTrades = rows.map((r) => r.trade);

        // Aggregates
        const totalQty = groupTrades.reduce((sum, t) => sum + Number(t.quantity), 0);
        const totalCost = groupTrades.reduce((sum, t) => sum + Number(t.amount), 0);
        const avgEntryPrice = totalQty > 0 ? totalCost / totalQty : Number(firstTrade.price);
        const totalPnl = groupTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        const totalMargin = groupTrades.reduce((sum, t) => sum + Number(t.margin), 0);

        // Latest close leg — used as the real intraday exit price and as the
        // second half of the settled classifier (mark ∈ {0,1}).
        const latest = [...groupTrades].sort((a, b) => {
          const at = a.closed_at || a.updated_at;
          const bt = b.closed_at || b.updated_at;
          return bt.localeCompare(at);
        })[0];
        const latestPrice = latest?.price != null ? Number(latest.price) : null;

        const productLine: SettlementProductLine =
          (firstTrade as any).product_line === "spot" ? "spot" : "futures";

        // Classifier per 4B spec: `settled` requires BOTH
        //   1) the associated event is resolved (is_resolved=true) — sim-settle
        //      flips this only after crediting winners / zeroing losers, AND
        //   2) the last close leg's price is pinned to $1 (win) or $0 (lose).
        // If a user sold intraday, condition (2) fails even after the event
        // later resolves → the row stays classified as `closed` for that user.
        const eventResolved = firstRow.event?.is_resolved ?? false;
        const priceIsPinned =
          latestPrice != null && (latestPrice === 1 || latestPrice === 0);
        const kind: SettlementKind = eventResolved && priceIsPinned ? "settled" : "closed";

        // Result: win-rate metric MUST stay PnL>0 (locked by 4B spec).
        const isWin = totalPnl > 0;

        // Exit price display — NO FABRICATION for intraday closes:
        //   settled  → pin to $1 (win) / $0 (lose) — this is the real
        //              value written by sim-settle-spot when it credits
        //              winning shares.
        //   closed   → real close price from the last trade leg; if that
        //              field is somehow missing we render "—" rather than
        //              inventing a value.
        let exitDisplay = "—";
        if (kind === "settled") {
          exitDisplay = `$${(isWin ? 1 : 0).toFixed(4)}`;
        } else if (latestPrice != null) {
          exitDisplay = `$${latestPrice.toFixed(4)}`;
        }

        const pnlPercent = totalMargin > 0 ? (totalPnl / totalMargin) * 100 : 0;

        const settledAt = groupTrades.reduce((latestAt, t) => {
          const date = t.closed_at || t.updated_at;
          return date > latestAt ? date : latestAt;
        }, groupTrades[0].closed_at || groupTrades[0].updated_at);

        const side: "long" | "short" = firstTrade.side === "buy" ? "long" : "short";

        return {
          id: firstTrade.id,
          event: firstTrade.event_name,
          option: firstTrade.option_label,
          side,
          entryPrice: `$${avgEntryPrice.toFixed(4)}`,
          exitPrice: exitDisplay,
          size: totalQty.toLocaleString(),
          pnl: `${totalPnl >= 0 ? "+" : "-"}$${Math.abs(totalPnl).toFixed(2)}`,
          pnlValue: totalPnl,
          pnlPercent: `(${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%)`,
          leverage: `${firstTrade.leverage}x`,
          settledAt: settledAt.split("T")[0],
          result: isWin ? "win" : "lose",
          kind,
          productLine,
        };
      });
    },
    enabled: !!user,
  });
};
