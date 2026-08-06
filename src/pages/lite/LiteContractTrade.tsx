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
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Info, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { useCategoryBoostConfigs, boostTiers } from "@/hooks/useCategoryBoostConfigs";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { useHeadingScrolledOut } from "@/hooks/useHeadingScrolledOut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { parseSideLabels } from "@/lib/eventUtils";
import { liteSideName } from "@/lib/liteSideName";
import { formatCents, estimateAutoClosePrice } from "@/lib/autoClosePrice";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import type { Tables } from "@/integrations/supabase/types";
import {
  LiteContractChart,
  type MultiSeries,
} from "@/components/lite/contract/LiteContractChart";
import { HowItSettled } from "@/components/lite/trade/HowItSettled";
import { LiteContractOrderPanel } from "@/components/lite/contract/LiteContractOrderPanel";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { LiteSentimentBar } from "@/components/lite/contract/LiteSentimentBar";
import { LiteMarketBoard, type BoardOption } from "@/components/lite/multi/LiteMarketBoard";
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

// Countdown comes from the shared `useTradeCountdown` (intradayData) — one
// countdown implementation for both Lite trade pages.

// Market activity rows come from the shared `useMarketActivityRows` hook
// (LiteMarketActivity) so the spot page renders the identical feed.

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
        .limit(8);
      if (!alive) return;
      setRows(
        (data || [])
          .filter((e) => e.id !== currentId)
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
  const [refetchTick, setRefetchTick] = useState(0);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  // Multi-market: which option the board / order rail is bound to, and which
  // held leg the cash-out sheet targets.
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [cashOutId, setCashOutId] = useState<string | null>(null);
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
  const pastEnd = endDate ? endDate.getTime() <= Date.now() : false;
  const pastFreeze = freezeAt ? freezeAt.getTime() <= Date.now() : false;
  const blocked = resolved || pastEnd || pastFreeze;
  const blockedReason = resolved
    ? "Settled"
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
    return positions.filter((p) => p.productLine === "futures" && p.event === event.name);
  }, [positions, event]);

  const more = useMoreMarkets(event?.category || null, event?.id || "");

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
    };
  });

  const selectMarket = (optionId: string, s: Side) => {
    setSelectedOptId(optionId);
    setSide(s);
    if (isMobile) setDrawerOpen(true);
  };

  const MarketBoard = (
    <LiteMarketBoard
      options={boardOptions}
      volumeText={volumeText}
      selectedId={selOpt?.id ?? null}
      selectedSide={side}
      onSelect={selectMarket}
      compact={!!isMobile}
      showChart
    />
  );

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

  const heldAutoClose = heldPos != null ? autoCloseFor(heldPos) : null;

  const WatchStar = (
    <button
      type="button"
      onClick={(e) => toggle(event.id, e as unknown as React.MouseEvent)}
      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/50"
      aria-label="Watchlist"
    >
      <Star
        className={cn(
          "h-5 w-5",
          starred ? "fill-trading-yellow text-trading-yellow" : "text-muted-foreground",
        )}
      />
    </button>
  );

  const QuestionBlock = (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {categoryLabel}
        {isMulti && !isMobile && ` · ${event.options.length} markets`}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1
          ref={headingRef as unknown as React.Ref<HTMLHeadingElement>}
          className="font-display font-bold leading-[1.05] tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(24px, 3.5vw, 34px)" }}
        >
          {event.name}
        </h1>
        {!isMobile && <div className="shrink-0">{WatchStar}</div>}
      </div>
    </div>
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

  const RuleCard = (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        {event.rules ||
          event.description ||
          `Pays $1 a share to the winning side when this market resolves.`}{" "}
        Winning shares pay <span className="font-mono text-foreground">$1</span> each,
        credited automatically at settlement.
      </p>
    </div>
  );

  const heldNowWorth = heldPos ? heldPos.marginNum + heldPnlNum : 0;

  const YourPosition = heldPos ? (
    <LitePositionCard
      sideLabel={heldIsYes ? yesLabel : noLabel}
      isYes={heldIsYes}
      boost={heldPos.leverageNum}
      putIn={heldPos.marginNum}
      nowWorth={heldNowWorth}
      profit={heldPnlNum}
      autoCloseText={
        heldPos.leverageNum <= 1
          ? "None"
          : heldAutoClose != null
            ? `≈ ${formatCents(heldAutoClose)}`
            : isMobile
              ? "None"
              : "None at this balance"
      }
      compact={!!isMobile}
      onCashOut={() => setCashOutOpen(true)}
    />
  ) : null;

  const CashOut = heldPos ? (
    <LiteCashOutFlow
      open={cashOutOpen}
      onOpenChange={setCashOutOpen}
      isMobile={!!isMobile}
      positionId={heldPos.id}
      positionIndex={heldIndex}
      currentValue={heldNowWorth}
      sizeNum={heldPos.sizeNum}
      sideLabel={heldIsYes ? yesLabel : noLabel}
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
    isMulti && multiHeld.length > 0 ? (
      <div className="space-y-3">
        {multiHeld.map((p) => {
          const isYesLeg = !legIsNo(p);
          const ac = autoCloseFor(p);
          return (
            <LitePositionCard
              key={p.id}
              sideLabel={`${baseOptionLabel(p.option)} · ${isYesLeg ? "Yes" : "No"} · ${p.leverageNum}× Boost`}
              isYes={isYesLeg}
              boost={1}
              putIn={p.marginNum}
              nowWorth={p.marginNum + p.pnlNum}
              profit={p.pnlNum}
              autoCloseText={
                p.leverageNum <= 1
                  ? "None"
                  : ac != null
                    ? `≈ ${formatCents(ac)}`
                    : isMobile
                      ? "None"
                      : "None at this balance"
              }
              compact={!!isMobile}
              onCashOut={() => setCashOutId(p.id)}
            />
          );
        })}
      </div>
    ) : null;

  const MultiCashOut = cashOutTarget ? (
    <LiteCashOutFlow
      open={!!cashOutId}
      onOpenChange={(o) => !o && setCashOutId(null)}
      isMobile={!!isMobile}
      positionId={cashOutTarget.id}
      positionIndex={positions.findIndex((p) => p.id === cashOutTarget.id)}
      currentValue={cashOutTarget.marginNum + cashOutTarget.pnlNum}
      sizeNum={cashOutTarget.sizeNum}
      sideLabel={`${baseOptionLabel(cashOutTarget.option)} · ${legIsNo(cashOutTarget) ? "No" : "Yes"}`}
      onDone={() => {
        setCashOutId(null);
        setRefetchTick((n) => n + 1);
        refetchPositions();
      }}
    />
  ) : null;

  const MoreMarkets = (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-medium">
        {resolved ? "Still live" : "More markets"}
      </div>
      {more.length === 0 ? (
        <EmptyState
          variant="module"
          bordered={false}
          title="No other markets right now"
          description="New markets show up here as they open."
          className="px-0 py-1"
        />
      ) : (
        <ul className="space-y-1">
          {more.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => navigate(`/trade?event=${m.id}`)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex-1 truncate text-xs">{m.name}</span>
                <span className="font-mono text-xs font-semibold text-yes">
                  {m.yesPct}%
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const winnerOpt = event.options.find((o) => o.is_winner) || yesOpt;
  const loserOpt = event.options.find((o) => o.id !== winnerOpt.id) || noOpt;
  const labelFor = (optId: string) => (optId === yesOpt.id ? yesLabel : noLabel);

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
    onRequestAuth: () => setAuthOpen(true),
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

  const panelProps = isMulti && multiPanelProps ? multiPanelProps : binaryPanelProps;

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
            backTo="/events"
            rightContent={WatchStar}
          />
          <div className="space-y-4 px-4 py-4">
            {isMulti && !resolved && MultiMetaRow}
            {QuestionBlock}
            {resolved ? (
              <>
                {OutcomeCard}
                {Chart}
                {isMulti ? MarketBoard : SentimentBar}
                {Proof}
                {RuleCard}
                {MarketActivity}
                {MoreMarkets}
              </>
            ) : isMulti ? (
              <>
                {CrowdOverview}
                {MarketBoard}
                {RuleCard}
                {MultiPositions}
                {MarketActivity}
                {MoreMarkets}
              </>
            ) : (
              <>
                {Chart}
                {SentimentBar}
                {RuleCard}
                {YourPosition}
                {MarketActivity}
                {MoreMarkets}
              </>
            )}
          </div>

          {!isMulti && (
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
                  {isMulti && selOpt ? selOpt.label : event.name}
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

          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
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
                {isMulti ? MarketBoard : SentimentBar}
                {Chart}
                {Proof}
                {RuleCard}
                {MarketActivity}
              </>
            ) : isMulti ? (
              <>
                {MarketBoard}
                {RuleCard}
                {MultiPositions}
                {MarketActivity}
              </>
            ) : (
              <>
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
