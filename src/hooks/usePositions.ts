import { useMemo, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSupabasePositions, SupabasePosition } from "./useSupabasePositions";
import { usePositionsStore, Position as LocalPosition } from "@/stores/usePositionsStore";
import { useAirdropPositions, AirdropPosition, AirdropSource } from "./useAirdropPositions";
import { useEventDisplayLookup } from "./useEventDisplayLookup";


// Unified position interface for components
export interface UnifiedPosition {
  id: string;
  type: "long" | "short";
  event: string;
  option: string;
  /** Display label after applying sideLabels (e.g. team name). Falls back to option. */
  displayOption?: string;
  optionId?: string | null; // Direct reference to event_options for realtime price lookup
  entryPrice: string;
  markPrice: string;
  size: string;           // Raw numeric string for calculations (no commas)
  sizeDisplay: string;    // Formatted string for display (with commas)
  margin: string;
  pnl: string;            // Net PnL (price PnL − funding accrued)
  pnlPercent: string;
  leverage: string;
  tp: string;
  sl: string;
  tpMode: "%" | "$";
  slMode: "%" | "$";
  isAirdrop?: boolean;
  airdropId?: string;
  /** When isAirdrop is true, the underlying source (matched / welcome_gift / voucher). */
  airdropSource?: AirdropSource;
  /** Voucher face value (USD). Voucher source only. */
  voucherFaceValue?: number;
  /** Voucher profit cap (USD). Voucher source only; null → no cap stored, falls back to faceValue × 0.5. */
  voucherRedeemableCap?: number | null;
  // Funding fee fields (raw numbers for math; UI formats as needed)
  fundingAccrued: number;     // Net cumulative funding paid (positive = user paid)
  lastFundingAt: string | null;
  // Raw numeric snapshots (handy for detail dialog math)
  entryPriceNum: number;
  markPriceNum: number;
  sizeNum: number;
  marginNum: number;
  leverageNum: number;
  createdAt: string;
  /** Product line — 'futures' (default) or 'spot'. Spot positions hide leverage/liq/funding. */
  productLine: "futures" | "spot";
  // Original source for mutations
  _source: "supabase" | "local" | "airdrop";
  _supabaseId?: string;
}

// Convert Supabase position to unified format
const convertSupabasePosition = (pos: SupabasePosition): UnifiedPosition => {
  const pnlValue = Number(pos.pnl) || 0;
  const pnlPercentValue = Number(pos.pnl_percent) || 0;
  const sizeNum = Number(pos.size);
  const entryNum = Number(pos.entry_price);
  const markNum = Number(pos.mark_price);
  const marginNum = Number(pos.margin);
  
  return {
    id: pos.id,
    type: pos.side as "long" | "short",
    event: pos.event_name,
    option: pos.option_label,
    optionId: pos.option_id || null, // Direct reference for realtime prices
    entryPrice: `$${entryNum.toFixed(4)}`,
    markPrice: `$${markNum.toFixed(4)}`,
    size: String(sizeNum), // Raw number for calculations
    sizeDisplay: sizeNum.toLocaleString(), // Formatted for display
    margin: `$${marginNum.toFixed(2)}`,
    pnl: `${pnlValue >= 0 ? "+" : ""}$${Math.abs(pnlValue).toFixed(2)}`,
    pnlPercent: `${pnlPercentValue >= 0 ? "+" : ""}${pnlPercentValue.toFixed(1)}%`,
    leverage: `${pos.leverage}x`,
    tp: pos.tp_value ? String(pos.tp_value) : "",
    sl: pos.sl_value ? String(pos.sl_value) : "",
    tpMode: (pos.tp_mode as "%" | "$") || "%",
    slMode: (pos.sl_mode as "%" | "$") || "%",
    fundingAccrued: Number((pos as SupabasePosition & { funding_accrued?: number }).funding_accrued) || 0,
    lastFundingAt: (pos as SupabasePosition & { last_funding_at?: string | null }).last_funding_at ?? null,
    entryPriceNum: entryNum,
    markPriceNum: markNum,
    sizeNum,
    marginNum,
    leverageNum: Number(pos.leverage) || 1,
    createdAt: pos.created_at,
    productLine: ((pos as any).product_line === "spot" ? "spot" : "futures"),
    _source: "supabase",
    _supabaseId: pos.id,
  };
};

// Convert local position to unified format
const convertLocalPosition = (pos: LocalPosition, index: number): UnifiedPosition => {
  const sizeStr = pos.size.replace(/,/g, "");
  const sizeNum = parseFloat(sizeStr) || 0;
  
  const entryNum = parseFloat(pos.entryPrice.replace(/[$,]/g, "")) || 0;
  const markNum = parseFloat(pos.markPrice.replace(/[$,]/g, "")) || 0;
  const marginNum = parseFloat(pos.margin.replace(/[$,]/g, "")) || 0;
  const levNum = parseInt(pos.leverage.replace(/[^\d]/g, ""), 10) || 1;
  return {
    id: `local-${index}`,
    type: pos.type,
    event: pos.event,
    option: pos.option,
    entryPrice: pos.entryPrice,
    markPrice: pos.markPrice,
    size: String(sizeNum), // Raw number for calculations
    sizeDisplay: sizeNum.toLocaleString(), // Formatted for display
    margin: pos.margin,
    pnl: pos.pnl,
    pnlPercent: pos.pnlPercent,
    leverage: pos.leverage,
    tp: pos.tp,
    sl: pos.sl,
    tpMode: pos.tpMode,
    slMode: pos.slMode,
    fundingAccrued: 0,
    lastFundingAt: null,
    entryPriceNum: entryNum,
    markPriceNum: markNum,
    sizeNum,
    marginNum,
    leverageNum: levNum,
    createdAt: new Date().toISOString(),
    productLine: "futures",
    _source: "local",
  };
};

// Voucher positions are 5x leveraged per spec; matched/welcome_gift remain 1x.
const VOUCHER_LEVERAGE = 5;

// Convert activated airdrop to unified position format
const convertAirdropPosition = (airdrop: AirdropPosition): UnifiedPosition => {
  const isVoucher = airdrop.source === "voucher";
  const lev = isVoucher ? VOUCHER_LEVERAGE : 1;
  // qty = faceValue × leverage / entryPrice (5x for voucher → 250 contracts on $25 @ 0.5)
  const qty = Math.max(
    1,
    Math.round((airdrop.airdropValue * lev) / Math.max(airdrop.counterPrice, 0.0001)),
  );
  return {
    id: `airdrop-${airdrop.id}`,
    type: airdrop.counterSide as "long" | "short",
    event: airdrop.counterEventName,
    option: airdrop.counterOptionLabel,
    optionId: airdrop.optionId ?? null,
    entryPrice: `$${airdrop.counterPrice.toFixed(4)}`,
    markPrice: `$${airdrop.counterPrice.toFixed(4)}`,
    size: String(qty),
    sizeDisplay: qty.toLocaleString(),
    margin: `$${airdrop.airdropValue.toFixed(2)}`,
    pnl: "+$0.00",
    pnlPercent: "+0.0%",
    leverage: `${lev}x`,
    tp: "",
    sl: "",
    tpMode: "%",
    slMode: "%",
    isAirdrop: true,
    airdropId: airdrop.id,
    airdropSource: airdrop.source,
    voucherFaceValue: isVoucher ? airdrop.airdropValue : undefined,
    voucherRedeemableCap: isVoucher ? airdrop.redeemableCap ?? null : undefined,
    fundingAccrued: 0,
    lastFundingAt: null,
    entryPriceNum: airdrop.counterPrice,
    markPriceNum: airdrop.counterPrice,
    sizeNum: qty,
    marginNum: airdrop.airdropValue,
    leverageNum: lev,
    createdAt: airdrop.createdAt ?? new Date().toISOString(),
    productLine: "futures",
    _source: "airdrop",
  };
};

export const usePositions = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  // Supabase positions for logged-in users
  const {
    positions: supabasePositions,
    isLoading: supabaseLoading,
    error: supabaseError,
    closePosition: closeSupabasePosition,
    partialClosePosition: partialCloseSupabasePosition,
    updatePositionTpSl: updateSupabaseTpSl,
    isClosing,
    isUpdatingTpSl,
    refetch: refetchSupabasePositions,
  } = useSupabasePositions();
  
  // Local positions for guests
  const {
    positions: localPositions,
    closePosition: closeLocalPosition,
    partialClosePosition: partialCloseLocalPosition,
    updatePositionTpSl: updateLocalTpSl,
  } = usePositionsStore();

  // Activated airdrops (merged into positions list)
  const { activatedAirdrops, closePosition: closeAirdropPosition } = useAirdropPositions();
  
  // Lookup for sideLabels-aware display labels
  const resolveDisplayOption = useEventDisplayLookup();

  // Convert to unified format (including activated airdrops)
  const positions: UnifiedPosition[] = useMemo(() => {
    const base = isLoggedIn
      ? supabasePositions.map(convertSupabasePosition)
      : localPositions.map(convertLocalPosition);
    const airdropPositions = activatedAirdrops.map(convertAirdropPosition);
    return [...base, ...airdropPositions].map((p) => ({
      ...p,
      displayOption: resolveDisplayOption(p.event, p.option),
    }));
  }, [isLoggedIn, supabasePositions, localPositions, activatedAirdrops, resolveDisplayOption]);
  
  // Refetch positions (for logged-in users)
  const refetch = useCallback(() => {
    if (isLoggedIn) {
      refetchSupabasePositions();
    }
  }, [isLoggedIn, refetchSupabasePositions]);
  
  // Unified close position handler
  const closePosition = useCallback(
    async (positionId: string, index: number) => {
      // Airdrop positions — route voucher closes through the trial-position edge function
      if (positionId.startsWith("airdrop-")) {
        const rawId = positionId.slice("airdrop-".length);
        await closeAirdropPosition(rawId);
        return;
      }
      if (isLoggedIn) {
        const pos = supabasePositions.find(p => p.id === positionId);
        if (pos) {
          const closePrice = Number(pos.mark_price);
          const entryPrice = Number(pos.entry_price);
          const size = Number(pos.size);
          const side = pos.side;
          const priceDiff = closePrice - entryPrice;
          const pnl = side === "long" ? priceDiff * size : -priceDiff * size;
          await closeSupabasePosition(positionId, closePrice, pnl);
        }
      } else {
        closeLocalPosition(index);
      }
    },
    [isLoggedIn, supabasePositions, closeSupabasePosition, closeLocalPosition, closeAirdropPosition]
  );

  // Unified partial close handler — closeQty is integer contracts
  const partialClosePosition = useCallback(
    async (positionId: string, index: number, closeQty: number) => {
      if (positionId.startsWith("airdrop-")) {
        // Airdrop / voucher positions are always full-close; ignore qty and call the edge fn.
        const rawId = positionId.slice("airdrop-".length);
        await closeAirdropPosition(rawId);
        return;
      }
      if (isLoggedIn) {
        const pos = supabasePositions.find((p) => p.id === positionId);
        if (pos) {
          const closePrice = Number(pos.mark_price);
          await partialCloseSupabasePosition(positionId, closeQty, closePrice);
        }
      } else {
        partialCloseLocalPosition(index, closeQty);
      }
    },
    [isLoggedIn, supabasePositions, partialCloseSupabasePosition, partialCloseLocalPosition, closeAirdropPosition]
  );
  
  // Unified update TP/SL handler
  const updatePositionTpSl = useCallback(
    async (
      positionId: string,
      index: number,
      tp: string,
      sl: string,
      tpMode: "%" | "$",
      slMode: "%" | "$"
    ) => {
      if (positionId.startsWith("airdrop-")) {
        const { toast } = await import("sonner");
        toast.success("TP/SL updated for airdrop position");
        return;
      }
      if (isLoggedIn) {
        const tpValue = tp ? parseFloat(tp) : null;
        const slValue = sl ? parseFloat(sl) : null;
        await updateSupabaseTpSl(positionId, tpValue, tpMode, slValue, slMode);
      } else {
        updateLocalTpSl(index, tp, sl, tpMode, slMode);
      }
    },
    [isLoggedIn, updateSupabaseTpSl, updateLocalTpSl]
  );
  
  return {
    positions,
    isLoading: isLoggedIn ? supabaseLoading : false,
    isError: isLoggedIn ? !!supabaseError : false,
    isLoggedIn,
    closePosition,
    partialClosePosition,
    updatePositionTpSl,
    isClosing,
    isUpdatingTpSl,
    refetch,
  };
};
