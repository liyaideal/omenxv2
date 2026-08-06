import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Flame, Timer, Zap } from "lucide-react";
import { EventRow } from "@/hooks/useMarketListData";
import { cn } from "@/lib/utils";
import { CardArtTile } from "@/components/lite/CardArtTile";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatEndsIn,
  isIntradayEvent,
  msToSettle,
  statusBadgeFor,
  type LiteStatusBadge,
} from "@/lib/liteListBadges";

interface LiteEventCardProps {
  market: EventRow;
  /** Index in the list — the first row loads eagerly, the rest lazily. */
  index?: number;
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
  stocks: "Finance",
  crypto: "Crypto",
  tech: "Tech",
  macro: "Macro",
  politics: "Macro",
  finance: "Finance",
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

/** One pill in the image-tile badge stack. Icons are Lucide nodes only. */
const BadgePill = ({
  bg,
  fg,
  icon,
  label,
}: {
  bg?: string;
  fg?: string;
  icon?: React.ReactNode;
  label: string;
}) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-[10px] py-[5px] text-[11px] font-semibold leading-none"
    style={{ background: bg, color: fg }}
  >
    {icon}
    {label}
  </span>
);

/** Ink paired with the --badge-intraday orange. */
const INTRADAY_INK = "#2A1200";

export const LiteEventCard = ({
  market,
  index = 0,
  boostMax,
  trendingCutoff = null,
}: LiteEventCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  // Badge system — max two pills, filled in a fixed order:
  //   STATUS (Ends soon > New > Trending) → Intraday → Boost.
  // Anything past the 2-slot cap is dropped, Boost first.
  // Intraday events are EXEMPT from New / Ends soon (see statusBadgeFor), so
  // the amber Ends-soon pill and the orange Intraday pill can never co-occur.
  // "Live" stays abolished; no emoji glyphs, Lucide icons only.
  const boostable = !isSpot && !!boostMax && boostMax >= 2;
  const status = statusBadgeFor(market, trendingCutoff, now);
  const endsInMs = msToSettle(market, now);
  const intraday = isIntradayEvent(market);

  const badges: React.ReactNode[] = [];
  if (status === "ends-soon") {
    badges.push(
      <BadgePill
        key="ends-soon"
        bg="hsl(var(--trading-yellow))"
        fg="#241B00"
        icon={<Clock className="h-3 w-3" strokeWidth={2.5} />}
        label={`Ends ${formatEndsIn(endsInMs ?? 0)}`}
      />,
    );
  } else if (status === "new") {
    badges.push(<BadgePill key="new" bg="hsl(var(--yes))" fg="#04222c" label="New" />);
  } else if (status === "trending") {
    badges.push(
      <BadgePill
        key="trending"
        bg="#FFFFFF"
        fg="#0A0B0D"
        icon={<Flame className="h-3 w-3" strokeWidth={2.5} />}
        label="Trending"
      />,
    );
  }
  if (intraday) {
    badges.push(
      <BadgePill
        key="intraday"
        bg="hsl(var(--badge-intraday))"
        fg={INTRADAY_INK}
        icon={<Timer className="h-3 w-3" strokeWidth={2.5} />}
        label={`Intraday · ${formatEndsIn(Math.max(0, endsInMs ?? 0))}`}
      />,
    );
  }
  if (boostable) {
    badges.push(
      <BadgePill
        key="boost"
        bg="hsl(var(--no))"
        fg="#1a2408"
        icon={<Zap className="h-3 w-3" strokeWidth={2.5} />}
        label={`Boost ${boostMax}×`}
      />,
    );
  }
  const visibleBadges = badges.slice(0, 2);

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

  // ── Mobile composition ────────────────────────────────────────────────
  // Same data, re-laid-out for 390px: art becomes a 56px thumbnail beside the
  // title, chips drop to 44px, padding tightens to 12px. Desktop is untouched.
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={() => navigate(href)}
        className="mkt-card flex w-full flex-col gap-3 rounded-[14px] border border-[#1D2026] bg-[#131519] p-3 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[10px]">
            <CardArtTile
              src={image}
              blur={market.imageBlur}
              priority={index < 2}
              className="h-full w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280]">
                {microlabel}
                {isMulti && ` · ${market.children.length} markets`}
              </span>
            </div>
            <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-[1.25] text-foreground">
              {market.eventName}
            </h3>
          </div>
        </div>

        {visibleBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">{visibleBadges}</div>
        )}

        {isMulti ? (
          <div className="space-y-1.5">
            {topTwo.map((c) => {
              const p = Math.max(1, Math.min(99, Math.round(c.markPrice * 100)));
              return (
                <div
                  key={c.id}
                  className="relative flex h-[30px] items-center overflow-hidden rounded-[8px] px-2.5"
                  style={{ background: "hsl(var(--yes) / 0.05)" }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${p}%`, background: "hsl(var(--yes) / 0.09)" }}
                  />
                  <span className="relative min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
                    {c.displayLabel || c.optionLabel}
                  </span>
                  <span className="relative ml-2 shrink-0 font-mono text-[12.5px] font-bold text-yes">
                    {p}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2">
            <span
              className="chip-t2 flex min-h-[44px] flex-1 items-center justify-between px-3"
              style={{ borderRadius: 10, ["--chip-accent" as string]: "#33D6FF" }}
            >
              <span className="text-[11px] text-[#9AA1AC]">Yes</span>
              <span
                className="font-display text-[15px] font-bold"
                style={{ color: "#33D6FF", fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(yesPrice)}
              </span>
            </span>
            <span
              className="chip-t2 flex min-h-[44px] flex-1 items-center justify-between px-3"
              style={{ borderRadius: 10, ["--chip-accent" as string]: "#CFFF4A" }}
            >
              <span className="text-[11px] text-[#9AA1AC]">No</span>
              <span
                className="font-display text-[15px] font-bold"
                style={{ color: "#CFFF4A", fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(noPrice)}
              </span>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
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
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="mkt-card group flex w-full flex-col overflow-hidden rounded-[16px] border border-[#1D2026] bg-[#131519] text-left"
    >
      {/* Image tile */}
      <CardArtTile src={image} blur={market.imageBlur} priority={index < 4}>
        {visibleBadges.length > 0 && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {visibleBadges}
          </div>
        )}
      </CardArtTile>

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
            // FROZEN anatomy — one continuous rounded-8 row per option:
            // base rgba(--yes,0.05), absolute left-anchored fill at the yes-%
            // in rgba(--yes,0.09), plain semibold label left, bold % right in
            // --yes. No split segments, no standalone pill bars.
            <div className="space-y-1.5">
              {topTwo.map((c) => {
                const p = Math.max(1, Math.min(99, Math.round(c.markPrice * 100)));
                return (
                  <div
                    key={c.id}
                    className="relative flex h-[30px] items-center overflow-hidden rounded-[8px] px-2.5"
                    style={{ background: "hsl(var(--yes) / 0.05)" }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${p}%`, background: "hsl(var(--yes) / 0.09)" }}
                    />
                    <span className="relative min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
                      {c.displayLabel || c.optionLabel}
                    </span>
                    <span className="relative ml-2 shrink-0 font-mono text-[12.5px] font-bold text-yes">
                      {p}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-[10px]">
              <span
                className="chip-t2 flex min-h-[58px] flex-1 items-center justify-between px-[13px]"
                style={{ borderRadius: 11, ["--chip-accent" as string]: "#33D6FF" }}
              >
                <span className="text-[11px] text-[#9AA1AC]">Yes</span>
                <span
                  className="font-display text-[17px] font-bold"
                  style={{ color: "#33D6FF", fontVariantNumeric: "tabular-nums" }}
                >
                  {fmt(yesPrice)}
                </span>
              </span>
              <span
                className="chip-t2 flex min-h-[58px] flex-1 items-center justify-between px-[13px]"
                style={{ borderRadius: 11, ["--chip-accent" as string]: "#CFFF4A" }}
              >
                <span className="text-[11px] text-[#9AA1AC]">No</span>
                <span
                  className="font-display text-[17px] font-bold"
                  style={{ color: "#CFFF4A", fontVariantNumeric: "tabular-nums" }}
                >
                  {fmt(noPrice)}
                </span>
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