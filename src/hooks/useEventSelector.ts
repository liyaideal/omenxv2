// ============================================================
// ES-1 · useEventSelector — state for the terminal event selector.
//
// Owns: product tab (defaults to the terminal you are on), search text,
// favourites-only filter, a per-minute clock for the `Ends in` column, and
// the tab-filtered event list. Favourites share the `trading_favorites`
// localStorage key with `useEvents`; a page that already holds favourites
// state (the contract pages) passes it in so the two never drift.
// ============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import {
  dbEventToTradingEvent,
  getStoredFavorites,
  setStoredFavorites,
  type TradingEvent,
} from "@/hooks/useEvents";
import { eventOnTab, type ProductTab } from "@/lib/eventSelector";

export interface UseEventSelectorOptions {
  /** Terminal the selector is mounted on — becomes the default tab. */
  terminal: ProductTab;
  /** Shared favourites state from the host page (optional). */
  favorites?: Set<string>;
  toggleFavorite?: (eventId: string, e?: React.MouseEvent) => void;
}

export interface UseEventSelectorReturn {
  isLoading: boolean;
  tab: ProductTab;
  setTab: (tab: ProductTab) => void;
  search: string;
  setSearch: (q: string) => void;
  showFavoritesOnly: boolean;
  toggleShowFavoritesOnly: () => void;
  favorites: Set<string>;
  toggleFavorite: (eventId: string, e?: React.MouseEvent) => void;
  /** Events on the active tab after search + favourites filters. */
  events: TradingEvent[];
  /** Wall clock, ticks once a minute, for the relative `Ends in` column. */
  now: number;
  /** Reset search + tab back to the terminal default (call on close). */
  reset: () => void;
}

/** Ticks once a minute so relative times stay honest without re-rendering every second. */
export const useMinuteTick = (): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};

export const useEventSelector = ({
  terminal,
  favorites: favoritesIn,
  toggleFavorite: toggleFavoriteIn,
}: UseEventSelectorOptions): UseEventSelectorReturn => {
  const { events: dbEvents, isLoading } = useActiveEvents();
  const [tab, setTab] = useState<ProductTab>(terminal);
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [ownFavorites, setOwnFavorites] = useState<Set<string>>(getStoredFavorites);
  const now = useMinuteTick();

  useEffect(() => {
    if (!favoritesIn) setStoredFavorites(ownFavorites);
  }, [ownFavorites, favoritesIn]);

  const toggleOwnFavorite = useCallback((eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOwnFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  const favorites = favoritesIn ?? ownFavorites;
  const toggleFavorite = toggleFavoriteIn ?? toggleOwnFavorite;

  const all = useMemo(() => dbEvents.map(dbEventToTradingEvent), [dbEvents]);

  const events = useMemo(() => {
    let result = all.filter((e) => eventOnTab(e.productLines, tab));
    if (showFavoritesOnly) result = result.filter((e) => favorites.has(e.id));
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((e) => e.name.toLowerCase().includes(q));
    return result;
  }, [all, tab, showFavoritesOnly, favorites, search]);

  const toggleShowFavoritesOnly = useCallback(() => setShowFavoritesOnly((v) => !v), []);
  const reset = useCallback(() => {
    setSearch("");
    setTab(terminal);
  }, [terminal]);

  return {
    isLoading,
    tab,
    setTab,
    search,
    setSearch,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
    favorites,
    toggleFavorite,
    events,
    now,
    reset,
  };
};
