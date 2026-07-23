import { useNavigate } from "react-router-dom";
import { EventRow } from "@/hooks/useMarketListData";
import { cn } from "@/lib/utils";

interface LiteEventCardProps {
  market: EventRow;
}

const microlabelFor = (cat: string): string => {
  const map: Record<string, string> = {
    Crypto: "Crypto",
    Finance: "Stocks",
    Tech: "Tech",
    Politics: "Macro",
    Sports: "Sports",
    Entertainment: "Entertainment",
    Social: "Social",
    General: "Market",
    Market: "Market",
  };
  return map[cat] ?? "Market";
};

// Derive a settlement footer string from real expiry data. No hardcoded times.
const settlementFooter = (expiry: Date | null, category: string): string | null => {
  if (!expiry) return null;
  const now = Date.now();
  const diffMs = expiry.getTime() - now;
  if (diffMs <= 0) return "Settled";
  const isStocks = category === "Finance" || category === "Tech";
  const sameCalendarDay =
    expiry.getFullYear() === new Date(now).getFullYear() &&
    expiry.getMonth() === new Date(now).getMonth() &&
    expiry.getDate() === new Date(now).getDate();
  const hhmm = expiry.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (isStocks && sameCalendarDay) return `Settles today ${hhmm}`;
  const days = Math.ceil(diffMs / 86_400_000);
  if (days <= 1) return `Settles today ${hhmm}`;
  if (days <= 7) return `Settles in ${days}d`;
  if (days <= 30) return `Settles ${expiry.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  return `Settles ${expiry.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
};

export const LiteEventCard = ({ market }: LiteEventCardProps) => {
  const navigate = useNavigate();
  const isSpot = market.productLines?.includes("spot");
  const href = isSpot
    ? `/spot?event=${market.eventId}`
    : `/trade?event=${market.eventId}`;

  // Prefer the top-market's outcome pricing when available; fall back to a
  // neutral 50/50 read so we never invent a number.
  const topChild = market.children[0];
  const yesPrice = topChild ? topChild.markPrice : 0.5;
  const noPrice = Math.max(0, Math.min(1, 1 - yesPrice));
  const microlabel = microlabelFor(market.categoryLabel);
  const footer = settlementFooter(market.expiry, market.categoryLabel);

  const fmt = (p: number) => `${Math.round(p * 100)}¢`;

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={cn(
        "group flex w-full flex-col rounded-2xl border border-border/50 bg-card p-4 text-left",
        "transition-colors hover:border-primary/40",
      )}
    >
      <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <span>{microlabel}</span>
        {footer && <span className="text-muted-foreground/70">{footer}</span>}
      </div>

      <h3 className="font-display text-[15px] font-semibold leading-snug text-foreground line-clamp-2">
        {market.eventName}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <span
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2",
            "bg-yes/15 text-yes border border-yes/25",
            "transition-colors group-hover:bg-yes/25",
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-wide">Yes</span>
          <span className="font-mono text-sm font-semibold">{fmt(yesPrice)}</span>
        </span>
        <span
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2",
            "bg-no/15 text-no border border-no/25",
            "transition-colors group-hover:bg-no/25",
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-wide">No</span>
          <span className="font-mono text-sm font-semibold">{fmt(noPrice)}</span>
        </span>
      </div>
    </button>
  );
};