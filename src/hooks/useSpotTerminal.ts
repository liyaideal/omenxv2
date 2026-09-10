// ============================================================
// SP-2 · B5 — the single source of truth for the Pro SPOT terminal.
//
// Every spot surface (desktop `/spot`, mobile `/spot` charts view and
// mobile `/spot/order`) consumes this hook. Nothing about the engine,
// fee maths, FIX3 (side resolution), FIX4 (full-close snap) or FIX5
// (stable dates + time-based freeze) changed during the extraction —
// the code below is the desktop page's logic moved verbatim.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate, useNavigationType } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositions } from "@/hooks/usePositions";
import { useOrders } from "@/hooks/useOrders";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import {
  executeSpotTrade,
  placeSpotLimitOrder,
  cancelSpotLimitOrder,
  fillSpotLimitOrder,
  netWin,
  winningCommission,
  SPOT_FEE_RATE,
} from "@/services/tradingService";
import { sharesInputValue } from "@/components/pro/ProSpotPanel";
import { liteSideName } from "@/lib/liteSideName";
import { parseSideLabels } from "@/lib/eventUtils";
import {
  getLifecycleBadge,
  isOrderingBlocked,
  getBlockedReason,
  formatLocalTime,
  formatLocalDate,
  resolveStockMarket,
  getCurrentSession,
  isInPreFreezeWindow,
  isPastFreeze,
  getDisplayLifecycle,
  FREEZE_MINUTES_BEFORE_CLOSE,
  type SessionProfile,
} from "@/lib/usStockSessions";
import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";
import type { Tables } from "@/integrations/supabase/types";

export type SpotEventRow = Tables<"events"> & { options: Tables<"event_options">[] };

// -----------------------------------------------------------------
// Mock LP order book — LP PRD §6.1 parameters. Front-end only (DEMO-STATE).
// -----------------------------------------------------------------
const MIN_HALF_SPREAD = 0.02;
const LEVEL_STEP = 0.01;
const FIRST_LEVEL_SIZE = 200;
const SIZE_DECAY = 0.82;
const JITTER_PCT = 0.15;

export const buildBook = (mid: number, seed: number, profile: SessionProfile) => {
  const rand = (i: number) => {
    const x = Math.sin(seed * 13.37 + i * 7.11) * 10000;
    return x - Math.floor(x); // 0..1
  };
  const range = Math.max(1, profile.levelsMax - profile.levelsMin + 1);
  const levels = profile.levelsMin + Math.floor(rand(0) * range);
  const clampedMid = Math.min(0.98, Math.max(0.02, mid || 0.5));

  const midCents = Math.round(clampedMid * 100);
  const halfSpreadTicks = Math.max(1, Math.round(MIN_HALF_SPREAD * 100 * profile.spreadMult));
  const stepTicks = Math.max(1, Math.round(LEVEL_STEP * 100 * profile.spreadMult));
  const firstSize = FIRST_LEVEL_SIZE * profile.sizeMult;

  const asks: { price: string; amount: string; total: string }[] = [];
  const bids: { price: string; amount: string; total: string }[] = [];
  let cumA = 0;
  let cumB = 0;
  for (let i = 0; i < levels; i++) {
    const jitterA = Math.floor(rand(i * 3 + 5) * 3) - 1; // -1, 0, +1
    const jitterB = Math.floor(rand(i * 3 + 6) * 3) - 1;
    const askCents = Math.min(99, Math.max(1, midCents + halfSpreadTicks + stepTicks * i + Math.max(0, jitterA)));
    const bidCents = Math.min(99, Math.max(1, midCents - halfSpreadTicks - stepTicks * i - Math.max(0, jitterB)));
    const ap = askCents / 100;
    const bp = bidCents / 100;
    const base = firstSize * Math.pow(SIZE_DECAY, i);
    const sizeJitterA = 1 + (rand(i * 2 + 1) - 0.5) * 2 * JITTER_PCT;
    const sizeJitterB = 1 + (rand(i * 2 + 2) - 0.5) * 2 * JITTER_PCT;
    const aAmt = Math.max(1, Math.round(base * sizeJitterA));
    const bAmt = Math.max(1, Math.round(base * sizeJitterB));
    cumA += aAmt;
    cumB += bAmt;
    asks.push({ price: ap.toFixed(2), amount: aAmt.toLocaleString(), total: cumA.toLocaleString() });
    bids.push({ price: bp.toFixed(2), amount: bAmt.toLocaleString(), total: cumB.toLocaleString() });
  }
  for (let i = 1; i < asks.length; i++) {
    const prev = Math.round(parseFloat(asks[i - 1].price) * 100);
    const cur = Math.round(parseFloat(asks[i].price) * 100);
    if (cur <= prev) asks[i].price = (Math.min(99, prev + 1) / 100).toFixed(2);
  }
  for (let i = 1; i < bids.length; i++) {
    const prev = Math.round(parseFloat(bids[i - 1].price) * 100);
    const cur = Math.round(parseFloat(bids[i].price) * 100);
    if (cur >= prev) bids[i].price = (Math.max(1, prev - 1) / 100).toFixed(2);
  }
  return { asks, bids };
};

/** Human 24h volume mock — deterministic from event id. DEMO-STATE. */
export const mock24hVolume = (eventId: string) => {
  const h = eventId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const dollars = 800_000 + (h % 4_000_000);
  return dollars >= 1_000_000 ? `$${(dollars / 1_000_000).toFixed(2)}M` : `$${(dollars / 1000).toFixed(0)}K`;
};

// ---- Countdown ----
//   > 1h → muted, 1h..15m → yellow, ≤ 15m → red
export type CountdownUrgency = "muted" | "yellow" | "red";
export const useSpotCountdown = (
  endTime: Date | null,
): { text: string; urgency: CountdownUrgency; diffMs: number } => {
  const [state, setState] = useState<{ text: string; urgency: CountdownUrgency; diffMs: number }>({
    text: "",
    urgency: "muted",
    diffMs: Infinity,
  });
  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = endTime.getTime() - Date.now();
      let next: { text: string; urgency: CountdownUrgency; diffMs: number };
      if (diff <= 0) {
        next = { text: "00:00:00", urgency: "red", diffMs: 0 };
      } else {
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1_000);
        const text = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        const urgency: CountdownUrgency =
          diff <= 15 * 60_000 ? "red" : diff <= 60 * 60_000 ? "yellow" : "muted";
        next = { text, urgency, diffMs: diff };
      }
      // Never push a fresh object when nothing changed — the expired branch
      // used to re-render forever once the effect re-ran per render (FIX5).
      setState((prev) =>
        prev.text === next.text && prev.urgency === next.urgency && prev.diffMs === next.diffMs
          ? prev
          : next,
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // Key on the timestamp so a caller-recreated Date cannot restart the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime?.getTime()]);
  return state;
};

// ---- Indicative last price (mock walk around base_price) ----
const useIndicativeLast = (basePrice: number | null, seedKey: string) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!basePrice) return null;
    const seed = seedKey.length % 7;
    const drift = Math.sin(tick / 3 + seed) * 0.008;
    return basePrice * (1 + drift);
  }, [basePrice, tick, seedKey]);
};

export type SpotTerminal = ReturnType<typeof useSpotTerminal>;

export function useSpotTerminal() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || "";
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { user } = useAuth();
  // Spot terminal draws exclusively from the spot account.
  const { spotBalance, deductSpotBalance, addSpotBalance } = useUserProfile();

  // ---- Data ----
  const [event, setEvent] = useState<SpotEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Market");
  const [limitPrice, setLimitPrice] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [chartTab, setChartTab] = useState<"Chart" | "Event Info">("Chart");
  const [bottomTab, setBottomTab] = useState<"Positions" | "Orders">("Positions");
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sessionOpenSnapshot, setSessionOpenSnapshot] = useState<{
    key: string;
    value: number;
    source: "mount" | "chart";
  } | null>(null);

  const pricesCtx = useRealtimePricesOptional();

  // Fetch the event
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
      if (!e) {
        setNotFound(true);
      } else {
        setEvent({ ...e, options: opts || [] });
        const list = opts || [];
        const sl = parseSideLabels(e.side_labels);
        const yes =
          list.find(
            (o) =>
              /(^|[-_ ])yes$/i.test(o.label) ||
              (!!sl?.yes && liteSideName(o.label) === liteSideName(sl.yes)),
          ) ||
          list.find((o) => !/(^|[-_ ])no$/i.test(o.label) && !(sl?.no && liteSideName(o.label) === liteSideName(sl.no))) ||
          list[0];

        if (yes) {
          setSelectedOptionId(yes.id);
          setLimitPrice(Number(yes.price).toFixed(4));
        }
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  // ---- Derived ----
  const sideLabels = useMemo(() => parseSideLabels(event?.side_labels), [event]);
  const yesLabel = sideLabels?.yes ? liteSideName(sideLabels.yes) : "Up";
  const noLabel = sideLabels?.no ? liteSideName(sideLabels.no) : "Down";

  // FIX3 · Bug 1 — resolve both legs through `side_labels` aliases before
  // falling back to option order.
  const isYesLabel = useMemo(
    () => (label: string) =>
      /(^|[-_ ])yes$/i.test(label) ||
      (!!sideLabels?.yes && liteSideName(label) === liteSideName(sideLabels.yes)),
    [sideLabels],
  );
  const isNoLabel = useMemo(
    () => (label: string) =>
      /(^|[-_ ])no$/i.test(label) ||
      (!!sideLabels?.no && liteSideName(label) === liteSideName(sideLabels.no)),
    [sideLabels],
  );

  const yesOpt = useMemo(
    () =>
      event?.options.find((o) => isYesLabel(o.label)) ||
      event?.options.find((o) => !isNoLabel(o.label)) ||
      event?.options[0],
    [event, isYesLabel, isNoLabel],
  );
  const noOpt = useMemo(
    () =>
      event?.options.find((o) => isNoLabel(o.label)) ||
      event?.options.find((o) => o.id !== yesOpt?.id) ||
      event?.options[1],
    [event, yesOpt, isNoLabel],
  );

  const yesLive = yesOpt ? pricesCtx?.getPrice(yesOpt.id) ?? Number(yesOpt.price) : 0;
  const noLive = noOpt ? pricesCtx?.getPrice(noOpt.id) ?? Number(noOpt.price) : 0;

  const isYesSelected = selectedOptionId === yesOpt?.id;
  const selectedOption = isYesSelected ? yesOpt : noOpt;
  const outcomeLabel = isYesSelected ? yesLabel : noLabel;
  const outcomePrice = isYesSelected ? yesLive : noLive;

  // FIX5: memoise the three Date objects on the raw ISO strings so the
  // countdown effect cannot be restarted by a per-render Date identity.
  const endIso = event?.end_date ?? null;
  const freezeIso = (event?.freeze_time as string | undefined) ?? null;
  const settleIso = (event?.expected_settlement_time as string | undefined) ?? null;
  const endDate = useMemo(() => (endIso ? new Date(endIso) : null), [endIso]);
  const freezeAt = useMemo(() => (freezeIso ? new Date(freezeIso) : null), [freezeIso]);
  const settleAt = useMemo(() => (settleIso ? new Date(settleIso) : null), [settleIso]);
  const countdownTarget = freezeAt ?? endDate;
  const countdown = useSpotCountdown(countdownTarget);

  const market = resolveStockMarket(event);
  const dbLifecycle = event?.lifecycle_status || "TRADING";
  const lifecycle = getDisplayLifecycle(dbLifecycle, market);
  const baseBadge = getLifecycleBadge(lifecycle);
  // SP-3-DT2 · normal trading shows NO badge (parity with /trade).
  const showBadge = lifecycle !== "TRADING";
  const badge = showBadge
    ? {
        label: lifecycle === "EXTENDED_TRADING" ? "Extended hours" : baseBadge.label,
        className: baseBadge.className,
        tooltip:
          lifecycle === "EXTENDED_TRADING"
            ? "Pre-market / after-hours session — liquidity is thinner and spreads are wider."
            : undefined,
      }
    : null;
  // FIX5: time also blocks trading.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isFrozenByTime = useMemo(() => isPastFreeze(freezeAt, endDate), [freezeAt, endDate, countdown]);
  const blocked = isOrderingBlocked(dbLifecycle) || isFrozenByTime;
  const blockedReason = isOrderingBlocked(dbLifecycle)
    ? getBlockedReason(dbLifecycle)
    : isFrozenByTime
      ? "Market frozen"
      : null;

  const basePrice = event?.base_price != null ? Number(event.base_price) : null;
  const indicative = useIndicativeLast(basePrice, event?.id || "");
  const indicativePct = basePrice && indicative ? ((indicative - basePrice) / basePrice) * 100 : 0;

  const market = resolveStockMarket(event);
  const cur = market.currency;
  const settleEtOnly = settleAt ? formatLocalTime(settleAt) : null;
  const freezeEtOnly = freezeAt ? formatLocalTime(freezeAt) : null;
  const closeEtOnly = endDate ? formatLocalTime(endDate) : null;
  const freezeLabel = freezeAt
    ? formatLocalTime(freezeAt)
    : `close − ${FREEZE_MINUTES_BEFORE_CLOSE}min`;

  const ticker = event ? deriveTickerFromEvent(event.id, event.name) : "";

  const priorCloseDateLabel = useMemo(() => {
    if (!endDate) return "prior";
    const dowFmt = new Intl.DateTimeFormat("en-US", { timeZone: market.tz, weekday: "short" });
    let d = new Date(endDate.getTime() - 24 * 3600 * 1000);
    for (let i = 0; i < 4; i += 1) {
      const w = dowFmt.format(d);
      if (w !== "Sat" && w !== "Sun") break;
      d = new Date(d.getTime() - 24 * 3600 * 1000);
    }
    return formatLocalDate(d);
  }, [endDate, market.tz]);

  const sessionTag = useMemo(() => {
    const s = getCurrentSession();
    if (s.session === "PRE_MARKET") return "pre-mkt";
    if (s.session === "EXTENDED_AFTER_HOURS" || s.session === "OVERNIGHT") return "after-hrs";
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.text]);

  // Tick 0.01 validation (技术对接 §10.1).
  const tickInvalid = useMemo(() => {
    if (orderType !== "Limit") return false;
    const raw = parseFloat(limitPrice);
    if (!isFinite(raw)) return false;
    const cents = Math.round(raw * 100);
    return Math.abs(raw * 100 - cents) > 1e-6;
  }, [limitPrice, orderType]);

  // Session profile drives book depth / spread / size / quote-mode badge.
  const [sessionTick, setSessionTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSessionTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const sessionProfile = useMemo(() => getCurrentSession(), [sessionTick]);
  const sessionDateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: market.tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const sessionOpenKey = `${eventId}:${selectedOption?.id ?? ""}:${sessionDateKey}:${sessionProfile.session}`;
  const sessionOpenMark = sessionOpenSnapshot?.key === sessionOpenKey ? sessionOpenSnapshot.value : null;
  useEffect(() => {
    if (!selectedOption?.id || !Number.isFinite(outcomePrice) || outcomePrice <= 0) return;
    setSessionOpenSnapshot((current) =>
      current?.key === sessionOpenKey ? current : { key: sessionOpenKey, value: outcomePrice, source: "mount" },
    );
  }, [outcomePrice, selectedOption?.id, sessionOpenKey]);
  const seedSessionOpenMark = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setSessionOpenSnapshot((current) => {
      if (current?.key === sessionOpenKey && current.source === "chart") return current;
      return { key: sessionOpenKey, value, source: "chart" };
    });
  }, [sessionOpenKey]);

  const book = useMemo(
    () => buildBook(outcomePrice || 0.5, (selectedOption?.id || "").length, sessionProfile),
    [outcomePrice, selectedOption?.id, sessionProfile],
  );

  const bestAsk = parseFloat(book.asks[0]?.price ?? "1") || 1;
  const bestBid = parseFloat(book.bids[0]?.price ?? "0") || 0;

  const slip = slippageBps / 10_000;
  const marketFillPrice =
    side === "buy"
      ? Math.min(0.9999, bestAsk * (1 + slip))
      : Math.max(0.0001, bestBid * (1 - slip));
  const effectivePrice = orderType === "Limit"
    ? Math.min(0.9999, Math.max(0.0001, parseFloat(limitPrice) || outcomePrice))
    : marketFillPrice;

  const amt = parseFloat(amount) || 0;
  // Buy sizes in USDC, Sell sizes in SHARES.
  const qty = side === "sell" ? amt : effectivePrice > 0 ? amt / effectivePrice : 0;
  const cost = effectivePrice * qty;
  const fee = cost * SPOT_FEE_RATE;
  const maxWin = side === "buy" ? netWin(qty - cost, fee) : cost;

  // ---- Positions / orders (spot-scoped) ----
  const { positions, refetch: refetchPositions } = usePositions();
  const { orders, cancelOrder, refetch: refetchOrders, isCancelling } = useOrders();
  const spotPositions = useMemo(
    () => positions.filter((p) => p.productLine === "spot" && p.event === event?.name),
    [positions, event?.name],
  );
  const spotOrders = useMemo(
    () => orders.filter((o) => o.productLine === "spot" && o.event === event?.name),
    [orders, event?.name],
  );

  const heldQty = useMemo(() => {
    if (!selectedOption) return 0;
    const p = spotPositions.find((pp) => pp.optionId === selectedOption.id);
    return p ? p.sizeNum : 0;
  }, [spotPositions, selectedOption]);

  // FIX4 · full-close snap — the 3-dp input string stays display-only.
  const orderQty =
    side === "sell" && heldQty > 0 && (Math.abs(qty - heldQty) < 0.001 || qty >= heldQty * 0.9995)
      ? heldQty
      : qty;

  const heldEntry = useMemo(() => {
    if (!selectedOption) return 0;
    const p = spotPositions.find((pp) => pp.optionId === selectedOption.id);
    return p ? p.entryPriceNum : 0;
  }, [spotPositions, selectedOption]);
  const heldYesQty = useMemo(
    () => (yesOpt ? spotPositions.find((p) => p.optionId === yesOpt.id)?.sizeNum ?? 0 : 0),
    [spotPositions, yesOpt],
  );
  const heldNoQty = useMemo(
    () => (noOpt ? spotPositions.find((p) => p.optionId === noOpt.id)?.sizeNum ?? 0 : 0),
    [spotPositions, noOpt],
  );

  // ---- Watchlist ----
  const { isWatched, toggle: toggleWatch } = useWatchlist();

  // ---- Slider ↔ amount ----
  const available = spotBalance;
  useEffect(() => {
    const base = side === "sell" ? heldQty : available;
    const pct = base > 0 ? Math.min(100, (amt / base) * 100) : 0;
    if (Math.abs(pct - sliderValue[0]) > 0.5) setSliderValue([pct]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, available, side, heldQty]);

  // Reset limit price when outcome changes
  useEffect(() => {
    if (outcomePrice) setLimitPrice(outcomePrice.toFixed(4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptionId]);

  // ---- Marketability (DEMO-STATE) ----
  const isLimitMarketable =
    side === "buy" ? effectivePrice >= bestAsk : effectivePrice <= bestBid;
  const willBePending = orderType === "Limit" && !isLimitMarketable;

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!selectedOption) return;
    if (blocked) return toast.error(blockedReason || "Market unavailable");
    if (amt <= 0 || effectivePrice <= 0 || effectivePrice >= 1)
      return toast.error("Enter a valid price and amount.");
    if (orderType === "Limit" && tickInvalid)
      return toast.error("Limit price must be a multiple of $0.01.");
    if (side === "sell" && orderQty > heldQty + 1e-9)
      return toast.error("You don't hold enough of this outcome to sell. Buy the opposite side to reduce instead.");
    if (side === "buy" && amt > spotBalance) return toast.error("Insufficient balance.");

    setSubmitting(true);
    try {
      if (willBePending) {
        await placeSpotLimitOrder(user.id, {
          eventName: event!.name,
          optionLabel: selectedOption.label,
          optionId: selectedOption.id,
          side,
          price: effectivePrice,
          quantity: orderQty,
        });
        if (side === "buy") await deductSpotBalance(effectivePrice * orderQty);
        toast.success(
          side === "buy"
            ? `Limit buy placed · $${(effectivePrice * orderQty).toFixed(2)} reserved`
            : "Limit sell placed",
        );
      } else {
        const res = await executeSpotTrade(user.id, {
          eventName: event!.name,
          optionLabel: selectedOption.label,
          optionId: selectedOption.id,
          side,
          price: effectivePrice,
          quantity: orderQty,
        });
        if (res.balanceDelta < 0) await deductSpotBalance(-res.balanceDelta);
        else if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
        if (side === "sell") {
          toast.success(`Cashed out · $${Math.max(0, res.balanceDelta).toFixed(2)} back`, {
            description:
              "Proceeds settle to balance (demo). Production: held as event pending cash until settlement.",
          });
        } else {
          toast.success("Spot buy filled");
        }
      }

      setAmount("");
      setSliderValue([0]);
      refetchPositions();
      refetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Trade failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Cancel spot pending order (refund reserved cash for buy). ----
  const handleCancelSpotOrder = async (o: (typeof spotOrders)[number]) => {
    if (!user || !o.id) return;
    try {
      const res = await cancelSpotLimitOrder(user.id, o.id);
      if (res.refund > 0) await addSpotBalance(res.refund);
      toast.success(res.refund > 0 ? `Order cancelled · $${res.refund.toFixed(2)} refunded` : "Order cancelled");
      refetchOrders();
    } catch (err: unknown) {
      await cancelOrder(o.id);
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  // ---- DEMO-STATE: touch fill ----
  const fillingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || spotOrders.length === 0) return;
    for (const o of spotOrders) {
      if (!o.id || o.status !== "Pending" || o.orderType !== "Limit") continue;
      if (fillingIdsRef.current.has(o.id)) continue;
      const limit = parseFloat(String(o.price).replace(/[$,]/g, "")) || 0;
      const mark = yesOpt && o.option === yesOpt.label ? yesLive : noLive;
      const touched = o.type === "buy" ? mark <= limit + 1e-9 : mark >= limit - 1e-9;
      if (!touched) continue;
      fillingIdsRef.current.add(o.id);
      (async () => {
        try {
          const res = await fillSpotLimitOrder(user.id, o.id!);
          if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
          if (res.intent !== "noop") {
            toast.success(
              o.type === "buy"
                ? "Limit buy filled at your price"
                : `Limit sell filled · $${res.balanceDelta.toFixed(2)} to wallet`,
            );
          }
          refetchPositions();
          refetchOrders();
        } catch {
          // swallow — realtime tick will retry via a fresh id set on refetch
        } finally {
          fillingIdsRef.current.delete(o.id!);
        }
      })();
    }
  }, [yesLive, noLive, spotOrders, user, yesOpt, addSpotBalance, refetchPositions, refetchOrders]);

  // ---- Closing-soon hint (display only, does NOT block orders). ----
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const closingSoon = useMemo(() => isInPreFreezeWindow(freezeAt, endDate), [freezeAt, endDate, countdown]);

  // ---- DEMO-STATE: freeze auto-cancel ----
  const [frozenCancelledIds, setFrozenCancelledIds] = useState<Set<string>>(new Set());
  const shouldFreeze = lifecycle === "FROZEN" || isFrozenByTime;

  const freezingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || !shouldFreeze || spotOrders.length === 0) return;
    for (const o of spotOrders) {
      if (!o.id || o.status !== "Pending") continue;
      if (freezingIdsRef.current.has(o.id)) continue;
      freezingIdsRef.current.add(o.id);
      (async () => {
        try {
          const res = await cancelSpotLimitOrder(user.id, o.id!);
          if (res.refund > 0) await addSpotBalance(res.refund);
          setFrozenCancelledIds((prev) => {
            const next = new Set(prev);
            next.add(o.id!);
            return next;
          });
        } catch {
          freezingIdsRef.current.delete(o.id!);
        } finally {
          refetchOrders();
        }
      })();
    }
  }, [shouldFreeze, spotOrders, user, addSpotBalance, refetchOrders]);

  // ---- Sell-side economics (V4): 5% commission on the winning part only. ----
  const sellRealizedPnl = (effectivePrice - heldEntry) * qty;
  const sellEntryFee = heldEntry * qty * SPOT_FEE_RATE;
  const sellCommission = side === "sell" ? winningCommission(sellRealizedPnl, sellEntryFee) : 0;
  const sellReceive = Math.max(0, cost - sellCommission);

  const isSell = side === "sell";
  const reservedInOrders = spotOrders
    .filter((o) => o.status === "Pending" && o.type === "buy")
    .reduce(
      (acc, o) => acc + (parseFloat(o.price) || 0) * (parseFloat(o.amount) || 0) * (1 + SPOT_FEE_RATE),
      0,
    );
  const sliderBase = isSell ? heldQty : available;

  const ctaLabel = willBePending
    ? `Place limit · ${isSell ? "Sell" : "Buy"} ${outcomeLabel}`
    : `${isSell ? "Sell" : "Buy"} ${outcomeLabel}`;
  const ctaDisabled = submitting || blocked || (orderType === "Limit" && tickInvalid);

  // FIX3 · Bug 2 — `Close` pre-sets the panel AND opens the order preview.
  const closePosition = (p: (typeof spotPositions)[number]) => {
    if (blocked) return toast.error(blockedReason || "Market unavailable");
    if (p.optionId) setSelectedOptionId(p.optionId);
    setSide("sell");
    setOrderType("Market");
    setBottomTab("Positions");
    setAmount(sharesInputValue(p.sizeNum));
    setSliderValue([100]);
    setPreviewOpen(true);
  };

  const onSideChange = (s: "buy" | "sell") => {
    setSide(s);
    setAmount("");
    setSliderValue([0]);
  };

  const onSelectOutcome = (which: "yes" | "no") => {
    const opt = which === "yes" ? yesOpt : noOpt;
    if (opt) setSelectedOptionId(opt.id);
  };

  const openPreview = () => {
    if (blocked) return toast.error(blockedReason || "Market unavailable");
    setPreviewOpen(true);
  };

  const showBack = navigationType === "PUSH";
  const goBack = () => (showBack ? navigate(-1) : navigate("/events?pl=spot"));

  return {
    // routing / identity
    eventId,
    event,
    loading,
    notFound,
    navigate,
    showBack,
    goBack,
    user,

    // outcomes
    yesOpt,
    noOpt,
    yesLabel,
    noLabel,
    yesLive,
    noLive,
    isYesSelected,
    isYesLabel,
    selectedOption,
    outcomeLabel,
    outcomePrice,
    setSelectedOptionId,
    onSelectOutcome,

    // schedule / lifecycle
    endDate,
    freezeAt,
    settleAt,
    countdown,
    lifecycle,
    dbLifecycle,
    badge,
    blocked,
    blockedReason,
    closingSoon,
    settleEtOnly,
    freezeEtOnly,
    closeEtOnly,
    freezeLabel,
    priorCloseDateLabel,
    sessionTag,
    sessionProfile,

    // market data
    market,
    cur,
    ticker,
    basePrice,
    indicative,
    indicativePct,
    sessionOpenMark,
    seedSessionOpenMark,
    book,
    bestAsk,
    bestBid,

    // order form
    side,
    onSideChange,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice,
    slippageBps,
    setSlippageBps,
    amount,
    setAmount,
    sliderValue,
    setSliderValue,
    sliderBase,
    tickInvalid,
    willBePending,
    effectivePrice,
    amt,
    qty,
    cost,
    fee,
    maxWin,
    sellCommission,
    sellReceive,
    ctaLabel,
    ctaDisabled,
    submitting,

    // account
    spotBalance,
    available,
    reservedInOrders,

    // book-keeping
    spotPositions,
    spotOrders,
    heldQty,
    heldYesQty,
    heldNoQty,
    frozenCancelledIds,
    isCancelling,
    handleCancelSpotOrder,
    closePosition,
    handleSubmit,

    // ui state
    chartTab,
    setChartTab,
    bottomTab,
    setBottomTab,
    authOpen,
    setAuthOpen,
    previewOpen,
    setPreviewOpen,
    openPreview,

    // watchlist
    isWatched,
    toggleWatch,
  };
}
