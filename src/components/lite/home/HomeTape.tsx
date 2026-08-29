// ============================================================
// HOME TAPE (HP-1) — one-line quote strip above the hero.
// Data comes ONLY from the two streams the page already runs:
//   crypto  = intraday quick-round spot stream (currentFor)
//   equity  = daily stock rounds (usStockSessions pricing)
// No polling of its own, no external quote dependency.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  COIN_META,
  Coin,
  QuickEvent,
  StockEventRow,
  derivedPrice,
  seedFromId,
  upOptionOf,
} from "@/components/lite/intraday/intradayData";
import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";
import { formatMarketPrice, resolveStockMarket } from "@/lib/usStockSessions";

const UP_C = "#4ADE80";
const DOWN_C = "#F87171";

/** Fixed content order — never data-driven. */
const CRYPTO_ORDER: Coin[] = ["btc", "eth", "sol"];
const EQUITY_ORDER = ["NVDA", "TSLA", "AAPL", "MSFT", "META"];

export interface TapeItem {
  key: string;
  symbol: string;
  price: string;
  pct: number;
  href: string;
}

export const buildTapeItems = (
  currentFor: Map<string, QuickEvent>,
  tf: string,
  stockRows: StockEventRow[],
  tickSeconds: number,
): TapeItem[] => {
  const out: TapeItem[] = [];

  for (const coin of CRYPTO_ORDER) {
    const ev =
      currentFor.get(`${coin}-${tf}`) ??
      [...currentFor.values()].find((e) => e.coin === coin) ??
      null;
    if (!ev || ev.base_price == null) continue;
    const up = upOptionOf(ev);
    const price = derivedPrice(
      ev.base_price,
      up ? up.price : 0.5,
      seedFromId(ev.id),
      tickSeconds,
    );
    if (price == null) continue;
    out.push({
      key: coin,
      symbol: COIN_META[coin].ticker,
      price: `$${price.toLocaleString(undefined, {
        minimumFractionDigits: price < 1000 ? 2 : 0,
        maximumFractionDigits: price < 1000 ? 2 : 0,
      })}`,
      pct: ((price - ev.base_price) / ev.base_price) * 100,
      href: `/spot?event=${encodeURIComponent(ev.id)}`,
    });
  }

  const byTicker = new Map<string, StockEventRow>();
  for (const r of stockRows) {
    const t = deriveTickerFromEvent(r.id, r.name);
    if (!byTicker.has(t)) byTicker.set(t, r);
  }
  for (const ticker of EQUITY_ORDER) {
    const row = byTicker.get(ticker);
    if (!row || row.base_price == null) continue;
    const seed = seedFromId(row.id);
    const price =
      row.base_price * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009);
    out.push({
      key: ticker,
      symbol: ticker,
      price: formatMarketPrice(price, resolveStockMarket(row)),
      pct: ((price - row.base_price) / row.base_price) * 100,
      href: `/spot?event=${encodeURIComponent(row.id)}`,
    });
  }
  return out;
};

const TapeCell = ({ item, onClick }: { item: TapeItem; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-none items-center whitespace-nowrap font-display"
    style={{ gap: 8, fontSize: 13, fontVariantNumeric: "tabular-nums" }}
  >
    <span style={{ fontWeight: 700, color: "#F2F3F5" }}>{item.symbol}</span>
    <span style={{ color: "#C9CED6" }}>{item.price}</span>
    <span style={{ color: item.pct < 0 ? DOWN_C : UP_C }}>
      {item.pct < 0 ? "\u2212" : "+"}
      {Math.abs(item.pct).toFixed(2)}%
    </span>
  </button>
);

export const HomeTapeSkeleton = ({ height = 42 }: { height?: number }) => (
  <div
    className="w-full animate-pulse"
    style={{
      height,
      background: "#0C0F14",
      borderTop: "1px solid rgba(148,163,184,0.10)",
      borderBottom: "1px solid rgba(148,163,184,0.10)",
    }}
  />
);

export const HomeTape = ({
  items,
  loading,
  isMobile,
}: {
  items: TapeItem[];
  loading: boolean;
  isMobile: boolean;
}) => {
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(38);

  useEffect(() => {
    const measure = () => {
      const r = railRef.current?.scrollWidth ?? 0;
      if (r === 0) return;
      // Constant linear speed: ~30 px/s. scrollWidth is the duplicated rail,
      // so one visible loop is half that distance (~45 s per loop).
      const seconds = Math.max(20, r / 60);
      setDuration(seconds);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length, isMobile]);

  if (loading) return <HomeTapeSkeleton height={isMobile ? 40 : 42} />;
  if (items.length === 0) return null;

  const cells = (dup: boolean) =>
    items.map((it) => (
      <TapeCell
        key={`${dup ? "b" : "a"}-${it.key}`}
        item={it}
        onClick={() => navigate(it.href)}
      />
    ));

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        height: isMobile ? 40 : 42,
        background: "#0C0F14",
        borderTop: "1px solid rgba(148,163,184,0.10)",
        borderBottom: "1px solid rgba(148,163,184,0.10)",
      }}
    >
      <div
        className="mx-auto flex h-full w-full max-w-7xl items-center overflow-hidden"
        style={{ paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24 }}
      >
        <div
          ref={railRef}
          className="lite-tape-rail flex items-center"
          style={{
            gap: isMobile ? 24 : 40,
            minWidth: "max-content",
            ["--duration" as string]: `${duration}s`,
          }}
        >
          {cells(false)}
          {cells(true)}
        </div>
      </div>
    </div>
  );
};

export default HomeTape;
