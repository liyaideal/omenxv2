import { useMemo } from "react";
import { Flame, Sparkles, Clock } from "lucide-react";
import { EventRow } from "@/hooks/useMarketListData";
import { useHotMarkets } from "@/hooks/useHotMarkets";
import { MarketListView } from "./MarketListView";
import { MarketGridView } from "./MarketGridView";
import { ViewMode } from "./ViewToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface HotShelfProps {
  markets: EventRow[];
  view: ViewMode;
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e?: React.MouseEvent) => void;
}

const ShelfHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-center gap-2 mb-3">
    {icon}
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

const RenderView = ({
  view,
  markets,
  isWatched,
  onToggleWatch,
}: {
  view: ViewMode;
  markets: EventRow[];
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e?: React.MouseEvent) => void;
}) => {
  const isMobile = useIsMobile();
  const effectiveView: ViewMode = isMobile ? "grid" : view;
  return effectiveView === "list" ? (
    <MarketListView markets={markets} isWatched={isWatched} onToggleWatch={onToggleWatch} />
  ) : (
    <MarketGridView markets={markets} isWatched={isWatched} onToggleWatch={onToggleWatch} />
  );
};

export const HotShelf = ({ markets, view, isWatched, onToggleWatch }: HotShelfProps) => {
  const buckets = useHotMarkets(markets);
  const trending = useMemo(() => buckets.trending.slice(0, 5), [buckets.trending]);
  const justLaunched = useMemo(
    () => [...buckets.justLaunched].sort((a, b) => b.volume24h - a.volume24h).slice(0, 3),
    [buckets.justLaunched],
  );
  const closingSoon = useMemo(() => buckets.closingSoon.slice(0, 3), [buckets.closingSoon]);

  const hasContent = trending.length > 0 || justLaunched.length > 0 || closingSoon.length > 0;
  if (!hasContent) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hot markets right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {trending.length > 0 && (
        <section>
          <ShelfHeader
            icon={<Flame className="h-5 w-5 text-trading-red" />}
            title="Trending"
            subtitle="Volume spiking now"
          />
          <RenderView view={view} markets={trending} isWatched={isWatched} onToggleWatch={onToggleWatch} />
        </section>
      )}

      {justLaunched.length > 0 && (
        <section>
          <ShelfHeader
            icon={<Sparkles className="h-5 w-5 text-trading-yellow" />}
            title="Just Launched"
            subtitle="New markets"
          />
          <RenderView view={view} markets={justLaunched} isWatched={isWatched} onToggleWatch={onToggleWatch} />
        </section>
      )}

      {closingSoon.length > 0 && (
        <section>
          <ShelfHeader
            icon={<Clock className="h-5 w-5 text-trading-red" />}
            title="Closing Soon"
            subtitle="Expires in < 48h"
          />
          <RenderView view={view} markets={closingSoon} isWatched={isWatched} onToggleWatch={onToggleWatch} />
        </section>
      )}
    </div>
  );
};
