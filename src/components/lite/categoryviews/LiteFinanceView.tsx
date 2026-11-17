// ============================================================
// FINANCE VERTICAL VIEW — category chip "Finance".
// ASSEMBLY ONLY: module header grammar (market tabs + one status line,
// 2026-11-17), the session-aware stock rows from the Intraday view
// (Trading / Asleep), and the frozen LiteEventCard grid. Markets come from
// taxonomy.ts FINANCE_REGIONS; the asset-class row is hidden for now.
// ============================================================
import { t, useT } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { FINANCE_ASSET_CLASSES, FINANCE_REGIONS } from "@/lib/taxonomy";
import type { EventRow } from "@/hooks/useMarketListData";
import type { StockEventRow } from "@/components/lite/intraday/intradayData";
import { getMarketSession, resolveStockMarket, type StockMarket } from "@/lib/usStockSessions";
import { ht, leftText } from "@/components/lite/home/homeAllShell";
import {
  AsleepStockRow,
  ORANGE,
  StockGroups,
  TradingStockRow,
  groupStockRows,
} from "./verticalBlocks";
import {
  CatalogueHeader,
  DimensionPill,
  DimensionRow,
  VerticalHeader,
} from "./verticalChrome";
import { financeClassOf, financeRegionOf } from "./verticalFilters";
import { EmptyState } from "@/components/states";
import {
  MobileAsleepStockRow,
  MobileTradingStockRow,
} from "@/components/lite/mobile/MobileStockRow";


/** Stock rounds are equities only — the other classes have no engine. */
const ENGINE_CLASS = "stocks";

/**
 * CPO 2026-11-17: only stocks have markets today, so the ASSET CLASS row is hidden (the list shows All).
 * Flip this back on when indices / commodities / FX carry markets again — the row and its filter are intact.
 */
const SHOW_ASSET_CLASS_ROW = false;

/** Settlement = official close + 15 min when the row carries no expected_settlement_time (same rule as the home module, K2). */
const SETTLE_AFTER_CLOSE_MS = 15 * 60_000;

const OpenDot = () => (
  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE, flex: "none" }} />
);

/**
 * Market tabs — the home Stocks module's grammar (name + today's round count, lime underline on the
 * selected one), plus an "All" tab and an orange dot on every market whose session is open.
 */
const MarketTabs = ({
  tabs,
  value,
  onChange,
  mobile,
}: {
  tabs: Array<{ key: string; label: string; count: number | null; open: boolean }>;
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

export const LiteFinanceView = ({
  stockRows,
  tickSeconds,
  sessionNow,
  events,
  renderGrid,
  isMobile,
  initialClass = "all",
  initialRegion = "all",
  nowMs,
  boostOnly,
  scrollToEngine,
}: {
  stockRows: StockEventRow[];
  tickSeconds: number;
  /** Style-guide only — freeze the market calendar clock. */
  sessionNow?: Date;
  events: EventRow[];
  renderGrid: (items: EventRow[]) => React.ReactNode;
  isMobile?: boolean;
  initialClass?: string;
  initialRegion?: string;
  /** Style-guide only — freeze every clock in the view. */
  nowMs?: number;
  /** Boost composes in place — engine hides until boost rounds exist. */
  boostOnly?: boolean;
  /**
   * One-shot scroll intent: bumped by the caller when the user arrived from a
   * "session open" row, so the rounds engine lands in view instead of below
   * the header + filter chrome. Filters are never pre-set.
   */
  scrollToEngine?: number;
}) => {
  useT(); // re-render on language change / catalog arrival (labels below are plain t() calls)
  const [cls, setCls] = useState<string>(initialClass);
  const [region, setRegion] = useState<string>(initialRegion);
  const engineRef = useRef<HTMLDivElement | null>(null);

  const groups: StockGroups = useMemo(
    () => groupStockRows(stockRows, sessionNow),
    [stockRows, tickSeconds, sessionNow],
  );

  const inRegion = (r: StockEventRow) =>
    region === "all" || resolveStockMarket(r).key === region;
  const engineOn =
    // Korea rounds are synced from mainnet since 2026-11-10 (batch 2), so the Korea region lists them too.
    !boostOnly && (cls === ENGINE_CLASS || cls === "all");
  const trading = engineOn ? groups.trading.filter(inRegion) : [];
  const asleep = engineOn ? groups.asleep.filter((a) => inRegion(a.row)) : [];
  const shown = trading.length + asleep.length;
  const hasEngineRows = engineOn && shown > 0;

  useEffect(() => {
    if (!scrollToEngine || !hasEngineRows) return;
    const id = window.requestAnimationFrame(() => {
      const el = engineRef.current;
      if (!el) return;
      // Leave room for the sticky header so the first round row isn't tucked
      // underneath it.
      const HEADER_OFFSET = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [scrollToEngine, hasEngineRows]);

  const catalogue = useMemo(
    () =>
      events.filter(
        (m) =>
          (cls === "all" || financeClassOf(m) === cls) &&
          (region === "all" || financeRegionOf(m) === region),
      ),
    [events, cls, region],
  );

  // ---- Market tabs + status line (CPO 2026-11-17: same grammar as the home Stocks module) ----
  const now = sessionNow ?? new Date(nowMs ?? Date.now());
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
  // "… Winning shares pay <payout>$1</payout>, losing shares pay $0." — the payout is the one white word.
  const explainerParts = t("events.screen.simple.finance_view.finance_vertical_chrome.trading_explainer").split(/<\/?payout>/);
  const explainer =
    explainerParts.length === 3 ? (
      <>
        {explainerParts[0]}
        <strong style={{ color: "#fff", fontWeight: 700 }}>{explainerParts[1]}</strong>
        {explainerParts[2]}
      </>
    ) : (
      explainerParts.join("")
    );

  const statusLine = statusText ? (
    <span
      className={isMobile ? "inline-flex items-start" : "inline-flex items-center"}
      style={{ gap: 6, fontSize: isMobile ? 11.5 : 12.5, lineHeight: isMobile ? "16px" : undefined, color: "#98A1AD", marginTop: isMobile ? 6 : 0 }}
      data-finance-market-status
    >
      {/* Phone only: the line sits in the header, so the dot tells it apart from the subtitle. */}
      {isMobile && statusOpen ? (
        // 16px line box → the 6px dot sits on the first line even when a long translation wraps.
        <span className="inline-flex flex-none items-center" style={{ height: 16 }}>
          <OpenDot />
        </span>
      ) : null}
      <span className={isMobile ? undefined : "whitespace-nowrap"}>{statusText}</span>
    </span>
  ) : null;

  return (
    <div className="flex flex-col" style={{ marginTop: isMobile ? 18 : 20, gap: 22 }}>
      <VerticalHeader
        compact={isMobile}
        eyebrow={t("events.screen.simple.finance_view.finance_vertical_chrome.finance_daily_closes")}
        title={t("events.screen.simple.finance_view.finance_vertical_chrome.which_way_does_it_close")}
        subtitle={explainer}
        below={isMobile ? statusLine : undefined}
        right={
          isMobile || (!tabs.length && !statusLine) ? undefined : (
            <div className="flex flex-none flex-col items-end" style={{ gap: 10 }}>
              {tabs.length ? <MarketTabs tabs={tabs} value={region} onChange={setRegion} /> : null}
              {statusLine}
            </div>
          )
        }
      />

      {isMobile && tabs.length ? <MarketTabs tabs={tabs} value={region} onChange={setRegion} mobile /> : null}

      {/* ASSET CLASS row — hidden while only stocks carry markets (SHOW_ASSET_CLASS_ROW). Markets moved to the header tabs. */}
      {SHOW_ASSET_CLASS_ROW && (
        <DimensionRow label={t("events.screen.simple.finance_view.finance_vertical.asset_class")} scroll={isMobile} labelWidth={88}>
          <DimensionPill
            label={t("common.all")}
            active={cls === "all"}
            onSelect={() => setCls("all")}
            mobile={isMobile}
          />
          {FINANCE_ASSET_CLASSES.map((c) => (
            <DimensionPill
              key={c.code}
              label={c.label}
              active={cls === c.code}
              onSelect={() => setCls(c.code)}
              mobile={isMobile}
            />
          ))}
        </DimensionRow>
      )}

      {/* Engine — session-aware daily rounds. */}
      {engineOn && (trading.length > 0 || asleep.length > 0) && (
        <div ref={engineRef} className="flex flex-col" style={{ gap: 12 }}>
          {isMobile ? (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {trading.map((row) => (
                <MobileTradingStockRow key={row.id} row={row} tickSeconds={tickSeconds} />
              ))}
              {asleep.map(({ row, nextOpen }) => (
                <MobileAsleepStockRow key={row.id} row={row} nextOpen={nextOpen} />
              ))}
            </div>
          ) : (
            <>
              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
              >
                {trading.map((row) => (
                  <TradingStockRow key={row.id} row={row} tickSeconds={tickSeconds} />
                ))}
              </div>
              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
              >
                {asleep.map(({ row, nextOpen }) => (
                  <AsleepStockRow key={row.id} row={row} nextOpen={nextOpen} />
                ))}
              </div>
            </>
          )}
          {/* The "Showing 2 of 4 … names" note went with the region pills — each market tab carries its own count now. */}
          {groups.wakeLabels.length > 0 && (
            <div
              className="flex items-center"
              style={{ gap: 12, paddingTop: 12 }}
            >
              <span style={{ flex: 1, height: 1, background: "#1D2026" }} />
              {groups.wakeLabels.length > 0 && (
                <span
                  className="flex-none whitespace-nowrap"
                  style={{ fontSize: 11, color: "#6B7280" }}
                >
                  {groups.wakeLabels.join(" · ")}
                </span>
              )}
            </div>
          )}
        </div>
      )}


      {/* Boost with nothing boosted — keep chrome, show the empty line. */}
      {boostOnly && catalogue.length === 0 && (
        <EmptyState
          variant="page"
          title={t("events.screen.simple.crypto_view.crypto_vertical.nothing_boosted_here_yet")}
          illustrationSrc={isMobile ? "/assets/mobile/empty-no-boost.png" : "/assets/desktop/empty-no-boost.png"}
        />
      )}

      {/* Catalogue — hidden entirely when nothing is open. */}
      {catalogue.length > 0 && (
        <div
          className="flex flex-col"
          style={{ gap: 14, borderTop: "1px solid #1D2026", paddingTop: 22 }}
        >
          <CatalogueHeader
            compact={isMobile}
            title={t("events.screen.simple.finance_view.finance_vertical_chrome.what_else_could_the_markets_do")}
            subtitle={t("events.screen.simple.finance_view.finance_vertical_chrome.questions_that_run_longer_than_one_trading_day_winning_shares_pay_1")}
            count={catalogue.length}
          />
          {renderGrid(catalogue)}
        </div>
      )}
    </div>
  );
};

export default LiteFinanceView;
