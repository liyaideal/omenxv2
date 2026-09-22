/**
 * 三甲领奖台（双端两套尺寸，非响应式缩放）。
 * Figma desktop 711:33279 / mobile 711:33621。所有数值逐节点抄自设计稿。
 * ⚠️ mobile 稿外框声明 160 高但实渲 238 且未开裁切 —— 按实渲高度落，不许 clip（台阶会被切平）。
 */
import type { CSSProperties } from "react";
import {
  ChampionTrophy,
  CrownMark,
  MEDALS,
  PodiumPedestal,
  formatMetric,
  metricCaption,
  rankSuffix,
  type LeaderboardUser,
  type SortType,
} from "./leaderboardKit";

interface PodiumMetrics {
  colW: number;
  colH: number;
  /**
   * 版面上真正占用的高度（≠ 台阶实渲高度）。
   * Figma 里领奖台是故意向下溢出、被下面的表格/列表卡盖住的：
   *  desktop 父框 700:29477 y=430 h=547 → 到 977 为止；领奖台组 y=526 h=678.04 → 画到 1204，
   *          即占版面 451，溢出 227 藏在表格后面（表格 y=1041 起，卡不透明）。
   *  mobile  Top3 声明 160、实渲 238 未裁切 → 占版面 160，溢出 78 藏在列表卡后面。
   * 按实渲高度排进文档流会在下方空出一大块（2026-09-22 CPO 打回）。
   */
  reservedH: number;
  colGap: number;
  /** 各名次相对最高台的下沉量 */
  drop: Record<1 | 2 | 3, number>;
  pedTop: number;
  pedH: number;
  avatar: number;
  glowBlur: Record<1 | 2 | 3, number>;
  ringPad: Record<1 | 2 | 3, number>;
  innerPad: Record<1 | 2 | 3, number>;
  badgeW: number;
  badgeH: Record<1 | 2 | 3, number>;
  badgeLeft: Record<1 | 2 | 3, number>;
  badgeTop: Record<1 | 2 | 3, number>;
  badgeFont: Record<1 | 2 | 3, number>;
  badgeSuffix: Record<1 | 2 | 3, number>;
  crown: number;
  crownLeft: number;
  crownTop: number;
  nameFont: number;
  nameGap: number;
  stackGap: number;
  plateIcon: number;
  platePad: number;
  plateRadius: number;
  valueGap: number;
  valueFont: number;
  valueLine: number;
  captionFont: number;
  captionLine: number;
}

const DESKTOP: PodiumMetrics = {
  colW: 344,
  // colH = pedTop + pedH = 613.7；+ drop[3] 64 后 = 678，对上 Figma 组高 678.04
  colH: 614,
  reservedH: 451,
  colGap: 37,
  drop: { 1: 0, 2: 48, 3: 64 },
  pedTop: 181.03,
  pedH: 432.715,
  avatar: 117,
  glowBlur: { 1: 4.875, 2: 6.158, 3: 6.158 },
  ringPad: { 1: 3.594, 2: 4.333, 3: 4.68 },
  innerPad: { 1: 1.797, 2: 2.167, 3: 2.34 },
  badgeW: 40,
  badgeH: { 1: 32.54, 2: 30.151, 3: 31.894 },
  badgeLeft: { 1: 38.5, 2: 38.87, 3: 38.79 },
  badgeTop: { 1: 89.41, 2: 96.25, 3: 94 },
  badgeFont: { 1: 13.558, 2: 13.191, 3: 13.954 },
  badgeSuffix: { 1: 9.685, 2: 9.422, 3: 9.967 },
  crown: 30.194,
  crownLeft: 43.4,
  crownTop: -15.1,
  nameFont: 22,
  nameGap: 11.333,
  stackGap: 32.969,
  plateIcon: 24.727,
  platePad: 10.303,
  plateRadius: 8.242,
  valueGap: 9.272,
  valueFont: 24,
  valueLine: 32,
  captionFont: 11,
  captionLine: 16,
};

const MOBILE: PodiumMetrics = {
  colW: 115,
  // colH = pedTop + pedH；+ drop[3] 后 = 228.7，对上 Figma 组高 228.63
  colH: 208,
  reservedH: 160,
  colGap: 6,
  drop: { 1: 0, 2: 15.21, 3: 20.71 },
  pedTop: 78.57,
  pedH: 129.35,
  avatar: 37.859,
  glowBlur: { 1: 1.577, 2: 1.993, 3: 1.993 },
  ringPad: { 1: 1.163, 2: 1.402, 3: 1.514 },
  innerPad: { 1: 0.582, 2: 0.701, 3: 0.757 },
  badgeW: 16,
  badgeH: { 1: 12.758, 2: 12.06, 3: 12.758 },
  badgeLeft: { 1: 10.93, 2: 11.05, 3: 11.02 },
  badgeTop: { 1: 27.69, 2: 29.99, 3: 29.2 },
  badgeFont: { 1: 5.423, 2: 5.276, 3: 5.581 },
  badgeSuffix: { 1: 3.874, 2: 3.769, 3: 3.987 },
  crown: 9.77,
  crownLeft: 14.044,
  crownTop: -4.884,
  nameFont: 10,
  nameGap: 3.667,
  stackGap: 10,
  plateIcon: 13.091,
  platePad: 5.455,
  plateRadius: 4.364,
  valueGap: 6,
  valueFont: 12,
  valueLine: 16,
  captionFont: 8,
  captionLine: 11,
};

const PodiumColumn = ({
  user,
  place,
  sortType,
  m,
}: {
  user?: LeaderboardUser;
  place: 1 | 2 | 3;
  sortType: SortType;
  m: PodiumMetrics;
}) => {
  if (!user) return <div style={{ width: m.colW, height: m.colH }} />;
  const medal = MEDALS[place];
  const ringPad = m.ringPad[place];
  const innerPad = m.innerPad[place];
  const inner = m.avatar - ringPad * 2 - innerPad * 2;

  const glowStyle: CSSProperties = {
    position: "absolute",
    left: -m.avatar * 0.0538,
    top: -m.avatar * 0.0538,
    width: m.avatar * 1.1077,
    height: m.avatar * 1.1077,
    borderRadius: 9999,
    background: medal.glow,
    filter: `blur(${m.glowBlur[place]}px)`,
    opacity: 0.49,
  };

  return (
    <div style={{ width: m.colW, height: m.colH, position: "relative", paddingTop: m.drop[place] }}>
      <PodiumPedestal
        place={place}
        style={{ position: "absolute", left: 0, top: m.pedTop + m.drop[place], width: m.colW, height: m.pedH }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: m.stackGap,
        }}
      >
        {/* 头像 + 名次徽章 + 皇冠 + 用户名 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: m.nameGap, width: "100%" }}>
          <div style={{ position: "relative", width: m.avatar, height: m.avatar }}>
            <div style={glowStyle} aria-hidden="true" />
            <div
              style={{
                position: "relative",
                width: m.avatar,
                height: m.avatar,
                borderRadius: 9999,
                padding: ringPad,
                boxSizing: "border-box",
                background: medal.ring,
                filter: `drop-shadow(0 0 ${m.avatar * 0.0521}px ${medal.ringShadow})`,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 9999,
                  background: "#090A0B",
                  padding: innerPad,
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={user.avatar}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                  style={{
                    width: inner,
                    height: inner,
                    borderRadius: 9999,
                    objectFit: "cover",
                    boxShadow: `0 0 0 ${innerPad}px ${medal.innerRing}`,
                    display: "block",
                  }}
                />
              </div>
            </div>

            {place === 1 && (
              <div style={{ position: "absolute", left: m.crownLeft, top: m.crownTop }}>
                <CrownMark size={m.crown} />
              </div>
            )}

            <div
              style={{
                position: "absolute",
                left: m.badgeLeft[place],
                top: m.badgeTop[place],
                width: m.badgeW,
                height: m.badgeH[place],
                borderRadius: 9999,
                background: medal.badge,
                color: medal.badgeInk,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: m.badgeFont[place],
                lineHeight: 1,
                boxShadow: `0 ${m.badgeH[place] * 0.2976}px ${m.badgeH[place] * 0.2018}px rgba(0,0,0,0.1), 0 ${
                  m.badgeH[place] * 0.1191
                }px ${m.badgeH[place] * 0.0893}px rgba(0,0,0,0.1)`,
                textShadow: `0 ${m.badgeH[place] * 0.0893}px ${m.badgeH[place] * 0.0893}px rgba(0,0,0,0.12)`,
              }}
            >
              {place}
              <sup style={{ fontSize: m.badgeSuffix[place], lineHeight: 1 }}>{rankSuffix(place)}</sup>
            </div>
          </div>

          <div
            className="truncate text-center text-white"
            style={{ fontSize: m.nameFont, fontWeight: 600, maxWidth: m.colW, paddingInline: 4 }}
          >
            {user.username}
          </div>
        </div>

        {/* 奖杯底板 + 数值 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: m.valueGap }}>
          <div
            style={{
              padding: m.platePad,
              borderRadius: m.plateRadius,
              background: medal.plate,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChampionTrophy ink={medal.trophyInk} size={m.plateIcon} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              className="font-display"
              style={{ fontSize: m.valueFont, lineHeight: `${m.valueLine}px`, fontWeight: 700, color: medal.value }}
            >
              {formatMetric(user, sortType)}
            </div>
            <div
              style={{
                fontSize: m.captionFont,
                lineHeight: `${m.captionLine}px`,
                fontWeight: 400,
                color: "#9CA2AB",
                marginTop: 2,
              }}
            >
              {metricCaption(sortType)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LeaderboardPodium = ({
  topThree,
  sortType,
  variant,
}: {
  topThree: LeaderboardUser[];
  sortType: SortType;
  variant: "desktop" | "mobile";
}) => {
  const m = variant === "desktop" ? DESKTOP : MOBILE;
  const [first, second, third] = topThree;
  return (
    // 外壳只占 reservedH；台阶向下溢出，由后面的表格/列表卡盖住（不裁切）
    <div style={{ height: m.reservedH, position: "relative" }}>
      <div
        className="flex items-start justify-center"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          gap: m.colGap,
          height: m.colH + m.drop[3],
        }}
      >
        <PodiumColumn user={second} place={2} sortType={sortType} m={m} />
        <PodiumColumn user={first} place={1} sortType={sortType} m={m} />
        <PodiumColumn user={third} place={3} sortType={sortType} m={m} />
      </div>
    </div>
  );
};
