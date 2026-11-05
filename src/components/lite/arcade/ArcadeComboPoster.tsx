// ============================================================
// Quick Play combo poster — the ⇪ SHARE key in the combo HUD (CPO 2026-11-02).
// INTERIM: the session poster's family (ArcadeRunPoster) carrying the combo
// fields Liya fixed for the designer: N in a row, what the combo earned (net),
// the plain-words line, the stake, the biggest win, user / QUICK PLAY /
// referral / QR / logo. The designer's poster (directions B · Fever and
// E · Arcade score screen) replaces this file when it lands.
// Fixed 400px, 100% inline styles — html-to-image export (skipFonts) needs it.
// ============================================================
import { forwardRef } from "react";
import { Flame } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { omenxLogoSolid as omenxLogo } from "@/components/Logo";
import artWin from "@/assets/arcade/share-win.png";
import { SITE_URL } from "@/lib/site";
import type { ArcadeComboShare } from "@/pages/arcade/arcadeEngine";

export interface ArcadeComboPosterProps {
  combo: ArcadeComboShare;
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
}

const MONO = "'Courier New', Courier, monospace";
const MUTED = "rgba(255,255,255,0.45)";
const HAIRLINE = "rgba(255,255,255,0.1)";

const T = {
  art: artWin,
  base: "linear-gradient(222.48deg, rgba(213,255,77,0.22) 0%, rgba(51,214,255,0.18) 98.543%), #000",
  accent: "#CFFF4A",
  label: "rgba(207,255,74,0.7)",
  ring: "rgba(207,255,74,0.4)",
  glow: "rgba(207,255,74,0.26)",
  badgeBg: "#CFFF4A",
};

// Decode the art before the first export so html-to-image never grabs a blank.
if (typeof window !== "undefined") {
  [artWin].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const money = (n: number) => `${n < 0 ? "−" : "+"}$${Math.abs(n).toFixed(2)}`;

/** ×3 ON FIRE · ×5 UNSTOPPABLE · ×8 LEGENDARY — the cabinet's tier words */
const tierWord = (n: number) => (n >= 8 ? "LEGENDARY" : n >= 5 ? "UNSTOPPABLE" : "ON FIRE");

export const ArcadeComboPoster = forwardRef<HTMLDivElement, ArcadeComboPosterProps>(({ combo, username = "Trader", avatarUrl, referralCode = "OMENX2025" }, ref) => {
  const t = T;
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
                <Flame size={13} strokeWidth={2.4} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ display: "block", flexShrink: 0, marginRight: "4px" }} />
                {combo.n} in a row
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, height: "28px", padding: "0 12px", borderRadius: "9999px", border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: "11px", fontWeight: 700, lineHeight: "26px", letterSpacing: "1.4px", whiteSpace: "nowrap" }}>QUICK PLAY</div>
        </div>

        {/* the number + what it was */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: "11px", letterSpacing: "2px", textTransform: "uppercase", color: t.label }}>COMBO ×{combo.n}{combo.n >= 3 ? ` · ${tierWord(combo.n)}` : ""}</div>
          <div style={{ marginTop: "6px", fontFamily: MONO, fontWeight: 700, fontSize: "46px", lineHeight: "46px", letterSpacing: "-1px", color: t.accent }}>{money(combo.pnl)}</div>
          <div style={{ marginTop: "8px", fontSize: "15px", fontWeight: 500, lineHeight: "21px", color: "#ffffff" }}>
            Called <b style={{ fontWeight: 700 }}>Bitcoin</b> up or down —
            <br />
            <b style={{ fontWeight: 700 }}>{combo.n} right in a row</b>
          </div>
          <div style={{ marginTop: "3px", fontSize: "12px", fontWeight: 500, lineHeight: "16px", color: MUTED }}>
            30 seconds a call · ${Math.round(combo.stake)} staked
          </div>
        </div>

        {/* two cells */}
        <div style={{ marginTop: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { label: "Combo", value: `×${combo.n}`, color: t.accent },
            { label: "Biggest win", value: combo.biggestWin > 0 ? money(combo.biggestWin) : "—", color: "#ffffff" },
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
            <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: "16px", color: t.accent }}>Pick UP or DOWN · from $2</div>
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
ArcadeComboPoster.displayName = "ArcadeComboPoster";

export default ArcadeComboPoster;
