import { TrendingUp, DollarSign, Users, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StatItem {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  changeType?: "positive" | "negative" | "neutral";
  iconColor: string;
}

interface EventStatsOverviewProps {
  stats?: {
    activeEvents: number;
    activeEventsChange?: string;
    volume24h: string;
    volume24hChange?: string;
    activeTraders: number;
    activeTradersChange?: string;
    avgLeverage: string;
    avgLeverageNote?: string;
  };
}

export const EventStatsOverview = ({ stats }: EventStatsOverviewProps) => {
  const isMobile = useIsMobile();

  const defaultStats = {
    activeEvents: 4,
    activeEventsChange: "+2 today",
    volume24h: "$2.4M",
    volume24hChange: "+14.5%",
    activeTraders: 1247,
    activeTradersChange: "+12.3%",
    avgLeverage: "6.8X",
    avgLeverageNote: "Recommended 5X",
  };

  const data = stats || defaultStats;

  const statItems: StatItem[] = [
    {
      label: "Active Events",
      value: String(data.activeEvents),
      change: data.activeEventsChange,
      icon: <TrendingUp className="h-4 w-4" />,
      changeType: "positive",
      iconColor: "icon-container-primary",
    },
    {
      label: "24H Volume",
      value: data.volume24h,
      change: data.volume24hChange,
      icon: <DollarSign className="h-4 w-4" />,
      changeType: "positive",
      iconColor: "icon-container-green",
    },
    {
      label: "Active Traders",
      value: data.activeTraders.toLocaleString(),
      change: data.activeTradersChange,
      icon: <Users className="h-4 w-4" />,
      changeType: "positive",
      iconColor: "icon-container-primary",
    },
    {
      label: "Avg. Leverage",
      value: data.avgLeverage,
      change: data.avgLeverageNote,
      icon: <Zap className="h-4 w-4" />,
      changeType: "neutral",
      iconColor: "icon-container-yellow",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: "linear-gradient(135deg, hsl(260 50% 20% / 0.4) 0%, hsl(222 40% 10% / 0.6) 50%, hsl(145 40% 15% / 0.3) 100%)"
        }}
      />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-dots-pattern opacity-30" />
      
      <div className="relative rounded-2xl backdrop-blur-sm p-6 border border-border/30">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Market Overview</h2>
              <p className="text-xs text-muted-foreground">Real-time platform stats</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-trading-green/10 border border-trading-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-trading-green animate-pulse" />
            <span className="text-[10px] text-trading-green font-medium">Live</span>
          </div>
        </div>

        {/* Stats Grid with cards */}
        <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {statItems.map((item, index) => (
            <div
              key={index}
              className="relative group p-4 rounded-xl border border-border/30 bg-background/40 hover:border-primary/30 hover:bg-background/60 transition-all duration-300"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                style={{ background: "radial-gradient(ellipse at center, hsl(260 60% 50% / 0.08) 0%, transparent 70%)" }}
              />
              
              <div className="relative">
                {/* Icon + Label Row */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`icon-container w-8 h-8 rounded-lg ${item.iconColor}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </span>
                </div>

                {/* Value */}
                <div className="text-2xl font-bold font-mono text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                  {item.value}
                </div>

                {/* Change indicator */}
                {item.change && (
                  <div 
                    className={`text-xs font-medium ${
                      item.changeType === "positive" 
                        ? "text-trading-green" 
                        : item.changeType === "negative" 
                        ? "text-trading-red" 
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.change}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};