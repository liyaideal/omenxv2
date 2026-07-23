import { MarketCardB } from "./MarketCardB";
import { EventRow, ChgTimeframe } from "@/hooks/useMarketListData";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketGridViewProps {
  markets: EventRow[];
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e?: React.MouseEvent) => void;
  chgTimeframe?: ChgTimeframe;
}

export const MarketGridView = ({ markets, isWatched, onToggleWatch, chgTimeframe = "24h" }: MarketGridViewProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"}`}>
      {markets.map((m, i) => (
        <div key={m.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
          <MarketCardB
            market={m}
            isWatched={isWatched(m.eventId)}
            onToggleWatch={(e) => onToggleWatch(m.eventId, e)}
            chgTimeframe={chgTimeframe}
          />
        </div>
      ))}
    </div>
  );
};
