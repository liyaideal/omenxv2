// ============================================================
// /spot — Pro Spot trading terminal (US-stock daily up/down).
// Structural rule: this page IS a terminal like /trade, with the
// futures-only surfaces stripped out. It MUST NOT render the
// site-wide navigation header (see DESIGN.md §14 anti-patterns).
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate, useNavigationType } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Loader2,
  Info,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useOrders } from "@/hooks/useOrders";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CandlestickChart } from "@/components/CandlestickChart";
import { DesktopOrderBook } from "@/components/DesktopOrderBook";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import {
  executeSpotTrade,
  placeSpotLimitOrder,
  cancelSpotLimitOrder,
  fillSpotLimitOrder,
} from "@/services/tradingService";
import { parseSideLabels } from "@/lib/eventUtils";
import {
  getLifecycleBadge,
  isOrderingBlocked,
  getBlockedReason,
  // formatDualTimezone / formatBeijingTime removed — header + settlement
  // captions now render ET only; local time lives in the schedule ⓘ tooltip.
  formatEtTime,
  getCurrentSession,
  isInPreFreezeWindow,
  isPastFreeze,
  getDisplayLifecycle,
  LP_QUOTE_MODE_BADGE,
  FREEZE_MINUTES_BEFORE_CLOSE,
  type SessionProfile,
} from "@/lib/usStockSessions";

import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";


type EventRow = Tables<"events"> & { options: Tables<"event_options">[] };

// -----------------------------------------------------------------
// Mock LP order book — LP PRD §6.1 parameters.
//   min_half_spread            = 0.02
//   quote_level_spread_step    = 0.01
//   levels per side            = 8..12 (default 10)
//   first-level size           ≈ 200 shares, ×0.82 decay per level, ±15% jitter
//   price clamped to (0.01, 0.99); strict bid < mid < ask monotonicity
// Front-end only (DEMO-STATE). Prices transformed to current side by DesktopOrderBook.
// -----------------------------------------------------------------
const MIN_HALF_SPREAD = 0.02;
const LEVEL_STEP = 0.01;
const FIRST_LEVEL_SIZE = 200;
const SIZE_DECAY = 0.82;
const JITTER_PCT = 0.15;

const buildBook = (mid: number, seed: number, profile: SessionProfile) => {
  const rand = (i: number) => {
    const x = Math.sin(seed * 13.37 + i * 7.11) * 10000;
    return x - Math.floor(x); // 0..1
  };
  const range = Math.max(1, profile.levelsMax - profile.levelsMin + 1);
  const levels = profile.levelsMin + Math.floor(rand(0) * range);
  const clampedMid = Math.min(0.98, Math.max(0.02, mid || 0.5));

  // All price levels must be $0.01 tick multiples. Work in integer cents so
  // jitter can never produce sub-tick prices (e.g. 0.3499). Session profile's
  // spreadMult still drives how far apart levels are, but only in whole ticks.
  const midCents = Math.round(clampedMid * 100);
  const halfSpreadTicks = Math.max(1, Math.round(MIN_HALF_SPREAD * 100 * profile.spreadMult));
  const stepTicks = Math.max(1, Math.round(LEVEL_STEP * 100 * profile.spreadMult));
  const firstSize = FIRST_LEVEL_SIZE * profile.sizeMult;

  const asks: { price: string; amount: string; total: string }[] = [];
  const bids: { price: string; amount: string; total: string }[] = [];
  let cumA = 0;
  let cumB = 0;
  for (let i = 0; i < levels; i++) {
    // ±1 tick jitter, applied AFTER snapping so monotonicity is preserved.
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
  // Enforce strict monotonicity after jitter: dedupe by adjusting subsequent
  // levels by +/-1 tick as needed. Deterministic given the seed.
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


// Human 24h volume mock — deterministic from event id, so it stays stable while
// the price ticks around. DEMO-STATE.
const mock24hVolume = (eventId: string) => {
  const h = eventId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const dollars = 800_000 + (h % 4_000_000);
  return dollars >= 1_000_000 ? `$${(dollars / 1_000_000).toFixed(2)}M` : `$${(dollars / 1000).toFixed(0)}K`;
};

// Fee = 0 for spot (see tradingService §SPOT). Explicit constant keeps the
// summary line honest.
const SPOT_FEE_RATE = 0;

// ---- Countdown ----
// Returns HH:MM:SS text plus a color bucket based on remaining time:
//   > 1h        → muted (calm)
//   1h .. 15m   → yellow (warm-up)
//   ≤ 15m       → red   (urgent, pulses per-second)
type CountdownUrgency = "muted" | "yellow" | "red";
const useCountdown = (endTime: Date | null): { text: string; urgency: CountdownUrgency; diffMs: number } => {
  const [state, setState] = useState<{ text: string; urgency: CountdownUrgency; diffMs: number }>({
    text: "",
    urgency: "muted",
    diffMs: Infinity,
  });
  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = endTime.getTime() - Date.now();
      if (diff <= 0) {
        setState({ text: "00:00:00", urgency: "red", diffMs: 0 });
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      const text = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      const urgency: CountdownUrgency =
        diff <= 15 * 60_000 ? "red" : diff <= 60 * 60_000 ? "yellow" : "muted";
      setState({ text, urgency, diffMs: diff });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTime]);
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
    // Deterministic-ish drift ±0.8% for the demo tape.
    const seed = seedKey.length % 7;
    const drift = Math.sin(tick / 3 + seed) * 0.008;
    return basePrice * (1 + drift);
  }, [basePrice, tick, seedKey]);
};

export default function SpotTrading() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || "";
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  // Spot terminal draws exclusively from the spot account. Futures cash
  // never funds spot fills (dual-account cutover 2026-07-21). Users must
  // Transfer to Spot from /wallet before trading here.
  const { spotBalance, deductSpotBalance, addSpotBalance } = useUserProfile();

  // ---- Data ----
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Market");
  const [limitPrice, setLimitPrice] = useState("");
  const [slippageBps, setSlippageBps] = useState(50); // Market = marketable limit + slippage cap
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [chartTab, setChartTab] = useState<"Chart" | "Event Info">("Chart");
  const [bottomTab, setBottomTab] = useState<"Positions" | "Orders">("Positions");
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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
        const yes = list.find((o) => /(^|[-_ ])yes$/i.test(o.label)) || list[0];
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
  const yesLabel = sideLabels?.yes || "Up";
  const noLabel = sideLabels?.no || "Not Up";

  const yesOpt = useMemo(
    () => event?.options.find((o) => /(^|[-_ ])yes$/i.test(o.label)) || event?.options[0],
    [event],
  );
  const noOpt = useMemo(
    () =>
      event?.options.find((o) => /(^|[-_ ])no$/i.test(o.label)) ||
      event?.options.find((o) => o.id !== yesOpt?.id) ||
      event?.options[1],
    [event, yesOpt],
  );

  const yesLive = yesOpt ? pricesCtx?.getPrice(yesOpt.id) ?? Number(yesOpt.price) : 0;
  const noLive = noOpt ? pricesCtx?.getPrice(noOpt.id) ?? Number(noOpt.price) : 0;

  const isYesSelected = selectedOptionId === yesOpt?.id;
  const selectedOption = isYesSelected ? yesOpt : noOpt;
  const outcomeLabel = isYesSelected ? yesLabel : noLabel;
  const outcomePrice = isYesSelected ? yesLive : noLive;

  const endDate = event?.end_date ? new Date(event.end_date) : null;

  // 技术对接 §4.1/§12.2 — timing driven by events fields, not hardcoded times.
  const freezeAt = (event as any)?.freeze_time ? new Date((event as any).freeze_time) : null;
  const settleAt = (event as any)?.expected_settlement_time
    ? new Date((event as any).expected_settlement_time)
    : null;
  // Main countdown targets freeze_time (trading window ends there) instead of
  // end_date; the "settles by …" caption below carries the settlement info.
  const countdownTarget = freezeAt ?? endDate;
  const countdown = useCountdown(countdownTarget);
  // Note: dual-timezone (ET/Beijing) chips removed from the header per DESIGN.md §14.
  // Local-time (browser-detected) hint now lives inside the schedule ⓘ tooltip only.

  // DEMO-STATE: 自动态显示由前端时钟推导，正式版由后端状态机驱动。
  // Raw DB value (`dbLifecycle`) still drives ordering/blocking; the display
  // value is derived from ET wall clock for auto states so the badge tracks
  // the same session boundary as the LP quote-mode chip.
  const dbLifecycle = event?.lifecycle_status || "TRADING";
  const lifecycle = getDisplayLifecycle(dbLifecycle);
  const badge = getLifecycleBadge(lifecycle);
  const blocked = isOrderingBlocked(dbLifecycle);
  const blockedReason = getBlockedReason(dbLifecycle);

  const basePrice = event?.base_price != null ? Number(event.base_price) : null;
  const indicative = useIndicativeLast(basePrice, event?.id || "");
  const indicativePct = basePrice && indicative ? ((indicative - basePrice) / basePrice) * 100 : 0;

  // Settlement caption is ET-only per DESIGN.md §14 (no 北京/Beijing in user-visible copy);
  // the browser-local time is surfaced only in the header schedule ⓘ tooltip.
  const settleEtOnly = settleAt ? `${formatEtTime(settleAt)} ET` : null;
  const freezeEtOnly = freezeAt ? formatEtTime(freezeAt) : null;
  const closeEtOnly = endDate ? formatEtTime(endDate) : null;
  const freezeLabel = freezeAt ? `${formatEtTime(freezeAt)} ET` : `close − ${FREEZE_MINUTES_BEFORE_CLOSE}min`;

  const ticker = event ? deriveTickerFromEvent(event.id, event.name) : "";

  // Prior-close reference date shown beside `Base`. Walks back one calendar day
  // from end_date in America/New_York and skips weekends so we land on the
  // trading session that actually produced base_price.
  const priorCloseDateLabel = useMemo(() => {
    if (!endDate) return "prior";
    const dowFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" });
    let d = new Date(endDate.getTime() - 24 * 3600 * 1000);
    for (let i = 0; i < 4; i += 1) {
      const w = dowFmt.format(d);
      if (w !== "Sat" && w !== "Sun") break;
      d = new Date(d.getTime() - 24 * 3600 * 1000);
    }
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
    }).format(d);
  }, [endDate]);

  // Local-time hint for the schedule tooltip. Browser-detected zone, English label only.
  const localFreezeLabel = useMemo(() => {
    if (!freezeAt) return null;
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMin);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    const gmt = `GMT${sign}${hh}${mm ? `:${String(mm).padStart(2, "0")}` : ""}`;
    const s = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(freezeAt);
    return `trading ends ${s} (${gmt})`;
  }, [freezeAt]);

  // pre-mkt / after-hrs tag beside the live indicative price. Recomputes on the
  // countdown tick so it flips sessions live.
  const sessionTag = useMemo(() => {
    const s = getCurrentSession();
    if (s.session === "PRE_MARKET") return "pre-mkt";
    if (s.session === "EXTENDED_AFTER_HOURS" || s.session === "OVERNIGHT") return "after-hrs";
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.text]);
  // Tick 0.01 validation (技术对接 §10.1). Applies to Limit price input.
  const tickInvalid = useMemo(() => {
    if (orderType !== "Limit") return false;
    const raw = parseFloat(limitPrice);
    if (!isFinite(raw)) return false;
    const cents = Math.round(raw * 100);
    return Math.abs(raw * 100 - cents) > 1e-6;
  }, [limitPrice, orderType]);



  // Session profile drives book depth / spread / size / quote-mode badge.
  // Recompute every minute so the terminal follows the wall clock.
  const [sessionTick, setSessionTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSessionTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const sessionProfile = useMemo(() => getCurrentSession(), [sessionTick]);

  // Order book (mock, session-aware)
  const book = useMemo(
    () => buildBook(outcomePrice || 0.5, (selectedOption?.id || "").length, sessionProfile),
    [outcomePrice, selectedOption?.id, sessionProfile],
  );

  const bestAsk = parseFloat(book.asks[0]?.price ?? "1") || 1;
  const bestBid = parseFloat(book.bids[0]?.price ?? "0") || 0;

  // Effective price the user is transacting at.
  //   - Limit: user input
  //   - Market: best executable price + slippage cap. Buy pays worst of
  //     bestAsk × (1 + slippageBps/1e4); Sell receives worst of
  //     bestBid × (1 − slippageBps/1e4). This keeps cost / max-win / qty
  //     estimates aligned with what the book can actually fill.
  const slip = slippageBps / 10_000;
  const marketFillPrice =
    side === "buy"
      ? Math.min(0.9999, bestAsk * (1 + slip))
      : Math.max(0.0001, bestBid * (1 - slip));
  const effectivePrice = orderType === "Limit"
    ? Math.min(0.9999, Math.max(0.0001, parseFloat(limitPrice) || outcomePrice))
    : marketFillPrice;

  const amt = parseFloat(amount) || 0;
  const qty = effectivePrice > 0 ? amt / effectivePrice : 0;
  const cost = effectivePrice * qty;
  const maxLoss = side === "buy" ? cost : 0;
  // 技术对接 §10.1: Max win for buy = qty × $1 − cost; for sell = proceeds (already realized).
  const maxWin = side === "buy" ? Math.max(0, qty - cost) : cost;
  const fee = cost * SPOT_FEE_RATE;


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


  // ---- Watchlist ----
  const { isWatched, toggle: toggleWatch } = useWatchlist();

  // ---- Slider ↔ amount ----
  const available = spotBalance;
  useEffect(() => {
    // Keep slider in sync when user types amount manually
    const pct = available > 0 ? Math.min(100, (amt / available) * 100) : 0;
    if (Math.abs(pct - sliderValue[0]) > 0.5) setSliderValue([pct]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, available]);

  // Reset limit price when outcome changes
  useEffect(() => {
    if (outcomePrice) setLimitPrice(outcomePrice.toFixed(4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptionId]);

  // ---- Marketability (DEMO-STATE) ----
  // Buy limit ≥ best ask → immediate fill. Buy limit < best ask → Pending.
  // Sell limit ≤ best bid → immediate fill. Sell limit > best bid → Pending.
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
    // 技术对接 §7: 净仓方向校验 — sell 只在持有同侧净仓时允许。
    if (side === "sell" && qty > heldQty + 1e-6)
      return toast.error("You don't hold enough of this outcome to sell. Buy the opposite side to reduce instead.");
    if (side === "buy" && amt > spotBalance) return toast.error("Insufficient balance.");

    setSubmitting(true);
    try {
      if (willBePending) {
        // Place Pending limit order — cash reserved (buy) up front.
        await placeSpotLimitOrder(user.id, {
          eventName: event!.name,
          optionLabel: selectedOption.label,
          optionId: selectedOption.id,
          side,
          price: effectivePrice,
          quantity: qty,
        });
        if (side === "buy") await deductSpotBalance(effectivePrice * qty);
        toast.success(
          side === "buy"
            ? `Limit buy placed · $${(effectivePrice * qty).toFixed(2)} reserved`
            : "Limit sell placed",
        );
      } else {
        const res = await executeSpotTrade(user.id, {
          eventName: event!.name,
          optionLabel: selectedOption.label,
          optionId: selectedOption.id,
          side,
          price: effectivePrice,
          quantity: qty,
        });
        if (res.balanceDelta < 0) await deductSpotBalance(-res.balanceDelta);
        else if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
        if (side === "sell") {
          toast.success("Spot sell filled", {
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
    } catch (err: any) {
      toast.error(err?.message || "Trade failed");
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
    } catch (err: any) {
      // Fall back to plain cancel if service call fails for any reason
      await cancelOrder(o.id);
      toast.error(err?.message || "Cancel failed");
    }
  };

  // ---- DEMO-STATE: touch fill ----
  // 触价成交由前端模拟，正式版由撮合引擎完成。
  // When the mark price crosses a Pending limit, fill the order.
  const fillingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || spotOrders.length === 0) return;
    for (const o of spotOrders) {
      if (!o.id || o.status !== "Pending" || o.orderType !== "Limit") continue;
      if (fillingIdsRef.current.has(o.id)) continue;
      const limit = parseFloat(String(o.price).replace(/[$,]/g, "")) || 0;
      const mark = yesOpt && o.option === yesOpt.label ? yesLive : noLive;
      const touched =
        o.type === "buy" ? mark <= limit + 1e-9 : mark >= limit - 1e-9;
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
  // Prefer events.freeze_time; fall back to close − 5min via helper.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const closingSoon = useMemo(() => isInPreFreezeWindow(freezeAt, endDate), [freezeAt, endDate, countdown]);

  // ---- DEMO-STATE: freeze auto-cancel ----
  // 冻结撤单由前端模拟，正式版由撮合引擎批量执行。
  // When the event enters FROZEN (either lifecycle_status or we've reached
  // events.freeze_time), cancel all of this user's Pending spot orders on
  // this event and refund reserved cash. Tagged in `frozenCancelledIds`
  // so the Orders row renders "Cancelled · market frozen".
  const [frozenCancelledIds, setFrozenCancelledIds] = useState<Set<string>>(new Set());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isFrozenByTime = useMemo(() => isPastFreeze(freezeAt, endDate), [freezeAt, endDate, countdown]);
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
          // ignore; next tick will retry
          freezingIdsRef.current.delete(o.id!);
        } finally {
          refetchOrders();
        }
      })();
    }
  }, [shouldFreeze, spotOrders, user, addSpotBalance, refetchOrders]);




  // ---- Render guards ----
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (notFound || !event) return <ExpiredEventFallback eventId={eventId} />;

  const showBack = navigationType === "PUSH";

  // -----------------------------------------------------------------
  // Reusable atoms
  // -----------------------------------------------------------------
  const YesNoToggle = (
    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg">
      <button
        onClick={() => {
          setSide("buy");
          if (yesOpt) setSelectedOptionId(yesOpt.id);
        }}
        className="relative flex flex-col rounded-md overflow-hidden transition-all"
      >
        <div
          className={cn(
            "flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 text-[11px] font-semibold leading-tight",
            isYesSelected
              ? "bg-trading-green text-trading-green-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {yesLabel}
        </div>
        <div
          className={cn(
            "h-[22px] flex items-center justify-center text-[11px] font-mono border-t",
            isYesSelected
              ? "bg-trading-green/85 text-trading-green-foreground border-black/20"
              : "bg-muted-foreground/15 text-foreground/80 border-border/40",
          )}
        >
          {yesLive.toFixed(4)}
        </div>
      </button>
      <button
        onClick={() => {
          setSide("buy");
          if (noOpt) setSelectedOptionId(noOpt.id);
        }}
        className="relative flex flex-col rounded-md overflow-hidden transition-all"
      >
        <div
          className={cn(
            "flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 text-[11px] font-semibold leading-tight",
            !isYesSelected
              ? "bg-trading-red text-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {noLabel}
        </div>
        <div
          className={cn(
            "h-[22px] flex items-center justify-center text-[11px] font-mono border-t",
            !isYesSelected
              ? "bg-trading-red/85 text-foreground border-black/20"
              : "bg-muted-foreground/15 text-foreground/80 border-border/40",
          )}
        >
          {noLive.toFixed(4)}
        </div>
      </button>
    </div>
  );

  const TradePanel = (
    <div className="flex flex-col bg-background rounded-lg border border-border/50">
      <div className="flex items-center px-4 py-2 border-b border-border/30">
        <span className="text-sm font-medium">Trade</span>
        <Badge variant="outline" className="ml-2 text-[10px]">SPOT</Badge>
      </div>
      <div className="px-4 py-3 space-y-3">
        {YesNoToggle}

        {/* Buy / Sell */}
        <div className="inline-flex w-full items-center gap-1 rounded-md border border-border/60 bg-muted/30 p-1">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "flex-1 py-1.5 rounded text-xs font-medium capitalize transition",
                side === s
                  ? s === "buy"
                    ? "bg-trading-green/20 text-trading-green"
                    : "bg-trading-red/20 text-trading-red"
                  : "text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Available */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Available (USDC)</span>
          <span className="font-mono">{available.toFixed(2)}</span>
        </div>

        {/* Order type tabs */}
        <div className="flex border-b border-border/30">
          {(["Limit", "Market"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={cn(
                "px-2 py-1.5 text-xs font-medium transition-all",
                orderType === t
                  ? "text-foreground border-b-2 border-trading-purple"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Price / slippage */}
        {orderType === "Limit" ? (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Price</span>
            <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
              <input
                type="text"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="flex-1 bg-transparent outline-none font-mono text-sm"
                placeholder="0.0000"
                inputMode="decimal"
              />
              <span className="text-muted-foreground text-xs">USD</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Max slippage</span>
              <span className="text-xs font-mono">{(slippageBps / 100).toFixed(2)}%</span>
            </div>
            <div className="flex gap-1.5">
              {[10, 25, 50, 100].map((bps) => (
                <button
                  key={bps}
                  onClick={() => setSlippageBps(bps)}
                  className={cn(
                    "flex-1 py-1 text-[11px] rounded transition-colors",
                    slippageBps === bps
                      ? "bg-trading-purple text-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {(bps / 100).toFixed(2)}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground pt-0.5">
              Market = marketable limit @ mark ± slippage cap
            </p>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Amount</span>
            {side === "sell" && (
              <span className="text-[10px] text-muted-foreground font-mono">
                held: {heldQty.toFixed(0)} sh
              </span>
            )}
          </div>
          <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono text-sm"
              placeholder="0.00"
              inputMode="decimal"
            />
            <span className="text-muted-foreground text-xs font-medium">USDC</span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-1">
          <Slider
            value={sliderValue}
            onValueChange={(val) => {
              setSliderValue(val);
              setAmount(((available * val[0]) / 100).toFixed(2));
            }}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {["0%", "25%", "50%", "75%", "100%"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>

        {/* Fee summary — spot: Cost / Max win / Max loss / Fee. NO liq. / margin. */}
        <div className="rounded-md bg-muted/30 p-2.5 text-xs font-mono space-y-1">
          <Row label="Cost">${cost.toFixed(2)}</Row>
          {orderType === "Market" && (
            <div className="flex justify-end text-[10px] text-muted-foreground -mt-1">
              Est. fill @ {(side === "buy" ? bestAsk : bestBid).toFixed(2)}
            </div>
          )}
          <Row label={
            <span className="inline-flex items-center gap-1">
              Max win
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] p-2">
                    <p className="text-xs">
                      {side === "buy"
                        ? "qty × $1 − cost. Winning shares pay $1 at settlement."
                        : "Sell proceeds, credited on fill."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          }>
            ${maxWin.toFixed(2)}
          </Row>
          <Row label="Max loss">${maxLoss.toFixed(2)}</Row>
          <Row label="Fee">${fee.toFixed(2)}</Row>
        </div>

        {/* Spot account balance hint — spot funds only. */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Spot Account · ${spotBalance.toFixed(2)} available
        </div>
        {settleEtOnly && (
          <div className="text-[10px] text-muted-foreground">
            Settles &amp; credits by ~{settleEtOnly}
          </div>
        )}
        {tickInvalid && orderType === "Limit" && (
          <div className="text-[10px] text-trading-red">
            Price must be a multiple of $0.01 (tick).
          </div>
        )}
        {willBePending && !tickInvalid && (
          <div className="text-[10px] text-trading-yellow">
            {side === "buy"
              ? `Limit below best ask $${bestAsk.toFixed(2)} — order will rest as Pending until touched. $${(effectivePrice * qty || 0).toFixed(2)} reserved.`
              : `Limit above best bid $${bestBid.toFixed(2)} — order will rest as Pending until touched.`}
          </div>
        )}


        {/* CTA — semantic outcome color, never primary */}
        <button
          disabled={submitting || blocked || amt <= 0 || tickInvalid}
          onClick={handleSubmit}
          className={cn(
            "w-full h-11 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
            isYesSelected
              ? "bg-trading-green hover:bg-trading-green/90 text-trading-green-foreground"
              : "bg-trading-red hover:bg-trading-red/90 text-foreground",
          )}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : blocked ? (
            blockedReason || "Market unavailable"
          ) : (
            <>
              {willBePending
                ? `Place limit ${side} ${outcomeLabel}`
                : `${side === "buy" ? "Buy" : "Sell"} ${outcomeLabel}`}
              {side === "buy" && qty > 0 && !willBePending && (
                <span className="opacity-80"> · Max win ${maxWin.toFixed(0)} →</span>
              )}

            </>
          )}
        </button>

      </div>
    </div>
  );

  const AccountPanel = (
    <div className="flex flex-col bg-background rounded-lg border border-border/50">
      <div className="flex items-center px-4 py-2 border-b border-border/30">
        <span className="text-sm font-medium">Spot Account</span>
      </div>
      <div className="px-4 py-3 space-y-2 text-xs">
        <Row label="Available (USDC)">
          <span className="font-mono text-foreground">${spotBalance.toFixed(2)}</span>
        </Row>
        <Row label="Open spot positions">
          <span className="font-mono">{spotPositions.length}</span>
        </Row>
        <div className="text-[10px] text-muted-foreground pt-1">
          Spot and Futures accounts are funded separately. Transfer funds to your Spot Account to trade.
        </div>
      </div>
    </div>
  );

  const EventInfoPanel = (
    <div className="p-6 overflow-auto text-sm space-y-4">
      <div>
        <h3 className="font-semibold mb-1">{event.name}</h3>
        <p className="text-xs text-muted-foreground">
          {event.description || "US-stock daily up/down (spot). Winning share pays $1 at settlement."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <InfoCell label="Prior official close" value={basePrice != null ? `$${basePrice.toFixed(2)}` : "—"} />
        <InfoCell label="Settles vs" value={`Prior close · flat close = ${noLabel}`} />
        <InfoCell label="Resolution source" value={event.source_name || "databento"} />
        <InfoCell label="Symbol" value={`${ticker} · Nasdaq`} />
        <InfoCell label="Volume" value={mock24hVolume(event.id)} />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="font-semibold text-foreground text-sm">Rules</div>
        {event.rules ? (
          <ul className="list-disc pl-4 space-y-1">
            {event.rules
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            <li>
              All open orders are automatically cancelled and refunded at freeze
              {" "}({freezeLabel}).
            </li>
          </ul>
        ) : (
          <p className="italic">Rules not yet published for this market.</p>
        )}
      </div>

      {settleEtOnly && (
        <div className="text-xs text-muted-foreground">
          Settles &amp; credits by ~{settleEtOnly}.
        </div>
      )}
    </div>
  );


  // -----------------------------------------------------------------
  // Positions / Orders table — no leverage / no liq. / no funding
  // -----------------------------------------------------------------
  const PositionsTable = (
    <div className="text-xs">
      <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr_0.6fr] gap-2 px-4 py-2 text-muted-foreground border-b border-border/30 sticky top-0 bg-background">
        <span>Market</span>
        <span>Outcome</span>
        <span className="text-right">Entry</span>
        <span className="text-right">Mark</span>
        <span className="text-right">Size (sh)</span>
        <span className="text-right">PnL</span>
        <span />
      </div>
      {spotPositions.length === 0 ? (
        <div className="px-4 py-8 text-center text-muted-foreground">No open spot positions.</div>
      ) : (
        spotPositions.map((p) => {
          const isYes = /(^|[-_ ])yes$/i.test(p.option);
          const outcomeText = isYes ? yesLabel : noLabel;
          return (
            <div
              key={p.id}
              className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr_0.6fr] gap-2 px-4 py-2 items-center border-b border-border/20 hover:bg-muted/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[9px]">SPOT</Badge>
                <span className="truncate">{p.event}</span>
              </div>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium w-fit",
                  isYes
                    ? "bg-trading-green/20 text-trading-green"
                    : "bg-trading-red/20 text-trading-red",
                )}
              >
                {outcomeText}
              </span>
              <span className="text-right font-mono">{p.entryPrice}</span>
              <span className="text-right font-mono">{p.markPrice}</span>
              <span className="text-right font-mono">{p.sizeDisplay}</span>
              <span
                className={cn(
                  "text-right font-mono",
                  p.pnl.startsWith("+") ? "text-trading-green" : "text-trading-red",
                )}
              >
                {p.pnl}
              </span>
              <button
                onClick={() => {
                  if (yesOpt && p.optionId === yesOpt.id) setSelectedOptionId(yesOpt.id);
                  else if (noOpt && p.optionId === noOpt.id) setSelectedOptionId(noOpt.id);
                  setSide("sell");
                  setAmount(((p.sizeNum * (parseFloat(p.markPrice.replace(/[$,]/g, "")) || 0))).toFixed(2));
                }}
                className="text-[10px] text-primary hover:underline text-right"
              >
                Close
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  const OrdersTable = (
    <div className="text-xs">
      <div className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.6fr_0.7fr_0.8fr_0.7fr_0.5fr] gap-2 px-4 py-2 text-muted-foreground border-b border-border/30 sticky top-0 bg-background">
        <span>Market</span>
        <span>Side</span>
        <span>Type</span>
        <span className="text-right">Limit</span>
        <span className="text-right">Qty (sh)</span>
        <span className="text-right">Reserved</span>
        <span className="text-right">Status</span>
        <span />
      </div>
      {spotOrders.length === 0 ? (
        <div className="px-4 py-8 text-center text-muted-foreground">No open spot orders.</div>
      ) : (
        spotOrders.map((o, i) => {
          const reserved = o.type === "buy" ? o.total : "—";
          const isPending = o.status === "Pending";
          return (
            <div
              key={o.id ?? i}
              className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.6fr_0.7fr_0.8fr_0.7fr_0.5fr] gap-2 px-4 py-2 items-center border-b border-border/20 hover:bg-muted/20"
            >
              <span className="truncate">{o.event}</span>
              <span className={cn("uppercase", o.type === "buy" ? "text-trading-green" : "text-trading-red")}>
                {o.type}
              </span>
              <span>{o.orderType}</span>
              <span className="text-right font-mono">{o.price}</span>
              <span className="text-right font-mono">{o.amount}</span>
              <span className="text-right font-mono text-muted-foreground">{reserved}</span>
              <span
                className={cn(
                  "text-right",
                  isPending ? "text-trading-yellow" : "text-muted-foreground",
                )}
              >
                {o.id && frozenCancelledIds.has(o.id)
                  ? "Cancelled · market frozen"
                  : o.status}
              </span>
              <button
                disabled={isCancelling || !isPending}
                onClick={() => handleCancelSpotOrder(o)}
                className="text-[10px] text-trading-red hover:underline text-right disabled:opacity-40 disabled:no-underline"
              >
                Cancel
              </button>
            </div>
          );
        })
      )}
    </div>
  );


  const BottomTabs = (
    <div className="border-t border-border/30">
      <div className="flex items-center gap-1 px-4 border-b border-border/30">
        {(["Positions", "Orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setBottomTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-all",
              bottomTab === t
                ? "text-trading-purple border-b-2 border-trading-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            <span className="ml-1 text-muted-foreground">
              ({t === "Positions" ? spotPositions.length : spotOrders.length})
            </span>
          </button>
        ))}
      </div>
      <AuthGateOverlay
        title="Sign in to view spot positions"
        description="Log in or create an account to view your open positions and orders."
      >
        <div className="max-h-[360px] overflow-y-auto">
          {bottomTab === "Positions" ? PositionsTable : OrdersTable}
        </div>
      </AuthGateOverlay>
    </div>
  );

  // -----------------------------------------------------------------
  // Terminal header — desktop
  // NO site-wide navigation. This chrome is deliberately borrowed
  // from DesktopTrading so /spot feels like a trading terminal.
  // -----------------------------------------------------------------
  const DesktopChrome = (
    <header className="flex items-center gap-4 px-4 py-2 bg-background border-b border-border/30">
      <button
        onClick={() => (showBack ? navigate(-1) : navigate("/events?pl=spot"))}
        className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted flex-shrink-0"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>

      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "flex h-9 items-center justify-center rounded-full bg-foreground/5 border border-border/60 font-mono font-semibold flex-shrink-0 px-2",
          ticker.length <= 3 ? "text-[11px] w-9" : ticker.length <= 4 ? "text-[10px] min-w-9" : "text-[9px] min-w-9",
        )}>
          {ticker}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{event.name}</span>
            <Badge variant="outline" className="text-[10px]">SPOT</Badge>
            <Badge variant="outline" className={cn("text-[10px] border", badge.className)}>
              {badge.label}
            </Badge>
          </div>
          <div className="mt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                countdown.urgency === "red" && "bg-trading-red animate-pulse",
                countdown.urgency === "yellow" && "bg-trading-yellow",
                countdown.urgency === "muted" && "bg-muted-foreground",
              )} />
              <span>Trading ends in</span>
              <span className={cn(
                "font-mono font-medium",
                countdown.urgency === "red" && "text-trading-red animate-pulse",
                countdown.urgency === "yellow" && "text-trading-yellow",
                countdown.urgency === "muted" && "text-foreground",
              )}>{countdown.text}</span>
              {freezeEtOnly && (
                <>
                  <span>·</span>
                  <span className="font-mono">until {freezeEtOnly} ET</span>
                </>
              )}
              {closingSoon && lifecycle === "TRADING" && (
                <span
                  className="px-1.5 py-0.5 rounded bg-trading-yellow/15 text-trading-yellow text-[10px] font-medium"
                  title="Trading remains open until 5 minutes before close."
                >
                  Closing soon
                </span>
              )}
              <TooltipProvider><Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Schedule details"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="text-xs max-w-[280px]">
                  <div className="space-y-1">
                    <div><span className="text-muted-foreground">Opens:</span> after prior close (extended trading)</div>
                    <div><span className="text-muted-foreground">Trading ends:</span> {freezeEtOnly ?? "—"} ET</div>
                    <div><span className="text-muted-foreground">Official close:</span> {closeEtOnly ?? "—"} ET (settlement price)</div>
                    <div><span className="text-muted-foreground">Credits by:</span> ~{settleEtOnly ?? "—"}</div>
                    {localFreezeLabel && (
                      <div><span className="text-muted-foreground">Your time:</span> {localFreezeLabel}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip></TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Right stats — spot-specific. NO index / funding / OI / Yes price. */}
      <div className="ml-auto flex items-center gap-6 text-xs">
        <StatItem label="Volume" value={mock24hVolume(event.id)} />
        <StatItem
          label={`Base (${priorCloseDateLabel} close)`}
          value={basePrice != null ? `$${basePrice.toFixed(2)}` : "—"}
        />
        <StatItem
          label={ticker || "Last"}
          value={indicative != null ? `$${indicative.toFixed(2)}` : "—"}
          valueClass={indicativePct >= 0 ? "text-trading-green" : "text-trading-red"}
          hint={indicative != null
            ? `${indicativePct >= 0 ? "+" : ""}${indicativePct.toFixed(2)}%${sessionTag ? ` · ${sessionTag}` : ""}`
            : undefined}
        />
      </div>


      <button
        onClick={() => toggleWatch(event.id)}
        className="p-2 rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
        aria-label="Toggle watchlist"
      >
        <Star
          className={cn(
            "w-5 h-5 transition-colors",
            isWatched(event.id)
              ? "text-trading-yellow fill-trading-yellow"
              : "text-muted-foreground hover:text-trading-yellow",
          )}
        />
      </button>
    </header>
  );

  // -----------------------------------------------------------------
  // Mobile terminal chrome — MobileHeader style, no site nav, no bottom nav.
  // -----------------------------------------------------------------
  const MobileChrome = (
    <header className="flex items-center gap-3 px-3 py-2 border-b border-border/30 bg-background">
      <button
        onClick={() => (showBack ? navigate(-1) : navigate("/events?pl=spot"))}
        className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">{event.name}</span>
          <Badge variant="outline" className="text-[9px]">SPOT</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            countdown.urgency === "red" && "bg-trading-red animate-pulse",
            countdown.urgency === "yellow" && "bg-trading-yellow",
            countdown.urgency === "muted" && "bg-muted-foreground",
          )} />
          <span>Trading ends in</span>
          <span className={cn(
            "font-mono font-medium",
            countdown.urgency === "red" && "text-trading-red animate-pulse",
            countdown.urgency === "yellow" && "text-trading-yellow",
            countdown.urgency === "muted" && "text-foreground",
          )}>{countdown.text}</span>
          {freezeEtOnly && (
            <>
              <span>·</span>
              <span className="font-mono">{freezeEtOnly} ET</span>
            </>
          )}
          {closingSoon && lifecycle === "TRADING" && (
            <span className="px-1 rounded bg-trading-yellow/15 text-trading-yellow text-[10px]">
              Closing soon
            </span>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="p-0.5 text-muted-foreground"
                aria-label="Schedule details"
              >
                <Info className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="text-[11px] max-w-[280px] p-2">
              <div className="space-y-1">
                <div><span className="text-muted-foreground">Opens:</span> after prior close (extended trading)</div>
                <div><span className="text-muted-foreground">Trading ends:</span> {freezeEtOnly ?? "—"} ET</div>
                <div><span className="text-muted-foreground">Official close:</span> {closeEtOnly ?? "—"} ET (settlement price)</div>
                <div><span className="text-muted-foreground">Credits by:</span> ~{settleEtOnly ?? "—"}</div>
                {localFreezeLabel && (
                  <div><span className="text-muted-foreground">Your time:</span> {localFreezeLabel}</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <button onClick={() => toggleWatch(event.id)} className="p-1.5 flex-shrink-0">
        <Star
          className={cn(
            "w-5 h-5",
            isWatched(event.id) ? "text-trading-yellow fill-trading-yellow" : "text-muted-foreground",
          )}
        />
      </button>
    </header>
  );

  // -----------------------------------------------------------------
  // Layouts
  // -----------------------------------------------------------------
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {MobileChrome}

        {/* Compact stats strip — Base + live indicative. Volume moves to Event Info. */}
        <div className="grid grid-cols-2 gap-2 px-3 py-2 border-b border-border/30 text-[11px]">
          <StatItem
            label={`Base (${priorCloseDateLabel} close)`}
            value={basePrice != null ? `$${basePrice.toFixed(2)}` : "—"}
            compact
          />
          <StatItem
            label={ticker || "Last"}
            value={indicative != null ? `$${indicative.toFixed(2)}` : "—"}
            valueClass={indicativePct >= 0 ? "text-trading-green" : "text-trading-red"}
            hint={indicative != null
              ? `${indicativePct >= 0 ? "+" : ""}${indicativePct.toFixed(2)}%${sessionTag ? ` · ${sessionTag}` : ""}`
              : undefined}
            compact
          />
        </div>

        {/* Chart / Event Info tabs */}
        <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border/30">
          {(["Chart", "Event Info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartTab(t)}
              className={cn(
                "text-xs font-medium py-1 transition-colors",
                chartTab === t ? "text-foreground border-b-2 border-trading-purple" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {chartTab === "Chart" ? (
          <div className="h-[280px] border-b border-border/30">
            <CandlestickChart remainingDays={1} basePrice={outcomePrice || 0.5} side={side} />
          </div>
        ) : (
          <div className="border-b border-border/30">{EventInfoPanel}</div>
        )}

        <div className="p-3">{TradePanel}</div>

        {BottomTabs}
      </div>
    );
  }

  // ---- Desktop ----
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {DesktopChrome}

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chart + Bottom Positions/Orders */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex items-stretch min-h-[600px] gap-1 p-1">
            {/* Chart + Event Info */}
            <div className="flex-1 flex flex-col min-w-0 bg-background rounded border border-border/30">
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
                {(["Chart", "Event Info"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTab(t)}
                    className={cn(
                      "text-sm font-medium transition-all",
                      chartTab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
                <div className="ml-auto text-xs text-muted-foreground">
                  Prior Close ${basePrice?.toFixed(2) ?? "—"} · flat close = {noLabel}
                </div>
              </div>
              {chartTab === "Chart" ? (
                <>
                  <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
                    <span className="text-2xl font-bold font-mono">{outcomePrice.toFixed(4)}</span>
                    <span className="text-xs text-muted-foreground">
                      {outcomeLabel} · mark
                    </span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <CandlestickChart remainingDays={1} basePrice={outcomePrice || 0.5} side={side} />
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-auto">{EventInfoPanel}</div>
              )}
            </div>

            {/* Order Book (reuse DesktopOrderBook, LP-quoted mock data) */}
            <div className="w-[280px] flex-shrink-0 flex flex-col bg-background rounded border border-border/30 overflow-hidden">
              <DesktopOrderBook
                asks={book.asks}
                bids={book.bids}
                currentPrice={outcomePrice.toFixed(4)}
                priceChange={outcomePrice.toFixed(4)}
                isPositive={indicativePct >= 0}
                side={side}
                variant="spot"
                quoteMode={sessionProfile.quoteMode}
                onPriceClick={(price) => {
                  setLimitPrice(price);
                  setOrderType("Limit");
                }}
              />
            </div>
          </div>

          {BottomTabs}
        </div>

        {/* Right: Trade + Account */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-2 m-1 overflow-y-auto">
          {TradePanel}
          {AccountPanel}
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signup" />
    </div>
  );
}

// -----------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------
const Row = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>{children}</span>
  </div>
);

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-border/40 bg-muted/20 p-2">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-0.5 text-foreground">{value}</div>
  </div>
);

interface StatItemProps {
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
  compact?: boolean;
}
const StatItem = ({ label, value, valueClass, hint, compact }: StatItemProps) => (
  <div className={compact ? "" : "text-xs"}>
    <div className={cn("text-muted-foreground", compact && "text-[10px]")}>{label}</div>
    <div className={cn("font-mono font-medium", compact ? "text-xs" : "", valueClass)}>
      {value}
      {hint && <span className={cn("ml-1 text-[10px]", valueClass)}>{hint}</span>}
    </div>
  </div>
);
