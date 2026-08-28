// ============================================================
// /trade (surface=lite) — Lite contract page ("Boost").
// Display-layer fork of the Pro DesktopTrading terminal. Reuses the
// existing futures execution service; no schema or logic changes.
//
// P0 notes:
//   3/6. Gating is derived from is_resolved / end_date / freeze_time only.
//        We deliberately do NOT use usStockSessions here — that module
//        models US cash-session lifecycles (its ORDERABLE_STATES has no
//        'ACTIVE'), which every futures event in this product uses.
//        Pro /spot keeps using it untouched.
//   1/2. Price snapshot + balance leg live in LiteContractOrderPanel.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Info, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { useCategoryBoostConfigs, boostTiers } from "@/hooks/useCategoryBoostConfigs";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { useHeadingScrolledOut } from "@/hooks/useHeadingScrolledOut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { parseSideLabels } from "@/lib/eventUtils";
import { boostSuffix, legSideLabel, liteSideName } from "@/lib/liteSideName";
import { formatCents, estimateAutoClosePrice, isAutoCloseHot } from "@/lib/autoClosePrice";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import type { Tables } from "@/integrations/supabase/types";
import {
  LiteContractChart,
  type MultiSeries,
} from "@/components/lite/contract/LiteContractChart";
import { HowItSettled } from "@/components/lite/trade/HowItSettled";
import {
  InReviewCard,
  IN_REVIEW_BADGE,
  IN_REVIEW_HOLD_LINE,
} from "@/components/lite/trade/InReviewCard";

import { LiteContractOrderPanel } from "@/components/lite/contract/LiteContractOrderPanel";
import {
  TradeHeading,
  TradeRuleCard,
  TradeMoreMarkets,
} from "@/components/lite/contract/LiteTradeBlocks";

import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { LiteSentimentBar } from "@/components/lite/contract/LiteSentimentBar";
import { LiteMarketBoard, type BoardOption } from "@/components/lite/multi/LiteMarketBoard";
import { LiteLineScrubber } from "@/components/lite/multi/LiteLineScrubber";
import {
  fixtureMeta,
  formatSignedLine,
  groupFixtureMarkets,
  isFixtureSibling,
  NON_SIBLING_FILTER,
  scoringNoun,
} from "@/components/lite/sports/sportsData";
import { LiteBoardGroupHeader as GroupHeader } from "@/components/lite/multi/LiteBoardGroupHeader";
import { useTradeCountdown } from "@/components/lite/intraday/intradayData";
import { LiteCrowdOverview } from "@/components/lite/multi/LiteCrowdOverview";
import { EmptyState } from "@/components/states";

type EventRow = Tables<"events"> & { options: Tables<"event_options">[] };
type Side = "yes" | "no";

// Multi-market events trade BOTH sides of every option, but the engine only
// knows one row per option. The No leg is recorded under a derived label so
// the two sides stay distinguishable in positions / history. Display layer
// only — tradingService is untouched.
const NO_PREFIX = "No: ";
const baseOptionLabel = (positionOption: string) =>
  positionOption.startsWith(NO_PREFIX) ? positionOption.slice(NO_PREFIX.length) : positionOption;
const positionIsNo = (positionOption: string) => positionOption.startsWith(NO_PREFIX);
/** A No leg is either the legacy derived label OR (since per-option netting
 *  shipped) a short stored under the plain option label. */
const legIsNo = (p: { option: string; type: "long" | "short" }) =>
  p.type === "short" || positionIsNo(p.option);

const compactUSD = (v: number): string => {
  if (!isFinite(v) || v <= 0) return "$0";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${Math.round(v)}`;
};

const CATEGORY_LABEL: Record<string, string> = {
  crypto: "Crypto",
  macro: "Macro",
  sports: "Sports",
  politics: "Politics",
  tech: "Tech",
  stocks: "Finance",
};

// ---- Sports game lines -------------------------------------------------
// One fixture = several sibling events (winner / handicap / total). They are
// fetched together and rendered as groups on the SAME board component; the
// scrubber only swaps which sibling a line group is bound to.
const useFixtureSiblings = (fixtureId: string | null, tick: number) => {
  const [rows, setRows] = useState<EventRow[]>([]);
  useEffect(() => {
    if (!fixtureId) {
      setRows([]);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("*, options:event_options(*)")
        .eq("metadata->>fixture_id", fixtureId);
      if (!alive) return;
      setRows((data || []) as unknown as EventRow[]);
    })();
    return () => {
      alive = false;
    };
  }, [fixtureId, tick]);
  return rows;
};

/** Yes/No split of a binary sibling event, using its side_labels aliases. */
const splitBinary = (ev: EventRow) => {
  const labels = parseSideLabels(ev.side_labels);
  const alias = (labels?.yes || "").trim().toLowerCase();
  const yesOpt =
    (alias && ev.options.find((o) => o.label.trim().toLowerCase() === alias)) ||
    ev.options.find((o) => /(^|[-_ ])yes$/i.test(o.label)) ||
    ev.options[0] ||
    null;
  const noOpt = ev.options.find((o) => o.id !== yesOpt?.id) || ev.options[1] || null;
  return {
    yesOpt,
    noOpt,
    yesLabel: labels?.yes || "Yes",
    noLabel: labels?.no || "No",
  };
};

interface MoreRow {
  id: string;
  name: string;
  yesPct: number;
}
const useMoreMarkets = (category: string | null, currentId: string) => {
  const [rows, setRows] = useState<MoreRow[]>([]);
  useEffect(() => {
    if (!category) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, side_labels, options:event_options(id, label, price)")
        .eq("category", category)
        .eq("is_resolved", false)
        // Fixture line siblings live on their fixture board only.
        .or(NON_SIBLING_FILTER)
        .limit(8);
      if (!alive) return;
      setRows(
        (data || [])
          .filter((e) => e.id !== currentId && !isFixtureSibling(e))
          .slice(0, 5)
          .map((e) => {
            const opts = (e.options || []) as { label: string; price: number }[];
            const labels = parseSideLabels(e.side_labels);
            const alias = (labels?.yes || "").trim().toLowerCase();
            const yes =
              (alias && opts.find((o) => o.label.trim().toLowerCase() === alias)) ||
              opts.find((o) => /(^|[-_ ])yes$/i.test(o.label)) ||
              opts[0];
            return {
              id: e.id,
              name: e.name,
              yesPct: Math.round((yes ? Number(yes.price) : 0.5) * 100),
            };
          }),
      );
    })();
    return () => {
      alive = false;
    };
  }, [category, currentId]);
  return rows;
};

// ============================================================
const LiteContractTrade = () => {
  const [params] = useSearchParams();
  const eventId = params.get("event") || "";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const routerLocation = useLocation();
  // Back goes home to wherever the reader came from (portfolio keeps its spot).
  const backHref =
    (routerLocation.state as { from?: string } | null)?.from ?? "/events";
  const { user } = useAuth();
  const { positions, refetch: refetchPositions } = usePositions();
  const { isWatched, toggle } = useWatchlist();
  const { headingRef, scrolledOut } = useHeadingScrolledOut();
  const pricesCtx = useRealtimePricesOptional();
  const { getConfig, isLoading: boostLoading } = useCategoryBoostConfigs();
  const risk = useRealtimeRiskMetrics();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [side, setSide] = useState<Side>("yes");
  const [amount, setAmount] = useState("");
  const [boost, setBoost] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [resumeBuy, setResumeBuy] = useState(false);
  const [refetchTick, setRefetchTick] = useState(0);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  // Multi-market: which option the board / order rail is bound to, and which
  // held leg the cash-out sheet targets.
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [cashOutId, setCashOutId] = useState<string | null>(null);
  // Cash-out share card lives on the page: a full close unmounts the flow.
  const [shareSnap, setShareSnap] = useState<CashOutShareSnapshot | null>(null);
  // Only the FIRST fetch flips the full-page loader; later refetches
  // (post-fill) swap data in place so the page never unmounts.
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!eventId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      if (isFirstLoad.current) setLoading(true);
      const [{ data: e }, { data: opts }] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
        supabase.from("event_options").select("*").eq("event_id", eventId),
      ]);
      if (!alive) return;
      if (!e) setNotFound(true);
      else setEvent({ ...e, options: opts || [] });
      isFirstLoad.current = false;
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [eventId, refetchTick]);

  const sideLabels = useMemo(() => parseSideLabels(event?.side_labels), [event]);
  // Null-check BEFORE sanitising: liteSideName(undefined) returns "Down"
  // (a truthy value), so a `|| "Yes"` fallback would be dead code and both
  // sides of the page would read "Down" whenever side_labels is missing.
  const yesLabel = useMemo(
    () => (sideLabels?.yes ? liteSideName(sideLabels.yes) : "Yes"),
    [sideLabels?.yes],
  );
  const noLabel = useMemo(
    () => (sideLabels?.no ? liteSideName(sideLabels.no) : "No"),
    [sideLabels?.no],
  );

  const yesOpt = useMemo(() => {
    if (!event) return null;
    const alias = (sideLabels?.yes || "").trim().toLowerCase();
    return (
      (alias && event.options.find((o) => o.label.trim().toLowerCase() === alias)) ||
      event.options.find((o) => /(^|[-_ ])yes$/i.test(o.label)) ||
      event.options[0] ||
      null
    );
  }, [event, sideLabels]);
  const noOpt = useMemo(() => {
    if (!event || !yesOpt) return null;
    return event.options.find((o) => o.id !== yesOpt.id) || event.options[1] || null;
  }, [event, yesOpt]);

  const yesLive = yesOpt ? (pricesCtx?.getPrice(yesOpt.id) ?? Number(yesOpt.price)) : 0.5;
  const noLive = noOpt ? (pricesCtx?.getPrice(noOpt.id) ?? Number(noOpt.price)) : 1 - yesLive;

  const endDate = event?.end_date ? new Date(event.end_date) : null;
  const freezeAt = event?.freeze_time ? new Date(event.freeze_time) : null;
  const { text: countdown } = useTradeCountdown(freezeAt ?? endDate, { days: true });

  const resolved = !!event?.is_resolved;
  // Intermediate state between trading close and settlement — the result is
  // being checked and can stay here for a long time. Settled always wins.
  const inReview = !resolved && (event as any)?.lifecycle_status === "REVIEW";
  const pastEnd = endDate ? endDate.getTime() <= Date.now() : false;
  const pastFreeze = freezeAt ? freezeAt.getTime() <= Date.now() : false;
  const blocked = resolved || inReview || pastEnd || pastFreeze;
  const blockedReason = resolved
    ? "Settled"
    : inReview
      ? IN_REVIEW_BADGE
      : pastEnd || pastFreeze
        ? "Closed"
        : "";


  const boostCfg = getConfig(event?.category);
  const tiers = useMemo(() => boostTiers(boostCfg.maxBoost), [boostCfg.maxBoost]);

  // Default to the LOWEST tier (1×) — boosting must be an explicit user action.
  // Keyed on the category only, so refetches / realtime never reset a manual pick.
  const boostCategoryKey = (event?.category || "").trim().toLowerCase();
  useEffect(() => {
    setBoost(1);
  }, [boostCategoryKey]);

  const heldPos = useMemo(() => {
    if (!event) return null;
    // Legacy hedged data (pre-netting) can leave two open futures legs on the
    // same event — pick the largest by margin so the card is deterministic.
    const matches = positions.filter(
      (p) => p.productLine === "futures" && p.event === event.name,
    );
    if (matches.length === 0) return null;
    return matches.reduce((a, b) => (b.marginNum > a.marginNum ? b : a));
  }, [positions, event]);
  const heldIndex = useMemo(
    () => (heldPos ? positions.findIndex((p) => p.id === heldPos.id) : -1),
    [positions, heldPos],
  );

  const isMulti = (event?.options.length ?? 0) > 2;

  // ---- Sports game lines: sibling markets of the same fixture ----
  const meta = fixtureMeta(event);
  const siblings = useFixtureSiblings(meta.fixture_id ?? null, refetchTick);
  const groups = useMemo(() => groupFixtureMarkets(siblings), [siblings]);
  const hasLines = groups.handicap.length > 0 || groups.total.length > 0;
  const handicapLines = useMemo(
    () => groups.handicap.map((e) => fixtureMeta(e).line ?? 0),
    [groups.handicap],
  );
  const totalLines = useMemo(
    () => groups.total.map((e) => fixtureMeta(e).line ?? 0),
    [groups.total],
  );
  const [handicapLine, setHandicapLine] = useState<number | null>(null);
  const [totalLine, setTotalLine] = useState<number | null>(null);
  // Deep link: /trade?event=<winner>&line=<sibling id> preselects a group.
  const deepLineId = params.get("line");

  const pickDefault = (values: number[], wanted?: number | null) =>
    wanted != null && values.includes(wanted)
      ? wanted
      : (values[Math.floor(values.length / 2)] ?? null);

  useEffect(() => {
    const deep = deepLineId ? siblings.find((e) => e.id === deepLineId) : null;
    const dMeta = deep ? fixtureMeta(deep) : null;
    setHandicapLine((cur) =>
      cur != null && handicapLines.includes(cur)
        ? cur
        : pickDefault(
            handicapLines,
            dMeta?.market_type === "handicap" ? dMeta.line : null,
          ),
    );
    setTotalLine((cur) =>
      cur != null && totalLines.includes(cur)
        ? cur
        : pickDefault(totalLines, dMeta?.market_type === "total" ? dMeta.line : null),
    );
  }, [handicapLines, totalLines, deepLineId, siblings]);

  // Deep link straight to a line market: the fixture board is the canonical
  // surface, so bounce to the winner event and carry the line in the URL.
  useEffect(() => {
    if (!event || !meta.fixture_id) return;
    if (meta.market_type && meta.market_type !== "winner" && meta.fixture_id !== event.id) {
      navigate(`/trade?event=${meta.fixture_id}&line=${event.id}`, { replace: true });
    }
  }, [event, meta.fixture_id, meta.market_type, navigate]);

  const activeHandicap = useMemo(
    () =>
      groups.handicap.find((e) => fixtureMeta(e).line === handicapLine) ||
      groups.handicap[0] ||
      null,
    [groups.handicap, handicapLine],
  );
  const activeTotal = useMemo(
    () => groups.total.find((e) => fixtureMeta(e).line === totalLine) || groups.total[0] || null,
    [groups.total, totalLine],
  );

  // Settled charts read real odds history — never synthesised data.
  const [history, setHistory] = useState<Record<string, number[]>>({});
  useEffect(() => {
    if (!event?.is_resolved || event.options.length === 0) {
      setHistory({});
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("price_history")
        .select("option_id, price, recorded_at")
        .eq("event_id", event.id)
        .order("recorded_at", { ascending: true });
      if (!alive) return;
      const grouped: Record<string, number[]> = {};
      (data || []).forEach((p) => {
        const key = p.option_id as string;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(Number(p.price));
      });
      setHistory(grouped);
    })();
    return () => {
      alive = false;
    };
  }, [event?.id, event?.is_resolved, event?.options.length]);
  const activity = useMarketActivityRows(
    event?.name || null,
    yesOpt?.label || "",
    refetchTick,
    isMulti,
  );
  const liveOptions = useMemo(
    () => (event?.options || []).filter((o) => o.final_price == null),
    [event],
  );
  useEffect(() => {
    if (!isMulti) return;
    setSelectedOptId((cur) =>
      cur && liveOptions.some((o) => o.id === cur) ? cur : (liveOptions[0]?.id ?? null),
    );
  }, [isMulti, liveOptions]);
  const selOpt = useMemo(
    () =>
      (event?.options || []).find((o) => o.id === selectedOptId) || liveOptions[0] || null,
    [event, selectedOptId, liveOptions],
  );

  // Every open leg on this event (multi events allow several at once).
  const multiHeld = useMemo(() => {
    if (!event) return [];
    // Fixtures also count legs opened on their sibling line markets.
    const names = new Set<string>([event.name, ...siblings.map((s) => s.name)]);
    return positions.filter((p) => p.productLine === "futures" && names.has(p.event));
  }, [positions, event, siblings]);

  const more = useMoreMarkets(event?.category || null, event?.id || "");

  // A leg's event row (this event or one of its fixture siblings), so
  // side-labelled legs can name their side ("ARS +1.5") instead of Yes/No.
  const legEventByName = useMemo(() => {
    const m = new Map<string, { side_labels?: unknown }>();
    if (event) m.set(event.name, event);
    for (const s of siblings) m.set(s.name, s);
    return m;
  }, [event, siblings]);
  const hasSideLabels = (eventName: string) =>
    !!parseSideLabels(legEventByName.get(eventName)?.side_labels);
  const legSideWord = (p: { event: string; option: string; type: "long" | "short" }) =>
    legSideLabel(legEventByName.get(p.event) ?? null, legIsNo(p) ? "no" : "yes");

  const openBuy = useCallback(
    (s: Side) => {
      setSide(s);
      if (isMobile) setDrawerOpen(true);
    },
    [isMobile],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // Bare /trade (no event param) is not a dead link — send users to the market list.
  if (!eventId) return <Navigate to="/events" replace />;
  // Settled events render the outcome card — never the expired fallback.
  if (notFound || !event || !yesOpt || !noOpt) {
    return <ExpiredEventFallback eventId={eventId} />;
  }

  const starred = isWatched(event.id);
  const categoryLabel = CATEGORY_LABEL[String(event.category).toLowerCase()] || event.category;
  const yesPct = Math.max(1, Math.min(99, Math.round(yesLive * 100)));

  // ---- Multi-market derived view state (binary events never read these) ----
  const selYes = selOpt
    ? (pricesCtx?.getPrice(selOpt.id) ?? Number(selOpt.price))
    : 0.5;
  const selNo = Math.max(0.01, Math.min(0.99, 1 - selYes));
  const heldOnSelected = selOpt
    ? multiHeld.find((p) => baseOptionLabel(p.option) === selOpt.label) || null
    : null;
  const heldOnSelectedIsNo = heldOnSelected ? legIsNo(heldOnSelected) : false;
  const volumeText = `Vol ${compactUSD(Number(event.volume) || 0)}`;

  const boardOptions: BoardOption[] = event.options.map((o) => {
    const held = multiHeld.find((p) => baseOptionLabel(p.option) === o.label);
    return {
      id: o.id,
      label: o.label,
      yesPrice: pricesCtx?.getPrice(o.id) ?? Number(o.price),
      settled: o.final_price != null,
      outcomeYes: !!o.is_winner,
      heldSide: held ? (legIsNo(held) ? "no" : "yes") : null,
      heldSideLabel: held ? legSideWord(held) : null,
    };
  });

  const selectMarket = (optionId: string, s: Side) => {
    setSelectedOptId(optionId);
    setSide(s);
    if (isMobile) setDrawerOpen(true);
  };

  // Row-body tap (mobile included): only selects + expands the inline chart.
  const selectMarketRow = (optionId: string, s: Side) => {
    setSelectedOptId(optionId);
    setSide(s);
  };

  const MarketBoard = (
    <LiteMarketBoard
      options={boardOptions}
      volumeText={volumeText}
      selectedId={selOpt?.id ?? null}
      selectedSide={side}
      onSelect={selectMarket}
      onRowSelect={selectMarketRow}
      onDeselect={() => setSelectedOptId(null)}
      compact={!!isMobile}
      showChart
    />
  );

  // ---- Sports game lines: grouped board -------------------------------
  const noun = scoringNoun(meta);
  const homeAbbr = meta.home_abbr || meta.home || "Home";
  const regulationTip =
    "Settles on the regulation-time result. Extra time and penalties don't count.";

  const lineRow = (
    ev: EventRow | null,
    label: (line: number) => string,
  ): BoardOption | null => {
    if (!ev) return null;
    const { yesOpt: y, noOpt: n, yesLabel: yl, noLabel: nl } = splitBinary(ev);
    if (!y || !n) return null;
    const held = multiHeld.find((p) => p.event === ev.name);
    return {
      id: y.id,
      label: label(fixtureMeta(ev).line ?? 0),
      yesPrice: pricesCtx?.getPrice(y.id) ?? Number(y.price),
      settled: y.final_price != null,
      outcomeYes: !!y.is_winner,
      heldSide: held ? (legIsNo(held) ? "no" : "yes") : null,
      heldSideLabel: held ? legSideWord(held) : null,
      yesChipLabel: yl,
      noChipLabel: nl,
    };
  };

  const handicapRow = lineRow(activeHandicap, (l) => `${homeAbbr} ${formatSignedLine(l)} covers`);
  const totalRow = lineRow(activeTotal, (l) => `Over ${l} ${noun}`);

  // Switching the line keeps the row selected: the selection hops to the new
  // sibling's option id (same side), so the inline chart stays open and the
  // order rail rebinds. Nothing selected → stays nothing.
  const changeLine =
    (list: EventRow[], current: EventRow | null, setLine: (v: number) => void) =>
    (v: number) => {
      setLine(v);
      const next = list.find((e) => fixtureMeta(e).line === v) || null;
      if (!next || !current || next.id === current.id) return;
      const currentIds = new Set(current.options.map((o) => o.id));
      setSelectedOptId((cur) => {
        if (!cur || !currentIds.has(cur)) return cur;
        return splitBinary(next).yesOpt?.id ?? cur;
      });
    };

  const lineGroupBoard = (
    row: BoardOption | null,
    values: number[],
    value: number | null,
    onChange: (v: number) => void,
    format?: (n: number) => string,
  ) =>
    row ? (
      <LiteMarketBoard
        options={[row]}
        volumeText={volumeText}
        selectedId={selectedOptId === row.id ? row.id : null}
        selectedSide={side}
        onSelect={selectMarket}
        onRowSelect={selectMarketRow}
        onDeselect={() => setSelectedOptId(null)}
        compact={!!isMobile}
        showChart
        hideHeader
        renderFooter={() => (
          <LiteLineScrubber
            values={values}
            value={value ?? values[0]}
            onChange={onChange}
            format={format}
            compact={!!isMobile}
          />
        )}
      />
    ) : null;

  const FixtureBoard = (
    <div className="space-y-2">
      {!isMobile && (
        // Mobile already carries the crowd caption in LiteCrowdOverview.
        <div className="flex items-end justify-between gap-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            What the crowd thinks
          </div>
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {volumeText}
          </div>
        </div>
      )}
      {event.options.length > 1 && (
        <>
          <GroupHeader title="Winner" note="Regulation time" tip={regulationTip} />
          <LiteMarketBoard
            options={boardOptions}
            volumeText={volumeText}
            selectedId={
              selectedOptId && event.options.some((o) => o.id === selectedOptId)
                ? selectedOptId
                : null
            }
            selectedSide={side}
            onSelect={selectMarket}
            onRowSelect={selectMarketRow}
            onDeselect={() => setSelectedOptId(null)}
            compact={!!isMobile}
            showChart
            hideHeader
          />
        </>
      )}
      {handicapRow && (
        <>
          <GroupHeader
            title="Handicap"
            note="Regulation time"
            tip={`A team covers when its regulation-time score plus the line beats the opponent. ${regulationTip}`}
          />
          {lineGroupBoard(
            handicapRow,
            handicapLines,
            handicapLine,
            changeLine(groups.handicap, activeHandicap, setHandicapLine),
          )}
        </>
      )}
      {totalRow && (
        <>
          <GroupHeader
            title={`Total ${noun}`}
            note="Regulation time"
            tip={`Counts both teams' ${noun} in regulation time. ${regulationTip}`}
          />
          {lineGroupBoard(
            totalRow,
            totalLines,
            totalLine,
            changeLine(groups.total, activeTotal, setTotalLine),
            (n) => String(n),
          )}
        </>
      )}
    </div>
  );

  const BoardModule = hasLines ? FixtureBoard : MarketBoard;
  const boardMode = isMulti || hasLines;

  const heldIsYes =
    heldPos != null &&
    heldPos.option.trim().toLowerCase() === yesOpt.label.trim().toLowerCase();

  // Signed numeric PnL — never reverse-parsed from the formatted string
  // (`pnl` drops the minus sign via Math.abs).
  const heldPnlNum = heldPos ? heldPos.pnlNum : 0;

  // Shared for the binary held leg and for every multi-market leg.
  const autoCloseFor = (p: (typeof positions)[number]) =>
    estimateAutoClosePrice({
      entryPrice: p.entryPriceNum,
      side: p.type,
      markPrice: p.markPriceNum,
      boost: p.leverageNum,
      amount: p.marginNum,
      fee: 0,
      quantity: p.sizeNum,
      hasOtherPositions: positions.length > 1,
      imTotalOther: Math.max(risk.imTotal - p.marginNum, 0),
      // `risk.totalAssets` is the live balance, from which this position's
      // margin + fee were ALREADY deducted at fill time — adding it back
      // would count the same cash twice. mode:"existing" performs no
      // further deduction, so pass the balance as-is and only strip this
      // position's own IM and PnL from the account aggregates.
      totalAssets: risk.totalAssets,
      unrealizedPnLOther: risk.unrealizedPnL - p.pnlNum,
      mode: "existing",
    });

  // Two-state display: "≈ X¢" (hot → red + note) or "None · loss capped".
  const autoCloseDisplayFor = (p: (typeof positions)[number]) => {
    const r = autoCloseFor(p);
    if (r.kind === "none")
      return { text: "None", sub: "Loss capped at your stake", hot: false };
    const hot = isAutoCloseHot(r, p.markPriceNum);
    return {
      text: `≈ ${formatCents(r.price)}`,
      sub: hot ? "Close to current price" : undefined,
      hot,
    };
  };

  const heldAutoClose = heldPos != null ? autoCloseDisplayFor(heldPos) : null;


  const WatchStar = (
    <MobileHeaderIconButton
      onClick={(e) => toggle(event.id, e as unknown as React.MouseEvent)}
      aria-label="Watchlist"
      className={starred ? "text-trading-yellow" : undefined}
    >
      <Star
        className={cn("h-5 w-5", starred && "fill-trading-yellow")}
        strokeWidth={1.5}
      />
    </MobileHeaderIconButton>
  );

  const QuestionBlock = (
    <TradeHeading
      eyebrow={
        <>
          {hasLines
            ? [
                categoryLabel,
                event.options.length > 1 ? "Winner" : null,
                handicapRow ? "Handicap" : null,
                totalRow ? `Total ${noun}` : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : categoryLabel}
          {!hasLines && isMulti && !isMobile && ` · ${event.options.length} markets`}
        </>
      }
      title={event.name}
      headingRef={headingRef as unknown as React.Ref<HTMLHeadingElement>}
      rightSlot={!isMobile ? WatchStar : undefined}
    />
  );


  const SentimentBar = (
    <LiteSentimentBar
      yesLabel={yesLabel}
      noLabel={noLabel}
      yesPct={yesPct}
      compact={!!isMobile}
    />
  );

  // ---- Settled chart grading rule ----
  // underlying price present  → price line + "Needed" level + Chance toggle
  // no underlying             → single Chance line from real odds history
  // multi-option              → Chance multi-line, winner bright, legend chips
  const winnerOption = event.options.find((o) => o.is_winner) || null;
  const settledMultiSeries: MultiSeries[] = resolved && isMulti
    ? event.options
        .map((o) => ({
          id: o.id,
          label: o.label,
          points: history[o.id] || [],
          isWinner: !!o.is_winner,
        }))
        .filter((s) => s.points.length > 1)
    : [];
  const settledOddsHistory =
    resolved && !isMulti ? history[yesOpt.id] || [] : [];
  // Never fake data: a settled event with no underlying and no odds history
  // hides the chart module entirely.
  const hideSettledChart =
    resolved &&
    (isMulti
      ? settledMultiSeries.length === 0
      : event.base_price == null && settledOddsHistory.length < 2);

  const Chart = hideSettledChart ? null : (
    <LiteContractChart
      underlyingLabel={event.base_price != null ? "Price" : null}
      basePrice={event.base_price != null ? Number(event.base_price) : null}
      currentPrice={
        resolved && event.close_price != null
          ? Number(event.close_price)
          : event.base_price != null
            ? Number(event.base_price)
            : null
      }
      yesOdds={
        resolved && winnerOption
          ? winnerOption.id === yesOpt.id
            ? 1
            : 0
          : yesLive
      }
      yesLabel={yesLabel}
      noLabel={noLabel}
      side={resolved && winnerOption ? (winnerOption.id === yesOpt.id ? "yes" : "no") : side}
      oddsHistory={settledOddsHistory.length > 1 ? settledOddsHistory : null}
      multiSeries={settledMultiSeries.length > 0 ? settledMultiSeries : null}
      targetLabel="Needed"
      hideOddsView={resolved && !isMulti && settledOddsHistory.length < 2}
    />
  );

  // Seeded rules already end with "Winning shares pay $1." — drop that
  // sentence so the card never says it twice.
  const ruleBody = (
    event.rules ||
    event.description ||
    "Pays $1 a share to the winning side when this market resolves."
  )
    .replace(/\s*Winning shares pay \$1[^.]*\.\s*$/i, "")
    .trim();

  const RuleCard = <TradeRuleCard body={ruleBody} />;


  const heldNowWorth = heldPos ? heldPos.marginNum + heldPnlNum : 0;

  const YourPosition = heldPos ? (
    <LitePositionCard
      sideLabel={heldIsYes ? yesLabel : noLabel}
      isYes={heldIsYes}
      boost={heldPos.leverageNum}
      putIn={heldPos.marginNum}
      nowWorth={heldNowWorth}
      profit={heldPnlNum}
      autoCloseText={heldAutoClose?.text ?? "None"}
      autoCloseSub={heldAutoClose?.sub}
      autoCloseHot={heldAutoClose?.hot}
      compact={!!isMobile}
      cashOutDisabledText={inReview ? IN_REVIEW_HOLD_LINE : undefined}
      onCashOut={() => setCashOutOpen(true)}
    />
  ) : null;

  const CashOut = heldPos && !inReview ? (
    <LiteCashOutFlow
      open={cashOutOpen}
      onOpenChange={setCashOutOpen}
      isMobile={!!isMobile}
      positionId={heldPos.id}
      positionIndex={heldIndex}
      currentValue={heldNowWorth}
      sizeNum={heldPos.sizeNum}
      sideLabel={heldIsYes ? yesLabel : noLabel}
      shareContext={{
        eventId: event.id,
        eventName: event.name,
        sideLine: [heldIsYes ? yesLabel : noLabel, boostSuffix(heldPos.leverageNum)]
          .filter(Boolean)
          .join(" · "),
        boost: heldPos.leverageNum,
        putIn: heldPos.marginNum,
        productLine: "futures",
      }}
      onShareSnapshot={setShareSnap}
      onDone={() => {
        setRefetchTick((n) => n + 1);
        refetchPositions();
      }}
    />
  ) : null;

  const MarketActivity = (
    <LiteMarketActivity
      rows={activity}
      yesLabel={yesLabel}
      noLabel={noLabel}
      maxRows={isMobile ? 4 : 8}
      showOptionLabel={isMulti}
    />
  );

  // ---- Mobile multi: meta chip row (sits ABOVE the title) ----
  const MultiMetaRow = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-white/[0.07] px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
        {event.options.length} markets
      </span>
      <span className="font-mono text-[11.5px] text-muted-foreground">
        {endDate
          ? `Settles ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · `
          : ""}
        {countdown} · {volumeText}
      </span>
    </div>
  );

  const CrowdOverview = (
    <LiteCrowdOverview
      options={event.options.map((o) => ({
        id: o.id,
        label: o.label,
        yesPrice: pricesCtx?.getPrice(o.id) ?? Number(o.price),
        settled: o.final_price != null,
      }))}
    />
  );

  // ---- Multi-market: one card per held leg, cash out per card ----
  const cashOutTarget = cashOutId
    ? multiHeld.find((p) => p.id === cashOutId) || null
    : null;

  const MultiPositions =
    boardMode && multiHeld.length > 0 ? (
      <div className="space-y-3">
        {multiHeld.map((p) => {
          const isYesLeg = !legIsNo(p);
          const ac = autoCloseDisplayFor(p);
          // Side-labelled legs (fixture lines) are named by their side label
          // alone; generic multi options keep "{option} · Yes|No". 1× adds
          // no Boost suffix.
          const title = [
            hasSideLabels(p.event)
              ? legSideWord(p)
              : `${baseOptionLabel(p.option)} · ${legSideWord(p)}`,
            boostSuffix(p.leverageNum),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <LitePositionCard
              key={p.id}
              sideLabel={title}
              isYes={isYesLeg}
              boost={1}
              putIn={p.marginNum}
              nowWorth={p.marginNum + p.pnlNum}
              profit={p.pnlNum}
              autoCloseText={ac.text}
              autoCloseSub={ac.sub}
              autoCloseHot={ac.hot}
              compact={!!isMobile}
              cashOutDisabledText={inReview ? IN_REVIEW_HOLD_LINE : undefined}
              onCashOut={() => setCashOutId(p.id)}
            />
          );
        })}
      </div>
    ) : null;

  const MultiCashOut = cashOutTarget && !inReview ? (
    <LiteCashOutFlow
      open={!!cashOutId}
      onOpenChange={(o) => !o && setCashOutId(null)}
      isMobile={!!isMobile}
      positionId={cashOutTarget.id}
      positionIndex={positions.findIndex((p) => p.id === cashOutTarget.id)}
      currentValue={cashOutTarget.marginNum + cashOutTarget.pnlNum}
      sizeNum={cashOutTarget.sizeNum}
      sideLabel={
        hasSideLabels(cashOutTarget.event)
          ? legSideWord(cashOutTarget)
          : `${baseOptionLabel(cashOutTarget.option)} · ${legSideWord(cashOutTarget)}`
      }
      onDone={() => {
        setCashOutId(null);
        setRefetchTick((n) => n + 1);
        refetchPositions();
      }}
    />
  ) : null;

  const MoreMarkets = (
    <TradeMoreMarkets
      title={resolved ? "Still live" : "More markets"}
      rows={more.map((m) => ({ id: m.id, name: m.name, yesPct: m.yesPct }))}
      onOpen={(id) => navigate(`/trade?event=${id}`)}
    />
  );


  const winnerOpt = event.options.find((o) => o.is_winner) || yesOpt;
  const loserOpt = event.options.find((o) => o.id !== winnerOpt.id) || noOpt;
  const labelFor = (optId: string) => (optId === yesOpt.id ? yesLabel : noLabel);

  const InReview = inReview ? (
    <InReviewCard sourceName={event.source_name} holding={!!heldPos || multiHeld.length > 0} />
  ) : null;

  const OutcomeCard = resolved ? (
    <LiteOutcomeCard
      settledAt={event.settled_at}
      winnerLabel={labelFor(winnerOpt.id)}
      winnerIsYes={winnerOpt.id === yesOpt.id}
      loserLabel={labelFor(loserOpt.id)}
      options={
        isMulti
          ? event.options.map((o) => ({
              id: o.id,
              label: o.label,
              isWinner: !!o.is_winner,
            }))
          : null
      }
      sourceName={event.source_name}
      sourceUrl={event.source_url}
      summary={event.settlement_description}
      holding={
        heldPos
          ? {
              sideLabel: heldIsYes ? yesLabel : noLabel,
              isYesSide: heldIsYes,
              boost: heldPos.leverageNum,
              putIn: heldPos.marginNum,
              paidOut: heldPos.markPriceNum * heldPos.sizeNum,
              profit: heldPos.pnlNum,
            }
          : null
      }
      onBrowse={() => navigate("/events")}
    />
  ) : null;

  // Proof segment — numeric rows only for threshold events with a base price.
  const Proof = resolved ? (
    <HowItSettled
      summary={event.settlement_description}
      criterion={
        event.base_price != null && event.close_price != null
          ? {
              neededLabel: "Needed",
              neededValue: `$${Number(event.base_price).toLocaleString()}`,
              actualLabel: "Actual",
              actualValue: `$${Number(event.close_price).toLocaleString()}`,
            }
          : null
      }
      sourceName={event.source_name}
      sourceUrl={event.source_url}
    />
  ) : null;

  const binaryPanelProps = {
    eventName: event.name,
    yesLabel,
    noLabel,
    yesPrice: yesLive,
    noPrice: noLive,
    yesOptionId: yesOpt.id,
    noOptionId: noOpt.id,
    yesOptionLabel: yesOpt.label,
    noOptionLabel: noOpt.label,
    blocked,
    blockedReason,
    side,
    onSideChange: setSide,
    amount,
    onAmountChange: setAmount,
    boost,
    onBoostChange: setBoost,
    boostEnabled: boostCfg.enabled,
    boostLoading,
    boostMax: boostCfg.maxBoost,
    boostTiers: tiers,
    countdownText: countdown,
    heldSideLabel: heldPos ? (heldIsYes ? yesLabel : noLabel) : null,
    heldCurrentValue: heldPos ? heldNowWorth : null,
    heldQty: heldPos ? heldPos.sizeNum : null,
    onRequestAuth: () => {
      if (isMobile) {
        setDrawerOpen(false);
        setResumeBuy(true);
      }
      setAuthOpen(true);
    },
  } as const;

  // Multi-market rail: bound to the SELECTED option only. Both sides of that
  // option are buyable; the No leg is recorded under the derived label.
  const multiPanelProps = selOpt
    ? ({
        ...binaryPanelProps,
        yesLabel: "Yes",
        noLabel: "No",
        yesPrice: selYes,
        noPrice: selNo,
        yesOptionId: selOpt.id,
        noOptionId: selOpt.id,
        yesOptionLabel: selOpt.label,
        // Same option_label on both sides so the engine can net them; the No
        // leg is distinguished by side ("sell" → short).
        noOptionLabel: selOpt.label,
        noAsSell: true,
        blocked: blocked || selOpt.final_price != null,
        blockedReason: selOpt.final_price != null ? "Settled" : blockedReason,
        marketContextLabel: selOpt.label,
        blockNotice: null,
        heldSideLabel: heldOnSelected ? (heldOnSelectedIsNo ? "No" : "Yes") : null,
        heldCurrentValue: heldOnSelected
          ? heldOnSelected.marginNum + heldOnSelected.pnlNum
          : null,
        heldQty: heldOnSelected ? heldOnSelected.sizeNum : null,
        nettingScopeLabel: "on this market",
      } as const)
    : null;

  // ---- Game lines: the rail binds to the selected sibling event ----
  const selectedLineEvent =
    hasLines && selectedOptId
      ? [activeHandicap, activeTotal].find(
          (ev) => !!ev && ev.options.some((o) => o.id === selectedOptId),
        ) || null
      : null;
  const selectedLineGroup =
    selectedLineEvent && selectedLineEvent.id === activeHandicap?.id
      ? "Handicap"
      : selectedLineEvent
        ? `Total ${noun}`
        : null;

  const linePanelProps = (() => {
    if (!selectedLineEvent) return null;
    const s = splitBinary(selectedLineEvent);
    if (!s.yesOpt || !s.noOpt) return null;
    const held = multiHeld.find((p) => p.event === selectedLineEvent.name) || null;
    const heldIsNo = held ? legIsNo(held) : false;
    return {
      ...binaryPanelProps,
      eventName: selectedLineEvent.name,
      yesLabel: s.yesLabel,
      noLabel: s.noLabel,
      yesPrice: pricesCtx?.getPrice(s.yesOpt.id) ?? Number(s.yesOpt.price),
      noPrice: pricesCtx?.getPrice(s.noOpt.id) ?? Number(s.noOpt.price),
      yesOptionId: s.yesOpt.id,
      noOptionId: s.noOpt.id,
      yesOptionLabel: s.yesOpt.label,
      noOptionLabel: s.noOpt.label,
      blocked: blocked || s.yesOpt.final_price != null,
      blockedReason: s.yesOpt.final_price != null ? "Settled" : blockedReason,
      marketContextLabel: `${event.name} · ${selectedLineGroup} · ${
        side === "yes" ? s.yesLabel : s.noLabel
      }`,
      heldSideLabel: held ? (heldIsNo ? s.noLabel : s.yesLabel) : null,
      heldCurrentValue: held ? held.marginNum + held.pnlNum : null,
      heldQty: held ? held.sizeNum : null,
      nettingScopeLabel: "on this market",
    } as const;
  })();

  const panelProps =
    linePanelProps ?? (isMulti && multiPanelProps ? multiPanelProps : binaryPanelProps);
  const orderContextLine = linePanelProps
    ? (linePanelProps.marketContextLabel as string)
    : isMulti && selOpt
      ? selOpt.label
      : event.name;

  // -------- Mobile --------
  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background pb-32">
          <MobileHeader
            title={event.name}
            titleHidden={!scrolledOut}
            showLogo={false}
            showBack={true}
            backTo={backHref}
            rightContent={<div className="flex items-center gap-1 -mr-2">{WatchStar}</div>}
          />
          <div className="space-y-4 px-4 py-4">
            {isMulti && !resolved && MultiMetaRow}
            {QuestionBlock}
            {resolved ? (
              <>
                {OutcomeCard}
                {Chart}
                {boardMode ? BoardModule : SentimentBar}
                {Proof}
                {RuleCard}
                {MarketActivity}
                {MoreMarkets}
              </>
            ) : boardMode ? (
              <>
                {InReview}
                {isMulti && CrowdOverview}
                {BoardModule}
                {RuleCard}
                {MultiPositions}
                {MarketActivity}
                {MoreMarkets}
              </>
            ) : (
              <>
                {InReview}
                {Chart}
                {SentimentBar}
                {RuleCard}
                {YourPosition}
                {MarketActivity}
                {MoreMarkets}
              </>
            )}
          </div>

          {!boardMode && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-4 pt-3 backdrop-blur"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 12px)" }}
          >
            {resolved ? (
              <button
                type="button"
                onClick={() => navigate("/portfolio")}
                className="w-full rounded-xl bg-no py-3 font-display text-sm font-bold text-[#1a2408]"
              >
                View in Portfolio →
              </button>
            ) : (
              <div className="mx-auto flex max-w-md gap-2">
                <BuyButton
                  tone="yes"
                  label={`Buy ${yesLabel}`}
                  cents={Math.round(yesLive * 100)}
                  boostLine={boostCfg.enabled && boost > 1 ? `${boost}× BOOST` : null}
                  disabled={blocked}
                  onClick={() => openBuy("yes")}
                />
                <BuyButton
                  tone="no"
                  label={`Buy ${noLabel}`}
                  cents={Math.round(noLive * 100)}
                  boostLine={boostCfg.enabled && boost > 1 ? `${boost}× BOOST` : null}
                  disabled={blocked}
                  onClick={() => openBuy("no")}
                />
              </div>
            )}
          </div>
          )}

          <MobileDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            showHandle
            hideCloseButton
            // Drops the shared bottom-sheet's pb-24 tail (per-usage override).
            className="pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
          >
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    side === "yes" ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
                  )}
                >
                  {side === "yes" ? panelProps.yesLabel : panelProps.noLabel}
                </span>
                <span className="truncate text-sm font-semibold">
                  {orderContextLine}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {countdown} left ·{" "}
                {Math.round(
                  (side === "yes" ? panelProps.yesPrice : panelProps.noPrice) * 100,
                )}
                % chance
              </div>
            </div>
            <LiteContractOrderPanel
              {...panelProps}
              variant="mobile"
              onFilled={() => {
                setDrawerOpen(false);
                setRefetchTick((n) => n + 1);
                refetchPositions();
              }}
            />
          </MobileDrawer>

          <AuthSheet
            open={authOpen}
            onOpenChange={(o) => {
              setAuthOpen(o);
              if (!o) {
                if (resumeBuy && user) setDrawerOpen(true);
                setResumeBuy(false);
              }
            }}
          />
          {CashOut}
          {MultiCashOut}
        </div>
      </TooltipProvider>
    );
  }

  // -------- Desktop --------
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <EventsDesktopHeader />
        <div
          className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:px-6"
          style={{ gridTemplateColumns: "minmax(0, 1fr) 380px" }}
        >
          <div className="space-y-5">
            {QuestionBlock}
            {resolved ? (
              <>
                {boardMode ? BoardModule : SentimentBar}
                {Chart}
                {Proof}
                {RuleCard}
                {MarketActivity}
              </>
            ) : boardMode ? (
              <>
                {InReview}
                {BoardModule}
                {RuleCard}
                {MultiPositions}
                {MarketActivity}
              </>
            ) : (
              <>
                {InReview}
                {SentimentBar}
                {Chart}
                {RuleCard}
                {YourPosition}
                {MarketActivity}
              </>
            )}
          </div>
          <aside className="space-y-4">
            {resolved ? (
              OutcomeCard
            ) : (
              <LiteContractOrderPanel
                {...panelProps}
                variant="desktop"
                onFilled={() => {
                  setRefetchTick((n) => n + 1);
                  refetchPositions();
                }}
              />
            )}
            {MoreMarkets}
          </aside>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        {CashOut}
        {MultiCashOut}
      </div>
    </TooltipProvider>
  );
};

const BuyButton = ({
  tone,
  label,
  cents,
  boostLine,
  disabled,
  onClick,
}: {
  tone: "yes" | "no";
  label: string;
  cents: number;
  boostLine: string | null;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex flex-1 flex-col items-center rounded-xl py-2.5 font-display font-bold leading-tight disabled:opacity-50",
      tone === "yes"
        ? "bg-yes text-[#04222c]"
        : "border border-no/25 bg-no/14 text-no",
    )}
  >
    <span className="text-sm">{label}</span>
    <span className="font-mono text-[13px]">{cents}¢</span>
    {boostLine && <span className="font-mono text-[10px] opacity-75">{boostLine}</span>}
  </button>
);

export default LiteContractTrade;
