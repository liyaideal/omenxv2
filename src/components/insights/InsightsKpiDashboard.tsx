import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity, Users, DollarSign } from "lucide-react";

type Period = "24h" | "7d" | "30d" | "all";

// Mock KPI data - in production, this would come from aggregation queries/views
const kpiData: Record<Period, {
  totalVolume: number;
  totalVolumeChange: number;
  openInterest: number;
  openInterestChange: number;
  activeMarkets: number;
  activeMarketsChange: number;
  volume24h: number;
  volume24hChange: number;
  uniqueTraders: number;
  uniqueTradersChange: number;
}> = {
  "24h": {
    totalVolume: 12_540_000, totalVolumeChange: 8.3,
    openInterest: 3_280_000, openInterestChange: 5.1,
    activeMarkets: 156, activeMarketsChange: 3.2,
    volume24h: 1_245_000, volume24hChange: 12.7,
    uniqueTraders: 2_847, uniqueTradersChange: 6.4,
  },
  "7d": {
    totalVolume: 12_540_000, totalVolumeChange: 15.2,
    openInterest: 3_280_000, openInterestChange: 8.7,
    activeMarkets: 156, activeMarketsChange: 5.1,
    volume24h: 8_715_000, volume24hChange: 22.3,
    uniqueTraders: 8_420, uniqueTradersChange: 11.2,
  },
  "30d": {
    totalVolume: 12_540_000, totalVolumeChange: 42.5,
    openInterest: 3_280_000, openInterestChange: 18.3,
    activeMarkets: 156, activeMarketsChange: 12.8,
    volume24h: 34_200_000, volume24hChange: 35.6,
    uniqueTraders: 24_500, uniqueTradersChange: 28.9,
  },
  all: {
    totalVolume: 12_540_000, totalVolumeChange: 0,
    openInterest: 3_280_000, openInterestChange: 0,
    activeMarkets: 156, activeMarketsChange: 0,
    volume24h: 12_540_000, volume24hChange: 0,
    uniqueTraders: 45_200, uniqueTradersChange: 0,
  },
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const formatCount = (n: number): string => {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  change: number;
  showChange: boolean;
}

const KpiCard = ({ icon: Icon, label, value, change, showChange }: KpiCardProps) => (
  <div className="p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-colors flex flex-col justify-between min-h-[120px]">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="text-xs text-muted-foreground font-medium leading-tight">{label}</span>
    </div>
    <div>
      <div className="text-2xl font-bold text-foreground font-mono leading-none">{value}</div>
      {showChange && change !== 0 ? (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          change > 0 ? "text-trading-green" : "text-trading-red"
        }`}>
          {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change > 0 ? "+" : ""}{change.toFixed(1)}%
        </div>
      ) : (
        <div className="mt-2 h-4" />
      )}
    </div>
  </div>
);

interface InsightsKpiDashboardProps {
  activeMarketsCount: number;
}

export const InsightsKpiDashboard = ({ activeMarketsCount }: InsightsKpiDashboardProps) => {
  const [period, setPeriod] = useState<Period>("24h");
  const data = kpiData[period];
  const showChange = period !== "all";

  return (
    <section>
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Platform Overview</h2>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/30">
          {(["24h", "7d", "30d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "All" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={DollarSign} label="Total Trading Volume" value={formatNumber(data.totalVolume)} change={data.totalVolumeChange} showChange={showChange} />
        <KpiCard icon={BarChart3} label="Open Interest" value={formatNumber(data.openInterest)} change={data.openInterestChange} showChange={showChange} />
        <KpiCard icon={Activity} label="Active Markets" value={activeMarketsCount.toString()} change={data.activeMarketsChange} showChange={showChange} />
        <KpiCard icon={DollarSign} label={`${period === "24h" ? "24h" : period} Volume`} value={formatNumber(data.volume24h)} change={data.volume24hChange} showChange={showChange} />
        <KpiCard icon={Users} label={`Unique Traders (${period === "all" ? "All" : period})`} value={formatCount(data.uniqueTraders)} change={data.uniqueTradersChange} showChange={showChange} />
      </div>
    </section>
  );
};
