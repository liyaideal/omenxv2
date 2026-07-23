import { Search, Star, X } from "lucide-react";
import { TradingEvent } from "@/hooks/useEvents";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: TradingEvent;
  filteredEvents: TradingEvent[];
  favorites: Set<string>;
  toggleFavorite: (id: string, e?: React.MouseEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFavoritesOnly: boolean;
  toggleShowFavoritesOnly: () => void;
  onEventSelect: (event: TradingEvent) => void;
}

export function EventSelectorSheet({
  open,
  onOpenChange,
  selectedEvent,
  filteredEvents,
  favorites,
  toggleFavorite,
  searchQuery,
  setSearchQuery,
  showFavoritesOnly,
  toggleShowFavoritesOnly,
  onEventSelect,
}: EventSelectorSheetProps) {
  return (
    <MobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Select Event"
      height="h-[70vh]"
    >
      {/* Search with Favorites Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={showFavoritesOnly ? "Search favorites..." : "Search events..."}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={toggleShowFavoritesOnly}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
          >
            <Star className={`w-4 h-4 transition-colors ${
              showFavoritesOnly 
                ? "text-trading-yellow fill-trading-yellow" 
                : "text-muted-foreground"
            }`} />
          </button>
        </div>
        {showFavoritesOnly && (
          <div className="mt-2 text-xs text-trading-yellow flex items-center gap-1">
            <Star className="w-3 h-3 fill-trading-yellow" />
            Showing favorites only ({filteredEvents.length})
          </div>
        )}
      </div>
      
      {/* Event List */}
      <ScrollArea className="h-[calc(70vh-180px)]">
        <div className="space-y-2 pr-2">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              {showFavoritesOnly ? (
                <>
                  <Star className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No favorites yet</p>
                  <p className="text-xs text-muted-foreground/70">
                    Click the star icon next to events to add them to your favorites
                  </p>
                  <button
                    onClick={toggleShowFavoritesOnly}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    View all events
                  </button>
                </>
              ) : (
                <>
                  <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No events found</p>
                  <p className="text-xs text-muted-foreground/70">
                    Try a different search term
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventSelect(event)}
                className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                  selectedEvent.id === event.id 
                    ? "bg-primary/10 border border-primary/30" 
                    : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(event.id, e);
                  }}
                  className="flex-shrink-0"
                >
                  <Star 
                    className={`w-4 h-4 ${favorites.has(event.id) ? "text-trading-yellow fill-trading-yellow" : "text-muted-foreground"}`} 
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{event.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>Ends: {event.ends}</span>
                    <span>Volume: {event.volume}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </MobileDrawer>
  );
}
