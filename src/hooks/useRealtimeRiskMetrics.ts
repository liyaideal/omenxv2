import { useMemo } from "react";
import { useSupabasePositions } from "@/hooks/useSupabasePositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";

export type RiskLevel = "SAFE" | "WARNING" | "RESTRICTION" | "LIQUIDATION";

export interface RiskMetrics {
  totalAssets: number;
  totalExposure: number;
  equity: number;
  imTotal: number;
  mmTotal: number;
  imRate: number;
  mmRate: number;
  riskRatio: number;
  riskLevel: RiskLevel;
  availableMargin: number;
  distanceToLiquidation: number;
  unrealizedPnL: number;
  hasPositions: boolean;
}

/**
 * Hook that calculates real-time risk metrics using live price data
 * Updates automatically as market prices change
 */
export function useRealtimeRiskMetrics(): RiskMetrics {
  const { positions: allPositions } = useSupabasePositions();
  // Dual-account cutover (2026-07-21): risk model = futures-only. Spot
  // positions are cash-collateralised out of spot_balance and never contribute
  // to IM / MM / Risk Ratio / close-only gating.
  const positions = useMemo(
    () => allPositions.filter((p: any) => (p.product_line ?? "futures") !== "spot"),
    [allPositions],
  );
  const { balance } = useUserProfile();
  const { calculateRealtimePnL, isLoading: pnlLoading } = useRealtimePositionsPnL();

  return useMemo(() => {
    const totalAssets = balance;

    // Calculate total exposure from positions
    const totalExposure = positions.reduce((sum, pos) => {
      const size = Number(pos.size) || 0;
      const entryPrice = Number(pos.entry_price) || 0;
      return sum + size * entryPrice;
    }, 0);

    // Initial Margin (IM) = sum of all position margins
    const imTotal = positions.reduce((sum, pos) => sum + (Number(pos.margin) || 0), 0);

    // Maintenance Margin (MM) = 50% of IM (standard ratio)
    const mmTotal = imTotal * 0.5;

    // Calculate realtime unrealized PnL using live prices
    const unrealizedPnL = positions.reduce((sum, pos) => {
      // If position has option_id, try realtime calculation
      if (pos.option_id) {
        const positionData = {
          event: pos.event_name,
          option: pos.option_label,
          optionId: pos.option_id,
          type: pos.side as "long" | "short",
          entryPrice: `$${pos.entry_price}`,
          size: String(pos.size),
          margin: `$${pos.margin}`,
        };

        const { pnl, hasRealtimePrice } = calculateRealtimePnL(positionData);

        if (hasRealtimePrice) {
          return sum + pnl;
        }
      }
      
      // Fall back to database PnL value
      return sum + (Number(pos.pnl) || 0);
    }, 0);

    // Equity = Total Assets + Unrealized PnL
    const equity = totalAssets + unrealizedPnL;

    // Risk Ratio = IM / Equity (as percentage)
    const riskRatio = equity > 0 ? (imTotal / equity) * 100 : 0;

    // Determine risk level based on risk ratio thresholds
    let riskLevel: RiskLevel = "SAFE";
    if (riskRatio >= 100) {
      riskLevel = "LIQUIDATION";
    } else if (riskRatio >= 95) {
      riskLevel = "RESTRICTION";
    } else if (riskRatio >= 80) {
      riskLevel = "WARNING";
    }

    // Available margin for new positions
    const availableMargin = Math.max(equity - imTotal, 0);

    // Distance to liquidation
    const distanceToLiquidation = Math.max(equity - imTotal, 0);

    // IM Rate = IM / Equity (same as risk ratio)
    const imRate = equity > 0 ? (imTotal / equity) * 100 : 0;

    // MM Rate = MM / Equity
    const mmRate = equity > 0 ? (mmTotal / equity) * 100 : 0;

    return {
      totalAssets,
      totalExposure,
      equity,
      imTotal,
      mmTotal,
      imRate: Math.min(imRate, 150),
      mmRate: Math.min(mmRate, 150),
      riskRatio: Math.min(riskRatio, 150),
      riskLevel,
      availableMargin,
      distanceToLiquidation,
      unrealizedPnL,
      hasPositions: positions.length > 0,
    };
  }, [positions, balance, calculateRealtimePnL]);
}

// Utility functions for risk level styling
export const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case "SAFE":
      return "text-trading-green";
    case "WARNING":
      return "text-trading-yellow";
    case "RESTRICTION":
      return "text-orange-500";
    case "LIQUIDATION":
      return "text-trading-red";
  }
};

export const getRiskBgColor = (level: RiskLevel): string => {
  switch (level) {
    case "SAFE":
      return "bg-trading-green";
    case "WARNING":
      return "bg-trading-yellow";
    case "RESTRICTION":
      return "bg-orange-500";
    case "LIQUIDATION":
      return "bg-trading-red";
  }
};

export const getRiskMessage = (level: RiskLevel): { icon: string; text: string } => {
  switch (level) {
    case "SAFE":
      return { icon: "✅", text: "Normal trading available" };
    case "WARNING":
      return { icon: "⚠️", text: "Opening restricted, consider reducing" };
    case "RESTRICTION":
      return { icon: "🚨", text: "Close-only mode, no new positions" };
    case "LIQUIDATION":
      return { icon: "💥", text: "Liquidation triggered!" };
  }
};
