// ============================================================
// TABLE — coin selector. Collapsed: "● BTC ▾". Open: list with name,
// live Up % and the round you'd land on; a search box appears once the
// list is longer than 5 (memecoin-ready — the quick-round roll job decides
// what coins exist; this component only lists what it is given).
// ============================================================
import { useEffect, useRef, useState } from "react";
import { COIN_META, type Coin } from "@/components/lite/intraday/intradayData";

export interface CoinRow {
  coin: Coin;
  /** Up option price of the live round (0–1), null when no live round. */
  upPrice: number | null;
}

const COLOR: Record<string, string> = { btc: "#F7931A", eth: "#8C8CFF", sol: "#9945FF" };
const colorOf = (c: string) => COLOR[c] ?? "#6B7280";

interface Props {
  value: Coin;
  rows: CoinRow[];
  onChange: (c: Coin) => void;
}

export const CoinSelect = ({ value, rows, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const showSearch = rows.length > 5;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const list = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    const m = COIN_META[r.coin];
    return m.ticker.toLowerCase().includes(s) || m.name.toLowerCase().includes(s);
  });

  return (
    <div ref={box} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQ("");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#111318",
          border: "1px solid #1C1F26",
          borderRadius: 10,
          padding: "7px 10px",
          color: "#fff",
          font: "inherit",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: colorOf(value), display: "inline-block" }} />
        <b>{COIN_META[value].ticker}</b>
        <span style={{ color: "#6B7280", fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            width: 300,
            background: "#141719",
            border: "1px solid #1C1F26",
            borderRadius: 12,
            padding: 8,
            zIndex: 45,
            boxShadow: "0 16px 40px rgba(0,0,0,.6)",
          }}
        >
          {showSearch && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search coin"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#0C0D13",
                border: "1px solid #1C1F26",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#fff",
                font: "inherit",
                fontSize: 13,
                marginBottom: 6,
                outline: "none",
              }}
            />
          )}
          {list.length === 0 && <div style={{ padding: 10, fontSize: 12, color: "#6B7280" }}>No coin matches</div>}
          {list.map((r) => {
            const m = COIN_META[r.coin];
            const on = r.coin === value;
            return (
              <div
                key={r.coin}
                onClick={() => {
                  onChange(r.coin);
                  setOpen(false);
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  background: on ? "#1E2229" : undefined,
                  color: "#fff",
                }}
                onMouseEnter={(e) => !on && ((e.currentTarget as HTMLElement).style.background = "#1A1D24")}
                onMouseLeave={(e) => !on && ((e.currentTarget as HTMLElement).style.background = "")}
              >
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: colorOf(r.coin) }} />
                <span>
                  <b>{m.ticker}</b>
                  <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 6 }}>{m.name}</span>
                </span>
                <span className="font-mono" style={{ fontSize: 12, textAlign: "right", color: r.upPrice == null ? "#6B7280" : "#33D6FF" }}>
                  {r.upPrice == null ? "no live round" : `${Math.round(r.upPrice * 100)}% Up`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
