// ============================================================
// Quick Play run poster (CPO 2026-10-28, mock claude.ai/artifact/PApGeEV9DT3B2CuMWzTjpY v2).
// Same family as the Lite PnL poster (Figma 448:8785): black gradient card,
// avatar + badge, PROFIT in mono, two cells, referral + logo + QR. What makes
// it Quick Play: the QUICK PLAY chip, the plain-words line under the number
// ("Called Bitcoin up or down, 30 seconds at a time") and the designer's
// coin-shower / crying lynx. Only two numbers a stranger has to read: how
// much, and how many right. No ROI (a 30-second binary call's ROI reads as
// bait), no cabinet jargon (SESSION / COMBO / LAST 10).
// Fixed 400px, 100% inline styles — html-to-image export (skipFonts) needs it.
// ============================================================
import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { omenxLogoSolid as omenxLogo } from "@/components/Logo";
import artWin from "@/assets/arcade/share-win.png";
import artLose from "@/assets/arcade/share-lose.png";
import { SITE_URL } from "@/lib/site";
import type { ArcadeRunShare } from "@/pages/arcade/arcadeEngine";

export interface ArcadeRunPosterProps {
  run: ArcadeRunShare;
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
}

const MONO = "'Courier New', Courier, monospace";
const MUTED = "rgba(255,255,255,0.45)";
const HAIRLINE = "rgba(255,255,255,0.1)";

const T = {
  win: {
    art: artWin,
    base: "linear-gradient(222.48deg, rgba(213,255,77,0.18) 0%, rgba(51,214,255,0.18) 98.543%), #000",
    accent: "#CFFF4A",
    label: "rgba(207,255,74,0.7)",
    ring: "rgba(207,255,74,0.4)",
    glow: "rgba(207,255,74,0.22)",
    badgeBg: "#CFFF4A",
  },
  lose: {
    art: artLose,
    base: "linear-gradient(222.493deg, rgba(255,92,92,0.18) 10.631%, rgba(51,214,255,0.18) 98.542%), #000",
    accent: "#FF5C5C",
    label: "rgba(239,68,68,0.7)",
    ring: "rgba(239,68,68,0.4)",
    glow: "rgba(239,68,68,0.22)",
    badgeBg: "#FF5C5C",
  },
};

// Decode the art before the first export so html-to-image never grabs a blank.
if (typeof window !== "undefined") {
  [artWin, artLose].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const money = (n: number) => `${n < 0 ? "−" : "+"}$${Math.abs(n).toFixed(2)}`;

export const ArcadeRunPoster = forwardRef<HTMLDivElement, ArcadeRunPosterProps>(({ run, username = "Trader", avatarUrl, referralCode = "OMENX2025" }, ref) => {
  const isWin = run.pnl >= 0;
  const t = isWin ? T.win : T.lose;
  const total = run.won + run.lost;
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "400px",
        boxSizing: "border-box",
        borderRadius: "16px",
        overflow: "hidden",
        background: t.base,
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* the lynx: coin shower (win) / in tears (lose), behind the right half */}
      <div style={{ position: "absolute", right: "6px", top: "52px", width: "196px", height: "210px", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "-30px", top: "-30px", right: "-30px", bottom: "-30px", background: `radial-gradient(circle, ${t.glow}, transparent 62%)` }} />
        <img src={t.art} alt="" aria-hidden style={{ position: "relative", width: "184px", height: "auto", imageRendering: "pixelated", opacity: 0.9, filter: "drop-shadow(0 10px 18px rgba(0,0,0,.6))" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg, rgba(0,0,0,.5) 40%, transparent 60%), linear-gradient(180deg, transparent 52%, rgba(0,0,0,.7) 68%)" }} />

      <div style={{ position: "relative", padding: "20px 24px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* who */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "26px",
                flexShrink: 0,
                background: "#0d3442",
                border: `2px solid ${t.ring}`,
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 18px ${t.glow}`,
              }}
            >
              {avatarUrl ? <img src={avatarUrl} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontWeight: 700, fontSize: "16px", color: "#bff4ff" }}>{username.slice(0, 2).toUpperCase()}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: "20px", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
              <div style={{ alignSelf: "flex-start", marginTop: "6px", display: "inline-flex", alignItems: "center", height: "24px", padding: "0 10px", borderRadius: "9999px", background: t.badgeBg, color: "#0a0d16", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                {isWin ? "⚡" : "📉"} {run.won} of {total} right
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, height: "28px", padding: "0 12px", borderRadius: "9999px", border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: "11px", fontWeight: 700, lineHeight: "26px", letterSpacing: "1.4px", whiteSpace: "nowrap" }}>QUICK PLAY</div>
        </div>

        {/* the number + what it was */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: "11px", letterSpacing: "2px", textTransform: "uppercase", color: t.label }}>{isWin ? "Profit" : "Lost"}</div>
          <div style={{ marginTop: "6px", fontFamily: MONO, fontWeight: 700, fontSize: "46px", lineHeight: "46px", letterSpacing: "-1px", color: t.accent }}>{money(run.pnl)}</div>
          <div style={{ marginTop: "8px", fontSize: "15px", fontWeight: 500, lineHeight: "21px", color: "#ffffff" }}>
            Called <b style={{ fontWeight: 700 }}>Bitcoin</b> up or down,
            <br />
            <b style={{ fontWeight: 700 }}>30 seconds</b> at a time
          </div>
          <div style={{ marginTop: "3px", fontSize: "12px", fontWeight: 500, lineHeight: "16px", color: MUTED }}>
            {run.minutes} minute{run.minutes === 1 ? "" : "s"} · {run.calls} call{run.calls === 1 ? "" : "s"} · {run.stakeLine}
          </div>
        </div>

        {/* two cells */}
        <div style={{ marginTop: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { label: "Best run", value: `${run.bestRun} in a row`, color: t.accent },
            { label: "Biggest win", value: run.biggestWin > 0 ? money(run.biggestWin) : "—", color: "#ffffff" },
          ].map((cell) => (
            <div key={cell.label} style={{ height: "40px", boxSizing: "border-box", padding: "0 12px", borderRadius: "8px", background: "rgba(10,12,18,0.72)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, color: MUTED, whiteSpace: "nowrap" }}>{cell.label}</span>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: "15px", color: cell.color, whiteSpace: "nowrap" }}>{cell.value}</span>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ marginTop: "2px", paddingTop: "12px", borderTop: `1px solid ${HAIRLINE}`, display: "flex", alignItems: "flex-end", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: MUTED }}>
              Referral:
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: "14px", letterSpacing: "2px", color: "#ffffff", marginLeft: "6px" }}>{referralCode}</span>
            </div>
            <img src={omenxLogo} alt="OmenX" style={{ display: "block", height: "18px", width: "auto", margin: "10px 0 6px" }} />
            <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: "16px", color: t.accent }}>Pick UP or DOWN · from $5</div>
          </div>
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ padding: "5px", background: "#ffffff", borderRadius: "6px", lineHeight: 0 }}>
              <QRCodeSVG value={`${SITE_URL}/arcade?ref=${referralCode}`} size={54} level="M" includeMargin={false} />
            </div>
            <span style={{ fontSize: "10px", lineHeight: "12px", color: "rgba(255,255,255,0.35)" }}>omenx.com</span>
          </div>
        </div>
      </div>
    </div>
  );
});
ArcadeRunPoster.displayName = "ArcadeRunPoster";

export default ArcadeRunPoster;
