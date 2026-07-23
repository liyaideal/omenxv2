/**
 * US-stock daily up/down event — lifecycle + LP session profiles.
 *
 * 状态机口径以《美股当日涨跌现货事件 PRD 技术对接 v1.0》§2 为准（9 态，
 * 取代此前事件 PRD 的 11 态）：
 *   CREATED / EXTENDED_TRADING / TRADING / FROZEN / SETTLING / SETTLED
 *   + SUSPENDED / REVIEW / CANCELED
 * 已删除 OPEN_COOLDOWN 与 CLOSE_MODE（技术对接 QA-16：开盘直接进 TRADING，
 * 开盘保护由 quote profile 内部实现，不设独立状态）。
 *
 * 时间字段（freeze_time / expected_settlement_time）由后端按交易所日历
 * 写入 `events` 表，前端只消费字段；下方两个 fallback 常量仅在字段缺失
 * 时兜底渲染，禁止用于硬编码 16:00 / 16:30 假设——提前收盘日字段值会
 * 与常量不一致。
 */

// -----------------------------------------------------------------
// Fallback constants (used only when events.freeze_time is missing)
// -----------------------------------------------------------------

// CONFIRMED per 技术对接 v1.0 §4: freeze_time = close − 5min → 15:55 ET.
// Prefer `events.freeze_time` on the row; this is a last-resort fallback.
export const FREEZE_MINUTES_BEFORE_CLOSE = 5;

// "Closing soon" display-only window (yellow chip beside countdown). Not a
// lifecycle state. Does NOT block orders.
// CONFIRMED (product decision 2026-07-22, demo-engine 口径；正式版以结算服务
// 实际 SLA 为准).
export const PRE_FREEZE_MINUTES_BEFORE_CLOSE = 15;

// Demo settlement-credit copy anchor: proceeds land in spot_balance shortly
// after the cash close (demo cron runs at 21:05 UTC ≈ 17:05 ET, so credit
// happens *after* market close, not by 16:30 ET). The 16:30 ET SLA is the
// PRODUCT TARGET for the real settlement service. UI copy that references
// this constant should say "credited after market close" — do not hard-code
// "≤ 16:30 ET" in tooltips until the production settlement service ships.
// CONFIRMED (product decision 2026-07-22).
export const SETTLEMENT_CREDIT_BY_ET = "after market close";


/** 9-state lifecycle badge map (技术对接 §2). Unknown → gray "Unknown". */
export const LIFECYCLE_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  CREATED: {
    label: "Created",
    className: "bg-muted text-muted-foreground border-border",
  },
  EXTENDED_TRADING: {
    label: "Extended",
    className: "bg-primary/15 text-primary border-primary/40",
  },
  TRADING: {
    label: "Trading",
    className: "bg-trading-green/15 text-trading-green border-trading-green/40",
  },
  FROZEN: {
    label: "Frozen",
    className: "bg-muted text-muted-foreground border-border",
  },
  SETTLING: {
    label: "Settling",
    className: "bg-muted text-muted-foreground border-border",
  },
  SETTLED: {
    label: "Settled",
    className: "bg-muted/60 text-muted-foreground border-border/60",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-trading-red/15 text-trading-red border-trading-red/40",
  },
  REVIEW: {
    label: "Under Review",
    className: "bg-trading-red/15 text-trading-red border-trading-red/40",
  },
  CANCELED: {
    label: "Canceled",
    className: "bg-trading-red/15 text-trading-red border-trading-red/40",
  },
};

export const UNKNOWN_LIFECYCLE_BADGE = {
  label: "Unknown",
  className: "bg-muted text-muted-foreground border-border",
} as const;

/** Get badge for any lifecycle string; unknown → gray "Unknown". */
export const getLifecycleBadge = (lifecycle: string | null | undefined) =>
  (lifecycle && LIFECYCLE_BADGE[lifecycle]) || UNKNOWN_LIFECYCLE_BADGE;

/** States where new orders are allowed. Everything else is blocked.
 *  技术对接 §2: 仅 TRADING / EXTENDED_TRADING 允许下单。 */
const ORDERABLE_STATES = new Set(["TRADING", "EXTENDED_TRADING"]);

/** Returns true if the event lifecycle disallows new orders. */
export const isOrderingBlocked = (lifecycle: string | null | undefined): boolean =>
  !lifecycle || !ORDERABLE_STATES.has(lifecycle);

/** SUSPENDED allows cancels on existing Pending orders (cancel-only mode). */
export const isCancelAllowedInLifecycle = (
  lifecycle: string | null | undefined,
): boolean => lifecycle === "SUSPENDED" || !ORDERABLE_STATES.has(lifecycle) === false || true;
// Cancel is always allowed on a user-submitted Pending order; the helper
// above is kept for symmetry / future tightening.

/** Short reason string for a disabled CTA. Empty string when orderable. */
export const getBlockedReason = (lifecycle: string | null | undefined): string => {
  if (!lifecycle) return "Market unavailable";
  switch (lifecycle) {
    case "TRADING":
    case "EXTENDED_TRADING":
      return "";
    case "FROZEN":
      return "Market frozen";
    case "SETTLING":
      return "Settling";
    case "SETTLED":
      return "Settled";
    case "SUSPENDED":
      return "Suspended · cancel only";
    case "REVIEW":
      return "Under review";
    case "CANCELED":
      return "Canceled";
    case "CREATED":
      return "Not yet open";
    default:
      return "Market unavailable";
  }
};

/** LP quote mode badge — separate from lifecycle. Mirrors `lp_quote_mode`. */
export const LP_QUOTE_MODE_BADGE: Record<
  string,
  { label: string; className: string; tooltip: string }
> = {
  NORMAL: {
    label: "NORMAL",
    className: "bg-muted text-muted-foreground border-border",
    tooltip: "Normal LP quoting — standard spread and depth.",
  },
  CONSERVATIVE: {
    label: "CONSERVATIVE",
    className: "bg-trading-yellow/15 text-trading-yellow border-trading-yellow/40",
    tooltip: "LP is widening spreads and reducing size ahead of close or volatility.",
  },
  HEDGE_ONLY: {
    label: "HEDGE ONLY",
    className: "bg-primary/15 text-primary border-primary/40",
    tooltip: "LP is only quoting the side that reduces its inventory risk.",
  },
  CANCEL_ONLY: {
    label: "CANCEL ONLY",
    className: "bg-trading-red/15 text-trading-red border-trading-red/40",
    tooltip: "New orders paused. Existing orders may still be cancelled.",
  },
};

/** Format a Date as ET (America/New_York) and Beijing (Asia/Shanghai). */
/** Short HH:mm ET label for a Date (e.g. "16:15"). */
export const formatEtTime = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

// Note: formatDualTimezone / formatBeijingTime removed per DESIGN.md §14 —
// user-visible copy must not contain 北京/Beijing. Local time is shown only
// via the browser-detected schedule ⓘ tooltip in the /spot terminal header.


/**
 * Display-only helper: within PRE_FREEZE_MINUTES_BEFORE_CLOSE minutes of the
 * event's freeze time? Prefer passing `freezeAt` from `events.freeze_time`;
 * `endDate` is only accepted as a fallback (falls back to close − 5min).
 */
export const isInPreFreezeWindow = (
  freezeAt: Date | null | undefined,
  endDate?: Date | null,
): boolean => {
  const anchor = freezeAt ?? (endDate
    ? new Date(endDate.getTime() - FREEZE_MINUTES_BEFORE_CLOSE * 60_000)
    : null);
  if (!anchor) return false;
  const ms = anchor.getTime() - Date.now();
  return ms > 0 && ms <= PRE_FREEZE_MINUTES_BEFORE_CLOSE * 60_000;
};

/**
 * True if the event should be treated as frozen from a timing standpoint —
 * i.e. we've reached (or passed) `events.freeze_time`. Falls back to
 * `endDate − FREEZE_MINUTES_BEFORE_CLOSE` when the field is missing.
 */
export const isPastFreeze = (
  freezeAt: Date | null | undefined,
  endDate?: Date | null,
): boolean => {
  const anchor = freezeAt ?? (endDate
    ? new Date(endDate.getTime() - FREEZE_MINUTES_BEFORE_CLOSE * 60_000)
    : null);
  if (!anchor) return false;
  return anchor.getTime() <= Date.now();
};

// -----------------------------------------------------------------
// Session-aware LP profile (LP PRD §4.2 / §6.1).
// -----------------------------------------------------------------
export type SessionType =
  | "REGULAR"
  | "EXTENDED_AFTER_HOURS"
  | "OVERNIGHT"
  | "PRE_MARKET";

export interface SessionProfile {
  session: SessionType;
  label: string;
  quoteMode: "NORMAL" | "CONSERVATIVE" | "HEDGE_ONLY" | "CANCEL_ONLY";
  levelsMin: number;
  levelsMax: number;
  spreadMult: number;
  sizeMult: number;
  tooltip: string;
}

export const SESSION_PROFILES: Record<SessionType, SessionProfile> = {
  REGULAR: {
    session: "REGULAR",
    label: "Regular trading",
    quoteMode: "NORMAL",
    levelsMin: 8,
    levelsMax: 12,
    spreadMult: 1,
    sizeMult: 1,
    tooltip: "Regular US session (09:30–15:45 ET) — normal LP quoting.",
  },
  EXTENDED_AFTER_HOURS: {
    session: "EXTENDED_AFTER_HOURS",
    label: "After hours",
    quoteMode: "CONSERVATIVE",
    levelsMin: 3,
    levelsMax: 7,
    spreadMult: 2,
    sizeMult: 0.4,
    tooltip: "After-hours session — LP widens spreads and reduces size.",
  },
  OVERNIGHT: {
    session: "OVERNIGHT",
    label: "Overnight",
    quoteMode: "CONSERVATIVE",
    levelsMin: 3,
    levelsMax: 3,
    spreadMult: 3,
    sizeMult: 0.25,
    tooltip: "Overnight session (20:00–04:00 ET) — minimal depth, wide spreads.",
  },
  PRE_MARKET: {
    session: "PRE_MARKET",
    label: "Pre-market",
    quoteMode: "CONSERVATIVE",
    levelsMin: 3,
    levelsMax: 7,
    spreadMult: 2,
    sizeMult: 0.4,
    tooltip: "Pre-market session (04:00–09:30 ET) — LP widens spreads and reduces size.",
  },
};

const etMinutesOfDay = (d: Date = new Date()): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10) % 24;
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return h * 60 + m;
};

/** Derive the current LP session profile from the wall clock (America/New_York). */
export const getCurrentSession = (now: Date = new Date()): SessionProfile => {
  const mins = etMinutesOfDay(now);
  const REG_START = 9 * 60 + 30; // 09:30
  const REG_END = 15 * 60 + 45; // 15:45
  const AH_END = 20 * 60; // 20:00
  const PM_START = 4 * 60; // 04:00
  if (mins >= REG_START && mins < REG_END) return SESSION_PROFILES.REGULAR;
  if (mins >= REG_END && mins < AH_END) return SESSION_PROFILES.EXTENDED_AFTER_HOURS;
  if (mins >= AH_END || mins < PM_START) return SESSION_PROFILES.OVERNIGHT;
  return SESSION_PROFILES.PRE_MARKET;
};

// -----------------------------------------------------------------
// DEMO-STATE: 自动态显示由前端时钟推导，正式版由后端状态机驱动。
// -----------------------------------------------------------------
// Manual states (SUSPENDED / REVIEW / FROZEN / SETTLING / SETTLED / CANCELED
// / CREATED) are authoritative and pass through unchanged. When the DB
// lifecycle is TRADING or EXTENDED_TRADING we derive the display value
// from the ET wall clock so the badge and the LP session profile stay
// in lock-step (before 09:30 ET → EXTENDED_TRADING; 09:30 ET to
// freeze_time → TRADING). Consumers should use this for badge rendering
// while keeping the raw `lifecycle_status` for governance code.
const AUTO_STATES = new Set(["TRADING", "EXTENDED_TRADING"]);
export const getDisplayLifecycle = (
  dbLifecycle: string | null | undefined,
  now: Date = new Date(),
): string => {
  if (!dbLifecycle) return "TRADING";
  if (!AUTO_STATES.has(dbLifecycle)) return dbLifecycle;
  const mins = etMinutesOfDay(now);
  const REG_START = 9 * 60 + 30;
  return mins < REG_START ? "EXTENDED_TRADING" : "TRADING";
};
