/**
 * 榜单排名分享卡（可分享海报）。Figma 673:22717 / 673:22718。
 *
 * ⚠️ 本件受 DESIGN §Addendum 2026-09-07「Lite 分享海报」LOCKED 约束，逐条落：
 * 1 自包含，不走 SharePosterLayout 共享骨架（改它会连坐 Pro 海报）
 * 2 盈利色走 volt #CFFF4A（= --trading-green），不是稿上的 #D5FF4D
 * 3 字体：正文 system-ui / -apple-system，数字 'Courier New'。
 *   **禁止网络字体** —— 导出走 html-to-image 且 skipFonts: true，Archivo / Space Grotesk
 *   会 fallback 成另一种字体，导致预览与出图不一致
 * 4 艺术底由设计导出、压暗层已烘进像素；代码侧不得用 CSS 渐变复刻压暗层
 * 5 图层顺序：底色渐变 → 艺术底 img → 辉光 → 内容
 * 6 OMENX 字标一律等比，固定 height 18px（稿给的 118×12.5 是压扁值，
 *   与该附录第 6 条③ 记录的是同一个缺陷，不按稿落）
 */
import type { RefObject } from "react";
import { QRCodeSVG } from "qrcode.react";
import rankArt from "@/assets/share/leaderboard-rank-art.webp";
import { omenxLogo } from "@/components/Logo";
import type { LeaderboardUser } from "./leaderboardKit";

const BODY_FONT = "system-ui, -apple-system, sans-serif";
const NUM_FONT = "'Courier New', Courier, monospace";

const Stat = ({
  label,
  value,
  color,
  size,
}: {
  label: string;
  value: string;
  color: string;
  size: number;
}) => (
  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, textAlign: "center" }}>
    <div style={{ fontSize: 10, lineHeight: "15px", color: "#9CA2AB" }}>{label}</div>
    <div
      style={{
        marginTop: 4,
        fontFamily: NUM_FONT,
        fontSize: size,
        fontWeight: 700,
        lineHeight: size === 16 ? "24px" : "20px",
        color,
      }}
    >
      {value}
    </div>
  </div>
);

export const RankShareCard = ({
  user,
  referralCode,
  shareHost,
  shareUrl,
  cardRef,
}: {
  user: LeaderboardUser;
  referralCode: string;
  shareHost: string;
  shareUrl: string;
  cardRef?: RefObject<HTMLDivElement>;
}) => (
  <div
    ref={cardRef}
    style={{
      position: "relative",
      width: "100%",
      aspectRatio: "342 / 345",
      borderRadius: 16,
      border: "1px solid rgba(28,31,38,0.5)",
      background: "linear-gradient(154.8deg, #0B111E 8.49%, #05080F 91.51%)",
      overflow: "hidden",
      fontFamily: BODY_FONT,
    }}
  >
    {/* 艺术底：压暗层已烘进像素，代码侧不再叠渐变 */}
    <img
      src={rankArt}
      alt=""
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />

    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "57.3%",
        top: "-23.2%",
        width: "65.5%",
        aspectRatio: "1",
        borderRadius: 9999,
        background: "rgba(51,214,255,0.3)",
        filter: "blur(64px)",
        opacity: 0.6,
      }}
    />
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-18.7%",
        top: "71.6%",
        width: "46.8%",
        aspectRatio: "1",
        borderRadius: 9999,
        background: "rgba(51,214,255,0.3)",
        filter: "blur(64px)",
        opacity: 0.4,
      }}
    />

    <div
      style={{
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        padding: 21,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* 用户行 */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 63, height: 63, flexShrink: 0 }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: -6.3,
              top: -6.3,
              width: 75.6,
              height: 75.6,
              borderRadius: 9999,
              background: "linear-gradient(135deg, #647489 0%, #475569 100%)",
              filter: "blur(9.45px)",
              opacity: 0.5,
            }}
          />
          <img
            src={user.avatar}
            alt=""
            aria-hidden="true"
            style={{
              position: "relative",
              width: 63,
              height: 63,
              borderRadius: 9999,
              objectFit: "cover",
              background: "#1B1726",
              display: "block",
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              lineHeight: "28px",
              color: "#FFFFFF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.username}
          </div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 9999,
                background: "linear-gradient(150.75deg, #CFFF4A 0%, #33D6FF 100%)",
                color: "#090A0B",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: "20px",
              }}
            >
              #{user.rank}
            </span>
            <span style={{ fontSize: 14, lineHeight: "20px", color: "#9CA2AB" }}>{user.trades} trades</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <Stat label="PnL" value={`$${Math.round(user.pnl).toLocaleString("en-US")}`} color="#CFFF4A" size={14} />
          <Stat label="ROI" value={`${user.roi.toFixed(1)}%`} color="#33D6FF" size={14} />
          <Stat
            label="Volume"
            value={`$${Math.round(user.volume).toLocaleString("en-US")}`}
            color="#FFFFFF"
            size={16}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 10, lineHeight: "15px", color: "rgba(255,255,255,0.3)" }}>Referral:</span>
              <span
                style={{
                  fontFamily: NUM_FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: "19.5px",
                  letterSpacing: "1.5px",
                  color: "#FFFFFF",
                }}
              >
                {referralCode}
              </span>
            </div>
            {/* 字标等比，固定 18 高（§Addendum 2026-09-07 第 6 条③） */}
            <img src={omenxLogo} alt="OMENX" style={{ height: 18, width: "auto", display: "block", marginTop: 10 }} />
            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#CFFF4A" }}>
              Join &amp; trade like a pro!
            </div>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 6, lineHeight: 0 }}>
              <QRCodeSVG value={shareUrl} size={48} level="M" includeMargin={false} />
            </div>
            <div style={{ marginTop: 4, fontSize: 8, lineHeight: "12px", color: "rgba(255,255,255,0.3)" }}>
              {shareHost}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
