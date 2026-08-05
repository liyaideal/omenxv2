// ============================================================
// FINANCE VERTICAL VIEW — category chip "Finance".
// ASSEMBLY ONLY: module header grammar, the session-aware stock rows
// from the Intraday view (Trading / Asleep), and the frozen
// LiteEventCard grid. Class + region options come from taxonomy.ts.
// ============================================================
import { useMemo, useState } from "react";
import { FINANCE_ASSET_CLASSES, FINANCE_REGIONS } from "@/lib/taxonomy";
import type { EventRow } from "@/hooks/useMarketListData";
import type { StockEventRow } from "@/components/lite/intraday/intradayData";
import { resolveStockMarket } from "@/lib/usStockSessions";
import {
  AsleepStockRow,
  SessionStatusChip,
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

/** Stock rounds are equities only — the other classes have no engine. */
const ENGINE_CLASS = "stocks";

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
}) => {
  const [cls, setCls] = useState<string>(initialClass);
  const [region, setRegion] = useState<string>(initialRegion);

  const groups: StockGroups = useMemo(
    () => groupStockRows(stockRows, sessionNow),
    [stockRows, tickSeconds, sessionNow],
  );

  const inRegion = (r: StockEventRow) =>
    region === "all" || resolveStockMarket(r).key === region;
  const engineOn = (cls === ENGINE_CLASS || cls === "all") && region !== "kr";
  const trading = engineOn ? groups.trading.filter(inRegion) : [];
  const asleep = engineOn ? groups.asleep.filter((a) => inRegion(a.row)) : [];
  const shown = trading.length + asleep.length;
  const totalNames = groups.trading.length + groups.asleep.length;

  const catalogue = useMemo(
    () =>
      events.filter(
        (m) =>
          (cls === "all" || financeClassOf(m) === cls) &&
          (region === "all" || financeRegionOf(m) === region),
      ),
    [events, cls, region],
  );

  const regionLabel =
    region === "all"
      ? "every region"
      : (FINANCE_REGIONS.find((r) => r.code === region)?.label ?? region);

  return (
    <div className="flex flex-col" style={{ marginTop: isMobile ? 18 : 20, gap: 22 }}>
      <VerticalHeader
        compact={isMobile}
        eyebrow="Finance · daily closes"
        title="Which way does it close?"
        subtitle={
          <>
            One round per trading day, settled at the closing bell. Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 700 }}>$1</strong>, losing
            shares pay $0.
          </>
        }
        right={
          isMobile ? undefined : <SessionStatusChip groups={groups} nowMs={nowMs} />
        }
      />

      {/* Filters — row 1 ASSET CLASS, row 2 REGION. */}
      <div className="flex flex-col" style={{ gap: 9 }}>
        <DimensionRow label="Asset class" scroll={isMobile} labelWidth={88}>
          <DimensionPill
            label="All"
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
        <DimensionRow label="Region" scroll={isMobile} labelWidth={88}>
          <DimensionPill
            label="All regions"
            active={region === "all"}
            onSelect={() => setRegion("all")}
            mobile={isMobile}
          />
          {FINANCE_REGIONS.map((r) => (
            <DimensionPill
              key={r.code}
              label={r.label}
              active={region === r.code}
              onSelect={() => setRegion(r.code)}
              mobile={isMobile}
            />
          ))}
        </DimensionRow>
      </div>

      {/* Engine — session-aware daily rounds. */}
      {engineOn && (trading.length > 0 || asleep.length > 0) && (
        <div className="flex flex-col" style={{ gap: 12 }}>
          <div
            className={isMobile ? "flex flex-col" : "grid"}
            style={
              isMobile
                ? { gap: 10 }
                : { gap: 12, gridTemplateColumns: "1fr 1fr" }
            }
          >
            {trading.map((row) => (
              <TradingStockRow key={row.id} row={row} tickSeconds={tickSeconds} />
            ))}
          </div>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {asleep.map(({ row, nextOpen }) => (
              <AsleepStockRow key={row.id} row={row} nextOpen={nextOpen} />
            ))}
          </div>
          {(shown < totalNames || groups.wakeLabels.length > 0) && (
            <div
              className="flex items-center"
              style={{ gap: 12, paddingTop: 12 }}
            >
              {shown < totalNames && (
                <span className="flex-none" style={{ fontSize: 11, color: "#6B7280" }}>
                  {`Showing ${shown} of ${totalNames} ${region === "all" ? "" : `${regionLabel} `}names`}
                </span>
              )}
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

      {/* Catalogue */}
      <div
        className="flex flex-col"
        style={{ gap: 14, borderTop: "1px solid #1D2026", paddingTop: 22 }}
      >
        <CatalogueHeader
          compact={isMobile}
          title="What else could the markets do?"
          subtitle="Questions that run longer than one trading day. Winning shares pay $1."
          count={catalogue.length}
        />
        {catalogue.length === 0 ? (
          <EmptyState
            variant="page"
            title="Nothing open here yet"
            description="Try another class or region — new markets land as they open."
            actionLabel="See everything"
            onAction={() => {
              setCls("all");
              setRegion("all");
            }}
          />
        ) : (
          renderGrid(catalogue)
        )}
      </div>
    </div>
  );
};

export default LiteFinanceView;
