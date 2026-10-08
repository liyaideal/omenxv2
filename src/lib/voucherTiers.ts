// Shared voucher-earnings tier definitions. Used by:
//   - useVoucherEarnings (UI hook)
//   - VoucherEarningsCard (UI)
//   - claim-voucher-earnings edge function (server-side copy must stay in sync)
//   - StyleGuide / Vouchers playground
//
// Tier semantics (2026-10-08, Liya):
//   - Volume tiers (T2+) look at the TRAILING 30-DAY traded volume — filled
//     orders (status Filled or Closed) with created_at inside the window.
//     Volume ages out day by day; the tier drops with it, no grace period.
//   - T1 (deposit) is lifetime: once $10 has been deposited it never lapses.
//   - Caps are LIFETIME cumulative: claim = min(pending, cap − lifetime_credited).
//     lifetime_credited never resets, so a dropped tier never re-pays what a
//     higher tier already released — the only way to more is a higher tier.

/** Trailing window (days) for volume-unlocked tiers. Server copy must match. */
export const VOUCHER_VOLUME_WINDOW_DAYS = 30;

/** ISO timestamp of the window start, for `.gte("created_at", …)` filters. */
export const voucherVolumeWindowStart = (now: number = Date.now()): string =>
  new Date(now - VOUCHER_VOLUME_WINDOW_DAYS * 86_400_000).toISOString();

/** Trade statuses that count as filled volume (Cancelled / Pending do not). */
export const VOUCHER_VOLUME_TRADE_STATUSES = ["Filled", "Closed"] as const;

export type VoucherTierUnlock =
  | { kind: "none" }
  | { kind: "deposit"; amount: number }
  | { kind: "volume"; amount: number };

export interface VoucherTier {
  id: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Cumulative claimable cap (USDC) once this tier is unlocked. */
  maxClaim: number;
  /** Condition required to unlock this tier. */
  unlock: VoucherTierUnlock;
  /** Short label for the unlock condition, used in tier rail. */
  unlockShort: string;
}

export const VOUCHER_TIERS: VoucherTier[] = [
  { id: 0, label: "T0", maxClaim: 2,  unlock: { kind: "none" },                  unlockShort: "No req." },
  { id: 1, label: "T1", maxClaim: 5,  unlock: { kind: "deposit", amount: 10 },   unlockShort: "$10 deposit" },
  { id: 2, label: "T2", maxClaim: 10, unlock: { kind: "volume",  amount: 1_000 },   unlockShort: "$1K vol" },
  { id: 3, label: "T3", maxClaim: 20, unlock: { kind: "volume",  amount: 10_000 },  unlockShort: "$10K vol" },
  { id: 4, label: "T4", maxClaim: 50, unlock: { kind: "volume",  amount: 50_000 },  unlockShort: "$50K vol" },
];

export interface VoucherTierState {
  current: VoucherTier | null; // null only if tier list is empty
  next: VoucherTier | null;    // null = at top tier
  unlockedCap: number;
  claimable: number;
  lifetimeAtCap: boolean;
  /**
   * First tier above `current` whose cap still exceeds lifetimeCredited —
   * i.e. the tier that would actually release more money. Null when every
   * tier's cap is already claimed. Drives the "reach T4 to unlock $30 more"
   * line; may skip tiers (dropped from T3 to T2 with $20 claimed → T4).
   */
  nextUnlockTier: VoucherTier | null;
  /** Progress info toward `next` tier (null if at top). */
  nextProgress: {
    kind: VoucherTierUnlock["kind"];
    remaining: number; // amount still needed
  } | null;
}

const meetsUnlock = (
  unlock: VoucherTierUnlock,
  depositTotal: number,
  volume: number,
): boolean => {
  switch (unlock.kind) {
    case "none":    return true;
    case "deposit": return depositTotal >= unlock.amount;
    case "volume":  return volume >= unlock.amount;
  }
};

export function deriveVoucherTierState(
  volume: number,
  pending: number,
  lifetimeCredited: number,
  depositTotal: number = 0,
): VoucherTierState {
  let current: VoucherTier | null = null;
  let next: VoucherTier | null = null;
  for (const t of VOUCHER_TIERS) {
    if (meetsUnlock(t.unlock, depositTotal, volume)) {
      current = t;
    } else if (!next) {
      next = t;
    }
  }
  const unlockedCap = current?.maxClaim ?? 0;
  const headroom = Math.max(0, unlockedCap - lifetimeCredited);
  const claimable = Math.max(0, Math.min(pending, headroom));
  const lifetimeAtCap = !!current && lifetimeCredited >= unlockedCap;
  const nextUnlockTier =
    VOUCHER_TIERS.find((t) => t.maxClaim > lifetimeCredited && (!current || t.id > current.id)) ?? null;

  let nextProgress: VoucherTierState["nextProgress"] = null;
  if (next) {
    const u = next.unlock;
    if (u.kind === "deposit") {
      nextProgress = { kind: "deposit", remaining: Math.max(0, u.amount - depositTotal) };
    } else if (u.kind === "volume") {
      nextProgress = { kind: "volume", remaining: Math.max(0, u.amount - volume) };
    } else {
      nextProgress = { kind: "none", remaining: 0 };
    }
  }

  return { current, next, unlockedCap, claimable, lifetimeAtCap, nextUnlockTier, nextProgress };
}

export const formatTierCap = (t: VoucherTier) => `$${t.maxClaim.toLocaleString()}`;

/** "$30" for whole numbers, "$13.42" otherwise — for "unlock $X more" copy. */
export const formatCapDelta = (n: number) =>
  Number.isInteger(n) ? `$${n.toLocaleString()}` : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
