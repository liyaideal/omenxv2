export interface SegmentSpec {
  unit: "map" | "round" | "half" | "quarter" | "set" | "game";
  label: (n: number) => string;      // 列头："M1" / "R1" / "1H"
  total: number;
  decisiveThreshold: number | null;
  /** totals 列的表头词；`null` = 不渲染总数列（UFC）。 */
  totalsWord: string | null;
  /** 大数字怎么算：sum = 各段值相加（足球进球）；won = 赢下的段数（CS2 地图）。 */
  totalsRule: "sum" | "won";
  /** 分段列宽 px。 */
  colWidth: number;
  /** 上下文行里这一段怎么叫："Map 2" / "Round 3" / "2nd half"。 */
  segName: (n: number) => string;
  /** 卡片右上角显示什么：段内比分 / 回合钟 / 比赛分钟 / 当前局分 / 已进行时长。 */
  rightValue: "segScore" | "clock" | "minute" | "points" | "elapsed";
  /** 格子写什么：score = 该段的数字；winloss = W/L（MOBA，一局没有可比分数）。
   *  UFC 走 Matrix 里既有的 isMma 分支，优先级在本字段之上。 */
  cell: "score" | "winloss";
  /** 允许在固定段数右边追加加时列（篮球 OT）。 */
  overtime: boolean;
}

export const SPORT_SEGMENTS: Record<string, SegmentSpec> = {
  "IEM Cologne · BO3": { unit: "map",   label: (n) => `M${n}`, total: 3, decisiveThreshold: 13,   totalsWord: "maps",   totalsRule: "won", colWidth: 62, segName: (n) => `Map ${n}`,   rightValue: "segScore", cell: "score", overtime: false },
  "IEM Cologne · BO5": { unit: "map",   label: (n) => `M${n}`, total: 5, decisiveThreshold: 13,   totalsWord: "maps",   totalsRule: "won", colWidth: 62, segName: (n) => `Map ${n}`,   rightValue: "segScore", cell: "score", overtime: false },
  "UFC · main":        { unit: "round", label: (n) => `R${n}`, total: 5, decisiveThreshold: null, totalsWord: null,     totalsRule: "won", colWidth: 48, segName: (n) => `Round ${n}`, rightValue: "clock",    cell: "score", overtime: false },
  "UFC · prelim":      { unit: "round", label: (n) => `R${n}`, total: 3, decisiveThreshold: null, totalsWord: null,     totalsRule: "won", colWidth: 48, segName: (n) => `Round ${n}`, rightValue: "clock",    cell: "score", overtime: false },
};

/** 按 `metadata.sport` 兜底：赛事没有 `segments_key` 时用它。
 *  这样新增一个联赛不必往 SPORT_SEGMENTS 加一行。 */
export const SPORT_FALLBACK: Record<string, SegmentSpec> = {
  soccer: {
    unit: "half", label: (n) => (n === 1 ? "1H" : "2H"), total: 2, decisiveThreshold: null,
    totalsWord: "goals", totalsRule: "sum", colWidth: 70,
    segName: (n) => (n === 1 ? "1st half" : "2nd half"), rightValue: "minute",
    cell: "score", overtime: false,
  },
  basketball: {
    unit: "quarter", label: (n) => (n <= 4 ? `Q${n}` : n === 5 ? "OT" : `${n - 4}OT`),
    total: 4, decisiveThreshold: null,
    totalsWord: "pts", totalsRule: "sum", colWidth: 54,
    segName: (n) => (n <= 4 ? `Q${n}` : n === 5 ? "OT" : `${n - 4}OT`),
    rightValue: "clock", cell: "score", overtime: true,
  },
  tennis: {
    unit: "set", label: (n) => `S${n}`, total: 3, decisiveThreshold: null,
    totalsWord: "sets", totalsRule: "won", colWidth: 62,
    segName: (n) => `Set ${n}`, rightValue: "points",
    cell: "score", overtime: false,
  },
  moba: {
    unit: "game", label: (n) => `G${n}`, total: 5, decisiveThreshold: null,
    totalsWord: "games", totalsRule: "won", colWidth: 48,
    segName: (n) => `Game ${n}`, rightValue: "elapsed",
    cell: "winloss", overtime: false,
  },
};

// 三盘制以外的赛制（网球大满贯 BO5、MOBA BO3）等有真实赛事时按「联赛 · 赛制」补进 SPORT_SEGMENTS，不要改兜底表。
