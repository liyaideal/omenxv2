/**
 * 榜单排名分享卡（可分享海报）。
 *
 * 【稿源】Figma omenx_lite `673:25397`（"share card"，卡 314 宽）。
 *   ⚠️ 2026-09-22 CPO 打回实证：本件最初照 **桌面海报稿 673:22717 / 673:22718** 建，
 *   从未拿本页的移动稿复量，导致底部整块（字标/Referral/QR/tagline）尺寸普遍偏大、
 *   统计标签偏小。组件形态与素材一样，双端/各页的稿必须分别量，不许沿用别页的海报稿。
 *
 * 【换算基准】生产卡实渲 336 宽（移动抽屉）/ ~344（桌面弹窗），对 314 的稿 ≈ ×1.07。
 *   下面所有像素值 = 稿值 × 1.07 取整。改任何一处前先按这个比例回算，不要拍整数。
 *
 * 受 DESIGN §Addendum 2026-09-07「Lite 分享海报」LOCKED 约束，逐条落：
 * 1 自包含，不走 SharePosterLayout 共享骨架（改它会连坐 Pro 海报）
 * 2 盈利色走 volt #CFFF4A（= --trading-green），不是稿上的 #D5FF4D
 * 3 字体：正文 system-ui / -apple-system，数字 'Courier New'。
 *   **禁止网络字体** —— 导出走 html-to-image 且 skipFonts: true，Archivo / Space Grotesk
 *   会 fallback 成另一种字体，导致预览与出图不一致。稿上是 Archivo / Space Grotesk，
 *   属「稿与裁定冲突」，按裁定落（CPO 2026-09-22 复批）。
 * 4 艺术底由设计导出、压暗层已烘进像素；代码侧不得用 CSS 渐变复刻压暗层
 * 5 图层顺序：底色渐变 → 艺术底 img → 辉光 → 内容
 *
 * 另两处「稿与全站规范冲突」，均按生产落（CPO 2026-09-22 批）：
 * · 卡底域名与 QR 指向 `https://omenx.lovable.app`（稿写 omenx.com）——以实际可访问域为准。
 * · More Options 按钮保持全站 `.btn-primary` 渐变（稿是平铺 #33D6FF）；仅图标按稿改成纸飞机。
 */import type { RefObject } from "react";
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
    <div style={{ fontSize: 13, lineHeight: "15px", color: "#9CA2AB" }}>{label}</div>
    <div
      style={{
        marginTop: 4,
        fontFamily: NUM_FONT,
        fontSize: size,
        fontWeight: 700,
        lineHeight: "20px",
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
          <Stat label="PnL" value={`$${Math.round(user.pnl).toLocaleString("en-US")}`} color="#CFFF4A" size={15} />
          <Stat label="ROI" value={`${user.roi.toFixed(1)}%`} color="#33D6FF" size={15} />
          <Stat
            label="Volume"
            value={`$${Math.round(user.volume).toLocaleString("en-US")}`}
            color="#FFFFFF"
            size={15}
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
              <span style={{ fontSize: 10, lineHeight: "13px", color: "rgba(255,255,255,0.3)" }}>Referral:</span>
              <span
                style={{
                  fontFamily: NUM_FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: "17px",
                  letterSpacing: "1.3px",
                  color: "#FFFFFF",
                }}
              >
                {referralCode}
              </span>
            </div>
            {/* 字标等比；高度 = 本卡稿的画布占比 9.92/314 = 3.16% × 336 ≈ 11
                （§Addendum 2026-09-07 第 6 条③ 2026-09-22 重写，原「固定 18px」已作废） */}
            <img src={omenxLogo} alt="OMENX" style={{ height: 11, width: "auto", display: "block", marginTop: 10 }} />
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 500, lineHeight: "15px", color: "#CFFF4A" }}>
              Join &amp; trade like a pro!
            </div>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 7, padding: 5, lineHeight: 0 }}>
              <QRCodeSVG value={shareUrl} size={41} level="M" includeMargin={false} />
            </div>
            <div style={{ marginTop: 4, fontSize: 8, lineHeight: "10px", color: "rgba(255,255,255,0.3)" }}>
              {shareHost}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
