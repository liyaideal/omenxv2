import { useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData } from "@/hooks/useMarketListData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useHotMarkets, HotBucket } from "@/hooks/useHotMarkets";
import { MarketCardB } from "@/components/events/MarketCardB";
import { cn } from "@/lib/utils";

interface HomeTopEventsProps {
  /** Optional slot rendered between the 2nd and 3rd card (e.g. trial CTA). */
  interlude?: ReactNode;
  /** Override section title. */
  title?: string;
}

const CHIPS: { id: HotBucket; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "closingSoon", label: "Closing Soon" },
];

const MAX = 8;

/**
 * Top Events module — shares the same bucket logic as the /events Hot tab via
 * `useHotMarkets`. Three single-select chips: All / Trending / Closing Soon.
 */
export const HomeTopEvents = ({ interlude, title = "Top Events" }: HomeTopEventsProps) => {
  const navigate = useNavigate();
  const { events, isLoading } = useActiveEvents();
  const rows = useMarketListData(events);
  const { isWatched, toggle } = useWatchlist();
  const buckets = useHotMarkets(rows);

  const [bucket, setBucket] = useState<HotBucket>("all");

  const filtered = useMemo(() => buckets[bucket].slice(0, MAX), [buckets, bucket]);

  return (
    <section>
      {/* Title */}
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <h2 className="text-[18px] font-extrabold uppercase tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {/* Bucket chips */}
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map((chip) => {
          const active = chip.id === bucket;
          return (
            <button
              key={chip.id}
              onClick={() => setBucket(chip.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/40 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {isLoading && filtered.length === 0 ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[140px] animate-pulse rounded-2xl border border-border/40 bg-card/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/40 bg-card/30 px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            No markets in this view right now.
          </p>
          <button
            onClick={() => setBucket("all")}
            className="mt-2 text-[12px] font-semibold text-primary hover:underline"
          >
            Reset to All
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((m, i) => (
            <div key={m.id}>
              {i === 2 && interlude && <div className="mb-2.5">{interlude}</div>}
              <div
                className="animate-fade-in motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(i, 6) * 35}ms`, animationFillMode: "both" }}
              >
                <MarketCardB
                  market={m}
                  isWatched={isWatched(m.eventId)}
                  onToggleWatch={(e) => toggle(m.eventId, e)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate("/events")}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card-hover hover:border-border/70"
      >
        Browse all markets
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </section>
  );
};
