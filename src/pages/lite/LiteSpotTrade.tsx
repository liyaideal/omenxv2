// ============================================================
// /spot (surface=lite) — US-stock daily up/down, odds-forward.
// Display-layer fork of the Pro SpotTrading terminal. Reuses the
// existing spot execution service; no schema or logic changes.
//
// P0 guardrails live inside LiteOrderPanel (price snapshot at
// submit; cash leg per SpotTrading). Time gating / formatting
// derives from freeze_time / end_date / lifecycle_status only.
// ============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Info, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { executeSpotTrade } from "@/services/tradingService";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { useHeadingScrolledOut } from "@/hooks/useHeadingScrolledOut";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { parseSideLabels } from "@/lib/eventUtils";
import { liteSideName } from "@/lib/liteSideName";
import {
  formatMarketPrice,
  resolveStockMarket,
  getMarketSession,
  formatLocalStamp,
  formatLocalTime,
  formatLocalDate,
  sessionWindowFor,
  getBlockedReason,
  getDisplayLifecycle,
  isOrderingBlocked,
  isPastFreeze,
  FREEZE_MINUTES_BEFORE_CLOSE,
} from "@/lib/usStockSessions";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import type { Tables } from "@/integrations/supabase/types";
import { LiteStockChart } from "@/components/lite/trade/LiteStockChart";
import LiteQuickTrade from "@/pages/lite/LiteQuickTrade";
import {
  formatClockCountdown,
  parseQuickId,
  useSecondTick,
  useTradeCountdown,
} from "@/components/lite/intraday/intradayData";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import {
  LiteCashOutFlow,
  type CashOutShareSnapshot,
} from "@/components/lite/contract/LiteCashOutFlow";
import { LiteCashOutShareCard } from "@/components/lite/share/LiteShareFlow";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { HowItSettled } from "@/components/lite/trade/HowItSettled";
import { InReviewCard, IN_REVIEW_HOLD_LINE } from "@/components/lite/trade/InReviewCard";
import {
  usePastDays,
  useTodayEventId,
} from "@/components/lite/shared/pastDays";
import { RoundTape, type TapeCurrentSlot } from "@/components/lite/shared/RoundTape";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";
import {
  SpotSentimentBar,
  SpotSettlementRail,
  SpotYourPosition,
} from "@/components/lite/trade/SpotBlocks";
import {
  SpotBuyDrawerHeader,
  SpotSideRailStocks,
  SpotStockHead,
} from "@/components/lite/trade/SpotHeadBlocks";


type EventRow = Tables<"events"> & { options: Tables<"event_options">[] };
type Side = "yes" | "no";

// Countdown comes from the shared `useTradeCountdown` (intradayData) — one
// countdown implementation for both Lite trade pages.

// Market activity is the shared anonymised all-user feed — see
// `useMarketActivityRows` in LiteMarketActivity (same module as the contract page).

// -------- other closing stocks --------
interface OtherStockRow {
  id: string;
  name: string;
  ticker: string;
  upPct: number;
}
const useOtherStocks = (currentEventId: string) => {
  const [rows, setRows] = useState<OtherStockRow[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: evs } = await supabase
        .from("events")
        .select("id, name, options:event_options(id, label, price)")
        .eq("category", "stocks")
        .eq("is_resolved", false)
        .order("end_date", { ascending: true })
        .limit(8);
      if (!alive) return;
      const list: OtherStockRow[] = (evs || [])
        .filter((e) => e.id !== currentEventId)
        .slice(0, 5)
        .map((e) => {
          const opts = (e.options || []) as { label: string; price: number }[];
          const yes = opts.find((o) => /(^|[-_ ])(yes|up)$/i.test(o.label)) || opts[0];
          const p = yes ? Number(yes.price) : 0.5;
          return {
            id: e.id,
            name: e.name,
            ticker: deriveTickerFromEvent(e.id, e.name),
            upPct: Math.round(p * 100),
          };
        });
      setRows(list);
    })();
    return () => {
      alive = false;
    };
  }, [currentEventId]);
  return rows;
};

// ============================================================
// Page
// ============================================================
const LiteSpotTrade = () => {
  const [params] = useSearchParams();
  const eventId = params.get("event") || "";
  const sideParam = params.get("side");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const routerLocation = useLocation();
  // Back goes home to wherever the reader came from (portfolio keeps its spot).
  const backHref =
    (routerLocation.state as { from?: string } | null)?.from ?? "/events";
  const { user } = useAuth();
  const { positions } = usePositions();
  const { addSpotBalance } = useUserProfile();
  const { isWatched, toggle } = useWatchlist();
  const { headingRef, scrolledOut } = useHeadingScrolledOut();
  const pricesCtx = useRealtimePricesOptional();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [side, setSide] = useState<Side>("yes");

  // Deep links may preselect a direction (`&side=up|down`).
  useEffect(() => {
    if (sideParam === "up") setSide("yes");
    else if (sideParam === "down") setSide("no");
  }, [sideParam]);

  const [amount, setAmount] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [resumeBuy, setResumeBuy] = useState(false);
  const [refetchTick, setRefetchTick] = useState(0);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  // Cash-out share card lives on the page: a full close unmounts the flow.
  const [shareSnap, setShareSnap] = useState<CashOutShareSnapshot | null>(null);

  // Fetch event
  useEffect(() => {
    if (!eventId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ data: e }, { data: opts }] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
        supabase.from("event_options").select("*").eq("event_id", eventId),
      ]);
      if (!alive) return;
      if (!e) setNotFound(true);
      else setEvent({ ...e, options: opts || [] });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [eventId, refetchTick]);

  const sideLabels = useMemo(() => parseSideLabels(event?.side_labels), [event]);
  const yesLabel = sideLabels?.yes || "Up";
  const noLabel = useMemo(() => liteSideName(sideLabels?.no), [sideLabels?.no]);

  const yesOpt = useMemo(() => {
    if (!event) return null;
    const alias = (sideLabels?.yes || "").trim().toLowerCase();
    return (
      (alias && event.options.find((o) => o.label.trim().toLowerCase() === alias)) ||
      event.options.find((o) => /(^|[-_ ])(yes|up)$/i.test(o.label)) ||
      event.options[0] ||
      null
    );
  }, [event, sideLabels]);
  const noOpt = useMemo(() => {
    if (!event || !yesOpt) return null;
    return event.options.find((o) => o.id !== yesOpt.id) || event.options[1] || null;
  }, [event, yesOpt]);

  const yesLive = yesOpt ? (pricesCtx?.getPrice(yesOpt.id) ?? Number(yesOpt.price)) : 0.5;
  const noLive = noOpt ? (pricesCtx?.getPrice(noOpt.id) ?? Number(noOpt.price)) : 0.5;

  const endDate = event?.end_date ? new Date(event.end_date) : null;
  const freezeAt = event?.freeze_time ? new Date(event.freeze_time) : null;
  const countdownTarget = freezeAt ?? endDate;
  const { text: countdown } = useTradeCountdown(countdownTarget);
  const market = resolveStockMarket(event);
  // R1 — viewer-local clock, no zone suffix.
  const closeEt = freezeAt
    ? formatLocalTime(freezeAt)
    : endDate
      ? formatLocalTime(endDate)
      : null;
  const marketWindow = sessionWindowFor(market);

  const dbLifecycle = event?.lifecycle_status || "TRADING";
  const resolved = !!event?.is_resolved;
  // Result is being checked — between trading close and settlement.
  const inReview = !resolved && dbLifecycle === "REVIEW";
  const lifecycle = getDisplayLifecycle(dbLifecycle);
  const blockedByState = isOrderingBlocked(dbLifecycle);
  const blockedByTime = isPastFreeze(freezeAt, endDate);
  const blocked = blockedByState || blockedByTime;
  const blockedReason =
    getBlockedReason(dbLifecycle) || (blockedByTime ? "Closing soon" : "");

  // Ticker + display
  const ticker = event ? deriveTickerFromEvent(event.id, event.name) : "STOCK";
  const company = STOCK_NAME[ticker] ?? ticker;

  // Base + indicative "today's" price. DEMO-STATE synth around base_price.
  const basePrice = event?.base_price != null ? Number(event.base_price) : null;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, []);
  const currentPrice = useMemo(() => {
    if (!basePrice) return null;
    // Settled: the chart freezes at the final close — no live drift.
    if (event?.is_resolved) {
      // No fake data on settled pages: without a real close we show nothing.
      return event.close_price != null ? Number(event.close_price) : null;
    }
    const drift = Math.sin(tick / 3 + (event?.id.length || 0) % 7) * 0.009;
    return basePrice * (1 + drift);
  }, [basePrice, tick, event?.id, event?.is_resolved, event?.options, event?.close_price]);
  const pctToday = basePrice && currentPrice ? ((currentPrice - basePrice) / basePrice) * 100 : 0;
  // Settled events without a recorded close show no price / % figures.
  const showPriceReadout = currentPrice != null;

  // Sentiment %s
  const upPct = Math.max(1, Math.min(99, Math.round(yesLive * 100)));
  const downPct = 100 - upPct;

  // Held position on this event, if any (spot only).
  const heldIndex = useMemo(() => {
    if (!event) return -1;
    return positions.findIndex(
      (p) => p.productLine === "spot" && p.event === event.name,
    );
  }, [positions, event]);
  const heldPos = heldIndex >= 0 ? positions[heldIndex] : null;

  // Watchlist star
  const starred = event ? isWatched(event.id) : false;

  // Shared anonymised all-user activity + more stocks
  const activity = useMarketActivityRows(
    event?.name || null,
    yesOpt?.label || "",
    refetchTick,
  );
  const otherStocks = useOtherStocks(event?.id || "");
  const pastDays = usePastDays(eventId, yesOpt?.label);
  const todayEventId = useTodayEventId(eventId);

  // Spot cash-out routes through the existing spot SELL path (not the generic
  // position close) because only that path credits the cash balance.
  const handleSpotCashOut = useCallback(
    async (qty: number) => {
      if (!user || !event || !heldPos) throw new Error("Sign in to cash out");
      const optionId = heldPos.optionId || yesOpt?.id;
      if (!optionId) throw new Error("Market data unavailable");
      const isYesHeld = optionId === yesOpt?.id;
      const price = isYesHeld ? yesLive : noLive;
      const res = await executeSpotTrade(user.id, {
        eventName: event.name,
        optionLabel: heldPos.option,
        optionId,
        side: "sell",
        price,
        quantity: qty,
      });
      if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
    },
    [user, event, heldPos, yesOpt?.id, yesLive, noLive, addSpotBalance],
  );

  const openBuy = useCallback(
    (s: Side) => {
      setSide(s);
      if (isMobile) setDrawerOpen(true);
    },
    [isMobile],
  );

  // Intraday family: the current day slot is the SAME orange countdown pill the
  // quick-round tape uses. Session state comes from the exchange wall clock.
  useSecondTick();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // Bare /spot (no event param) is not a dead link — send users to the market list.
  if (!eventId) return <Navigate to="/events" replace />;
  if (notFound || !event || !yesOpt || !noOpt) {
    return <ExpiredEventFallback eventId={eventId} />;
  }

  // Volume — deterministic mock derived from event id (stable across renders).
  const volSeed = event.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const volDollars = 30_000_000 + (volSeed % 45_000_000);
  const volText =
    volDollars >= 1_000_000
      ? `$${(volDollars / 1_000_000).toFixed(1)}M`
      : `$${(volDollars / 1_000).toFixed(0)}K`;

  // Watchlist star (used in both surfaces).
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

  // Compact countdown line — MOBILE ONLY (desktop shows time left in the order card).
  const CountdownLine = (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          lifecycle === "TRADING" ? "bg-trading-green animate-pulse" : "bg-muted-foreground",
        )}
      />
      <span>Closes in</span>
      <span className="font-mono font-medium text-foreground">{countdown}</span>
      {closeEt && (
        <>
          <span>·</span>
          <span className="font-mono">{closeEt}</span>
        </>
      )}
    </div>
  );

  // ============ Building blocks ============
  const QuestionBlock = (
    <SpotStockHead
      title={event.name}
      headingRef={headingRef as unknown as React.Ref<HTMLHeadingElement>}
      priceText={currentPrice != null ? formatMarketPrice(currentPrice, market) : null}
      pctToday={basePrice != null && showPriceReadout ? pctToday : null}
      priceToBeatText={basePrice != null ? formatMarketPrice(basePrice, market) : null}
      volText={volText}
      rightSlot={!isMobile ? WatchStar : null}
    />
  );


  const SentimentBar = (
    <SpotSentimentBar
      yesLabel={yesLabel}
      noLabel={noLabel}
      yesPct={upPct}
      volText={volText}
    />
  );

  const Chart = (
    <LiteStockChart
      ticker={ticker}
      basePrice={basePrice}
      currentPrice={currentPrice}
      upOdds={yesLive}
      side={side}
      upLabel={yesLabel}
      downLabel={noLabel}
      endDate={event?.end_date}
      currency={market.currency}
    />
  );

  const SettlementRail = (
    <SpotSettlementRail
      blocked={blocked || resolved}
      settled={resolved}
      tradingNow={!resolved && lifecycle === "TRADING"}
      nodes={[
        { key: "opened", label: "Opened", time: "" },
        { key: "open", label: "Market open", time: formatLocalTime(marketWindow.openAt) },
        {
          key: "now",
          label: resolved ? "Closed" : blocked ? "Closed" : "Trading NOW",
          time: "",
          now: !resolved,
        },
        {
          key: "closes",
          label: "Closes",
          time: freezeAt
            ? formatLocalTime(freezeAt)
            : `close − ${FREEZE_MINUTES_BEFORE_CLOSE}min`,
        },
        {
          key: "settles",
          label: resolved ? "Settled" : inReview ? "In review" : "Settles",
          time: endDate ? formatLocalTime(endDate) : "—",
        },
      ]}
    />
  );

  const RuleCard = (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        Wins <span className="font-semibold text-yes">{yesLabel}</span> if{" "}
        <span className="text-foreground">{ticker}</span>'s {market.short} close (
        {formatLocalTime(endDate ?? marketWindow.closeAt)}) beats{" "}
        {basePrice != null ? (
          <span className="font-mono text-foreground">
            {formatMarketPrice(basePrice, market)}
          </span>
        ) : (
          "yesterday's close"
        )}
        . A flat close counts as <span className="font-semibold text-no">{noLabel}</span>.
        Each winning share pays{" "}
        <span className="font-mono text-foreground">$1</span>, credited automatically at
        settlement.
      </p>
    </div>
  );

  const YourPosition = heldPos ? (
    <SpotYourPosition
      isYesSide={
        heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
      }
      sideLabel={
        heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
          ? yesLabel
          : noLabel
      }
      sizeDisplay={heldPos.sizeDisplay}
      pnl={heldPos.pnl}
      pnlPercent={heldPos.pnlPercent}
      currentValue={heldPos.markPriceNum * heldPos.sizeNum}
      avgCost={heldPos.entryPrice}
      ifWinsLabel={`If ${yesLabel} wins`}
      ifWinsValue={`$${heldPos.sizeNum.toFixed(0)}`}
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
      currentValue={heldPos.markPriceNum * heldPos.sizeNum}
      sizeNum={heldPos.sizeNum}
      sideLabel={
        heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
          ? yesLabel
          : noLabel
      }
      shareContext={{
        eventId: event.id,
        eventName: event.name,
        sideLine: `${
          heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
            ? yesLabel
            : noLabel
        } · Standard`,
        boost: 1,
        putIn: (parseFloat(String(heldPos.entryPrice).replace(/[^0-9.]/g, "")) || 0) * heldPos.sizeNum,
        productLine: "spot",
      }}
      onShareSnapshot={setShareSnap}
      onConfirmCashOut={handleSpotCashOut}
      onDone={() => setRefetchTick((n) => n + 1)}
    />
  ) : null;

  const MarketActivity = (
    <LiteMarketActivity
      rows={activity}
      yesLabel={yesLabel}
      noLabel={noLabel}
      maxRows={isMobile ? 4 : 8}
    />
  );

  const MoreStocks = (
    <SpotSideRailStocks
      rows={otherStocks.map((s) => ({
        key: s.id,
        ticker: s.ticker,
        label: `${STOCK_NAME[s.ticker] ?? s.ticker} — close higher?`,
        upPct: s.upPct,
        onClick: () => navigate(`/spot?event=${s.id}`),
      }))}
    />
  );


  // ============ Layouts ============
  // Settled outcome. Winner comes from the DB flag when present; otherwise we
  // fall back to the option whose final price settled at ≥ 0.5.
  const heldIsUp =
    heldPos != null &&
    heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase();
  const winnerOpt =
    event.options.find((o) => o.is_winner) ||
    (Number(yesOpt.price) >= 0.5 ? yesOpt : noOpt);
  const loserOpt = winnerOpt.id === yesOpt.id ? noOpt : yesOpt;
  const labelForOpt = (optId: string) => (optId === yesOpt.id ? yesLabel : noLabel);

  const InReview = inReview ? (
    <InReviewCard sourceName={event.source_name} holding={!!heldPos} />
  ) : null;

  const OutcomeCard = resolved ? (
    <LiteOutcomeCard
      settledAt={event.settled_at}
      winnerLabel={labelForOpt(winnerOpt.id)}
      winnerIsYes={winnerOpt.id === yesOpt.id}
      loserLabel={labelForOpt(loserOpt.id)}
      sourceName={event.source_name}
      sourceUrl={event.source_url}
      summary={event.settlement_description}
      holding={
        heldPos
          ? {
              sideLabel: heldIsUp ? yesLabel : noLabel,
              isYesSide: heldIsUp,
              boost: 1,
              putIn: heldPos.marginNum,
              paidOut: heldPos.markPriceNum * heldPos.sizeNum,
              profit: heldPos.pnlNum,
            }
          : null
      }
      onBrowse={() => navigate("/events")}
    />
  ) : null;

  // Proof segment — daily stocks always carry a numeric criterion
  // (previous close vs final close), so both rows render when we have data.
  const Proof = resolved ? (
    <HowItSettled
      summary={event.settlement_description}
      criterion={
        basePrice != null && event.close_price != null
          ? {
              neededLabel: `Needed — close above ${ticker}'s previous close`,
              neededValue: formatMarketPrice(basePrice, market),
              actualLabel: "Actual — final close",
              actualValue: formatMarketPrice(Number(event.close_price), market),
            }
          : null
      }
      sourceName={event.source_name}
      sourceUrl={event.source_url}
    />
  ) : null;

  const tapeSession = getMarketSession(market);
  const SESSION_MS = 6.5 * 60 * 60 * 1000;
  const sessionOpenAt =
    tapeSession.open && tapeSession.closeAt
      ? new Date(tapeSession.closeAt.getTime() - SESSION_MS)
      : tapeSession.nextOpenAt;
  const sessionCloseAt =
    tapeSession.open && tapeSession.closeAt
      ? tapeSession.closeAt
      : new Date(tapeSession.nextOpenAt.getTime() + SESSION_MS);
  // R3 — the day word comes from the viewer-local instant, never the venue date.
  const sessionDate = formatLocalDate(sessionOpenAt).toUpperCase();
  const isOpenNow = tapeSession.open && !!tapeSession.closeAt && !!todayEventId;
  const tapeLeftLabel = {
    micro: isOpenNow ? `TODAY · ${sessionDate}` : `NEXT ROUND · ${sessionDate}`,
    value: `${formatLocalTime(sessionOpenAt)}–${formatLocalTime(sessionCloseAt)}`,
  };
  const tapeSlot: TapeCurrentSlot =
    isOpenNow && tapeSession.closeAt
      ? {
          kind: "countdown",
          text: formatClockCountdown(tapeSession.closeAt.getTime() - Date.now()),
          tooltip: `Today's round · closes at ${formatLocalStamp(tapeSession.closeAt)}`,
          onClick:
            todayEventId === event.id
              ? undefined
              : () => navigate(`/spot?event=${todayEventId}`),
        }
      : {
          kind: "next",
          tooltip: `Next round · opens ${formatLocalStamp(tapeSession.nextOpenAt)}`,
        };

  const PastDays = (
    <RoundTape
      isMobile={!!isMobile}
      leftLabel={tapeLeftLabel}
      chips={pastDays.map((d) => ({
        key: d.id,
        up: d.up,
        active: d.id === event.id,
        onClick: () => navigate(`/spot?event=${d.id}`),
        tooltip: `${d.label} · ${d.up ? yesLabel : noLabel} won`,
      }))}
      currentSlot={tapeSlot}
      legend={
        <>
          Past days — <span style={{ color: "#33D6FF" }}>▲</span> Up won ·{" "}
          <span style={{ color: "#CFFF4A" }}>▼</span> Down won · tap a day to see how
          it settled.
        </>
      }
    />
  );

  const orderPanelProps = {
    eventName: event.name,
    eventId: event.id,
    countdownText: countdown,
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
    onRequestAuth: () => {
      if (isMobile) {
        setDrawerOpen(false);
        setResumeBuy(true);
      }
      setAuthOpen(true);
    },
  } as const;

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
            {QuestionBlock}
            {resolved ? (
              <>
                {OutcomeCard}
                {PastDays}
                {Chart}
                {SentimentBar}
                {Proof}
                {RuleCard}
                {SettlementRail}
                {MarketActivity}
                <button
                  type="button"
                  onClick={() => navigate("/events")}
                  className="w-full rounded-xl border border-border py-3 text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  More stocks closing today · See all →
                </button>
              </>
            ) : (
              <>
                {InReview}
                {CountdownLine}
                {PastDays}
                {Chart}
                {SentimentBar}
                {RuleCard}
                {SettlementRail}
                {YourPosition}
                {MarketActivity}
                {CashOut}
                <LiteCashOutShareCard snap={shareSnap} onClose={() => setShareSnap(null)} />
                <button
                  type="button"
                  onClick={() => navigate("/events")}
                  className="w-full rounded-xl border border-border py-3 text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  More stocks closing today · See all →
                </button>
              </>
            )}
          </div>

          {/* Sticky bottom bar — buy pair while live, single Portfolio link once settled */}
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
              <button
                type="button"
                onClick={() => openBuy("yes")}
                disabled={blocked}
                className="flex flex-1 items-center justify-between rounded-xl bg-yes px-4 py-3 font-display text-sm font-bold text-[#04222c] disabled:opacity-50"
              >
                <span className="truncate">Buy {yesLabel}</span>
                <span className="ml-2 shrink-0 font-mono">{Math.round(yesLive * 100)}¢</span>
              </button>
              <button
                type="button"
                onClick={() => openBuy("no")}
                disabled={blocked}
                className="flex flex-1 items-center justify-between rounded-xl border border-no/25 bg-no/14 px-4 py-3 font-display text-sm font-bold text-no disabled:opacity-50"
              >
                <span className="truncate">Buy {noLabel}</span>
                <span className="ml-2 shrink-0 font-mono">{Math.round(noLive * 100)}¢</span>
              </button>
            </div>
            )}
          </div>

          <MobileDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            showHandle
            hideCloseButton
            // Root cause of the trailing blank: the shared bottom-sheet
            // variant ships `pb-24`. Overridden per-usage here (the shell
            // itself stays untouched) so the drawer hugs its content.
            className="pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
          >
            <SpotBuyDrawerHeader
              isYesSide={side === "yes"}
              sideLabel={side === "yes" ? yesLabel : noLabel}
              title={`Buy ${ticker}`}
              leadText="Closes in"
              countdown={countdown}
              chancePct={Math.round((side === "yes" ? yesLive : noLive) * 100)}
            />

            <LiteOrderPanel
              {...orderPanelProps}
              variant="mobile"
              onFilled={() => {
                setDrawerOpen(false);
                setRefetchTick((n) => n + 1);
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
        </div>
      </TooltipProvider>
    );
  }

  // Desktop
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
            {PastDays}
            {SentimentBar}
            {Chart}
            {SettlementRail}
            {resolved && Proof}
            {InReview}
            {RuleCard}
            {!resolved && YourPosition}
            {MarketActivity}
            {!resolved && CashOut}
            <LiteCashOutShareCard snap={shareSnap} onClose={() => setShareSnap(null)} />
          </div>
          <aside className="space-y-4">
            {resolved ? (
              OutcomeCard
            ) : (
              <LiteOrderPanel
                {...orderPanelProps}
                variant="desktop"
                onFilled={() => {
                  setRefetchTick((n) => n + 1);
                }}
              />
            )}
            {MoreStocks}
          </aside>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    </TooltipProvider>
  );
};

/**
 * Route entry for /spot. Crypto quick rounds (CRYPTO_QUICK_UPDOWN_SPOT)
 * render the intraday fusion trade page; everything else keeps the
 * daily-stock terminal above.
 */
const LiteSpotRoute = () => {
  const [params] = useSearchParams();
  const eventId = params.get("event") || "";
  if (parseQuickId(eventId)) return <LiteQuickTrade eventId={eventId} />;
  return <LiteSpotTrade />;
};

export default LiteSpotRoute;