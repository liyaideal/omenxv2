// ============================================================
// TABLE ② "what's happening" — the stage: price line against the open.
// The line is NEUTRAL (white) on purpose: Up/Down colours are reserved for
// the ladder dot, the area tint and the two zones, so the chart can never
// read as "Up's line". The ladder (TableLadder) is this chart's Y axis.
// ============================================================
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/formatPrice";
import { DIM, DOWN, UP, money, type TableSide } from "./tableMath";

export interface StagePoint {
  /** seconds since round open */
  t: number;
  p: number;
}

export interface StageFlash {
  side: TableSide;
  close: number;
  open: number;
  /** null → you had nothing on the table */
  pnl: number | null;
  pct: boolean;
}

interface Props {
  points: StagePoint[];
  open: number;
  durationSec: number;
  price: number;
  /** "▲ +$19.20 above open" etc. */
  deviationText: string;
  deviationSide: TableSide | "flat";
  marketUpPct: number;
  flash: StageFlash | null;
  onShareWin?: () => void;
}

export const TableStage = ({ points, open, durationSec, price, deviationText, deviationSide, marketUpPct, flash, onShareWin }: Props) => {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== r.width * dpr || c.height !== r.height * dpr) {
      c.width = r.width * dpr;
      c.height = r.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width;
    const H = r.height;
    ctx.clearRect(0, 0, W, H);
    const xs = (t: number) => (t / durationSec) * (W - 40);
    const top = 96;
    const bot = H - 24;
    const ps = points.map((k) => k.p).concat([open]);
    let lo = Math.min(...ps);
    let hi = Math.max(...ps);
    const pad = Math.max((hi - lo) * 0.25, open * 0.0006);
    lo -= pad;
    hi += pad;
    const ys = (p: number) => top + ((hi - p) / (hi - lo)) * (bot - top);

    ctx.strokeStyle = "rgba(255,255,255,.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = top + ((bot - top) * i) / 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // open line (neutral, full width)
    ctx.strokeStyle = "#3a3f4a";
    ctx.beginPath();
    ctx.moveTo(0, ys(open));
    ctx.lineTo(W, ys(open));
    ctx.stroke();
    ctx.fillStyle = DIM;
    ctx.font = "10.5px 'JetBrains Mono', 'Space Grotesk', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`OPEN · ${formatPrice(open)}`, W - 56, ys(open) - 6);
    ctx.textAlign = "left";
    // settle marker
    const sx = xs(durationSec);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,138,61,.5)";
    ctx.beginPath();
    ctx.moveTo(sx, top - 20);
    ctx.lineTo(sx, H);
    ctx.stroke();
    ctx.setLineDash([]);
    if (points.length < 2) return;

    const col = "#E6E8EC";
    ctx.beginPath();
    points.forEach((k, i) => {
      const x = xs(k.t);
      const y = ys(k.p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.14;
    ctx.filter = "blur(6px)";
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    const last = points[points.length - 1];
    const up = price >= open;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, up ? "rgba(51,214,255,.16)" : "rgba(207,255,74,.14)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.lineTo(xs(last.t), bot);
    ctx.lineTo(xs(points[0].t), bot);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    const ac = up ? "51,214,255" : "207,255,74";
    ctx.beginPath();
    ctx.arc(xs(last.t), ys(last.p), 9, 0, 7);
    ctx.fillStyle = `rgba(${ac},.18)`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(xs(last.t), ys(last.p), 3.5, 0, 7);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }, [points, open, durationSec, price]);

  const devColor = deviationSide === "up" ? UP : deviationSide === "down" ? DOWN : DIM;
  const devGlow =
    deviationSide === "up" ? "0 0 14px rgba(51,214,255,.6)" : deviationSide === "down" ? "0 0 14px rgba(207,255,74,.6)" : "none";

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <canvas ref={cv} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", left: 28, top: 16, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: DIM }}>
        ② what's happening
      </div>
      <div style={{ position: "absolute", right: 20, top: 16, textAlign: "right" }}>
        <div className="font-mono" style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-.02em", textShadow: "0 0 24px rgba(255,255,255,.25)", color: "#fff" }}>
          {formatPrice(price)}
        </div>
        <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: devColor, textShadow: devGlow }}>
          {deviationText} · market {marketUpPct}% Up
        </div>
      </div>

      {/* Settle flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "rgba(10,10,16,.72)",
          backdropFilter: "blur(4px)",
          opacity: flash ? 1 : 0,
          pointerEvents: flash ? "auto" : "none",
          transition: "opacity .25s",
        }}
      >
        {flash && (
          <>
            <b style={{ fontSize: 64, letterSpacing: ".04em", color: flash.side === "up" ? UP : DOWN }}>
              {flash.side === "up" ? "UP" : "DOWN"} ✓
            </b>
            <span style={{ fontSize: 14, color: "#9CA3AC" }}>
              Closed <span className="font-mono">{formatPrice(flash.close)}</span> ·{" "}
              {flash.close >= flash.open ? "+" : "−"}
              {flash.pct
                ? `${Math.abs(((flash.close - flash.open) / flash.open) * 100).toFixed(2)}%`
                : `$${Math.abs(flash.close - flash.open).toFixed(2)}`}{" "}
              vs open
              {flash.pnl != null && (
                <>
                  {" · "}
                  <b style={{ color: flash.pnl >= 0 ? DOWN : "#FF5C5C" }}>
                    You {flash.pnl >= 0 ? "won" : "lost"} {money(flash.pnl)}
                  </b>
                </>
              )}
            </span>
            {flash.pnl != null && flash.pnl > 0 && onShareWin && (
              <button
                onClick={onShareWin}
                style={{
                  marginTop: 10,
                  border: "1px solid rgba(255,255,255,.3)",
                  background: "rgba(255,255,255,.08)",
                  color: "#fff",
                  fontSize: 12,
                  padding: "8px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Share this win
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
