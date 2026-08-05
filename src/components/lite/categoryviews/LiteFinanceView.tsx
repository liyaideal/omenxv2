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
  ORANGE,
  StockGroups,
  TradingStockRow,
  groupStockRows,
} from "./verticalBlocks";
import {
  CatalogueHeader,
  DimensionPill,
  DimensionRow,
  EYEBROW,
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
  initialClass = "stocks",
  initialRegion = "us",
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
}) => {
  const [cls, setCls] = useState<string>(initialClass);
  const [region, setRegion] = useState<string>(initialRegion);

  const groups: StockGroups = useMemo(
    () => groupStockRows(stockRows, sessionNow),
    [stockRows, tickSeconds, sessionNow],
  );

  const inRegion = (r: StockEventRow) => resolveStockMarket(r).key === region;
  const engineOn = cls === ENGINE_CLASS && region !== "kr";
  const trading = engineOn ? groups.trading.filter(inRegion) : [];
  const asleep = engineOn ? groups.asleep.filter((a) => inRegion(a.row)) : [];

  const catalogue = useMemo(
    () =>
      events.filter(
        (m) => financeClassOf(m) === cls && financeRegionOf(m) === region,
      ),
    [events, cls, region],
  );

  const clsLabel =
    FINANCE_ASSET_CLASSES.find((c) => c.code === cls)?.label ?? cls;
  const regionLabel = FINANCE_REGIONS.find((r) => r.code === region)?.label ?? region;

  return (
    <div className="flex flex-col" style={{ marginTop: isMobile ? 18 : 20, gap: 22 }}>
      <VerticalHeader
        compact={isMobile}
        eyebrow="Finance · follows the bell"
        title="Where do markets close?"
        subtitle="Daily closing rounds while the exchange is open, plus the wider finance catalogue."
        right={
          isMobile ? undefined : (
            <div className="flex flex-col items-end" style={{ gap: 6 }}>
              <span style={EYEBROW}>Open rounds</span>
              <span
                className="font-display"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {trading.length}
              </span>
            </div>
          )
        }
      />

      {/* Filters — row 1 CLASS, row 2 REGION. */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <DimensionRow label="Class" scroll={isMobile}>
          {FINANCE_ASSET_CLASSES.map((c) => (
            <DimensionPill
              key={c.code}
              label={c.label}
              active={cls === c.code}
              onSelect={() => setCls(c.code)}
            />
          ))}
        </DimensionRow>
        <DimensionRow label="Region" scroll={isMobile}>
          {FINANCE_REGIONS.map((r) => (
            <DimensionPill
              key={r.code}
              label={r.label}
              active={region === r.code}
              onSelect={() => setRegion(r.code)}
            />
          ))}
        </DimensionRow>
      </div>

      {/* Engine — session-aware daily rounds. */}
      {engineOn && (trading.length > 0 || asleep.length > 0) && (
        <div className="flex flex-col" style={{ gap: 12 }}>
          <div className="flex items-center justify-between" style={{ gap: 16 }}>
            <span
              className="flex items-center"
              style={{ ...EYEBROW, gap: 8, color: ORANGE }}
            >
              <span
                className="animate-pulse"
                style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE }}
              />
              Intraday · {regionLabel} closing rounds
            </span>
            {groups.wakeLabel && trading.length === 0 && (
              <span style={{ fontSize: 11, color: "#6B7280" }}>{groups.wakeLabel}</span>
            )}
          </div>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {trading.map((row) => (
              <TradingStockRow key={row.id} row={row} tickSeconds={tickSeconds} />
            ))}
            {asleep.map(({ row, nextOpen }) => (
              <AsleepStockRow key={row.id} row={row} nextOpen={nextOpen} />
            ))}
          </div>
        </div>
      )}

      {/* Catalogue */}
      <div
        className="flex flex-col"
        style={{ gap: 14, borderTop: "1px solid #1D2026", paddingTop: 22 }}
      >
        <CatalogueHeader
          compact={isMobile}
          title="Will it happen?"
          subtitle={`Back Yes or No on ${clsLabel} in ${regionLabel}.`}
          count={catalogue.length}
        />
        {catalogue.length === 0 ? (
          <EmptyState
            variant="page"
            title="Nothing open here yet"
            description="Try another class or region — new markets land as they open."
            actionLabel="US stocks"
            onAction={() => {
              setCls("stocks");
              setRegion("us");
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
