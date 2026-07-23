import { ExternalLink } from "lucide-react";
import type { ExternalPlatformLink } from "@/hooks/useEvents";

const platformColors: Record<string, { bg: string; text: string; border: string }> = {
  polymarket: {
    bg: "bg-[hsl(255,60%,15%)]",
    text: "text-[hsl(255,80%,75%)]",
    border: "border-[hsl(255,50%,30%)]",
  },
  kalshi: {
    bg: "bg-[hsl(200,60%,15%)]",
    text: "text-[hsl(200,80%,70%)]",
    border: "border-[hsl(200,50%,30%)]",
  },
};

const defaultColors = {
  bg: "bg-muted/50",
  text: "text-muted-foreground",
  border: "border-border/50",
};

interface ExternalHedgeLinksProps {
  links: ExternalPlatformLink[];
  compact?: boolean;
  label?: string;
}

export function ExternalHedgeLinks({ links, compact = false, label = "Hedge on spot markets" }: ExternalHedgeLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className={compact ? "flex items-center gap-1.5" : "space-y-2"}>
      {!compact && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          <span>{label}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {links.map((link) => {
          const colors = platformColors[link.icon] || defaultColors;
          return (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-opacity hover:opacity-80 ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {link.platform}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
