import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

interface Equity7D {
  pnlAmount: number;
  pnlPercent: number;
  /** 7 daily cumulative-PnL points, oldest → newest. */
  points: number[];
  hasData: boolean;
  loading: boolean;
}

const DAYS = 7;

/**
 * Derives a 7-day equity proxy from closed trades' realized PnL.
 * - pnlAmount  = sum of pnl on closed trades within the last 7 days
 * - pnlPercent = pnlAmount / (currentBalance - pnlAmount) * 100  (vs. 7d-ago equity)
 * - points     = 7 daily cumulative PnL values (one per day)
 */
export const useEquity7D = (): Equity7D => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [trades, setTrades] = useState<Array<{ pnl: number; closed_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setTrades([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

    const load = async () => {
      const { data } = await supabase
        .from("trades")
        .select("pnl, closed_at")
        .eq("user_id", user.id)
        .eq("status", "Filled")
        .not("closed_at", "is", null)
        .gte("closed_at", since)
        .order("closed_at", { ascending: true });

      if (cancelled) return;
      setTrades(
        (data ?? []).map((t) => ({
          pnl: Number(t.pnl ?? 0),
          closed_at: t.closed_at as string,
        })),
      );
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`equity7d-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return useMemo(() => {
    const balance = Number(profile?.balance ?? 0);

    // Bucket realized PnL into 7 daily slots (oldest → newest = today).
    const buckets = new Array(DAYS).fill(0) as number[];
    const startOfTodayUTC = new Date();
    startOfTodayUTC.setUTCHours(0, 0, 0, 0);
    const startMs = startOfTodayUTC.getTime() - (DAYS - 1) * 24 * 60 * 60 * 1000;

    for (const t of trades) {
      const ts = new Date(t.closed_at).getTime();
      const idx = Math.floor((ts - startMs) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < DAYS) buckets[idx] += t.pnl;
    }

    const pnlAmount = buckets.reduce((a, b) => a + b, 0);
    const baseline = balance - pnlAmount;
    const pnlPercent = baseline > 0 ? (pnlAmount / baseline) * 100 : 0;

    // Cumulative equity series, anchored so the last point ≈ current balance.
    const cumulative: number[] = [];
    let running = baseline;
    for (const b of buckets) {
      running += b;
      cumulative.push(running);
    }

    const hasData = trades.length > 0;

    return {
      pnlAmount,
      pnlPercent,
      points: cumulative,
      hasData,
      loading,
    };
  }, [trades, profile?.balance, loading]);
};
