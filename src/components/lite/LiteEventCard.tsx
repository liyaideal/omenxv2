import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Flame, Zap } from "lucide-react";
import { EventRow } from "@/hooks/useMarketListData";
import { cn } from "@/lib/utils";
import {
  formatEndsIn,
  msToSettle,
  statusBadgeFor,
  type LiteStatusBadge,
} from "@/lib/liteListBadges";

interface LiteEventCardProps {
  market: EventRow;
  /** Max Boost for this event's category (from category_boost_configs).
   *  null / undefined / <2 → no Boost badge. Spot events never get one. */
  boostMax?: number | null;
  /**
   * 24h-volume cutoff for the Trending status badge, computed once by the
   * list from the loaded live set. null → Trending never shows.
   */
  trendingCutoff?: number | null;
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

export const LiteEventCard = ({
  market,
  boostMax,
  trendingCutoff = null,
}: LiteEventCardProps) => {
  const navigate = useNavigate();
  // Minute-precision tick so the "Ends {Xh Ym}" label stays honest.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const isSpot = market.productLines?.includes("spot");
  const href = isSpot
    ? `/spot?event=${market.eventId}`
    : `/trade?event=${market.eventId}`;
  // Multi-market = one event with 3+ independently tradable options.
  const isMulti = market.children.length > 2;

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

  // Badge system v2 — two tracks, max two badges, status first.
  // "Live" stays abolished; no emoji glyphs, Lucide icons only.
  const boostable = !isSpot && !!boostMax && boostMax >= 2;
  const status = statusBadgeFor(market, trendingCutoff, now);
  const endsInMs = msToSettle(market, now);

  const fmt = (p: number) => `${Math.round(p * 100)}¢`;
  const volText = `Vol ${formatCompactUSD(market.totalVolume || market.volume24h || 0)}`;
  const dateText = market.expiry
    ? market.expiry.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";

  // Multi variant: top-2 options by chance, shown as compact chance rows.
  const topTwo = isMulti
    ? [...market.children].sort((a, b) => b.markPrice - a.markPrice).slice(0, 2)
    : [];
  const extraCount = Math.max(0, market.children.length - topTwo.length);

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
        {(status || boostable) && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {status === "ends-soon" && (
              <BadgePill
                bg="hsl(var(--trading-yellow))"
                fg="#241B00"
                icon={<Clock className="h-3 w-3" strokeWidth={2.5} />}
                label={`Ends ${formatEndsIn(endsInMs ?? 0)}`}
              />
            )}
            {status === "new" && (
              <BadgePill bg="hsl(var(--yes))" fg="#04222c" label="New" />
            )}
            {status === "trending" && (
              <BadgePill
                bg="#FFFFFF"
                fg="#0A0B0D"
                icon={<Flame className="h-3 w-3" strokeWidth={2.5} />}
                label="Trending"
              />
            )}
            {boostable && (
              <BadgePill
                bg="hsl(var(--no))"
                fg="#1a2408"
                icon={<Zap className="h-3 w-3" strokeWidth={2.5} />}
                label={`Boost ${boostMax}×`}
              />
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-[18px]">
        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280]">
          {microlabel}
          {isMulti && ` · ${market.children.length} markets`}
        </div>
        <h3 className="mt-[7px] mb-4 min-h-[42px] font-display text-[17px] font-bold leading-[1.2] text-foreground">
          {market.eventName}
        </h3>

        {/* Middle zone — vertically centred so binary and multi cards read
            equally dense at the same grid height. */}
        <div className="flex flex-1 flex-col justify-center">
          {isMulti ? (
            <div className="space-y-1.5">
              {topTwo.map((c) => {
                const p = Math.max(1, Math.min(99, Math.round(c.markPrice * 100)));
                return (
                  <div
                    key={c.id}
                    className="grid h-[30px] grid-cols-[minmax(0,1fr)_72px_34px] items-center gap-2"
                  >
                    <span className="truncate text-[12.5px] text-foreground/85">
                      {c.displayLabel || c.optionLabel}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <span
                        className="block h-full rounded-full bg-yes"
                        style={{ width: `${p}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-[12.5px] font-bold text-foreground">
                      {p}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-[10px]">
              <span className="flex min-h-[58px] flex-1 items-center justify-center rounded-[11px] bg-yes/15 text-center text-[13.5px] font-bold text-yes transition-colors group-hover:bg-yes/25">
                Yes {fmt(yesPrice)}
              </span>
              <span className="flex min-h-[58px] flex-1 items-center justify-center rounded-[11px] bg-no/15 text-center text-[13.5px] font-bold text-no transition-colors group-hover:bg-no/25">
                No {fmt(noPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Footer — single baseline row with a top hairline. */}
        <div className="mt-[14px] flex items-center justify-between border-t border-[#1D2026] pt-[10px] text-[11px] text-[#6B7280]">
          {isMulti ? (
            <>
              <span className="font-semibold text-yes">+{extraCount} markets</span>
              <span className="font-mono">
                {volText}
                {dateText ? ` · ${dateText}` : ""}
              </span>
            </>
          ) : (
            <>
              <span className="font-mono">{volText}</span>
              {footer && <span>{footer}</span>}
            </>
          )}
        </div>
      </div>
    </button>
  );
};