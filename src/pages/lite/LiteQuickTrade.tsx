// ============================================================
// /spot?event=crypto-… — Intraday QUICK ROUND trade page.
// Fusion design: round switcher + round tape + settle-line chart.
// Execution reuses the existing spot order panel / service.
// ============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { usePositions } from "@/hooks/usePositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { executeSpotTrade } from "@/services/tradingService";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { useHeadingScrolledOut } from "@/hooks/useHeadingScrolledOut";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import {
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

export const LiteQuickTrade = ({ eventId }: { eventId: string }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isMobile = useIsMobile();
  const seconds = useSecondTick();
  const { user } = useAuth();
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

  const heldIndex = useMemo(() => {
    if (!event) return -1;
    return positions.findIndex(
      (p) => p.productLine === "spot" && p.event === event.name,
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
    onRequestAuth: () => setAuthOpen(true),
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
        <span style={{ color: pct >= 0 ? "#3FD68C" : "#FF5A5F" }}>
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
    <div
      className={cn(
        "flex items-center gap-[6px]",
        isMobile && "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
      style={{ marginTop: 14 }}
    >
      <div className="shrink-0" style={{ marginRight: 4 }}>
        <div style={MICRO}>Round</div>
        <div className="font-display" style={{ fontSize: 13, fontWeight: 700 }}>
          #{roundNo}
        </div>
      </div>
      {history.slice(-10).map((h, i) => (
        <span
          key={i}
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            fontSize: 12,
            background: h === "up" ? "rgba(51,214,255,.13)" : "rgba(207,255,74,.13)",
            color: h === "up" ? "#33D6FF" : "#CFFF4A",
          }}
        >
          {h === "up" ? "▲" : "▼"}
        </span>
      ))}
      <span
        className="font-display flex shrink-0 items-center gap-[5px]"
        style={{
          border: "1.5px solid #FF8A3D",
          borderRadius: 13,
          padding: "3px 10px",
          color: "#FF8A3D",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF8A3D" }} />
        {countdown}
      </span>
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          border: "1px dashed #2B2F38",
          fontSize: 7.5,
          letterSpacing: ".06em",
          color: "#6B7280",
        }}
      >
        NEXT
      </span>
    </div>
  );

  const Chart = (
    <div
      className="relative"
      style={{
        marginTop: 16,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      {base != null && price != null ? (
        <RoundPlot
          eventId={event.id}
          basePrice={base}
          currentPrice={price}
          height={230}
          padTop={54}
        />
      ) : (
        <div style={{ height: 230, background: "#0C1013" }} />
      )}
      <div className="absolute" style={{ left: 12, top: 10 }}>
        <div
          className="font-display"
          style={{ fontSize: 9.5, letterSpacing: ".1em", color: "#33D6FF", textTransform: "uppercase" }}
        >
          ▲ Settles up above this line
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
          Round open ${openText}
        </div>
      </div>
      <div
        className="font-display absolute"
        style={{
          right: 12,
          top: 10,
          fontSize: 9.5,
          letterSpacing: ".1em",
          color: "#FF8A3D",
          textTransform: "uppercase",
        }}
      >
        Settles {settlesAt}
      </div>
      <div
        className="absolute"
        style={{
          right: "3%",
          top: 0,
          bottom: 0,
          borderLeft: "1.5px dashed rgba(255,138,61,.55)",
        }}
      />
    </div>
  );

  const PickChip = (s: Side) => {
    const isUp = s === "yes";
    const p = isUp ? upPrice : downPrice;
    const active = side === s;
    return (
      <button
        type="button"
        onClick={() => setSide(s)}
        className="font-display flex-1 text-left"
        style={{
          borderRadius: 12,
          padding: "10px 12px",
          background: isUp ? "rgba(51,214,255,.13)" : "rgba(207,255,74,.13)",
          border: `1.5px solid ${
            active
              ? isUp
                ? "#33D6FF"
                : "#CFFF4A"
              : isUp
                ? "rgba(51,214,255,.4)"
                : "rgba(207,255,74,.4)"
          }`,
          color: isUp ? "#33D6FF" : "#CFFF4A",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {isUp ? "Up" : "Down"} {Math.round(p * 100)}¢
        </div>
        <div style={{ fontSize: 10.5, opacity: 0.75 }}>
          {Math.round(p * 100)}% say {isUp ? "Up" : "Down"}
        </div>
      </button>
    );
  };

  const PickCard = (
    <div
      style={{
        background: "#131519",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 15,
        padding: 14,
      }}
    >
      <div style={MICRO}>Your pick · {tf.toUpperCase()} round</div>
      <div className="font-display" style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>
        {meta.ticker} higher than ${openText} at {settlesAt}?
      </div>
      <div className="mt-3 flex gap-[8px]">
        {PickChip("yes")}
        {PickChip("no")}
      </div>
    </div>
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

  const Position = heldPos ? (
    <div
      style={{
        background: "#131519",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 15,
        padding: 14,
        marginTop: 14,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display" style={{ fontSize: 13, fontWeight: 700 }}>
          {heldPos.option} · {heldPos.sizeDisplay} shares
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 13, color: heldPos.pnl.startsWith("-") ? "#FF5A5F" : "#3FD68C" }}
        >
          {heldPos.pnl}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setCashOutOpen(true)}
        className="mt-3 h-9 w-full rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80"
      >
        Cash out · ${(heldPos.markPriceNum * heldPos.sizeNum).toFixed(2)}
      </button>
    </div>
  ) : null;

  // ---------- mobile ----------
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader
          title={event.name}
          titleHidden={!scrolledOut}
          showLogo={false}
          showBack
          backTo="/events"
        />
        <div className="px-4 py-4">
          {Head}
          {RoundSwitcher}
          {Tape}
          {Chart}
          {Position}
          {CashOut}
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
              className="flex-1 rounded-xl bg-yes py-3 font-display text-sm font-bold text-[#04222c]"
            >
              Buy Up {Math.round(upPrice * 100)}¢
            </button>
            <button
              type="button"
              onClick={() => {
                setSide("no");
                setDrawerOpen(true);
              }}
              className="flex-1 rounded-xl border border-no/25 bg-no/14 py-3 font-display text-sm font-bold text-no"
            >
              Buy Down {Math.round(downPrice * 100)}¢
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
          <div className="mb-3">
            <div className="text-sm font-semibold">
              Buy {side === "yes" ? "Up" : "Down"} · {meta.ticker} {tf.toUpperCase()}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Settles in <span className="font-mono">{countdown}</span>
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
          {Chart}
          {Position}
          {CashOut}
        </div>
        <aside className="space-y-4">
          {PickCard}
          <LiteOrderPanel
            {...orderPanelProps}
            variant="desktop"
            onFilled={() => setRefetchTick((n) => n + 1)}
          />
        </aside>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default LiteQuickTrade;