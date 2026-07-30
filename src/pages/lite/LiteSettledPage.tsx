// ============================================================
// /resolved (surface=lite) — the Lite settled markets browser.
// Same scaffold as LiteEventsPage; reuses useResolvedEvents unchanged.
// Consumer wording only.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { useResolvedEvents, type ResolvedEvent } from "@/hooks/useResolvedEvents";
import { useUserProfile } from "@/hooks/useUserProfile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SPORTS_LINK } from "@/lib/worldCup";
import { LiteSettledCard } from "@/components/lite/LiteSettledCard";
import { LiveSettledSwitch } from "@/components/lite/LiveSettledSwitch";
import {
  LiteSettledSeriesCard,
  LiteSettledSeriesDayRow,
  companyOf,
  isDailyStockEvent,
  tickerOf,
  type SettledSeries,
} from "@/components/lite/LiteSettledSeriesCard";

const SECTOR_ORDER: Array<{ id: string; label: string }> = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "macro", label: "Macro" },
  { id: "tech", label: "Tech" },
  { id: "entertainment", label: "Entertainment" },
];

const PILL_ACTIVE = "bg-white text-[#0A0B0D] font-semibold";
const PILL_IDLE =
  "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground";

type Bucket = { key: string; label: string; events: ResolvedEvent[] };

const bucketOf = (settledAt: string | null): string => {
  if (!settledAt) return "earlier";
  const d = new Date(settledAt);
  if (isNaN(d.getTime())) return "earlier";
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days <= 7) return "week";
  return "earlier";
};

const BUCKET_ORDER: Array<{ key: string; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "earlier", label: "Earlier" },
];

const LiteSettledPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useUserProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sector, setSector] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(20);
  const [authOpen, setAuthOpen] = useState(false);

  const scope = searchParams.get("view") === "mine" ? "mine" : "all";
  const seriesParam = searchParams.get("series");
  const { data: events = [], isLoading } = useResolvedEvents();

  const setScope = (next: "all" | "mine") => {
    if (next === "mine" && !user) {
      setAuthOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (next === "mine") params.set("view", "mine");
    else params.delete("view");
    setSearchParams(params, { replace: true });
    setDisplayCount(20);
  };

  const pool = useMemo(
    () => events.filter((e) => (e.category || "").toLowerCase() !== "sports"),
    [events],
  );

  const availableSectors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of pool) {
      const c = (e.category || "").toLowerCase();
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return SECTOR_ORDER.filter((s) => (counts.get(s.id) || 0) > 0);
  }, [pool]);

  const filtered = useMemo(() => {
    let rows = pool.filter((e) => !isDailyStockEvent(e));
    if (sector !== "all")
      rows = rows.filter((e) => (e.category || "").toLowerCase() === sector);
    if (scope === "mine") rows = rows.filter((e) => e.userParticipated);
    return rows;
  }, [pool, sector, scope]);

  // Daily up/down stock events collapse into one series per ticker.
  const seriesList: SettledSeries[] = useMemo(() => {
    if (sector !== "all" && sector !== "stocks") return [];
    const byTicker = new Map<string, ResolvedEvent[]>();
    for (const e of pool) {
      if (!isDailyStockEvent(e)) continue;
      const t = tickerOf(e);
      const list = byTicker.get(t) || [];
      list.push(e);
      byTicker.set(t, list);
    }
    const ts = (e: ResolvedEvent) =>
      e.settled_at ? new Date(e.settled_at).getTime() : 0;
    const out: SettledSeries[] = [];
    byTicker.forEach((days, ticker) => {
      const sorted = [...days].sort((a, b) => ts(b) - ts(a));
      const mine = sorted.find((d) => d.userParticipated);
      out.push({
        ticker,
        company: companyOf(ticker, sorted[0]),
        days: sorted,
        userResult: mine ? mine.userPnl ?? 0 : null,
      });
    });
    return out
      .filter((s) => (scope === "mine" ? s.userResult !== null : true))
      .sort((a, b) => ts(b.days[0]) - ts(a.days[0]));
  }, [pool, sector, scope]);

  const activeSeries = seriesParam
    ? seriesList.find((s) => s.ticker === seriesParam) ??
      (() => {
        const days = pool
          .filter((e) => isDailyStockEvent(e) && tickerOf(e) === seriesParam)
          .sort(
            (a, b) =>
              new Date(b.settled_at ?? 0).getTime() -
              new Date(a.settled_at ?? 0).getTime(),
          );
        if (days.length === 0) return undefined;
        const mine = days.find((d) => d.userParticipated);
        return {
          ticker: seriesParam,
          company: companyOf(seriesParam, days[0]),
          days,
          userResult: mine ? mine.userPnl ?? 0 : null,
        } as SettledSeries;
      })()
    : undefined;

  const openSeries = (ticker: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("series", ticker);
    setSearchParams(params, { replace: false });
    setDisplayCount(20);
  };

  const closeSeries = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("series");
    setSearchParams(params, { replace: false });
    setDisplayCount(20);
  };

  const seriesDays = useMemo(() => {
    if (!activeSeries) return [];
    return scope === "mine"
      ? activeSeries.days.filter((d) => d.userParticipated)
      : activeSeries.days;
  }, [activeSeries, scope]);

  const shown = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  const groups: Bucket[] = useMemo(() => {
    const ts = (e: ResolvedEvent) =>
      e.settled_at ? new Date(e.settled_at).getTime() : 0;
    return BUCKET_ORDER.map(({ key, label }) => ({
      key,
      label,
      events: shown
        .filter((e) => bucketOf(e.settled_at) === key)
        .sort((a, b) => {
          if (a.userParticipated !== b.userParticipated)
            return a.userParticipated ? -1 : 1;
          return ts(b) - ts(a);
        }),
    })).filter((g) => g.events.length > 0);
  }, [shown]);

  const emptyCopy =
    scope === "mine"
      ? "Nothing settled for you yet. Back a live market and it'll show up here when it wraps."
      : sector !== "all"
        ? `Nothing settled in ${
            SECTOR_ORDER.find((s) => s.id === sector)?.label ?? sector
          } yet. Try All.`
        : "Nothing has settled yet. Markets land here when they wrap up.";

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileHeader title="Settled" /> : <EventsDesktopHeader />}

      <div
        className={cn(
          "mx-auto w-full max-w-7xl pb-24",
          isMobile ? "px-4 py-4" : "px-4 py-6 lg:px-6",
        )}
      >
        {activeSeries ? (
          <>
            <button
              type="button"
              onClick={closeSeries}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              ← All settled
            </button>
            <div className="mb-6 mt-3">
              <h1
                className="font-display font-bold tracking-tight text-foreground"
                style={{ fontSize: "clamp(24px, 3.5vw, 34px)", lineHeight: 1.05 }}
              >
                {activeSeries.company} ({activeSeries.ticker}) — daily close
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Every day this stock has settled. Newest first.
              </p>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={cn(
                  "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
                  scope === "all" ? PILL_ACTIVE : PILL_IDLE,
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setScope("mine")}
                className={cn(
                  "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
                  scope === "mine" ? PILL_ACTIVE : PILL_IDLE,
                )}
              >
                My results
              </button>
            </div>

            {seriesDays.length === 0 ? (
              <EmptyState
                title="You haven't backed a day of this one yet"
                description="Back a live day and your result shows up here once it wraps."
                actionLabel="See live markets"
                onAction={() => navigate("/events")}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-2">
                {seriesDays.slice(0, displayCount).map((d) => (
                  <LiteSettledSeriesDayRow
                    key={d.id}
                    event={d}
                    onSelect={(id) => navigate(`/resolved/${id}`)}
                  />
                ))}
              </div>
            )}
            {seriesDays.length > displayCount && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => setDisplayCount((n) => n + 20)}
                  className="rounded-xl border border-border px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
        <>
        <div className="mb-6">
          <h1
            className="font-display font-bold tracking-tight text-foreground"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.05 }}
          >
            How it all turned out
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every market here is finished and paid out. Tap one to see the proof.
          </p>
        </div>

        {/* Sector rail + Live/Settled switch */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSector("all")}
              className={cn(
                "shrink-0 rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
                sector === "all" ? PILL_ACTIVE : PILL_IDLE,
              )}
            >
              All
            </button>
            {availableSectors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSector(s.id)}
                className={cn(
                  "shrink-0 rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
                  sector === s.id ? PILL_ACTIVE : PILL_IDLE,
                )}
              >
                {s.label}
              </button>
            ))}
            <a
              href={SPORTS_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-[#2B2F38] px-[18px] py-[9px] text-[13px] text-[#C9CED6] transition-colors hover:text-foreground"
            >
              Sports
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <LiveSettledSwitch
            className="shrink-0"
            value="settled"
            onSelect={(v) => {
              if (v === "live") navigate("/events");
            }}
          />
        </div>

        {/* Scope pills */}
        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={cn(
              "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
              scope === "all" ? PILL_ACTIVE : PILL_IDLE,
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setScope("mine")}
            className={cn(
              "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
              scope === "mine" ? PILL_ACTIVE : PILL_IDLE,
            )}
          >
            My results
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 && seriesList.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyCopy}
            actionLabel="See live markets"
            onAction={() => navigate("/events")}
          />
        ) : (
          <div className="space-y-8">
            {seriesList.length > 0 && (
              <div>
                <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Daily stocks
                </div>
                <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
                  {seriesList.map((s) => (
                    <LiteSettledSeriesCard
                      key={s.ticker}
                      series={s}
                      onSelect={openSeries}
                    />
                  ))}
                </div>
              </div>
            )}
            {groups.map((g) => (
              <div key={g.key}>
                <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {g.label}
                </div>
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {g.events.map((e) => (
                    <LiteSettledCard
                      key={e.id}
                      event={e}
                      onSelect={(id) => navigate(`/resolved/${id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setDisplayCount((n) => n + 20)}
                  className="rounded-xl border border-border px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Want charts, leverage and the order book?{" "}
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Switch to Pro mode
          </button>
        </div>
        </>
        )}
      </div>

      {isMobile && <BottomNav />}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default LiteSettledPage;
