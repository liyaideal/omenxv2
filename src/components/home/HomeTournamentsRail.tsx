import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData, EventRow } from "@/hooks/useMarketListData";
import { CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { cn } from "@/lib/utils";

const formatUSD = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
};

interface TournamentTile {
  key: string;
  label: string;
  hsl: string;
  marketCount: number;
  volume24h: number;
}

/**
 * Sportsbook-style horizontal carousel at the top of Home.
 *
 * Slot 1 is the catch-all "All markets" tile (primary color), then one tile
 * per non-empty category sorted by 24h volume. Tiles use solid color blocks
 * with display-style uppercase typography — no imagery, to stay consistent
 * with our minimal token system.
 */
export const HomeTournamentsRail = () => {
  const navigate = useNavigate();
  const { events } = useActiveEvents();
  const rows: EventRow[] = useMarketListData(events);

  const { totalCount, totalVol, tiles } = useMemo(() => {
    const groups = new Map<string, TournamentTile>();
    for (const r of rows) {
      const key = r.categoryLabel;
      const style = CATEGORY_STYLES[key as CategoryType];
      if (!style) continue;
      const existing = groups.get(key);
      if (existing) {
        existing.marketCount += 1;
        existing.volume24h += r.volume24h;
      } else {
        groups.set(key, {
          key,
          label: key,
          hsl: style.hsl,
          marketCount: 1,
          volume24h: r.volume24h,
        });
      }
    }
    const tiles = Array.from(groups.values()).sort(
      (a, b) => b.volume24h - a.volume24h,
    );
    return {
      totalCount: rows.length,
      totalVol: rows.reduce((s, r) => s + r.volume24h, 0),
      tiles,
    };
  }, [rows]);

  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-2 px-1">
        <h2 className="text-[18px] font-extrabold uppercase tracking-tight text-foreground">
          Tournaments
        </h2>
        <button
          onClick={() => navigate("/events")}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          See all
        </button>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Catch-all tile */}
        <TournamentCard
          onClick={() => navigate("/events")}
          label="All markets"
          subLabel={`${totalCount} live · ${formatUSD(totalVol)}/24h`}
          gradient="linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)"
          textOnDark
          arrow
        />

        {tiles.map((t) => (
          <TournamentCard
            key={t.key}
            onClick={() => navigate(`/events?category=${t.key.toLowerCase()}`)}
            label={t.label}
            subLabel={`${t.marketCount} ${t.marketCount === 1 ? "market" : "markets"} · ${formatUSD(t.volume24h)}`}
            gradient={`linear-gradient(135deg, hsl(${t.hsl}) 0%, hsl(${t.hsl} / 0.55) 100%)`}
            textOnDark
          />
        ))}
      </div>
    </section>
  );
};

interface CardProps {
  label: string;
  subLabel: string;
  gradient: string;
  onClick: () => void;
  textOnDark?: boolean;
  arrow?: boolean;
}

const TournamentCard = ({ label, subLabel, gradient, onClick, textOnDark, arrow }: CardProps) => (
  <button
    onClick={onClick}
    style={{ background: gradient }}
    className={cn(
      "group relative flex h-[140px] w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl p-4 text-left",
      "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] transition-transform duration-150 active:scale-[0.98]",
      textOnDark ? "text-white" : "text-foreground",
    )}
  >
    {/* Decorative diagonal sheen */}
    <span
      aria-hidden
      className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
    />
    <div className="relative flex items-start justify-between">
      {arrow ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-foreground">
          <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
        </span>
      ) : (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
          Markets
        </span>
      )}
    </div>
    <div className="relative">
      <div className="text-[22px] font-extrabold uppercase leading-none tracking-[-0.01em]">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[11px] tabular-nums opacity-85">
        {subLabel}
      </div>
    </div>
  </button>
);
