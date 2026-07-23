import { useState, useMemo, useEffect } from "react";
import { BarChart2 } from "lucide-react";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  remainingDays?: number; // T_remain in days
  basePrice?: number; // Base price from selected option
  side?: "buy" | "sell"; // Trade side: sell mirrors price (1 - p)
}

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D", "ALL"] as const;
type Timeframe = typeof TIMEFRAMES[number];

// Determine default timeframe based on remaining time
const getDefaultTimeframe = (remainingDays: number): Timeframe => {
  if (remainingDays <= 7) return "15m";
  if (remainingDays <= 30) return "1H";
  if (remainingDays <= 180) return "4H";
  return "1D";
};

// Generate mock candles - in production this would come from API
const generateMockCandles = (timeframe: Timeframe, basePrice: number = 0.12, count: number = 80): Candle[] => {
  const candles: Candle[] = [];
  // Start from a price slightly below the base price and trend upward to it
  let price = basePrice * (0.85 + Math.random() * 0.1);
  
  const getTimeLabel = (index: number): string => {
    if (timeframe === "ALL") {
      const date = new Date();
      date.setDate(date.getDate() - (count - index));
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    if (timeframe === "1D") {
      const date = new Date();
      date.setDate(date.getDate() - (count - index));
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    if (timeframe === "4H") {
      const hour = (index * 4) % 24;
      return `${hour.toString().padStart(2, "0")}:00`;
    }
    if (timeframe === "1H") {
      const hour = index % 24;
      return `${hour.toString().padStart(2, "0")}:00`;
    }
    if (timeframe === "15m") {
      const minute = (index * 15) % 60;
      const hour = Math.floor((index * 15) / 60) % 24;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }
    if (timeframe === "5m") {
      const minute = (index * 5) % 60;
      const hour = Math.floor((index * 5) / 60) % 24;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }
    // 1m
    const minute = index % 60;
    const hour = Math.floor(index / 60) % 24;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  // Volatility based on timeframe - relative to base price
  const volatilityPercent = timeframe === "ALL" ? 0.03 : 
                     timeframe === "1D" ? 0.025 : 
                     timeframe === "4H" ? 0.018 : 
                     timeframe === "1H" ? 0.012 : 
                     timeframe === "15m" ? 0.008 : 
                     timeframe === "5m" ? 0.006 : 0.004;
  const volatility = basePrice * volatilityPercent;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.45) * volatility; // Slight upward bias
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    // Generate random volume with some variation
    const baseVolume = 1000 + Math.random() * 5000;
    const volumeSpike = Math.random() > 0.85 ? 2 + Math.random() * 3 : 1;
    const volume = baseVolume * volumeSpike;
    
    candles.push({ 
      time: getTimeLabel(i), 
      open, 
      high, 
      low, 
      close,
      volume
    });
    price = close;
  }

  // Anchor the tape to the live mark: shift every candle so the last close
  // equals `basePrice`. Preserves random-walk shape without leaving the
  // chart price disconnected from the terminal's current price.
  if (candles.length > 0) {
    const lastClose = candles[candles.length - 1].close;
    const shift = basePrice - lastClose;
    if (Math.abs(shift) > 1e-9) {
      for (const c of candles) {
        c.open += shift;
        c.close += shift;
        c.high += shift;
        c.low += shift;
      }
    }
  }

  return candles;
};

// Format volume number
const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return (vol / 1000000).toFixed(2) + "M";
  if (vol >= 1000) return (vol / 1000).toFixed(2) + "K";
  return vol.toFixed(0);
};

// Calculate moving average
const calculateMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

export const CandlestickChart = ({ remainingDays = 25, basePrice = 0.12, side = "buy" }: CandlestickChartProps) => {
  const defaultTimeframe = getDefaultTimeframe(remainingDays);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [chartMode, setChartMode] = useState<"candle" | "line">("candle");
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candleIndex: number } | null>(null);
  
  // Auto-switch to line for ALL timeframe
  useEffect(() => {
    if (selectedTimeframe === "ALL") {
      setChartMode("line");
    } else {
      setChartMode("candle");
    }
  }, [selectedTimeframe]);

  // Mirror price for sell side (Yes-only model: Sell = 1 - p), clamped to valid range
  const effectiveBasePrice = side === "sell"
    ? Math.max(0.0001, Math.min(0.9999, 1 - basePrice))
    : basePrice;

  const candleCount = selectedTimeframe === "ALL" ? 60 : 60;
  const candles = useMemo(
    () => generateMockCandles(selectedTimeframe, effectiveBasePrice, candleCount), 
    [selectedTimeframe, effectiveBasePrice, candleCount]
  );
  
  // Calculate volume data
  const volumes = candles.map(c => c.volume);
  const maxVolume = Math.max(...volumes);
  const currentVolume = volumes[volumes.length - 1] || 0;
  const volumeMA5 = calculateMA(volumes, 5);
  const volumeMA10 = calculateMA(volumes, 10);
  const currentMA5 = volumeMA5[volumeMA5.length - 1] || 0;
  const currentMA10 = volumeMA10[volumeMA10.length - 1] || 0;
  
  // Calculate price range with symmetric padding (10% on each side)
  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;
  const adjustedMin = minPrice - padding;
  const adjustedMax = maxPrice + padding;
  const adjustedRange = adjustedMax - adjustedMin;

  // Find indices of highest and lowest candles
  const highestCandleIndex = candles.findIndex(c => c.high === maxPrice);
  const lowestCandleIndex = candles.findIndex(c => c.low === minPrice);
  
  const chartHeight = 220;
  const volumeChartHeight = 80;
  const drawHeight = chartHeight - 15; // Leave space for padding
  
  // ViewBox dimensions - use simple 100% width approach
  const viewBoxWidth = 1000;
  const candleSpacing = viewBoxWidth / candleCount;
  const candleBodyWidth = candleSpacing * 0.65;

  const priceToY = (price: number) => {
    return 10 + drawHeight - ((price - adjustedMin) / adjustedRange) * drawHeight;
  };

  const volumeToY = (volume: number) => {
    return volumeChartHeight - (volume / maxVolume) * (volumeChartHeight - 5);
  };

  // Generate price labels (5 labels evenly distributed)
  const priceLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i <= 4; i++) {
      labels.push(adjustedMax - (adjustedRange * i / 4));
    }
    return labels;
  }, [adjustedMax, adjustedRange]);

  // Get time labels to display
  const timeLabels = useMemo(() => {
    const step = Math.max(1, Math.floor(candles.length / 8));
    return candles.filter((_, i) => i % step === 0);
  }, [candles]);

  // Handle chart click for crosshair
  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;
    const y = ((e.clientY - rect.top) / rect.height) * chartHeight;
    const candleIndex = Math.floor(x / candleSpacing);
    
    if (candleIndex >= 0 && candleIndex < candles.length) {
      // Toggle off if clicking same candle
      if (crosshair && crosshair.candleIndex === candleIndex) {
        setCrosshair(null);
      } else {
        setCrosshair({ x, y, candleIndex });
      }
    }
  };

  // Get crosshair price from Y position
  const yToPrice = (y: number) => {
    return adjustedMax - ((y - 10) / drawHeight) * adjustedRange;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Timeframe selector */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        <div className="flex items-center">
          <div className="flex bg-muted/50 rounded-md p-0.5 overflow-x-auto scrollbar-hide">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-all ${
                  selectedTimeframe === tf
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setChartMode(chartMode === "candle" ? "line" : "candle")}
            className={`p-1.5 transition-colors ${chartMode === "candle" ? "text-foreground" : "text-muted-foreground"}`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price Chart */}
      <div className="relative flex-1 min-h-0">
        <div className="flex h-full">
          {/* Chart area */}
          <div className="flex-1 relative">
            <svg 
              width="100%"
              height="100%"
              viewBox={`0 0 ${viewBoxWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              onClick={handleChartClick}
              className="cursor-crosshair"
            >
              {/* Grid lines */}
              {priceLabels.map((price, i) => (
                <line
                  key={`grid-${i}`}
                  x1={0}
                  y1={priceToY(price)}
                  x2={viewBoxWidth}
                  y2={priceToY(price)}
                  stroke="hsl(222 30% 18%)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}
              
              {chartMode === "line" || selectedTimeframe === "ALL" ? (
                // Line chart for ALL or when line mode selected
                <path
                  d={candles.map((candle, index) => {
                    const x = index * candleSpacing + candleSpacing / 2;
                    const y = priceToY(candle.close);
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth="2"
                />
              ) : (
                // Candlestick chart
                candles.map((candle, index) => {
                  const x = index * candleSpacing + (candleSpacing - candleBodyWidth) / 2;
                  const centerX = index * candleSpacing + candleSpacing / 2;
                  const isGreen = candle.close >= candle.open;
                  const bodyTop = priceToY(Math.max(candle.open, candle.close));
                  const bodyBottom = priceToY(Math.min(candle.open, candle.close));
                  const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
                  
                  return (
                    <g key={index}>
                      {/* Wick */}
                      <line
                        x1={centerX}
                        y1={priceToY(candle.high)}
                        x2={centerX}
                        y2={priceToY(candle.low)}
                        stroke={isGreen ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"}
                        strokeWidth="2"
                      />
                      {/* Body */}
                      <rect
                        x={x}
                        y={bodyTop}
                        width={candleBodyWidth}
                        height={bodyHeight}
                        fill={isGreen ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"}
                      />
                    </g>
                  );
                })
              )}

              {/* Current price line */}
              {candles.length > 0 && (
                <line
                  x1={0}
                  y1={priceToY(candles[candles.length - 1].close)}
                  x2={viewBoxWidth}
                  y2={priceToY(candles[candles.length - 1].close)}
                  stroke="hsl(142 71% 45%)"
                  strokeWidth="1"
                  strokeDasharray="6,4"
                  opacity="0.5"
                />
              )}

              {/* Highest price annotation line */}
              {highestCandleIndex >= 0 && (() => {
                const candleX = highestCandleIndex * candleSpacing + candleSpacing / 2;
                const isRightSide = candleX > viewBoxWidth / 2;
                const lineLength = 60;
                
                return (
                  <line
                    x1={isRightSide ? candleX - lineLength : candleX}
                    y1={priceToY(maxPrice)}
                    x2={isRightSide ? candleX : candleX + lineLength}
                    y2={priceToY(maxPrice)}
                    stroke="hsl(0 0% 50%)"
                    strokeWidth="1"
                  />
                );
              })()}

              {/* Lowest price annotation line */}
              {lowestCandleIndex >= 0 && (() => {
                const candleX = lowestCandleIndex * candleSpacing + candleSpacing / 2;
                const isRightSide = candleX > viewBoxWidth / 2;
                const lineLength = 60;
                
                return (
                  <line
                    x1={isRightSide ? candleX - lineLength : candleX}
                    y1={priceToY(minPrice)}
                    x2={isRightSide ? candleX : candleX + lineLength}
                    y2={priceToY(minPrice)}
                    stroke="hsl(0 0% 50%)"
                    strokeWidth="1"
                  />
                );
              })()}
              {/* Crosshair */}
              {crosshair && crosshair.candleIndex < candles.length && (() => {
                const candle = candles[crosshair.candleIndex];
                const centerX = crosshair.candleIndex * candleSpacing + candleSpacing / 2;
                const priceY = priceToY(candle.close);
                
                return (
                  <g>
                    {/* Vertical line */}
                    <line
                      x1={centerX}
                      y1={0}
                      x2={centerX}
                      y2={chartHeight}
                      stroke="hsl(var(--foreground) / 0.5)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    {/* Horizontal line at candle close price */}
                    <line
                      x1={0}
                      y1={priceY}
                      x2={viewBoxWidth}
                      y2={priceY}
                      stroke="hsl(var(--foreground) / 0.5)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  </g>
                );
              })()}
            </svg>

            {/* Highest price label (HTML overlay) */}
            {highestCandleIndex >= 0 && (() => {
              const xPercent = (highestCandleIndex * candleSpacing + candleSpacing / 2) / viewBoxWidth * 100;
              const yPercent = priceToY(maxPrice) / chartHeight * 100;
              const isRightSide = xPercent > 50;
              const lineWidthPercent = 60 / viewBoxWidth * 100;
              
              return (
                <span
                  className="absolute text-[10px] font-mono text-muted-foreground whitespace-nowrap"
                  style={{
                    left: isRightSide ? `${xPercent - lineWidthPercent - 1}%` : `${xPercent + lineWidthPercent + 1}%`,
                    top: `${yPercent}%`,
                    transform: `translateY(-50%) ${isRightSide ? 'translateX(-100%)' : ''}`,
                  }}
                >
                  {maxPrice.toFixed(4)}
                </span>
              );
            })()}

            {/* Lowest price label (HTML overlay) */}
            {lowestCandleIndex >= 0 && (() => {
              const xPercent = (lowestCandleIndex * candleSpacing + candleSpacing / 2) / viewBoxWidth * 100;
              const yPercent = priceToY(minPrice) / chartHeight * 100;
              const isRightSide = xPercent > 50;
              const lineWidthPercent = 60 / viewBoxWidth * 100;
              
              return (
                <span
                  className="absolute text-[10px] font-mono text-muted-foreground whitespace-nowrap"
                  style={{
                    left: isRightSide ? `${xPercent - lineWidthPercent - 1}%` : `${xPercent + lineWidthPercent + 1}%`,
                    top: `${yPercent}%`,
                    transform: `translateY(-50%) ${isRightSide ? 'translateX(-100%)' : ''}`,
                  }}
                >
                  {minPrice.toFixed(4)}
                </span>
              );
            })()}

            {/* Crosshair info tooltip */}
            {crosshair && crosshair.candleIndex < candles.length && (() => {
              const candle = candles[crosshair.candleIndex];
              const isGreen = candle.close >= candle.open;
              
              return (
                <div className="absolute top-1 left-1 bg-background/90 border border-border rounded px-2 py-1 text-[10px] font-mono z-10">
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">{candle.time}</span>
                    <span>O: <span className={isGreen ? "text-trading-green" : "text-trading-red"}>{candle.open.toFixed(4)}</span></span>
                    <span>H: <span className="text-foreground">{candle.high.toFixed(4)}</span></span>
                    <span>L: <span className="text-foreground">{candle.low.toFixed(4)}</span></span>
                    <span>C: <span className={isGreen ? "text-trading-green" : "text-trading-red"}>{candle.close.toFixed(4)}</span></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Y-axis labels (right side) */}
          <div className="flex flex-col justify-between text-[10px] text-muted-foreground font-mono pl-2 w-12 text-right">
            {priceLabels.map((label, i) => (
              <span key={i}>{label.toFixed(4)}</span>
            ))}
          </div>
        </div>

      </div>
      <div className="relative mt-1 px-2">
        {/* Volume indicator header */}
        <div className="flex items-center gap-3 text-[10px] font-mono mb-1">
          <span className="text-muted-foreground">
            VOL: <span className="text-foreground">{formatVolume(currentVolume)}</span>
          </span>
          <span className="text-yellow-500">
            MA5: {formatVolume(currentMA5)}
          </span>
          <span className="text-purple-400">
            MA10: {formatVolume(currentMA10)}
          </span>
        </div>

        <div className="h-[70px]">
          {/* Volume bars */}
          <div className="w-full h-full relative">
            <svg 
              width="100%"
              height="100%"
              viewBox={`0 0 ${viewBoxWidth} ${volumeChartHeight}`}
              preserveAspectRatio="none"
            >
              {/* Volume bars */}
              {candles.map((candle, index) => {
                const x = index * candleSpacing + (candleSpacing - candleBodyWidth) / 2;
                const isGreen = candle.close >= candle.open;
                const barHeight = (candle.volume / maxVolume) * (volumeChartHeight - 5);
                
                return (
                  <rect
                    key={index}
                    x={x}
                    y={volumeChartHeight - barHeight}
                    width={candleBodyWidth}
                    height={barHeight}
                    fill={isGreen ? "hsl(142 71% 45% / 0.6)" : "hsl(0 72% 51% / 0.6)"}
                  />
                );
              })}

              {/* MA5 line */}
              <path
                d={volumeMA5.map((vol, index) => {
                  if (vol === 0) return "";
                  const x = index * candleSpacing + candleSpacing / 2;
                  const y = volumeToY(vol);
                  const prevVol = index > 0 ? volumeMA5[index - 1] : 0;
                  return prevVol === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                }).filter(Boolean).join(" ")}
                fill="none"
                stroke="hsl(45 93% 47%)"
                strokeWidth="2"
              />

              {/* MA10 line */}
              <path
                d={volumeMA10.map((vol, index) => {
                  if (vol === 0) return "";
                  const x = index * candleSpacing + candleSpacing / 2;
                  const y = volumeToY(vol);
                  const prevVol = index > 0 ? volumeMA10[index - 1] : 0;
                  return prevVol === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                }).filter(Boolean).join(" ")}
                fill="none"
                stroke="hsl(270 70% 60%)"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* X-axis time labels */}
        <div className="flex justify-between pr-12 mt-1 text-[9px] text-muted-foreground font-mono">
          {timeLabels.slice(0, 8).map((candle, i) => (
            <span key={i}>{candle.time}</span>
          ))}
        </div>
      </div>


      {/* Timeframe info */}
      {selectedTimeframe === "ALL" && (
        <div className="text-[10px] text-muted-foreground text-center mt-1">
          Showing full history from market creation
        </div>
      )}
    </div>
  );
};