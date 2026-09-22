/**
 * ② Your Ranking —— 我成绩如何 + 唯一分享入口。
 * desktop = 1232×88 横条（Figma 700:29963）；mobile = 358 卡（Figma 711:33995）。
 * 恒显：已排名 / 已登录未排名 / 未登录 三态（CPO 2026-09-22 批）。
 * Figma 组件注记原文：Unranked state uses an em dash for rank; never imply a real ranking.
 */
import { Share2 } from "lucide-react";
import type { SortType } from "./leaderboardKit";

export interface YourRankingData {
  username: string;
  avatar?: string;
  trades: number;
  /** 三个指标各自的名次；null = 未排名 */
  ranks: Record<SortType, number | null>;
  pnl: string;
  roi: string;
  volume: string;
}

const EM_DASH = "—";

/** 未登录态文案（CPO 2026-09-22 批：不臆造用户名，主文案即行动号召） */
const SIGNED_OUT = {
  headline: "Sign in to see your rank",
  subline: "Ranked by PNL, ROI and volume across all traders.",
  cta: "Sign in",
} as const;

const IdentityAvatar = ({ src, size }: { src?: string; size: number }) => (
  <div className="relative shrink-0" style={{ width: size, height: size }}>
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: -size * 0.09375,
        top: -size * 0.09375,
        width: size * 1.1875,
        height: size * 1.1875,
        borderRadius: 9999,
        background: "rgba(51,214,255,0.3)",
        filter: "blur(4px)",
        opacity: 0.7,
      }}
    />
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 9999,
        objectFit: "cover",
        boxSizing: "border-box",
        border: "1.25px solid rgba(51,214,255,0.6)",
        background: "#14171B",
        display: "block",
      }}
    />
  </div>
);

const rankText = (n: number | null) => (n === null ? EM_DASH : String(n));

export const YourRankingBarDesktop = ({
  id,
  data,
  isLoggedIn,
  onShare,
}: {
  id: string;
  data: YourRankingData;
  isLoggedIn: boolean;
  onShare: () => void;
}) => {
  const unranked = data.ranks.pnl === null;
  const v = (value: string) => (isLoggedIn ? value : EM_DASH);
  return (
    <div
      id={id}
      className="trading-card flex items-center"
      style={{
        background:
          "linear-gradient(90deg, rgba(1,255,153,0.04) 0%, rgba(51,214,255,0.04) 100%), #131519",
        // Figma 700:29964 = 1232x88（16 padding + 56 内容行 + 16 padding）
        height: 88,
        padding: 16,
        gap: 32,
      }}
    >
      <div className="flex shrink-0 items-center" style={{ width: 300, gap: 16 }}>
        <IdentityAvatar src={data.avatar} size={40} />
        <div className="min-w-0">
          <div
            className="font-display truncate"
            style={{ fontSize: 18, fontWeight: 700, lineHeight: "24px", color: "#F2F3F5" }}
          >
            {isLoggedIn ? data.username : SIGNED_OUT.headline}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, lineHeight: "16px", color: "#9CA2AB" }}>
            {isLoggedIn
              ? `My ranking · ${unranked ? "Unranked" : `#${data.ranks.pnl}`} · ${data.trades} trades`
              : SIGNED_OUT.subline}
          </div>
        </div>
      </div>

      <div className="flex shrink-0" style={{ width: 620, gap: 16 }}>
        {(
          [
            { label: `PNL · Rank ${rankText(data.ranks.pnl)}`, value: v(data.pnl), className: "text-trading-green" },
            { label: `ROI · Rank ${rankText(data.ranks.roi)}`, value: v(data.roi), style: { color: "#33D6FF" } },
            { label: `Volume · Rank ${rankText(data.ranks.volume)}`, value: v(data.volume), style: { color: "#F2F3F5" } },
          ] as const
        ).map((m) => (
          <div key={m.label} style={{ width: 196 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#9CA2AB" }}>{m.label}</div>
            <div
              className={`font-display ${"className" in m ? m.className : ""}`}
              style={{ marginTop: 4, fontSize: 18, fontWeight: 700, lineHeight: "24px", ...("style" in m ? m.style : {}) }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 justify-end">
        <button
          type="button"
          onClick={onShare}
          className="btn-primary flex items-center justify-center gap-2"
          style={{ width: 216, height: 40, borderRadius: 12, fontSize: 14, fontWeight: 600 }}
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {isLoggedIn ? "Share Your Link" : SIGNED_OUT.cta}
        </button>
      </div>
    </div>
  );
};

export const YourRankingCardMobile = ({
  id,
  data,
  isLoggedIn,
  onShare,
}: {
  id: string;
  data: YourRankingData;
  isLoggedIn: boolean;
  onShare: () => void;
}) => {
  const unranked = data.ranks.pnl === null;
  const v = (value: string) => (isLoggedIn ? value : EM_DASH);
  return (
    <div
      id={id}
      className="trading-card"
      style={{
        background:
          "linear-gradient(180deg, rgba(207,255,74,0.04) 0%, rgba(51,214,255,0.04) 100%), #131519",
        padding: 16,
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, lineHeight: "24px", color: "#F2F3F5" }}>
          Your Ranking
        </h2>
        <button
          type="button"
          onClick={onShare}
          aria-label="Share your rank"
          className="flex items-center justify-center transition-colors hover:bg-[#23262D]"
          style={{ width: 44, height: 44, borderRadius: 12, background: "#1C1F26", color: "#F2F3F5" }}
        >
          <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center" style={{ marginTop: 12, gap: 12 }}>
        <IdentityAvatar src={data.avatar} size={40} />
        <div className="min-w-0">
          <div
            className="font-display truncate"
            style={{ fontSize: 14, fontWeight: 700, lineHeight: "20px", color: "#F2F3F5" }}
          >
            {isLoggedIn ? data.username : SIGNED_OUT.headline}
          </div>
          <div style={{ marginTop: 2, fontSize: 11, lineHeight: "16px", color: "#9CA2AB" }}>
            {isLoggedIn ? `${data.trades} trades` : SIGNED_OUT.subline}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 12, height: 48, borderRadius: 12, background: "#1C1F26", padding: 12 }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#9CA2AB" }}>PNL rank</span>
        <span className="font-display" style={{ fontSize: 18, fontWeight: 700, lineHeight: "24px", color: "#F2F3F5" }}>
          {!isLoggedIn ? EM_DASH : unranked ? "Unranked" : `#${data.ranks.pnl}`}
        </span>
      </div>

      <div className="flex" style={{ marginTop: 12, gap: 12 }}>
        {(
          [
            { label: "PNL (USD)", value: v(data.pnl), className: "text-trading-green" },
            { label: "ROI", value: v(data.roi), className: "" },
            { label: "Volume", value: v(data.volume), className: "" },
          ] as const
        ).map((m) => (
          <div key={m.label} className="flex-1 min-w-0">
            <div style={{ fontSize: 11, fontWeight: 500, lineHeight: "18px", color: "#9CA2AB" }}>{m.label}</div>
            <div
              className={`font-display truncate ${m.className}`}
              style={{ marginTop: 4, fontSize: 16, fontWeight: 700, lineHeight: "24px", color: m.className ? undefined : "#F2F3F5" }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
