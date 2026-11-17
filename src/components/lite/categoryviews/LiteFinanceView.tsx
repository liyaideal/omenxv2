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
import { resolveStockMarket } from "@/lib/usStockSessions";
import { ht } from "@/components/lite/home/homeAllShell";
import { MarketTabs, OpenDot, buildMarketHeader } from "./marketHeader";
import {
  AsleepStockRow,
  STOCK_ROW_GRID,
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

/** Last scroll intent handled — the view remounts per market, so this lives outside it. */
let handledScrollIntent = 0;

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
   * One-shot scroll intent (a timestamp set by the caller when the user arrived from the home "Show all" or a
   * "session open" row): the view scrolls its own header into view once, so the selected market tab is on screen.
   */
  scrollToEngine?: number;
}) => {
  useT(); // re-render on language change / catalog arrival (labels below are plain t() calls)
  const [cls, setCls] = useState<string>(initialClass);
  const [region, setRegion] = useState<string>(initialRegion);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  // Arriving from the home "Show all": land on the view's header, so the selected market tab is on screen
  // (CPO 2026-11-17 — it used to scroll past the header to the first stock row).
  useEffect(() => {
    if (!scrollToEngine || scrollToEngine === handledScrollIntent) return;
    handledScrollIntent = scrollToEngine;
    const id = window.requestAnimationFrame(() => {
      const el = rootRef.current;
      if (!el) return;
      // Leave room for the sticky site header.
      const HEADER_OFFSET = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [scrollToEngine]);

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
  const { tabs, statusText, statusOpen } = buildMarketHeader({ groups, region, now, boostOnly });
  // Every stock round is gone (so there are no tabs to pick from) while one market is selected → back to All.
  const stuck = region !== "all" && tabs.length === 0;
  useEffect(() => {
    if (stuck) setRegion("all");
  }, [stuck]);
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
    <div ref={rootRef} className="flex flex-col" style={{ marginTop: isMobile ? 18 : 20, gap: 22 }}>
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
              {/* the slot keeps its height when there is no status line, so the tabs don't jump */}
              <span className="flex items-center" style={{ minHeight: 18 }}>{statusLine}</span>
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
        <div className="flex flex-col" style={{ gap: 12 }}>
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
                style={{ gap: 12, gridTemplateColumns: STOCK_ROW_GRID }}
              >
                {trading.map((row) => (
                  <TradingStockRow key={row.id} row={row} tickSeconds={tickSeconds} />
                ))}
              </div>
              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: STOCK_ROW_GRID }}
              >
                {asleep.map(({ row, nextOpen }) => (
                  <AsleepStockRow key={row.id} row={row} nextOpen={nextOpen} />
                ))}
              </div>
            </>
          )}
          {/* No footer line: the "Showing N of M names" note and the "New York opens Tue 22:30" stamps both went (2026-11-17) — the tabs carry the counts, the status line says how long until the open. */}
        </div>
      )}


      {/* The selected market has no rounds today and nothing else to list — say so instead of a blank page. */}
      {!boostOnly && region !== "all" && shown === 0 && catalogue.length === 0 && (
        <EmptyState
          variant="page"
          title={t("events.screen.simple.finance_view.finance_vertical.no_rounds_today", {
            market: FINANCE_REGIONS.some((r) => r.code === region) ? ht(`stocks.market_${region}`) : region,
          })}
          description={t("events.screen.simple.finance_view.finance_vertical.no_rounds_today_hint")}
          illustrationSrc={isMobile ? "/assets/mobile/empty-no-boost.png" : "/assets/desktop/empty-no-boost.png"}
        />
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
