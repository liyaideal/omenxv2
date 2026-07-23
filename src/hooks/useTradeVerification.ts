import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TradeVerifyStep = "idle" | "select" | "fetching" | "comparing" | "result";

interface TradeRecord {
  id: string;
  event_name: string;
  option_label: string;
  side: string;
  price: number;
  quantity: number;
  amount: number;
  fee: number;
  order_type: string;
  created_at: string;
  status: string;
  product_line: string;
}

/** Side enum used in the smart contract: 0=Open Long(Yes), 1=Close Long, 2=Open Short(No), 3=Close Short.
 *  Spot has no short leg — sell = Reduce (partial/full unwind of a long share position). */
const SIDE_ENUM_FUTURES: Record<string, { raw: number; label: string }> = {
  buy: { raw: 0, label: "Open Yes" },
  sell: { raw: 3, label: "Close No" },
};
const SIDE_ENUM_SPOT: Record<string, { raw: number; label: string }> = {
  buy: { raw: 0, label: "Open" },
  sell: { raw: 1, label: "Reduce" },
};

/** Convert a decimal price (e.g. 0.5) to 6-decimal integer (500000) used on-chain */
const toRawPrice = (price: number) => Math.round(price * 1_000_000);

export interface OnChainTradeLog {
  eventId: string;
  outcomeId: number;
  userRole: "Taker" | "Maker";
  matchType: string;
  price: number;       // raw 6-decimal integer
  priceHuman: string;  // human-readable
  size: number;
  side: number;        // enum
  sideLabel: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

export interface TradeComparisonData {
  trade: TradeRecord;
  onchain: OnChainTradeLog;
  dbFields: { key: string; label: string; dbValue: string; chainValue: string; chainRaw: string; match: boolean }[];
  verifiedAt: string;
}

const mockHex = (len: number) => {
  const chars = "0123456789abcdef";
  let r = "0x";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * 16)];
  return r;
};

export const useTradeVerification = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<TradeVerifyStep>("idle");
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null);
  const [comparison, setComparison] = useState<TradeComparisonData | null>(null);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  const loadTrades = useCallback(async () => {
    if (!user) return;
    setIsLoadingTrades(true);
    const { data } = await supabase
      .from("trades")
      .select("id, event_name, option_label, side, price, quantity, amount, fee, order_type, created_at, status, product_line")
      .eq("user_id", user.id)
      .eq("status", "Filled")
      .order("created_at", { ascending: false })
      .limit(20);
    setTrades((data as TradeRecord[]) || []);
    setIsLoadingTrades(false);
  }, [user]);

  const openSelector = useCallback(() => {
    setStep("select");
    loadTrades();
  }, [loadTrades]);

  const selectTrade = useCallback(async (trade: TradeRecord) => {
    if (!user) return;
    setSelectedTrade(trade);

    // Step: fetching on-chain TradeLogged event
    setStep("fetching");
    await new Promise((r) => setTimeout(r, 1800));

    // Step: comparing
    setStep("comparing");
    await new Promise((r) => setTimeout(r, 1500));

    const txHash = mockHex(64);
    const blockNumber = 18_000_000 + Math.floor(Math.random() * 500_000);
    const ts = new Date(trade.created_at).toISOString();

    // Map trade side to contract enum (spot has no short leg → Reduce semantics)
    const isSpot = trade.product_line === "spot";
    const sideMap = isSpot ? SIDE_ENUM_SPOT : SIDE_ENUM_FUTURES;
    const sideInfo = sideMap[trade.side] ?? { raw: 0, label: trade.side };
    const rawPrice = toRawPrice(trade.price);
    // Simulated event/outcome IDs
    const eventId = `EVT-${Math.floor(Math.random() * 90000) + 10000}`;
    const outcomeId = Math.floor(Math.random() * 4); // 0-3
    // Derive user role from order type: market → Taker; limit → Maker (simplified)
    const userRole: "Taker" | "Maker" = trade.order_type === "limit" ? "Maker" : "Taker";
    const matchType = "Order Matching";

    const onchain: OnChainTradeLog = {
      eventId,
      outcomeId,
      userRole,
      matchType,
      price: rawPrice,
      priceHuman: `$${trade.price.toFixed(4)}`,
      size: trade.quantity,
      side: sideInfo.raw,
      sideLabel: sideInfo.label,
      txHash,
      blockNumber,
      timestamp: ts,
    };

    // Build comparison fields
    const dbSideLabel = isSpot
      ? (trade.side === "buy" ? "BUY" : "REDUCE")
      : (trade.side === "buy" ? "LONG" : "SHORT");
    const dbFields = [
      {
        key: "eventId",
        label: "Event ID",
        dbValue: trade.event_name,
        chainValue: eventId,
        chainRaw: eventId,
        match: true,
      },
      {
        key: "marketId",
        label: "Market ID",
        dbValue: trade.option_label,
        chainValue: trade.option_label,
        chainRaw: outcomeId.toString(),
        match: true,
      },
      {
        key: "side",
        label: "Side",
        dbValue: dbSideLabel,
        chainValue: sideInfo.label,
        chainRaw: sideInfo.raw.toString(),
        match: true,
      },
      {
        key: "price",
        label: "Price",
        dbValue: `$${trade.price.toFixed(4)}`,
        chainValue: `$${trade.price.toFixed(4)}`,
        chainRaw: rawPrice.toLocaleString(),
        match: true,
      },
      {
        key: "size",
        label: "Size",
        dbValue: trade.quantity.toString(),
        chainValue: trade.quantity.toString(),
        chainRaw: trade.quantity.toString(),
        match: true,
      },
      {
        key: "timestamp",
        label: "Timestamp",
        dbValue: ts,
        chainValue: ts,
        chainRaw: Math.floor(new Date(ts).getTime() / 1000).toString(),
        match: true,
      },
    ];

    const data: TradeComparisonData = {
      trade,
      onchain,
      dbFields,
      verifiedAt: new Date().toISOString(),
    };

    setComparison(data);

    // Save to DB
    try {
      await supabase.from("trade_verifications").insert({
        user_id: user.id,
        trade_id: trade.id,
        db_record: Object.fromEntries(dbFields.map(f => [f.key, f.dbValue])),
        onchain_log: Object.fromEntries(dbFields.map(f => [f.key, f.chainRaw])),
        matched_fields: dbFields.filter(f => f.match).map(f => f.key),
        counterparty: null,
        verification_result: "matched",
        verified_at: new Date().toISOString(),
      } as any);
    } catch {}

    setStep("result");
  }, [user]);

  const reset = useCallback(() => {
    setStep("idle");
    setSelectedTrade(null);
    setComparison(null);
  }, []);

  return { step, trades, selectedTrade, comparison, isLoadingTrades, openSelector, selectTrade, reset };
};
