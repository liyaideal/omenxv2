// ============================================================
// TABLE ④ "your result" — this round · live · today, plus the two actions
// that belong to "seeing the result": Share and Cash out.
// ============================================================
import { DOWN, LOSS, UP, money, type TableSide } from "./tableMath";

export interface ResultHolding {
  side: TableSide;
  margin: number;
  notional: number;
  shares: number;
  /** weighted entry (option price) */
  entry: number;
  boosts: number[];
  livePnl: number;
  currentValue: number;
  profitIfWin: number;
}

interface Props {
  holding: ResultHolding | null;
  /** When nothing is held: what the empty state should say. */
  emptyText: string;
  net: number;
  won: number;
  lost: number;
  canCashOut: boolean;
  onCashOut: () => void;
  onShare: () => void;
}

const LBL: React.CSSProperties = { fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#6B7280", whiteSpace: "nowrap" };
const V: React.CSSProperties = { fontSize: 22, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "baseline", gap: 10, whiteSpace: "nowrap" };
const SMALL: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#9CA3AC" };
const BTN: React.CSSProperties = {
  border: "1px solid #1C1F26",
  background: "#141719",
  color: "#fff",
  font: "inherit",
  fontSize: 12,
  fontWeight: 600,
  padding: "9px 16px",
  borderRadius: 10,
  cursor: "pointer",
};

export const TableResult = ({ holding, emptyText, net, won, lost, canCashOut, onCashOut, onShare }: Props) => {
  const sideCol = holding ? (holding.side === "up" ? UP : DOWN) : undefined;
  const glow = holding ? (holding.side === "up" ? "0 0 14px rgba(51,214,255,.5)" : "0 0 14px rgba(207,255,74,.5)") : undefined;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 40,
        padding: "0 24px",
        height: "100%",
        background: "linear-gradient(180deg,#0B0C11,#0E1016)",
      }}
    >
      <div style={LBL}>④ your result</div>
      <div>
        <div style={LBL}>This round</div>
        <div style={V}>
          {holding ? (
            <>
              <span style={{ color: sideCol, textShadow: glow }}>
                {holding.side === "up" ? "Up" : "Down"} · ${Math.round(holding.notional)} position
              </span>
              <small style={SMALL}>
                ${holding.margin} margin · {holding.boosts.join("/")}× · {Math.round(holding.shares)} sh @ {(holding.entry * 100).toFixed(1)}¢ · value $
                {holding.currentValue.toFixed(2)}
              </small>
            </>
          ) : (
            <>
              <span>—</span>
              <small style={SMALL}>{emptyText}</small>
            </>
          )}
        </div>
      </div>
      <div>
        <div style={LBL}>Live</div>
        <div style={V}>
          {holding ? (
            <>
              <span className="font-mono" style={{ color: holding.livePnl >= 0 ? DOWN : LOSS, textShadow: holding.livePnl >= 0 ? "0 0 14px rgba(207,255,74,.5)" : "0 0 14px rgba(255,92,92,.4)" }}>
                {money(holding.livePnl)}
              </span>
              <small style={SMALL}>
                if {holding.side === "up" ? "Up" : "Down"} wins <b style={{ color: DOWN }}>+${holding.profitIfWin.toFixed(0)}</b>
              </small>
            </>
          ) : (
            <span className="font-mono">—</span>
          )}
        </div>
      </div>
      <div>
        <div style={LBL}>Today</div>
        <div style={V}>
          <span className="font-mono" style={{ color: net >= 0 ? DOWN : LOSS, textShadow: net >= 0 ? "0 0 14px rgba(207,255,74,.5)" : "0 0 14px rgba(255,92,92,.4)" }}>
            {money(net)}
          </span>
          <small style={SMALL}>
            {won} won · {lost} lost
          </small>
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button type="button" style={{ ...BTN, opacity: holding ? 1 : 0.35, cursor: holding ? "pointer" : "not-allowed" }} disabled={!holding} onClick={onShare}>
          Share
        </button>
        <button
          type="button"
          style={{ ...BTN, borderColor: LOSS, color: LOSS, opacity: canCashOut ? 1 : 0.35, cursor: canCashOut ? "pointer" : "not-allowed" }}
          disabled={!canCashOut}
          onClick={onCashOut}
        >
          Cash out
        </button>
      </div>
    </div>
  );
};
