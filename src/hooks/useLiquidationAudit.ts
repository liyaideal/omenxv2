import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LiquidationStep = "idle" | "select" | "fetching_chain" | "analyzing" | "result";

interface LiquidationRecord {
  id: string;
  event_name: string;
  option_label: string;
  side: string;
  entry_price: number;
  mark_price: number;
  size: number;
  margin: number;
  leverage: number;
  pnl: number;
  closed_at: string;
}

/** positionSide enum: 0 = Long(Yes), 1 = Short(No) */
const POSITION_SIDE_ENUM: Record<string, { raw: number; label: string }> = {
  long: { raw: 0, label: "Yes" },
  short: { raw: 1, label: "No" },
};

/** Convert decimal price to 6-decimal integer (on-chain representation) */
const toRawPrice = (price: number) => Math.round(price * 1_000_000);

export interface LiquidationAuditData {
  position: LiquidationRecord;
  // On-chain PositionLiquidated event fields
  uid: string;
  positionSide: number;
  positionSideLabel: string;
  onchainMarkPrice: number;
  rawMarkPrice: number; // 6-decimal integer
  liquidationSize: number;
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  liquidatedAt: string;
  // Margin analysis
  marginRatio: number;
  maintenanceMarginRate: number;
  conclusion: "fair" | "suspicious";
}

const mockHex = (len: number) => {
  const chars = "0123456789abcdef";
  let r = "0x";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * 16)];
  return r;
};

const CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const useLiquidationAudit = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<LiquidationStep>("idle");
  const [positions, setPositions] = useState<LiquidationRecord[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<LiquidationRecord | null>(null);
  const [audit, setAudit] = useState<LiquidationAuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPositions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("positions")
      .select("id, event_name, option_label, side, entry_price, mark_price, size, margin, leverage, pnl, closed_at")
      .eq("user_id", user.id)
      .eq("status", "Closed")
      .not("pnl", "is", null)
      .lt("pnl", 0)
      .order("closed_at", { ascending: false })
      .limit(20);
    setPositions((data as LiquidationRecord[]) || []);
    setIsLoading(false);
  }, [user]);

  const openSelector = useCallback(() => {
    setStep("select");
    loadPositions();
  }, [loadPositions]);

  const selectPosition = useCallback(async (pos: LiquidationRecord) => {
    setSelectedPosition(pos);

    setStep("fetching_chain");
    await new Promise((r) => setTimeout(r, 1600));
    setStep("analyzing");
    await new Promise((r) => setTimeout(r, 1400));

    // Derive realistic close price
    let closePrice = pos.mark_price;
    if (!closePrice || closePrice === 0) {
      const direction = pos.side === "long" ? 1 : -1;
      closePrice = pos.entry_price + (direction * (pos.pnl ?? 0)) / (pos.size || 1);
      closePrice = Math.max(closePrice, 0.0001);
    }

    const onchainMarkPrice = parseFloat(closePrice.toPrecision(4));
    const rawMarkPrice = toRawPrice(onchainMarkPrice);

    const maintenanceMarginRate = 5;
    const marginRatio = parseFloat((2 + Math.random() * 2.8).toFixed(2));

    const sideInfo = POSITION_SIDE_ENUM[pos.side] ?? { raw: 0, label: pos.side };
    const uid = mockHex(20);

    const auditData: LiquidationAuditData = {
      position: pos,
      uid,
      positionSide: sideInfo.raw,
      positionSideLabel: sideInfo.label,
      onchainMarkPrice,
      rawMarkPrice,
      liquidationSize: pos.size,
      txHash: mockHex(64),
      blockNumber: 18_000_000 + Math.floor(Math.random() * 500_000),
      contractAddress: CONTRACT_ADDRESS,
      liquidatedAt: pos.closed_at,
      marginRatio,
      maintenanceMarginRate,
      conclusion: marginRatio < maintenanceMarginRate ? "fair" : "suspicious",
    };

    setAudit(auditData);
    setStep("result");
  }, []);

  const reset = useCallback(() => {
    setStep("idle");
    setSelectedPosition(null);
    setAudit(null);
  }, []);

  return { step, positions, selectedPosition, audit, isLoading, openSelector, selectPosition, reset };
};
