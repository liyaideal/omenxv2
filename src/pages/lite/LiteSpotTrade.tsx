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
  formatEtTime,
  getBlockedReason,
  getDisplayLifecycle,
  isOrderingBlocked,
  isPastFreeze,
  FREEZE_MINUTES_BEFORE_CLOSE,
} from "@/lib/usStockSessions";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import type { Tables } from "@/integrations/supabase/types";
import { LiteStockChart } from "@/components/lite/trade/LiteStockChart";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { EmptyState } from "@/components/states";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";

type EventRow = Tables<"events"> & { options: Tables<"event_options">[] };
type Side = "yes" | "no";

// -------- countdown --------
const useCountdown = (target: Date | null) => {
  const [text, setText] = useState("--:--:--");
  const [diffMs, setDiffMs] = useState<number>(Infinity);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setText("00:00:00");
        setDiffMs(0);
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setText(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      setDiffMs(diff);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  return { text, diffMs };
};

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
  const { text: countdown } = useCountdown(countdownTarget);
  const closeEt = freezeAt ? formatEtTime(freezeAt) : endDate ? formatEtTime(endDate) : null;

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
    const drift = Math.sin(tick / 3 + (event?.id.length || 0) % 7) * 0.009;
    return basePrice * (1 + drift);
  }, [basePrice, tick, event?.id]);
  const pctToday = basePrice && currentPrice ? ((currentPrice - basePrice) / basePrice) * 100 : 0;

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
          <span className="font-mono">{closeEt} ET</span>
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
            <span className="text-foreground">${currentPrice.toFixed(2)}</span>
          )}
          {basePrice != null && (
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
            <span>Price to beat ${basePrice.toFixed(2)}</span>
          )}
          <span>Vol {volText}</span>
        </div>
        {!isMobile && <div className="flex-shrink-0">{WatchStar}</div>}
      </div>
    </div>
  );

  const SentimentBar = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          What the crowd thinks
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          Vol {volText}
        </div>
      </div>
      <div className="flex h-11 overflow-hidden rounded-[11px] border border-border">
        <div
          className="flex items-center bg-gradient-to-r from-yes/30 to-yes/15 px-3 text-xs font-semibold text-yes"
          style={{ width: `${upPct}%`, borderRight: "2px solid hsl(var(--background))" }}
        >
          {yesLabel} {upPct}%
        </div>
        <div className="flex flex-1 items-center justify-end bg-gradient-to-r from-no/15 to-no/25 px-3 text-xs font-semibold text-no">
          {downPct}% {noLabel}
        </div>
      </div>
    </div>
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
    />
  );

  const SettlementRail = (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          How it settles
        </div>
        {lifecycle === "TRADING" && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-yes">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yes" />
            Trading now
          </span>
        )}
      </div>
      <RailTrack
        blocked={blocked}
        freezeLabel={freezeAt ? formatEtTime(freezeAt) : `close − ${FREEZE_MINUTES_BEFORE_CLOSE}min`}
        closeLabel={endDate ? formatEtTime(endDate) : null}
      />
    </div>
  );

  const RuleCard = (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        Wins <span className="font-semibold text-yes">{yesLabel}</span> if{" "}
        <span className="text-foreground">{ticker}</span>'s 4:00 PM ET close beats{" "}
        {basePrice != null ? (
          <span className="font-mono text-foreground">${basePrice.toFixed(2)}</span>
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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold",
              heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
                ? "bg-yes/14 text-yes"
                : "bg-no/14 text-no",
            )}
          >
            {heldPos.option.trim().toLowerCase() === (yesOpt.label || "").trim().toLowerCase()
              ? yesLabel
              : noLabel}
          </span>
          <span className="font-mono text-sm">{heldPos.sizeDisplay} shares</span>
          <span
            className={cn(
              "font-mono text-sm font-semibold",
              heldPos.pnl.startsWith("-") ? "text-trading-red" : "text-trading-green",
            )}
          >
            {heldPos.pnl.startsWith("-") ? "▼" : "▲"} {heldPos.pnl} / {heldPos.pnlPercent}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-xs">
        <PosCell
          label="Current value"
          value={`$${(heldPos.markPriceNum * heldPos.sizeNum).toFixed(2)}`}
        />
        <PosCell label="Avg cost" value={heldPos.entryPrice} />
        <PosCell
          label="Profit"
          value={heldPos.pnl}
          tone={heldPos.pnl.startsWith("-") ? "red" : "green"}
        />
        <PosCell
          label={`If ${yesLabel} wins`}
          value={`$${heldPos.sizeNum.toFixed(0)}`}
          tone="yes"
        />
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setCashOutOpen(true)}
          className="h-9 w-full rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80"
        >
          Cash out ·{" "}
          <span className="font-mono">
            ${(heldPos.markPriceNum * heldPos.sizeNum).toFixed(2)}
          </span>
        </button>
      </div>
    </div>
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
      onSeeHow={() => navigate(`/resolved/${event.id}`)}
      onBrowse={() => navigate("/events")}
    />
  ) : null;

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
            {resolved ? (
              OutcomeCard
            ) : (
              <>
                {SentimentBar}
                {Chart}
                {SettlementRail}
                {RuleCard}
                {YourPosition}
                {MarketActivity}
                {CashOut}
              </>
            )}
          </div>
          <aside className="space-y-4">
            {!resolved && (
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

// -------- Settlement rail (5 nodes) --------
const RailTrack = ({
  blocked,
  freezeLabel,
  closeLabel,
}: {
  blocked: boolean;
  freezeLabel: string;
  closeLabel: string | null;
}) => {
  const nodes = [
    { key: "opened", label: "Opened", time: "" },
    { key: "open", label: "Market open", time: "9:30 AM ET" },
    { key: "now", label: blocked ? "Closed" : "Trading NOW", time: "" },
    { key: "closes", label: "Closes", time: freezeLabel },
    { key: "settles", label: "Settles", time: closeLabel ? `${closeLabel} ET` : "—" },
  ];
  return (
    <div>
      <div className="relative h-[2px] rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: blocked ? "100%" : "50%",
            background: "linear-gradient(90deg, #013281 0%, #33D6FF 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between">
          {nodes.map((n, i) => {
            const isNow = n.key === "now";
            return (
              <span
                key={n.key}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isNow ? "bg-yes shadow-[0_0_0_4px_rgba(51,214,255,.18)]" : "bg-border",
                  i < 2 && !isNow ? "bg-yes/60" : "",
                )}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
        {nodes.map((n) => (
          <div key={n.key} className="max-w-[80px] text-center">
            <div className="font-medium text-foreground">{n.label}</div>
            {n.time && <div className="font-mono">{n.time}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const PosCell = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red" | "yes";
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div
      className={cn(
        "font-mono text-sm font-semibold",
        tone === "green" && "text-trading-green",
        tone === "red" && "text-trading-red",
        tone === "yes" && "text-yes",
      )}
    >
      {value}
    </div>
  </div>
);

export default LiteSpotTrade;