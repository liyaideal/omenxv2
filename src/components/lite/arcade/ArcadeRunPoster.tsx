// ============================================================
// Quick Play run poster — the designer's handheld (Figma omenx_lite 1283:1437
// desktop · 1283:1841 / 1283:2110 phone, CPO 2026-11-02 "用设计师的最新设计").
// A pixel handheld: shell gradient → bezel → screen (night sky + hills) holding
// avatar + "⚡ N of M right" badge, QUICK PLAY chip, PROFIT / LOST in Jersey 10,
// the plain-words line, Best run / Biggest win cells and the coin-shower /
// crying lynx; under the screen a d-pad, A/B buttons and a power LED; footer =
// referral code + OmenX wordmark + "Pick UP or DOWN · from $2" + QR.
// Win = lime #CFFF4A, lose = coral #FF8B80; cyan #33D6FF stays the brand chip.
// Fixed 400px, 100% inline styles — html-to-image exports this node; the pixel
// font is embedded at export time (arcadePosterFontCSS), so the saved PNG
// matches the preview.
// ============================================================
import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { omenxLogoSolid as omenxLogo } from "@/components/Logo";
import screenWin from "@/assets/arcade/poster/screen-win.png";
import screenLose from "@/assets/arcade/poster/screen-lose.png";
import lynxWin from "@/assets/arcade/poster/lynx-win.png";
import lynxLose from "@/assets/arcade/poster/lynx-lose.png";
import abWin from "@/assets/arcade/poster/ab-win.svg";
import abLose from "@/assets/arcade/poster/ab-lose.svg";
import ledWin from "@/assets/arcade/poster/led-win.svg";
import ledLose from "@/assets/arcade/poster/led-lose.svg";
import { SITE_URL } from "@/lib/site";
import type { ArcadeRunShare } from "@/pages/arcade/arcadeEngine";

export interface ArcadeRunPosterProps {
  run: ArcadeRunShare;
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
}

const PIX = "'Jersey 10', 'VT323', monospace";
const SANS = "'Archivo', system-ui, -apple-system, sans-serif";
const CYAN = "#33D6FF";

const T = {
  win: { accent: "#CFFF4A", glow: "rgba(207,255,74,0.45)", badgeInk: "#0B1206", screen: screenWin, lynx: lynxWin, lynxBox: { left: 196, top: 75, width: 116, height: 130 }, ab: abWin, led: ledWin, label: "Profit", emoji: "⚡" },
  lose: { accent: "#FF8B80", glow: "rgba(255,139,128,0.45)", badgeInk: "#2A0805", screen: screenLose, lynx: lynxLose, lynxBox: { left: 212, top: 92, width: 95, height: 106 }, ab: abLose, led: ledLose, label: "Lost", emoji: "📉" },
};

// Decode the art before the first export so html-to-image never grabs a blank.
if (typeof window !== "undefined") {
  [screenWin, screenLose, lynxWin, lynxLose, abWin, abLose, ledWin, ledLose].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const money = (n: number) => `${n < 0 ? "−" : "+"}$${Math.abs(n).toFixed(2)}`;

/** the big number is 60px in the design; longer amounts step down so they never run under the lynx */
const bigSize = (txt: string) => (txt.length <= 7 ? 60 : txt.length <= 9 ? 52 : 44);

const DPAD_BAR = { position: "absolute" as const, background: "#0F1216", borderRadius: "3px", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.6)" };

export const ArcadeRunPoster = forwardRef<HTMLDivElement, ArcadeRunPosterProps>(({ run, username = "Trader", avatarUrl, referralCode = "OMENX2025" }, ref) => {
  const isWin = run.pnl >= 0;
  const t = isWin ? T.win : T.lose;
  const total = run.won + run.lost;
  const big = money(run.pnl);
  const fs = bigSize(big);
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "400px",
        boxSizing: "border-box",
        padding: "18px",
        borderRadius: "16px",
        background: "linear-gradient(136.7deg, #20252D 14.286%, #1A2127 85.714%)",
        boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.08)",
        color: "#ffffff",
        fontFamily: SANS,
      }}
    >
      {/* bezel → screen */}
      <div style={{ background: "#0C0F13", padding: "10px", borderRadius: "16px" }}>
        <div style={{ position: "relative", overflow: "hidden", padding: "12px", borderRadius: "12px", background: "#08121c" }}>
          <img src={t.screen} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} />
          {/* the lynx sits behind the words, so a long amount can never be covered */}
          <img
            src={t.lynx}
            alt=""
            aria-hidden
            style={{ position: "absolute", left: `${t.lynxBox.left}px`, top: `${t.lynxBox.top}px`, width: `${t.lynxBox.width}px`, height: `${t.lynxBox.height}px`, objectFit: "contain", imageRendering: "pixelated" }}
          />

          <div style={{ position: "relative" }}>
            {/* player + QUICK PLAY */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    flexShrink: 0,
                    boxSizing: "border-box",
                    border: `2px solid ${t.accent}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#0D3442",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#BFF4FF" }}>{username.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, lineHeight: "17px", color: "#ffffff", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 7px 2px", borderRadius: "10px", background: t.accent, color: t.badgeInk, fontSize: "11px", lineHeight: "13px", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 400 }}>{t.emoji}</span>
                    <span style={{ fontWeight: 700 }}>
                      &nbsp;{run.won} of {total} right
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, border: `2px solid ${CYAN}`, borderRadius: "4px", padding: "3px 7px 1px", fontFamily: PIX, fontSize: "18px", lineHeight: "18px", letterSpacing: "1.5px", color: CYAN, whiteSpace: "nowrap" }}>QUICK PLAY</div>
            </div>

            {/* the number */}
            <div style={{ paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px", color: t.accent, whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, lineHeight: "13px", letterSpacing: "3px", textTransform: "uppercase" }}>{t.label}</div>
              <div style={{ fontFamily: PIX, fontSize: `${fs}px`, lineHeight: `${Math.round(fs * 0.87)}px`, textShadow: `0 0 18px ${t.glow}` }}>{big}</div>
            </div>

            {/* what it was */}
            <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "3px", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, lineHeight: "17px", color: "#E6EDF4" }}>
                Called <b style={{ fontWeight: 700, color: "#ffffff" }}>Bitcoin</b> up or down,
                <br />
                <b style={{ fontWeight: 700, color: "#ffffff" }}>30 seconds</b> at a time
              </div>
              <div style={{ fontSize: "12px", fontWeight: 500, lineHeight: "15px", color: "#8796A6" }}>
                {run.minutes} minute{run.minutes === 1 ? "" : "s"} · {run.calls} call{run.calls === 1 ? "" : "s"} · {run.stakeLine}
              </div>
            </div>

            {/* two cells */}
            <div style={{ paddingTop: "14px", display: "flex", gap: "8px" }}>
              {[
                { label: "Best run", value: `${run.bestRun} in a row`, color: t.accent },
                { label: "Biggest win", value: run.biggestWin > 0 ? money(run.biggestWin) : "—", color: "#ffffff" },
              ].map((cell) => (
                <div
                  key={cell.label}
                  style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    boxSizing: "border-box",
                    padding: "7px 12px 6px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(51,214,255,0.35)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 600, lineHeight: "12px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#8796A6" }}>{cell.label}</span>
                  <span style={{ fontFamily: PIX, fontSize: "26px", lineHeight: "26px", color: cell.color }}>{cell.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* d-pad · power LED · A/B */}
      <div style={{ position: "relative", padding: "12px 6px 2px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", width: "46px", height: "46px", flexShrink: 0 }}>
          <div style={{ ...DPAD_BAR, left: "16px", top: 0, width: "14px", height: "46px" }} />
          <div style={{ ...DPAD_BAR, left: 0, top: "16px", width: "46px", height: "14px" }} />
        </div>
        <img src={t.led} alt="" aria-hidden style={{ position: "absolute", left: "calc(50% - 11.5px)", top: "23px", width: "23px", height: "23px" }} />
        <img src={t.ab} alt="" aria-hidden style={{ width: "64px", height: "44px", flexShrink: 0 }} />
      </div>

      {/* referral footer */}
      <div style={{ marginTop: "12px", borderTop: "1px solid #2C333D", padding: "13px 4px 0", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "7px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#7E8894" }}>Referral:</span>
            <span style={{ fontFamily: PIX, fontSize: "26px", lineHeight: "26px", letterSpacing: "3px", color: "#E9EEF3" }}>{referralCode}</span>
          </div>
          <img src={omenxLogo} alt="OmenX" style={{ display: "block", width: "107px", height: "16px" }} />
          <div style={{ fontSize: "13px", fontWeight: 500, lineHeight: "16px", color: t.accent, whiteSpace: "nowrap" }}>Pick UP or DOWN · from $2</div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ padding: "4px", background: "#ffffff", borderRadius: "6px", lineHeight: 0 }}>
            <QRCodeSVG value={`${SITE_URL}/arcade?ref=${referralCode}`} size={54} level="M" includeMargin={false} />
          </div>
          <span style={{ fontSize: "10px", fontWeight: 500, lineHeight: "12px", color: "#6F7D8C" }}>omenx.com</span>
        </div>
      </div>
    </div>
  );
});
ArcadeRunPoster.displayName = "ArcadeRunPoster";

export default ArcadeRunPoster;
