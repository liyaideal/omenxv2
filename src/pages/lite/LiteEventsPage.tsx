import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Loader2, Star } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { cn } from "@/lib/utils";
import { SPORTS_LINK } from "@/lib/worldCup";
import { LiteEventCard } from "@/components/lite/LiteEventCard";
import { LiveSettledSwitch } from "@/components/lite/LiveSettledSwitch";
import { EmptyState } from "@/components/states";

// Data-driven sector rail. Filters on the RAW event category (lowercase DB
// value) so "Stocks" surfaces the us-*-updown spot events (category='stocks')
// rather than the Tech/Finance categoryLabel bucket.
const SECTOR_ORDER: Array<{ id: string; label: string }> = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "macro", label: "Macro" },
  { id: "tech", label: "Tech" },
  { id: "entertainment", label: "Entertainment" },
  { id: "politics", label: "Politics" },
  { id: "finance", label: "Finance" },
  { id: "social", label: "Social" },
];

// Single source of truth for the pill visual language on this page.
const PILL_BASE =
  "shrink-0 rounded-full px-[18px] py-[9px] text-[13px] transition-colors";
const PILL_ACTIVE = "bg-white text-[#0A0B0D] font-semibold";
const PILL_IDLE =
  "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground";

const LiteEventsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events: dbEvents, isLoading } = useActiveEvents();
  const markets = useMarketListData(dbEvents);
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const [authOpen, setAuthOpen] = useState(false);

  // Non-sports markets pool ("All" and per-sector filter both operate here).
  const openMarkets = useMemo(
    () => markets.filter((m) => (m.category || "").toLowerCase() !== "sports"),
    [markets],
  );

  // Only render sector pills for categories that actually have events.
  const availableSectors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of openMarkets) {
      const c = (m.category || "").toLowerCase();
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return SECTOR_ORDER.filter((s) => (counts.get(s.id) || 0) > 0);
  }, [openMarkets]);

  const [sector, setSector] = useState<string>("all");

  const filtered = useMemo(() => {
    if (sector === "watchlist") {
      return openMarkets.filter((m) => watchlist.has(m.eventId));
    }
    if (sector === "all") return openMarkets;
    return openMarkets.filter((m) => (m.category || "").toLowerCase() === sector);
  }, [openMarkets, sector, watchlist]);

  const handleSectorClick = (id: string) => setSector(id);

  const handleWatchlistClick = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSector("watchlist");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isMobile ? (
        <MobileHeader showLogo showBack={false} />
      ) : (
        <EventsDesktopHeader />
      )}

      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 pb-24",
          isMobile ? "px-4 py-4" : "px-4 py-6 lg:px-6",
        )}
      >
        {/* Intro strip — plain-language, no trader jargon; display treatment */}
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

        {/* Sector rail + Live/Settled switch. Rail scrolls; switch never gets pushed off. */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {(() => {
            const active = sector === "all";
            return (
              <button
                type="button"
                onClick={() => handleSectorClick("all")}
                className={cn(PILL_BASE, active ? PILL_ACTIVE : PILL_IDLE)}
              >
                All
              </button>
            );
          })()}
          {availableSectors.map((s) => {
            const active = s.id === sector;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSectorClick(s.id)}
                className={cn(PILL_BASE, active ? PILL_ACTIVE : PILL_IDLE)}
              >
                {s.label}
              </button>
            );
          })}
          {/* Watchlist pill renders for everyone — it is the teaching moment. */}
          <button
            type="button"
            onClick={handleWatchlistClick}
            className={cn(
              PILL_BASE,
              "flex items-center gap-1.5",
              sector === "watchlist" ? PILL_ACTIVE : PILL_IDLE,
            )}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                sector === "watchlist"
                  ? "fill-[#0A0B0D] text-[#0A0B0D]"
                  : "text-trading-yellow",
              )}
              strokeWidth={1.5}
            />
            Watchlist
          </button>
          <a
            href={SPORTS_LINK}
            target="_blank"
            rel="noreferrer"
            className={cn(PILL_BASE, PILL_IDLE, "flex items-center gap-1")}
          >
            Sports
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          </div>
          <LiveSettledSwitch
            className="shrink-0"
            value="live"
            onSelect={(v) => {
              if (v === "settled") navigate("/resolved");
            }}
          />
        </div>

        {/* Card grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sector === "watchlist" && filtered.length === 0 ? (
          <EmptyState
            variant="page"
            title="Nothing starred yet"
            description="Tap the ★ on any market and it'll show up here."
            actionLabel="See all markets"
            onAction={() => setSector("all")}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="page"
            title="No open markets here right now"
            description="New markets land in this topic as they open. Check back soon."
            actionLabel="See all markets"
            onAction={() => setSector("all")}
          />
        ) : (
          <div
            className={cn(
              "grid gap-[18px]",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {filtered.map((market) => (
              <LiteEventCard key={market.id} market={market} />
            ))}
          </div>
        )}

        {/* Pro escape hatch — plain-language, no big CTA. */}
        <div className="pt-2 text-center text-xs text-muted-foreground">
          Want charts, leverage and the order book?{" "}
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Switch to Pro mode
          </button>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      {isMobile && <BottomNav />}
    </div>
  );
};

export default LiteEventsPage;