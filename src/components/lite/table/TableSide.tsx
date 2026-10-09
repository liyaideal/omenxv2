// ============================================================
// TABLE ③ — one side of the decision (UP on top, DOWN below the tray).
// States: open · held (breathing glow) · flip-ready (you hold the other
// side — a chip here flips) · pending (incl. flip) · drag-over · won · lost.
// Chips on the zone: filled (solid, ×Boost), queued (dashed), pending (spin
// ring — tap to cancel).
// ============================================================
import { TableChip } from "./TableChip";
import { DOWN, UP, type Boost, type ChipValue, type TableSide as Side } from "./tableMath";
import type { PendingChip, QueuedChip } from "./useTableOrders";

export interface ZoneHolding {
  /** Cash in (margin) */
  margin: number;
  /** margin × boost */
  notional: number;
  shares: number;
  /** Profit if this side wins */
  profit: number;
}

interface Props {
  side: Side;
  price: number;
  holding: ZoneHolding | null;
  /** Filled orders this round, newest last (drawn as small chips). */
  filled: { value: ChipValue; boost: number }[];
  pending: PendingChip[];
  queued: QueuedChip[];
  /** Side the user holds; when it is the other one, a chip here is a FLIP. */
  lockedBy: Side | null;
  /** Cash that comes back if the held leg is closed (shown on the flip copy). */
  flipCredit?: number;
  settling: boolean;
  over: boolean;
  result: "won" | "lost" | null;
  boost: Boost;
  onTap: () => void;
  onCancelPending: (id: number) => void;
}

export const TableSideZone = ({ side, price, holding, filled, pending, queued, lockedBy, flipCredit = 0, settling, over, result, boost, onTap, onCancelPending }: Props) => {
  const up = side === "up";
  const col = up ? UP : DOWN;
  const rgb = up ? "51,214,255" : "207,255,74";
  const flipReady = !!lockedBy && lockedBy !== side && !settling;
  const has = !!holding || pending.length > 0 || queued.length > 0;
  const queuedAmt = queued.reduce((a, c) => a + c.value, 0);
  const queuedNot = queued.reduce((a, c) => a + c.value * c.boost, 0);

  const bg = up
    ? `linear-gradient(180deg,rgba(${rgb},${has ? ".10" : ".06"}),rgba(${rgb},${has ? ".26" : ".16"}))`
    : `linear-gradient(180deg,rgba(${rgb},${has ? ".26" : ".16"}),rgba(${rgb},${has ? ".10" : ".06"}))`;

  const sub = flipReady
    ? `you hold ${lockedBy === "up" ? "Up" : "Down"} · a chip here flips to ${up ? "Up" : "Down"}`
    : holding
      ? `you hold ${Math.round(holding.shares)} sh · to win +$${holding.profit.toFixed(0)}`
      : queuedAmt
        ? `$${queuedNot} queued · buys at next open`
        : `pays $1.00 / share${boost > 1 ? ` · ${boost}× boost` : ""}`;

  return (
    <button
      type="button"
      data-table-side={side}
      onClick={(e) => {
        const t = (e.target as HTMLElement).closest("[data-pending-id]") as HTMLElement | null;
        if (t) {
          onCancelPending(Number(t.dataset.pendingId));
          return;
        }
        onTap();
      }}
      className={has && !result ? (up ? "omx-breathe-up" : "omx-breathe-down") : undefined}
      style={{
        position: "relative",
        border: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        font: "inherit",
        color: col,
        padding: 0,
        background: bg,
        opacity: result === "lost" ? 0.3 : flipReady ? 0.7 : 1,
        outline: over ? `2px dashed ${col}` : undefined,
        outlineOffset: over ? -6 : undefined,
        boxShadow: result === "won" ? `inset 0 0 0 3px ${col}` : has ? "inset 0 1px 0 rgba(255,255,255,.18)" : undefined,
        transition: "background .25s, opacity .25s",
        minWidth: 0,
      }}
    >
      {up && (
        <span style={{ position: "absolute", left: 20, top: 16, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#6B7280" }}>
          ③ decide · drag a chip up or down
        </span>
      )}

      {/* chips on the zone — top-right for both sides */}
      <span style={{ position: "absolute", right: 20, top: 14, display: "flex", alignItems: "center", gap: 6, zIndex: 2 }}>
        {filled.slice(-4).map((o, i) => (
          <TableChip key={`f${i}`} value={o.value} boost={o.boost} size={28} />
        ))}
        {queued.slice(-4).map((c) => (
          <TableChip key={`q${c.id}`} value={c.value} boost={c.boost} size={28} queued />
        ))}
        {pending.map((c) => (
          <TableChip key={`p${c.id}`} value={c.value} boost={c.boost} size={28} pending data-pending-id={c.id} />
        ))}
      </span>
      {(holding || queuedAmt > 0) && (
        <span
          className="font-mono"
          style={{
            position: "absolute",
            right: 20,
            top: 46,
            fontSize: 13,
            fontWeight: 700,
            background: "rgba(10,10,16,.6)",
            border: `1px solid ${col}`,
            borderRadius: 999,
            padding: "4px 10px",
          }}
        >
          {holding
            ? holding.notional > holding.margin
              ? `$${Math.round(holding.notional)} position`
              : `$${holding.margin}`
            : `$${queuedNot} next round`}
        </span>
      )}
      {pending.length > 0 && (
        <span style={{ position: "absolute", left: 0, right: 0, [up ? "bottom" : "top"]: 12, textAlign: "center", fontSize: 11, color: "#9CA3AC" }}>
          {pending.some((c) => c.flip)
            ? `Flipping · closes your ${lockedBy === "up" ? "Up" : "Down"} ($${flipCredit.toFixed(0)} back) · then $${pending.reduce((a, c) => a + c.value, 0)}${pending.some((c) => c.boost > 1) ? " boosted" : ""} on ${up ? "Up" : "Down"}`
            : `Filling $${pending.reduce((a, c) => a + c.value, 0)}${pending.some((c) => c.boost > 1) ? " · boosted" : ""}`}{" "}
          · tap chip to cancel
        </span>
      )}

      {up ? (
        <>
          <span style={{ fontSize: 54, fontWeight: 700, lineHeight: 1, letterSpacing: ".04em", textShadow: has ? `0 0 18px rgba(${rgb},.45)` : undefined }}>UP</span>
          <span className="font-mono" style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(price * 100)}¢</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{sub}</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{sub}</span>
          <span className="font-mono" style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(price * 100)}¢</span>
          <span style={{ fontSize: 54, fontWeight: 700, lineHeight: 1, letterSpacing: ".04em", textShadow: has ? `0 0 18px rgba(${rgb},.45)` : undefined }}>DOWN</span>
        </>
      )}
    </button>
  );
};
