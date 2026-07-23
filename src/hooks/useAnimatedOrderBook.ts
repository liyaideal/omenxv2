import { useState, useEffect, useCallback, useRef } from "react";
import { OrderBookEntry, OrderBookData, generateOrderBookData } from "@/lib/tradingUtils";

interface UseAnimatedOrderBookOptions {
  basePrice: number;
  depth?: number;
  updateInterval?: number; // ms between updates
  volatility?: number; // how much amounts can change (0-1)
}

export const useAnimatedOrderBook = ({
  basePrice,
  depth = 8,
  updateInterval = 800,
  volatility = 0.3,
}: UseAnimatedOrderBookOptions): OrderBookData => {
  const [orderBook, setOrderBook] = useState<OrderBookData>(() => 
    generateOrderBookData(basePrice, depth)
  );
  const basePriceRef = useRef(basePrice);

  // Regenerate when base price changes significantly
  useEffect(() => {
    if (Math.abs(basePriceRef.current - basePrice) > 0.001) {
      setOrderBook(generateOrderBookData(basePrice, depth));
      basePriceRef.current = basePrice;
    }
  }, [basePrice, depth]);

  // Animate order book entries
  const animateOrderBook = useCallback(() => {
    setOrderBook(prev => {
      const newAsks: OrderBookEntry[] = prev.asks.map((ask, idx) => {
        // Randomly decide if this entry should update
        if (Math.random() > 0.4) return ask;
        
        const currentAmount = parseInt(ask.amount.replace(/,/g, ""), 10);
        const change = Math.floor(currentAmount * volatility * (Math.random() - 0.5) * 2);
        const newAmount = Math.max(100, currentAmount + change);
        
        const currentTotal = parseInt((ask.total || ask.amount).replace(/,/g, ""), 10);
        const totalChange = Math.floor(currentTotal * volatility * (Math.random() - 0.5) * 2);
        const newTotal = Math.max(50, currentTotal + totalChange);
        
        return {
          ...ask,
          amount: newAmount.toLocaleString(),
          total: newTotal.toLocaleString(),
        };
      });

      const newBids: OrderBookEntry[] = prev.bids.map((bid, idx) => {
        // Randomly decide if this entry should update
        if (Math.random() > 0.4) return bid;
        
        const currentAmount = parseInt(bid.amount.replace(/,/g, ""), 10);
        const change = Math.floor(currentAmount * volatility * (Math.random() - 0.5) * 2);
        const newAmount = Math.max(100, currentAmount + change);
        
        const currentTotal = parseInt((bid.total || bid.amount).replace(/,/g, ""), 10);
        const totalChange = Math.floor(currentTotal * volatility * (Math.random() - 0.5) * 2);
        const newTotal = Math.max(50, currentTotal + totalChange);
        
        return {
          ...bid,
          amount: newAmount.toLocaleString(),
          total: newTotal.toLocaleString(),
        };
      });

      return { asks: newAsks, bids: newBids };
    });
  }, [volatility]);

  // Set up animation interval
  useEffect(() => {
    const intervalId = setInterval(animateOrderBook, updateInterval);
    return () => clearInterval(intervalId);
  }, [animateOrderBook, updateInterval]);

  return orderBook;
};

export default useAnimatedOrderBook;
