// ============================================================
// LITE EVENTS — page opening + desktop filter row.
// Extracted verbatim from LiteEventsPage so the style guide can mount
// the SAME nodes production renders (no hand-copied markup).
// ============================================================
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { CategoryPill } from "@/components/lite/CategoryPill";
import {
  CalendarChip,
  TraitChip,
  WatchlistChip,
} from "@/components/lite/LiteListControls";
import { TOP_CATEGORIES } from "@/lib/taxonomy";

/** Intro strip — plain-language, no trader jargon; display treatment. */
export const LiteEventsGreeting = ({ isMobile }: { isMobile: boolean }) => (
  <div className={cn(!isMobile && "flex items-start justify-between gap-5")}>
    <div>
      <h1
        className="font-display font-bold tracking-tight text-foreground"
        style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
      >
        {t("events.screen.simple.events_simple_intro.what_do_you_think_happens_next")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("events.screen.simple.home.home_hero.how_to_trade")}
      </p>
    </div>
  </div>
);

/** Desktop filter row: topic pills · Boost trait · watchlist / calendar lenses. */
export const LiteEventsFilterRow = ({
  sector,
  onSelectSector,
  sectorCounts,
  sportsCount,
  sportsLive,
  calendarOn,
  boostOnly,
  onToggleBoost,
  watchlistActive,
  watchlistCount,
  onWatchlist,
  onCalendar,
}: {
  sector: string;
  onSelectSector: (id: string) => void;
  sectorCounts: Map<string, number>;
  sportsCount: number;
  sportsLive: boolean;
  calendarOn: boolean;
  boostOnly: boolean;
  onToggleBoost: () => void;
  watchlistActive: boolean;
  watchlistCount: number;
  onWatchlist: () => void;
  onCalendar: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 16 }}>
    {TOP_CATEGORIES.filter(
      (c) =>
        c.id === "all" ||
        c.id === "intraday" ||
        (c.id === "sports" ? sportsCount > 0 : sectorCounts.get(c.id)),
    ).map((c) => (
      <CategoryPill
        key={c.id}
        label={c.label}
        dot={c.dot}
        active={c.id === sector}
        live={c.id === "sports" && sportsLive}
        onClick={() => onSelectSector(c.id)}
      />
    ))}
    {/* View switches live at the right end of the category row. Boost is a
        FILTER, not a category — it sits with Watchlist / Calendar, never among
        the topic pills (H4, Liya 2026-11-09). It composes in place with every
        category view; only the calendar lens opts out. */}
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {!calendarOn && <TraitChip kind="boost" active={boostOnly} onClick={onToggleBoost} />}
      <WatchlistChip
        active={watchlistActive}
        count={watchlistCount}
        showLabel
        onClick={onWatchlist}
      />
      <CalendarChip active={calendarOn} onClick={onCalendar} />
    </div>
  </div>
);
