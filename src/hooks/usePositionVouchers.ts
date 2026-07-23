import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export type VoucherStatus = "granted" | "issued" | "claimed" | "redeemed" | "settled" | "expired" | "revoked";

export interface PositionVoucher {
  id: string;
  code: string;
  faceValue: number;
  redeemableCapPct: number;
  maxHoldingHours: number;
  entryPriceMin: number;
  entryPriceMax: number;
  minHoursToSettlement: number;
  status: VoucherStatus;
  issuedAt: string;
  expiresAt: string;
  claimedAt: string | null;
  redeemedAt: string | null;
  redeemedAirdropPositionId: string | null;
  redeemedEventId: string | null;
  redeemedOptionId: string | null;
  redeemedSide: string | null;
  /** Resolved status of the linked airdrop_positions row, when redeemed. */
  redeemedAirdropStatus: string | null;
  redeemedEventName: string | null;
  redeemedOutcomeLabel: string | null;
  redeemedSettledPnl: number | null;
  redeemedCloseReason: string | null;
}

const QUERY_KEY = ["position-vouchers"];

const mapRow = (row: any): PositionVoucher => ({
  id: row.id,
  code: row.code,
  faceValue: Number(row.face_value),
  redeemableCapPct: Number(row.redeemable_cap_pct),
  maxHoldingHours: Number(row.max_holding_hours),
  entryPriceMin: Number(row.entry_price_min),
  entryPriceMax: Number(row.entry_price_max),
  minHoursToSettlement: Number(row.min_hours_to_settlement),
  status: row.status,
  issuedAt: row.issued_at,
  expiresAt: row.expires_at,
  claimedAt: row.claimed_at ?? null,
  redeemedAt: row.redeemed_at,
  redeemedAirdropPositionId: row.redeemed_airdrop_position_id,
  redeemedEventId: row.redeemed_event_id,
  redeemedOptionId: row.redeemed_option_id,
  redeemedSide: row.redeemed_side,
  redeemedAirdropStatus: null,
  redeemedEventName: null,
  redeemedOutcomeLabel: null,
  redeemedSettledPnl: null,
  redeemedCloseReason: null,

});

export const usePositionVouchers = () => {
  const { user } = useUserProfile();
  const queryClient = useQueryClient();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const { data: rawVouchers = [], isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEY, user?.id ?? "guest"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("position_vouchers" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      if (error) {
        // Production surface for <ErrorState>: react-query flips isError so
        // callers can render the retry UI instead of a silent empty list.
        console.error("Failed to fetch vouchers", error);
        throw error;
      }
      const mapped = (data as any[]).map(mapRow);

      // Enrich with linked airdrop_positions.status so we can show "closed"
      // even if the voucher row itself wasn't flipped to 'settled'.
      const airdropIds = mapped
        .map((v) => v.redeemedAirdropPositionId)
        .filter((id): id is string => !!id);
      if (airdropIds.length > 0) {
        const { data: airdropRows } = await supabase
          .from("airdrop_positions")
          .select("id, status, counter_event_name, counter_option_label, counter_side, settled_pnl, close_reason")
          .in("id", airdropIds);
        const byId = new Map<string, any>(
          (airdropRows ?? []).map((r: any) => [r.id, r]),
        );
        return mapped.map((v) => {
          if (!v.redeemedAirdropPositionId) return v;
          const r = byId.get(v.redeemedAirdropPositionId);
          if (!r) return v;
          return {
            ...v,
            redeemedAirdropStatus: r.status ?? null,
            redeemedEventName: r.counter_event_name ?? null,
            redeemedOutcomeLabel: r.counter_option_label ?? null,
            redeemedSide: v.redeemedSide ?? r.counter_side ?? null,
            redeemedSettledPnl: r.settled_pnl != null ? Number(r.settled_pnl) : null,
            redeemedCloseReason: r.close_reason ?? null,
          };
        });
      }
      return mapped;
    },
  });
  // Demo expired vouchers — visible to every user so the "expired" state is
  // discoverable even before any real voucher exists. Two flavours:
  //   1) granted → expired (never claimed)
  //   2) claimed → expired (claimed but not redeemed within 7 days)
  // These are read-only: ExpiredSection has no interactions, and their ids
  // are never passed to claim/redeem edge functions.
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const demoExpired: PositionVoucher[] = [
    {
      id: "demo-expired-unclaimed",
      code: "VCH-7K2P9X",
      faceValue: 5,
      redeemableCapPct: 5,
      maxHoldingHours: 24,
      entryPriceMin: 0.30,
      entryPriceMax: 0.70,
      minHoursToSettlement: 6,
      status: "expired",
      issuedAt: new Date(now - 14 * DAY).toISOString(),
      expiresAt: new Date(now - 7 * DAY).toISOString(),
      claimedAt: null,
      redeemedAt: null,
      redeemedAirdropPositionId: null,
      redeemedEventId: null,
      redeemedOptionId: null,
      redeemedSide: null,
      redeemedAirdropStatus: null,
      redeemedEventName: null,
      redeemedOutcomeLabel: null,
      redeemedSettledPnl: null,
      redeemedCloseReason: null,
    },
    {
      id: "demo-expired-unredeemed",
      code: "VCH-3M8Q4R",
      faceValue: 15,
      redeemableCapPct: 6.667,
      maxHoldingHours: 24,
      entryPriceMin: 0.30,
      entryPriceMax: 0.70,
      minHoursToSettlement: 6,
      status: "expired",
      issuedAt: new Date(now - 12 * DAY).toISOString(),
      expiresAt: new Date(now - 2 * DAY).toISOString(),
      claimedAt: new Date(now - 9 * DAY).toISOString(),
      redeemedAt: null,
      redeemedAirdropPositionId: null,
      redeemedEventId: null,
      redeemedOptionId: null,
      redeemedSide: null,
      redeemedAirdropStatus: null,
      redeemedEventName: null,
      redeemedOutcomeLabel: null,
      redeemedSettledPnl: null,
      redeemedCloseReason: null,
    },
  ];

  const vouchers: PositionVoucher[] = [...rawVouchers, ...demoExpired];


  const grantedVouchers = vouchers.filter(
    (v) => v.status === "granted" && new Date(v.expiresAt).getTime() > Date.now(),
  );

  const claimedVouchers = vouchers.filter(
    (v) =>
      (v.status === "claimed" || v.status === "issued") &&
      new Date(v.expiresAt).getTime() > Date.now(),
  );

  // Backwards-compat alias used by older call sites.
  const issuedVouchers = claimedVouchers;

  const claim = async (voucherId: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.functions.invoke("claim-position-voucher", {
      body: { voucherId },
    });
    if (error || !data?.success) {
      const msg = (data as any)?.error ?? error?.message ?? "Failed to claim voucher";
      toast({ title: "Claim failed", description: msg, variant: "destructive" });
      return { success: false, error: msg };
    }
    toast({ title: "Voucher claimed", description: "You have 7 days to redeem it." });
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    return { success: true };
  };

  const redeem = async (
    voucherId: string,
    eventId: string,
    optionId: string,
    side: "long" | "short",
  ): Promise<{ success: boolean; airdropPositionId?: string; eventId?: string; error?: string }> => {
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-position-voucher", {
        body: { voucherId, eventId, optionId, side },
      });
      if (error) {
        const msg = (data as any)?.error ?? error.message ?? "Failed to redeem voucher";
        toast({ title: "Redemption failed", description: msg, variant: "destructive" });
        return { success: false, error: msg };
      }
      if (!data?.success) {
        const msg = (data as any)?.error ?? "Failed to redeem voucher";
        toast({ title: "Redemption failed", description: msg, variant: "destructive" });
        return { success: false, error: msg };
      }
      toast({ title: "Voucher redeemed", description: "Your position is now active." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["airdrop-positions"] });
      return { success: true, airdropPositionId: data.airdropPositionId, eventId: data.eventId };
    } finally {
      setIsRedeeming(false);
    }
  };

  return { vouchers, grantedVouchers, claimedVouchers, issuedVouchers, isLoading, isError, refetch, claim, redeem, isRedeeming };
};
