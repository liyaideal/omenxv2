import { Users, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { EventStatistics } from "@/hooks/useResolvedEventDetail";

interface EventStatisticsCardProps {
  statistics: EventStatistics;
  volume: string | null;
  isMobile?: boolean;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const StatItem = ({ icon, label, value }: StatItemProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
    <div className="p-2 rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground truncate">{value}</div>
    </div>
  </div>
);

const formatVolume = (volume: string | null): string => {
  if (!volume) return "$0";
  const num = parseFloat(volume.replace(/[$,]/g, ""));
  if (isNaN(num)) return volume;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

export const EventStatisticsCard = ({ statistics, volume, isMobile = false }: EventStatisticsCardProps) => {
  const stats = [
    {
      icon: <Users className="h-4 w-4" />,
      label: "Participants",
      value: statistics.participants.toLocaleString(),
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Total Trades",
      value: statistics.totalTrades.toLocaleString(),
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Avg Holding Time",
      value: statistics.avgHoldingTime,
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Total Volume",
      value: formatVolume(volume),
    },
  ];

  return (
    <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
      {stats.map((stat) => (
        <StatItem
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  );
};
