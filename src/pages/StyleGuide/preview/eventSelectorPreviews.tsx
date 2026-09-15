// ============================================================
// ES-1 · Trading-terminal event selector — style-guide fixtures.
//
// Mounts the PRODUCTION `EventSelectorDropdown` / `EventSelectorSheet` with a
// fixed clock and a fixed event list, so the `Ends in` column shows every
// format at once (<1m / 8m / 3h 12m / 2d 14h / date / Frozen).
// ============================================================
import { useState } from "react";
import { EventSelectorDropdown } from "@/components/EventSelectorPanel";
import { EventSelectorSheet } from "@/components/EventSelectorSheet";
import type { TradingEvent } from "@/hooks/useEvents";
import type { UseEventSelectorReturn } from "@/hooks/useEventSelector";
import { eventOnTab, type ProductTab } from "@/lib/eventSelector";

const NOW = new Date("2026-09-15T09:30:00Z").getTime();
const at = (ms: number) => new Date(NOW + ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const ev = (
  id: string,
  name: string,
  endIn: number,
  volume: string,
  productLines: string[],
  freezeIn?: number,
): TradingEvent => ({
  id,
  name,
  icon: "",
  ends: "",
  endTime: at(endIn),
  period: "",
  volume,
  description: "",
  rules: [],
  sourceUrl: "",
  sourceName: "",
  resolutionSource: "",
  productLines,
  freezeTime: freezeIn != null ? at(freezeIn) : null,
});

export const EVENTS: TradingEvent[] = [
  ev("sg-btc-round", "BTC · Up or down?", 8 * MIN + 41_000, "$803K", ["spot"]),
  ev("sg-hk-0700", "0700.HK · Up or down?", 42 * MIN, "$1.12M", ["spot"]),
  ev("sg-tsla", "TSLA · Up or down?", 3 * HOUR + 12 * MIN, "$2.31M", ["spot"]),
  ev("sg-eth-round", "ETH · Up or down?", 30_000, "$412K", ["spot"]),
  ev("sg-nvda", "NVDA · Up or down?", 6 * HOUR, "$1.87M", ["spot"], -2 * MIN),
  ev("sg-fed", "Fed decision · September 2026", 2 * DAY + 14 * HOUR, "$4.2M", ["futures"]),
  ev("sg-derby", "Shanghai Port vs Shandong Taishan", 1 * HOUR + 36 * MIN, "$2.45M", ["futures"]),
  ev("sg-btc-120k", "Will Bitcoin close above $120,000 by end of month?", 16 * DAY, "$1.35M", ["futures", "spot"]),
  ev("sg-elon", "Does @elonmusk post 250+ times this week?", 5 * DAY + 3 * HOUR, "$819K", ["futures"]),
  ev("sg-cpi", "Will September CPI come in under 3.0% YoY?", 25 * DAY, "$687K", ["futures"]),
];

type Fixture = {
  tab: ProductTab;
  favorites?: string[];
  favoritesOnly?: boolean;
  search?: string;
  currentEventId?: string;
};

const useFixtureSelector = (f: Fixture): UseEventSelectorReturn => {
  const [tab, setTab] = useState<ProductTab>(f.tab);
  const [search, setSearch] = useState(f.search ?? "");
  const [favoritesOnly, setFavoritesOnly] = useState(!!f.favoritesOnly);
  const [favorites, setFavorites] = useState(() => new Set(f.favorites ?? []));
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const q = search.trim().toLowerCase();
  const events = EVENTS.filter((e) => eventOnTab(e.productLines, tab))
    .filter((e) => !favoritesOnly || favorites.has(e.id))
    .filter((e) => !q || e.name.toLowerCase().includes(q));
  return {
    isLoading: false,
    tab,
    setTab,
    search,
    setSearch,
    showFavoritesOnly: favoritesOnly,
    toggleShowFavoritesOnly: () => setFavoritesOnly((v) => !v),
    favorites,
    toggleFavorite,
    events,
    now: NOW,
    reset: () => {
      setSearch("");
      setTab(f.tab);
    },
  };
};

const Dropdown = (f: Fixture) => {
  const s = useFixtureSelector(f);
  return (
    <div style={{ position: "relative", height: 460, width: 520 }}>
      <EventSelectorDropdown
        className="mt-0 top-0"
        tab={s.tab}
        onTabChange={s.setTab}
        search={s.search}
        onSearchChange={s.setSearch}
        showFavoritesOnly={s.showFavoritesOnly}
        onToggleFavoritesOnly={s.toggleShowFavoritesOnly}
        favorites={s.favorites}
        onToggleFavorite={s.toggleFavorite}
        events={s.events}
        currentEventId={f.currentEventId}
        onSelect={() => undefined}
        now={s.now}
      />
    </div>
  );
};

/** ES-D1 · Standard tab (spot line) — every `Ends in` format + Frozen. */
export const EventSelectorStandard = () => <Dropdown tab="standard" currentEventId="sg-btc-round" favorites={["sg-tsla"]} />;

/** ES-D2 · Boost tab (contract line), opened from /spot — no current row. */
export const EventSelectorBoost = () => <Dropdown tab="boost" favorites={["sg-derby"]} />;

/** ES-D3 · Favourites filter on, nothing starred. */
export const EventSelectorFavoritesEmpty = () => <Dropdown tab="boost" favoritesOnly />;

/** ES-D4 · Search with no match. */
export const EventSelectorSearchEmpty = () => <Dropdown tab="standard" search="xyz" />;

/** ES-M1 · Mobile drawer (375), Standard tab. viewport-fixed — own frame. */
export const EventSelectorDrawer = () => {
  const s = useFixtureSelector({ tab: "standard", currentEventId: "sg-btc-round", favorites: ["sg-tsla"] });
  return (
    <div style={{ width: 375, height: 640 }}>
      <EventSelectorSheet open onOpenChange={() => undefined} selector={s} currentEventId="sg-btc-round" onSelect={() => undefined} />
    </div>
  );
};
