// ============================================================
// TABLE trade service — leveraged ("Boost") orders on quick-round spot events.
//
// Why a separate file: `executeSpotTrade` is 1× by construction (margin ==
// notional, leverage hard-coded 1). The Table lets a chip carry a Boost, so a
// $50 chip × 2 buys $100 of shares while only $50 leaves the wallet.
//
// Position row semantics (product_line stays 'spot' so the quick-round roll
// job settles it):
//   size      = shares bought           (notional − fee) / price
//   margin    = cash the user put in    (chip value)
//   leverage  = boost
//   entry     = weighted option price
// Settlement (roll_crypto_quick_rounds, after the Table migration):
//   win  → proceeds = margin + size × (1 − entry)   (1×: == size, unchanged)
//   lose → proceeds = 0, pnl = −margin
// DEMO-STATE: no mid-round liquidation. On the real engine a boosted leg is
// liquidated when the mark falls to entry × (1 − 1/boost); here it just rides
// to settlement. Documented in lite-table-spec-v1.
// ============================================================
import { supabase } from "@/integrations/supabase/client";
import { SPOT_FEE_RATE, WINNING_COMMISSION_RATE } from "@/services/tradingService";

const round2 = (n: number) => Math.round(n * 100) / 100;

const recordTx = (
  type: "fee" | "trade_profit" | "trade_loss" | "winning_commission",
  amount: number,
  description: string,
) => {
  void supabase.functions
    .invoke("record-transaction", {
      body: { type, amount, account: "spot", status: "completed", description },
    })
    .catch(() => {});
};

export interface TableOrderQuote {
  margin: number;
  boost: number;
  notional: number;
  fee: number;
  shares: number;
  /** Cash credited if this side wins: margin + shares × (1 − price). */
  payout: number;
  /** Profit if this side wins: shares × (1 − price). */
  profit: number;
}

/** Pure quote — the tray, the UP/DOWN zone copy and the toast all read this. */
export const quoteTableOrder = (margin: number, boost: number, price: number): TableOrderQuote => {
  const notional = margin * boost;
  const fee = round2(notional * SPOT_FEE_RATE);
  const shares = price > 0 ? Math.floor((notional - fee) / price) : 0;
  const profit = round2(shares * (1 - price));
  return { margin, boost, notional, fee, shares, payout: round2(margin + profit), profit };
};

export interface PlaceTableOrderInput {
  eventName: string;
  optionLabel: string;
  optionId: string;
  price: number;
  margin: number;
  boost: number;
}

export interface PlaceTableOrderResult {
  position: any;
  intent: "open" | "add";
  /** Negative: cash to deduct from the spot balance (= the chip / margin). */
  balanceDelta: number;
  quote: TableOrderQuote;
}

const fetchSameSide = async (userId: string, eventName: string, optionId: string) => {
  const { data } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("event_name", eventName)
    .eq("product_line", "spot")
    .eq("status", "Open")
    .eq("option_id", optionId)
    .order("created_at", { ascending: true })
    .limit(1);
  return data?.[0] ?? null;
};

/**
 * Buy with a chip. One side per round is enforced by the page (the opposite
 * side is locked in the UI); here we only merge into the same side.
 */
export const placeTableOrder = async (
  userId: string,
  input: PlaceTableOrderInput,
): Promise<PlaceTableOrderResult> => {
  if (!(input.margin > 0)) throw new Error("Chip value must be positive");
  if (!(input.price > 0 && input.price < 1)) throw new Error("Market data unavailable");
  const boost = Math.max(1, Math.min(10, Math.round(input.boost)));
  const quote = quoteTableOrder(input.margin, boost, input.price);
  if (quote.shares <= 0) throw new Error("Chip too small for this price");

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      user_id: userId,
      event_name: input.eventName,
      option_label: input.optionLabel,
      side: "buy",
      order_type: "Market",
      price: input.price,
      amount: quote.notional,
      quantity: quote.shares,
      leverage: boost,
      margin: input.margin,
      fee: quote.fee,
      status: "Filled",
      product_line: "spot",
    })
    .select()
    .single();
  if (tradeError) throw tradeError;

  const same = await fetchSameSide(userId, input.eventName, input.optionId);
  let position: any;
  let intent: "open" | "add";
  if (same) {
    const oldSize = Number(same.size);
    const oldEntry = Number(same.entry_price);
    const newSize = oldSize + quote.shares;
    const newMargin = Number(same.margin) + input.margin;
    const weightedEntry = (oldSize * oldEntry + quote.shares * input.price) / newSize;
    // Effective leverage of the merged leg = notional / margin.
    const newLeverage = Math.max(1, round2((newSize * weightedEntry) / newMargin));
    const { data: updated, error } = await supabase
      .from("positions")
      .update({
        size: newSize,
        margin: newMargin,
        entry_price: weightedEntry,
        mark_price: input.price,
        leverage: newLeverage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", same.id)
      .select()
      .single();
    if (error) throw error;
    position = updated;
    intent = "add";
  } else {
    const { data: created, error } = await supabase
      .from("positions")
      .insert({
        user_id: userId,
        trade_id: trade.id,
        event_name: input.eventName,
        option_label: input.optionLabel,
        option_id: input.optionId,
        side: "long",
        entry_price: input.price,
        mark_price: input.price,
        size: quote.shares,
        margin: input.margin,
        leverage: boost,
        pnl: 0,
        pnl_percent: 0,
        status: "Open",
        product_line: "spot",
      })
      .select()
      .single();
    if (error) throw error;
    position = created;
    intent = "open";
  }

  if (quote.fee > 0) recordTx("fee", -quote.fee, `Trading fee · ${input.optionLabel} · ${input.eventName}`);
  // The chip is the whole cash leg: fee is paid out of the notional (same as
  // the Lite spot panel, where qty is derived from amount − fee).
  return { position, intent, balanceDelta: round2(-input.margin), quote };
};

export interface CashOutTableInput {
  positionId: string;
  eventName: string;
  optionLabel: string;
  /** Current option price (mark). */
  price: number;
  /** Shares to close (≤ size). */
  quantity: number;
}

/**
 * Cash out a boosted leg: release the margin slice plus the realised PnL on
 * the closed shares, minus the V4 winning commission on positive PnL.
 */
export const cashOutTable = async (userId: string, input: CashOutTableInput) => {
  const { data: pos, error } = await supabase
    .from("positions")
    .select("*")
    .eq("id", input.positionId)
    .eq("user_id", userId)
    .single();
  if (error || !pos) throw new Error("Position not found");
  const size = Number(pos.size);
  const qty = Math.min(size, Math.max(0, input.quantity));
  if (qty <= 0) throw new Error("Nothing to cash out");
  const fraction = qty / size;
  const entry = Number(pos.entry_price);
  const margin = Number(pos.margin);
  const marginReleased = round2(margin * fraction);
  const realizedPnl = round2((input.price - entry) * qty);
  const wc = realizedPnl > 0 ? round2(realizedPnl * WINNING_COMMISSION_RATE) : 0;
  const isClose = qty >= size - 0.000001;

  await supabase.from("trades").insert({
    user_id: userId,
    event_name: input.eventName,
    option_label: input.optionLabel,
    side: "sell",
    order_type: "Market",
    price: input.price,
    amount: input.price * qty,
    quantity: qty,
    leverage: Number(pos.leverage) || 1,
    margin: marginReleased,
    fee: 0,
    status: "Filled",
    product_line: "spot",
  });

  const { data: updated, error: upErr } = await supabase
    .from("positions")
    .update(
      isClose
        ? {
            status: "Closed",
            size: 0,
            margin: 0,
            mark_price: input.price,
            pnl: (Number(pos.pnl) || 0) + realizedPnl,
            winning_commission: (Number(pos.winning_commission) || 0) + wc,
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            size: size - qty,
            margin: margin - marginReleased,
            mark_price: input.price,
            pnl: (Number(pos.pnl) || 0) + realizedPnl,
            winning_commission: (Number(pos.winning_commission) || 0) + wc,
            updated_at: new Date().toISOString(),
          },
    )
    .eq("id", pos.id)
    .select()
    .single();
  if (upErr) throw upErr;

  recordTx(
    realizedPnl >= 0 ? "trade_profit" : "trade_loss",
    realizedPnl,
    `Cashed out: ${input.eventName} · ${input.optionLabel} · ${realizedPnl >= 0 ? "Won" : "Lost"}`,
  );
  if (wc > 0) recordTx("winning_commission", -wc, `Winning commission · 5% · ${input.optionLabel} · ${input.eventName}`);

  return {
    position: updated,
    intent: isClose ? ("close" as const) : ("reduce" as const),
    /** Cash that lands back in the wallet. */
    balanceDelta: round2(marginReleased + realizedPnl - wc),
    realizedPnl,
    winningCommission: wc,
  };
};
