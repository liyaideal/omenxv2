import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type SupabasePosition = Tables<"positions">;

// Fetch user's open positions from Supabase
const fetchPositions = async (userId: string): Promise<SupabasePosition[]> => {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "Open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Top up funding on a single position by invoking the accrue-funding edge function.
// Best-effort: failures are logged but don't block close.
const topUpFunding = async (positionId: string) => {
  try {
    await supabase.functions.invoke("accrue-funding", {
      body: { positionId },
    });
  } catch (err) {
    console.warn("[funding] top-up failed before close", err);
  }
};

// Close a position in Supabase
const closePositionInDb = async ({
  userId,
  positionId,
  closePrice,
  pnl,
}: {
  userId: string;
  positionId: string;
  closePrice: number;
  pnl: number;
}): Promise<{ marginReturned: number; fundingPaid: number; netPnl: number }> => {
  // 1. Top up funding to "now" before reading
  await topUpFunding(positionId);

  // 2. Get position details (now with up-to-date funding_accrued)
  const { data: position, error: fetchError } = await supabase
    .from("positions")
    .select("margin, trade_id, funding_accrued")
    .eq("id", positionId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;
  if (!position) throw new Error("Position not found");

  const fundingPaid = Number(position.funding_accrued) || 0;
  // The incoming `pnl` arg is price-only PnL from the form. Subtract funding for net.
  const netPnl = pnl - fundingPaid;

  // 3. Update position status (store net realized pnl)
  const { error: updateError } = await supabase
    .from("positions")
    .update({
      status: "Closed",
      mark_price: closePrice,
      pnl: netPnl,
      closed_at: new Date().toISOString(),
    })
    .eq("id", positionId)
    .eq("user_id", userId);

  if (updateError) throw updateError;

  // 4. Update corresponding trade with funding snapshot
  if (position.trade_id) {
    await supabase
      .from("trades")
      .update({
        status: "Closed",
        pnl: netPnl,
        funding_paid: fundingPaid,
        closed_at: new Date().toISOString(),
      })
      .eq("id", position.trade_id);
  }

  return {
    marginReturned: Number(position.margin) + netPnl,
    fundingPaid,
    netPnl,
  };
};

// Partial close: reduce size/margin proportionally and credit realized PnL line.
// If closeQty >= current size, fully close. Funding is prorated to the closed portion.
const partialClosePositionInDb = async ({
  userId,
  positionId,
  closeQty,
  closePrice,
}: {
  userId: string;
  positionId: string;
  closeQty: number;
  closePrice: number;
}): Promise<{ closedQty: number; remainingSize: number; releasedMargin: number; realizedPnl: number; fundingPaid: number; fullyClosed: boolean }> => {
  // Top up funding before slicing
  await topUpFunding(positionId);

  const { data: position, error: fetchError } = await supabase
    .from("positions")
    .select("size, margin, entry_price, side, trade_id, pnl, funding_accrued")
    .eq("id", positionId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;
  if (!position) throw new Error("Position not found");

  const currentSize = Number(position.size);
  const currentMargin = Number(position.margin);
  const entry = Number(position.entry_price);
  const side = position.side;
  const currentFunding = Number(position.funding_accrued) || 0;

  const qty = Math.min(Math.max(1, Math.floor(closeQty)), Math.floor(currentSize));
  const priceDiff = closePrice - entry;
  const priceRealized = (side === "long" ? priceDiff : -priceDiff) * qty;
  const ratio = qty / currentSize;
  const releasedMargin = currentMargin * ratio;
  // Prorate accrued funding to the closed slice
  const allocatedFunding = currentFunding * ratio;
  const realizedPnl = priceRealized - allocatedFunding;

  // Full close path
  if (qty >= currentSize) {
    const { error: updateError } = await supabase
      .from("positions")
      .update({
        status: "Closed",
        mark_price: closePrice,
        pnl: realizedPnl,
        closed_at: new Date().toISOString(),
      })
      .eq("id", positionId)
      .eq("user_id", userId);
    if (updateError) throw updateError;

    if (position.trade_id) {
      await supabase
        .from("trades")
        .update({
          status: "Closed",
          pnl: realizedPnl,
          funding_paid: currentFunding,
          closed_at: new Date().toISOString(),
        })
        .eq("id", position.trade_id);
    }

    return {
      closedQty: qty,
      remainingSize: 0,
      releasedMargin,
      realizedPnl,
      fundingPaid: currentFunding,
      fullyClosed: true,
    };
  }

  // Partial: reduce size/margin, accumulate realized pnl on the position row,
  // and reduce funding_accrued by the allocated portion.
  const newSize = currentSize - qty;
  const newMargin = currentMargin - releasedMargin;
  const accumulatedPnl = Number(position.pnl || 0) + realizedPnl;
  const remainingFunding = currentFunding - allocatedFunding;

  const { error: updateError } = await supabase
    .from("positions")
    .update({
      size: newSize,
      margin: newMargin,
      mark_price: closePrice,
      pnl: accumulatedPnl,
      funding_accrued: remainingFunding,
    })
    .eq("id", positionId)
    .eq("user_id", userId);
  if (updateError) throw updateError;

  return {
    closedQty: qty,
    remainingSize: newSize,
    releasedMargin,
    realizedPnl,
    fundingPaid: allocatedFunding,
    fullyClosed: false,
  };
};

// Update TP/SL in Supabase
const updateTpSlInDb = async ({
  userId,
  positionId,
  tpValue,
  tpMode,
  slValue,
  slMode,
}: {
  userId: string;
  positionId: string;
  tpValue: number | null;
  tpMode: string | null;
  slValue: number | null;
  slMode: string | null;
}) => {
  const { error } = await supabase
    .from("positions")
    .update({
      tp_value: tpValue,
      tp_mode: tpMode,
      sl_value: slValue,
      sl_mode: slMode,
    })
    .eq("id", positionId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const useSupabasePositions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for fetching positions
  const {
    data: positions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["positions", user?.id],
    queryFn: () => fetchPositions(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation for closing position
  const closePositionMutation = useMutation({
    mutationFn: closePositionInDb,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success(`Position closed! Margin returned: $${data.marginReturned.toFixed(2)}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to close position: ${error.message}`);
    },
  });

  // Mutation for updating TP/SL
  const updateTpSlMutation = useMutation({
    mutationFn: updateTpSlInDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", user?.id] });
      toast.success("TP/SL updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update TP/SL: ${error.message}`);
    },
  });

  // Subscribe to realtime position changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`positions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "positions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch positions when any change occurs
          queryClient.invalidateQueries({ queryKey: ["positions", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Helper to close a position
  const closePosition = useCallback(
    async (positionId: string, closePrice: number, pnl: number) => {
      if (!user?.id) return;
      return closePositionMutation.mutateAsync({
        userId: user.id,
        positionId,
        closePrice,
        pnl,
      });
    },
    [user?.id, closePositionMutation]
  );

  // Helper to update TP/SL
  const updatePositionTpSl = useCallback(
    async (
      positionId: string,
      tpValue: number | null,
      tpMode: string | null,
      slValue: number | null,
      slMode: string | null
    ) => {
      if (!user?.id) return;
      return updateTpSlMutation.mutateAsync({
        userId: user.id,
        positionId,
        tpValue,
        tpMode,
        slValue,
        slMode,
      });
    },
    [user?.id, updateTpSlMutation]
  );

  // Mutation for partial / full close via qty
  const partialCloseMutation = useMutation({
    mutationFn: partialClosePositionInDb,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      const pnlStr = `${data.realizedPnl >= 0 ? "+" : "-"}$${Math.abs(data.realizedPnl).toFixed(2)}`;
      if (data.fullyClosed) {
        toast.success(`Position closed · realized ${pnlStr}`);
      } else {
        toast.success(`Closed ${data.closedQty} contracts · realized ${pnlStr} · ${data.remainingSize} remaining`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to close position: ${error.message}`);
    },
  });

  const partialClosePosition = useCallback(
    async (positionId: string, closeQty: number, closePrice: number) => {
      if (!user?.id) return;
      return partialCloseMutation.mutateAsync({
        userId: user.id,
        positionId,
        closeQty,
        closePrice,
      });
    },
    [user?.id, partialCloseMutation]
  );

  return {
    positions,
    isLoading,
    error,
    refetch,
    closePosition,
    partialClosePosition,
    updatePositionTpSl,
    isClosing: closePositionMutation.isPending || partialCloseMutation.isPending,
    isUpdatingTpSl: updateTpSlMutation.isPending,
  };
};
