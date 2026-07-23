import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SPORTS_LINK } from "@/lib/worldCup";
import { LiteEventCard } from "@/components/lite/LiteEventCard";

// Data-driven sector rail. Filters on the RAW event category (lowercase DB
// value) so "Stocks" surfaces the us-*-updown spot events (category='stocks')
// rather than the Tech/Finance categoryLabel bucket.
const SECTOR_ORDER: Array<{ id: string; label: string }> = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "macro", label: "Macro" },
  { id: "tech", label: "Tech" },
  { id: "entertainment", label: "Entertainment" },
];

const LiteEventsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events: dbEvents, isLoading } = useActiveEvents();
  const markets = useMarketListData(dbEvents);

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
    if (sector === "all") return openMarkets;
    return openMarkets.filter((m) => (m.category || "").toLowerCase() === sector);
  }, [openMarkets, sector]);

  const handleSectorClick = (id: string) => setSector(id);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader title="Markets" />
      ) : (
        <EventsDesktopHeader />
      )}

      <div className={cn("mx-auto w-full max-w-6xl px-4 pb-24 pt-6", isMobile ? "px-3 pt-3" : "px-8 pt-8") }>
        {/* Intro strip — plain-language, no trader jargon; display treatment */}
        <div className="mb-6">
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

        {/* Sector rail — mock pill row: white solid active, ghost border inactive */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(() => {
            const active = sector === "all";
            return (
              <button
                type="button"
                onClick={() => handleSectorClick("all")}
                className={cn(
                  "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
                  active
                    ? "bg-white text-[#0A0B0D] font-semibold"
                    : "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground",
                )}
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
                className={cn(
                  "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
                  active
                    ? "bg-white text-[#0A0B0D] font-semibold"
                    : "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            );
          })}
          <a
            href={SPORTS_LINK}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-full border-[1.5px] border-[#2B2F38] px-[18px] py-[9px] text-[13px] text-[#C9CED6] transition-colors hover:text-foreground"
          >
            Sports
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Card grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No open markets here right now. Check back soon.
            </p>
          </div>
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
      </div>

      {isMobile && <BottomNav />}
    </div>
  );
};

export default LiteEventsPage;