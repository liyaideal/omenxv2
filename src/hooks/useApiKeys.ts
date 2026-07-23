import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";

export type ApiTier = "read_only" | "trading" | "pro_mm";
export type ApiScope =
  | "read_public"
  | "read_private"
  | "trade_order"
  | "trade_cancel"
  | "trade_conditional"
  | "ws_public"
  | "ws_private";

export const ALL_SCOPES: { id: ApiScope; label: string; description: string; requiresIp: boolean }[] = [
  { id: "read_public", label: "read_public", description: "Public market data, event lists, prices", requiresIp: false },
  { id: "read_private", label: "read_private", description: "Account balances, positions, trade history", requiresIp: false },
  { id: "trade_order", label: "trade_order", description: "Place spot & perp orders", requiresIp: true },
  { id: "trade_cancel", label: "trade_cancel", description: "Cancel open orders", requiresIp: true },
  { id: "trade_conditional", label: "trade_conditional", description: "Place conditional / stop orders", requiresIp: true },
  { id: "ws_public", label: "ws_public", description: "Public WebSocket streams (prices, ticker)", requiresIp: false },
  { id: "ws_private", label: "ws_private", description: "Private WebSocket streams (fills, balance)", requiresIp: true },
];

export interface ApiKey {
  id: string;
  user_id: string;
  label: string;
  key_prefix: string;
  tier: ApiTier;
  scopes: ApiScope[];
  ip_whitelist: string[];
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface TierEligibility {
  tier: ApiTier;
  label: string;
  description: string;
  requirements: { label: string; met: boolean; hint?: string }[];
  eligible: boolean;
  manualReview?: boolean;
}

export const useApiKeys = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["api-keys", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ApiKey[]> => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
  });

  const createKey = useMutation({
    mutationFn: async (input: {
      label: string;
      tier: ApiTier;
      scopes: ApiScope[];
      ip_whitelist: string[];
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      // DEMO-STATE: full secret generated client-side and shown once.
      // Production: server-side HMAC/JWT signing + hashed secret storage.
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const secret = `omx_live_${rand}`;
      const prefix = `${secret.slice(0, 12)}…${secret.slice(-4)}`;
      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          label: input.label,
          key_prefix: prefix,
          tier: input.tier,
          scopes: input.scopes,
          ip_whitelist: input.ip_whitelist,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return { key: data as ApiKey, secret };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  return {
    keys: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createKey,
    revokeKey,
  };
};

/** Derive tier eligibility from profile + transactions + trades. */
export const useTierEligibility = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const query = useQuery({
    queryKey: ["api-tier-eligibility", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [depRes, tradeRes, volRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("type", "deposit")
          .eq("status", "completed"),
        supabase
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("status", "Filled"),
        supabase
          .from("trades")
          .select("amount, created_at")
          .eq("user_id", user!.id)
          .eq("status", "Filled")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);
      const depositCount = depRes.count ?? 0;
      const filledCount = tradeRes.count ?? 0;
      const vol30d = (volRes.data ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount) || 0), 0);
      return { depositCount, filledCount, vol30d };
    },
  });

  const emailVerified = !!profile?.email;
  const totpEnabled = !!profile?.totp_enabled;
  const balance = profile?.balance ?? 0;
  const stats = query.data ?? { depositCount: 0, filledCount: 0, vol30d: 0 };

  const readOnly: TierEligibility = {
    tier: "read_only",
    label: "Read-only",
    description: "Market data, account & order history (read only)",
    requirements: [
      { label: "Email verified", met: emailVerified },
      { label: "2FA enabled", met: totpEnabled, hint: "Enable in Settings → Account Security" },
    ],
    eligible: emailVerified && totpEnabled,
  };

  const trading: TierEligibility = {
    tier: "trading",
    label: "Trading",
    description: "Place & cancel orders, private WebSocket streams",
    requirements: [
      { label: "Read-only requirements met", met: readOnly.eligible },
      { label: "At least 1 successful deposit", met: stats.depositCount >= 1 },
      { label: "Balance ≥ 100 USDC", met: balance >= 100 },
      { label: "At least 1 filled trade", met: stats.filledCount >= 1 },
    ],
    eligible: readOnly.eligible && stats.depositCount >= 1 && balance >= 100 && stats.filledCount >= 1,
  };

  const pro: TierEligibility = {
    tier: "pro_mm",
    label: "Pro / Market Maker",
    description: "High rate limits, colocation, MM programs — manual review",
    requirements: [
      {
        label: "30d volume ≥ 50,000 USDC or equity ≥ 10,000 USDC",
        met: stats.vol30d >= 50000 || balance >= 10000,
      },
      { label: "Manual review required", met: false, hint: "Contact us to apply" },
    ],
    eligible: false,
    manualReview: true,
  };

  return { tiers: [readOnly, trading, pro], stats, balance, emailVerified, totpEnabled };
};
