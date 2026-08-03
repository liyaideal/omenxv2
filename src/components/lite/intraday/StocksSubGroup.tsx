// ============================================================
// "Stocks closing today" — session tabs + rows.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import {
  HK_STOCK_SUBTYPE,
  StockEventRow,
  US_STOCK_SUBTYPE,
  seedFromId,
} from "./intradayData";
import { formatMarketPrice, resolveStockMarket } from "@/lib/usStockSessions";
import { cn } from "@/lib/utils";

const MICRO: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6B7280",
};

type SessionKey = "us" | "hk";

const SESSION_META: Record<SessionKey, { name: string; close: string }> = {
  us: { name: "US", close: "Closes 4:00 PM ET" },
  hk: { name: "Hong Kong", close: "Closes 4:00 PM HKT" },
};

const inHours = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `in ${h}h ${String(m).padStart(2, "0")}m`;
};

const UpChip = ({
  label,
  cents,
  tone,
  onClick,
}: {
  label: string;
  cents: number;
  tone: "up" | "down";
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="font-display shrink-0"
    style={{
      fontWeight: 700,
      fontSize: 12,
      padding: "9px 14px",
      borderRadius: 10,
      background: tone === "up" ? "rgba(51,214,255,.13)" : "rgba(207,255,74,.13)",
      border: `1.5px solid ${tone === "up" ? "rgba(51,214,255,.4)" : "rgba(207,255,74,.4)"}`,
      color: tone === "up" ? "#33D6FF" : "#CFFF4A",
    }}
  >
    {label} {cents}¢
  </button>
);

const StockRow = ({
  row,
  tickSeconds,
  compact,
}: {
  row: StockEventRow;
  tickSeconds: number;
  compact: boolean;
}) => {
  const navigate = useNavigate();
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket(row);
  const seed = seedFromId(row.id);
  const base = row.base_price;
  const price = base != null ? base * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009) : null;
  const pct = base && price ? ((price - base) / base) * 100 : 0;

  const go = (side: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/spot?event=${encodeURIComponent(row.id)}&side=${side}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/spot?event=${encodeURIComponent(row.id)}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
      }}
      className="flex cursor-pointer items-center gap-[10px]"
      style={{
        height: compact ? 52 : 60,
        background: "#131519",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 12,
        padding: "0 10px",
      }}
    >
      <AssetAvatar symbol={ticker} kind="equity" size={compact ? 30 : 34} />
      <div className="min-w-0 flex-1">
        <div className="font-display truncate" style={{ fontSize: 13.5, fontWeight: 700 }}>
          {ticker}
        </div>
        {compact ? (
          <div className="flex items-baseline gap-[6px]">
            <span className="font-display" style={{ fontSize: 11, color: "#C9CED6" }}>
              {price != null ? formatMarketPrice(price, market) : "—"}
            </span>
            <span style={{ fontSize: 11, color: pct >= 0 ? "#3FD68C" : "#FF5A5F" }}>
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(2)}%
            </span>
          </div>
        ) : (
          <div className="truncate" style={{ fontSize: 10.5, color: "#6B7280" }}>
            {company}
          </div>
        )}
      </div>
      {!compact && (
        <div className="text-right">
          <div className="font-display" style={{ fontSize: 13.5, fontWeight: 700 }}>
            {price != null ? formatMarketPrice(price, market) : "—"}
          </div>
          <div style={{ fontSize: 11, color: pct >= 0 ? "#3FD68C" : "#FF5A5F" }}>
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(2)}%
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-[6px]">
        <UpChip label="Up" cents={Math.round(row.upPrice * 100)} tone="up" onClick={go("up")} />
        <UpChip
          label="Not Up"
          cents={Math.round(row.downPrice * 100)}
          tone="down"
          onClick={go("down")}
        />
      </div>
    </div>
  );
};

export const StocksSubGroup = ({
  rows,
  isMobile,
  tickSeconds,
}: {
  rows: StockEventRow[];
  isMobile: boolean;
  tickSeconds: number;
}) => {
  const bySession = useMemo(() => {
    const map: Record<SessionKey, StockEventRow[]> = { us: [], hk: [] };
    // One round per stock per session: dedupe by ticker, keep the round
    // that settles soonest, and cap the group at the six seeded names.
    const seen: Record<SessionKey, Map<string, StockEventRow>> = {
      us: new Map(),
      hk: new Map(),
    };
    for (const r of rows) {
      const k: SessionKey = r.event_subtype === HK_STOCK_SUBTYPE ? "hk" : "us";
      const t = deriveTickerFromEvent(r.id, r.name);
      const prev = seen[k].get(t);
      const endOf = (x: StockEventRow) =>
        x.end_date ? new Date(x.end_date).getTime() : Infinity;
      if (!prev || endOf(r) < endOf(prev)) seen[k].set(t, r);
    }
    (["us", "hk"] as SessionKey[]).forEach((k) => {
      map[k] = [...seen[k].values()].slice(0, 6);
    });
    return map;
  }, [rows]);

  const available = (["us", "hk"] as SessionKey[]).filter((k) => bySession[k].length > 0);

  // Auto-select the session closest to its close.
  const closestFirst = useMemo(() => {
    const soonest = (k: SessionKey) =>
      Math.min(
        ...bySession[k].map((r) =>
          r.end_date ? new Date(r.end_date).getTime() - Date.now() : Infinity,
        ),
      );
    return [...available].sort((a, b) => soonest(a) - soonest(b));
  }, [available, bySession]);

  const [session, setSession] = useState<SessionKey | null>(null);
  useEffect(() => {
    if (session && available.includes(session)) return;
    setSession(closestFirst[0] ?? null);
  }, [closestFirst, available, session]);

  const [expanded, setExpanded] = useState(false);

  if (!session) return null;
  const list = bySession[session];
  const shown = isMobile && !expanded ? list.slice(0, 3) : list;

  const closesIn = (k: SessionKey) => {
    const arr = bySession[k];
    const anchor = arr
      .map((r) => (r.freeze_time ?? r.end_date ? new Date((r.freeze_time ?? r.end_date)!).getTime() : Infinity))
      .sort((a, b) => a - b)[0];
    if (!isFinite(anchor)) return "";
    return inHours(anchor - Date.now());
  };

  const Tabs = (
    <div className="flex flex-wrap items-center gap-[6px]">
      {available.map((k) => {
        const active = k === session;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setSession(k)}
            className="flex shrink-0 items-center gap-[6px] rounded-full transition-colors"
            style={{
              padding: "6px 11px",
              fontSize: 11.5,
              border: `1.5px solid ${active ? "#FF8A3D" : "#2B2F38"}`,
              color: active ? "#C9CED6" : "#6B7280",
            }}
          >
            {active && (
              <span
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF8A3D" }}
              />
            )}
            <span>
              {SESSION_META[k].name} · {SESSION_META[k].close}
            </span>
            {active && (
              <span className="font-display" style={{ fontWeight: 700, color: "#FF8A3D" }}>
                {closesIn(k)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ marginTop: 22 }}>
      <div
        className={cn(
          "gap-3",
          isMobile ? "flex flex-col" : "flex items-end justify-between",
        )}
      >
        <div>
          <div className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>
            Stocks closing today
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            one round per name · settles at the closing bell
          </div>
        </div>
        {Tabs}
      </div>

      <div
        className={cn("grid gap-[10px]", isMobile ? "grid-cols-1" : "grid-cols-2")}
        style={{ marginTop: 12 }}
      >
        {shown.map((r) => (
          <StockRow key={r.id} row={r} tickSeconds={tickSeconds} compact={isMobile} />
        ))}
      </div>

      {isMobile && !expanded && list.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mx-auto block text-primary"
          style={{ marginTop: 10, fontSize: 12.5 }}
        >
          All {list.length} stocks ↓
        </button>
      )}

      <div style={{ ...MICRO, textTransform: "none", letterSpacing: 0, fontSize: 11.5, marginTop: 10 }}>
        One round per stock per session · settles at the closing bell
      </div>
    </div>
  );
};

export default StocksSubGroup;