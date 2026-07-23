import { useEffect, useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

interface OrderBookEntry {
  price: string;
  amount: string;
  total?: string;
}

interface OrderBookProps {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  currentPrice: string;
  compact?: boolean;
}

// Track which rows have changed for flash animation
interface PriceFlash {
  [key: string]: boolean;
}

// Parse amount string to number for comparison
const parseAmount = (amount: string): number => {
  return parseInt(amount.replace(/,/g, ""), 10) || 0;
};

export const OrderBook = ({ asks, bids, currentPrice, compact = false }: OrderBookProps) => {
  const [visibleAsks, setVisibleAsks] = useState<OrderBookEntry[]>([]);
  const [visibleBids, setVisibleBids] = useState<OrderBookEntry[]>([]);
  const [priceFlash, setPriceFlash] = useState<PriceFlash>({});
  const [priceChange, setPriceChange] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<string>(currentPrice);
  const prevAsksRef = useRef<OrderBookEntry[]>([]);
  const prevBidsRef = useRef<OrderBookEntry[]>([]);
  const isInitialMount = useRef(true);

  // Calculate max amounts for depth bar scaling
  const { maxAskAmount, maxBidAmount } = useMemo(() => {
    const askAmounts = asks.map(a => parseAmount(a.total || a.amount));
    const bidAmounts = bids.map(b => parseAmount(b.total || b.amount));
    return {
      maxAskAmount: Math.max(...askAmounts, 1),
      maxBidAmount: Math.max(...bidAmounts, 1),
    };
  }, [asks, bids]);

  // Animate entries on mount and data change
  useEffect(() => {
    if (isInitialMount.current) {
      // Staggered entry animation on initial mount
      const animateEntries = async () => {
        // Animate asks from bottom to top (closest to price first)
        for (let i = asks.length - 1; i >= 0; i--) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setVisibleAsks(prev => [asks[i], ...prev]);
        }
        // Animate bids from top to bottom (closest to price first)
        for (let i = 0; i < bids.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setVisibleBids(prev => [...prev, bids[i]]);
        }
      };
      animateEntries();
      isInitialMount.current = false;
    } else {
      // On subsequent updates, just update directly
      setVisibleAsks(asks);
      setVisibleBids(bids);
      
      // Detect price changes and trigger flash (just mark as changed, color based on type)
      const newFlashes: PriceFlash = {};
      
      asks.forEach((ask, idx) => {
        const prevAsk = prevAsksRef.current[idx];
        if (prevAsk && prevAsk.amount !== ask.amount) {
          newFlashes[`ask-${idx}`] = true;
        }
      });
      
      bids.forEach((bid, idx) => {
        const prevBid = prevBidsRef.current[idx];
        if (prevBid && prevBid.amount !== bid.amount) {
          newFlashes[`bid-${idx}`] = true;
        }
      });
      
      if (Object.keys(newFlashes).length > 0) {
        setPriceFlash(newFlashes);
        setTimeout(() => setPriceFlash({}), 300);
      }
    }
    
    prevAsksRef.current = asks;
    prevBidsRef.current = bids;
  }, [asks, bids]);

  // Detect current price changes
  useEffect(() => {
    if (prevPriceRef.current !== currentPrice) {
      const prevPrice = parseFloat(prevPriceRef.current.replace(/[$,]/g, ""));
      const newPrice = parseFloat(currentPrice.replace(/[$,]/g, ""));
      setPriceChange(newPrice > prevPrice ? "up" : "down");
      prevPriceRef.current = currentPrice;
      
      setTimeout(() => setPriceChange(null), 500);
    }
  }, [currentPrice]);

  // Calculate depth percentage for a given entry
  const getDepthPercent = (entry: OrderBookEntry, maxAmount: number): number => {
    const amount = parseAmount(entry.total || entry.amount);
    return Math.min((amount / maxAmount) * 100, 100);
  };

  return (
    <div className="w-full">
      {!compact && (
        <div className="grid grid-cols-3 text-xs text-muted-foreground px-4 py-2">
          <span>Price (USDT)</span>
          <span className="text-center">Amount</span>
          <span className="text-right">Total</span>
        </div>
      )}

      {/* Asks (Sell orders) - always flash red */}
      <div className={`${compact ? "max-h-[200px]" : ""} overflow-y-auto scrollbar-hide`}>
        {visibleAsks.map((ask, index) => {
          const isFlashing = priceFlash[`ask-${index}`];
          const depthPercent = getDepthPercent(ask, maxAskAmount);
          return (
            <div
              key={`ask-${index}`}
              className={cn(
                "grid grid-cols-3 text-xs px-4 py-1.5 transition-all duration-200 relative",
                "animate-fade-in",
                isFlashing && "bg-trading-red/30"
              )}
              style={{
                animationDelay: isInitialMount.current ? `${(asks.length - 1 - index) * 30}ms` : "0ms",
              }}
            >
              {/* Depth bar - grows from right to left for asks */}
              <div 
                className="absolute inset-y-0 right-0 bg-trading-red/15 transition-all duration-300 ease-out"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="price-red font-mono relative z-10">{ask.price}</span>
              <span className={cn(
                "text-center text-muted-foreground font-mono transition-colors duration-200 relative z-10",
                isFlashing && "text-trading-red"
              )}>
                {ask.amount}
              </span>
              <span className="text-right text-muted-foreground font-mono relative z-10">{ask.total || ask.amount}</span>
            </div>
          );
        })}
      </div>

      {/* Current Price */}
      <div className="px-4 py-3">
        <div className="text-center relative">
          <span 
            className={cn(
              "text-xl font-bold font-mono transition-all duration-300",
              priceChange === "up" && "text-trading-green animate-pulse",
              priceChange === "down" && "text-trading-red animate-pulse",
              !priceChange && "text-foreground"
            )}
          >
            ${currentPrice}
          </span>
          <div className="text-xs text-muted-foreground mt-0.5">Current Price</div>
        </div>
      </div>

      {/* Bids (Buy orders) - always flash green */}
      <div className={`${compact ? "max-h-[200px]" : ""} overflow-y-auto scrollbar-hide`}>
        {visibleBids.map((bid, index) => {
          const isFlashing = priceFlash[`bid-${index}`];
          const depthPercent = getDepthPercent(bid, maxBidAmount);
          return (
            <div
              key={`bid-${index}`}
              className={cn(
                "grid grid-cols-3 text-xs px-4 py-1.5 transition-all duration-200 relative",
                "animate-fade-in",
                isFlashing && "bg-trading-green/30"
              )}
              style={{
                animationDelay: isInitialMount.current ? `${index * 30}ms` : "0ms",
              }}
            >
              {/* Depth bar - grows from right to left for bids */}
              <div 
                className="absolute inset-y-0 right-0 bg-trading-green/15 transition-all duration-300 ease-out"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="price-green font-mono relative z-10">{bid.price}</span>
              <span className={cn(
                "text-center text-muted-foreground font-mono transition-colors duration-200 relative z-10",
                isFlashing && "text-trading-green"
              )}>
                {bid.amount}
              </span>
              <span className="text-right text-muted-foreground font-mono relative z-10">{bid.total || bid.amount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
