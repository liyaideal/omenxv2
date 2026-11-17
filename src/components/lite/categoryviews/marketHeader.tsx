// ============================================================
// MARKET HEADER — shared by the Finance list and the Intraday list's
// stock section (CPO 2026-11-17): market tabs (All + one tab per market
// with rounds today, count, orange dot when in session) and the one
// status line under them. Same grammar as the home Stocks module.
// ============================================================
import { t } from "@/i18n";
import { FINANCE_REGIONS } from "@/lib/taxonomy";
import type { StockEventRow } from "@/components/lite/intraday/intradayData";
import { getMarketSession, resolveStockMarket, type StockMarket } from "@/lib/usStockSessions";
import { ht, leftText } from "@/components/lite/home/homeAllShell";
import { ORANGE, type StockGroups } from "./verticalBlocks";

export type MarketTab = { key: string; label: string; count: number | null; open: boolean };

/** Settlement = official close + 15 min when the row carries no expected_settlement_time (same rule as the home module, K2). */
const SETTLE_AFTER_CLOSE_MS = 15 * 60_000;

export const OpenDot = () => (
  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE, flex: "none" }} />
);

/**
 * Market tabs — the home Stocks module's grammar (name + today's round count, lime underline on the
 * selected one), plus an "All" tab and an orange dot on every market whose session is open.
 */
export const MarketTabs = ({
  tabs,
  value,
  onChange,
  mobile,
}: {
  tabs: MarketTab[];
  value: string;
  onChange: (key: string) => void;
  mobile?: boolean;
}) => (
  <div
    className={mobile ? "flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "flex items-center"}
    style={{ gap: mobile ? 18 : 22 }}
    data-finance-market-tabs
  >
    {tabs.map((tab) => {
      const on = tab.key === value;
      return (
        <button
          key={tab.key}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(tab.key)}
          className="font-display inline-flex flex-none items-center whitespace-nowrap"
          style={{
            gap: 5,
            fontSize: 13,
            fontWeight: 700,
            color: on ? "#fff" : "#98A1AD",
            padding: "6px 0",
            border: 0,
            borderBottom: `2px solid ${on ? "#CFFF4A" : "transparent"}`,
            background: "none",
            minHeight: mobile ? 44 : undefined,
          }}
        >
          {tab.open ? <OpenDot /> : null}
          {tab.label}
          {tab.count != null ? (
            <span style={{ color: "#6B7280", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{tab.count}</span>
          ) : null}
        </button>
      );
    })}
  </div>
);


/** Display name of a market tab key ("us" → "US"); unknown keys pass through. */
export const marketLabel = (key: string): string =>
  FINANCE_REGIONS.some((r) => r.code === key) ? ht(`stocks.market_${key}`) : key;

/**
 * Tabs + status text for one selected market ("all" or a market key).
 * "Open" is read from groupStockRows' openSessions — the same test that splits the rows into
 * trading / asleep — so the dot, the status line and the rows can't disagree.
 */
export const buildMarketHeader = ({
  groups,
  region,
  now,
  boostOnly,
}: {
  groups: StockGroups;
  region: string;
  now: Date;
  boostOnly?: boolean;
}): { tabs: MarketTab[]; statusText: string | null; statusOpen: boolean; count: (key: string) => number } => {
  const names: StockEventRow[] = [...groups.trading, ...groups.asleep.map((a) => a.row)];
  const byMarket = new Map<string, { market: StockMarket; rows: StockEventRow[] }>();
  for (const r of names) {
    const market = resolveStockMarket(r);
    const hit = byMarket.get(market.key);
    if (hit) hit.rows.push(r);
    else byMarket.set(market.key, { market, rows: [r] });
  }
  const openKeys = new Set<string>(groups.openSessions.map((s) => s.market.key));
  // A market shows as a tab when it has rounds today, or when the page was opened on it.
  const marketTabs = FINANCE_REGIONS.filter((r) => byMarket.has(r.code) || r.code === region).map((r) => ({
    key: r.code as string,
    label: ht(`stocks.market_${r.code}`),
    count: boostOnly ? null : (byMarket.get(r.code)?.rows.length ?? 0),
    open: openKeys.has(r.code),
  }));
  // No stock rounds at all → no tabs (even when the page was opened on one market).
  const tabs = marketTabs.length && names.length > 0
    ? [{ key: "all", label: t("common.all"), count: boostOnly ? null : names.length, open: false }, ...marketTabs]
    : [];

  let statusText: string | null = null;
  let statusOpen = false;
  if (!boostOnly && byMarket.size > 0) {
    if (region === "all") {
      if (openKeys.size > 0) {
        statusOpen = true;
        statusText = t("events.screen.simple.finance_view.finance_vertical.markets_open", { count: openKeys.size });
      } else {
        // Nothing is open: name the market that opens first.
        const next = [...byMarket.values()]
          .map(({ market }) => ({ market, at: getMarketSession(market, now).nextOpenAt.getTime() }))
          .sort((a, b) => a.at - b.at)[0];
        statusText = t("events.screen.simple.finance_view.finance_vertical.markets_closed_opens", {
          market: ht(`stocks.market_${next.market.key}`),
          time: leftText(next.at - now.getTime()),
        });
      }
    } else if (byMarket.has(region)) {
      const { market, rows } = byMarket.get(region)!;
      const session = getMarketSession(market, now);
      statusOpen = openKeys.has(region) && !!session.closeAt;
      const head = statusOpen
        ? ht("stocks.open_closes_in", { time: leftText(session.closeAt!.getTime() - now.getTime()) })
        : ht("stocks.opens_in", { time: leftText(session.nextOpenAt.getTime() - now.getTime()) });
      const ends = rows
        .map((r) =>
          r.expected_settlement_time
            ? new Date(r.expected_settlement_time).getTime()
            : r.end_date
              ? new Date(r.end_date).getTime() + SETTLE_AFTER_CLOSE_MS
              : null,
        )
        .filter((x): x is number => x != null);
      const ahead = ends.filter((x) => x > now.getTime());
      const tail = ahead.length
        ? ht("stocks.settles_in", { time: leftText(Math.min(...ahead) - now.getTime()) })
        : ends.length
          ? ht("stocks.settling_now")
          : "";
      statusText = `${head}${tail}`;
    }
  }
  return { tabs, statusText, statusOpen, count: (key) => (key === "all" ? names.length : (byMarket.get(key)?.rows.length ?? 0)) };
};
