// ============================================================
// /spot?event=crypto-… — Intraday QUICK ROUND trade page.
// Fusion design: round switcher + round tape + settle-line chart.
import { RoundTape } from "@/components/lite/shared/RoundTape";
// Execution reuses the existing spot order panel / service.
// ============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Info, Loader2, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { usePositions } from "@/hooks/usePositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { executeSpotTrade } from "@/services/tradingService";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { useHeadingScrolledOut } from "@/hooks/useHeadingScrolledOut";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { SideButton } from "@/components/lite/shared/SideButton";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { LiteStockChart } from "@/components/lite/trade/LiteStockChart";
import {
  SpotSentimentBar,
  SpotSettlementRail,
  SpotYourPosition,
} from "@/components/lite/trade/SpotBlocks";
import {
  COINS,
  COIN_META,
  TIMEFRAMES,
  TF_SECONDS,
  Timeframe,
  compactUsd,
  derivedPrice,
  downOptionOf,
  formatCountdown,
  parseQuickId,
  seedFromId,
  upOptionOf,
  useQuickRounds,
  useSecondTick,
} from "@/components/lite/intraday/intradayData";
import { cn } from "@/lib/utils";
import { pctColor } from "@/components/lite/shared/primitives";

type Side = "yes" | "no";

const MICRO: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6B7280",
};

const utcHHMM = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

// "AUG 6" / "Aug 6" — UTC, same axis convention as the round chart.
const utcMonthDay = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(d);

export const LiteQuickTrade = ({ eventId }: { eventId: string }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isMobile = useIsMobile();
  const routerLocation = useLocation();
  // Back goes home to wherever the reader came from (portfolio keeps its spot).
  const backHref =
    (routerLocation.state as { from?: string } | null)?.from ?? "/events";
  const seconds = useSecondTick();
  const { user } = useAuth();
  const { toggle: toggleWatch, isWatched } = useWatchlist();
  const { positions } = usePositions();
  const { addSpotBalance } = useUserProfile();
  const { headingRef, scrolledOut } = useHeadingScrolledOut();
  const [refetchTick, setRefetchTick] = useState(0);
  const { currentFor, historyFor, loading } = useQuickRounds(true, refetchTick);

  const parsed = parseQuickId(eventId);
  const coin = parsed?.coin ?? "btc";
  const tf: Timeframe = parsed?.tf ?? "15m";

  const [side, setSide] = useState<Side>(params.get("side") === "down" ? "no" : "yes");
  const [amount, setAmount] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [resumeBuy, setResumeBuy] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);

  const event = currentFor.get(`${coin}-${tf}`) ?? null;
  const history = historyFor.get(`${coin}-${tf}`) ?? [];

  // Auto-rebind: when the bound round rolls, land on the new current round.
  useEffect(() => {
    if (!event) return;
    if (event.id !== eventId) {
      navigate(`/spot?event=${encodeURIComponent(event.id)}&side=${side === "yes" ? "up" : "down"}`, {
        replace: true,
      });
    }
  }, [event, eventId, navigate, side]);

  const meta = COIN_META[coin];
  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const upPrice = up ? up.price : 0.5;
  const downPrice = down ? down.price : 0.5;
  const base = event?.base_price ?? null;
  const seed = event ? seedFromId(event.id) : 0;
  const price = derivedPrice(base, upPrice, seed, seconds);
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const endDate = event?.end_date ? new Date(event.end_date) : null;
  const remaining = endDate ? endDate.getTime() - Date.now() : 0;
  const countdown = formatCountdown(remaining);

  // Tighten the auto-rebind window: refetch once as soon as the round expires.
  const expired = remaining <= 0;
  useEffect(() => {
    if (expired) setRefetchTick((n) => n + 1);
  }, [expired, event?.id]);

  const roundNo = useMemo(() => {
    if (!event?.start_date) return 0;
    const startSec = Math.floor(new Date(event.start_date).getTime() / 1000);
    return Math.floor(startSec / TF_SECONDS[tf]) % 10000;
  }, [event?.start_date, tf]);

  // Shared anonymised all-user activity feed (same hook as the stock spot page).
  const activity = useMarketActivityRows(event?.name || null, "Up", refetchTick);

  // Time-anchored tape label + chip tooltips (UTC, same axis convention as the chart).
  const startMs = event?.start_date ? new Date(event.start_date).getTime() : null;
  const endMs = event?.end_date ? new Date(event.end_date).getTime() : null;
  const tfMs = TF_SECONDS[tf] * 1000;
  const isDay = tf === "1d";

  const tapeLabel = useMemo(() => {
    if (isDay) {
      return {
        micro: `Round #${roundNo}`,
        value: startMs != null ? utcMonthDay(new Date(startMs)) : "—",
      };
    }
    const dayPart = startMs != null ? utcMonthDay(new Date(startMs)).toUpperCase() : null;
    return {
      micro: dayPart ? `Round #${roundNo} · ${dayPart}` : `Round #${roundNo}`,
      value:
        startMs != null && endMs != null
          ? `${utcHHMM(new Date(startMs))}–${utcHHMM(new Date(endMs))}`
          : "—",
    };
  }, [isDay, roundNo, startMs, endMs]);

  // `back` = how many rounds before the current one this chip is.
  const chipWindow = useCallback(
    (back: number) => {
      if (startMs == null) return `Round #${roundNo - back}`;
      const s = startMs - back * tfMs;
      if (isDay) return utcMonthDay(new Date(s));
      return `${utcHHMM(new Date(s))}–${utcHHMM(new Date(s + tfMs))}`;
    },
    [startMs, tfMs, isDay, roundNo],
  );

  const alsoLive = useMemo(
    () =>
      COINS.filter((c) => c !== coin)
        .map((c) => ({ coin: c, ev: currentFor.get(`${c}-${tf}`) ?? null }))
        .filter((x) => x.ev),
    [coin, tf, currentFor],
  );

  const heldIndex = useMemo(() => {
    if (!event) return -1;
    return positions.findIndex(
      (p) =>
        p.productLine === "spot" &&
        typeof p.optionId === "string" &&
        p.optionId.startsWith(`${event.id}-`),
    );
  }, [positions, event]);
  const heldPos = heldIndex >= 0 ? positions[heldIndex] : null;

  const handleCashOut = useCallback(
    async (qty: number) => {
      if (!user || !event || !heldPos) throw new Error("Sign in to cash out");
      const optionId = heldPos.optionId || up?.id;
      if (!optionId) throw new Error("Market data unavailable");
      const res = await executeSpotTrade(user.id, {
        eventName: event.name,
        optionLabel: heldPos.option,
        optionId,
        side: "sell",
        price: optionId === up?.id ? upPrice : downPrice,
        quantity: qty,
      });
      if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
    },
    [user, event, heldPos, up?.id, upPrice, downPrice, addSpotBalance],
  );

  const switchTf = (next: Timeframe) => {
    const target = currentFor.get(`${coin}-${next}`);
    if (!target) return;
    navigate(`/spot?event=${encodeURIComponent(target.id)}`, { replace: true });
  };

  if (loading && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!event || !up || !down) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const settlesAt = endDate ? utcHHMM(endDate) : "--:--";
  const openText =
    base != null
      ? base.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  const orderPanelProps = {
    eventName: event.name,
    eventId: event.id,
    countdownText: countdown,
    yesLabel: "Up",
    noLabel: "Down",
    yesPrice: upPrice,
    noPrice: downPrice,
    yesOptionId: up.id,
    noOptionId: down.id,
    yesOptionLabel: up.label,
    noOptionLabel: down.label,
    blocked: remaining <= 0,
    blockedReason: remaining <= 0 ? "Settling" : "",
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

  // ---------- blocks ----------
  const Head = (
    <div>
      <div style={{ ...MICRO, fontSize: 10.5 }}>Crypto · Intraday</div>
      <div className="mt-2 flex items-center gap-[10px]">
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={34} />
        <h1
          ref={headingRef as unknown as React.Ref<HTMLHeadingElement>}
          className="font-display font-bold leading-[1.05] tracking-[-0.02em]"
          style={{ fontSize: isMobile ? 24 : 32 }}
        >
          {event.name}
        </h1>
      </div>
      <div
        className="font-display mt-2 flex flex-wrap items-center gap-x-[10px]"
        style={{ fontSize: 12.5, color: "#9AA1AC" }}
      >
        <span style={{ color: "#F2F3F5", fontWeight: 700 }}>
          {price != null
            ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—"}
        </span>
        <span style={{ color: "#6B7280" }}>·</span>
        <span style={{ color: pctColor(pct) }}>
          {pct >= 0 ? "▲ +" : "▼ "}
          {pct.toFixed(2)}% today
        </span>
        <span style={{ color: "#6B7280" }}>·</span>
        <span>Vol {compactUsd(event.volume)}</span>
      </div>
    </div>
  );

  const RoundSwitcher = (
    <div style={{ marginTop: 16 }}>
      <div style={MICRO}>Round</div>
      <div
        className="mt-1.5 inline-flex items-center"
        style={{
          background: "#101216",
          border: "1px solid #2B2F38",
          borderRadius: 11,
          padding: 3,
          gap: 2,
        }}
      >
        {TIMEFRAMES.map((t) => {
          const active = t.id === tf;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTf(t.id)}
              className="font-display transition-colors"
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 13px",
                borderRadius: 8,
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "#0A0B0D" : "#9AA1AC",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const Tape = (
    <RoundTape
      style={{ marginTop: 14 }}
      isMobile={isMobile}
      leftLabel={tapeLabel}
      chips={history.slice(-10).map((h, i, arr) => ({
        key: String(i),
        up: h === "up",
        tooltip: `${chipWindow(arr.length - i)} · ${h === "up" ? "Up" : "Down"} won`,
      }))}
      currentSlot={[{ kind: "countdown", text: countdown }, { kind: "next" }]}
      legend={
        <>
          Past rounds — <span style={{ color: "#33D6FF" }}>▲</span> Up won ·{" "}
          <span style={{ color: "#CFFF4A" }}>▼</span> Down won · a new round starts
          the moment one settles.
        </>
      }
    />
  );

  const Chart = (
    <LiteStockChart
      ticker={meta.ticker}
      basePrice={base}
      currentPrice={price}
      upOdds={upPrice}
      side={side}
      upLabel="Up"
      downLabel="Down"
      endDate={event.end_date}
      startDate={event.start_date}
      currency="$"
    />
  );

  const SentimentBar = (
    <SpotSentimentBar
      yesLabel="Up"
      noLabel="Down"
      yesPct={upPrice * 100}
      volText={compactUsd(event.volume)}
    />
  );

  const openedAt = event.start_date ? utcHHMM(new Date(event.start_date)) : "--:--";
  const SettlementRail = (
    <SpotSettlementRail
      blocked={remaining <= 0}
      tradingNow={remaining > 0}
      nodes={[
        { key: "opened", label: "Round opened", time: `${openedAt} UTC` },
        {
          key: "now",
          label: remaining <= 0 ? "Closed" : "Trading NOW",
          time: "",
          now: true,
        },
        { key: "closes", label: "Closes", time: settlesAt },
        {
          key: "settles",
          label: "Settles instantly",
          time: "next round starts right away",
        },
      ]}
    />
  );

  const PickCard = (
    <SpotPickCard
      microText={`Your pick · ${tf.toUpperCase()} round`}
      question={`${meta.ticker} higher than $${openText} at ${settlesAt}?`}
      yesLabel="Up"
      noLabel="Down"
      yesPrice={upPrice}
      noPrice={downPrice}
      side={side}
      onSideChange={setSide}
    />
  );


  const CashOut = heldPos ? (
    <LiteCashOutFlow
      open={cashOutOpen}
      onOpenChange={setCashOutOpen}
      isMobile={!!isMobile}
      positionId={heldPos.id}
      positionIndex={heldIndex}
      currentValue={heldPos.markPriceNum * heldPos.sizeNum}
      sizeNum={heldPos.sizeNum}
      sideLabel={heldPos.option}
      onConfirmCashOut={handleCashOut}
      onDone={() => setRefetchTick((n) => n + 1)}
    />
  ) : null;

  const RuleCard = (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        Settles Up if {meta.ticker}'s price at the end of the round is above the round open
        (<span className="font-mono text-foreground">${openText}</span>); otherwise Down. Each
        winning share pays <span className="font-mono text-foreground">$1</span>, credited
        automatically the moment the round settles — and the next round starts right away.
      </p>
    </div>
  );

  const MarketActivity = (
    <LiteMarketActivity
      rows={activity}
      yesLabel="Up"
      noLabel="Down"
      maxRows={isMobile ? 4 : 8}
    />
  );

  const AlsoLiveNow = (
    <SpotSideRailCrypto
      rows={alsoLive.map(({ coin: c, ev }) => {
        const o = upOptionOf(ev);
        return {
          key: c,
          symbol: COIN_META[c].ticker,
          label: `${COIN_META[c].name} · ${tf.toUpperCase()} round`,
          upPct: o ? Math.round(o.price * 100) : 50,
          onClick: () =>
            navigate(`/spot?event=${encodeURIComponent(ev!.id)}`, { replace: true }),
        };
      })}
    />
  );


  const heldIsUp = heldPos ? heldPos.optionId === up.id : false;
  const Position = heldPos ? (
    <SpotYourPosition
      isYesSide={heldIsUp}
      sideLabel={heldIsUp ? "Up" : "Down"}
      sizeDisplay={heldPos.sizeDisplay}
      pnl={heldPos.pnl}
      pnlPercent={heldPos.pnlPercent}
      currentValue={heldPos.markPriceNum * heldPos.sizeNum}
      avgCost={heldPos.entryPrice}
      ifWinsLabel={heldIsUp ? "If Up wins" : "If Down wins"}
      ifWinsValue={`$${heldPos.sizeNum.toFixed(0)}`}
      onCashOut={() => setCashOutOpen(true)}
    />
  ) : null;

  const watched = event ? isWatched(event.id) : false;

  const WatchStar = (
    <MobileHeaderIconButton
      onClick={(e) => toggleWatch(event.id, e as unknown as React.MouseEvent)}
      aria-label="Watchlist"
      className={watched ? "text-trading-yellow" : undefined}
    >
      <Star className={cn("h-5 w-5", watched && "fill-trading-yellow")} strokeWidth={1.5} />
    </MobileHeaderIconButton>
  );

  // ---------- mobile ----------
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader
          title={event.name}
          titleHidden={!scrolledOut}
          showLogo={false}
          showBack
          backTo={backHref}
          rightContent={<div className="flex items-center gap-1 -mr-2">{WatchStar}</div>}
        />
        <div className="px-4 py-4">
          {Head}
          {RoundSwitcher}
          {Tape}
          <div className="mt-4 space-y-4">
            {Chart}
            {SentimentBar}
            {RuleCard}
            {SettlementRail}
            {Position}
            {MarketActivity}
            {AlsoLiveNow}
            {CashOut}
          </div>
        </div>

        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-4 pt-3 backdrop-blur"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 12px)" }}
        >
          <div className="mx-auto flex max-w-md gap-2">
            <button
              type="button"
              onClick={() => {
                setSide("yes");
                setDrawerOpen(true);
              }}
              disabled={remaining <= 0}
              className={`flex flex-1 items-center rounded-xl bg-yes px-4 py-3 font-display text-sm font-bold text-[#04222c] disabled:opacity-50 ${
                remaining <= 0 ? "justify-center" : "justify-between"
              }`}
            >
              {remaining <= 0 ? (
                "Settling"
              ) : (
                <>
                  <span className="truncate">Buy Up</span>
                  <span className="ml-2 shrink-0 font-mono">{Math.round(upPrice * 100)}¢</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setSide("no");
                setDrawerOpen(true);
              }}
              disabled={remaining <= 0}
              className={`flex flex-1 items-center rounded-xl border border-no/25 bg-no/14 px-4 py-3 font-display text-sm font-bold text-no disabled:opacity-50 ${
                remaining <= 0 ? "justify-center" : "justify-between"
              }`}
            >
              {remaining <= 0 ? (
                "Settling"
              ) : (
                <>
                  <span className="truncate">Buy Down</span>
                  <span className="ml-2 shrink-0 font-mono">{Math.round(downPrice * 100)}¢</span>
                </>
              )}
            </button>
          </div>
        </div>

        <MobileDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          showHandle
          hideCloseButton
          className="pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
        >
          <SpotBuyDrawerHeader
            isYesSide={side === "yes"}
            sideLabel={side === "yes" ? "Up" : "Down"}
            title={`Buy ${meta.ticker} ${tf.toUpperCase()}`}
            leadText="Settles in"
            countdown={countdown}
            chancePct={Math.round((side === "yes" ? upPrice : downPrice) * 100)}
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
    );
  }

  // ---------- desktop ----------
  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <div
        className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:px-6"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 330px" }}
      >
        <div>
          {Head}
          {RoundSwitcher}
          {Tape}
          <div className="mt-4 space-y-5">
            {SentimentBar}
            {Chart}
            {RuleCard}
            {SettlementRail}
            {Position}
            {MarketActivity}
            {CashOut}
          </div>
        </div>
        <aside className="space-y-4">
          {PickCard}
          <LiteOrderPanel
            {...orderPanelProps}
            variant="desktop"
            hideSideSelector
            onFilled={() => setRefetchTick((n) => n + 1)}
          />
          {AlsoLiveNow}
        </aside>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default LiteQuickTrade;