// ============================================================
// HOME · STOCKS CLOSING TODAY (HP-1)
// US / HK tabs over the daily up-down stock rounds. Rows stretch to
// fill the left column so the two stage columns end flush.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { DirectionButton } from "@/components/lite/categoryviews/verticalBlocks";
import { PctChange } from "@/components/lite/shared/primitives";
import {
  HK_STOCK_SUBTYPE,
  StockEventRow,
  US_STOCK_SUBTYPE,
  seedFromId,
} from "@/components/lite/intraday/intradayData";
import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";
import {
  formatLocalTime,
  formatMarketPrice,
  getMarketSession,
  resolveStockMarket,
} from "@/lib/usStockSessions";
import { CYAN, HomeCard, HomeEyebrow, HomeQuestion, LIME, MUTED } from "./homeShell";

type TabId = "us" | "hk";

const DISABLED: React.CSSProperties = {
  borderRadius: 12,
  minHeight: 38,
  padding: "0 13px",
  fontSize: 13.5,
  fontWeight: 700,
  color: "#6B7280",
  background: "#131519",
  border: "1px solid #1D2026",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const StockRow = ({
  row,
  tickSeconds,
  isMobile,
}: {
  row: StockEventRow;
  tickSeconds: number;
  isMobile: boolean;
}) => {
  const navigate = useNavigate();
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const market = resolveStockMarket(row);
  const session = getMarketSession(market);
  const base = row.base_price;
  const seed = seedFromId(row.id);
  const price =
    base != null ? base * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009) : null;
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const ended = !!row.end_date && new Date(row.end_date).getTime() <= Date.now();
  const state: "trading" | "pre" | "closed" | "stale" =
    base == null ? "stale" : ended || !session.open ? (ended ? "closed" : "pre") : "trading";

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/spot?event=${encodeURIComponent(row.id)}${side ? `&side=${side}` : ""}`);
  };

  const clickable = state === "trading";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? go() : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
            }
          : undefined
      }
      className={`flex items-center ${clickable ? "cursor-pointer" : ""}`}
      style={{
        gap: 13,
        padding: "8px 0",
        borderBottom: "1px solid rgba(148,163,184,0.07)",
      }}
    >
      <AssetAvatar symbol={ticker} kind="equity" size={28} />
      <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", width: isMobile ? undefined : 62 }}>
        {ticker}
      </span>
      {state === "stale" ? (
        <span
          className="animate-pulse"
          style={{ width: 78, height: 14, borderRadius: 6, background: "#191D24" }}
        />
      ) : (
        <>
          <span
            className="font-display"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#F2F3F5",
              width: isMobile ? undefined : 78,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {price != null ? formatMarketPrice(price, market) : "—"}
          </span>
          {!isMobile && <PctChange value={pct} size={12} weight={600} />}
        </>
      )}
      <span className="flex-1" />
      {state === "trading" ? (
        <>
          <DirectionButton
            label="Up"
            price={row.upPrice}
            tone="up"
            minHeight={38}
            labelSize={13.5}
            priceSize={13.5}
            onClick={go("up")}
          />
          <DirectionButton
            label="Down"
            price={row.downPrice}
            tone="down"
            minHeight={38}
            labelSize={13.5}
            priceSize={13.5}
            onClick={go("down")}
          />
        </>
      ) : state === "pre" ? (
        <span style={DISABLED}>Opens in {formatLocalTime(session.nextOpenAt)}</span>
      ) : state === "closed" ? (
        <>
          <span style={DISABLED}>Closed</span>
          <span
            className="font-display"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: pct >= 0 ? CYAN : LIME,
              border: `1px solid ${pct >= 0 ? "rgba(51,214,255,.45)" : "rgba(207,255,74,.45)"}`,
              borderRadius: 999,
              padding: "3px 10px",
              whiteSpace: "nowrap",
            }}
          >
            Closed {pct >= 0 ? "↑" : "↓"}
          </span>
        </>
      ) : (
        <span style={DISABLED}>Unavailable</span>
      )}
    </div>
  );
};

export const HomeStocksCard = ({
  stockRows,
  tickSeconds,
  isMobile,
  loading,
}: {
  stockRows: StockEventRow[];
  tickSeconds: number;
  isMobile: boolean;
  loading: boolean;
}) => {
  const [tab, setTab] = useState<TabId>("us");

  const { us, hk } = useMemo(() => {
    const dedupe = (rows: StockEventRow[]) => {
      const seen = new Map<string, StockEventRow>();
      for (const r of rows) {
        const t = deriveTickerFromEvent(r.id, r.name);
        if (!seen.has(t)) seen.set(t, r);
      }
      return [...seen.values()];
    };
    return {
      us: dedupe(stockRows.filter((r) => r.event_subtype === US_STOCK_SUBTYPE)),
      hk: dedupe(stockRows.filter((r) => r.event_subtype === HK_STOCK_SUBTYPE)),
    };
  }, [stockRows]);

  const rows = tab === "us" ? us : hk;
  const total = us.length + hk.length;

  const settleLine = useMemo(() => {
    if (tab === "hk") return "HK settles at close 16:00 HKT";
    const sample = us[0];
    if (!sample) return "US settles at close";
    const session = getMarketSession(resolveStockMarket(sample));
    const at = session.closeAt ?? session.nextOpenAt;
    return `US settles at close ${formatLocalTime(at)}`;
  }, [tab, us]);

  if (!loading && total === 0) return null;

  return (
    <HomeCard
      className="flex h-full flex-col"
      style={{ padding: isMobile ? "18px 16px" : "22px 28px" }}
    >
      <div className="flex items-baseline" style={{ gap: 14 }}>
        <HomeEyebrow color={CYAN}>Stocks · Closing today</HomeEyebrow>
        {!isMobile && (
          <span
            className="font-display ml-auto"
            style={{ color: MUTED, fontSize: 13, fontVariantNumeric: "tabular-nums" }}
          >
            {total} stocks · {settleLine}
          </span>
        )}
      </div>
      <div
        className={isMobile ? "flex flex-col" : "flex items-center"}
        style={{ gap: isMobile ? 10 : 16, marginTop: 8 }}
      >
        <HomeQuestion size={isMobile ? 18 : 22}>
          Will it finish higher than it opened?
        </HomeQuestion>
        <span className={isMobile ? "" : "ml-auto"}>
          <span
            className="flex w-fit"
            style={{
              gap: 4,
              background: "#0E1116",
              border: "1px solid rgba(148,163,184,0.14)",
              borderRadius: 11,
              padding: 3,
            }}
          >
            {(["us", "hk"] as TabId[]).map((id) => {
              const active = id === tab;
              const n = id === "us" ? us.length : hk.length;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className="font-display"
                  style={{
                    fontSize: 12.5,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: active ? "#FFFFFF" : "transparent",
                    color: active ? "#0B0D11" : MUTED,
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {id.toUpperCase()} · {n}
                </button>
              );
            })}
          </span>
        </span>
      </div>

      <div
        className="flex flex-1 flex-col"
        style={{ justifyContent: "space-evenly", marginTop: 4 }}
      >
        {loading && rows.length === 0
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 38,
                  margin: "8px 0",
                  borderRadius: 10,
                  background: "#191D24",
                }}
              />
            ))
          : rows.map((row) => (
              <StockRow
                key={row.id}
                row={row}
                tickSeconds={tickSeconds}
                isMobile={isMobile}
              />
            ))}
      </div>
    </HomeCard>
  );
};

export default HomeStocksCard;
