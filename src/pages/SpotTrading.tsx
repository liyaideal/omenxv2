// ============================================================
// /spot — Pro Spot trading terminal (US-stock daily up/down).
// Structural rule: this page IS a terminal like /trade, with the
// futures-only surfaces stripped out. It MUST NOT render the
// site-wide navigation header (see DESIGN.md §14 anti-patterns).
// ============================================================
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate, useNavigationType } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Star, Loader2, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useOrders } from "@/hooks/useOrders";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";

import { Badge } from "@/components/ui/badge";
import { CandlestickChart } from "@/components/CandlestickChart";
import { DesktopOrderBook } from "@/components/DesktopOrderBook";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import {
  executeSpotTrade,
  placeSpotLimitOrder,
  cancelSpotLimitOrder,
  fillSpotLimitOrder,
  netWin,
  winningCommission,
  SPOT_FEE_RATE,
} from "@/services/tradingService";
import {
  ProSpotPanel,
  ProSpotAccountPanel,
  ProSpotOrderPreview,
} from "@/components/pro/ProSpotPanel";
import { liteSideName } from "@/lib/liteSideName";
import { ProSpotHeader } from "@/components/pro/ProSpotHeader";
import { ProTerminalLayout } from "@/components/pro/ProTerminalLayout";
import { ProBottomTabs } from "@/components/pro/ProBottomTabs";
import { EventInfoContent } from "@/components/EventInfoContent";
import { parseSideLabels } from "@/lib/eventUtils";
import {
  getLifecycleBadge,
  isOrderingBlocked,
  getBlockedReason,
  // formatDualTimezone / formatBeijingTime removed — header + settlement
  // captions render viewer-local clocks with no timezone suffix (R1).
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
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import type { TradingEvent } from "@/hooks/useEvents";


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

// Fee rate lives in tradingService (V4: 15 bps taker on every product line).
// Imported above — never re-declared here.

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
  const [previewOpen, setPreviewOpen] = useState(false);

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
  // Standard 段词轴（copy-dictionary §Up / Down）：`Not Up` 已退役，
  // 展示层一律经 liteSideName 改写为 `Down`。
  // liteSideName(undefined) 返回 "Down"，所以必须先判空再改写。
  const yesLabel = sideLabels?.yes ? liteSideName(sideLabels.yes) : "Up";
  const noLabel = sideLabels?.no ? liteSideName(sideLabels.no) : "Down";

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

  // 全站时间口径 R1: every clock renders in the viewer's own zone with no
  // timezone suffix; venue nouns ("Official close") stay as-is (R2).
  const market = resolveStockMarket(event);
  const cur = market.currency;
  const settleEtOnly = settleAt ? formatLocalTime(settleAt) : null;
  const freezeEtOnly = freezeAt ? formatLocalTime(freezeAt) : null;
  const closeEtOnly = endDate ? formatLocalTime(endDate) : null;
  const freezeLabel = freezeAt
    ? formatLocalTime(freezeAt)
    : `close − ${FREEZE_MINUTES_BEFORE_CLOSE}min`;

  const ticker = event ? deriveTickerFromEvent(event.id, event.name) : "";

  // Prior-close reference date shown beside `Base`. Walks back one calendar day
  // from end_date in America/New_York and skips weekends so we land on the
  // trading session that actually produced base_price.
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
  // SP-1 B2: Buy sizes in USDC, Sell sizes in SHARES.
  const qty = side === "sell" ? amt : effectivePrice > 0 ? amt / effectivePrice : 0;
  const cost = effectivePrice * qty; // buy cost / sell gross proceeds
  const fee = cost * SPOT_FEE_RATE;
  // V4: the CTA / summary figure is the NET profit after the 5% winning
  // commission — the same `netWin()` helper Lite and Pro futures use.
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

  // Entry price of the held leg — drives the Sell-side commission estimate.
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
    // Keep slider in sync when user types amount manually
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
  // ---- Sell-side economics (V4): 5% commission on the winning part only. ----
  // Same helper the service/ledger uses: the entry fee allocated to the shares
  // being sold is netted out of the commission base first.
  const sellRealizedPnl = (effectivePrice - heldEntry) * qty;
  const sellEntryFee = heldEntry * qty * SPOT_FEE_RATE;
  const sellCommission = side === "sell" ? winningCommission(sellRealizedPnl, sellEntryFee) : 0;
  const sellReceive = Math.max(0, cost - sellCommission);

  const isSell = side === "sell";
  // Cash reserved by resting Pending buy limits (fee-inclusive).
  const reservedInOrders = spotOrders
    .filter((o) => o.status === "Pending" && o.type === "buy")
    .reduce(
      (acc, o) =>
        acc + (parseFloat(o.price) || 0) * (parseFloat(o.amount) || 0) * (1 + SPOT_FEE_RATE),
      0,
    );
  // Under Sell an outcome with no shares cannot be sized — grey the tile out.
  const sliderBase = isSell ? heldQty : available;

  const ctaLabel = willBePending
    ? `Place limit · ${isSell ? "Sell" : "Buy"} ${outcomeLabel}`
    : `${isSell ? "Sell" : "Buy"} ${outcomeLabel}`;
  const ctaDisabled = submitting || blocked || amt <= 0 || (orderType === "Limit" && tickInvalid);

  const TradePanel = (
    <ProSpotPanel
      side={side}
      onSideChange={(s) => {
        setSide(s);
        setAmount("");
        setSliderValue([0]);
      }}
      orderType={orderType}
      onOrderTypeChange={setOrderType}
      yesLabel={yesLabel}
      noLabel={noLabel}
      yesPrice={yesLive}
      noPrice={noLive}
      isYesSelected={isYesSelected}
      onSelectOutcome={(which) => {
        const opt = which === "yes" ? yesOpt : noOpt;
        if (opt) setSelectedOptionId(opt.id);
      }}
      heldYesQty={heldYesQty}
      heldNoQty={heldNoQty}
      outcomeLabel={outcomeLabel}
      available={available}
      heldQty={heldQty}
      spotBalance={spotBalance}
      limitPrice={limitPrice}
      onLimitPriceChange={setLimitPrice}
      amount={amount}
      onAmountChange={setAmount}
      sliderValue={sliderValue}
      onSliderChange={setSliderValue}
      sliderBase={sliderBase}
      slippageBps={slippageBps}
      onSlippageChange={setSlippageBps}
      qty={qty}
      cost={cost}
      fee={fee}
      maxWin={maxWin}
      sellCommission={sellCommission}
      sellReceive={sellReceive}
      bestAsk={bestAsk}
      bestBid={bestBid}
      settleEtOnly={settleEtOnly}
      tickInvalid={tickInvalid}
      willBePending={willBePending}
      ctaLabel={blocked ? blockedReason || "Market unavailable" : ctaLabel}
      ctaDisabled={ctaDisabled}
      submitting={submitting}
      onSubmit={() => setPreviewOpen(true)}
    />
  );

  const OrderPreviewDialog = (
    <ProSpotOrderPreview
      open={previewOpen}
      onOpenChange={setPreviewOpen}
      eventName={event.name}
      outcomeLabel={outcomeLabel}
      side={side}
      orderType={orderType}
      price={effectivePrice}
      qty={qty}
      cost={cost}
      fee={fee}
      maxWin={maxWin}
      sellCommission={sellCommission}
      sellReceive={sellReceive}
      ctaLabel={ctaLabel}
      submitting={submitting}
      isYesSelected={isYesSelected}
      onConfirm={() => {
        setPreviewOpen(false);
        handleSubmit();
      }}
    />
  );

  const AccountPanel = (
    <ProSpotAccountPanel
      available={spotBalance}
      inOrders={reservedInOrders}
      openPositions={spotPositions.length}
    />
  );

  // Shared event body (same component the futures terminal uses). Rules are
  // rendered by the spot-specific block below, so they are omitted here.
  const sharedInfoEvent: TradingEvent = {
    id: event.id,
    name: event.name,
    icon: "",
    ends: countdown.text,
    endTime: endDate ?? new Date(),
    period: "Daily",
    volume: mock24hVolume(event.id),
    description:
      event.description || "US-stock daily up/down (spot). Winning share pays $1 at settlement.",
    rules: [],
    sourceUrl: event.source_url || "",
    sourceName: event.source_name || "databento",
    resolutionSource: event.source_name || "databento",
  };

  const EventInfoPanel = (
    <div className="p-6 overflow-auto text-sm space-y-4">
      <EventInfoContent event={sharedInfoEvent} />
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <InfoCell label="Prior official close" value={basePrice != null ? `${cur}${basePrice.toFixed(2)}` : "—"} />
        <InfoCell label="Settles vs" value={`Prior close · flat close = ${noLabel}`} />
        <InfoCell label="Resolution source" value={event.source_name || "databento"} />
        <InfoCell
          label="Symbol"
          value={`${ticker} · ${market.key === "hk" ? "HKEX" : market.key === "kr" ? "KRX" : "Nasdaq"}`}
        />
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
                  setBottomTab("Positions");
                  setAmount(p.sizeNum.toFixed(0));
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
    <ProBottomTabs
      tabs={[
        { key: "Positions", label: "Positions", count: spotPositions.length },
        { key: "Orders", label: "Orders", count: spotOrders.length },
      ]}
      active={bottomTab}
      onChange={(k) => setBottomTab(k as "Positions" | "Orders")}
      authTitle="Sign in to view spot positions"
      authDescription="Log in or create an account to view your open positions and orders."
      bodyClassName="max-h-[360px] overflow-y-auto"
    >
      {bottomTab === "Positions" ? PositionsTable : OrdersTable}
    </ProBottomTabs>
  );

  // -----------------------------------------------------------------
  // Terminal header — desktop
  // NO site-wide navigation. This chrome is deliberately borrowed
  // from DesktopTrading so /spot feels like a trading terminal.
  // -----------------------------------------------------------------
  const DesktopChrome = (
    <ProSpotHeader
      ticker={ticker}
      eventName={event.name}
      lifecycleBadge={{ label: badge.label, className: badge.className }}
      countdown={{ text: countdown.text, urgency: countdown.urgency as "red" | "yellow" | "muted" }}
      freezeEtOnly={freezeEtOnly}
      closeEtOnly={closeEtOnly}
      settleEtOnly={settleEtOnly}
      closingSoon={closingSoon && lifecycle === "TRADING"}
      volumeText={mock24hVolume(event.id)}
      priorCloseDateLabel={priorCloseDateLabel}
      basePriceText={basePrice != null ? `${cur}${basePrice.toFixed(2)}` : "—"}
      lastLabel={ticker || "Last"}
      lastPriceText={indicative != null ? `${cur}${indicative.toFixed(2)}` : "—"}
      lastIsUp={indicativePct >= 0}
      lastHint={
        indicative != null
          ? `${indicativePct >= 0 ? "+" : ""}${indicativePct.toFixed(2)}%${sessionTag ? ` · ${sessionTag}` : ""}`
          : undefined
      }
      watched={isWatched(event.id)}
      onToggleWatch={() => toggleWatch(event.id)}
      onBack={() => (showBack ? navigate(-1) : navigate("/events?pl=spot"))}
    />
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
              <span className="font-mono">{freezeEtOnly}</span>
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
                <div><span className="text-muted-foreground">Trading ends:</span> {freezeEtOnly ?? "—"}</div>
                <div><span className="text-muted-foreground">Official close:</span> {closeEtOnly ?? "—"} (settlement price)</div>
                <div><span className="text-muted-foreground">Credits by:</span> ~{settleEtOnly ?? "—"}</div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <SurfaceSwitch size="compact" />
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
            value={basePrice != null ? `${cur}${basePrice.toFixed(2)}` : "—"}
            compact
          />
          <StatItem
            label={ticker || "Last"}
            value={indicative != null ? `${cur}${indicative.toFixed(2)}` : "—"}
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
        {OrderPreviewDialog}
      </div>
    );
  }

  // ---- Desktop ----
  return (
    <ProTerminalLayout
      chartMinHeightClass="min-h-[600px]"
      header={DesktopChrome}
      chart={
        <>
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
              Prior Close {basePrice != null ? `${cur}${basePrice.toFixed(2)}` : "—"} · flat close = {noLabel}
            </div>
          </div>
          {chartTab === "Chart" ? (
            <>
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
                <span className="text-2xl font-bold font-mono">{outcomePrice.toFixed(4)}</span>
                <span className="text-xs text-muted-foreground">{outcomeLabel} · mark</span>
              </div>
              <div className="flex-1 min-h-0">
                <CandlestickChart remainingDays={1} basePrice={outcomePrice || 0.5} side={side} />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto">{EventInfoPanel}</div>
          )}
        </>
      }
      orderBook={
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
      }
      bottomTabs={BottomTabs}
      panel={TradePanel}
      account={AccountPanel}
    >
      {OrderPreviewDialog}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signup" />
    </ProTerminalLayout>
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
