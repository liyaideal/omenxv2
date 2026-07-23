import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, DollarSign, BarChart3, Sparkles, Clock, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { EventWithOptions } from "@/hooks/useActiveEvents";
import { getCategoryInfo, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { parseSideLabels, getDisplayOptionLabel } from "@/lib/eventUtils";

type SortTab = "trending" | "volume" | "active" | "new" | "closing";

const tabs: { id: SortTab; label: string; icon: React.ElementType }[] = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "volume", label: "Top Volume", icon: DollarSign },
  { id: "active", label: "Most Active", icon: BarChart3 },
  { id: "new", label: "Newly Listed", icon: Sparkles },
  { id: "closing", label: "Closing Soon", icon: Clock },
];

// Generate mock 7d sparkline data
const generateSparkline = (currentPrice: number): number[] => {
  const points: number[] = [];
  let price = currentPrice * (0.85 + Math.random() * 0.15);
  for (let i = 0; i < 14; i++) {
    price += (currentPrice - price) * 0.1 + (Math.random() - 0.48) * 0.05;
    price = Math.max(0.01, Math.min(0.99, price));
    points.push(price);
  }
  points.push(currentPrice);
  return points;
};

const MiniSparkline = ({ data, positive, id }: { data: number[]; positive: boolean; id: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;
  const h = 40;
  const w = 200;
  const strokeColor = positive ? "hsl(145 80% 42%)" : "hsl(0 85% 60%)";

  // Convert data to coordinate points
  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: ((v - min) / range) * (h - 4) + 2,
  }));

  // Build smooth cubic bezier path (Catmull-Rom to Bezier)
  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    const tension = 0.35;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  const fillD = `${d} L${w},${h} L0,${h} Z`;
  const gradId = `sparkGrad-${id}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="60%" stopColor={strokeColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Mock volume/trader data per event
const getMockMetrics = (eventId: string) => {
  const hash = eventId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    volume24h: (hash % 500 + 20) * 1000,
    openInterest: (hash % 300 + 10) * 1000,
    traders: hash % 800 + 50,
  };
};

const formatVol = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
};

interface TrendingMarketsProps {
  events: EventWithOptions[];
  priceChanges: Map<string, { prev: number; current: number; change: number }>;
}

export const TrendingMarkets = ({ events, priceChanges }: TrendingMarketsProps) => {
  const [activeTab, setActiveTab] = useState<SortTab>("trending");
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  // Sort events based on active tab
  const sortedEvents = [...events].sort((a, b) => {
    switch (activeTab) {
      case "trending": {
        const aChange = Math.max(...a.options.map(o => Math.abs(priceChanges.get(o.id)?.change || 0)));
        const bChange = Math.max(...b.options.map(o => Math.abs(priceChanges.get(o.id)?.change || 0)));
        return bChange - aChange;
      }
      case "volume": {
        return getMockMetrics(b.id).volume24h - getMockMetrics(a.id).volume24h;
      }
      case "active": {
        return getMockMetrics(b.id).traders - getMockMetrics(a.id).traders;
      }
      case "new": {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      case "closing": {
        const aEnd = a.end_date ? new Date(a.end_date).getTime() : Infinity;
        const bEnd = b.end_date ? new Date(b.end_date).getTime() : Infinity;
        return aEnd - bEnd;
      }
      default: return 0;
    }
  });

  const displayed = showAll ? sortedEvents.slice(0, 50) : sortedEvents.slice(0, 10);

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Top Trending Markets</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/30"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayed.map((event) => {
          const catInfo = getCategoryInfo(event.category);
          const catStyle = CATEGORY_STYLES[catInfo.label as CategoryType] || CATEGORY_STYLES.General;
          const metrics = getMockMetrics(event.id);
          const sideLabels = parseSideLabels(event.side_labels);
          const mainOption = event.options[0];
          const secondOption = event.options.length === 2 ? event.options[1] : null;
          const mainLabel = mainOption ? getDisplayOptionLabel(mainOption.label, event.options, sideLabels) : "";
          const secondLabel = secondOption ? getDisplayOptionLabel(secondOption.label, event.options, sideLabels) : "";
          const mainChange = mainOption ? priceChanges.get(mainOption.id) : null;
          const mainPrice = mainOption?.price || 0.5;
          const sparklineData = generateSparkline(mainPrice);
          const isPositive = (mainChange?.change || 0) >= 0;
          const closingDate = event.end_date ? new Date(event.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

          return (
            <div
              key={event.id}
              onClick={() => navigate(`/trade?event=${event.id}`)}
              className="relative p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-colors group overflow-hidden cursor-pointer"
            >
              {/* Top row: category + trade button */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catStyle.class}`}>
                  {catInfo.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/trade?event=${event.id}`); }}
                  className="relative z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
                >
                  Trade <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Event name */}
              <h3 className="text-sm font-semibold text-foreground mb-3 line-clamp-2 leading-snug">
                {event.name}
              </h3>

              {/* Options prices */}
              <div className="flex items-center gap-3 mb-2">
                {mainOption && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{mainLabel}:</span>
                    <span className="text-sm font-bold text-foreground font-mono">${mainPrice.toFixed(2)}</span>
                    {mainChange && (
                      <span className={`text-[10px] font-medium ${mainChange.change >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                        ({mainChange.change >= 0 ? "+" : ""}{mainChange.change.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                )}
                {secondOption && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{secondLabel}:</span>
                    <span className="text-sm font-bold text-foreground font-mono">${secondOption.price.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Sparkline background - top 1/3 with fade */}
              <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none opacity-[0.30] group-hover:opacity-[0.45] transition-opacity duration-500" style={{ maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)' }}>
                <MiniSparkline data={sparklineData} positive={isPositive} id={event.id} />
              </div>

              {/* Metrics row */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Vol 24h: {formatVol(metrics.volume24h)}</span>
                <span>OI: {formatVol(metrics.openInterest)}</span>
                <span>Traders: {metrics.traders}</span>
                <span>Closes: {closingDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All */}
      {!showAll && events.length > 10 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-2.5 rounded-lg border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors"
        >
          View All ({events.length} markets)
        </button>
      )}
    </section>
  );
};
