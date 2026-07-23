/**
 * Welcome Gift fallback for Hedge-to-Earn.
 *
 * When a user connects their Polymarket wallet and we find no matching
 * positions to airdrop a real hedge against, we instead grant a single
 * "Welcome Gift": a free $10 OmenX position on a random eligible event.
 *
 * Trigger contract (called by backend / verify-wallet-signature edge fn,
 * or by the demo mock layer in `useConnectedAccounts`):
 *
 *   1. Account scan completes.
 *   2. If any matched airdrop_positions were created → DO NOTHING.
 *   3. Else if user already has a welcome_gift airdrop (lifetime) → DO NOTHING.
 *   4. Else if `welcome_gift_enabled` config is false → DO NOTHING.
 *   5. Else: pick an eligible event via `selectWelcomeGiftEvent` and insert
 *      an `airdrop_positions` row with `source = 'welcome_gift'`,
 *      `external_*` fields NULL.
 *
 * The DB enforces lifetime quota via the partial unique index
 * `airdrop_positions_one_welcome_gift_per_user`.
 */

import { supabase } from "@/integrations/supabase/client";

const ELIGIBLE_PRICE_MIN = 0.30;
const ELIGIBLE_PRICE_MAX = 0.70;
const MIN_HOURS_TO_END = 48;
const POOL_SIZE = 20;
const DEFAULT_AIRDROP_VALUE = 10;
/** Welcome gifts expire 48h after issue if not activated. */
const EXPIRY_HOURS = 48;

export interface WelcomeGiftCandidate {
  eventId: string;
  eventName: string;
  optionId: string;
  optionLabel: string;
  price: number;
  side: "long" | "short";
}

/**
 * Whether the program is globally enabled (admin kill-switch).
 */
export const isWelcomeGiftEnabled = async (): Promise<boolean> => {
  const { data } = await supabase
    .from("points_config")
    .select("value")
    .eq("key", "welcome_gift_enabled")
    .maybeSingle();
  if (!data) return true; // default-on if config missing
  // value is jsonb — could be boolean true/false or string "true"
  const v = (data as any).value;
  if (typeof v === "boolean") return v;
  return v === true || v === "true";
};

/**
 * Has this user already received a welcome gift? (Lifetime, cross-account.)
 */
export const userHasWelcomeGift = async (userId: string): Promise<boolean> => {
  const { count } = await supabase
    .from("airdrop_positions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", "welcome_gift");
  return (count ?? 0) > 0;
};

/**
 * Pick a random eligible event option for the welcome gift.
 * Filters: unresolved, ≥48h to end, mid-range price (0.30–0.70),
 * Top 20 by event volume, then random 1.
 */
export const selectWelcomeGiftEvent = async (): Promise<WelcomeGiftCandidate | null> => {
  const cutoff = new Date(Date.now() + MIN_HOURS_TO_END * 60 * 60 * 1000).toISOString();

  // Pull a generous candidate set; we sort/filter client-side because
  // `volume` is text and option price lives on `event_options`.
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, end_date, volume, is_resolved, event_options(id,label,price)")
    .eq("is_resolved", false)
    .gte("end_date", cutoff)
    .limit(200);

  if (error || !events) return null;

  const ranked = (events as any[])
    .map((e) => ({
      ...e,
      volNum: parseFloat(String(e.volume ?? "0").replace(/[^0-9.]/g, "")) || 0,
    }))
    .sort((a, b) => b.volNum - a.volNum)
    .slice(0, POOL_SIZE);

  const candidates: WelcomeGiftCandidate[] = [];
  for (const ev of ranked) {
    for (const opt of (ev.event_options ?? []) as any[]) {
      const price = Number(opt.price);
      if (price >= ELIGIBLE_PRICE_MIN && price <= ELIGIBLE_PRICE_MAX) {
        candidates.push({
          eventId: ev.id,
          eventName: ev.name,
          optionId: opt.id,
          optionLabel: opt.label,
          price,
          // Default to long; backend may override based on liquidity
          side: "long",
        });
      }
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Issue a welcome gift to the user. Returns the created airdrop row id, or
 * null if not eligible / no candidate / disabled.
 *
 * NOTE: requires admin RLS to insert into `airdrop_positions`. In production
 * this should run inside an edge function with the service role key.
 */
export const issueWelcomeGift = async (
  userId: string,
  connectedAccountId: string,
): Promise<string | null> => {
  if (!(await isWelcomeGiftEnabled())) return null;
  if (await userHasWelcomeGift(userId)) return null;

  const candidate = await selectWelcomeGiftEvent();
  if (!candidate) return null;

  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("airdrop_positions")
    .insert({
      user_id: userId,
      connected_account_id: connectedAccountId,
      source: "welcome_gift",
      counter_event_name: candidate.eventName,
      counter_option_label: candidate.optionLabel,
      counter_side: candidate.side,
      counter_price: candidate.price,
      airdrop_value: DEFAULT_AIRDROP_VALUE,
      status: "pending",
      expires_at: expiresAt,
    } as any)
    .select("id")
    .maybeSingle();

  if (error || !data) return null;
  return (data as any).id as string;
};
