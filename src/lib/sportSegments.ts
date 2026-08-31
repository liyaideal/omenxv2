export interface SegmentSpec {
  unit: "map" | "round";
  label: (n: number) => string;   // "M1" / "R1"
  total: number;                  // 段数
  decisiveThreshold: number | null; // 段内终点：CS2 = 13 回合；UFC = null（按钟）
}

export const SPORT_SEGMENTS: Record<string, SegmentSpec> = {
  "IEM Cologne · BO3": { unit: "map",   label: (n) => `M${n}`, total: 3, decisiveThreshold: 13 },
  "IEM Cologne · BO5": { unit: "map",   label: (n) => `M${n}`, total: 5, decisiveThreshold: 13 },
  "UFC · main":        { unit: "round", label: (n) => `R${n}`, total: 5, decisiveThreshold: null },
  "UFC · prelim":      { unit: "round", label: (n) => `R${n}`, total: 3, decisiveThreshold: null },
};
