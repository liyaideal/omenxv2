import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useCategoryBoostConfigs } from "@/hooks/useCategoryBoostConfigs";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { cn } from "@/lib/utils";
import { LiteEventCard } from "@/components/lite/LiteEventCard";
import { TraitChip, WatchlistChip } from "@/components/lite/LiteListControls";
import { CalendarChip } from "@/components/lite/LiteListControls";
import { LiteCalendarView } from "@/components/lite/calendar/LiteCalendarView";
import { EmptyState } from "@/components/states";
import { sortLiteLiveList, trendingThreshold } from "@/lib/liteListBadges";
import {
  INTRADAY_SUBTYPES,
  type Timeframe,
  useIntradayStocks,
  useQuickRounds,
  useSecondTick,
} from "@/components/lite/intraday/intradayData";
import { LiteAllStage } from "@/components/lite/allstage/LiteAllStage";
import {
  LiteAllStageSkeleton,
  LiteMarketGridSkeleton,
  LiteMarketListSkeleton,
  LiteMobileStageSkeleton,
} from "@/components/lite/skeletons/LiteEventsSkeletons";
import { LiteMobileAllStage } from "@/components/lite/mobile/LiteMobileAllStage";
import { MobileCategoryRow } from "@/components/lite/mobile/MobileCategoryRow";
import { MobileIntradayModule } from "@/components/lite/mobile/MobileIntradayModule";
import { MobileSportsModule } from "@/components/lite/mobile/MobileSportsModule";
import { EditorPicksModule } from "@/components/lite/picks/EditorPicksModule";
import { useEditorPicks } from "@/components/lite/picks/editorialPicks";
import { SportsStageCard } from "@/components/lite/sports/SportsStageCard";
import { useSportsMatches } from "@/components/lite/sports/sportsData";
import { LiteIntradayView } from "@/components/lite/categoryviews/LiteIntradayView";
import { LiteSportsView } from "@/components/lite/categoryviews/LiteSportsView";
import { LiteCryptoView } from "@/components/lite/categoryviews/LiteCryptoView";
import { LiteFinanceView } from "@/components/lite/categoryviews/LiteFinanceView";
import { useSurface } from "@/contexts/SurfaceContext";
import { CategoryPill } from "@/components/lite/CategoryPill";
import {
  SECTOR_CATEGORIES,
  TOP_CATEGORIES,
  categoryMatchesTop,
  topCategoryForKey,
  topCategoryOrder,
} from "@/lib/taxonomy";

// Pill visual language lives in the shared CategoryPill module (v3 sizing).

/** Shared card grid — used flat and inside Boost category groups. */
const CardGrid = ({
  items,
  getBoostConfig,
  trendingCutoff,
}: {
  items: ReturnType<typeof useMarketListData>;
  getBoostConfig: (category: string) => { enabled: boolean; maxBoost: number };
  trendingCutoff: number;
}) => (
  <div className={cn("grid gap-[18px]", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
    {items.map((market, i) => {
      const cfg = getBoostConfig(market.category);
      return (
        <LiteEventCard
          key={market.id}
          market={market}
          index={i}
          boostMax={cfg.enabled ? cfg.maxBoost : null}
          trendingCutoff={trendingCutoff}
        />
      );
    })}
  </div>
);

const LiteEventsPage = () => {
  const navigate = useNavigate();
  const { setSurface } = useSurface();
  const isMobile = useIsMobile();
  const { events: dbEvents, isLoading } = useActiveEvents();
  const markets = useMarketListData(dbEvents);
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const { getConfig: getBoostConfig } = useCategoryBoostConfigs();
  const [authOpen, setAuthOpen] = useState(false);
  const [boostOnly, setBoostOnly] = useState(false);
  // Calendar is a lens on this page — a view state, never a route.
  const [calendarOn, setCalendarOn] = useState(false);

  // Non-sports markets pool ("All" and per-sector filter both operate here).
  // Intraday events live in the dedicated band above the grid, never in it.
  const openMarkets = useMemo(
    () =>
      markets.filter(
        (m) =>
          (m.category || "").toLowerCase() !== "sports" &&
          !INTRADAY_SUBTYPES.includes(
            (m.eventSubtype || "") as (typeof INTRADAY_SUBTYPES)[number],
          ),
      ),
    [markets],
  );

  // Only render sector pills for categories that actually have events.
  // Counts are keyed by TAXONOMY top-level id, so `stocks` + `finance`
  // events fold into the single "Finance" chip. They are computed over the
  // WHOLE live pool (intraday rounds included) — a vertical view owns both
  // its engine and its catalogue, so Finance must light up when the only
  // live finance markets are the daily stock rounds.
  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of markets) {
      const top = topCategoryForKey(m.category);
      if (!top) continue;
      counts.set(top.id, (counts.get(top.id) || 0) + 1);
    }
    return counts;
  }, [markets]);

  const availableSectors = useMemo(
    () => SECTOR_CATEGORIES.filter((s) => (sectorCounts.get(s.id) || 0) > 0),
    [sectorCounts],
  );

  // Campaign task CTAs land here with ?sector=<category> — deep-link the filter.
  const [searchParams] = useSearchParams();
  const [sector, setSector] = useState<string>(() => searchParams.get("sector") || "all");
  const isWatchlistView = sector === "watchlist";
  const isStageView = !calendarOn && !isMobile && sector === "all" && !boostOnly;
  const isIntradayView = !calendarOn && !isMobile && sector === "intraday";
  const isSportsView = !calendarOn && !isMobile && sector === "sports";
  // Mobile mirrors the same category-as-view IA (contract 11B).
  const isMobileStage = !calendarOn && !!isMobile && sector === "all" && !boostOnly;
  const isMobileIntraday = !calendarOn && !!isMobile && sector === "intraday";
  const isMobileSports = !calendarOn && !!isMobile && sector === "sports";
  // Crypto / Finance verticals — same component on both breakpoints.
  // Boost composes IN PLACE with the vertical views — the view stays mounted
  // and its engine/catalogue filter through the same boost predicate.
  const isCryptoView = !calendarOn && sector === "crypto";
  const isFinanceView = !calendarOn && sector === "finance";
  const [mobileTf, setMobileTf] = useState<Timeframe>("15m");
  // One-shot intent: the user tapped a "session open" row, so the Finance view
  // should scroll its rounds engine into view once after landing.
  const [scrollToEngine, setScrollToEngine] = useState(0);

  // Stage data — desktop only, and only for the views that render it.
  const stageActive =
    calendarOn ||
    (!isMobile && (isStageView || isIntradayView)) ||
    isMobileStage ||
    isMobileIntraday ||
    isCryptoView ||
    isFinanceView;
  const tickSeconds = useSecondTick();
  const { currentFor, historyFor, loading: roundsLoading } = useQuickRounds(stageActive);
  const { rows: stockRows, loading: stocksLoading } = useIntradayStocks(stageActive);
  const { rows: sportsMatches, loading: sportsLoading } = useSportsMatches();

  // First-load gates. A module only skeletons while its own hook is loading
  // AND it has nothing cached — a tab switch or a back-navigation with data
  // in hand renders the real content immediately (no skeleton flash).
  const eventsFirstLoad = isLoading && dbEvents.length === 0;
  const sportsFirstLoad = sportsLoading && sportsMatches.length === 0;
  const stageFirstLoad =
    (roundsLoading && currentFor.size === 0) ||
    (stocksLoading && stockRows.length === 0) ||
    sportsFirstLoad;
  /** A sports fixture is in play right now → the Sports pill pulses red. */
  const sportsLive = useMemo(
    () => sportsMatches.some((m) => m.live),
    [sportsMatches],
  );
  const { picks: editorPicks, updatedAt: picksUpdatedAt } = useEditorPicks();
  // Sports matches carry no per-event boost row — the category config is the
  // same predicate the card grid uses (enabled + at least 2x).
  const sportsBoostEnabled = useMemo(() => {
    const cfg = getBoostConfig("sports");
    return cfg.enabled && cfg.maxBoost >= 2;
  }, [getBoostConfig]);

  const filtered = useMemo(() => {
    if (isWatchlistView) {
      // Watchlist keeps the user's own order — no re-ranking.
      return openMarkets.filter((m) => watchlist.has(m.eventId));
    }
    let set =
      sector === "all"
        ? openMarkets
        : openMarkets.filter((m) => categoryMatchesTop(m.category, sector));
    if (boostOnly) {
      set = set.filter((m) => {
        const cfg = getBoostConfig(m.category);
        return cfg.enabled && cfg.maxBoost >= 2;
      });
    }
    // Same three-step rule for "All" and for each sector, scoped to the set.
    return sortLiteLiveList(set);
  }, [openMarkets, sector, watchlist, boostOnly, getBoostConfig, isWatchlistView]);

  // Trending cutoff is computed once from the whole live pool so a card's
  // badge doesn't flip when the user changes sector.
  const trendingCutoff = useMemo(() => trendingThreshold(openMarkets), [openMarkets]);

  // Boost is an IN-PLACE filter. With no category selected the filtered list
  // is grouped by category with small headers, in taxonomy order. Combined
  // with a category (Sports + Boost) it's a flat list — no headers needed.
  const boostGroups = useMemo(() => {
    if (!boostOnly || sector !== "all" || isWatchlistView) return null;
    const by = new Map<string, { id: string; label: string; items: typeof filtered }>();
    for (const m of filtered) {
      const top = topCategoryForKey(m.category);
      const id = top?.id ?? "other";
      const g = by.get(id) ?? { id, label: top?.label ?? "Other", items: [] };
      g.items.push(m);
      by.set(id, g);
    }
    return [...by.values()].sort(
      (a, b) => topCategoryOrder(a.id) - topCategoryOrder(b.id),
    );
  }, [filtered, boostOnly, sector, isWatchlistView]);

  const resetAll = () => {
    setSector("all");
    setBoostOnly(false);
  };

  const handleWatchlistClick = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    // Calendar and watchlist are mutually exclusive views.
    if (calendarOn) {
      setCalendarOn(false);
      setBoostOnly(false);
      setSector("watchlist");
      return;
    }
    if (isWatchlistView) {
      setSector("all");
      return;
    }
    // Trait toggles don't apply inside watchlist view.
    setBoostOnly(false);
    setSector("watchlist");
  };

  const handleCalendarClick = () => {
    setCalendarOn((v) => {
      const next = !v;
      if (next && isWatchlistView) setSector("all");
      return next;
    });
  };

  const traitChips = (
    <TraitChip kind="boost" active={boostOnly} onClick={() => setBoostOnly((v) => !v)} />
  );

  const watchlistStatusLine = (
    <div className="flex items-center gap-2" style={{ marginTop: 12, fontSize: 13 }}>
      <Star
        className="h-3.5 w-3.5"
        style={{ color: "#FFD23E", fill: "#FFD23E" }}
        strokeWidth={1.5}
      />
      <span style={{ color: "#C9CED6" }}>
        Your watchlist · {filtered.length} markets
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={resetAll}
        className="text-primary underline"
        style={{ textUnderlineOffset: 3 }}
      >
        Browse all
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isMobile ? (
        <MobileHeader showLogo showBack={false} />
      ) : (
        <EventsDesktopHeader />
      )}

      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 flex-col",
          isMobile ? "px-4 py-4" : "px-4 py-6 pb-24 lg:px-6",
        )}
        style={
          isMobile
            ? { paddingBottom: "calc(112px + env(safe-area-inset-bottom))" }
            : undefined
        }
      >
        {/* Intro strip — plain-language, no trader jargon; display treatment */}
        <div className={cn(!isMobile && "flex items-start justify-between gap-5")}>
          <div>
            <h1
              className="font-display font-bold tracking-tight text-foreground"
              style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
            >
              What do you think happens next?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a topic. Tap Yes or No. That's it.
            </p>
          </div>
        </div>

        {/* Filter row — mobile keeps the control row in every view (watchlist
            included), desktop still swaps it for the watchlist status line. */}
        {isWatchlistView && !calendarOn && !isMobile ? (
          (
            <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
              <div className="min-w-0 flex-1">{watchlistStatusLine}</div>
              <div className="flex shrink-0 items-center gap-2">
                <WatchlistChip
                  active
                  count={watchlist.size}
                  showLabel
                  onClick={handleWatchlistClick}
                />
                <CalendarChip
                  active={calendarOn}
                  onClick={handleCalendarClick}
                />
              </div>
            </div>
          )
        ) : isMobile ? (
          <div className="flex flex-col" style={{ marginTop: 12, gap: 10 }}>
            <MobileCategoryRow
              categories={[
                { id: "all", label: "All" },
                { id: "intraday", label: "Intraday", dot: "#FF8A3D" },
                ...(sportsMatches.length
                  ? [
                      {
                        id: "sports",
                        label: "Sports",
                        dot: "#FF3B4E",
                        pulse: sportsMatches.some((m) => m.live),
                      },
                    ]
                  : []),
                ...availableSectors.map((s) => ({ id: s.id, label: s.label })),
              ]}
              value={sector}
              onSelect={setSector}
              watchlistActive={isWatchlistView}
              watchlistCount={watchlist.size}
              onWatchlist={handleWatchlistClick}
              calendarActive={calendarOn}
              onCalendar={handleCalendarClick}
              boostActive={boostOnly}
              onBoost={() => setBoostOnly((v) => !v)}
            />
            {isWatchlistView && !calendarOn && watchlistStatusLine}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 16 }}>
            {TOP_CATEGORIES.filter(
              (c) =>
                c.id === "all" ||
                c.id === "intraday" ||
                (c.id === "sports" ? sportsMatches.length > 0 : sectorCounts.get(c.id)),
            ).map((c) => (
              <CategoryPill
                key={c.id}
                label={c.label}
                dot={c.dot}
                active={c.id === sector}
                live={c.id === "sports" && sportsLive}
                onClick={() => setSector(c.id)}
              />
            ))}
            {/* Boost composes in place with every category view (Intraday,
                Sports, Crypto, Finance) — only the calendar lens opts out. */}
            {!calendarOn && (
              <>
                <span
                  aria-hidden
                  style={{ width: 1, height: 22, background: "#1D2026", margin: "0 5px" }}
                />
                {traitChips}
              </>
            )}
            {/* View lenses live at the right end of the category row. */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <WatchlistChip
                active={isWatchlistView}
                count={watchlist.size}
                showLabel
                onClick={handleWatchlistClick}
              />
              <CalendarChip
                active={calendarOn}
                onClick={handleCalendarClick}
              />
            </div>
          </div>
        )}

        {/* Calendar lens — replaces the page body in place. */}
        {calendarOn && (
          <div style={{ marginTop: 20 }}>
            <LiteCalendarView
              events={openMarkets}
              matches={sportsMatches}
              stocks={stockRows}
              sector={sector}
              isMobile={!!isMobile}
              onBackToList={() => setCalendarOn(false)}
              onOpenIntraday={() => {
                setCalendarOn(false);
                // Desktop has a dedicated Intraday view; mobile surfaces the
                // Intraday band on the "All" list.
                setSector(isMobile ? "all" : "intraday");
              }}
            />
          </div>
        )}

        {/* Desktop "All stage" — category-as-view. */}
        {!calendarOn && isStageView && stageFirstLoad && <LiteAllStageSkeleton />}
        {!calendarOn && isStageView && !stageFirstLoad && (
          <LiteAllStage
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            matches={sportsMatches}
            tickSeconds={tickSeconds}
            onOpenIntraday={() => setSector("intraday")}
            onOpenSports={() => setSector("sports")}
          />
        )}

        {/* Intraday category view (contract 7A) — full width, desktop. */}
        {isIntradayView && (
          <LiteIntradayView
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            tickSeconds={tickSeconds}
            boostOnly={boostOnly}
          />
        )}

        {/* Sports category view (contract 7B) — full width, desktop. */}
        {isSportsView && (
          <LiteSportsView
            matches={sportsMatches}
            boostOnly={boostOnly}
            boostEnabled={sportsBoostEnabled}
          />
        )}

        {/* Crypto vertical view — engine (rounds) + catalogue. */}
        {isCryptoView && (
          <LiteCryptoView
            currentFor={currentFor}
            historyFor={historyFor}
            tickSeconds={tickSeconds}
            events={filtered}
            isMobile={!!isMobile}
            boostOnly={boostOnly}
            renderGrid={(items) => (
              <CardGrid
                items={items}
                getBoostConfig={getBoostConfig}
                trendingCutoff={trendingCutoff}
              />
            )}
          />
        )}

        {/* Finance vertical view — session engine + catalogue. */}
        {isFinanceView && (
          <LiteFinanceView
            stockRows={stockRows}
            tickSeconds={tickSeconds}
            events={filtered}
            isMobile={!!isMobile}
            boostOnly={boostOnly}
            scrollToEngine={scrollToEngine}
            renderGrid={(items) => (
              <CardGrid
                items={items}
                getBoostConfig={getBoostConfig}
                trendingCutoff={trendingCutoff}
              />
            )}
          />
        )}

        {/* Mobile "All" stage (contract 11B/11C) — Intraday · Sports · Picks. */}
        {isMobileStage && stageFirstLoad && <LiteMobileStageSkeleton />}
        {isMobileStage && !stageFirstLoad && (
          <LiteMobileAllStage
            currentFor={currentFor}
            historyFor={historyFor}
            stockRows={stockRows}
            matches={sportsMatches}
            tf={mobileTf}
            onSelectTf={setMobileTf}
            tickSeconds={tickSeconds}
            onOpenIntraday={() => setSector("intraday")}
            onOpenSports={() => setSector("sports")}
          />
        )}

        {/* Mobile category-as-view: Intraday / Sports full width. */}
        {isMobileIntraday && (
          <div style={{ marginTop: 18 }}>
            <MobileIntradayModule
              currentFor={currentFor}
              historyFor={historyFor}
              stockRows={stockRows}
              tf={mobileTf}
              onSelectTf={setMobileTf}
              tickSeconds={tickSeconds}
              onOpenIntraday={() => setSector("intraday")}
              onOpenSession={() => setSector("finance")}
              boostOnly={boostOnly}
            />
          </div>
        )}
        {isMobileSports && (
          <div style={{ marginTop: 18 }}>
            <MobileSportsModule
              matches={sportsMatches}
              filters
              boostOnly={boostOnly}
              boostEnabled={sportsBoostEnabled}
              onOpenAll={() => setSector("sports")}
            />
          </div>
        )}

        {/* Editor's picks — desktop All view, between Sports and the catalogue. */}
        {!calendarOn && isStageView && editorPicks.length > 0 && picksUpdatedAt && (
          <div style={{ marginTop: 24 }}>
            <EditorPicksModule picks={editorPicks} updatedAt={picksUpdatedAt} />
          </div>
        )}

        {/* Card grid */}
        <div className="mt-6 flex flex-1 flex-col gap-6">
        {!calendarOn && (isStageView || isMobileStage) && (
          <div className="flex items-start justify-between" style={{ padding: "6px 2px 0" }}>
            <div className="flex flex-col gap-[7px]">
              <span
                className="font-display"
                style={{
                  fontWeight: 700,
                  fontSize: 26,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                Will it happen?
              </span>
              <span style={{ fontSize: 13, color: "#9AA1AC" }}>
                Buy Yes or No on real-world outcomes. Winning shares pay $1.
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {filtered.length} open
            </span>
          </div>
        )}
        {calendarOn ? null : isCryptoView ||
          isFinanceView ||
          isIntradayView ||
          isSportsView ||
          isMobileIntraday ||
          isMobileSports ? null : eventsFirstLoad ? (
          isMobile ? (
            <LiteMarketListSkeleton />
          ) : (
            <LiteMarketGridSkeleton />
          )
        ) : isWatchlistView &&
          filtered.length === 0 ? (
          <EmptyState
            variant="page"
            title="Nothing starred yet"
            description="Tap the ★ on any market and it'll show up here."
            actionLabel="See all markets"
            onAction={resetAll}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="page"
            title="No open markets here right now"
            description="New markets land in this topic as they open. Check back soon."
            actionLabel="See all markets"
            onAction={resetAll}
          />
        ) : boostGroups ? (
          <div className="flex flex-col" style={{ gap: 26 }}>
            {boostGroups.map((g) => (
              <div key={g.id} className="flex flex-col" style={{ gap: 12 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#CFFF4A",
                      fontWeight: 700,
                    }}
                  >
                    {g.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{g.items.length}</span>
                  <span
                    aria-hidden
                    className="flex-1"
                    style={{ height: 1, background: "#1D2026" }}
                  />
                </div>
                <CardGrid
                  items={g.items}
                  getBoostConfig={getBoostConfig}
                  trendingCutoff={trendingCutoff}
                />
              </div>
            ))}
          </div>
        ) : (
          <CardGrid
            items={filtered}
            getBoostConfig={getBoostConfig}
            trendingCutoff={trendingCutoff}
          />
        )}

        {/* Pro escape hatch — plain-language, no big CTA. */}
        <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          Want charts and advanced trading tools?{" "}
          <button
            type="button"
            onClick={() => {
              // Switch surfaces in place (context + localStorage + profile),
              // then land on the Pro events page — no /settings detour.
              setSurface("pro");
              navigate("/events");
            }}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Switch to Pro mode
          </button>
        </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      {isMobile && <BottomNav />}
    </div>
  );
};

export default LiteEventsPage;
