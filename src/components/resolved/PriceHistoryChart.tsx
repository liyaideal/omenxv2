import { useMemo, useState, useRef } from "react";
import { PriceHistoryPoint } from "@/hooks/useResolvedEventDetail";
import { format } from "date-fns";
import { Check } from "lucide-react";

interface PriceHistoryChartProps {
  priceHistory: Record<string, PriceHistoryPoint[]>;
  options: { id: string; label: string; displayLabel?: string; is_winner: boolean; final_price: number | null; price: number }[];
  isMobile?: boolean;
}

const OPTION_COLORS = [
  "hsl(145 80% 42%)", // trading-green
  "hsl(0 85% 55%)",   // trading-red
  "hsl(260 65% 58%)", // trading-purple
  "hsl(48 100% 55%)", // trading-yellow
];

interface TooltipData {
  x: number;
  y: number;
  price: number;
  date: string;
  label: string;
  color: string;
  startPrice: number;
  changePercent: number;
}

export const PriceHistoryChart = ({ priceHistory, options, isMobile = false }: PriceHistoryChartProps) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [visibleOptions, setVisibleOptions] = useState<Set<string>>(new Set(options.map(o => o.id)));
  const svgRef = useRef<SVGSVGElement>(null);

  // Toggle option visibility
  const toggleOption = (optionId: string) => {
    setVisibleOptions(prev => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        if (next.size > 1) {
          next.delete(optionId);
        }
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  // Normalize all prices to 0–1 binary contract scale and generate mock data if needed
  const chartData = useMemo(() => {
    // Normalizer: ensure values are on 0–1 scale. If a feed comes in as 0–100, divide by 100.
    const normalize = (v: number) => {
      if (!isFinite(v) || v < 0) return 0;
      if (v > 1) return Math.min(1, v / 100);
      return v;
    };

    const hasRealData = Object.values(priceHistory).some(arr => arr.length > 0);

    if (hasRealData) {
      const normalized: Record<string, PriceHistoryPoint[]> = {};
      for (const [id, points] of Object.entries(priceHistory)) {
        const opt = options.find(o => o.id === id);
        const target = opt ? (opt.is_winner ? 1 : 0) : null;
        normalized[id] = points.map((p, i) => ({
          ...p,
          price: i === points.length - 1 && target !== null
            ? target
            : Number(normalize(p.price).toFixed(4)),
        }));
      }
      return normalized;
    }

    const mockData: Record<string, PriceHistoryPoint[]> = {};
    const pointCount = 30;
    const now = new Date();

    options.forEach((option) => {
      const points: PriceHistoryPoint[] = [];
      const target = option.is_winner ? 1 : 0;
      const startSeed = Math.min(0.95, Math.max(0.05, normalize(option.price) || (option.is_winner ? 0.5 : 0.4)));
      let price = startSeed;

      for (let i = 0; i < pointCount; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (pointCount - i));

        // random walk in 0–1 space
        const change = (Math.random() - 0.5) * 0.08;
        price = Math.min(0.99, Math.max(0.01, price + change));

        // converge toward settlement in last 30% of points
        if (i > pointCount * 0.7) {
          price = price + (target - price) * 0.25;
        }

        // pin final point to settlement
        if (i === pointCount - 1) price = target;

        points.push({
          price: Number(price.toFixed(4)),
          recorded_at: date.toISOString(),
        });
      }

      mockData[option.id] = points;
    });

    return mockData;
  }, [priceHistory, options]);

  // Calculate price changes
  const priceChanges = useMemo(() => {
    return options.reduce((acc, option, index) => {
      const points = chartData[option.id] || [];
      if (points.length < 2) {
        acc[option.id] = { change: 0, startPrice: 0, endPrice: 0 };
        return acc;
      }
      
      const startPrice = points[0].price;
      const endPrice = points[points.length - 1].price;
      const change = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
      
      acc[option.id] = { change, startPrice, endPrice };
      return acc;
    }, {} as Record<string, { change: number; startPrice: number; endPrice: number }>);
  }, [chartData, options]);

  // Chart dimensions - different aspect ratios for mobile vs desktop
  const chartHeight = isMobile ? 180 : 200;
  const chartWidth = isMobile ? 320 : 800;
  const padding = { 
    top: 5, 
    right: isMobile ? 32 : 60, 
    bottom: isMobile ? 22 : 28, 
    left: 5 
  };

  // Find min/max prices across VISIBLE options only
  const visiblePrices = Object.entries(chartData)
    .filter(([optionId]) => visibleOptions.has(optionId))
    .flatMap(([, points]) => points.map(p => p.price));
  
  const dataMin = visiblePrices.length > 0 ? Math.min(...visiblePrices) : 0;
  const dataMax = visiblePrices.length > 0 ? Math.max(...visiblePrices) : 100;
  const priceBuffer = (dataMax - dataMin) * 0.08 || 2;
  const minPrice = Math.max(0, dataMin - priceBuffer);
  const maxPrice = dataMax + priceBuffer;
  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number) => {
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - (price - minPrice) / priceRange);
  };

  const indexToX = (index: number, total: number) => {
    if (total <= 1) return padding.left;
    return padding.left + ((chartWidth - padding.left - padding.right) * index) / (total - 1);
  };

  // Generate horizontal grid lines
  const gridLines = useMemo(() => {
    const lines: number[] = [];
    const step = priceRange / 3;
    for (let i = 0; i <= 3; i++) {
      lines.push(minPrice + step * i);
    }
    return lines;
  }, [minPrice, priceRange]);

  // Get time labels - avoid overlapping on mobile
  const timeLabels = useMemo(() => {
    const firstOptionId = options[0]?.id;
    const points = chartData[firstOptionId] || [];
    if (points.length === 0) return [];
    
    const labelCount = isMobile ? 3 : 5;
    const step = Math.max(1, Math.floor((points.length - 1) / (labelCount - 1)));
    const labels: { index: number; date: string }[] = [];
    
    for (let i = 0; i < points.length; i += step) {
      labels.push({
        index: i,
        date: format(new Date(points[i].recorded_at), isMobile ? "M/d" : "MMM d"),
      });
    }
    
    // Only add last label if it's far enough from the previous one
    if (labels.length > 0 && labels[labels.length - 1].index !== points.length - 1) {
      const lastLabelIndex = labels[labels.length - 1].index;
      const minGap = isMobile ? step * 0.6 : step * 0.5;
      if (points.length - 1 - lastLabelIndex >= minGap) {
        labels.push({
          index: points.length - 1,
          date: format(new Date(points[points.length - 1].recorded_at), isMobile ? "M/d" : "MMM d"),
        });
      }
    }
    
    return labels;
  }, [chartData, options, isMobile]);

  if (options.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No price history available
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const mouseY = ((e.clientY - rect.top) / rect.height) * chartHeight;
    
    // Find nearest point
    let nearestPoint: TooltipData | null = null;
    let minDistance = Infinity;
    
    options.forEach((option, optionIndex) => {
      if (!visibleOptions.has(option.id)) return;
      
      const points = chartData[option.id] || [];
      const color = OPTION_COLORS[optionIndex % OPTION_COLORS.length];
      const priceChange = priceChanges[option.id];
      
      points.forEach((point, i) => {
        const x = indexToX(i, points.length);
        const y = priceToY(point.price);
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        
        if (distance < minDistance && distance < 50) {
          minDistance = distance;
          
          const changeFromStart = priceChange.startPrice > 0 
            ? ((point.price - priceChange.startPrice) / priceChange.startPrice) * 100 
            : 0;
          
          nearestPoint = {
            x: (x / chartWidth) * rect.width,
            y: (y / chartHeight) * rect.height,
            price: point.price,
            date: format(new Date(point.recorded_at), "MMM d, yyyy"),
            label: option.displayLabel ?? option.label,
            color,
            startPrice: priceChange.startPrice,
            changePercent: changeFromStart,
          };
        }
      });
    });
    
    setTooltip(nearestPoint);
  };

  // Create smooth curve path
  const createSmoothPath = (points: PriceHistoryPoint[]) => {
    if (points.length < 2) return "";
    
    const coords = points.map((point, i) => ({
      x: indexToX(i, points.length),
      y: priceToY(point.price),
    }));
    
    let path = `M ${coords[0].x} ${coords[0].y}`;
    
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  return (
    <div className={isMobile ? "space-y-3" : "space-y-2"}>
      {/* Legend - compact grid on mobile */}
      <div className={isMobile 
        ? "grid grid-cols-2 gap-x-2 gap-y-2" 
        : "flex flex-wrap gap-x-4 gap-y-1.5"
      }>
        {options.map((option, index) => {
          const isVisible = visibleOptions.has(option.id);
          const color = OPTION_COLORS[index % OPTION_COLORS.length];
          const changeData = priceChanges[option.id];
          const isPositive = changeData.change >= 0;
          
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`flex items-center gap-1.5 transition-opacity ${
                isVisible ? "opacity-100" : "opacity-40"
              } ${isMobile ? "text-left" : ""}`}
            >
              <div 
                className={`rounded-full flex-shrink-0 ${isMobile ? "w-2 h-2" : "w-2.5 h-2.5"}`}
                style={{ backgroundColor: color }}
              />
              <span className={`${isMobile ? "text-xs" : "text-sm"} ${
                option.is_winner ? "text-foreground font-medium" : "text-muted-foreground"
              } truncate`}>
                {option.displayLabel ?? option.label}
              </span>
              <span className={`${isMobile ? "text-[10px]" : "text-xs"} font-mono font-medium flex-shrink-0 ${
                isPositive ? "text-trading-green" : "text-trading-red"
              }`}>
                {isPositive ? "+" : ""}{changeData.change.toFixed(1)}%
              </span>
              {option.is_winner && (
                <span className={`${isMobile ? "text-[8px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5"} font-semibold uppercase tracking-wide text-trading-green bg-trading-green/15 rounded flex-shrink-0`}>
                  Winner
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="overflow-visible cursor-crosshair w-full"
          style={{ height: isMobile ? 180 : 220 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Horizontal grid lines */}
          {gridLines.map((price, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left}
                y1={priceToY(price)}
                x2={chartWidth - padding.right}
                y2={priceToY(price)}
                stroke="hsl(222 20% 20%)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity={0.5}
              />
              <text
                x={chartWidth - padding.right + 6}
                y={priceToY(price)}
                fill="hsl(222 20% 50%)"
                fontSize={isMobile ? "9" : "11"}
                fontFamily="monospace"
                dominantBaseline="middle"
              >
                ${price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {timeLabels.map((label, i) => {
            const firstOptionId = options[0]?.id;
            const points = chartData[firstOptionId] || [];
            if (points.length === 0) return null;
            const x = indexToX(label.index, points.length);
            
            return (
              <text
                key={`time-${i}`}
                x={x}
                y={chartHeight - padding.bottom + (isMobile ? 16 : 22)}
                fill="hsl(222 20% 50%)"
                fontSize={isMobile ? "9" : "12"}
                fontFamily="system-ui"
                textAnchor="middle"
              >
                {label.date}
              </text>
            );
          })}

          {/* Price lines */}
          {options.map((option, optionIndex) => {
            const points = chartData[option.id] || [];
            if (points.length < 2) return null;
            if (!visibleOptions.has(option.id)) return null;

            const color = OPTION_COLORS[optionIndex % OPTION_COLORS.length];
            const pathD = points
              .map((point, i) => {
                const x = indexToX(i, points.length);
                const y = priceToY(point.price);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ");

            const lastPoint = points[points.length - 1];
            const lastX = indexToX(points.length - 1, points.length);
            const lastY = priceToY(lastPoint.price);

            return (
              <g key={option.id}>
                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={isMobile ? (option.is_winner ? 2 : 1.5) : (option.is_winner ? 2.5 : 2)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* End point */}
                <circle
                  cx={lastX}
                  cy={lastY}
                  r={isMobile ? 3 : 5}
                  fill={color}
                />
                
                {/* End price label - hide on mobile to reduce clutter */}
                {!isMobile && (
                  <text
                    x={lastX + 12}
                    y={lastY}
                    fill={color}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    ${lastPoint.price.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover indicator */}
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
                fill={tooltip.color}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl border border-border/60 bg-popover/95 backdrop-blur-sm"
            style={{
              left: tooltip.x,
              top: tooltip.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tooltip.color }}
              />
              <span className="text-xs font-medium text-foreground">{tooltip.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-mono font-bold text-foreground">
                ${tooltip.price.toFixed(2)}
              </span>
              <span className={`text-xs font-mono font-semibold ${
                tooltip.changePercent >= 0 ? "text-trading-green" : "text-trading-red"
              }`}>
                {tooltip.changePercent >= 0 ? "+" : ""}{tooltip.changePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{tooltip.date}</div>
          </div>
        )}
      </div>
    </div>
  );
};