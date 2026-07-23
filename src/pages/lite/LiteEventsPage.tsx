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

// Sector rail — Lite uses plain, trader-jargon-free labels. Sports is an
// external redirect (opens the Sports app) instead of an in-app filter.
type SectorId = "stocks" | "crypto" | "macro" | "entertainment";

interface Sector {
  id: SectorId;
  label: string;
  categories: string[]; // categoryLabel values from useMarketListData
}

const SECTORS: Sector[] = [
  { id: "stocks", label: "Stocks", categories: ["Finance", "Tech"] },
  { id: "crypto", label: "Crypto", categories: ["Crypto"] },
  { id: "macro", label: "Macro", categories: ["Politics"] },
  { id: "entertainment", label: "Entertainment", categories: ["Entertainment", "Social"] },
];

const LiteEventsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events: dbEvents, isLoading } = useActiveEvents();
  const markets = useMarketListData(dbEvents);

  const [sector, setSector] = useState<SectorId>("stocks");
  const activeSector = SECTORS.find((s) => s.id === sector)!;

  const filtered = useMemo(() => {
    return markets.filter((m) => activeSector.categories.includes(m.categoryLabel));
  }, [markets, activeSector]);

  const handleSectorClick = (id: SectorId) => setSector(id);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader preset="feed" title="Markets" />
      ) : (
        <EventsDesktopHeader />
      )}

      <div className={cn("mx-auto w-full max-w-6xl px-4 pb-24 pt-6", isMobile ? "px-3 pt-3" : "px-8 pt-8") }>
        {/* Intro strip — plain-language, no trader jargon */}
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            What do you think happens next?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a topic. Tap Yes or No. That's it.
          </p>
        </div>

        {/* Sector rail */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {SECTORS.map((s) => {
            const active = s.id === sector;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSectorClick(s.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground",
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
            className={cn(
              "flex items-center gap-1 rounded-full border border-border/60 px-4 py-1.5",
              "text-sm font-medium text-muted-foreground transition-colors",
              "hover:border-border hover:text-foreground",
            )}
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
              No open markets in {activeSector.label} right now. Check back soon.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3",
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