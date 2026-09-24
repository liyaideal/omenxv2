// ============================================================
// ES-1 · EventSelectorPanel — the one event selector for both terminals.
//
// Product tabs (`Standard` = /spot, `Boost` = /trade) → search + favourites
// → list. Two layouts of the same body:
//   drawer   — mobile MobileDrawer body: stacked cards
//   dropdown — desktop title dropdown: column grid (Event · Ends in · Volume)
// Picking a row on the other tab is the host's job (`onSelect(event, tab)`);
// it navigates to that terminal.
// ============================================================
import { Search, Star, X } from "lucide-react";
import type { TradingEvent } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";
import { quickRoundLabel } from "@/components/lite/intraday/intradayData";

/** 研发问题 #12 · round-length chip (5m / 15m / 1h / 4h / Daily) after a quick-round name. */
const RoundChip = ({ id }: { id: string }) => {
  const label = quickRoundLabel(id);
  if (!label) return null;
  return (
    <span className="shrink-0 px-1.5 py-px rounded border border-border/60 bg-muted/40 text-[10px] font-mono text-muted-foreground">
      {label}
    </span>
  );
};
import {
  formatEndsIn,
  formatListVolume,
  PRODUCT_TABS,
  PRODUCT_TAB_LABEL,
  type EndsInUrgency,
  type ProductTab,
} from "@/lib/eventSelector";

export interface EventSelectorPanelProps {
  variant: "drawer" | "dropdown";
  tab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  search: string;
  onSearchChange: (q: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favorites: Set<string>;
  onToggleFavorite: (eventId: string, e?: React.MouseEvent) => void;
  events: TradingEvent[];
  currentEventId?: string;
  onSelect: (event: TradingEvent, tab: ProductTab) => void;
  /** Wall clock for the relative `Ends in` column (host ticks it). */
  now: number;
  /** Drawer only: list height class (the drawer owns the viewport). */
  listClassName?: string;
}

const URGENCY_CLASS: Record<EndsInUrgency, string> = {
  muted: "text-muted-foreground",
  yellow: "text-trading-yellow",
  red: "text-trading-red",
};

const ProductTabs = ({ tab, onTabChange }: Pick<EventSelectorPanelProps, "tab" | "onTabChange">) => (
  <div className="flex items-center border-b border-border/40" style={{ gap: 18 }} role="tablist" aria-label="Product">
    {PRODUCT_TABS.map((t) => (
      <button
        key={t}
        role="tab"
        aria-selected={tab === t}
        onClick={() => onTabChange(t)}
        className={cn(
          "text-xs font-semibold pb-1.5 border-b-2 transition-colors -mb-px focus:outline-none",
          tab === t ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground",
        )}
      >
        {PRODUCT_TAB_LABEL[t]}
      </button>
    ))}
  </div>
);

const SearchRow = (
  p: Pick<EventSelectorPanelProps, "search" | "onSearchChange" | "showFavoritesOnly" | "onToggleFavoritesOnly">,
) => (
  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
    <Search className="w-4 h-4 text-muted-foreground" />
    <input
      type="text"
      value={p.search}
      onChange={(e) => p.onSearchChange(e.target.value)}
      placeholder={p.showFavoritesOnly ? "Search favorites..." : "Search events..."}
      className="flex-1 bg-transparent outline-none text-sm min-w-0"
      aria-label="Search events"
    />
    {p.search && (
      <button onClick={() => p.onSearchChange("")} aria-label="Clear search">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    )}
    <button
      onClick={p.onToggleFavoritesOnly}
      className="p-1 rounded hover:bg-muted/50 transition-colors"
      aria-label={p.showFavoritesOnly ? "Show all events" : "Show favorites only"}
      aria-pressed={p.showFavoritesOnly}
    >
      <Star
        className={cn(
          "w-4 h-4 transition-colors",
          p.showFavoritesOnly ? "text-trading-yellow fill-trading-yellow" : "text-muted-foreground hover:text-trading-yellow",
        )}
      />
    </button>
  </div>
);

const Empty = ({ favoritesOnly, onShowAll }: { favoritesOnly: boolean; onShowAll: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    {favoritesOnly ? (
      <>
        <Star className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground mb-1">No favorites yet</p>
        <p className="text-xs text-muted-foreground/70">Tap the star next to an event to add it here</p>
        <button onClick={onShowAll} className="mt-3 text-xs text-primary hover:underline">
          View all events
        </button>
      </>
    ) : (
      <>
        <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No events found</p>
        <p className="text-xs text-muted-foreground/70">Try a different search term</p>
      </>
    )}
  </div>
);

const FavStar = ({ on, onClick, className }: { on: boolean; onClick: (e: React.MouseEvent) => void; className?: string }) => (
  <button onClick={onClick} className={cn("flex-shrink-0 rounded-md transition-colors", className)} aria-label={on ? "Remove from favorites" : "Add to favorites"}>
    <Star className={cn("w-4 h-4 transition-colors", on ? "text-trading-yellow fill-trading-yellow" : "text-muted-foreground hover:text-trading-yellow")} />
  </button>
);

export function EventSelectorPanel(p: EventSelectorPanelProps) {
  const onFav = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    p.onToggleFavorite(id, e);
  };

  if (p.variant === "drawer") {
    return (
      <div className="flex flex-col gap-3">
        <ProductTabs tab={p.tab} onTabChange={p.onTabChange} />
        <SearchRow
          search={p.search}
          onSearchChange={p.onSearchChange}
          showFavoritesOnly={p.showFavoritesOnly}
          onToggleFavoritesOnly={p.onToggleFavoritesOnly}
        />
        <div className={cn("overflow-y-auto", p.listClassName)}>
          <div className="space-y-2 pr-1">
            {p.events.length === 0 ? (
              <Empty favoritesOnly={p.showFavoritesOnly} onShowAll={p.onToggleFavoritesOnly} />
            ) : (
              p.events.map((event) => {
                const ends = formatEndsIn(event.endTime, event.freezeTime, p.now);
                const isCurrent = p.currentEventId === event.id;
                return (
                  <button
                    key={event.id}
                    onClick={() => p.onSelect(event, p.tab)}
                    aria-current={isCurrent ? "true" : undefined}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3",
                      isCurrent
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 hover:bg-muted/50 border border-transparent",
                    )}
                  >
                    <FavStar on={p.favorites.has(event.id)} onClick={onFav(event.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {event.name}
                        {quickRoundLabel(event.id) && <span className="ml-1.5 inline-flex align-middle"><RoundChip id={event.id} /></span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>
                          {ends.frozen || ends.text === "Ended" ? "" : "Ends in "}
                          <span className={cn("font-mono", URGENCY_CLASS[ends.urgency])}>{ends.text}</span>
                        </span>
                        <span>Volume: {formatListVolume(event.volume)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-3 pt-2">
        <ProductTabs tab={p.tab} onTabChange={p.onTabChange} />
      </div>
      <div className="p-3 border-b border-border/30">
        <SearchRow
          search={p.search}
          onSearchChange={p.onSearchChange}
          showFavoritesOnly={p.showFavoritesOnly}
          onToggleFavoritesOnly={p.onToggleFavoritesOnly}
        />
      </div>
      <div className="grid grid-cols-[1fr_96px_88px] text-xs text-muted-foreground px-4 py-2 border-b border-border/30">
        <span>Event</span>
        <span className="text-right">Ends in</span>
        <span className="text-right">Volume</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {p.events.length === 0 ? (
          <Empty favoritesOnly={p.showFavoritesOnly} onShowAll={p.onToggleFavoritesOnly} />
        ) : (
          p.events.map((event) => {
            const ends = formatEndsIn(event.endTime, event.freezeTime, p.now);
            const isCurrent = p.currentEventId === event.id;
            return (
              <button
                key={event.id}
                onClick={() => p.onSelect(event, p.tab)}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "w-full grid grid-cols-[1fr_96px_88px] items-center px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                  isCurrent && "bg-muted/30",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FavStar on={p.favorites.has(event.id)} onClick={onFav(event.id)} className="p-1.5 hover:bg-muted/50" />
                  <span className="text-sm font-medium truncate">{event.name}</span>
                  <RoundChip id={event.id} />
                </div>
                <span className={cn("text-xs font-mono text-right", URGENCY_CLASS[ends.urgency])}>{ends.text}</span>
                <span className="text-xs font-mono text-right">{formatListVolume(event.volume)}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Desktop title dropdown shell — the one frame both terminals hang under the title. */
export const EventSelectorDropdown = ({
  className,
  ...panel
}: Omit<EventSelectorPanelProps, "variant"> & { className?: string }) => (
  <div className={cn("absolute left-0 top-full mt-2 z-50 bg-background border border-border rounded-lg shadow-xl w-[500px]", className)}>
    <EventSelectorPanel variant="dropdown" {...panel} />
  </div>
);
