// ============================================================
// TABLE — chip × Boost tray. Sits ON the open line between UP and DOWN so a
// chip is dragged up for UP, down for DOWN (or: pick a chip, tap a zone).
// Chips and Boost are one block by design (Liya: Boost conversion depends
// on it sitting next to the chips). The equation line is the only numbers
// the user needs before placing: $chip × boost = $position · shares · fee.
// Drag is pointer-events based (mouse + touch); the drop target is whatever
// [data-table-side] is under the pointer on release.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { quoteTableOrder } from "./tableQuote";
import { TableChip } from "./TableChip";
import { BOOSTS, CHIP_VALUES, type Boost, type ChipValue, type TableSide } from "./tableMath";

interface Props {
  chip: ChipValue;
  boost: Boost;
  onChip: (v: ChipValue) => void;
  onBoost: (b: Boost) => void;
  /** Current price of the side the user is most likely to hit (for the quote line). */
  quotePrice: number;
  onDrop: (side: TableSide, value: ChipValue, boost: Boost) => void;
  onDragOver: (side: TableSide | null) => void;
}

export const TableTray = ({ chip, boost, onChip, onBoost, quotePrice, onDrop, onDragOver }: Props) => {
  const [ghost, setGhost] = useState<{ v: ChipValue; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ v: ChipValue; x0: number; y0: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const q = quoteTableOrder(chip, boost, quotePrice);

  const hit = (x: number, y: number): TableSide | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const z = el?.closest("[data-table-side]") as HTMLElement | null;
    return (z?.dataset.tableSide as TableSide) || null;
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
      d.moved = true;
      setGhost({ v: d.v, x: e.clientX, y: e.clientY });
      onDragOver(hit(e.clientX, e.clientY));
    };
    const end = (e: PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      setGhost(null);
      setDragging(false);
      onDragOver(null);
      if (d?.moved) {
        skipClick.current = true;
        setTimeout(() => (skipClick.current = false), 0);
        const side = hit(e.clientX, e.clientY);
        if (side) onDrop(side, d.v, boost);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragging, boost, onDrop, onDragOver]);

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(180deg,#1A1D24,#101216)",
        borderTop: "2px solid rgba(255,255,255,.5)",
        borderBottom: "2px solid rgba(255,255,255,.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 14px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.12),0 10px 30px rgba(0,0,0,.6)",
        zIndex: 2,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {CHIP_VALUES.map((v) => (
            <TableChip
              key={v}
              value={v}
              boost={boost}
              selected={v === chip}
              onClick={() => {
                if (skipClick.current) return;
                onChip(v);
              }}
              onPointerDown={(e: React.PointerEvent) => {
                onChip(v);
                drag.current = { v, x0: e.clientX, y0: e.clientY, moved: false };
                setGhost(null);
                setDragging(true);
              }}
            />
          ))}
        </div>
        <span style={{ color: "#6B7280", fontSize: 12, margin: "0 2px" }}>×</span>
        <div style={{ display: "flex", gap: 2, background: "#0A0A10", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,.08)" }}>
          {BOOSTS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onBoost(b)}
              className="font-mono"
              style={{
                background: b === boost ? "#fff" : "transparent",
                border: 0,
                color: b === boost ? "#0A0B0D" : "#6B7280",
                fontSize: 12,
                fontWeight: b === boost ? 700 : 500,
                padding: "8px 7px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 10, color: "#6B7280", whiteSpace: "nowrap" }}>
        <span>↑ UP · ↓ DOWN · drag or tap</span>
        <span>
          ${chip}×{boost} = <b className="font-mono" style={{ color: "#fff" }}>${chip * boost}</b> · {q.shares.toFixed(0)} sh · fee ${q.fee.toFixed(2)}
        </span>
      </div>

      {ghost &&
        createPortal(
          <div style={{ position: "fixed", left: ghost.x, top: ghost.y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 60 }}>
            <TableChip value={ghost.v} boost={boost} style={{ boxShadow: "0 14px 28px rgba(0,0,0,.7),inset 0 0 0 3px rgba(0,0,0,.22),inset 0 0 0 4px rgba(255,255,255,.35)" }} />
          </div>,
          document.body,
        )}
    </div>
  );
};
