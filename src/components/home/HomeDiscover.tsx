import { useNavigate } from "react-router-dom";
import { Loader2, Flame, Flag, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/home/SectionHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePositions } from "@/hooks/usePositions";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { getCategoryFromName } from "@/lib/categoryUtils";
import { getDisplayOptionLabel, parseSideLabels, getBinaryOutcome } from "@/lib/eventUtils";

const getCountdown = (endTime: Date) => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
};

interface CompactMarketCardProps {
  event: ReturnType<typeof useActiveEvents>["events"][number];
  onTrade: () => void;
  highlight?: boolean;
}

const CompactMarketCard = ({ event, onTrade, highlight }: CompactMarketCardProps) => {
  const endDate = event.end_date ? new Date(event.end_date) : new Date();
  const countdown = getCountdown(endDate);
  const categoryInfo = getCategoryFromName(event.name);
  const visibleOptions = event.options.slice(0, 2);
  const moreCount = event.options.length - visibleOptions.length;
  const sideLabels = parseSideLabels(event.side_labels);

  return (
    <div
      className={`rounded-xl border bg-card p-3 space-y-2 cursor-pointer hover:bg-card-hover transition-colors ${
        highlight ? "border-trading-yellow/30" : "border-border/40"
      }`}
      onClick={onTrade}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {categoryInfo.label}
        <span className="mx-1.5 opacity-40">·</span>
        <span className={highlight ? "text-trading-yellow" : ""}>{countdown}</span>
      </p>

      <div className="flex items-start justify-between gap-2">
        <h4 className="flex-1 text-[13px] font-medium text-foreground line-clamp-2 leading-snug">
          {event.name}
        </h4>
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs bg-trading-green hover:bg-trading-green/90 text-white flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onTrade();
          }}
        >
          Trade
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex min-w-0 items-center gap-2 truncate text-muted-foreground">
          {visibleOptions.map((option, i) => (
            <span key={option.id} className="truncate">
              <span className="text-foreground/80">
                {getDisplayOptionLabel(option.label, event.options, sideLabels)}
              </span>{" "}
              <span className="font-mono font-semibold text-foreground">
                ${option.price.toFixed(2)}
              </span>
              {i < visibleOptions.length - 1 && <span className="ml-2 opacity-40">·</span>}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="font-mono text-muted-foreground/70">+{moreCount}</span>
          )}
        </div>
        <span className="flex-shrink-0 font-mono text-muted-foreground">
          Vol {event.volume || "$0"}
        </span>
      </div>
    </div>
  );
};

export const HomeDiscover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { positions } = usePositions();
  const { events: dbEvents, isLoading: isLoadingEvents } = useActiveEvents();

  const settlementSoon = dbEvents
    .filter((e) => e.end_date && new Date(e.end_date).getTime() > Date.now())
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 1);

  return (
    <div className="space-y-5">
      {user && positions.length > 0 && (
        <section>
          <SectionHeader
            icon={Wallet}
            tone="trading-purple"
            eyebrow="Portfolio"
            title="My positions"
            rightSlot={
              <button
                onClick={() => navigate("/trade/order", { state: { tab: "Positions" } })}
                className="flex flex-shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary"
              >
                <span className="font-mono text-muted-foreground/80">{positions.length}</span>
                <span className="opacity-40">·</span>
                View all
              </button>
            }
          />
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory">
            {positions.slice(0, 5).map((position, index) => {
              const isProfit = position.pnl.startsWith("+");
              const isLong = position.type === "long";
              const outcome = getBinaryOutcome(position.option);
              const optionDisplay = (position as any).displayOption ?? position.option;
              // binary 单 market: 方向由 option(Yes/No) 决定，颜色随 outcome；多 outcome: 沿用 long/short → Yes/No
              const colorClass = outcome === "yes"
                ? "bg-trading-green text-trading-green"
                : outcome === "no"
                ? "bg-trading-red text-trading-red"
                : isLong
                ? "bg-trading-green text-trading-green"
                : "bg-trading-red text-trading-red";
              const [bgClass, textClass] = colorClass.split(" ");
              const sideLabel = outcome
                ? optionDisplay
                : isLong ? "Yes" : "No";
              return (
                <div
                  key={index}
                  className="flex-shrink-0 w-[220px] snap-start cursor-pointer rounded-xl border border-border/40 bg-card p-3 space-y-2 transition-colors hover:bg-card-hover"
                  onClick={() => navigate("/trade/order", { state: { tab: "Positions", highlightPosition: index } })}
                >
                  <p className="text-[13px] font-medium text-foreground line-clamp-1">
                    {position.event}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${bgClass}`} />
                    <span className={`font-mono uppercase tracking-wider truncate max-w-[140px] ${textClass}`}>
                      {sideLabel}
                    </span>
                    {!outcome && (
                      <>
                        <span className="opacity-40">·</span>
                        <span className="truncate">{position.option}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className={`font-mono text-[15px] font-semibold leading-tight ${isProfit ? "text-trading-green" : "text-trading-red"}`}>
                        {position.pnl}
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        Unrealized
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-[15px] font-semibold leading-tight ${isProfit ? "text-trading-green" : "text-trading-red"}`}>
                        {position.pnlPercent}
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        ROI
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          icon={Flame}
          tone="trading-red"
          eyebrow="Trending"
          title="Hot markets"
          actionLabel="More"
          onAction={() => navigate("/events")}
        />

        {isLoadingEvents ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Loading markets…
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {dbEvents.slice(0, 4).map((event) => (
              <CompactMarketCard
                key={event.id}
                event={event}
                onTrade={() => navigate(`/trade?event=${event.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          icon={Flag}
          tone="trading-yellow"
          eyebrow="Expiring soon"
          title="Settlement"
        />

        {isLoadingEvents ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-trading-yellow" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Loading markets…
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {settlementSoon.map((event) => (
              <CompactMarketCard
                key={event.id}
                event={event}
                onTrade={() => navigate(`/trade?event=${event.id}`)}
                highlight
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
