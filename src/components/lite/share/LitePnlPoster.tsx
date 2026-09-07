// ============================================================
// Lite 分享海报（SH-a）——2026-09-07 按 Figma 448:8785 重绘。
// 自包含：不再走 SharePosterLayout（那个骨架与 Pro 的 SettlementPoster 共用，本轮不动它）。
// 固定 400px、100% inline styles —— html-to-image 导出的硬要求。
// ============================================================
import { forwardRef } from "react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import omenxLogo from "@/assets/omenx-logo.svg";
import posterArtWin from "@/assets/share/poster-art-win.png";
import posterArtLose from "@/assets/share/poster-art-lose.png";

export type LitePnlPosterState = "live" | "cashed" | "settled";

export interface LitePnlPosterProps {
  state: LitePnlPosterState;
  eventName: string;
  /** Pre-composed side line, same grammar as the position card title. */
  sideLine: string;
  pnl: number;
  pnlPercent: number;
  leftAmount: number;
  rightAmount: number;
  dateISO?: string;
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
}

/** 等宽字体：与设计稿的 Cousine 度量兼容，且双平台自带 —— 不引网络字体，
 *  因为导出走 skipFonts:true，网络字体会导致预览与出图不一致。 */
const MONO = "'Courier New', Courier, monospace";

const ART = {
  win: {
    art: posterArtWin,
    base:
      "linear-gradient(222.48deg, rgba(213,255,77,0.18) 0%, rgba(51,214,255,0.18) 98.543%), linear-gradient(90deg, rgb(0,0,0) 0%, rgb(0,0,0) 100%)",
    accent: "#CFFF4A",
    labelColor: "rgba(207,255,74,0.7)",
    roiColor: "#CFFF4A",
    ring: "rgba(34,197,94,0.4)",
    ringGlow: "rgba(34,197,94,0.3)",
    badgeBg: "#CFFF4A",
    badgeEmoji: "🏆",
    chip: "linear-gradient(168.309deg, rgb(207,255,74) 30.812%, rgb(51,214,255) 137.94%)",
    cornerGlow: "rgba(207,255,74,0.3)",
    footGlow: "rgba(34,197,94,0.3)",
  },
  lose: {
    art: posterArtLose,
    base:
      "linear-gradient(222.493deg, rgba(255,92,92,0.18) 10.631%, rgba(51,214,255,0.18) 98.542%), linear-gradient(90deg, rgb(0,0,0) 0%, rgb(0,0,0) 100%)",
    accent: "#EF4444",
    labelColor: "rgba(239,68,68,0.7)",
    roiColor: "#FF5C5C",
    ring: "rgba(239,68,68,0.4)",
    ringGlow: "rgba(239,68,68,0.3)",
    badgeBg: "#EF4444",
    badgeEmoji: "📉",
    chip: "linear-gradient(156.997deg, rgb(239,68,68) 0%, rgb(249,115,22) 100%)",
    cornerGlow: "rgba(239,68,68,0.3)",
    footGlow: null as string | null,
  },
};

// 预热艺术底，避免首次开弹窗时 html-to-image 抢在图片解码前截图。
if (typeof window !== "undefined") {
  [posterArtWin, posterArtLose].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const MUTED = "rgba(255,255,255,0.3)";
const CELL_BG = "rgba(255,255,255,0.05)";
const HAIRLINE = "rgba(255,255,255,0.1)";

export const LitePnlPoster = forwardRef<HTMLDivElement, LitePnlPosterProps>(
  (
    {
      state,
      eventName,
      sideLine,
      pnl,
      pnlPercent,
      leftAmount,
      rightAmount,
      dateISO,
      username = "Trader",
      avatarUrl,
      referralCode = "OMENX2025",
    },
    ref,
  ) => {
    const isWin = pnl >= 0;
    const t = isWin ? ART.win : ART.lose;

    const chipText =
      state === "live" ? "LIVE CALL" : format(new Date(dateISO ?? Date.now()), "MMM d, yyyy");

    const badge = isWin ? (state === "live" ? "⚡ Winning!" : "⚡ Winner!") : "💀 RIP";
    const pnlLabel = isWin ? (state === "live" ? "Profit so far" : "Profit") : "Lost";
    const funLine = isWin
      ? pnlPercent >= 100
        ? "🔥 Absolute legend!"
        : pnlPercent >= 50
          ? "💰 Nice gains!"
          : "✨ Well played!"
      : pnlPercent <= -50
        ? "😭 That's rough buddy..."
        : "📉 We go again!";
    const rightLabel =
      state === "live" ? "Now worth" : state === "cashed" ? "Cashed out" : "Paid out";

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: "400px",
          maxWidth: "100%",
          boxSizing: "border-box",
          borderRadius: "16px",
          overflow: "hidden",
          background: t.base,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* 艺术底：压暗渐变与 60% 透明度已烘进 PNG，此处不叠任何滤镜 */}
        <img
          src={t.art}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* 左下光晕（仅赢版） */}
        {t.footGlow && (
          <div
            style={{
              position: "absolute",
              left: "-60px",
              top: "478px",
              width: "160px",
              height: "160px",
              borderRadius: "80px",
              background: t.footGlow,
              filter: "blur(60px)",
              opacity: 0.4,
              pointerEvents: "none",
            }}
          />
        )}

        {/* 内容 */}
        <div
          style={{
            position: "relative",
            padding: "20px 24px 10px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {/* 用户行 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ position: "relative", width: "52px", height: "52px", flexShrink: 0 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "-4px",
                      top: "-4px",
                      width: "60px",
                      height: "60px",
                      borderRadius: "30px",
                      background: t.ringGlow,
                      filter: "blur(8px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "52px",
                      height: "52px",
                      borderRadius: "26px",
                      background: CELL_BG,
                      border: `2px solid ${t.ring}`,
                      boxSizing: "border-box",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={username}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: "18px", color: "#ffffff" }}>
                        {username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: "34px",
                      top: "34px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "10px",
                      background: t.badgeBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "10px", lineHeight: "15px" }}>{t.badgeEmoji}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      lineHeight: "22.5px",
                      letterSpacing: "-0.2344px",
                      color: "#ffffff",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {username}
                  </div>
                  <div
                    style={{
                      alignSelf: "flex-start",
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      background: t.chip,
                      fontSize: "11px",
                      fontWeight: 600,
                      lineHeight: "16.5px",
                      letterSpacing: "0.0645px",
                      color: "#0a0c14",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badge}
                  </div>
                </div>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: CELL_BG,
                  border: `1px solid ${HAIRLINE}`,
                  fontSize: "10px",
                  lineHeight: "15px",
                  letterSpacing: "0.6172px",
                  textTransform: "uppercase",
                  color: MUTED,
                  whiteSpace: "nowrap",
                }}
              >
                {chipText}
              </div>
            </div>

            {/* 盈亏区（无卡片、左对齐） */}
            <div style={{ paddingTop: "12px" }}>
              <div
                style={{
                  fontSize: "10px",
                  lineHeight: "15px",
                  letterSpacing: "1.6172px",
                  textTransform: "uppercase",
                  color: t.labelColor,
                }}
              >
                {pnlLabel}
              </div>
              <div style={{ paddingTop: "4px" }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: "36px",
                    lineHeight: "40px",
                    color: t.accent,
                  }}
                >
                  {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "4px" }}>
                <span
                  style={{ fontFamily: MONO, fontWeight: 700, fontSize: "16px", lineHeight: "24px", color: t.accent }}
                >
                  {pnlPercent >= 0 ? "+" : ""}
                  {pnlPercent.toFixed(1)}%
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    lineHeight: "16.5px",
                    letterSpacing: "0.0645px",
                    color: t.roiColor,
                    opacity: 0.7,
                  }}
                >
                  ROI
                </span>
              </div>
              <div
                style={{
                  fontSize: "10px",
                  lineHeight: "15px",
                  letterSpacing: "0.6172px",
                  color: MUTED,
                }}
              >
                {funLine}
              </div>
            </div>

            {/* 分隔线 + 事件 */}
            <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: "6px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "18.2px",
                  letterSpacing: "-0.0762px",
                  color: "#ffffff",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {eventName}
              </div>
              <div
                style={{
                  paddingTop: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  lineHeight: "18px",
                  color: t.accent,
                }}
              >
                {sideLine}
              </div>
            </div>

            {/* 两个金额格：标签左 / 数值右，同一行 */}
            <div
              style={{
                paddingTop: "6px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {[
                { label: "Put in", value: leftAmount, color: "#ffffff" },
                { label: rightLabel, value: rightAmount, color: t.accent },
              ].map((cell) => (
                <div
                  key={cell.label}
                  style={{
                    height: "32px",
                    boxSizing: "border-box",
                    padding: "10px",
                    borderRadius: "8px",
                    background: CELL_BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      lineHeight: "13.5px",
                      letterSpacing: "0.167px",
                      color: MUTED,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cell.label}
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: "13px",
                      lineHeight: "19.5px",
                      color: cell.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ${cell.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 页脚：无底色无描边 */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px" }}>
            <div style={{ flex: 1, minWidth: 0, height: "76px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingTop: "6px" }}>
                <span style={{ fontSize: "10px", lineHeight: "15px", letterSpacing: "0.1172px", color: MUTED }}>
                  Referral:
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: "13px",
                    lineHeight: "19.5px",
                    letterSpacing: "1.5px",
                    color: "#ffffff",
                  }}
                >
                  {referralCode}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <img src={omenxLogo} alt="OMENX" style={{ height: "18px", width: "auto", alignSelf: "flex-start" }} />
                <span style={{ fontSize: "12px", fontWeight: 500, lineHeight: "18px", color: t.accent }}>
                  {isWin ? "Join & trade like a pro!" : "Join & do better than me 😅"}
                </span>
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                height: "76px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
              }}
            >
              <div style={{ padding: "6px", background: "#ffffff", borderRadius: "8px", lineHeight: 0 }}>
                <QRCodeSVG
                  value={`https://omenx.lovable.app?ref=${referralCode}`}
                  size={48}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span style={{ fontSize: "8px", lineHeight: "12px", letterSpacing: "0.2057px", color: MUTED }}>
                omenx.com
              </span>
            </div>
          </div>
        </div>

        {/* 右上光晕：设计稿里它压在内容之上，保持这个层序 */}
        <div
          style={{
            position: "absolute",
            left: "278px",
            top: "-80px",
            width: "200px",
            height: "200px",
            borderRadius: "100px",
            background: t.cornerGlow,
            filter: "blur(60px)",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  },
);

LitePnlPoster.displayName = "LitePnlPoster";

export default LitePnlPoster;
