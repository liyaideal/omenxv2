// ============================================================
// Presentational blocks of the Lite SPOT pages (/spot).
// Moved VERBATIM out of LiteQuickTrade / LiteSpotTrade so the style-guide
// mounts the PRODUCTION markup instead of a hand copy.
//
// RED LINE: extraction only — no style, copy or structure changes. Every
// derived value (useQuickRounds / useSecondTick / usStockSessions / fetches)
// stays on the page side and arrives here as props.
// ============================================================
import type { ReactNode, Ref } from "react";
import { ChevronRight } from "lucide-react";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { SideButton } from "@/components/lite/shared/SideButton";
import { EmptyState } from "@/components/states";
import { pctColor } from "@/components/lite/shared/primitives";
import { cn } from "@/lib/utils";

/** Shared micro-eyebrow style (verbatim from LiteQuickTrade). */
export const SPOT_MICRO: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6B7280",
};

/* ------------------------------------------------------------------ */
/* SP-1 · crypto quick-round head                                      */
/* ------------------------------------------------------------------ */

export const SpotCryptoHead = ({
  ticker,
  title,
  headingRef,
  isMobile,
  price,
  pct,
  volText,
}: {
  ticker: string;
  title: string;
  headingRef?: Ref<HTMLHeadingElement>;
  isMobile: boolean;
  /** live derived price (null → em dash) */
  price: number | null;
  /** % move vs round open */
  pct: number;
  volText: string;
}) => (
  <div>
    <div style={{ ...SPOT_MICRO, fontSize: 10.5 }}>Crypto · Intraday</div>
    <div className="mt-2 flex items-center gap-[10px]">
      <AssetAvatar symbol={ticker} kind="crypto" size={34} />
      <h1
        ref={headingRef}
        className="font-display font-bold leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: isMobile ? 24 : 32 }}
      >
        {title}
      </h1>
    </div>
    <div
      className="font-display mt-2 flex flex-wrap items-center gap-x-[10px]"
      style={{ fontSize: 12.5, color: "#9AA1AC" }}
    >
      <span style={{ color: "#F2F3F5", fontWeight: 700 }}>
        {price != null
          ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : "—"}
      </span>
      <span style={{ color: "#6B7280" }}>·</span>
      <span style={{ color: pctColor(pct) }}>
        {pct >= 0 ? "▲ +" : "▼ "}
        {pct.toFixed(2)}% today
      </span>
      <span style={{ color: "#6B7280" }}>·</span>
      <span>Vol {volText}</span>
    </div>
  </div>
);

/** ROUND timeframe switcher (crypto head, second row). */
export const SpotRoundSwitcher = ({
  items,
  activeId,
  onSelect,
}: {
  items: readonly { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div style={{ marginTop: 16 }}>
    <div style={SPOT_MICRO}>Round</div>
    <div
      className="mt-1.5 inline-flex items-center"
      style={{
        background: "#101216",
        border: "1px solid #2B2F38",
        borderRadius: 11,
        padding: 3,
        gap: 2,
      }}
    >
      {items.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="font-display transition-colors"
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 13px",
              borderRadius: 8,
              background: active ? "#FFFFFF" : "transparent",
              color: active ? "#0A0B0D" : "#9AA1AC",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SP-2 · stocks daily head (QuestionBlock)                            */
/* ------------------------------------------------------------------ */

export const SpotStockHead = ({
  title,
  headingRef,
  priceText,
  pctToday,
  lastCloseText,
  priceToBeatText,
  volText,
  rightSlot,
}: {
  title: string;
  headingRef?: Ref<HTMLHeadingElement>;
  /** formatted current price — omitted when null */
  priceText?: string | null;
  /**
   * ST-1d · pre-session reference price. When set, the price/%-today pair is
   * replaced by a muted, frozen `Last close {price}` segment.
   */
  lastCloseText?: string | null;
  /** % move — omitted when null */
  pctToday?: number | null;
  /** formatted `Price to beat` value — omitted when null */
  priceToBeatText?: string | null;
  volText: string;
  /** watchlist star on desktop only (page decides) */
  rightSlot?: ReactNode;
}) => (
  <div>
    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      Stocks · Daily up / down
    </div>
    <h1
      ref={headingRef}
      className="mt-2 font-display font-bold leading-[1.05] tracking-[-0.02em] text-foreground"
      style={{ fontSize: "clamp(24px, 3.5vw, 34px)" }}
    >
      {title}
    </h1>
    <div className="mt-3 flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
        {lastCloseText != null && <span>Last close {lastCloseText}</span>}
        {lastCloseText == null && priceText != null && (
          <span className="text-foreground">{priceText}</span>
        )}
        {lastCloseText == null && pctToday != null && (
          <span
            className={cn(pctToday >= 0 ? "text-trading-green" : "text-trading-red")}
          >
            {pctToday >= 0 ? "▲" : "▼"} {pctToday >= 0 ? "+" : ""}
            {pctToday.toFixed(2)}% today
          </span>
        )}
        {priceToBeatText != null && <span>Price to beat {priceToBeatText}</span>}
        <span>Vol {volText}</span>
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SP-9 · YOUR PICK card                                               */
/* ------------------------------------------------------------------ */

/**
 * Quick-round pick card. Chips are the ONE shared SideButton (compact
 * density), single line `Up 49¢` — no `% say` sub-label (it duplicates the
 * crowd bar).
 */
export const SpotPickCard = ({
  microText,
  question,
  yesLabel,
  noLabel,
  yesPrice,
  noPrice,
  side,
  onSideChange,
}: {
  microText: string;
  question: string;
  yesLabel: string;
  noLabel: string;
  yesPrice: number;
  noPrice: number;
  side: "yes" | "no";
  onSideChange: (s: "yes" | "no") => void;
}) => (
  <div
    style={{
      background: "#131519",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 15,
      padding: 14,
    }}
  >
    <div style={SPOT_MICRO}>{microText}</div>
    <div className="font-display" style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>
      {question}
    </div>
    {/* Side selection uses the ONE shared SideButton (compact density). */}
    <div className="mt-3 grid grid-cols-2 gap-2">
      <SideButton
        active={side === "yes"}
        tone="yes"
        label={yesLabel}
        price={yesPrice}
        size="compact"
        onClick={() => onSideChange("yes")}
      />
      <SideButton
        active={side === "no"}
        tone="no"
        label={noLabel}
        price={noPrice}
        size="compact"
        onClick={() => onSideChange("no")}
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SP-15 · right-column rail (two variants)                            */
/* ------------------------------------------------------------------ */

export interface SpotRailCryptoRow {
  key: string;
  /** avatar symbol, e.g. `ETH` */
  symbol: string;
  /** `Ethereum · 15M round` */
  label: string;
  /** Up odds, whole percent */
  upPct: number;
  onClick: () => void;
}

export interface SpotRailStockRow {
  key: string;
  ticker: string;
  /** `Apple — close higher?` */
  label: string;
  upPct: number;
  onClick: () => void;
}

/** `Also live now` — crypto quick rounds. Renders nothing when empty. */
export const SpotSideRailCrypto = ({ rows }: { rows: SpotRailCryptoRow[] }) =>
  rows.length === 0 ? null : (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-medium">Also live now</div>
      <div className="space-y-2">
        {rows.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={r.onClick}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-muted/40"
          >
            <AssetAvatar symbol={r.symbol} kind="crypto" size={30} />
            <span className="flex-1 text-xs text-foreground">{r.label}</span>
            <span className="font-display text-xs font-bold" style={{ color: "#33D6FF" }}>
              Up {r.upPct}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );

/** `More stocks closing today` — daily stock rail, with its own empty state. */
export const SpotSideRailStocks = ({ rows }: { rows: SpotRailStockRow[] }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-3 text-sm font-medium">More stocks closing today</div>
    {rows.length === 0 ? (
      <EmptyState
        variant="module"
        bordered={false}
        title="No other markets right now"
        description="More stocks open here at the start of each trading day."
        className="px-0 py-1"
      />
    ) : (
      <ul className="space-y-1">
        {rows.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={s.onClick}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
            >
              <span className="flex h-7 w-9 items-center justify-center rounded bg-muted/50 font-mono text-[10px] font-semibold">
                {s.ticker}
              </span>
              <span className="flex-1 truncate text-xs">{s.label}</span>
              <span className="font-mono text-xs font-semibold text-yes">{s.upPct}%</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* SP-16 · mobile buy-drawer header                                    */
/* ------------------------------------------------------------------ */

export const SpotBuyDrawerHeader = ({
  isYesSide,
  sideLabel,
  title,
  leadText,
  countdown,
  chancePct,
}: {
  isYesSide: boolean;
  sideLabel: string;
  /** `Buy BTC 15M` (crypto) / `Buy AAPL` (stocks) */
  title: string;
  /** `Settles in` (crypto) / `Closes in` (stocks) */
  leadText: string;
  countdown: string;
  chancePct: number;
}) => (
  <div className="mb-3">
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "rounded-md px-2 py-0.5 text-[11px] font-semibold",
          isYesSide ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
        )}
      >
        {sideLabel}
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className="mt-1 text-[11px] text-muted-foreground">
      {leadText} <span className="font-mono">{countdown}</span> · {chancePct}% chance
    </div>
  </div>
);
