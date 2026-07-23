import { useMemo, useState, useRef } from "react";
import { format } from "date-fns";

interface PricePoint {
  date: string;
  price: number;
}

interface Trade {
  id: string;
  time: string;
  action: string;
  qty: number;
  price: number;
}

interface SettlementPriceChartProps {
  priceHistory: PricePoint[];
  entryPrice: number;
  exitPrice: number;
  trades: Trade[];
  isMobile?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  price: number;
  date: string;
  type?: "trade" | "price";
  tradeInfo?: Trade;
}

export const SettlementPriceChart = ({
  priceHistory,
  entryPrice,
  exitPrice,
  trades,
  isMobile = false,
}: SettlementPriceChartProps) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Chart dimensions
  const chartHeight = isMobile ? 160 : 200;
  const chartWidth = isMobile ? 320 : 700;
  const padding = {
    top: 10,
    right: isMobile ? 56 : 64,
    bottom: isMobile ? 25 : 30,
    left: 5,
  };

  // Calculate price bounds
  const allPrices = priceHistory.map((p) => p.price);
  const dataMin = Math.min(...allPrices, entryPrice);
  const dataMax = Math.max(...allPrices, exitPrice);
  const priceBuffer = (dataMax - dataMin) * 0.1 || 0.1;
  const minPrice = Math.max(0, dataMin - priceBuffer);
  const maxPrice = dataMax + priceBuffer;
  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number) => {
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - (price - minPrice) / priceRange);
  };

  const indexToX = (index: number) => {
    if (priceHistory.length <= 1) return padding.left;
    return padding.left + ((chartWidth - padding.left - padding.right) * index) / (priceHistory.length - 1);
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines: number[] = [];
    const step = priceRange / 4;
    for (let i = 0; i <= 4; i++) {
      lines.push(minPrice + step * i);
    }
    return lines;
  }, [minPrice, priceRange]);

  // Time labels
  const timeLabels = useMemo(() => {
    if (priceHistory.length === 0) return [];
    const labelCount = isMobile ? 3 : 5;
    const step = Math.max(1, Math.floor((priceHistory.length - 1) / (labelCount - 1)));
    const labels: { index: number; date: string }[] = [];

    for (let i = 0; i < priceHistory.length; i += step) {
      labels.push({
        index: i,
        date: format(new Date(priceHistory[i].date), isMobile ? "M/d" : "MMM d"),
      });
    }

    if (labels.length > 0 && labels[labels.length - 1].index !== priceHistory.length - 1) {
      const lastLabelIndex = labels[labels.length - 1].index;
      if (priceHistory.length - 1 - lastLabelIndex >= step * 0.5) {
        labels.push({
          index: priceHistory.length - 1,
          date: format(new Date(priceHistory[priceHistory.length - 1].date), isMobile ? "M/d" : "MMM d"),
        });
      }
    }

    return labels;
  }, [priceHistory, isMobile]);

  // Map trades to chart positions
  const tradeMarkers = useMemo(() => {
    return trades
      .map((trade) => {
        const tradeDate = new Date(trade.time);
        // Find the closest price history point
        let closestIndex = 0;
        let closestDiff = Infinity;
        
        priceHistory.forEach((p, i) => {
          const diff = Math.abs(new Date(p.date).getTime() - tradeDate.getTime());
          if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
          }
        });

        const x = indexToX(closestIndex);
        const y = priceToY(trade.price);
        
        // Only include if y is within chart bounds
        const isWithinBounds = y >= padding.top && y <= chartHeight - padding.bottom;
        
        return {
          ...trade,
          x,
          y,
          isWithinBounds,
        };
      })
      .filter((marker) => marker.isWithinBounds);
  }, [trades, priceHistory, chartHeight]);

  // Create path
  const pathD = useMemo(() => {
    if (priceHistory.length < 2) return "";
    return priceHistory
      .map((point, i) => {
        const x = indexToX(i);
        const y = priceToY(point.price);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [priceHistory]);

  // Gradient area path
  const areaPathD = useMemo(() => {
    if (priceHistory.length < 2) return "";
    const linePath = priceHistory
      .map((point, i) => {
        const x = indexToX(i);
        const y = priceToY(point.price);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    
    const lastX = indexToX(priceHistory.length - 1);
    const firstX = indexToX(0);
    const bottomY = chartHeight - padding.bottom;
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [priceHistory, chartHeight]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const mouseY = ((e.clientY - rect.top) / rect.height) * chartHeight;

    // Check if near a trade marker first
    for (const marker of tradeMarkers) {
      const distance = Math.sqrt(Math.pow(mouseX - marker.x, 2) + Math.pow(mouseY - marker.y, 2));
      if (distance < 20) {
        setTooltip({
          x: (marker.x / chartWidth) * rect.width,
          y: (marker.y / chartHeight) * rect.height,
          price: marker.price,
          date: format(new Date(marker.time), "MMM d, HH:mm"),
          type: "trade",
          tradeInfo: marker,
        });
        return;
      }
    }

    // Find nearest price point
    const index = Math.round(((mouseX - padding.left) / (chartWidth - padding.left - padding.right)) * (priceHistory.length - 1));
    const clampedIndex = Math.max(0, Math.min(priceHistory.length - 1, index));
    const point = priceHistory[clampedIndex];

    if (point) {
      const x = indexToX(clampedIndex);
      const y = priceToY(point.price);
      setTooltip({
        x: (x / chartWidth) * rect.width,
        y: (y / chartHeight) * rect.height,
        price: point.price,
        date: format(new Date(point.date), "MMM d, yyyy"),
        type: "price",
      });
    }
  };

  if (priceHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No price history available
      </div>
    );
  }

  const isProfit = exitPrice >= entryPrice;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        className="overflow-visible cursor-crosshair w-full"
        style={{ height: isMobile ? 160 : 200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isProfit ? "hsl(145 80% 42%)" : "hsl(0 85% 55%)"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isProfit ? "hsl(145 80% 42%)" : "hsl(0 85% 55%)"} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {gridLines.map((price, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={padding.left}
              y1={priceToY(price)}
              x2={chartWidth - padding.right}
              y2={priceToY(price)}
              stroke="hsl(222 20% 18%)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <text
              x={chartWidth - padding.right + 6}
              y={priceToY(price)}
              fill="hsl(222 20% 45%)"
              fontSize={isMobile ? "9" : "11"}
              fontFamily="monospace"
              dominantBaseline="middle"
            >
              ${price.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Entry price line */}
        <line
          x1={padding.left}
          y1={priceToY(entryPrice)}
          x2={chartWidth - padding.right}
          y2={priceToY(entryPrice)}
          stroke="hsl(260 65% 58%)"
          strokeWidth="1"
          strokeDasharray="6 3"
          opacity={0.7}
        />

        {/* Exit price line */}
        <line
          x1={padding.left}
          y1={priceToY(exitPrice)}
          x2={chartWidth - padding.right}
          y2={priceToY(exitPrice)}
          stroke={isProfit ? "hsl(145 80% 42%)" : "hsl(0 85% 55%)"}
          strokeWidth="1"
          strokeDasharray="6 3"
          opacity={0.7}
        />

        {/* X-axis labels */}
        {timeLabels.map((label, i) => (
          <text
            key={`time-${i}`}
            x={indexToX(label.index)}
            y={chartHeight - padding.bottom + (isMobile ? 16 : 20)}
            fill="hsl(222 20% 45%)"
            fontSize={isMobile ? "9" : "11"}
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {label.date}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPathD} fill="url(#priceGradient)" />

        {/* Price line */}
        <path
          d={pathD}
          fill="none"
          stroke={isProfit ? "hsl(145 80% 42%)" : "hsl(0 85% 55%)"}
          strokeWidth={isMobile ? 2 : 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Trade markers */}
        {tradeMarkers.map((marker, i) => (
          <g key={marker.id}>
            <circle
              cx={marker.x}
              cy={marker.y}
              r={isMobile ? 5 : 6}
              fill={marker.action === "Open" ? "hsl(145 80% 42%)" : "hsl(260 65% 58%)"}
              stroke="white"
              strokeWidth={2}
            />
          </g>
        ))}

        {/* End point */}
        <circle
          cx={indexToX(priceHistory.length - 1)}
          cy={priceToY(priceHistory[priceHistory.length - 1].price)}
          r={isMobile ? 4 : 5}
          fill={isProfit ? "hsl(145 80% 42%)" : "hsl(0 85% 55%)"}
        />

        {/* Hover crosshair */}
        {tooltip && (
          <g>
            <line
              x1={(tooltip.x / (svgRef.current?.getBoundingClientRect().width || 1)) * chartWidth}
              y1={padding.top}
              x2={(tooltip.x / (svgRef.current?.getBoundingClientRect().width || 1)) * chartWidth}
              y2={chartHeight - padding.bottom}
              stroke="hsl(222 20% 40%)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={(tooltip.x / (svgRef.current?.getBoundingClientRect().width || 1)) * chartWidth}
              cy={(tooltip.y / (svgRef.current?.getBoundingClientRect().height || 1)) * chartHeight}
              r={6}
              fill={isProfit ? "hsl(145 80% 42%)" : "hsl(0 85% 55%)"}
              stroke="white"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {/* Price labels */}
      <div
        className="absolute text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary whitespace-nowrap"
        style={{
          right: 0,
          top: priceToY(entryPrice) * (isMobile ? 160 : 200) / chartHeight - 8,
        }}
      >
        Entry
      </div>
      <div
        className={`absolute text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${
          isProfit ? "bg-trading-green/20 text-trading-green" : "bg-trading-red/20 text-trading-red"
        }`}
        style={{
          right: 0,
          top: priceToY(exitPrice) * (isMobile ? 160 : 200) / chartHeight - 8,
        }}
      >
        Exit
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl border border-border/60 bg-popover/95 backdrop-blur-sm"
          style={{
            left: Math.min(tooltip.x, (svgRef.current?.getBoundingClientRect().width || 300) - 120),
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.type === "trade" && tooltip.tradeInfo ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold ${
                  tooltip.tradeInfo.action === "Open" ? "text-trading-green" : "text-primary"
                }`}>
                  {tooltip.tradeInfo.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tooltip.tradeInfo.qty.toLocaleString()} qty
                </span>
              </div>
              <div className="text-base font-mono font-bold text-foreground">
                ${tooltip.price.toFixed(4)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{tooltip.date}</div>
            </>
          ) : (
            <>
              <div className="text-base font-mono font-bold text-foreground">
                ${tooltip.price.toFixed(4)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{tooltip.date}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
