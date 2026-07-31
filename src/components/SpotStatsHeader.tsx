import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLifecycleBadge, resolveStockMarket } from "@/lib/usStockSessions";

/**
 * SPOT products only — US-stock daily up/down.
 *
 * Deliberately excludes every perpetual-contract concept:
 * NO Index Price / Funding Rate / Open Interest / Perpetual / leverage.
 */

// Map ticker → company name. Extend as we launch more names.
// Canonical map — Lite spot surfaces import this instead of duplicating it.
export const STOCK_NAME: Record<string, string> = {
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  META: "Meta Platforms",
  AMZN: "Amazon",
  COIN: "Coinbase",
  HOOD: "Robinhood",
  AMD: "AMD",
  // Hong Kong batch — tickers are the numeric code + ".HK".
  "0700.HK": "Tencent",
  "9988.HK": "Alibaba",
  "3690.HK": "Meituan",
  "1810.HK": "Xiaomi",
  "1211.HK": "BYD",
  "0005.HK": "HSBC",
};

// Tokens that look like tickers but never are (the `us-` id prefix, session words).
const TICKER_STOPWORDS = new Set(["US", "ET", "AM", "PM", "USD"]);

/** Best-effort ticker extraction from event id / name (e.g. `us-coin-updown-...` → COIN). */
export const deriveTickerFromEvent = (
  eventId?: string | null,
  eventName?: string | null,
): string => {
  const id = (eventId ?? "").toLowerCase();
  const name = eventName ?? "";

  // 1) canonical id shapes: us-<ticker>-updown-… / hk-<code>-updown-…
  const fromHkId = id.match(/^hk-([a-z0-9]{1,5})-updown/);
  if (fromHkId) return `${fromHkId[1].toUpperCase()}.HK`;
  const fromId = id.match(/^us-([a-z]{1,5})-updown/);
  if (fromId) return fromId[1].toUpperCase();

  // 1b) HK code in parentheses in the name: "Tencent (0700.HK) — …"
  const fromHkName = name.match(/\((\d{4}\.HK)\)/i);
  if (fromHkName) return fromHkName[1].toUpperCase();

  // 2) ticker in parentheses in the event name: "Coinbase (COIN) — ..."
  const fromName = name.match(/\(([A-Za-z]{1,5})\)/);
  if (fromName) return fromName[1].toUpperCase();

  const src = `${id} ${name}`.toUpperCase();

  // 3) known-ticker scan (legacy ids)
  const known = Object.keys(STOCK_NAME).find((t) =>
    new RegExp(`\\b${t.replace(".", "\\.")}\\b`).test(src),
  );
  if (known) return known;

  // 4) generic scan, skipping stopwords like the `US` prefix
  const generic = src.match(/\b[A-Z]{2,5}\b/g)?.find((t) => !TICKER_STOPWORDS.has(t));
  return generic ?? "STOCK";
};

interface SpotStatsHeaderProps {
  eventId: string;
  eventName: string;
  basePrice: number | null;      // events.base_price — prior official close
  yesPrice: number | null;       // current Yes probability price ($0..$1)
  lifecycle: string | null;      // events.lifecycle_status
  className?: string;
}

export const SpotStatsHeader = ({
  eventId,
  eventName,
  basePrice,
  yesPrice,
  lifecycle,
  className,
}: SpotStatsHeaderProps) => {
  const ticker = useMemo(() => deriveTickerFromEvent(eventId, eventName), [eventId, eventName]);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket({ id: eventId });
  const cur = market.currency;
  const exchangeLabel = market.key === "hk" ? "HKEX · HK Stock" : "Nasdaq · US Stock";
  const badge = getLifecycleBadge(lifecycle);

  // Indicative last price — small pseudo-random walk around base_price.
  // DEMO-STATE: this is a purely front-end visual jitter, not a real quote.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, []);
  const indicative = useMemo(() => {
    if (!basePrice) return null;
    const drift = Math.sin(tick / 3 + (eventId.length % 7)) * 0.008; // ±0.8%
    return basePrice * (1 + drift);
  }, [basePrice, tick, eventId]);
  const pctVsBase =
    basePrice && indicative ? ((indicative - basePrice) / basePrice) * 100 : 0;
  const isUp = pctVsBase >= 0;

  return (
    <div
      className={cn(
        "w-full border-b border-border/40 bg-muted/10",
        "px-4 py-3 md:px-6",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3">
        {/* Ticker + company */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 border border-border/60 font-mono text-xs font-semibold">
            {ticker.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground truncate">{ticker}</span>
              <Badge variant="outline" className="text-[10px]">SPOT</Badge>
              <Badge variant="outline" className={cn("text-[10px] border", badge.className)}>
                {badge.label}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {company} · {exchangeLabel}
            </div>
          </div>
        </div>

        {/* Prior close */}
        <StatCell label="Prior Close">
          <span className="font-mono text-foreground">
            {basePrice != null ? `${cur}${basePrice.toFixed(2)}` : "—"}
          </span>
        </StatCell>

        {/* Indicative last */}
        <StatCell label="Last (indicative)">
          <span className={cn("font-mono", isUp ? "text-trading-green" : "text-trading-red")}>
            {indicative != null ? `${cur}${indicative.toFixed(2)}` : "—"}
          </span>
          {indicative != null && (
            <span
              className={cn(
                "ml-1 font-mono text-[11px]",
                isUp ? "text-trading-green" : "text-trading-red",
              )}
            >
              {isUp ? "+" : ""}
              {pctVsBase.toFixed(2)}%
            </span>
          )}
        </StatCell>

        {/* Yes price */}
        <StatCell label="Yes Price">
          <span className="font-mono text-foreground">
            {yesPrice != null ? `$${yesPrice.toFixed(2)}` : "—"}
          </span>
        </StatCell>
      </div>
    </div>
  );
};

const StatCell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="text-xs">
    <div className="text-muted-foreground">{label}</div>
    <div className="mt-0.5">{children}</div>
  </div>
);
