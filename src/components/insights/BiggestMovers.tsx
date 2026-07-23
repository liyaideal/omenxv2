import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";
import { EventWithOptions } from "@/hooks/useActiveEvents";
import { parseSideLabels, getDisplayOptionLabel } from "@/lib/eventUtils";

interface BiggestMoversProps {
  events: EventWithOptions[];
  priceChanges: Map<string, { prev: number; current: number; change: number }>;
}

// Generate mini sparkline path
const sparklinePath = (positive: boolean): string => {
  const h = 20, w = 60;
  const pts: number[] = [];
  let y = positive ? h * 0.7 : h * 0.3;
  for (let i = 0; i < 10; i++) {
    y += (positive ? -1 : 1) * (Math.random() * 3) + (Math.random() - 0.5) * 2;
    y = Math.max(2, Math.min(h - 2, y));
    pts.push(y);
  }
  return pts.map((v, i) => `${(i / 9) * w},${v}`).join(" ");
};

export const BiggestMovers = ({ events, priceChanges }: BiggestMoversProps) => {
  const navigate = useNavigate();
  // Flatten options with their changes
  const optionsWithChanges = events.flatMap((event) => {
    const sideLabels = parseSideLabels(event.side_labels);
    return event.options.map((opt) => {
      const change = priceChanges.get(opt.id);
      return {
        eventId: event.id,
        eventName: event.name,
        optionLabel: getDisplayOptionLabel(opt.label, event.options, sideLabels),
        price: opt.price,
        change: change?.change || 0,
        prev: change?.prev || opt.price,
      };
    });
  });

  const gainers = [...optionsWithChanges]
    .filter((o) => o.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);

  const losers = [...optionsWithChanges]
    .filter((o) => o.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 5);

  const MoverRow = ({ item }: { item: typeof optionsWithChanges[0] }) => {
    const positive = item.change >= 0;
    const color = positive ? "hsl(145 80% 42%)" : "hsl(0 85% 60%)";
    const path = sparklinePath(positive);

    return (
      <div onClick={() => navigate(`/trade?event=${item.eventId}`)} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{item.eventName}</p>
          <p className="text-[10px] text-muted-foreground">{item.optionLabel}</p>
        </div>
        <svg width={60} height={20} className="shrink-0">
          <polyline points={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="text-right shrink-0 w-16">
          <p className="text-xs font-bold text-foreground font-mono">${item.price.toFixed(2)}</p>
          <p className={`text-[10px] font-medium ${positive ? "text-trading-green" : "text-trading-red"}`}>
            {positive ? "+" : ""}{item.change.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Biggest Movers (24h)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gainers */}
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-trading-green" />
            <h3 className="text-sm font-semibold text-trading-green">Biggest Gainers</h3>
          </div>
          {gainers.length > 0 ? (
            gainers.map((item, i) => <MoverRow key={i} item={item} />)
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No significant gainers in the past 24h</p>
          )}
        </div>

        {/* Losers */}
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-trading-red" />
            <h3 className="text-sm font-semibold text-trading-red">Biggest Losers</h3>
          </div>
          {losers.length > 0 ? (
            losers.map((item, i) => <MoverRow key={i} item={item} />)
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No significant losers in the past 24h</p>
          )}
        </div>
      </div>
    </section>
  );
};
