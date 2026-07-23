import { useState, useEffect, useCallback, useRef } from "react";

interface Trade {
  price: string;
  amount: string;
  time: string;
  isBuy: boolean;
}

interface UseAnimatedTradesHistoryOptions {
  basePrice: number;
  initialCount?: number;
  maxTrades?: number;
  newTradeInterval?: number; // ms between new trades
}

// Generate a single trade
const generateTrade = (basePrice: number): Trade => {
  const isBuy = Math.random() > 0.5;
  const priceVariation = (Math.random() - 0.5) * 0.01;
  const price = (basePrice + priceVariation).toFixed(4);
  const amount = Math.floor(Math.random() * 5000 + 100).toLocaleString();
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  return { price, amount, time, isBuy };
};

// Generate initial trades
const generateInitialTrades = (basePrice: number, count: number): Trade[] => {
  const trades: Trade[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.5;
    const priceVariation = (Math.random() - 0.5) * 0.01;
    const price = (basePrice + priceVariation).toFixed(4);
    const amount = Math.floor(Math.random() * 5000 + 100).toLocaleString();
    const timeAgo = i * 3; // Each trade is ~3 seconds apart
    const tradeTime = new Date(now - timeAgo * 1000);
    const time = tradeTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    trades.push({ price, amount, time, isBuy });
  }
  
  return trades;
};

export const useAnimatedTradesHistory = ({
  basePrice,
  initialCount = 20,
  maxTrades = 50,
  newTradeInterval = 1500,
}: UseAnimatedTradesHistoryOptions) => {
  const [trades, setTrades] = useState<Trade[]>(() => 
    generateInitialTrades(basePrice, initialCount)
  );
  const [newTradeIndex, setNewTradeIndex] = useState<number | null>(null);
  const basePriceRef = useRef(basePrice);

  // Regenerate when base price changes significantly
  useEffect(() => {
    if (Math.abs(basePriceRef.current - basePrice) > 0.001) {
      setTrades(generateInitialTrades(basePrice, initialCount));
      basePriceRef.current = basePrice;
    }
  }, [basePrice, initialCount]);

  // Add new trades periodically
  const addNewTrade = useCallback(() => {
    const newTrade = generateTrade(basePrice);
    
    setTrades(prev => {
      const updated = [newTrade, ...prev];
      // Keep only maxTrades
      return updated.slice(0, maxTrades);
    });
    
    // Trigger flash animation for new trade
    setNewTradeIndex(0);
    setTimeout(() => setNewTradeIndex(null), 400);
  }, [basePrice, maxTrades]);

  // Set up interval for new trades
  useEffect(() => {
    // Random interval variation to feel more natural
    const getRandomInterval = () => 
      newTradeInterval + (Math.random() - 0.5) * newTradeInterval * 0.6;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const scheduleNextTrade = () => {
      timeoutId = setTimeout(() => {
        addNewTrade();
        scheduleNextTrade();
      }, getRandomInterval());
    };
    
    scheduleNextTrade();
    
    return () => clearTimeout(timeoutId);
  }, [addNewTrade, newTradeInterval]);

  return { trades, newTradeIndex };
};

export default useAnimatedTradesHistory;
