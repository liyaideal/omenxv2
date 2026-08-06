// ============================================================
// MOBILE STOCK ROW (390) — Crypto-tile style for daily stock rounds.
// Used by the Finance vertical view on mobile.
// ============================================================
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import {
  type StockEventRow,
  formatCountdown,
  seedFromId,
} from "@/components/lite/intraday/intradayData";
import {
  PctChange,
  PriceReadout,
} from "@/components/lite/shared/primitives";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import {
  formatMarketPrice,
  resolveStockMarket,
} from "@/lib/usStockSessions";
import { DirectionButton } from "../categoryviews/verticalBlocks";


const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

export const MobileTradingStockRow = ({
  row,
  tickSeconds,
}: {
  row: StockEventRow;
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket(row);
  const seed = seedFromId(row.id);
  const base = row.base_price;
  const price =
    base != null ? base * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009) : null;
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const endMs = row.end_date ? new Date(row.end_date).getTime() : null;

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/spot?event=${encodeURIComponent(row.id)}${side ? `&side=${side}` : ""}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go()}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
      }}
      className="flex cursor-pointer flex-col"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "13px 14px",
        gap: 11,
      }}
    >
      <div className="flex items-center" style={{ gap: 11 }}>
        <AssetAvatar symbol={ticker} kind="equity" size={34} />
        <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 1 }}>
          <span
            style={{
              fontSize: 10,
              color: "#9AA1AC",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {ticker} · Daily round
          </span>
          <span className="flex items-baseline" style={{ gap: 7 }}>
            <PriceReadout
              text={price != null ? formatMarketPrice(price, market) : "—"}
              size={18}
              letterSpacing="-0.02em"
            />
            <PctChange value={pct} size={11} weight={700} />
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end" style={{ gap: 1 }}>
          <span style={MICRO}>Closes</span>
          <span
            className="font-display"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#FF8A3D",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {endMs != null ? formatCountdown(endMs - Date.now()) : "—"}
          </span>
        </span>
      </div>

      <div className="flex" style={{ gap: 8 }}>
        <DirectionButton
          label="Up"
          price={row.upPrice}
          tone="up"
          grow
          minHeight={48}
          radius={11}
          padding="0 13px"
          labelSize={12}
          priceSize={16}
          onClick={go("up")}
        />
        <DirectionButton
          label="Not up"
          price={row.downPrice}
          tone="down"
          grow
          minHeight={48}
          radius={11}
          padding="0 13px"
          labelSize={12}
          priceSize={16}
          onClick={go("down")}
        />
      </div>
    </div>
  );
};

export const MobileAsleepStockRow = ({
  row,
  nextOpen,
}: {
  row: StockEventRow;
  nextOpen: string;
}) => {
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket(row);

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#0E1014",
        border: "1px solid #16181D",
        borderRadius: 14,
        padding: "13px 14px",
        gap: 8,
        opacity: 0.8,
      }}
    >
      <div className="flex items-center" style={{ gap: 11 }}>
        <span style={{ opacity: 0.55, display: "inline-flex" }}>
          <AssetAvatar symbol={ticker} kind="equity" size={34} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 1 }}>
          <span
            style={{
              fontSize: 10,
              color: "#9AA1AC",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {ticker} · Daily round
          </span>
          <span style={{ fontSize: 12, color: "#6B7280" }} className="truncate">
            {company}
            {row.base_price != null
              ? ` · last close ${formatMarketPrice(row.base_price, market)}`
              : ""}
          </span>
        </span>
      </div>
      <span style={{ fontSize: 12, color: "#6B7280" }}>
        Round opens {nextOpen}
      </span>
    </div>
  );
};

export default MobileTradingStockRow;
