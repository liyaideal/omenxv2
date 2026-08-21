// ============================================================
// Lite /portfolio data layer (2026-08-19).
// ONE hook feeds both the mobile and the desktop Lite portfolio: live rows
// (enriched with event category / settle time / side word / auto-close),
// settled rows (month groups + series aggregation) and the segment counts.
// Pro portfolio keeps its own code path and is untouched.
// ============================================================
import { useMemo } from "react";
import { usePositions } from "@/hooks/usePositions";
import { useOrders } from "@/hooks/useOrders";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useSettlements, type SettlementListItem } from "@/hooks/useSettlements";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import { usePositionVouchers } from "@/hooks/usePositionVouchers";
import { getCategoryInfo } from "@/lib/categoryUtils";
import { legSideLabel, liteSideName, boostSuffix, optionSideWord } from "@/lib/liteSideName";
import { estimateAutoClosePrice } from "@/lib/autoClosePrice";
import { monthGroupLabel, monthKey, settledDayLabel } from "@/lib/settleLabel";
import type { SeriesDetailVM, SeriesRoundVM } from "@/components/portfolio/lite/SeriesDetailView";

export type LiteSegment = "boost" | "standard";

export interface LiteLiveRow {
  id: string;
  eventId: string | null;
  eventName: string;
  categoryLabel: string;
  /** Event end date — feeds settleLabel(). */
  settlesAt: string | null;
  /** The word this leg is called (team name / Up / Yes). */
  sideWord: string;
  priceNow: number;
  cost: number;
  nowWorth: number;
  profit: number;
  leverageNum: number;
  isVoucher: boolean;
  segment: LiteSegment;
  sizeNum: number;
  /** Payout if this leg wins (shares × $1). */
  ifWins: number;
  /** Estimated account-level auto-close price (Boost only, >1×). */
  autoClosePrice: number | null;
  /** Price is within 10% of the auto-close price. */
  hot: boolean;
  tradePath: string;
}

export interface LiteSettledRow {
  id: string;
  title: string;
  /** `{side} · {2× Boost} · {settled day} · {remark}` */
  metaParts: string[];
  /** Remark kind drives the colour of the last meta part. */
  remark: "none" | "cashout" | "auto_close";
  net: number;
  segment: LiteSegment;
  closedAt: string;
  isSeries: boolean;
  seriesId?: string;
  won: boolean;
}

export interface LiteMonthGroup {
  key: string;
  label: string;
  rows: LiteSettledRow[];
}

const cents = (p: number) => `${Math.round(p * 100)}¢`;

export const useLitePortfolio = () => {
  const { positions, isLoading: positionsLoading } = usePositions();
  const { orders } = useOrders();
  const { events } = useActiveEvents();
  const { data: settlements = [], isLoading: settledLoading } = useSettlements();
  const { getRealtimeMarkPrice, calculateRealtimePnL } = useRealtimePositionsPnL();
  const risk = useRealtimeRiskMetrics();
  const { grantedVouchers } = usePositionVouchers();

  const eventByName = useMemo(() => {
    const m = new Map<string, any>();
    for (const ev of events) if (!m.has(ev.name)) m.set(ev.name, ev);
    return m;
  }, [events]);

  const eventNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const ev of events) m.set(String(ev.id), ev.name);
    return m;
  }, [events]);

  /**
   * Series keys are STABLE EVENT IDS. Legacy links used the raw event name
   * (which broke on `%` in titles), so a key that is not a known id is
   * treated as a name for one hop and canonicalised by the caller.
   */
  const resolveSeriesName = (key: string) => eventNameById.get(key) ?? key;
  const seriesKeyForName = (name: string) => String(eventByName.get(name)?.id ?? name);
  /** Canonical (id-form) key for any incoming series param. */
  const canonicalSeriesId = (key: string) => seriesKeyForName(resolveSeriesName(key));


  const live = useMemo<LiteLiveRow[]>(() => {
    return positions.map((p) => {
      const ev = eventByName.get(p.event);
      const segment: LiteSegment = p.productLine === "spot" ? "standard" : "boost";
      const rt = calculateRealtimePnL({
        event: p.event,
        option: p.option,
        optionId: p.optionId,
        type: p.type,
        entryPrice: p.entryPrice,
        size: p.size,
        margin: p.margin,
      });
      const priceNow = getRealtimeMarkPrice({ event: p.event, option: p.option, optionId: p.optionId })
        ?? p.markPriceNum;
      const profit = rt.hasRealtimePrice ? rt.pnl : p.pnlNum;
      const cost = p.marginNum;

      const optLower = p.option.trim().toLowerCase();
      const sideWord =
        optLower === "yes" || optLower === "no"
          ? legSideLabel(ev, optLower as "yes" | "no")
          : liteSideName(p.displayOption ?? p.option);

      // Auto-close: account-level solve with THIS position excluded from the
      // snapshot (mode 'existing' — margin added back, own PnL excluded).
      const autoClosePrice =
        segment === "boost" && p.leverageNum > 1
          ? estimateAutoClosePrice({
              entryPrice: p.entryPriceNum,
              boost: p.leverageNum,
              amount: cost,
              fee: 0,
              quantity: p.sizeNum,
              hasOtherPositions: true,
              imTotalOther: Math.max(risk.imTotal - cost, 0),
              totalAssets: risk.totalAssets + cost,
              unrealizedPnLOther: risk.unrealizedPnL - profit,
              mode: "existing",
            })
          : null;

      // Guard: with no equity (signed-out demo) the solve degenerates onto the
      // current price — never surface a bogus auto-close level.
      const safeAutoClose =
        autoClosePrice != null && risk.equity > 0 && autoClosePrice > 0 && autoClosePrice < priceNow
          ? autoClosePrice
          : null;

      const hot =
        safeAutoClose != null && priceNow > 0
          ? Math.abs(priceNow - safeAutoClose) / priceNow <= 0.1
          : false;

      return {
        id: p.id,
        eventId: ev?.id ?? null,
        eventName: p.event,
        categoryLabel: getCategoryInfo(ev?.category ?? "general").label,
        settlesAt: ev?.end_date ?? null,
        sideWord,
        priceNow,
        cost,
        // NOW WORTH is recoverable value, never negative: a position whose loss
        // exceeds its cost is worth $0 (the overhang is carried by the account,
        // which the Boost check expresses). PROFIT still shows the true pnl.
        nowWorth: Math.max(0, cost + profit),

        profit,
        leverageNum: p.leverageNum,
        isVoucher: p.airdropSource === "voucher",
        segment,
        sizeNum: p.sizeNum,
        ifWins: p.sizeNum,
        autoClosePrice: safeAutoClose,
        hot,
        tradePath: ev?.id
          ? `${segment === "standard" ? "/spot" : "/trade"}?event=${ev.id}`
          : "/events",
      };
    });
  }, [positions, eventByName, calculateRealtimePnL, getRealtimeMarkPrice, risk]);

  const boostLive = useMemo(() => live.filter((r) => r.segment === "boost"), [live]);
  const standardLive = useMemo(() => live.filter((r) => r.segment === "standard"), [live]);

  /** KPI is ALWAYS whole-account (Boost + Standard) — segment chips never move it. */
  const liveKpi = useMemo(() => {
    const cost = live.reduce((s, r) => s + r.cost, 0);
    const profit = live.reduce((s, r) => s + r.profit, 0);
    return {
      cost,
      // Sum of the per-position clamped values (clamp first, then add).
      nowWorth: live.reduce((s, r) => s + r.nowWorth, 0),

      profit,
      profitPercent: cost > 0 ? (profit / cost) * 100 : 0,
      count: live.length,
    };
  }, [live]);

  /* ------------------------- settled ------------------------- */

  const settledRows = useMemo<LiteSettledRow[]>(() => {
    // Series = 2+ settled rows on the SAME event name; they collapse into one
    // aggregate row keyed by the event name.
    const byEvent = new Map<string, SettlementListItem[]>();
    for (const s of settlements) {
      const arr = byEvent.get(s.event) ?? [];
      arr.push(s);
      byEvent.set(s.event, arr);
    }

    const rows: LiteSettledRow[] = [];
    for (const [eventName, items] of byEvent) {
      const segment: LiteSegment = items[0].productLine === "spot" ? "standard" : "boost";
      if (items.length > 1) {
        const net = items.reduce((s, i) => s + i.pnlValue, 0);
        const wins = items.filter((i) => i.pnlValue > 0).length;
        const latest = items.reduce((a, b) => (a.closedAt > b.closedAt ? a : b));
        rows.push({
          id: `series-${eventName}`,
          seriesId: seriesKeyForName(eventName),
          title: eventName,
          metaParts: [
            "Series",
            `won ${wins} of ${items.length}`,
            settledDayLabel(latest.closedAt),
          ],
          remark: "none",
          net,
          segment,
          closedAt: latest.closedAt,
          isSeries: true,
          won: net > 0,
        });
        continue;
      }

      const s = items[0];
      const sideWord = optionSideWord(s.option, s.sideLabels);
      const boost = boostSuffix(s.leverageNum);
      const meta = [sideWord];
      if (boost) meta.push(boost);
      meta.push(settledDayLabel(s.closedAt));
      if (s.closeReason === "cashout") meta.push("cashed out early");
      if (s.closeReason === "auto_close") meta.push("auto-closed");

      rows.push({
        id: s.id,
        title: s.event,
        metaParts: meta,
        remark: s.closeReason === "settlement" ? "none" : s.closeReason,
        net: s.pnlValue,
        segment,
        closedAt: s.closedAt,
        isSeries: false,
        won: s.pnlValue > 0,
      });
    }

    return rows.sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1));
  }, [settlements, eventByName]);


  const settledKpi = useMemo(() => {
    const wins = settlements.filter((s) => s.pnlValue > 0).length;
    const total = settlements.length;
    return {
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      wins,
      losses: total - wins,
      total,
      net: settlements.reduce((s, i) => s + i.pnlValue, 0),
    };
  }, [settlements]);

  const settledCounts = useMemo(
    () => ({
      boost: settledRows.filter((r) => r.segment === "boost").length,
      standard: settledRows.filter((r) => r.segment === "standard").length,
    }),
    [settledRows],
  );

  const monthGroups = (segment: LiteSegment): LiteMonthGroup[] => {
    const groups = new Map<string, LiteMonthGroup>();
    for (const r of settledRows.filter((x) => x.segment === segment)) {
      const k = monthKey(r.closedAt);
      if (!groups.has(k)) groups.set(k, { key: k, label: monthGroupLabel(r.closedAt), rows: [] });
      groups.get(k)!.rows.push(r);
    }
    return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  };

  const seriesRows = (seriesId: string): SettlementListItem[] => {
    const name = resolveSeriesName(seriesId);
    return settlements
      .filter((s) => s.event === name)
      .sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1));
  };


  /** §4d — reconciled series VM: Net = Payout − Cost, round nets sum to Net. */
  const seriesDetail = (seriesId: string): SeriesDetailVM | null => {
    const items = seriesRows(seriesId);
    if (items.length === 0) return null;

    // Reconciliation contract: Net = Payout − Cost, i.e. every figure is
    // net of fees. Round nets carry their own fees so they sum to Net.
    const rounds: SeriesRoundVM[] = items.map((s) => ({
      id: s.id,
      closedAt: s.closedAt,
      sideWord: optionSideWord(s.option, s.sideLabels),
      autoClosed: s.closeReason === "auto_close",
      net: s.pnlValue - s.fees,
    }));

    const cost = items.reduce((a, s) => a + s.cost, 0);
    const fees = items.reduce((a, s) => a + s.fees, 0);
    const net = rounds.reduce((a, r) => a + r.net, 0);


    // Cadence from the median gap between consecutive rounds.
    const stamps = items.map((s) => new Date(s.closedAt).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < stamps.length; i++) gaps.push(stamps[i] - stamps[i - 1]);
    const median = gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;
    const day = 86_400_000;
    const cadence = median <= 0 ? "daily" : median <= day * 1.5 ? "daily" : median <= day * 9 ? "weekly" : "monthly";

    return {
      seriesName: resolveSeriesName(seriesId),
      eventId: eventByName.get(resolveSeriesName(seriesId))?.id ?? null,

      cadence,
      segmentLabel: items[0].productLine === "spot" ? "Standard" : "Boost",
      rounds,
      cost,
      fees,
      payout: Math.max(0, cost + net),
      net,
      wins: rounds.filter((r) => r.net > 0).length,
      sideLabel:
        new Set(rounds.map((r) => r.sideWord)).size === 1 ? rounds[0].sideWord : undefined,
    };
  };

  /* --------------------- pending Pro orders --------------------- */
  const pendingOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "Pending" || o.status === "Partial Filled")
        .map((o) => ({ ...o, eventId: eventByName.get(o.event)?.id ?? null })),
    [orders, eventByName],
  );

  return {
    isLoading: positionsLoading || settledLoading,
    live,
    boostLive,
    standardLive,
    liveKpi,
    risk,
    claimableVouchers: grantedVouchers.length,
    settledRows,
    settledKpi,
    settledCounts,
    monthGroups,
    seriesRows,
    seriesDetail,
    canonicalSeriesId,

    pendingOrders,
    cents,
  };
};
