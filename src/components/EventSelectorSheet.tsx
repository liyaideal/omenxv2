// ============================================================
// ES-1 · Mobile "Select Event" drawer — both terminals.
//
// MobileDrawer shell around the shared `EventSelectorPanel` (drawer variant).
// State comes from `useEventSelector`; the host handles `onSelect`, which may
// jump to the other terminal when the pick is on the other product tab.
// ============================================================
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { EventSelectorPanel } from "@/components/EventSelectorPanel";
import type { TradingEvent } from "@/hooks/useEvents";
import type { UseEventSelectorReturn } from "@/hooks/useEventSelector";
import type { ProductTab } from "@/lib/eventSelector";

interface EventSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selector: UseEventSelectorReturn;
  currentEventId?: string;
  onSelect: (event: TradingEvent, tab: ProductTab) => void;
}

export function EventSelectorSheet({ open, onOpenChange, selector, currentEventId, onSelect }: EventSelectorSheetProps) {
  return (
    <MobileDrawer open={open} onOpenChange={onOpenChange} title="Select Event" height="h-[70vh]">
      <EventSelectorPanel
        variant="drawer"
        tab={selector.tab}
        onTabChange={selector.setTab}
        search={selector.search}
        onSearchChange={selector.setSearch}
        showFavoritesOnly={selector.showFavoritesOnly}
        onToggleFavoritesOnly={selector.toggleShowFavoritesOnly}
        favorites={selector.favorites}
        onToggleFavorite={selector.toggleFavorite}
        events={selector.events}
        currentEventId={currentEventId}
        onSelect={onSelect}
        now={selector.now}
        listClassName="h-[calc(70vh-220px)]"
      />
    </MobileDrawer>
  );
}
