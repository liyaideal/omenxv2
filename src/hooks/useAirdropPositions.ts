import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";
import { useConnectedAccounts } from "./useConnectedAccounts";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export type AirdropSource = "matched" | "welcome_gift" | "voucher";

export interface AirdropPosition {
  id: string;
  /** Source of the airdrop: matched to a real Polymarket position, a fallback Welcome Gift, or redeemed from a position voucher */
  source: AirdropSource;
  /** External (Polymarket) reference — null for welcome_gift / voucher */
  externalEventName: string | null;
  externalSide: string | null;
  externalPrice: number | null;
  counterEventName: string;
  counterEventId: string;
  counterOptionLabel: string;
  counterSide: string;
  counterPrice: number;
  airdropValue: number;
  /** Per-position profit cap (voucher source only). null = no cap / legacy rules. */
  redeemableCap?: number | null;
  /** Resolved event_options.id (voucher source) — enables realtime mark price lookup. */
  optionId?: string | null;
  status: string;
  expiresAt: string;
  activatedAt: string | null;
  createdAt: string;
  settlementTrigger?: 'event_resolved' | 'source_closed';
  settledPnl?: number;
  settledAt?: string | null;
}

const QUERY_KEY = ["airdrop-positions"];
const DEMO_AIRDROPS_STORAGE_KEY_PREFIX = "omenx-demo-airdrop-positions:";

// Mock data for the "Matched user" demo account — all matched, no welcome_gift.
// NOTE: presentation-only demo rows. Never include a `settled` row here —
// settled earnings must come from stored (Supabase-seeded) rows only, or they
// would pollute real H2E accounting (the $17.50 bug).
const MOCK_AIRDROPS_MATCHED: AirdropPosition[] = [
  {
    id: "mock-airdrop-1",
    source: "matched",
    externalEventName: "Will Bitcoin reach $120k by March 2026?",
    externalSide: "Yes",
    externalPrice: 0.62,
    counterEventName: "BTC End of Q1 2026 Price",
    counterEventId: "btc-150k-2026",
    counterOptionLabel: "Below $120,000",
    counterSide: "short",
    counterPrice: 0.38,
    airdropValue: 10,
    status: "pending",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    activatedAt: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-airdrop-2",
    source: "matched",
    externalEventName: "Fed rate cut in June 2026?",
    externalSide: "Yes",
    externalPrice: 0.45,
    counterEventName: "Fed Interest Rate Decision June 2026",
    counterEventId: "fed-rate-below-3",
    counterOptionLabel: "Hold Steady",
    counterSide: "long",
    counterPrice: 0.55,
    airdropValue: 10,
    status: "activated",
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    activatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-airdrop-3",
    source: "matched",
    externalEventName: "ETH above $5,000 by April 2026?",
    externalSide: "No",
    externalPrice: 0.72,
    counterEventName: "ETH Price Prediction April 2026",
    counterEventId: "eth-10k-2026",
    counterOptionLabel: "Above $5,000",
    counterSide: "long",
    counterPrice: 0.28,
    airdropValue: 10,
    status: "expired",
    expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    activatedAt: null,
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock data for the "Welcome gift user" demo account — no matched, one welcome_gift
const MOCK_AIRDROPS_WELCOME: AirdropPosition[] = [
  {
    id: "mock-airdrop-welcome",
    source: "welcome_gift",
    externalEventName: null,
    externalSide: null,
    externalPrice: null,
    counterEventName: "ETH Price Prediction April 2026",
    counterEventId: "eth-10k-2026",
    counterOptionLabel: "Above $5,000",
    counterSide: "long",
    counterPrice: 0.42,
    airdropValue: 10,
    status: "pending",
    expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    activatedAt: null,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

// Pick mock by demo account email — anything else gets the legacy "matched" set
const pickMockByEmail = (email: string | null | undefined): AirdropPosition[] => {
  if (email === "demo.welcome@omenx.dev" || email === "mia.reyes@gmail.com") return MOCK_AIRDROPS_WELCOME;
  return MOCK_AIRDROPS_MATCHED;
};

const getDemoStorageKey = (userId: string) => `${DEMO_AIRDROPS_STORAGE_KEY_PREFIX}${userId}`;

const loadDemoAirdrops = (userId: string, email: string | null | undefined): AirdropPosition[] => {
  const fallback = pickMockByEmail(email);
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(getDemoStorageKey(userId));
    if (!stored) return fallback;

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const saveDemoAirdrops = (userId: string, airdrops: AirdropPosition[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getDemoStorageKey(userId), JSON.stringify(airdrops));
};

/**
 * Re-point demo mock airdrops at REAL live events so every row resolves to a
 * tradable page. Only counter fields change — id/source/status/value/external
 * lines stay from the template. Rows whose counter event is still live are
 * left untouched.
 */
const repointMocksToLiveEvents = async (
  rows: AirdropPosition[],
): Promise<AirdropPosition[]> => {
  const { data: events } = await supabase
    .from("events")
    .select("id, name, end_date, is_resolved, product_lines, event_options(id, label, price)")
    .eq("is_resolved", false)
    .gt("end_date", new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString())
    .contains("product_lines", ["futures"])
    .limit(12);
  const pool = (events ?? []).filter((e: any) => (e.event_options ?? []).length > 0);
  if (pool.length === 0) return rows;
  const liveIds = new Set(pool.map((e: any) => e.id));
  let cursor = 0;
  return rows.map((row) => {
    if (row.source === "voucher") return row;
    if (row.counterEventId && liveIds.has(row.counterEventId)) return row;
    const ev: any = pool[cursor % pool.length];
    cursor += 1;
    const opt: any = ev.event_options[0];
    const price = Math.min(0.97, Math.max(0.03, Number(opt.price) || 0.5));
    return {
      ...row,
      counterEventId: ev.id,
      counterEventName: ev.name,
      counterOptionLabel: opt.label,
      counterPrice: price,
      optionId: opt.id ?? null,
    };
  });
};

export const useAirdropPositions = () => {
  const { user, email } = useUserProfile();
  const { activeAccounts, isDemoMode } = useConnectedAccounts();
  const queryClient = useQueryClient();
  const [isActivating, setIsActivating] = useState(false);

  // Only show airdrops when at least one account has finished scanning
  const hasScanComplete = activeAccounts.some((a) => a.scanStatus === "complete");

  // Build a stable query key that reacts to scan status changes
  const scanKey = activeAccounts
    .map((a) => `${a.id}:${a.scanStatus}`)
    .sort()
    .join(",");

  const queryKey = [...QUERY_KEY, user?.id ?? "anon", scanKey];

  const mapRow = (row: any): AirdropPosition => ({
    id: row.id,
    source: (row.source as AirdropSource) ?? "matched",
    externalEventName: row.external_event_name ?? null,
    externalSide: row.external_side ?? null,
    externalPrice: row.external_price != null ? Number(row.external_price) : null,
    counterEventName: row.counter_event_name,
    counterEventId: row.counter_event_id || "",
    counterOptionLabel: row.counter_option_label,
    counterSide: row.counter_side,
    counterPrice: Number(row.counter_price),
    airdropValue: Number(row.airdrop_value),
    redeemableCap: row.redeemable_cap != null ? Number(row.redeemable_cap) : null,
    // DB writes 'active' for a live airdrop; the UI vocabulary is 'activated'.
    // Without this alias the row falls through every branch and reads "Expired".
    status: row.status === "active" ? "activated" : row.status,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    settledPnl: row.settled_pnl != null ? Number(row.settled_pnl) : undefined,
    settledAt: row.settled_at ?? null,
    settlementTrigger:
      row.close_reason === 'EVENT_RESOLVED'
        ? 'event_resolved'
        : row.close_reason
        ? 'source_closed'
        : undefined,
  });

  // Real stored airdrops — voucher-redeemed AND matched. Demo mode used to
  // filter this to source='voucher', so genuinely matched airdrops written by
  // the scan never appeared for demo users.
  const fetchVoucherAirdropsFromSupabase = async (userId: string): Promise<AirdropPosition[]> => {
    const { data, error } = await supabase
      .from("airdrop_positions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching voucher airdrop positions:", error);
      return [];
    }
    const rows = (data as any[] | null) ?? [];
    if (rows.length === 0) return [];

    // Enrich with redeemed_option_id from position_vouchers (no FK, so manual lookup)
    const ids = rows.map((r) => r.id);
    const { data: vouchers } = await supabase
      .from("position_vouchers")
      .select("redeemed_airdrop_position_id, redeemed_option_id")
      .in("redeemed_airdrop_position_id", ids);
    const optionIdByAirdrop = new Map<string, string | null>(
      (vouchers ?? []).map((v: any) => [v.redeemed_airdrop_position_id, v.redeemed_option_id ?? null]),
    );

    return rows.map((row) => ({
      ...mapRow(row),
      optionId: optionIdByAirdrop.get(row.id) ?? null,
    }));
  };

  const { data: airdrops = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isDemoMode) {
        if (!user) return [];

        // Stored positions (voucher-redeemed AND matched) live in Supabase even
        // in demo mode — always merge them so they show up in Positions.
        const storedAirdrops = await fetchVoucherAirdropsFromSupabase(user.id);
        const storedIds = new Set(storedAirdrops.map((a) => a.id));

        if (!hasScanComplete) return storedAirdrops;

        const cached = queryClient.getQueryData<AirdropPosition[]>(queryKey);
        const baseRows = cached && cached.length > 0
          ? cached.filter((a) => !storedIds.has(a.id) && a.source !== "voucher")
          : loadDemoAirdrops(user.id, email).filter((a) => !storedIds.has(a.id));

        // Self-healing: templates and yesterday's snapshot both get re-pointed
        // at live events, then persisted back to localStorage.
        const demoAirdrops = await repointMocksToLiveEvents(baseRows);
        saveDemoAirdrops(user.id, demoAirdrops);

        return [...storedAirdrops, ...demoAirdrops];
      }

      if (!user) return [];

      const { data, error } = await supabase
        .from("airdrop_positions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching airdrop positions:", error);
        return [];
      }

      return (data as any[] | null)?.map(mapRow) ?? [];
    },
    enabled: isDemoMode || !!user,
  });


  const activateAirdrop = async (id: string) => {
    setIsActivating(true);
    try {
      if (isDemoMode) {
        const nextDemoAirdrops = (queryClient.getQueryData<AirdropPosition[]>(queryKey) ?? loadDemoAirdrops(user?.id ?? '', email)).map((a) =>
          a.id === id
            ? { ...a, status: "activated", activatedAt: new Date().toISOString() }
            : a
        );

        saveDemoAirdrops(user?.id ?? '', nextDemoAirdrops);
        queryClient.setQueryData<AirdropPosition[]>(queryKey, nextDemoAirdrops);
      } else {
        const { error } = await supabase
          .from("airdrop_positions")
          .update({ status: "activated", activated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) {
          console.error("Error activating airdrop:", error);
          toast({ title: "Activation failed", description: error.message, variant: "destructive" });
          return;
        }

        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }

      toast({ title: "🎉 Airdrop activated!", description: "Position is now live" });
    } finally {
      setIsActivating(false);
    }
  };

  const closePosition = async (id: string) => {
    // Voucher-source airdrops live in Supabase even in demo mode, so they must
    // always be settled via the edge function — otherwise the row stays
    // `activated` and reappears on refresh.
    const targetForRoute =
      (queryClient.getQueryData<AirdropPosition[]>(queryKey) ?? airdrops).find((a) => a.id === id);
    const isVoucherRoute = targetForRoute?.source === 'voucher';

    if (isDemoMode && !isVoucherRoute) {
      const list = queryClient.getQueryData<AirdropPosition[]>(queryKey) ?? loadDemoAirdrops(user?.id ?? '', email);
      const target = list.find((a) => a.id === id);
      if (!target) return;
      const isVoucherDemo = target.source === 'voucher';
      // demo PnL: random-ish but bounded
      const entry = target.counterPrice;
      const mark = Math.max(0.01, Math.min(0.99, entry + (Math.random() - 0.5) * 0.2));
      const raw = (target.counterSide === 'short' ? entry - mark : mark - entry) * target.airdropValue;
      const cap = target.redeemableCap ?? target.airdropValue * 0.5;
      const credited = Math.max(0, Math.min(raw, cap));
      const next = list.map((a) =>
        a.id === id
          ? { ...a, status: 'settled', settledPnl: credited, settledAt: new Date().toISOString(), settlementTrigger: 'source_closed' as const }
          : a,
      );
      saveDemoAirdrops(user?.id ?? '', next);
      queryClient.setQueryData<AirdropPosition[]>(queryKey, next);
      toast({
        title: isVoucherDemo ? 'Voucher position closed' : 'Position closed',
        description: isVoucherDemo
          ? (credited > 0
              ? `+$${credited.toFixed(2)} credited to voucher earnings pool`
              : 'No profit credited')
          : (credited > 0 ? `+$${credited.toFixed(2)} credited to trial balance` : 'No profit credited'),
      });
      return;
    }

    // Determine source before mutation so toast copy matches the position type.
    const target = airdrops.find((a) => a.id === id);
    const isVoucherClose = target?.source === 'voucher';

    const { data, error } = await supabase.functions.invoke('close-trial-position', {
      body: { airdropPositionId: id, reason: 'USER_CLOSE' },
    });
    if (error || (data as any)?.error) {
      toast({
        title: 'Close failed',
        description: (data as any)?.error ?? error?.message ?? 'Unknown error',
        variant: 'destructive',
      });
      return;
    }
    const credited = Number((data as any)?.creditedPnl ?? 0);
    toast({
      title: isVoucherClose ? 'Voucher position closed' : 'Position closed',
      description: isVoucherClose
        ? (credited > 0
            ? `+$${credited.toFixed(2)} credited to voucher earnings pool`
            : 'No profit credited')
        : (credited > 0 ? `+$${credited.toFixed(2)} credited to trial balance` : 'No profit credited'),
    });
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    if (isVoucherClose) {
      queryClient.invalidateQueries({ queryKey: ['voucher-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['voucher-earnings-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['position-vouchers'] });
    }
  };

  const pendingAirdrops = airdrops.filter((a) => a.status === "pending");
  const activatedAirdrops = airdrops.filter((a) => a.status === "activated");
  const expiredAirdrops = airdrops.filter((a) => a.status === "expired");
  const settledAirdrops = airdrops.filter((a) => a.status === "settled");

  return {
    airdrops,
    pendingAirdrops,
    activatedAirdrops,
    expiredAirdrops,
    settledAirdrops,
    isLoading,
    isError,
    refetch,
    activateAirdrop,
    isActivating,
    closePosition,
  };
};
