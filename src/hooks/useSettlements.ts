import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { parseSideLabels } from "@/lib/eventUtils";
import { orphanSpotSideLabels } from "@/lib/orphanSpotSideLabels";

export type SettlementKind = "settled" | "closed";
export type SettlementProductLine = "futures" | "spot";
/** Why the position left the book. Historic rows are backfilled to 'settlement'. */
export type SettlementCloseReason = "settlement" | "cashout" | "auto_close";

export interface SettlementListItem {
  id: string;
  event: string;
  option: string;
  side: "long" | "short";
  entryPrice: string;
  /** Settled → the real resolution price ($1 winner / $0 loser). Closed → real exit. */
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
  kind: SettlementKind;
  productLine: SettlementProductLine;

  // ---- Lite portfolio fields -------------------------------------------
  /** Full ISO close timestamp (settledAt is date-only, kept for Pro). */
  closedAt: string;
  closeReason: SettlementCloseReason;
  /** Cash put in. */
  cost: number;
  /** Trading fees attributable to this position (pro-rated by cost on shared ledgers). */
  fees: number;
  exitPriceNum: number;
  entryPriceNum: number;
  sizeNum: number;
  leverageNum: number;
  /** Team / up-down aliases from the event, when present. */
  sideLabels?: { yes: string; no: string };
}

// ---------------------------------------------------------------------------
// Source of truth = `positions` rows that left the book (status='Closed').
// The old implementation read `trades` (status='Filled' AND closed_at NOT NULL)
// which is empty for every user — the fill ledger never carries a close stamp.
// ---------------------------------------------------------------------------

export const useSettlements = () => {
  const { user } = useUserProfile();

  return useQuery({
    queryKey: ["settlements", user?.id],
    queryFn: async (): Promise<SettlementListItem[]> => {
      if (!user) return [];

      const { data: rows, error } = await supabase
        .from("positions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "Closed")
        .order("closed_at", { ascending: false });

      if (error) {
        console.error("Error fetching settlements:", error);
        throw error;
      }
      if (!rows || rows.length === 0) return [];

      // Side aliases (team names / Up-Down) come from the event row.
      const names = Array.from(new Set(rows.map((r) => r.event_name)));
      const { data: eventRows } = await supabase
        .from("events")
        .select("name, side_labels")
        .in("name", names);
      const labelsByName = new Map<string, { yes: string; no: string } | undefined>();
      for (const e of (eventRows ?? []) as any[]) {
        if (!labelsByName.has(e.name)) labelsByName.set(e.name, parseSideLabels(e.side_labels));
      }

      // Fees live on the fill ledger, keyed by (event, option). When several
      // closed positions share one ledger (recurring series) the fee is
      // pro-rated by each position's cost so the parts always sum to the whole.
      const { data: feeRows } = await supabase
        .from("trades")
        .select("event_name, option_label, fee")
        .eq("user_id", user.id)
        .in("event_name", names);
      const feeByPair = new Map<string, number>();
      for (const t of (feeRows ?? []) as any[]) {
        const k = `${t.event_name}::${t.option_label}`;
        feeByPair.set(k, (feeByPair.get(k) ?? 0) + (Number(t.fee) || 0));
      }
      const costByPair = new Map<string, number>();
      for (const r of rows as any[]) {
        const k = `${r.event_name}::${r.option_label}`;
        costByPair.set(k, (costByPair.get(k) ?? 0) + (Number(r.margin) || 0));
      }

      return rows.map((row: any): SettlementListItem => {
        const entry = Number(row.entry_price) || 0;
        const exit = Number(row.mark_price) || 0;
        const size = Number(row.size) || 0;
        const cost = Number(row.margin) || 0;
        const pnl = Number(row.pnl) || 0;
        const leverageNum = Number(row.leverage) || 1;
        const productLine: SettlementProductLine =
          row.product_line === "spot" ? "spot" : "futures";
        const closeReason: SettlementCloseReason =
          row.close_reason === "cashout" || row.close_reason === "auto_close"
            ? row.close_reason
            : "settlement";
        const closedAt: string = row.closed_at ?? row.updated_at;
        const pairKey = `${row.event_name}::${row.option_label}`;
        const pairFee = feeByPair.get(pairKey) ?? 0;
        const pairCost = costByPair.get(pairKey) ?? 0;
        const fees = pairCost > 0 ? (pairFee * cost) / pairCost : pairFee;
        const isWin = pnl > 0;
        const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

        return {
          id: row.id,
          event: row.event_name,
          option: row.option_label,
          side: row.side === "short" ? "short" : "long",
          entryPrice: `$${entry.toFixed(4)}`,
          exitPrice: `$${exit.toFixed(4)}`,
          size: size.toLocaleString(),
          pnl: `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`,
          pnlValue: pnl,
          pnlPercent: `(${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%)`,
          leverage: `${leverageNum}x`,
          settledAt: String(closedAt).split("T")[0],
          result: isWin ? "win" : "lose",
          kind: closeReason === "settlement" ? "settled" : "closed",
          productLine,
          closedAt,
          closeReason,
          cost,
          fees,
          exitPriceNum: exit,
          entryPriceNum: entry,
          sizeNum: size,
          leverageNum,
          // 事件行缺失（labelsByName 无此 name）才允许兜底；有行但无
          // side_labels 不属于孤儿腿，维持现状。
          sideLabels: orphanSpotSideLabels(
            row.product_line,
            labelsByName.has(row.event_name)
              ? labelsByName.get(row.event_name) ?? null
              : undefined,
            row.option_label,
          ),
        };
      });
    },
    enabled: !!user,
  });
};
