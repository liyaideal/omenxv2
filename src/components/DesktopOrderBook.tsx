import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Flag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LP_QUOTE_MODE_BADGE } from "@/lib/usStockSessions";

interface OrderBookEntry {
  price: string;
  amount: string;
  total?: string;
  isNew?: boolean;
  isUpdated?: boolean;
}

interface RecentTrade {
  price: string;
  amount: string;
  time: string;
  side: "buy" | "sell";
  isNew?: boolean;
}

interface DesktopOrderBookProps {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  currentPrice: string;
  priceChange?: string;
  isPositive?: boolean;
  onPriceClick?: (price: string) => void;
  side?: "buy" | "sell";
  /**
   * 'futures' (default) preserves the perpetual-contract wording used by /trade.
   * 'spot' swaps the copy for outcome-share semantics used by /spot — no
   * index price / funding / liquidation references leak into the spot terminal.
   */
  variant?: "futures" | "spot";
  /**
   * Optional LP quote-mode badge shown in the order-book header. Values mirror
   * the `lp_quote_mode` enum: NORMAL / CONSERVATIVE / HEDGE_ONLY / CANCEL_ONLY.
   * When omitted, no badge renders.
   */
  quoteMode?: "NORMAL" | "CONSERVATIVE" | "HEDGE_ONLY" | "CANCEL_ONLY";
}

const MID_TOOLTIP_COPY = {
  futures:
    "Mark price is derived by index price and funding rate, and reflects the fair market price. Liquidation is triggered by mark price.",
  spot: "Mid price of the outcome share order book. Shares settle at $1 (win) or $0 (lose).",
} as const;

const COLUMN_HEADERS = {
  futures: { price: "Price(USDT)", qty: "Qty(BTC)", total: "Total(BTC)" },
  spot: { price: "Price(USD)", qty: "Qty(sh)", total: "Total(sh)" },
} as const;

// Generate mock recent trades
const generateMockTrades = (basePrice: number): RecentTrade[] => {
  const trades: RecentTrade[] = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const price = (basePrice + (Math.random() - 0.5) * 0.01).toFixed(4);
    const amount = (Math.random() * 5000 + 100).toFixed(0);
    const time = new Date(now.getTime() - i * 15000);
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    
    trades.push({
      price,
      amount: parseInt(amount).toLocaleString(),
      time: timeStr,
      side: Math.random() > 0.5 ? "buy" : "sell"
    });
  }
  
  return trades;
};

// Simulate order book updates
const simulateOrderBookUpdate = (entries: OrderBookEntry[], isBid: boolean): OrderBookEntry[] => {
  return entries.map((entry, index) => {
    // Randomly update some entries
    if (Math.random() < 0.3) {
      const currentAmount = parseInt(entry.amount.replace(/,/g, ''));
      const change = Math.floor((Math.random() - 0.4) * 5000);
      const newAmount = Math.max(100, currentAmount + change);
      
      return {
        ...entry,
        amount: newAmount.toLocaleString(),
        isUpdated: true,
        isNew: false
      };
    }
    return { ...entry, isUpdated: false, isNew: false };
  });
};

// Recalculate totals for order book
const recalculateTotals = (entries: OrderBookEntry[]): OrderBookEntry[] => {
  let cumulative = 0;
  return entries.map(entry => {
    cumulative += parseInt(entry.amount.replace(/,/g, ''));
    return { ...entry, total: cumulative.toLocaleString() };
  });
};

// Aggregate orders by price step
const aggregateByPriceStep = (
  entries: OrderBookEntry[], 
  step: number, 
  isBid: boolean
): OrderBookEntry[] => {
  const aggregated: Map<string, number> = new Map();
  
  entries.forEach(entry => {
    const price = parseFloat(entry.price);
    const amount = parseInt(entry.amount.replace(/,/g, ''));
    
    // Round price to step - bids round down, asks round up
    const roundedPrice = isBid 
      ? Math.floor(price / step) * step 
      : Math.ceil(price / step) * step;
    
    // Determine decimal places based on step
    const decimals = step < 1 ? Math.abs(Math.floor(Math.log10(step))) : 0;
    const priceKey = roundedPrice.toFixed(decimals);
    
    aggregated.set(priceKey, (aggregated.get(priceKey) || 0) + amount);
  });
  
  // Convert back to OrderBookEntry array
  const result: OrderBookEntry[] = Array.from(aggregated.entries())
    .map(([price, amount]) => ({
      price,
      amount: amount.toLocaleString(),
      isUpdated: entries.some(e => {
        const p = parseFloat(e.price);
        const step_val = step;
        const rounded = isBid 
          ? Math.floor(p / step_val) * step_val 
          : Math.ceil(p / step_val) * step_val;
        const decimals = step < 1 ? Math.abs(Math.floor(Math.log10(step))) : 0;
        return rounded.toFixed(decimals) === price && e.isUpdated;
      })
    }))
    .sort((a, b) => isBid 
      ? parseFloat(b.price) - parseFloat(a.price) 
      : parseFloat(a.price) - parseFloat(b.price)
    );
  
  return recalculateTotals(result);
};

export const DesktopOrderBook = ({ 
  asks: initialAsks, 
  bids: initialBids, 
  currentPrice: initialPrice, 
  priceChange = "88,132.18",
  isPositive: initialIsPositive = false,
  onPriceClick,
  side = "buy",
  variant = "futures",
  quoteMode,
}: DesktopOrderBookProps) => {
  const midTooltip = MID_TOOLTIP_COPY[variant];
  const headers = COLUMN_HEADERS[variant];
  const quoteModeBadge = quoteMode ? LP_QUOTE_MODE_BADGE[quoteMode] : null;
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">("orderbook");
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");
  const bookSide = side;
  const [priceStep, setPriceStep] = useState(variant === "spot" ? "0.01" : "0.0001");
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  const [asks, setAsks] = useState<OrderBookEntry[]>(initialAsks);
  const [bids, setBids] = useState<OrderBookEntry[]>(initialBids);
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [isPositive, setIsPositive] = useState(initialIsPositive);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(() => 
    generateMockTrades(parseFloat(initialPrice))
  );
  const [buyRatio, setBuyRatio] = useState(40);
  
  const priceStepOptions =
    variant === "spot" ? ["0.01", "0.02", "0.05"] : ["0.0001", "0.001", "0.01", "0.1", "1"];

  // Transform price by side: sell side shows 1 - price (asymmetric pricing)
  const transformPrice = useCallback((price: string): string => {
    if (bookSide === "buy") return price;
    const decimals = (price.split(".")[1] || "").length || 4;
    return Math.max(0, 1 - parseFloat(price)).toFixed(decimals);
  }, [bookSide]);

  // For sell side, swap the role of asks/bids so the lower red prices stay on top:
  // sell-side "asks" come from original bids (transformed), and vice versa.
  const sourceAsks = bookSide === "buy" ? asks : bids;
  const sourceBids = bookSide === "buy" ? bids : asks;

  // Aggregate asks and bids based on selected price step (using transformed prices)
  const aggregatedAsks = aggregateByPriceStep(
    sourceAsks.map(a => ({ ...a, price: transformPrice(a.price) })),
    parseFloat(priceStep),
    false
  );
  const aggregatedBids = aggregateByPriceStep(
    sourceBids.map(b => ({ ...b, price: transformPrice(b.price) })),
    parseFloat(priceStep),
    true
  );

  // Mid/last price displayed in the middle of the book, also transformed
  const displayPrice = transformPrice(currentPrice);

  // Extended data for single-view modes (moved here to use aggregated data)
  const extendedBidsAggregated = [...aggregatedBids, ...aggregatedBids.slice(0, 8)];
  const extendedAsksAggregated = [...aggregatedAsks, ...aggregatedAsks.slice(0, 8)];

  // Update order book dynamically
  const updateOrderBook = useCallback(() => {
    // Update asks
    setAsks(prev => {
      const updated = simulateOrderBookUpdate(prev, false);
      return recalculateTotals(updated);
    });

    // Update bids
    setBids(prev => {
      const updated = simulateOrderBookUpdate(prev, true);
      return recalculateTotals(updated);
    });

    // Randomly adjust current price slightly
    setCurrentPrice(prev => {
      const price = parseFloat(prev);
      const change = (Math.random() - 0.5) * 0.002;
      const newPrice = (price + change).toFixed(4);
      setIsPositive(change >= 0);
      return newPrice;
    });

    // Update buy/sell ratio
    setBuyRatio(prev => {
      const change = (Math.random() - 0.5) * 5;
      return Math.min(90, Math.max(10, prev + change));
    });
  }, []);

  // Add new trades periodically
  const addNewTrade = useCallback(() => {
    setRecentTrades(prev => {
      const price = parseFloat(currentPrice);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const newTrade: RecentTrade = {
        price: (price + (Math.random() - 0.5) * 0.005).toFixed(4),
        amount: Math.floor(Math.random() * 5000 + 100).toLocaleString(),
        time: timeStr,
        side: Math.random() > 0.5 ? "buy" : "sell",
        isNew: true
      };

      const updated = [newTrade, ...prev.slice(0, 19)].map((t, i) => ({
        ...t,
        isNew: i === 0
      }));

      return updated;
    });
  }, [currentPrice]);

  // Set up intervals for dynamic updates
  useEffect(() => {
    const orderBookInterval = setInterval(updateOrderBook, 500);
    const tradesInterval = setInterval(addNewTrade, 1500);

    return () => {
      clearInterval(orderBookInterval);
      clearInterval(tradesInterval);
    };
  }, [updateOrderBook, addNewTrade]);

  // Reset when initial props change
  useEffect(() => {
    setAsks(initialAsks);
    setBids(initialBids);
    setCurrentPrice(initialPrice);
    setIsPositive(initialIsPositive);
  }, [initialAsks, initialBids, initialPrice, initialIsPositive]);


  return (
    <div className="flex flex-col h-full bg-background border-l border-border/30">
      {/* Header Tabs */}
      <div className="flex items-center px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("orderbook")}
            className={`text-sm font-medium transition-all ${
              activeTab === "orderbook" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`text-sm font-medium transition-all ${
              activeTab === "trades" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Recent Trades
          </button>
        </div>
        {quoteModeBadge && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`ml-auto px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded border cursor-help ${quoteModeBadge.className}`}
                >
                  {quoteModeBadge.label}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] p-2">
                <p className="text-xs">{quoteModeBadge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {activeTab === "orderbook" ? (
        <>
          {/* Buy/Sell side is driven by parent trade form */}

          {/* View Toggle & Depth */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              {/* View mode icons */}
              <button 
                onClick={() => setViewMode("both")}
                className={`w-5 h-5 flex items-center justify-center ${viewMode === "both" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-3 h-0.5 bg-trading-red" />
                  <div className="w-3 h-0.5 bg-trading-red" />
                  <div className="w-3 h-0.5 bg-trading-green" />
                  <div className="w-3 h-0.5 bg-trading-green" />
                </div>
              </button>
              <button 
                onClick={() => setViewMode("bids")}
                className={`w-5 h-5 flex items-center justify-center ${viewMode === "bids" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-3 h-0.5 bg-trading-green" />
                  <div className="w-3 h-0.5 bg-trading-green" />
                  <div className="w-3 h-0.5 bg-trading-green" />
                </div>
              </button>
              <button 
                onClick={() => setViewMode("asks")}
                className={`w-5 h-5 flex items-center justify-center ${viewMode === "asks" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-3 h-0.5 bg-trading-red" />
                  <div className="w-3 h-0.5 bg-trading-red" />
                  <div className="w-3 h-0.5 bg-trading-red" />
                </div>
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowStepDropdown(!showStepDropdown)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                {priceStep}
                <ChevronDown className={`w-3 h-3 transition-transform ${showStepDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showStepDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded shadow-lg z-50 py-1 min-w-[60px]">
                  {priceStepOptions.map((step) => (
                    <button
                      key={step}
                      onClick={() => {
                        setPriceStep(step);
                        setShowStepDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors ${
                        priceStep === step ? 'text-primary bg-muted/50' : 'text-foreground'
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground px-3 py-1">
            <span>{headers.price}</span>
            <span className="text-right">{headers.qty}</span>
            <span className="text-right">{headers.total}</span>
          </div>

          {viewMode === "both" && (
            <>
              {/* Asks (Sell orders) - reversed to show lowest ask at bottom */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {[...aggregatedAsks].reverse().map((ask, index) => {
                  const maxTotal = Math.max(...aggregatedAsks.map(a => parseInt((a.total || a.amount).replace(/,/g, ''))));
                  const total = parseInt((ask.total || ask.amount).replace(/,/g, ''));
                  const widthPercent = (total / maxTotal) * 100;
                  
                  return (
                    <div
                      key={`ask-${ask.price}-${index}`}
                      onClick={() => onPriceClick?.(ask.price)}
                      className={`relative grid grid-cols-3 text-xs px-3 py-0.5 hover:bg-muted/30 cursor-pointer transition-all ${ask.isUpdated ? 'flash-update-red' : ''}`}
                    >
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-trading-red/10"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <span className="relative price-red">{ask.price}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{ask.amount}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{ask.total || ask.amount}</span>
                    </div>
                  );
                })}
              </div>

              {/* Current Price */}
              <div className="px-3 py-2 border-y border-border/30">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`text-lg font-bold font-mono cursor-help ${isPositive ? 'text-trading-green' : 'text-trading-red'}`}>
                          {isPositive ? '↑' : '↓'} {displayPrice}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] p-3">
                        <p className="text-sm">{midTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {variant !== "spot" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-trading-yellow font-mono flex items-center gap-1 cursor-help border-b border-dashed border-trading-yellow">
                            <Flag className="w-3 h-3" /> {displayPrice}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] p-3">
                          <p className="text-sm">{midTooltip}</p>
                          <p className="text-sm text-trading-yellow mt-2 cursor-pointer">Click here for details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>


              {/* Bids (Buy orders) */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {aggregatedBids.map((bid, index) => {
                  const maxTotal = Math.max(...aggregatedBids.map(b => parseInt((b.total || b.amount).replace(/,/g, ''))));
                  const total = parseInt((bid.total || bid.amount).replace(/,/g, ''));
                  const widthPercent = (total / maxTotal) * 100;
                  
                  return (
                    <div
                      key={`bid-${bid.price}-${index}`}
                      onClick={() => onPriceClick?.(bid.price)}
                      className={`relative grid grid-cols-3 text-xs px-3 py-0.5 hover:bg-muted/30 cursor-pointer transition-all ${bid.isUpdated ? 'flash-update-green' : ''}`}
                    >
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-trading-green/10"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <span className="relative price-green">{bid.price}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{bid.amount}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{bid.total || bid.amount}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === "bids" && (
            <>
              {/* Bids Only View */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {extendedBidsAggregated.map((bid, index) => {
                  const maxTotal = Math.max(...extendedBidsAggregated.map(b => parseInt((b.total || b.amount).replace(/,/g, ''))));
                  const total = parseInt((bid.total || bid.amount).replace(/,/g, ''));
                  const widthPercent = (total / maxTotal) * 100;
                  
                  return (
                    <div
                      key={`bid-${index}`}
                      onClick={() => onPriceClick?.(bid.price)}
                      className="relative grid grid-cols-3 text-xs px-3 py-0.5 hover:bg-muted/30 cursor-pointer"
                    >
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-trading-green/10"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <span className="relative price-green">{bid.price}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{bid.amount}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{bid.total || bid.amount}</span>
                    </div>
                  );
                })}
              </div>

              {/* Current Price */}
              <div className="px-3 py-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-lg font-bold font-mono text-trading-green cursor-help">
                          ↑ {displayPrice}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] p-3">
                        <p className="text-sm">{midTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {variant !== "spot" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-trading-yellow font-mono flex items-center gap-1 cursor-help border-b border-dashed border-trading-yellow">
                            <Flag className="w-3 h-3" /> {displayPrice}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] p-3">
                          <p className="text-sm">{midTooltip}</p>
                          <p className="text-sm text-trading-yellow mt-2 cursor-pointer">Click here for details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

            </>
          )}

          {viewMode === "asks" && (
            <>
              {/* Asks Only View */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {extendedAsksAggregated.map((ask, index) => {
                  const maxTotal = Math.max(...extendedAsksAggregated.map(a => parseInt((a.total || a.amount).replace(/,/g, ''))));
                  const total = parseInt((ask.total || ask.amount).replace(/,/g, ''));
                  const widthPercent = (total / maxTotal) * 100;
                  
                  return (
                    <div
                      key={`ask-${index}`}
                      onClick={() => onPriceClick?.(ask.price)}
                      className="relative grid grid-cols-3 text-xs px-3 py-0.5 hover:bg-muted/30 cursor-pointer"
                    >
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-trading-red/10"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <span className="relative price-red">{ask.price}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{ask.amount}</span>
                      <span className="relative text-right text-muted-foreground font-mono">{ask.total || ask.amount}</span>
                    </div>
                  );
                })}
              </div>

              {/* Current Price */}
              <div className="px-3 py-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-lg font-bold font-mono text-trading-red cursor-help">
                          ↓ {displayPrice}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] p-3">
                        <p className="text-sm">{midTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {variant !== "spot" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-trading-yellow font-mono flex items-center gap-1 cursor-help border-b border-dashed border-trading-yellow">
                            <Flag className="w-3 h-3" /> {displayPrice}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] p-3">
                          <p className="text-sm">{midTooltip}</p>
                          <p className="text-sm text-trading-yellow mt-2 cursor-pointer">Click here for details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Yes/No Ratio */}
          <div className="px-3 py-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs px-1 border border-trading-green text-trading-green">Y</span>
                <span className="text-xs text-trading-green font-medium transition-all duration-300">{Math.round(buyRatio)}%</span>
              </div>
              <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden flex">
                <div className="bg-trading-green transition-all duration-300" style={{ width: `${buyRatio}%` }} />
                <div className="bg-trading-red transition-all duration-300" style={{ width: `${100 - buyRatio}%` }} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-trading-red font-medium transition-all duration-300">{Math.round(100 - buyRatio)}%</span>
                <span className="text-xs px-1 border border-trading-red text-trading-red">N</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Recent Trades Column Headers */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground px-3 py-2">
            <span>{headers.price}</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Time</span>
          </div>

          {/* Recent Trades List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {recentTrades.map((trade, index) => (
              <div
                key={`trade-${trade.time}-${index}`}
                className={`grid grid-cols-3 text-xs px-3 py-1 hover:bg-muted/30 cursor-pointer transition-all duration-300 ${
                  trade.isNew 
                    ? trade.side === "buy" 
                      ? "bg-trading-green/25 animate-fade-in" 
                      : "bg-trading-red/25 animate-fade-in"
                    : ""
                }`}
              >
                <span className={`font-mono transition-all duration-200 ${
                  trade.side === "buy" ? "text-trading-green" : "text-trading-red"
                } ${trade.isNew ? "font-semibold" : ""}`}>
                  {transformPrice(trade.price)}
                </span>
                <span className={`text-right font-mono transition-all duration-200 ${
                  trade.isNew ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {trade.amount}
                </span>
                <span className={`text-right font-mono transition-all duration-200 ${
                  trade.isNew ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {trade.time}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
