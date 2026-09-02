// ============================================================
// Lite /portfolio data layer (2026-08-19).
// ONE hook feeds both the mobile and the desktop Lite portfolio: live rows
// (enriched with event category / settle time / side word / auto-close),
// settled rows (month groups + series aggregation) and the segment counts.
// Pro portfolio keeps its own code path and is untouched.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePositions } from "@/hooks/usePositions";
import { useOrders } from "@/hooks/useOrders";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useSettlements, type SettlementListItem } from "@/hooks/useSettlements";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import { usePositionVouchers } from "@/hooks/usePositionVouchers";
import { getCategoryInfo } from "@/lib/categoryUtils";
import { legSideLabel, liteSideName, boostSuffix, optionSideWord, resolveLegSide, legTitle } from "@/lib/liteSideName";
import { estimateAutoClosePrice, isAutoCloseHot, type AutoCloseResult } from "@/lib/autoClosePrice";
import { monthGroupLabel, monthKey, settledDayLabel } from "@/lib/settleLabel";
import type { SeriesDetailVM, SeriesRoundVM } from "@/components/portfolio/lite/SeriesDetailView";
import { liteTradePath } from "@/lib/liteTradePath";
import { INTRADAY_SUBTYPES } from "@/components/lite/intraday/intradayData";

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
  /** Which side this leg backs — drives the SIDE chip colour. */
  side: "yes" | "no";
  /** Generic multi-option legs only: the option the side is on; rendered under the chip. */
  optionName: string | null;
  priceNow: number;
  cost: number;
  nowWorth: number;
  profit: number;
  leverageNum: number;
  isVoucher: boolean;
  /** Row tag: "voucher" → Voucher (volt), matched/welcome_gift → "airdrop" → Airdrop (pulse), else "none". */
  airdropTag: "none" | "voucher" | "airdrop";
  segment: LiteSegment;
  sizeNum: number;
  /** Payout if this leg wins (shares × $1). */
  ifWins: number;
  /** Account-level auto-close for Boost rows — two-state grammar: a price or none. */
  autoClose: AutoCloseResult;
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
  const {
    positions,
    isLoading: positionsLoading,
    isError: positionsError,
    refetch: refetchPositions,
  } = usePositions();
  const { orders } = useOrders();
  const { events } = useActiveEvents();
  const {
    data: settlements = [],
    isLoading: settledLoading,
    isError: settledError,
    refetch: refetchSettlements,
  } = useSettlements();
  const { getRealtimeMarkPrice, calculateRealtimePnL } = useRealtimePositionsPnL();
  const risk = useRealtimeRiskMetrics();
  const { grantedVouchers } = usePositionVouchers();

  // `useActiveEvents` hides sports fixture siblings (handicap / total lines),
  // so a leg opened on a line market finds no event and loses its metadata.
  // Fetch those by name — no sibling filter — and merge them in.
  const baseEventByName = useMemo(() => {
    const m = new Map<string, any>();
    for (const ev of events) if (!m.has(ev.name)) m.set(ev.name, ev);
    return m;
  }, [events]);

  const missingNames = useMemo(() => {
    const s = new Set<string>();
    for (const p of positions) if (!baseEventByName.has(p.event)) s.add(p.event);
    return Array.from(s).sort();
  }, [positions, baseEventByName]);

  const missingKey = missingNames.join("\u0000");
  const [extraEvents, setExtraEvents] = useState<any[]>([]);
  useEffect(() => {
    const names = missingKey ? missingKey.split("\u0000") : [];
    if (names.length === 0) {
      setExtraEvents((cur) => (cur.length === 0 ? cur : []));
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase.from("events").select("*").in("name", names);
      if (alive) setExtraEvents((data as any[]) || []);
    })();
    return () => {
      alive = false;
    };
  }, [missingKey]);

  const eventByName = useMemo(() => {
    const m = new Map<string, any>(baseEventByName);
    for (const ev of extraEvents) if (!m.has(ev.name)) m.set(ev.name, ev);
    return m;
  }, [baseEventByName, extraEvents]);

  const eventNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const ev of events) m.set(String(ev.id), ev.name);
    for (const ev of extraEvents) m.set(String(ev.id), ev.name);
    return m;
  }, [events, extraEvents]);

  /**
   * A fixture line leg (handicap / total) lives on a sibling event; deep-link
   * straight to its fixture board with the line preselected so the trade page
   * does not have to bounce through a redirect.
   */
  const tradePathFor = (ev: any, segment: LiteSegment): string => {
    const meta = (ev?.metadata as { market_type?: string; fixture_id?: string } | null) || {};
    if (ev && meta.market_type && meta.market_type !== "winner" && meta.fixture_id && meta.fixture_id !== ev.id) {
      return `/trade?event=${meta.fixture_id}&line=${ev.id}`;
    }
    return liteTradePath(ev?.id ?? null, segment);
  };


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

      const legInfo = resolveLegSide({ option: p.option, type: p.type }, ev);
      const sideWord = legInfo.sideWord;

      // Auto-close: account-level solve with THIS position excluded from the
      // snapshot (mode 'existing' — margin added back, own PnL excluded).
      // Two-state grammar: every Boost row gets a result (1× included → none).
      let autoClose: AutoCloseResult = { kind: "none" };
      if (segment === "boost") {
        autoClose = estimateAutoClosePrice({
          entryPrice: p.entryPriceNum,
          side: p.type,
          markPrice: priceNow,
          boost: p.leverageNum,
          amount: cost,
          fee: 0,
          quantity: p.sizeNum,
          hasOtherPositions: true,
          imTotalOther: Math.max(risk.imTotal - cost, 0),
          totalAssets: risk.totalAssets + cost,
          unrealizedPnLOther: risk.unrealizedPnL - profit,
          mode: "existing",
        });
      }
      const hot = isAutoCloseHot(autoClose, priceNow);

      return {
        id: p.id,
        eventId: ev?.id ?? null,
        eventName: p.event,
        categoryLabel: getCategoryInfo(ev?.category ?? "general").label,
        settlesAt: ev?.end_date ?? null,
        sideWord,
        side: legInfo.side,
        optionName: legInfo.optionName,
        priceNow,
        cost,
        // NOW WORTH is recoverable value, never negative: a position whose loss
        // exceeds its cost is worth $0 (the overhang is carried by the account,
        // which the Boost check expresses). PROFIT still shows the true pnl.
        nowWorth: Math.max(0, cost + profit),

        profit,
        leverageNum: p.leverageNum,
        isVoucher: p.airdropSource === "voucher",
        airdropTag:
          p.airdropSource === "voucher"
            ? "voucher"
            : p.airdropSource === "matched" || p.airdropSource === "welcome_gift"
              ? "airdrop"
              : "none",
        segment,
        sizeNum: p.sizeNum,
        ifWins: p.sizeNum,
        autoClose,
        hot,
        tradePath: tradePathFor(ev, segment),
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
      const sideWord = legTitle(resolveLegSide({ option: s.option, type: s.side }, { side_labels: s.sideLabels }));
      const boost = boostSuffix(s.leverageNum);
      const meta = [sideWord];
      if (boost) meta.push(boost);
      meta.push(settledDayLabel(s.closedAt));
      // Early cash-out is not surfaced — users only care about win / loss.
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
      sideWord: legTitle(resolveLegSide({ option: s.option, type: s.side }, { side_labels: s.sideLabels })),
      autoClosed: s.closeReason === "auto_close",
      net: s.pnlValue - s.fees,
    }));

    const cost = items.reduce((a, s) => a + s.cost, 0);
    const fees = items.reduce((a, s) => a + s.fees, 0);
    const net = rounds.reduce((a, r) => a + r.net, 0);


    // Cadence words are NOT guessed from gaps — only an explicitly intraday
    // (daily-round) event may say "daily rounds".
    const ev = eventByName.get(resolveSeriesName(seriesId));
    const isDailyRounds = (INTRADAY_SUBTYPES as readonly string[]).includes(
      String(ev?.event_subtype ?? ""),
    );

    return {
      seriesName: resolveSeriesName(seriesId),
      eventId: ev?.id ?? null,

      isDailyRounds,
      segmentLabel: items[0].productLine === "spot" ? "Standard" : "Boost",
      rounds,
      cost,
      fees,
      payout: Math.max(0, cost + net),
      net,
      wins: rounds.filter((r) => r.net > 0).length,
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
