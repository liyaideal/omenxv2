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
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { MobileDrawer, MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { parseSideLabels } from "@/lib/eventUtils";
import { liteSideName } from "@/lib/liteSideName";
import { formatCents, estimateAutoClosePrice } from "@/lib/autoClosePrice";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import type { Tables } from "@/integrations/supabase/types";
import { LiteContractChart } from "@/components/lite/contract/LiteContractChart";
import { LiteContractOrderPanel } from "@/components/lite/contract/LiteContractOrderPanel";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import {
  LiteMarketActivity,
  useMarketActivityRows,
} from "@/components/lite/contract/LiteMarketActivity";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { LiteSentimentBar } from "@/components/lite/contract/LiteSentimentBar";

type EventRow = Tables<"events"> & { options: Tables<"event_options">[] };
type Side = "yes" | "no";

const CATEGORY_LABEL: Record<string, string> = {
  crypto: "Crypto",
  macro: "Macro",
  sports: "Sports",
  politics: "Politics",
  tech: "Tech",
  stocks: "Stocks",
};

const useCountdown = (target: Date | null) => {
  const [text, setText] = useState("--:--:--");
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return setText("00:00:00");
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setText(
        d > 0
          ? `${d}d ${String(h).padStart(2, "0")}h`
          : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  return text;
};

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
  const { positions } = usePositions();
  const { isWatched, toggle } = useWatchlist();
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
  const countdown = useCountdown(freezeAt ?? endDate);

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

  const activity = useMarketActivityRows(event?.name || null, yesOpt?.label || "", refetchTick);

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
  // Settled events render the outcome card — never the expired fallback.
  if (notFound || !event || !yesOpt || !noOpt) {
    return <ExpiredEventFallback eventId={eventId} />;
  }

  const starred = isWatched(event.id);
  const categoryLabel = CATEGORY_LABEL[String(event.category).toLowerCase()] || event.category;
  const yesPct = Math.max(1, Math.min(99, Math.round(yesLive * 100)));

  const heldIsYes =
    heldPos != null &&
    heldPos.option.trim().toLowerCase() === yesOpt.label.trim().toLowerCase();

  // Signed numeric PnL — never reverse-parsed from the formatted string
  // (`pnl` drops the minus sign via Math.abs).
  const heldPnlNum = heldPos ? heldPos.pnlNum : 0;

  const heldAutoClose =
    heldPos != null
      ? estimateAutoClosePrice({
          entryPrice: heldPos.entryPriceNum,
          boost: heldPos.leverageNum,
          amount: heldPos.marginNum,
          fee: 0,
          quantity: heldPos.sizeNum,
          hasOtherPositions: positions.length > 1,
          imTotalOther: Math.max(risk.imTotal - heldPos.marginNum, 0),
          // `risk.totalAssets` is the live balance, from which this position's
          // margin + fee were ALREADY deducted at fill time — adding it back
          // would count the same cash twice. mode:"existing" performs no
          // further deduction, so pass the balance as-is and only strip this
          // position's own IM and PnL from the account aggregates.
          totalAssets: risk.totalAssets,
          unrealizedPnLOther: risk.unrealizedPnL - heldPnlNum,
          mode: "existing",
        })
      : null;

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
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1
          className="font-display font-bold leading-[1.05] tracking-[-0.02em] text-foreground"
          style={{ fontSize: isMobile ? 22 : 34 }}
        >
          {event.name}
        </h1>
        <div className="shrink-0">{WatchStar}</div>
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

  const Chart = (
    <LiteContractChart
      underlyingLabel={event.base_price != null ? "Price" : null}
      basePrice={event.base_price != null ? Number(event.base_price) : null}
      currentPrice={event.base_price != null ? Number(event.base_price) : null}
      yesOdds={yesLive}
      yesLabel={yesLabel}
      noLabel={noLabel}
      side={side}
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

  const MoreMarkets = (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-medium">
        {resolved ? "Still live" : "More markets"}
      </div>
      {more.length === 0 ? (
        <div className="text-xs text-muted-foreground">No other markets right now.</div>
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
      onSeeHow={() => navigate(`/resolved/${event.id}`)}
      onBrowse={() => navigate("/events")}
    />
  ) : null;

  const panelProps = {
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
    onRequestAuth: () => setAuthOpen(true),
  } as const;

  // -------- Mobile --------
  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background pb-32">
          <MobileHeader
            title={categoryLabel}
            showLogo={false}
            showBack={true}
            backTo="/events"
          />
          <div className="space-y-4 px-4 py-4">
            {QuestionBlock}
            {resolved ? (
              <>
                {OutcomeCard}
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
                <span className="truncate text-sm font-semibold">{event.name}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {countdown} left ·{" "}
                {Math.round((side === "yes" ? yesLive : noLive) * 100)}% chance
              </div>
            </div>
            <LiteContractOrderPanel
              {...panelProps}
              variant="mobile"
              onFilled={() => {
                setDrawerOpen(false);
                setRefetchTick((n) => n + 1);
              }}
            />
            <MobileDrawerActions>
              <Button variant="outline" className="w-full" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
            </MobileDrawerActions>
          </MobileDrawer>

          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
          {CashOut}
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
              OutcomeCard
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
            {!resolved && <LiteContractOrderPanel {...panelProps} variant="desktop" onFilled={() => setRefetchTick((n) => n + 1)} />}
            {MoreMarkets}
          </aside>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        {CashOut}
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
