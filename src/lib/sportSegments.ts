export interface SegmentSpec {
  unit: "map" | "round" | "half" | "quarter" | "set" | "game" | "period" | "inning";
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
  rightValue: "segScore" | "clock" | "minute" | "points" | "elapsed" | "inning";
  /** 右上角钟的上限秒数（UFC 回合 300 / NBA 节 720 / NFL 节 900 / NHL 节 1200）。不填 = 300。 */
  clockMax?: number;
  /** 格子写什么：score = 该段的数字；winloss = W/L（MOBA，一局没有可比分数）。
   *  UFC 走 Matrix 里既有的 isMma 分支，优先级在本字段之上。 */
  cell: "score" | "winloss";
  /** 允许在固定段数右边追加加时列（篮球 OT / 棒球加赛局）。 */
  overtime: boolean;
}

/** 1 → "1st"，2 → "2nd"，11 → "11th"。 */
export const ordinal = (n: number): string => {
  const r = n % 100;
  const suf = r >= 11 && r <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${suf}`;
};

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
    rightValue: "clock", clockMax: 720, cell: "score", overtime: true,
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
  // 美式足球：四节 15 分钟 + OT，与篮球同骨架，只有钟上限不同。
  american_football: {
    unit: "quarter", label: (n) => (n <= 4 ? `Q${n}` : n === 5 ? "OT" : `${n - 4}OT`),
    total: 4, decisiveThreshold: null,
    totalsWord: "pts", totalsRule: "sum", colWidth: 54,
    segName: (n) => (n <= 4 ? `Q${n}` : n === 5 ? "OT" : `${n - 4}OT`),
    rightValue: "clock", clockMax: 900, cell: "score", overtime: true,
  },
  // 冰球：三节 20 分钟 + OT。
  hockey: {
    unit: "period", label: (n) => (n <= 3 ? `P${n}` : n === 4 ? "OT" : `${n - 3}OT`),
    total: 3, decisiveThreshold: null,
    totalsWord: "goals", totalsRule: "sum", colWidth: 54,
    segName: (n) => (n <= 3 ? `P${n}` : n === 4 ? "OT" : `${n - 3}OT`),
    rightValue: "clock", clockMax: 1200, cell: "score", overtime: true,
  },
  // 棒球：九局，第 10 局起按数据追加；没有钟，右上角写半局箭头 + 局次 + 出局数。
  baseball: {
    unit: "inning", label: (n) => `${n}`, total: 9, decisiveThreshold: null,
    totalsWord: "runs", totalsRule: "sum", colWidth: 34,
    segName: (n) => `${ordinal(n)} inning`, rightValue: "inning",
    cell: "score", overtime: true,
  },
};

// 三盘制以外的赛制（网球大满贯 BO5、MOBA BO3）等有真实赛事时按「联赛 · 赛制」补进 SPORT_SEGMENTS，不要改兜底表。
