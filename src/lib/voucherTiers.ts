// Shared voucher-earnings tier definitions. Used by:
//   - useVoucherEarnings (UI hook)
//   - VoucherEarningsCard (UI)
//   - claim-voucher-earnings edge function (server-side copy must stay in sync)
//   - StyleGuide / Vouchers playground

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

  return { current, next, unlockedCap, claimable, lifetimeAtCap, nextProgress };
}

export const formatTierCap = (t: VoucherTier) => `$${t.maxClaim.toLocaleString()}`;
