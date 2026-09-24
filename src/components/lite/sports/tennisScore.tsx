// ============================================================
// tennisScore — 网球比分串 formatter（列表卡 / 舞台卡用）。
// 供应商 metadata.score 形如 `5-7, 7-6(7-2), 6-6`；这里解析成盘数组，
// 再按 ATP/WTA 记法渲染：抢七盘只在输方一侧上标（7-6²），6-6 进行中不标。
// 直播页记分牌不走这里——它读 segment_results[].tb（见 matchboardModel）。
// ============================================================
import type { ReactNode } from "react";

export interface TennisSet {
  home: number;
  away: number;
  /** 抢七点数（供应商括号内的两个数）。 */
  tb: { home: number; away: number } | null;
}

const SET_RE = /^\s*(\d+)\s*[-–]\s*(\d+)\s*(?:\(\s*(\d+)\s*[-–]\s*(\d+)\s*\))?\s*$/;

/** `5-7, 7-6(7-2), 6-6` → 三盘。任何一段解析失败返回 null（调用方回退原串）。 */
export const parseTennisScore = (score: string | null | undefined): TennisSet[] | null => {
  if (!score) return null;
  const parts = score.split(",");
  const out: TennisSet[] = [];
  for (const part of parts) {
    const m = SET_RE.exec(part);
    if (!m) return null;
    const home = Number(m[1]);
    const away = Number(m[2]);
    const tb =
      m[3] != null && m[4] != null ? { home: Number(m[3]), away: Number(m[4]) } : null;
    out.push({ home, away, tb });
  }
  return out.length ? out : null;
};

/** 抢七盘：7–6 / 6–7 且带点数。 */
const isTiebreakSet = (s: TennisSet) =>
  !!s.tb && Math.max(s.home, s.away) === 7 && Math.abs(s.home - s.away) === 1;

/** 最后一盘 6–6 ⇒ 抢七进行中（列表卡联赛行追加 `· Tiebreak`）。 */
export const isTennisTiebreakLive = (score: string | null | undefined): boolean => {
  const sets = parseTennisScore(score);
  if (!sets) return false;
  const last = sets[sets.length - 1];
  return last.home === 6 && last.away === 6;
};

/** 比分串主字号 → 上标参数。26px（列表卡）与 20px（舞台卡）两档，其余按比例。 */
const supStyle = (base: number) => ({
  fontSize: Math.round(base * 0.5),
  fontWeight: 600,
  lineHeight: 1,
  verticalAlign: "baseline" as const,
  position: "relative" as const,
  top: -Math.round(base * 0.35),
  marginLeft: 2,
  opacity: 0.85,
  fontVariantNumeric: "tabular-nums" as const,
});

/**
 * 渲染网球比分串。减号一律 U+2013 EN DASH（同右上角局分规范），盘间 `, `。
 * 抢七盘输方数字后上标输方点数：`5–7, 7–6², 6–6`。
 */
export const TennisScoreText = ({
  score,
  base,
}: {
  score: string | null | undefined;
  base: number;
}): ReactNode => {
  const sets = parseTennisScore(score);
  if (!sets) return score || "–";
  const sup = supStyle(base);
  return (
    <>
      {sets.map((s, i) => {
        const tb = isTiebreakSet(s) ? s.tb! : null;
        const homeLost = tb != null && s.home < s.away;
        const awayLost = tb != null && s.away < s.home;
        return (
          <span key={i}>
            {i > 0 ? ", " : ""}
            {s.home}
            {homeLost ? <sup style={sup}>{Math.min(tb!.home, tb!.away)}</sup> : null}
            {"–"}
            {s.away}
            {awayLost ? <sup style={sup}>{Math.min(tb!.home, tb!.away)}</sup> : null}
          </span>
        );
      })}
    </>
  );
};

/**
 * 所有列表面的比分串入口：网球走 TennisScoreText，其他运动原样。
 * `tennisBase` 不传时网球与其他运动同字号（行内场景）；卡片中央位需要传更小的网球字号。
 */
export const MatchScoreText = ({
  sport,
  score,
  base,
  tennisBase,
}: {
  sport: string | null | undefined;
  score: string | null | undefined;
  base: number;
  tennisBase?: number;
}): ReactNode =>
  sport === "tennis" ? (
    <TennisScoreText score={score} base={tennisBase ?? base} />
  ) : (
    formatPlainScore(score)
  );

/**
 * 非网球比分串的唯一格式：引擎写 `0-1`（ASCII 连字符、无空格），界面一律 `0 – 1`
 * （U+2013 + 两侧空格，即字典一直展示的格式）。解析不出两个数就回退原串；空值 `–`。
 */
export const formatPlainScore = (score: string | null | undefined): string => {
  if (!score) return "\u2013";
  const m = /^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/.exec(score);
  return m ? `${m[1]} \u2013 ${m[2]}` : score;
};

/**
 * 引擎 `metadata.phase` 是机器枚举（`LIVE` / `BREAK` / `DECISION`，给记分牌判段间用），
 * 列表卡联赛行只能显示人话：LIVE 不显示（LIVE 药丸已在），BREAK → `Break`，DECISION → `Decision`，
 * 其他（供应商给的 `2nd half` / `3rd set` 这类）原样。返回 null = 不渲染。
 */
export const phaseLabel = (phase: string | null | undefined): string | null => {
  if (!phase) return null;
  const key = phase.trim().toUpperCase();
  if (key === "LIVE") return null;
  if (key === "BREAK") return "Break";
  if (key === "DECISION") return "Decision";
  return phase;
};

/**
 * 网球局分归一：减号 `-` → `–`（U+2013），占先 `A` / `AD` / `ADV` 统一为 `AD`。
 * `30-15` → `30–15`，`40-A` → `40–AD`，空值原样交给调用方兜底。
 */
export const formatGamePoints = (gp: string | null | undefined): string | null => {
  if (!gp) return null;
  const norm = (t: string) => {
    const k = t.trim().toUpperCase();
    return k === "A" || k === "AD" || k === "ADV" ? "AD" : t.trim();
  };
  const m = /^\s*([^-–:]+)\s*[-–:]\s*([^-–:]+)\s*$/.exec(gp);
  return m ? `${norm(m[1])}\u2013${norm(m[2])}` : gp;
};
