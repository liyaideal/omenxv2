import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Lock, TrendingUp, Zap, Users, BarChart3, ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrdersStore, Order } from "@/stores/useOrdersStore";
import { toast } from "sonner";
import { getCategoryFromName, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { LivePrice } from "@/components/LivePrice";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { isSingleMarketBinary, getDisplayOptionLabel, parseSideLabels } from "@/lib/eventUtils";

export type EventStatus = "active" | "locked" | "resolved";

export interface EventOption {
  id: string;
  label: string;
  price: string;
  color?: string; // Color for the chart line (auto-assigned if not provided)
  priceHistory?: number[]; // Price history for this option
}

export interface EventData {
  id: string;
  title: string;
  status: EventStatus;
  hasMultipleOptions: boolean;
  settlementDate: string;
  options: EventOption[];
  totalVolume: string;
  volume24h: string;
  participants: number;
}

interface EventCardProps {
  event: EventData;
  onEventClick?: (eventId: string) => void;
  onTrade?: (eventId: string, optionId: string, side: "long" | "short", quantity: number) => void;
}

// Chart colors for options
const CHART_COLORS = [
  "hsl(0, 70%, 55%)",    // Red
  "hsl(45, 90%, 55%)",   // Yellow/Orange
  "hsl(220, 70%, 55%)",  // Blue
  "hsl(150, 60%, 50%)",  // Green
  "hsl(280, 60%, 60%)",  // Purple
];

// X-axis date labels
const generateDateLabels = () => {
  const now = new Date();
  const labels = [];
  for (let i = 4; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 4);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    labels.push(`${month}/${day} ${hour}:00`);
  }
  return labels;
};

// Generate realistic price history centered around the current price
const generateRealisticPriceHistory = (currentPrice: number, length: number, seed: number): number[] => {
  const result: number[] = [];
  // Use seed to create deterministic but varied conditions
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  
  // Work backwards from current price (currentPrice is 0-1, we want 0-100 for chart)
  const targetPrice = currentPrice * 100;
  let price = targetPrice + (seededRandom() - 0.5) * 10; // Start near target with some variance
  let momentum = 0;
  
  // Generate history going forward, ending at current price
  const history: number[] = [];
  for (let i = 0; i < length; i++) {
    history.push(Math.max(1, Math.min(99, price)));
    
    // Small random changes with momentum for smooth movement
    const noise = (seededRandom() - 0.5) * 1.5;
    momentum = momentum * 0.8 + noise * 0.2;
    
    // Mean reversion towards target price (current price)
    const meanReversion = (targetPrice - price) * 0.03;
    
    price += momentum + meanReversion;
  }
  
  // Ensure the last point is close to current price
  const lastIndex = history.length - 1;
  const adjustment = (targetPrice - history[lastIndex]) / 10;
  for (let i = Math.max(0, lastIndex - 10); i <= lastIndex; i++) {
    const progress = (i - (lastIndex - 10)) / 10;
    history[i] += adjustment * progress * 10;
  }
  
  return history;
};

// Multi-line chart component matching the design reference
const MiniChart = ({ 
  options, 
  selectedOptionId, 
  onChartClick 
}: { 
  options: EventOption[]; 
  selectedOptionId: string | null;
  onChartClick: () => void;
}) => {
  const dateLabels = useMemo(() => generateDateLabels(), []);
  
  // Memoize the generated price data with realistic patterns
  const optionsWithData = useMemo(() => {
    return options.map((option, index) => {
      // Parse price and create a seed from option id for consistency
      const priceValue = parseFloat(option.price.replace('$', '')) || 0.5;
      const seed = option.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), index * 1000);
      
      return {
        ...option,
        data: option.priceHistory || generateRealisticPriceHistory(priceValue, 150, seed),
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
  }, [options]);

  // Calculate dynamic Y-axis range based on all options' price data
  const { minPrice, maxPrice, yLabels } = useMemo(() => {
    // Get all price values from all options' history data (values are 0-100, representing $0.00-$1.00)
    const allPrices: number[] = [];
    optionsWithData.forEach(option => {
      if (option.data && option.data.length > 0) {
        allPrices.push(...option.data);
      }
    });
    
    if (allPrices.length === 0) {
      return { minPrice: 0, maxPrice: 100, yLabels: ["$1.00", "$0.75", "$0.50", "$0.25", "$0.00"] };
    }
    
    // Find actual min/max
    const dataMin = Math.min(...allPrices);
    const dataMax = Math.max(...allPrices);
    
    // Add padding (10% of range on each side)
    const range = dataMax - dataMin;
    const padding = Math.max(range * 0.1, 2); // At least 2 units of padding
    
    let min = Math.max(0, dataMin - padding);
    let max = Math.min(100, dataMax + padding);
    
    // Ensure minimum range of 10 units for readability
    if (max - min < 10) {
      const center = (max + min) / 2;
      min = Math.max(0, center - 5);
      max = Math.min(100, center + 5);
    }
    
    // Generate 5 evenly spaced labels
    const step = (max - min) / 4;
    const labels = [
      `$${(max / 100).toFixed(2)}`,
      `$${((max - step) / 100).toFixed(2)}`,
      `$${((max - step * 2) / 100).toFixed(2)}`,
      `$${((max - step * 3) / 100).toFixed(2)}`,
      `$${(min / 100).toFixed(2)}`,
    ];
    
    return { minPrice: min, maxPrice: max, yLabels: labels };
  }, [optionsWithData]);
  
  const chartWidth = 100;
  const chartHeight = 100;
  const paddingLeft = 0;
  const paddingRight = 8;
  const paddingTop = 5;
  const paddingBottom = 5;
  
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Generate smooth bezier curve path with dynamic Y-axis scaling
  const generateSmoothPath = useMemo(() => (data: number[]) => {
    if (!data || data.length === 0) return "";
    
    const priceRange = maxPrice - minPrice;
    
    // Sample data points to reduce complexity (take every nth point)
    const sampleRate = Math.max(1, Math.floor(data.length / 60));
    const sampledData = data.filter((_, i) => i % sampleRate === 0 || i === data.length - 1);
    
    // Convert data to coordinates
    const points = sampledData.map((value, index) => {
      const x = paddingLeft + (index / (sampledData.length - 1)) * innerWidth;
      const normalizedValue = (value - minPrice) / priceRange;
      const y = paddingTop + (1 - normalizedValue) * innerHeight;
      return { x, y };
    });
    
    if (points.length < 2) return "";
    
    // Generate smooth cubic bezier curve
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Calculate control points using Catmull-Rom to Bezier conversion
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    return path;
  }, [innerWidth, innerHeight, minPrice, maxPrice, paddingLeft, paddingTop]);

  // Memoize the paths for each option
  const paths = useMemo(() => {
    return optionsWithData.map(option => ({
      id: option.id,
      path: generateSmoothPath(option.data),
      color: option.color,
      lastPoint: option.data && option.data.length > 0 ? {
        x: innerWidth,
        y: paddingTop + (1 - (option.data[option.data.length - 1] - minPrice) / (maxPrice - minPrice)) * innerHeight
      } : null,
    }));
  }, [optionsWithData, generateSmoothPath, innerWidth, innerHeight, minPrice, maxPrice, paddingTop]);

  // Filter paths based on selected option
  const visiblePaths = useMemo(() => {
    if (!selectedOptionId) return paths; // Show all if none selected
    return paths.filter(p => p.id === selectedOptionId);
  }, [paths, selectedOptionId]);

  return (
    <div 
      className="w-full bg-muted/20 rounded-xl p-4 relative cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onChartClick}
    >
      <div className="relative h-32">
        {/* Y-axis labels */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-muted-foreground font-mono w-10 text-right pr-1">
          {yLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="absolute left-0 right-10 top-0 bottom-0">
          {/* Horizontal grid lines - more subtle */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yLabels.map((_, i) => (
              <div key={i} className="border-t border-border/20" />
            ))}
          </div>
          
          {/* SVG Chart */}
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            {visiblePaths.map(({ id, path, color }) => (
              <path
                key={id}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3))' }}
              />
            ))}
          </svg>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono pr-10">
        {dateLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
};

export const EventCard = ({ event, onEventClick, onTrade }: EventCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { addOrder } = useOrdersStore();
  const pricesContext = useRealtimePricesOptional();
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // Default to null (show all)
  const [tradeSide, setTradeSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState<number>(5);
  const [quantity, setQuantity] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  // Fetch real price history from database
  const optionIds = useMemo(() => event.options.map(o => o.id), [event.options]);
  const { priceHistories } = usePriceHistory(optionIds);

  // Max options to show before collapsing
  const MAX_VISIBLE_OPTIONS = 3;
  const hasMoreOptions = event.options.length > MAX_VISIBLE_OPTIONS;

  const selectedOptionData = event.options.find(o => o.id === selectedOption);
  const isLocked = event.status === "locked";
  const categoryInfo = getCategoryFromName(event.title);

  // Helper to get live or fallback price
  const getOptionPrice = (optionId: string, fallbackPrice: string): number => {
    const livePrice = pricesContext?.getPrice(optionId);
    return livePrice ?? parseFloat(fallbackPrice);
  };

  // Calculate order details for confirmation
  const orderDetails = useMemo(() => {
    if (!selectedOptionData || !quantity) return null;
    const price = getOptionPrice(selectedOptionData.id, selectedOptionData.price);
    const qty = parseFloat(quantity);
    const notionalValue = (price * qty).toFixed(2);
    const marginRequired = (price * qty / leverage).toFixed(2);
    const estimatedFee = (price * qty * 0.001).toFixed(2);
    const total = (parseFloat(marginRequired) + parseFloat(estimatedFee)).toFixed(2);
    const potentialWin = (qty * (1 - price)).toFixed(0);
    const liqPrice = tradeSide === "long" 
      ? (price * (1 - 1/leverage)).toFixed(4)
      : (price * (1 + 1/leverage)).toFixed(4);
    
    return {
      notionalValue,
      marginRequired,
      estimatedFee,
      total,
      quantity: qty.toLocaleString(),
      potentialWin,
      liqPrice,
      price: price.toFixed(2),
    };
  }, [selectedOptionData, quantity, leverage, tradeSide, pricesContext?.prices]);

  const handleTrade = () => {
    if (selectedOption && quantity) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmOrder = () => {
    if (!selectedOptionData || !orderDetails) return;

    const newOrder: Order = {
      type: tradeSide === "long" ? "buy" : "sell",
      orderType: "Market",
      event: event.title,
      option: selectedOptionData.label,
      price: `$${selectedOptionData.price}`,
      amount: orderDetails.quantity,
      total: `$${orderDetails.total}`,
      time: "Just now",
      status: "Pending",
    };
    
    addOrder(newOrder);
    setShowConfirmDialog(false);
    toast.success("Order placed successfully!");
    
    // Navigate to trade page with event ID
    navigate(`/trade?event=${event.id}`);
    
    // Also call the original onTrade callback if provided
    if (onTrade) {
      onTrade(event.id, selectedOption!, tradeSide, parseFloat(quantity));
    }
  };

  // Navigate to trade page when clicking card (except interactive areas)
  const handleCardClick = () => {
    if (onEventClick) {
      onEventClick(event.id);
    } else {
      navigate(`/trade?event=${event.id}`);
    }
  };

  // Use real price history from database, fallback to generated if not available
  const optionsWithHistory = useMemo(() => {
    return event.options.map((option, index) => {
      const priceValue = parseFloat(option.price.replace('$', '')) || 0.5;
      const seed = option.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), index * 1000);
      
      // Use real history from database if available
      const realHistory = priceHistories.get(option.id);
      const historyData = realHistory && realHistory.length >= 10
        ? realHistory
        : generateRealisticPriceHistory(priceValue, 150, seed);
      
      return {
        ...option,
        color: CHART_COLORS[index % CHART_COLORS.length],
        priceHistory: historyData,
      };
    });
  }, [event.options, priceHistories]);

  return (
    <>
      <Card 
        className="group relative overflow-hidden cursor-pointer transition-all duration-300 border-border/40 hover:border-primary/40"
        onClick={handleCardClick}
        style={{
          background: "linear-gradient(165deg, hsl(222 35% 11%) 0%, hsl(225 40% 7%) 100%)",
        }}
      >
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, hsl(260 65% 58% / 0.08) 0%, transparent 60%)"
          }}
        />
        
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground leading-snug text-[15px] group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <Badge 
            variant="outline"
            className={`flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide ${
              event.status === "active" 
                ? "bg-trading-green/15 text-trading-green border-trading-green/40 shadow-[0_0_8px_hsl(145_80%_42%/0.2)]" 
                : event.status === "locked"
                ? "bg-trading-red/15 text-trading-red border-trading-red/40"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {event.status === "active" ? "● Active" : event.status === "locked" ? "Locked" : "Resolved"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-2.5">
          <Badge 
            variant={CATEGORY_STYLES[categoryInfo.label as CategoryType]?.variant || "general"}
            className="text-[10px] font-medium border-0 px-2 py-0.5"
          >
            {categoryInfo.label}
          </Badge>
          {event.hasMultipleOptions && (
            <Badge variant="info" className="text-[10px] font-medium px-2 py-0.5">
              Multi-Option
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-[11px]">{event.settlementDate}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4" onClick={(e) => !isMobile && e.stopPropagation()}>
        {/* Mini Chart - Multi-line for all options, or single line when option selected */}
        <MiniChart 
          options={optionsWithHistory} 
          selectedOptionId={isMobile ? null : selectedOption}
          onChartClick={() => !isMobile && setSelectedOption(null)}
        />

        {/* Options List - Desktop: interactive, Mobile: display only */}
        <div className="space-y-1.5">
          {optionsWithHistory
            .slice(0, optionsExpanded ? undefined : MAX_VISIBLE_OPTIONS)
            .map((option, index) => (
              isMobile ? (
                // Mobile: non-interactive display with live price
                <div
                  key={option.id}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-muted/20 border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      {option.label}
                    </span>
                  </div>
                  <LivePrice 
                    optionId={option.id}
                    fallbackPrice={option.price}
                    className="text-sm font-bold"
                  />
                </div>
              ) : (
                // Desktop: interactive buttons with live price
                <button
                  key={option.id}
                  onClick={() => !isLocked && setSelectedOption(option.id)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedOption === option.id
                      ? "bg-primary/10 border border-primary/30 shadow-[0_0_12px_hsl(260_65%_58%/0.15)]"
                      : "bg-muted/20 border border-transparent hover:bg-muted/35 hover:border-border/30"
                  } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-background"
                      style={{ 
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        boxShadow: selectedOption === option.id ? `0 0 8px ${CHART_COLORS[index % CHART_COLORS.length]}` : 'none'
                      }}
                    />
                    <span className={`text-sm font-medium ${selectedOption === option.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {option.label}
                    </span>
                  </div>
                  <LivePrice 
                    optionId={option.id}
                    fallbackPrice={option.price}
                    className="text-sm font-bold"
                  />
                </button>
              )
            ))}
          
          {/* Expand/Collapse button when more than 3 options */}
          {hasMoreOptions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOptionsExpanded(!optionsExpanded);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {optionsExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>+{event.options.length - MAX_VISIBLE_OPTIONS} more options</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats Row - cleaner */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary/60" />
            <span>Vol: <span className="text-foreground font-mono font-medium">{event.totalVolume}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary/60" />
            <span><span className="text-foreground font-mono font-medium">{event.participants}</span> traders</span>
          </div>
        </div>

        {/* Locked Message */}
        {isLocked && (
          <div className="flex items-center justify-center gap-2 py-3 bg-trading-yellow/10 border border-trading-yellow/20 rounded-lg">
            <Lock className="h-4 w-4 text-trading-yellow" />
            <span className="text-sm text-trading-yellow">Event locked, awaiting settlement</span>
          </div>
        )}

        {/* Quick Trade Section - Only on Desktop and Active events */}
        {!isMobile && !isLocked && (
          <div className="pt-4 border-t border-border/40 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Quick Trade</span>
              <Zap className="h-4 w-4 text-trading-yellow animate-pulse" />
            </div>

            <div className="flex items-center gap-3">
              {/* Yes/No Toggle - uses standardized btn-trading classes */}
              <div className="flex rounded-xl overflow-hidden border border-border/50 bg-background/50 p-0.5">
                <button
                  onClick={() => setTradeSide("long")}
                  className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    tradeSide === "long" 
                      ? "btn-trading-green" 
                      : "btn-trading-inactive"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setTradeSide("short")}
                  className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    tradeSide === "short" 
                      ? "btn-trading-red" 
                      : "btn-trading-inactive"
                  }`}
                >
                  No
                </button>
              </div>


              {/* Leverage - pill style */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground font-medium">Leverage:</span>
                <div className="flex rounded-xl overflow-hidden border border-border/50 bg-background/50 p-0.5">
                  {[5, 10, 20].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        leverage === lev
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {lev}X
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity with Market Order hint */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium">Quantity</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Market Order</span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        Executes at best available price
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Input 
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono h-10 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Trade Button - with gradient and glow */}
            <button
              onClick={handleTrade}
              disabled={!selectedOption || !quantity}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                tradeSide === "long" 
                  ? "btn-trading-green" 
                  : "btn-trading-red"
              }`}
            >
              <TrendingUp className={`h-4 w-4 ${tradeSide === "short" ? "rotate-180" : ""}`} />
              {tradeSide === "long" ? "Buy Yes" : "Buy No"} — {selectedOptionData?.label || "Select option"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Order Confirmation Dialog */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Preview</DialogTitle>
        </DialogHeader>
        
        {orderDetails && selectedOptionData && (
          <div className="space-y-4">
            <div className="trading-card p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Event</span>
                <span className="text-sm text-right max-w-[200px] truncate">{event.title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Option</span>
                <span className="text-sm">{selectedOptionData.label}</span>
              </div>
              {!isSingleMarketBinary(event.options) && (
                <div className="flex justify-between py-2 border-b border-border/20">
                  <span className="text-muted-foreground text-sm">Side</span>
                  <span className={`text-sm font-medium ${tradeSide === "long" ? "text-trading-green" : "text-trading-red"}`}>
                    {tradeSide === "long" ? "Yes" : "No"}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Order Type</span>
                <Badge variant="info" className="text-xs">Market</Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Quantity</span>
                <span className="text-sm font-mono">{orderDetails.quantity}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Leverage</span>
                <span className="text-sm font-mono">{leverage}x</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Margin Required</span>
                <span className="text-sm font-mono">{orderDetails.marginRequired} USDC</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">Est. Liq. Price</span>
                <span className="text-sm font-mono">{orderDetails.liqPrice} USDC</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground text-sm">Est. Fee</span>
                <span className="text-sm font-mono">{orderDetails.estimatedFee} USDC</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className={`flex-1 ${
                  tradeSide === "long" 
                    ? "bg-trading-green hover:bg-trading-green/90" 
                    : "bg-trading-red hover:bg-trading-red/90"
                }`}
                onClick={handleConfirmOrder}
              >
                {tradeSide === "long" ? "Buy Yes" : "Buy No"} - Win ${orderDetails.potentialWin}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};
