export interface SegmentSpec {
  unit: "map" | "round" | "half";
  label: (n: number) => string;      // 列头："M1" / "R1" / "1H"
  total: number;
  decisiveThreshold: number | null;
  /** totals 列的表头词。 */
  totalsWord: string;
  /** 大数字怎么算：sum = 各段值相加（足球进球）；won = 赢下的段数（CS2 地图）。 */
  totalsRule: "sum" | "won";
  /** 分段列宽 px。 */
  colWidth: number;
  /** 上下文行里这一段怎么叫："Map 2" / "Round 3" / "2nd half"。 */
  segName: (n: number) => string;
  /** 卡片右上角显示什么：段内比分 / 回合钟 / 比赛分钟。 */
  rightValue: "segScore" | "clock" | "minute";
}

export const SPORT_SEGMENTS: Record<string, SegmentSpec> = {
  "IEM Cologne · BO3": { unit: "map",   label: (n) => `M${n}`, total: 3, decisiveThreshold: 13,   totalsWord: "maps",  totalsRule: "won", colWidth: 62, segName: (n) => `Map ${n}`,   rightValue: "segScore" },
  "IEM Cologne · BO5": { unit: "map",   label: (n) => `M${n}`, total: 5, decisiveThreshold: 13,   totalsWord: "maps",  totalsRule: "won", colWidth: 62, segName: (n) => `Map ${n}`,   rightValue: "segScore" },
  "UFC · main":        { unit: "round", label: (n) => `R${n}`, total: 5, decisiveThreshold: null, totalsWord: "rounds", totalsRule: "won", colWidth: 48, segName: (n) => `Round ${n}`, rightValue: "clock" },
  "UFC · prelim":      { unit: "round", label: (n) => `R${n}`, total: 3, decisiveThreshold: null, totalsWord: "rounds", totalsRule: "won", colWidth: 48, segName: (n) => `Round ${n}`, rightValue: "clock" },
};

/** 按 `metadata.sport` 兜底：赛事没有 `segments_key` 时用它。
 *  这样新增一个联赛不必往 SPORT_SEGMENTS 加一行。 */
export const SPORT_FALLBACK: Record<string, SegmentSpec> = {
  soccer: {
    unit: "half",
    label: (n) => (n === 1 ? "1H" : "2H"),
    total: 2,
    decisiveThreshold: null,
    totalsWord: "goals",
    totalsRule: "sum",
    colWidth: 70,
    segName: (n) => (n === 1 ? "1st half" : "2nd half"),
    rightValue: "minute",
  },
};
