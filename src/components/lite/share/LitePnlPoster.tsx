// ============================================================
// Lite share card (SH-a). Rides the existing SharePosterLayout skeleton
// (logo head → content → QR + referral foot) and the existing poster theme
// tokens. Pro's SettlementPoster is untouched.
// Fixed 400px, 100% inline styles — required for html-to-image export.
// ============================================================
import { forwardRef } from "react";
import { format } from "date-fns";
import { SharePosterLayout } from "@/components/share/SharePosterLayout";
import { posterThemes, posterColors, getThemeForResult } from "@/lib/posterStyles";

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
    const theme = getThemeForResult(isWin ? "win" : "lose");
    const themeStyle = posterThemes[theme];

    const chip =
      state === "live"
        ? "LIVE CALL"
        : format(new Date(dateISO ?? Date.now()), "MMM d, yyyy");

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
      <SharePosterLayout
        ref={ref}
        theme={theme}
        date={chip}
        qrValue={`https://omenx.lovable.app?ref=${referralCode}`}
        referralCode={referralCode}
        ctaText={isWin ? "Join & trade like a pro!" : "Join & do better than me 😅"}
      >
        {/* User Info + Result */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: "-4px",
                borderRadius: "50%",
                background: themeStyle.glowColor,
                filter: "blur(8px)",
              }}
            />
            <div
              style={{
                position: "relative",
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: `2px solid ${themeStyle.borderColor}`,
                background: posterColors.cardBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{ fontWeight: 700, fontSize: "18px", color: posterColors.textPrimary }}
                >
                  {username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: themeStyle.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "10px" }}>{isWin ? "🏆" : "📉"}</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: posterColors.textPrimary,
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
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "9999px",
                background: themeStyle.gradient,
                fontSize: "11px",
                fontWeight: 600,
                color: "#0a0c14",
              }}
            >
              {badge}
            </div>
          </div>
        </div>

        {/* Big PnL */}
        <div
          style={{
            padding: "20px",
            borderRadius: "16px",
            background: themeStyle.bgColor,
            border: `1px solid ${themeStyle.borderColor}`,
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: themeStyle.primaryMuted,
              marginBottom: "4px",
            }}
          >
            {pnlLabel}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: "36px",
              color: themeStyle.primary,
              marginBottom: "4px",
            }}
          >
            {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: themeStyle.primary,
            }}
          >
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "16px" }}>
              {pnlPercent >= 0 ? "+" : ""}
              {pnlPercent.toFixed(1)}%
            </span>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>ROI</span>
          </div>
          <div
            style={{
              marginTop: "10px",
              fontSize: "10px",
              color: posterColors.textMuted,
              fontStyle: "italic",
            }}
          >
            {funLine}
          </div>
        </div>

        {/* Event + side line */}
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "13px",
              color: posterColors.textPrimary,
              lineHeight: 1.4,
              marginBottom: "8px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {eventName}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: themeStyle.primary }}>
            {sideLine}
          </div>
        </div>

        {/* Two amount cells */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: posterColors.cardBg,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "9px", color: posterColors.textMuted, marginBottom: "2px" }}>
              Put in
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: 600,
                color: posterColors.textPrimary,
              }}
            >
              ${leftAmount.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: posterColors.cardBg,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "9px", color: posterColors.textMuted, marginBottom: "2px" }}>
              {rightLabel}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: 600,
                color: themeStyle.primary,
              }}
            >
              ${rightAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </SharePosterLayout>
    );
  },
);

LitePnlPoster.displayName = "LitePnlPoster";

export default LitePnlPoster;
