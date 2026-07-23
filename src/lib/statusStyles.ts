// Canonical status / risk color source (DESIGN.md §State Patterns + §7 Account Risk).
// Every page renders status badges and risk tiers from this file — never hand-roll
// the class strings. Extend here rather than in individual components.

export type StatusKey = "success" | "active" | "pending" | "error" | "revoked" | "neutral";

interface StatusStyle {
  /** Compound Tailwind classes for a shadcn-style pill/badge. */
  badge: string;
  /** Muted foreground token for the semantic color (usable in text/icons). */
  fg: string;
}

export const STATUS_STYLES: Record<StatusKey, StatusStyle> = {
  success: {
    badge: "bg-trading-green/10 text-trading-green border border-trading-green/20",
    fg: "text-trading-green",
  },
  active: {
    badge: "bg-trading-green/10 text-trading-green border border-trading-green/20",
    fg: "text-trading-green",
  },
  pending: {
    badge: "bg-trading-yellow/10 text-trading-yellow border border-trading-yellow/20",
    fg: "text-trading-yellow",
  },
  error: {
    badge: "bg-trading-red/10 text-trading-red border border-trading-red/20",
    fg: "text-trading-red",
  },
  revoked: {
    badge: "bg-trading-red/10 text-trading-red border border-trading-red/20",
    fg: "text-trading-red",
  },
  neutral: {
    badge: "bg-muted/40 text-muted-foreground border border-border/40",
    fg: "text-muted-foreground",
  },
};

export const getStatusStyle = (key: StatusKey): StatusStyle =>
  STATUS_STYLES[key] ?? STATUS_STYLES.neutral;

// ---------------------------------------------------------------------------
// Account Risk — 4-tier ladder (DESIGN.md §7)
// Thresholds: <80% SAFE / 80–95% WARNING / 95–100% RESTRICTION / ≥100% LIQ
// ---------------------------------------------------------------------------

export type RiskTier = "SAFE" | "WARNING" | "RESTRICTION" | "LIQUIDATION";

interface RiskStyle {
  /** Foreground token */
  fg: string;
  /** Solid bg token (progress bars, dots) */
  bg: string;
  /** Full badge classes */
  badge: string;
  /** Extra classes (e.g. animate-pulse for LIQUIDATION) */
  emphasis?: string;
  label: string;
}

export const RISK_STYLES: Record<RiskTier, RiskStyle> = {
  SAFE: {
    fg: "text-trading-green",
    bg: "bg-trading-green",
    badge: "bg-trading-green/10 text-trading-green border border-trading-green/20",
    label: "Safe",
  },
  WARNING: {
    fg: "text-trading-yellow",
    bg: "bg-trading-yellow",
    badge: "bg-trading-yellow/10 text-trading-yellow border border-trading-yellow/20",
    label: "Warning",
  },
  RESTRICTION: {
    fg: "text-trading-red",
    bg: "bg-trading-red",
    badge: "bg-trading-red/10 text-trading-red border border-trading-red/20",
    label: "Restriction",
  },
  LIQUIDATION: {
    fg: "text-trading-red",
    bg: "bg-trading-red",
    badge: "bg-trading-red/15 text-trading-red border border-trading-red/30",
    emphasis: "motion-safe:animate-pulse",
    label: "Liquidation",
  },
};

/** Map a risk ratio percentage (0–∞, IM/Equity) to its tier. */
export const getRiskTier = (ratio: number): RiskTier => {
  if (ratio >= 100) return "LIQUIDATION";
  if (ratio >= 95) return "RESTRICTION";
  if (ratio >= 80) return "WARNING";
  return "SAFE";
};

export const getRiskStyle = (tier: RiskTier): RiskStyle => RISK_STYLES[tier];
