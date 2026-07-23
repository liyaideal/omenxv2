import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Maximum allowed leverage
const MAX_LEVERAGE = 100;
const MIN_LEVERAGE = 1;
const FEE_RATE = 0.0005; // 0.05% fee rate (must match TradeForm)

// Zod schema for trade data validation
const TradeDataSchema = z.object({
  eventName: z.string().min(1, "Event name is required").max(200, "Event name too long"),
  optionLabel: z.string().min(1, "Option label is required").max(200, "Option label too long"),
  side: z.enum(["buy", "sell"], { errorMap: () => ({ message: "Invalid side" }) }),
  orderType: z.enum(["Market", "Limit"], { errorMap: () => ({ message: "Invalid order type" }) }),
  price: z.number().positive("Price must be positive").max(1000000, "Price exceeds maximum"),
  amount: z.number().positive("Amount must be positive").max(10000000, "Amount exceeds maximum"),
  quantity: z.number().positive("Quantity must be positive").max(100000000, "Quantity exceeds maximum"),
  leverage: z.number().int("Leverage must be an integer").min(MIN_LEVERAGE).max(MAX_LEVERAGE, `Leverage cannot exceed ${MAX_LEVERAGE}x`),
  margin: z.number().nonnegative("Margin cannot be negative"),
  fee: z.number().nonnegative("Fee cannot be negative").max(10000, "Fee exceeds maximum"),
  tpValue: z.number().positive("Take profit must be positive").optional(),
  tpMode: z.enum(["%", "$"]).optional(),
  slValue: z.number().positive("Stop loss must be positive").optional(),
  slMode: z.enum(["%", "$"]).optional(),
});

export interface TradeData {
  eventName: string;
  optionLabel: string;
  optionId?: string; // Direct reference to event_options table
  side: "buy" | "sell";
  orderType: "Market" | "Limit";
  price: number;
  amount: number;
  quantity: number;
  leverage: number;
  margin: number;
  fee: number;
  tpValue?: number;
  tpMode?: "%" | "$";
  slValue?: number;
  slMode?: "%" | "$";
}

export interface PositionData {
  tradeId: string;
  eventName: string;
  optionLabel: string;
  side: "long" | "short";
  entryPrice: number;
  markPrice: number;
  size: number;
  margin: number;
  leverage: number;
  tpValue?: number;
  tpMode?: "%" | "$";
  slValue?: number;
  slMode?: "%" | "$";
}

export interface TradeExecutionResult {
  trade: any;
  position: any;
  intent: "open" | "add" | "reduce" | "close";
  balanceDelta: number;
}

// Validate margin calculation
const validateMarginCalculation = (price: number, quantity: number, leverage: number, providedMargin: number): boolean => {
  const expectedMargin = (price * quantity) / leverage;
  // Allow 1% tolerance for rounding differences
  const tolerance = expectedMargin * 0.01;
  return Math.abs(providedMargin - expectedMargin) <= Math.max(tolerance, 0.01);
};

// Validate fee calculation (fee is based on notional value = amount * leverage)
const validateFeeCalculation = (amount: number, leverage: number, providedFee: number): boolean => {
  const notionalValue = amount * leverage;
  const expectedFee = notionalValue * FEE_RATE;
  // Allow 5% tolerance for rounding differences
  const tolerance = expectedFee * 0.05;
  return Math.abs(providedFee - expectedFee) <= Math.max(tolerance, 0.01);
};

// Create a new trade and position with validation
export const executeTrade = async (userId: string, tradeData: TradeData) => {
  try {
    // Step 1: Validate input schema
    const validationResult = TradeDataSchema.safeParse(tradeData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(", ");
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    
    const validated = validationResult.data;
    
    // Step 2: Validate business logic - fee calculation (based on notional value)
    if (!validateFeeCalculation(validated.amount, validated.leverage, validated.fee)) {
      throw new Error("Invalid fee calculation. Please try again.");
    }
    
    // Step 3: Additional sanity checks
    if (validated.leverage > MAX_LEVERAGE) {
      throw new Error(`Leverage cannot exceed ${MAX_LEVERAGE}x`);
    }
    
    // Validate TP/SL values if provided
    if (validated.tpValue !== undefined && validated.tpMode === undefined) {
      throw new Error("Take profit mode is required when take profit value is set");
    }
    if (validated.slValue !== undefined && validated.slMode === undefined) {
      throw new Error("Stop loss mode is required when stop loss value is set");
    }

    // Determine status based on order type
    const isMarketOrder = validated.orderType === "Market";
    const tradeStatus = isMarketOrder ? "Filled" : "Pending";

    // Insert trade record with validated data
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        user_id: userId,
        event_name: validated.eventName,
        option_label: validated.optionLabel,
        side: validated.side,
        order_type: validated.orderType,
        price: validated.price,
        amount: validated.amount,
        quantity: validated.quantity,
        leverage: validated.leverage,
        margin: validated.margin,
        fee: validated.fee,
        status: tradeStatus,
        tp_value: validated.tpValue,
        tp_mode: validated.tpMode,
        sl_value: validated.slValue,
        sl_mode: validated.slMode,
      })
      .select()
      .single();

    if (tradeError) {
      console.error("Trade error:", tradeError);
      throw tradeError;
    }

    // Only create/update position for Market orders (immediate execution)
    // Limit orders remain pending until filled
    if (!isMarketOrder) {
      return { trade, position: null, intent: "open", balanceDelta: -(validated.margin + validated.fee) } satisfies TradeExecutionResult;
    }

    // Create, add, reduce, or close corresponding position with validated data (Market orders only)
    // Binary events: Yes and No are independent positions; No is no longer remapped onto the Yes axis.
    // Buy → long on the traded option; Sell → short on the traded option. Entry = clicked price.
    const positionSide: "long" | "short" = validated.side === "buy" ? "long" : "short";
    const positionOptionLabel = validated.optionLabel;
    const canonicalClosePrice = validated.price;

    const oppositeSide = positionSide === "long" ? "short" : "long";
    const { data: oppositePosition, error: oppositeFindError } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", userId)
      .eq("event_name", validated.eventName)
      .eq("option_label", positionOptionLabel)
      .eq("side", oppositeSide)
      .eq("status", "Open")
      .maybeSingle();

    if (oppositeFindError) {
      console.error("Find opposite position error:", oppositeFindError);
      throw oppositeFindError;
    }

    if (oppositePosition) {
      const existingSize = Number(oppositePosition.size);
      if (validated.quantity > existingSize + 0.000001) {
        await supabase.from("trades").update({ status: "Cancelled" }).eq("id", trade.id);
        throw new Error("Close existing position first before opening the opposite side.");
      }

      if (validated.margin !== 0) {
        await supabase.from("trades").update({ status: "Cancelled" }).eq("id", trade.id);
        throw new Error("Reduce and close orders must not require opening margin.");
      }

      const closeQty = Math.min(validated.quantity, existingSize);
      const marginReleased = existingSize > 0 ? (Number(oppositePosition.margin) * closeQty) / existingSize : 0;
      const realizedPnl = oppositeSide === "long"
        ? (canonicalClosePrice - Number(oppositePosition.entry_price)) * closeQty
        : (Number(oppositePosition.entry_price) - canonicalClosePrice) * closeQty;
      const remainingSize = existingSize - closeQty;
      const remainingMargin = Number(oppositePosition.margin) - marginReleased;
      const intent = remainingSize <= 0.000001 ? "close" : "reduce";

      const { data: updatedPosition, error: reduceError } = await supabase
        .from("positions")
        .update(intent === "close" ? {
          status: "Closed",
          mark_price: canonicalClosePrice,
          pnl: (Number(oppositePosition.pnl) || 0) + realizedPnl,
          pnl_percent: Number(oppositePosition.margin) > 0
            ? (((Number(oppositePosition.pnl) || 0) + realizedPnl) / Number(oppositePosition.margin)) * 100
            : 0,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : {
          size: remainingSize,
          margin: remainingMargin,
          mark_price: canonicalClosePrice,
          pnl: (Number(oppositePosition.pnl) || 0) + realizedPnl,
          pnl_percent: remainingMargin > 0 ? (((Number(oppositePosition.pnl) || 0) + realizedPnl) / remainingMargin) * 100 : 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", oppositePosition.id)
        .select()
        .single();

      if (reduceError) {
        console.error("Reduce position error:", reduceError);
        throw reduceError;
      }

      await supabase
        .from("trades")
        .update({ pnl: realizedPnl, status: "Filled", closed_at: intent === "close" ? new Date().toISOString() : null })
        .eq("id", trade.id);

      return { trade, position: updatedPosition, intent, balanceDelta: marginReleased + realizedPnl - validated.fee } satisfies TradeExecutionResult;
    }
    
    // Check if there's an existing open position with same event + option + side
    const { data: existingPosition, error: findError } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", userId)
      .eq("event_name", validated.eventName)
      .eq("option_label", positionOptionLabel)
      .eq("side", positionSide)
      .eq("status", "Open")
      .maybeSingle();

    if (findError) {
      console.error("Find position error:", findError);
      throw findError;
    }

    if (!validateMarginCalculation(canonicalClosePrice, validated.quantity, validated.leverage, validated.margin)) {
      await supabase.from("trades").update({ status: "Cancelled" }).eq("id", trade.id);
      throw new Error("Invalid margin calculation. Please try again.");
    }

    let position;

    if (existingPosition) {
      // Merge into existing position with weighted average entry price
      const newSize = existingPosition.size + validated.quantity;
      const newMargin = existingPosition.margin + validated.margin;
      
      // Calculate weighted average entry price
      // (oldSize * oldEntry + newSize * newEntry) / totalSize
      const weightedEntryPrice = 
        (existingPosition.size * existingPosition.entry_price + validated.quantity * canonicalClosePrice) / newSize;
      
      // Recalculate PnL based on new weighted entry price
      const currentMarkPrice = existingPosition.mark_price;
      let newPnl = 0;
      if (positionSide === "long") {
        newPnl = (currentMarkPrice - weightedEntryPrice) * newSize;
      } else {
        newPnl = (weightedEntryPrice - currentMarkPrice) * newSize;
      }
      const newPnlPercent = newMargin > 0 ? (newPnl / newMargin) * 100 : 0;

      const { data: updatedPosition, error: updateError } = await supabase
        .from("positions")
        .update({
          size: newSize,
          margin: newMargin,
          entry_price: weightedEntryPrice,
          pnl: newPnl,
          pnl_percent: newPnlPercent,
          // Keep existing TP/SL unless new ones are provided
          tp_value: validated.tpValue ?? existingPosition.tp_value,
          tp_mode: validated.tpMode ?? existingPosition.tp_mode,
          sl_value: validated.slValue ?? existingPosition.sl_value,
          sl_mode: validated.slMode ?? existingPosition.sl_mode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPosition.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update position error:", updateError);
        throw updateError;
      }
      
      position = updatedPosition;
    } else {
      // Create new position with option_id for direct price lookup
      const { data: newPosition, error: positionError } = await supabase
        .from("positions")
        .insert({
          user_id: userId,
          trade_id: trade.id,
          event_name: validated.eventName,
          option_label: positionOptionLabel,
          option_id: tradeData.optionId || null, // Store direct reference to event_options
          side: positionSide,
          entry_price: canonicalClosePrice,
          mark_price: canonicalClosePrice,
          size: validated.quantity,
          margin: validated.margin,
          leverage: validated.leverage,
          pnl: 0,
          pnl_percent: 0,
          tp_value: validated.tpValue,
          tp_mode: validated.tpMode,
          sl_value: validated.slValue,
          sl_mode: validated.slMode,
          status: "Open",
        })
        .select()
        .single();

      if (positionError) {
        console.error("Position error:", positionError);
        throw positionError;
      }
      
      position = newPosition;
    }

    return { trade, position, intent: existingPosition ? "add" : "open", balanceDelta: -(validated.margin + validated.fee) } satisfies TradeExecutionResult;
  } catch (error) {
    console.error("Execute trade error:", error);
    throw error;
  }
};

// Get user's trades
export const getUserTrades = async (userId: string) => {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get user's open positions
export const getUserPositions = async (userId: string) => {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "Open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Close a position
export const closePosition = async (
  userId: string, 
  positionId: string, 
  closePrice: number,
  pnl: number
) => {
  try {
    // Update position status
    const { error: positionError } = await supabase
      .from("positions")
      .update({
        status: "Closed",
        mark_price: closePrice,
        pnl: pnl,
        closed_at: new Date().toISOString(),
      })
      .eq("id", positionId)
      .eq("user_id", userId);

    if (positionError) throw positionError;

    // Get the position to find the trade
    const { data: position } = await supabase
      .from("positions")
      .select("trade_id, margin")
      .eq("id", positionId)
      .single();

    // Update corresponding trade
    if (position?.trade_id) {
      await supabase
        .from("trades")
        .update({
          status: "Closed",
          pnl: pnl,
          closed_at: new Date().toISOString(),
        })
        .eq("id", position.trade_id);
    }

    // Return margin + PnL to be added back to balance
    return (position?.margin || 0) + pnl;
  } catch (error) {
    console.error("Close position error:", error);
    throw error;
  }
};

// Update balance in profile
export const updateUserBalance = async (userId: string, newBalance: number) => {
  const { error } = await supabase
    .from("profiles")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  if (error) throw error;
  return true;
};

// ============================================================
// SPOT product line (Pro / US stock daily up/down)
// ------------------------------------------------------------
// Spot rules (differ from futures):
// - leverage = 1, fee = 0
// - Buy → long position on the chosen outcome; entry price = clicked price
// - Sell → reduces / closes an existing long spot position on the same option;
//   short-selling is prohibited (validated below)
// - Winning share pays $1 at settlement; max loss = price × qty
// - Never renders TP/SL/funding/liq. — enforced at UI layer
// ============================================================

const SpotTradeSchema = z.object({
  eventName: z.string().min(1).max(200),
  optionLabel: z.string().min(1).max(200),
  optionId: z.string().uuid("optionId is required for spot trades"),
  side: z.enum(["buy", "sell"]),
  price: z.number().positive().max(1),
  quantity: z.number().positive().max(10_000_000),
});

export interface SpotTradeData {
  eventName: string;
  optionLabel: string;
  optionId: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
}

// 技术对接 §7: SIGNED_YES_SHARE net position, one-way mode.
// 同一事件下 Up / Not Up 至多一边有仓位；反向买入自动冲减对面仓位，
// 再用剩余数量开新仓。fetchSpotSides 在写入前后读同一事件的两侧持仓。
const fetchSpotSides = async (userId: string, eventName: string, optionId: string) => {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("event_name", eventName)
    .eq("product_line", "spot")
    .eq("side", "long")
    .eq("status", "Open");
  if (error) throw error;
  const same = (data || []).find((p) => p.option_id === optionId) || null;
  const opposite = (data || []).find((p) => p.option_id !== optionId) || null;
  return { same, opposite };
};

// Reduce/close an opposite spot leg at the implied opposite mark (1 - price)
// for binary pair. Returns realized cash back to the buyer (margin released +
// realized PnL on the leg).
const reduceOppositeLeg = async (opposite: any, buyPrice: number, qty: number) => {
  const oppSize = Number(opposite.size);
  const oppMargin = Number(opposite.margin);
  const oppEntry = Number(opposite.entry_price);
  const impliedOppMark = Math.min(0.99, Math.max(0.01, 1 - buyPrice));
  const closeQty = Math.min(qty, oppSize);
  const marginReleased = oppSize > 0 ? (oppMargin * closeQty) / oppSize : 0;
  const realizedPnl = (impliedOppMark - oppEntry) * closeQty;
  const remainingSize = oppSize - closeQty;
  const isClose = remainingSize <= 0.000001;
  await supabase
    .from("positions")
    .update(
      isClose
        ? {
            status: "Closed",
            mark_price: impliedOppMark,
            pnl: (Number(opposite.pnl) || 0) + realizedPnl,
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            size: remainingSize,
            margin: oppMargin - marginReleased,
            mark_price: impliedOppMark,
            pnl: (Number(opposite.pnl) || 0) + realizedPnl,
            updated_at: new Date().toISOString(),
          },
    )
    .eq("id", opposite.id);
  return {
    closedQty: closeQty,
    marginReleased,
    realizedPnl,
    remainingSize,
    fullyClosed: isClose,
  };
};

// Open or merge a same-side spot long (weighted avg entry).
const openOrMergeSameSide = async (
  userId: string,
  same: any | null,
  data: SpotTradeData,
  qty: number,
  tradeId: string,
) => {
  const notional = data.price * qty;
  if (same) {
    const oldSize = Number(same.size);
    const oldEntry = Number(same.entry_price);
    const newSize = oldSize + qty;
    const newMargin = Number(same.margin) + notional;
    const weightedEntry = (oldSize * oldEntry + qty * data.price) / newSize;
    const { data: updated } = await supabase
      .from("positions")
      .update({
        size: newSize,
        margin: newMargin,
        entry_price: weightedEntry,
        mark_price: data.price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", same.id)
      .select()
      .single();
    return { position: updated, intent: "add" as const };
  }
  const { data: created, error: posError } = await supabase
    .from("positions")
    .insert({
      user_id: userId,
      trade_id: tradeId,
      event_name: data.eventName,
      option_label: data.optionLabel,
      option_id: data.optionId,
      side: "long",
      entry_price: data.price,
      mark_price: data.price,
      size: qty,
      margin: notional,
      leverage: 1,
      pnl: 0,
      pnl_percent: 0,
      status: "Open",
      product_line: "spot",
    })
    .select()
    .single();
  if (posError) throw posError;
  return { position: created, intent: "open" as const };
};

export const executeSpotTrade = async (userId: string, data: SpotTradeData) => {
  const parsed = SpotTradeSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.errors.map((e) => e.message).join(", ")}`);
  }
  const v = parsed.data;
  const notional = v.price * v.quantity;

  const { same, opposite } = await fetchSpotSides(userId, v.eventName, v.optionId);

  // -------- SELL: net-position check — only sellable if same-side net exists --------
  if (v.side === "sell") {
    // 技术对接 §7: 净仓方向校验。反向净仓存在时禁止 sell（应改为 buy 冲减）。
    if (opposite && !same) {
      throw new Error("You hold the opposite outcome. Buy back to reduce, don't sell.");
    }
    if (!same || Number(same.size) < v.quantity - 0.000001) {
      throw new Error("Not enough spot shares to sell. Short selling is not supported.");
    }

    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        user_id: userId,
        event_name: v.eventName,
        option_label: v.optionLabel,
        side: "sell",
        order_type: "Limit",
        price: v.price,
        amount: notional,
        quantity: v.quantity,
        leverage: 1,
        margin: notional,
        fee: 0,
        status: "Filled",
        product_line: "spot",
      })
      .select()
      .single();
    if (tradeError) throw tradeError;

    const existingSize = Number(same.size);
    const existingMargin = Number(same.margin);
    const entryPrice = Number(same.entry_price);
    const closeQty = Math.min(v.quantity, existingSize);
    const marginReleased = existingSize > 0 ? (existingMargin * closeQty) / existingSize : 0;
    const realizedPnl = (v.price - entryPrice) * closeQty;
    const remainingSize = existingSize - closeQty;
    const isClose = remainingSize <= 0.000001;

    const { data: updatedPosition } = await supabase
      .from("positions")
      .update(
        isClose
          ? {
              status: "Closed",
              mark_price: v.price,
              pnl: (Number(same.pnl) || 0) + realizedPnl,
              closed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : {
              size: remainingSize,
              margin: existingMargin - marginReleased,
              mark_price: v.price,
              pnl: (Number(same.pnl) || 0) + realizedPnl,
              updated_at: new Date().toISOString(),
            },
      )
      .eq("id", same.id)
      .select()
      .single();

    // DEMO-STATE: event_pending_cash 简化 — 卖出回款直接进钱包；
    // 正式版按 §7.2 应入 event_pending_cash，事件终态前不可提现。
    const proceeds = v.price * closeQty;
    return {
      trade,
      position: updatedPosition,
      intent: (isClose ? "close" : "reduce") as "close" | "reduce",
      balanceDelta: proceeds,
    };
  }

  // -------- BUY: net-position auto-reduce, then open remainder --------
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      user_id: userId,
      event_name: v.eventName,
      option_label: v.optionLabel,
      side: "buy",
      order_type: "Limit",
      price: v.price,
      amount: notional,
      quantity: v.quantity,
      leverage: 1,
      margin: notional,
      fee: 0,
      status: "Filled",
      product_line: "spot",
    })
    .select()
    .single();
  if (tradeError) throw tradeError;

  let releasedFromOpposite = 0;
  let remainingQty = v.quantity;
  let intent: "open" | "add" | "reduce" | "close" = same ? "add" : "open";

  if (opposite) {
    const r = await reduceOppositeLeg(opposite, v.price, v.quantity);
    releasedFromOpposite = r.marginReleased + r.realizedPnl;
    remainingQty = v.quantity - r.closedQty;
    intent = r.fullyClosed && remainingQty > 0 ? "open" : "reduce";
  }

  let position = opposite ?? null;
  if (remainingQty > 0.000001) {
    const opened = await openOrMergeSameSide(userId, same, v as SpotTradeData, remainingQty, trade.id);
    position = opened.position;
    intent = opposite ? "reduce" : opened.intent;
  }

  const spentOnNewSide = Math.max(0, remainingQty) * v.price;
  // Net cash impact: full notional debited up front, opposite refund credited back.
  const balanceDelta = -notional + releasedFromOpposite + (v.quantity - remainingQty) * v.price;
  // Re-derive by intent = -spentOnNewSide + releasedFromOpposite (equivalent, kept explicit for review):
  void balanceDelta;

  return {
    trade,
    position,
    intent,
    balanceDelta: -spentOnNewSide + releasedFromOpposite,
  };
};


// -----------------------------------------------------------------
// SPOT limit-order simulation (Pending → touch fill → Filled/Cancelled).
// DEMO-STATE: In production the matching engine owns this lifecycle;
// here the front end places Pending trade rows and monitors the mark
// price via the Realtime prices context to simulate fills.
// -----------------------------------------------------------------

/** Place a Pending spot limit order. Cash for BUY orders is reserved by
 *  the caller (via `useUserProfile.deductBalance`); shares for SELL orders
 *  are checked at place time and re-checked at fill time. */
export const placeSpotLimitOrder = async (userId: string, data: SpotTradeData) => {
  const parsed = SpotTradeSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.errors.map((e) => e.message).join(", ")}`);
  }
  const v = parsed.data;
  const notional = v.price * v.quantity;

  if (v.side === "sell") {
    const { data: existing } = await supabase
      .from("positions")
      .select("size")
      .eq("user_id", userId)
      .eq("option_id", v.optionId)
      .eq("product_line", "spot")
      .eq("side", "long")
      .eq("status", "Open")
      .maybeSingle();
    if (!existing || Number(existing.size) < v.quantity - 0.000001) {
      throw new Error("Not enough spot shares to sell. Short selling is not supported.");
    }
  }

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: userId,
      event_name: v.eventName,
      option_label: v.optionLabel,
      side: v.side,
      order_type: "Limit",
      price: v.price,
      amount: notional,
      quantity: v.quantity,
      leverage: 1,
      margin: notional,
      fee: 0,
      status: "Pending",
      product_line: "spot",
    })
    .select()
    .single();
  if (error) throw error;
  return { trade, reservedAmount: v.side === "buy" ? notional : 0 };
};

/** Cancel a Pending spot limit order. Returns the amount to refund
 *  to the wallet (BUY: reserved notional; SELL: 0 — shares were never
 *  moved). No-op if the order is not Pending. */
export const cancelSpotLimitOrder = async (userId: string, tradeId: string) => {
  const { data: trade } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!trade || trade.status !== "Pending") return { refund: 0 };
  await supabase.from("trades").update({ status: "Cancelled" }).eq("id", trade.id);
  return { refund: trade.side === "buy" ? Number(trade.amount) : 0 };
};

/** Fill a previously Pending spot limit order. For BUY orders the cash
 *  was already reserved at place time, so `balanceDelta = 0`; for SELL
 *  the wallet receives `price × qty` proceeds. Creates or merges the
 *  spot long position. If the SELL can no longer be honoured (shares
 *  moved), the order is auto-cancelled and `balanceDelta = 0`.
 *
 *  DEMO-STATE: Called from the front end when the mark price touches
 *  the limit. Production replaces this with an actual matching engine. */
export const fillSpotLimitOrder = async (userId: string, tradeId: string) => {
  const { data: trade, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!trade || trade.status !== "Pending") return { balanceDelta: 0, intent: "noop" as const };

  const q = Number(trade.quantity);
  const price = Number(trade.price);

  // Resolve option_id via events.name → event_options.label so settlement
  // (`sim-settle-spot`) can match positions by option_id. Without this the
  // new position row has option_id=NULL and gets silently skipped at settle.
  // Fallback matching by option_label is also implemented on the settle side.
  let resolvedOptionId: string | null = null;
  try {
    const { data: ev } = await supabase
      .from("events")
      .select("id")
      .eq("name", trade.event_name)
      .maybeSingle();
    if (ev?.id) {
      const { data: opt } = await supabase
        .from("event_options")
        .select("id")
        .eq("event_id", ev.id)
        .eq("label", trade.option_label)
        .maybeSingle();
      resolvedOptionId = opt?.id ?? null;
    }
  } catch (_) { /* fallback keeps NULL, settle-side label match still works */ }

  // 技术对接 §7: net position — consider BOTH sides of the event, not just
  // the option being traded.
  const { data: allSides } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("event_name", trade.event_name)
    .eq("product_line", "spot")
    .eq("side", "long")
    .eq("status", "Open");
  const same = (allSides || []).find((p) => p.option_label === trade.option_label) || null;
  const opposite = (allSides || []).find((p) => p.option_label !== trade.option_label) || null;


  if (trade.side === "buy") {
    // Buy → first reduce any opposite leg (net position), then open/merge same side.
    let releasedFromOpposite = 0;
    let remainingQty = q;
    if (opposite) {
      const r = await reduceOppositeLeg(opposite, price, q);
      releasedFromOpposite = r.marginReleased + r.realizedPnl;
      remainingQty = q - r.closedQty;
    }
    if (remainingQty > 0.000001) {
      const remainingNotional = remainingQty * price;
      if (same) {
        const oldSize = Number(same.size);
        const oldEntry = Number(same.entry_price);
        const newSize = oldSize + remainingQty;
        const weightedEntry = (oldSize * oldEntry + remainingQty * price) / newSize;
        await supabase
          .from("positions")
          .update({
            size: newSize,
            margin: Number(same.margin) + remainingNotional,
            entry_price: weightedEntry,
            mark_price: price,
            updated_at: new Date().toISOString(),
          })
          .eq("id", same.id);
      } else {
        await supabase.from("positions").insert({
          user_id: userId,
          trade_id: trade.id,
          event_name: trade.event_name,
          option_id: resolvedOptionId,
          option_label: trade.option_label,
          side: "long",
          entry_price: price,
          mark_price: price,
          size: remainingQty,
          margin: remainingNotional,
          leverage: 1,
          pnl: 0,
          pnl_percent: 0,
          status: "Open",
          product_line: "spot",
        });
      }

    }
    await supabase
      .from("trades")
      .update({ status: "Filled", closed_at: new Date().toISOString() })
      .eq("id", trade.id);
    // Reserved cash was `q × price`. Actual new-side spend = remainingQty × price;
    // refund the rest (fully-reduced portion) plus the released cash from opposite.
    const reservedRefund = (q - remainingQty) * price + releasedFromOpposite;
    return {
      balanceDelta: reservedRefund,
      intent: (opposite && remainingQty <= 0.000001 ? "reduce" : same || opposite ? "add" : "open") as
        | "add"
        | "open"
        | "reduce",
    };
  }

  const existing = same; // sell uses only same-side


  // SELL fill
  if (!existing || Number(existing.size) < q - 0.000001) {
    await supabase.from("trades").update({ status: "Cancelled" }).eq("id", trade.id);
    return { balanceDelta: 0, intent: "noop" as const };
  }
  const existingSize = Number(existing.size);
  const existingMargin = Number(existing.margin);
  const entryPrice = Number(existing.entry_price);
  const closeQty = Math.min(q, existingSize);
  const marginReleased = existingSize > 0 ? (existingMargin * closeQty) / existingSize : 0;
  const realizedPnl = (price - entryPrice) * closeQty;
  const remaining = existingSize - closeQty;
  const isClose = remaining <= 0.000001;
  await supabase
    .from("positions")
    .update(
      isClose
        ? {
            status: "Closed",
            mark_price: price,
            pnl: (Number(existing.pnl) || 0) + realizedPnl,
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            size: remaining,
            margin: existingMargin - marginReleased,
            mark_price: price,
            pnl: (Number(existing.pnl) || 0) + realizedPnl,
            updated_at: new Date().toISOString(),
          },
    )
    .eq("id", existing.id);
  await supabase
    .from("trades")
    .update({ status: "Filled", closed_at: new Date().toISOString() })
    .eq("id", trade.id);
  return { balanceDelta: price * closeQty, intent: (isClose ? "close" : "reduce") as "close" | "reduce" };
};


