import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Platform = "desktop" | "mobile" | "shared";

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

const platformConfig: Record<Platform, { icon: React.ElementType; label: string; color: string }> = {
  desktop: {
    icon: Monitor,
    label: "Desktop",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  mobile: {
    icon: Smartphone,
    label: "Mobile",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  shared: {
    icon: Share2,
    label: "Shared",
    color: "bg-trading-purple/10 text-trading-purple border-trading-purple/20",
  },
};

export const PlatformBadge = ({ platform, className }: PlatformBadgeProps) => {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium gap-1", config.color, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
