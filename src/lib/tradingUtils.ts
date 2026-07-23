export interface OrderBookEntry {
  price: string;
  amount: string;
  total?: string;
}

export interface OrderBookData {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

// Generate order book data based on base price
export const generateOrderBookData = (basePrice: number, depth: number = 8): OrderBookData => {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  
  for (let i = 0; i < depth; i++) {
    const askPrice = (basePrice + 0.001 * (i + 1)).toFixed(4);
    const bidPrice = (basePrice - 0.001 * (i + 1)).toFixed(4);
    const amount = Math.floor(Math.random() * 5000 + 500).toLocaleString();
    const total = Math.floor(Math.random() * 3000 + 300).toLocaleString();
    
    asks.push({ price: askPrice, amount, total });
    bids.push({ price: bidPrice, amount, total });
  }
  
  return { asks, bids };
};

// Generate trades history data based on base price
export const generateTradesHistory = (basePrice: number, count: number = 20) => {
  const trades = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.5;
    const priceVariation = (Math.random() - 0.5) * 0.01;
    const price = (basePrice + priceVariation).toFixed(4);
    const amount = Math.floor(Math.random() * 5000 + 100).toLocaleString();
    const timeAgo = Math.floor(Math.random() * 300);
    
    trades.push({
      price,
      amount,
      time: new Date(now - timeAgo * 1000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      isBuy,
    });
  }
  
  return trades;
};

// Stats data (can be dynamic later)
export const tradingStats = [
  { label: "24h Volume", value: "$2.45M" },
  { label: "Funding Rate", value: "+0.05%", isPositive: true },
];

/**
 * Estimated liquidation price for a binary (0–1) prediction market position.
 *
 * Uses the same simplified formula as the order-preview path:
 *   long  → entry × (1 − 0.9 / leverage)
 *   short → entry × (1 + 0.9 / leverage)
 * Result is clamped to [0, 1]. Ignores funding drift and MM buffer — for the
 * canonical account-level liquidation threshold see `useRealtimeRiskMetrics`.
 *
 * Accepts numbers or formatted strings ("$0.3200", "10x", "long"/"short").
 * Returns a 4-decimal `$0.xxxx` string or `"--"` when inputs are unparseable.
 */
export const calcLiqPrice = (
  entry: number | string,
  leverage: number | string,
  side: "long" | "short" | string,
): string => {
  const entryNum =
    typeof entry === "number" ? entry : parseFloat(String(entry).replace(/[$,]/g, ""));
  const levNum =
    typeof leverage === "number"
      ? leverage
      : parseFloat(String(leverage).replace(/[x×]/gi, ""));
  if (!isFinite(entryNum) || !isFinite(levNum) || entryNum <= 0 || levNum <= 0) {
    return "--";
  }
  const direction = side === "long" ? -1 : 1;
  const raw = entryNum * (1 + direction * (0.9 / levNum));
  const clamped = Math.max(0, Math.min(1, raw));
  return `$${clamped.toFixed(4)}`;
};
