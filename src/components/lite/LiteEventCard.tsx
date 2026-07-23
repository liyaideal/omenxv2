import { useNavigate } from "react-router-dom";
import { EventRow } from "@/hooks/useMarketListData";
import { cn } from "@/lib/utils";

interface LiteEventCardProps {
  market: EventRow;
}

// Literal-mapped category → microlabel (uppercase in render).
// Keyed on the raw DB category value (lowercase).
const MICROLABEL: Record<string, string> = {
  stocks: "Stocks",
  crypto: "Crypto",
  tech: "Tech",
  macro: "Macro",
  politics: "Macro",
  finance: "Stocks",
  sports: "Sports",
  entertainment: "Entertainment",
  social: "Social",
};

// Literal-mapped category → image path. No string concatenation, so Tailwind
// (and asset scanners) never see interpolated names.
const CATEGORY_IMAGE: Record<string, string> = {
  stocks: "/card-bg/finance.jpg",
  finance: "/card-bg/finance.jpg",
  macro: "/card-bg/finance.jpg",
  politics: "/card-bg/politics.jpg",
  crypto: "/card-bg/crypto.jpg",
  tech: "/card-bg/tech.jpg",
  sports: "/card-bg/sports.jpg",
  entertainment: "/card-bg/entertainment.jpg",
  social: "/card-bg/social.jpg",
};

// Fallback diagonal stripe, matches the mock scaffolding.
const STRIPE_FALLBACK =
  "repeating-linear-gradient(135deg,#1D2026,#1D2026 12px,#131519 12px,#131519 24px)";

// Scrim overlay (bottom → top) for image tiles so light photos stay legible.
const SCRIM = "linear-gradient(to top, rgba(10,11,13,0.85), transparent 60%)";

const formatCompactUSD = (val: number): string => {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${Math.round(val)}`;
};

// Derive a settlement footer string from real expiry data. No hardcoded times.
const settlementFooter = (expiry: Date | null, categoryRaw: string): string | null => {
  if (!expiry) return null;
  const nowDate = new Date();
  const diffMs = expiry.getTime() - nowDate.getTime();
  if (diffMs <= 0) return "Settled";
  // Compare local CALENDAR days, ignoring time-of-day, so an event ending
  // tomorrow at 08:00 doesn't read "in 2d" via a naive ceil(diffMs/86_400_000).
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(expiry) - startOfDay(nowDate)) / 86_400_000);
  const hhmm = expiry.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (dayDiff <= 0) return `Settles today ${hhmm}`;
  if (dayDiff === 1) return "Settles tomorrow";
  if (dayDiff <= 6) {
    return `Settles ${expiry.toLocaleDateString(undefined, { weekday: "short" })}`;
  }
  if (dayDiff <= 30) {
    return `Settles ${expiry.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return `Settles ${expiry.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
};

export const LiteEventCard = ({ market }: LiteEventCardProps) => {
  const navigate = useNavigate();
  const isSpot = market.productLines?.includes("spot");
  const href = isSpot
    ? `/spot?event=${market.eventId}`
    : `/trade?event=${market.eventId}`;

  // Resolve which child is the affirmative ("Yes") side. We MUST NOT rely on
  // children[0] — for us-*-updown events the first option is "Not Up", which
  // would flip Yes/No on the card. Prefer the event's side_labels.yes alias
  // (e.g. "Up"), then fall back to literal "yes"/"up" labels, then children[0].
  const affirmativeAlias = (market.sideLabels?.yes ?? "").trim().toLowerCase();
  const matchLabel = (label: string) => label.trim().toLowerCase();
  const yesChild =
    (affirmativeAlias &&
      market.children.find((c) => matchLabel(c.optionLabel) === affirmativeAlias)) ||
    market.children.find((c) => ["yes", "up"].includes(matchLabel(c.optionLabel))) ||
    market.children[0];
  const noChild = market.children.find((c) => c.id !== yesChild?.id);
  const yesPrice = yesChild ? yesChild.markPrice : 0.5;
  const noPrice = noChild
    ? noChild.markPrice
    : Math.max(0, Math.min(1, 1 - yesPrice));

  const categoryRaw = (market.category || "").toLowerCase();
  const microlabel = MICROLABEL[categoryRaw] ?? "Market";
  const footer = settlementFooter(market.expiry, categoryRaw);
  const image = market.imageUrl ?? CATEGORY_IMAGE[categoryRaw];

  // Tag pill: New → volt; otherwise Live → pulse blue. One tag max.
  const tag = market.isNew
    ? { label: "New", bg: "#CFFF4A" }
    : { label: "Live", bg: "#33D6FF" };

  const fmt = (p: number) => `${Math.round(p * 100)}¢`;
  const volText = `Vol ${formatCompactUSD(market.totalVolume || market.volume24h || 0)}`;

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="mkt-card group flex w-full flex-col overflow-hidden rounded-[16px] border border-[#1D2026] bg-[#131519] text-left"
    >
      {/* Image tile */}
      <div
        className="relative h-[130px] w-full"
        style={{
          backgroundImage: image ? `${SCRIM}, url("${image}")` : STRIPE_FALLBACK,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
        }}
      >
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-[5px] text-[11px] font-semibold"
          style={{ background: tag.bg, color: "#0A0B0D" }}
        >
          {tag.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-[18px]">
        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280]">
          {microlabel}
        </div>
        <h3 className="mt-[7px] mb-4 min-h-[42px] font-display text-[17px] font-bold leading-[1.2] text-foreground">
          {market.eventName}
        </h3>

        <div className="flex gap-[10px]">
          <span className="flex-1 rounded-[11px] bg-yes/15 py-[11px] text-center text-sm font-bold text-yes transition-colors group-hover:bg-yes/25">
            Yes {fmt(yesPrice)}
          </span>
          <span className="flex-1 rounded-[11px] bg-no/15 py-[11px] text-center text-sm font-bold text-no transition-colors group-hover:bg-no/25">
            No {fmt(noPrice)}
          </span>
        </div>

        <div className="mt-[14px] flex justify-between text-[11px] text-[#6B7280]">
          <span className="font-mono">{volText}</span>
          {footer && <span>{footer}</span>}
        </div>
      </div>
    </button>
  );
};