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
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Info, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { executeSpotTrade } from "@/services/tradingService";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
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
  formatMarketTime,
  formatMarketPrice,
  resolveStockMarket,
  getMarketSession,
  formatSessionStamp,
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
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { HowItSettled } from "@/components/lite/trade/HowItSettled";
import {
  usePastDays,
  useTodayEventId,
} from "@/components/lite/shared/pastDays";
import { RoundTape, type TapeCurrentSlot } from "@/components/lite/shared/RoundTape";
import { EmptyState } from "@/components/states";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";
import {
  SpotSentimentBar,
  SpotSettlementRail,
  SpotYourPosition,
} from "@/components/lite/trade/SpotBlocks";

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
  const [refetchTick, setRefetchTick] = useState(0);
  const [cashOutOpen, setCashOutOpen] = useState(false);

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
  const closeEt = freezeAt
    ? formatMarketTime(freezeAt, market)
    : endDate
      ? formatMarketTime(endDate, market)
      : null;

  const dbLifecycle = event?.lifecycle_status || "TRADING";
  const resolved = !!event?.is_resolved;
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
          <span className="font-mono">{closeEt} {market.label}</span>
        </>
      )}
    </div>
  );

  // ============ Building blocks ============
  const QuestionBlock = (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Stocks · Daily up / down
      </div>
      <h1
        ref={headingRef as unknown as React.Ref<HTMLHeadingElement>}
        className="mt-2 font-display font-bold leading-[1.05] tracking-[-0.02em] text-foreground"
        style={{ fontSize: "clamp(24px, 3.5vw, 34px)" }}
      >
        {event.name}
      </h1>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          {currentPrice != null && (
            <span className="text-foreground">{formatMarketPrice(currentPrice, market)}</span>
          )}
          {basePrice != null && showPriceReadout && (
            <span
              className={cn(
                pctToday >= 0 ? "text-trading-green" : "text-trading-red",
              )}
            >
              {pctToday >= 0 ? "▲" : "▼"} {pctToday >= 0 ? "+" : ""}
              {pctToday.toFixed(2)}% today
            </span>
          )}
          {basePrice != null && (
            <span>Price to beat {formatMarketPrice(basePrice, market)}</span>
          )}
          <span>Vol {volText}</span>
        </div>
        {!isMobile && <div className="flex-shrink-0">{WatchStar}</div>}
      </div>
    </div>
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
        { key: "open", label: "Market open", time: market.openLabel },
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
            ? formatMarketTime(freezeAt, market)
            : `close − ${FREEZE_MINUTES_BEFORE_CLOSE}min`,
        },
        {
          key: "settles",
          label: resolved ? "Settled" : "Settles",
          time: endDate ? `${formatMarketTime(endDate, market)} ${market.label}` : "—",
        },
      ]}
    />
  );

  const RuleCard = (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        Wins <span className="font-semibold text-yes">{yesLabel}</span> if{" "}
        <span className="text-foreground">{ticker}</span>'s {market.closeLabel} close beats{" "}
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
      currentValue={heldPos.markPriceNum * heldPos.sizeNum}
      sizeNum={heldPos.sizeNum}
      sideLabel={
        heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
          ? yesLabel
          : noLabel
      }
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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-medium">More stocks closing today</div>
      {otherStocks.length === 0 ? (
        <EmptyState
          variant="module"
          bordered={false}
          title="No other markets right now"
          description="More stocks open here at the start of each trading day."
          className="px-0 py-1"
        />
      ) : (
        <ul className="space-y-1">
          {otherStocks.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => navigate(`/spot?event=${s.id}`)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex h-7 w-9 items-center justify-center rounded bg-muted/50 font-mono text-[10px] font-semibold">
                  {s.ticker}
                </span>
                <span className="flex-1 truncate text-xs">
                  {STOCK_NAME[s.ticker] ?? s.ticker} — close higher?
                </span>
                <span className="font-mono text-xs font-semibold text-yes">
                  {s.upPct}%
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const sessionDate = new Intl.DateTimeFormat("en-US", {
    timeZone: market.tz,
    month: "short",
    day: "numeric",
  })
    .format(sessionOpenAt)
    .toUpperCase();
  const isOpenNow = tapeSession.open && !!tapeSession.closeAt && !!todayEventId;
  const tapeLeftLabel = {
    micro: isOpenNow ? `TODAY · ${sessionDate}` : `NEXT ROUND · ${sessionDate}`,
    value: `${formatMarketTime(sessionOpenAt, market)}–${formatMarketTime(sessionCloseAt, market)}`,
  };
  const tapeSlot: TapeCurrentSlot =
    isOpenNow && tapeSession.closeAt
      ? {
          kind: "countdown",
          text: formatClockCountdown(tapeSession.closeAt.getTime() - Date.now()),
          tooltip: `Today's round · closes at ${formatSessionStamp(tapeSession.closeAt, market)}`,
          onClick:
            todayEventId === event.id
              ? undefined
              : () => navigate(`/spot?event=${todayEventId}`),
        }
      : {
          kind: "next",
          tooltip: `Next round · opens ${formatSessionStamp(tapeSession.nextOpenAt, market)}`,
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
    onRequestAuth: () => setAuthOpen(true),
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
            backTo="/events"
            rightContent={WatchStar}
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
                {CountdownLine}
                {PastDays}
                {Chart}
                {SentimentBar}
                {RuleCard}
                {SettlementRail}
                {YourPosition}
                {MarketActivity}
                {CashOut}
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
                className="flex-1 rounded-xl bg-yes py-3 font-display text-sm font-bold text-[#04222c] disabled:opacity-50"
              >
                Buy {yesLabel} {Math.round(yesLive * 100)}¢
              </button>
              <button
                type="button"
                onClick={() => openBuy("no")}
                disabled={blocked}
                className="flex-1 rounded-xl border border-no/25 bg-no/14 py-3 font-display text-sm font-bold text-no disabled:opacity-50"
              >
                Buy {noLabel} {Math.round(noLive * 100)}¢
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
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    side === "yes" ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
                  )}
                >
                  {side === "yes" ? yesLabel : noLabel}
                </span>
                <span className="text-sm font-semibold">Buy {ticker}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Closes in <span className="font-mono">{countdown}</span> ·{" "}
                {Math.round((side === "yes" ? yesLive : noLive) * 100)}% chance
              </div>
            </div>
            <LiteOrderPanel
              {...orderPanelProps}
              variant="mobile"
              onFilled={() => {
                setDrawerOpen(false);
                setRefetchTick((n) => n + 1);
              }}
            />
          </MobileDrawer>

          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
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
            {RuleCard}
            {!resolved && YourPosition}
            {MarketActivity}
            {!resolved && CashOut}
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