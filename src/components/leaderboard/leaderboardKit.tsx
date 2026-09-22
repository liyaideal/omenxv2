/**
 * Leaderboard kit — 类型、常量、格式化与 Figma 矢量件。
 *
 * 设计来源：Figma omenx_lite `设计(desktop)` 616:1399 / `设计(mobile)` 673:24088。
 * 数值一律按设计稿字面量硬写（CPO 2026-08-13「实装 = 原版复刻 mock 字面量」）。
 *
 * ⚠️ 色轴（DESIGN §2 Market Axis LOCKED + §Addendum 2026-09-09）：
 * 金额位走 MONEY 轴 `text-trading-green` / `text-trading-red`，不写 hex。
 * 设计稿上的涨色 #D5FF4D 不是 token —— 仓库 `--trading-green` = 74 100% 65% = #CFFF4A，
 * 两者肉眼难辨，已统一到 token（CPO 2026-09-22 批）。
 */
import type { CSSProperties } from "react";

export type SortType = "pnl" | "roi" | "volume";
export type PeriodType = "daily" | "7d" | "30d" | "180d";

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  pnl: number;
  roi: number;
  volume: number;
  trades: number;
  rankChange: number;
}

export const SORT_TABS: { key: SortType; label: string }[] = [
  { key: "pnl", label: "PNL" },
  { key: "roi", label: "ROI" },
  { key: "volume", label: "Volume" },
];

export const PERIOD_TABS: { key: PeriodType; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "180d", label: "180 Days" },
];

/** 表头 / 卡内指标列名 */
export const metricColumnLabel = (sort: SortType) =>
  sort === "pnl" ? "PNL (USD)" : sort === "roi" ? "ROI" : "VOLUME (USD)";

/** 领奖台与 Your Ranking 的指标副标 */
export const metricCaption = (sort: SortType) =>
  sort === "pnl" ? "PNL (USD)" : sort === "roi" ? "ROI" : "Volume (USD)";

const usd = (n: number, decimals: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** 榜单主数值。PNL 两位小数、Volume 整数、ROI 两位小数带 %。 */
export const formatMetric = (user: LeaderboardUser, sort: SortType) => {
  switch (sort) {
    case "pnl":
      return usd(user.pnl, 2);
    case "roi":
      return `${user.roi.toFixed(2)}%`;
    case "volume":
      return usd(user.volume, 0);
  }
};

/** 名次变化：涨 lime + ↑ / 平 secondary + — / 跌 negative + ↓（Figma 行组件说明原文） */
export const rankChangeText = (delta: number) =>
  delta === 0 ? "—" : `${delta > 0 ? "↑" : "↓"}${Math.abs(delta)} ${Math.abs(delta) === 1 ? "rank" : "ranks"}`;

export const rankChangeClass = (delta: number) =>
  delta > 0 ? "text-trading-green" : delta < 0 ? "text-trading-red" : "text-[#9CA2AB]";

export const rankSuffix = (rank: number) => (rank === 1 ? "st" : rank === 2 ? "nd" : "rd");

/* ------------------------------------------------------------------ */
/* 奖牌色表（Figma 逐节点实测，非推测）                                  */
/* ------------------------------------------------------------------ */

export interface MedalTheme {
  /** 头像外发光 135° 渐变 */
  glow: string;
  /** 头像描边环 径向渐变 */
  ring: string;
  /** 环的 drop-shadow */
  ringShadow: string;
  /** 头像内圈 inner shadow 色 */
  innerRing: string;
  /** 名次胶囊 90° 渐变 */
  badge: string;
  /** 名次胶囊字色 */
  badgeInk: string;
  /** 奖杯底板底色 */
  plate: string;
  /** 奖杯墨色 */
  trophyInk: string;
  /** 主数值色 */
  value: string;
}

export const MEDALS: Record<1 | 2 | 3, MedalTheme> = {
  1: {
    glow: "linear-gradient(135deg, rgb(253,199,0) 0%, rgb(255,185,0) 50%, rgb(255,105,0) 100%)",
    ring: "radial-gradient(circle, rgba(95,84,52,1) 0%, rgba(135,116,64,1) 25%, rgba(175,148,77,1) 50%, rgba(215,179,89,1) 75%, rgba(255,211,101,1) 100%)",
    ringShadow: "rgba(251,191,36,0.25)",
    innerRing: "rgba(253,199,0,0.25)",
    badge: "linear-gradient(90deg, #DECFA5 0%, #FFD365 100%)",
    badgeInk: "#111A20",
    plate: "#FFD365",
    trophyInk: "#5F5434",
    value: "#FFD365",
  },
  2: {
    glow: "linear-gradient(135deg, rgb(202,213,226) 0%, rgb(144,161,185) 50%, rgb(98,116,142) 100%)",
    ring: "radial-gradient(circle, rgba(205,205,205,1) 0%, rgba(176,176,176,1) 25%, rgba(147,147,147,1) 50%, rgba(117,117,117,1) 75%, rgba(88,88,88,1) 100%)",
    ringShadow: "rgba(148,163,184,0.25)",
    innerRing: "rgba(144,161,185,0.25)",
    badge: "linear-gradient(90deg, #CDCDCD 0%, #848484 100%)",
    badgeInk: "#FFFFFF",
    plate: "#CDCDCD",
    trophyInk: "#585858",
    value: "#9CA2AB",
  },
  3: {
    glow: "linear-gradient(135deg, rgb(225,113,0) 0%, rgb(255,105,0) 50%, rgb(187,77,0) 100%)",
    ring: "radial-gradient(circle, rgba(179,138,72,1) 0%, rgba(144,110,56,1) 50%, rgba(108,82,39,1) 100%)",
    ringShadow: "rgba(217,119,6,0.25)",
    innerRing: "rgba(254,154,0,0.25)",
    badge: "linear-gradient(90deg, #6C5227 0%, #B38A48 100%)",
    badgeInk: "#FFFFFF",
    plate: "#B38A48",
    trophyInk: "#6C5227",
    value: "#B38A48",
  },
};

/* ------------------------------------------------------------------ */
/* Figma 矢量件（逐路径取自 Figma 导出，禁止用 CSS 近似重画）             */
/* ------------------------------------------------------------------ */

/** 领奖台台阶。viewBox 取自 Figma pedestal group 344×432.715。 */
export const PodiumPedestal = ({
  place,
  style,
}: {
  place: 1 | 2 | 3;
  style?: CSSProperties;
}) => {
  const id = `lb-ped-${place}`;
  const top =
    place === 1
      ? [
          { off: "0.0887564", color: "#886D2B", opacity: 1 },
          { off: "1", color: "#251E0C", opacity: 0.4 },
        ]
      : place === 2
      ? [
          { off: "0.0887564", color: "#3F3F3F", opacity: 1 },
          { off: "1", color: "#434141", opacity: 0.15 },
        ]
      : [
          { off: "0.0887564", color: "#000000", opacity: 1 },
          { off: "1", color: "#261E12", opacity: 0.4 },
        ];
  const body =
    place === 1
      ? { y2: 432.975, stops: [[0, "#645122", 0.8], [0.446084, "#645122", 0.2], [1, "#645122", 0]] }
      : place === 2
      ? { y2: 361.682, stops: [[0, "#CDCDCD", 0.2], [0.454412, "#CDCDCD", 0.05], [1, "#CDCDCD", 0]] }
      : { y2: 306.673, stops: [[0, "#261E12", 1], [0.406564, "#261E12", 0.3], [1, "#261E12", 0]] };
  const divider = place === 1 ? 71.9746 : 74.6719;

  return (
    <svg
      viewBox="0 0 344 432.715"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <defs>
        <linearGradient id={`${id}-top`} x1="185.231" y1="57.7733" x2="185.231" y2="14.6133" gradientUnits="userSpaceOnUse">
          {top.map((s) => (
            <stop key={s.off} offset={s.off} stopColor={s.color} stopOpacity={s.opacity} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="172" y1="32.9688" x2="172" y2={body.y2} gradientUnits="userSpaceOnUse">
          {body.stops.map(([off, color, opacity]) => (
            <stop key={String(off)} offset={off as number} stopColor={color as string} stopOpacity={opacity as number} />
          ))}
        </linearGradient>
      </defs>
      <path d="M71.6954 0L0 33.3046H344L284.713 0H71.6954Z" fill={`url(#${id}-top)`} />
      <rect y="32.9688" width="344" height="399.746" fill={`url(#${id}-body)`} />
      <path d={`M19.0013 ${divider}H325.483`} stroke="white" strokeOpacity="0.07" strokeWidth="1.03027" />
    </svg>
  );
};

/** 奖杯（champion）。ink 逐档取自 Figma：金 #5F5434 / 银 #585858 / 铜 #6C5227。 */
export const ChampionTrophy = ({ ink, size }: { ink: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24.727 24.727"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    style={{ display: "block" }}
  >
    <g transform="translate(-0.0)">
      <path d="M7.64673 20.4521C8.49219 18.3541 10.2141 16.7422 12.3633 16.7422C14.5125 16.7422 16.2344 18.3541 17.0799 20.4521C17.3492 21.1205 17.2945 21.8271 17.0308 22.3804C16.7763 22.9144 16.2453 23.439 15.4966 23.439H9.23C8.48127 23.439 7.95033 22.9144 7.6958 22.3804C7.43212 21.8271 7.37735 21.1205 7.64673 20.4521Z" fill={ink} />
      <path d="M21.6321 6.23728C21.3701 6.20086 20.9486 6.18165 20.2989 6.18165L19.0603 6.18165C18.4913 6.18165 18.03 5.72038 18.03 5.15138C18.03 4.58238 18.4913 4.12111 19.0603 4.12111L20.3626 4.1211C20.9261 4.12102 21.4516 4.12094 21.873 4.17951C22.3328 4.24342 22.8707 4.40085 23.2702 4.88211C23.6761 5.37106 23.723 5.93257 23.6863 6.39876C23.6535 6.81646 23.5231 7.38289 23.4017 7.91052L22.9991 9.66107C22.2936 12.7291 19.7227 14.9805 16.6373 15.4427C16.0746 15.5271 15.55 15.1392 15.4657 14.5765C15.3814 14.0138 15.7693 13.4893 16.332 13.4049C18.6264 13.0612 20.4856 11.397 20.991 9.19928L21.3936 7.44872C21.5352 6.8327 21.6128 6.48339 21.6321 6.23728Z" fill={ink} />
      <path d="M3.09468 6.23728C3.35671 6.20086 3.77816 6.18165 4.42788 6.18165L5.66649 6.18165C6.23549 6.18165 6.69676 5.72038 6.69676 5.15138C6.69676 4.58238 6.23549 4.12111 5.66649 4.12111L4.36416 4.1211C3.80071 4.12102 3.27525 4.12094 2.85383 4.17951C2.39402 4.24342 1.85608 4.40085 1.45658 4.88211C1.0507 5.37106 1.00382 5.93257 1.04047 6.39876C1.0733 6.81646 1.18886 7.31855 1.3103 7.84618L1.72766 9.66107C2.43319 12.7291 5.00413 14.9805 8.08951 15.4427C8.65223 15.5271 9.17676 15.1392 9.26107 14.5765C9.34538 14.0138 8.95755 13.4893 8.39483 13.4049C6.10037 13.0612 4.24118 11.397 3.73579 9.19928L3.33324 7.44872C3.19157 6.8327 3.11402 6.48339 3.09468 6.23728Z" fill={ink} />
      <path d="M9.40292 1.28711L9.46469 1.28711L15.3236 1.28711C16.2026 1.28706 16.9543 1.28701 17.5545 1.38456C18.2082 1.4908 18.7844 1.72696 19.2304 2.26759C19.6609 2.78943 19.8087 3.37496 19.8299 4.0243C19.8496 4.62346 19.7618 5.35139 19.6587 6.20658C19.2566 9.54396 18.3755 12.5432 17.168 14.6757C15.9823 16.7696 14.3472 18.2866 12.3633 18.2866C10.3794 18.2866 8.74428 16.7696 7.55859 14.6757C6.35106 12.5432 5.46996 9.54396 5.06784 6.20659C4.96475 5.35139 4.87701 4.62347 4.89662 4.0243C4.91788 3.37496 5.06562 2.78943 5.49615 2.26759C5.94218 1.72696 6.51835 1.4908 7.17206 1.38456C7.77229 1.28701 8.52397 1.28706 9.40292 1.28711Z" fill={ink} />
    </g>
  </svg>
);

/** 冠军皇冠（仅 1st）。描边 #FFD365，带 Figma 的外发光。 */
export const CrownMark = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="12.1875 12.9746 30.1936 30.1935"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    style={{ display: "block", filter: "drop-shadow(0 0 6.09px rgba(251,191,36,0.55))" }}
  >
    <path
      d="M26.7351 13.771C26.7894 13.6723 26.8691 13.5901 26.9661 13.5328C27.063 13.4755 27.1735 13.4453 27.2861 13.4453C27.3987 13.4453 27.5092 13.4755 27.6061 13.5328C27.7031 13.5901 27.7828 13.6723 27.8371 13.771L31.5509 20.8211C31.6395 20.9844 31.7631 21.126 31.9129 21.2358C32.0627 21.3456 32.2349 21.4209 32.4172 21.4563C32.5996 21.4917 32.7875 21.4862 32.9674 21.4403C33.1474 21.3945 33.315 21.3093 33.4582 21.191L38.8389 16.5815C38.9422 16.4975 39.0695 16.4484 39.2024 16.4413C39.3354 16.4343 39.4672 16.4696 39.5788 16.5422C39.6904 16.6147 39.7761 16.7209 39.8235 16.8453C39.871 16.9697 39.8778 17.1059 39.8428 17.2344L36.4624 29.4959C36.3897 29.7597 36.2329 29.9925 36.0158 30.1592C35.7988 30.3258 35.5333 30.4171 35.2597 30.4193H19.6836C19.4098 30.4174 19.1441 30.3262 18.9268 30.1596C18.7095 29.9929 18.5525 29.7599 18.4797 29.4959L14.7306 17.2357C14.6957 17.1072 14.7025 16.9709 14.7499 16.8465C14.7974 16.7221 14.8831 16.616 14.9947 16.5434C15.1063 16.4708 15.2381 16.4355 15.371 16.4426C15.504 16.4496 15.6313 16.4987 15.7346 16.5827L21.114 21.1923C21.2572 21.3106 21.4248 21.3957 21.6048 21.4416C21.7847 21.4875 21.9726 21.4929 22.155 21.4576C22.3373 21.4222 22.5095 21.3469 22.6593 21.2371C22.8091 21.1273 22.9327 20.9857 23.0213 20.8224L26.7351 13.771Z"
      stroke="#FFD365"
      strokeWidth="2.51613"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
