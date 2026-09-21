// ============================================================
// /style-guide 全站搜索（nav 2026-09-21）。
// 数据源 = scripts/sg-index.mjs 生成的 searchIndex.json（sg:audit 校验不过期）。
// 命中三类：节点名 / 小节标题 / case（编号 · 名）。结果行「编号 · 名 → 节点 › 小节」。
// ============================================================
import rows from "./searchIndex.json";
import { ALL_SECTIONS } from "./nav";

export interface IndexRow {
  node: string;
  nodeLabel: string;
  section: string;
  sectionTitle: string;
  key: string;
  label: string;
  code: string;
}

export interface SearchHit {
  kind: "node" | "section" | "case";
  node: string;
  nodeLabel: string;
  section: string;
  /** 括号前的短标题 */
  sectionShort: string;
  key: string;
  /** 编号（case 才有，可为空） */
  code: string;
  /** 去掉编号前缀后的名字 */
  name: string;
  score: number;
}

const INDEX = rows as IndexRow[];

const shortTitle = (t: string) => t.replace(/[（(].*$/, "").trim() || t;

/** `SS-1…SS-5` / `SL-D1…D4` → ["SS-1","SS-2",…]，让 `SS-3` 也能命中范围行 */
const expandCodes = (label: string): string[] => {
  const out: string[] = [];
  for (const m of label.matchAll(/\b([A-Z]{2,4}-[A-Z]{0,2})(\d{1,3})…(?:[A-Z]{2,4}-)?([A-Z]{0,2})?(\d{1,3})\b/g)) {
    const a = parseInt(m[2], 10);
    const b = parseInt(m[4], 10);
    if (b > a && b - a < 40) for (let i = a; i <= b; i++) out.push(`${m[1]}${i}`);
  }
  return out;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export const searchStyleGuide = (query: string, limit = 40): SearchHit[] => {
  const q = norm(query);
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const s of ALL_SECTIONS) {
    const label = norm(s.label.replace(/\s[✅⏳🔧]$/, ""));
    if (label.includes(q) || s.id.includes(q)) {
      hits.push({
        kind: "node",
        node: s.id,
        nodeLabel: s.label.replace(/\s[✅⏳🔧]$/, ""),
        section: "",
        sectionShort: "",
        key: "",
        code: "",
        name: s.label.replace(/\s[✅⏳🔧]$/, ""),
        score: label.startsWith(q) ? 100 : 80,
      });
    }
  }

  for (const r of INDEX) {
    const isCase = !!r.key;
    const label = norm(r.label);
    const code = r.code.toLowerCase();
    let score = 0;
    if (isCase) {
      if (code && code === q) score = 200;
      else if (code && code.startsWith(q)) score = 150;
      else if (expandCodes(r.label).some((c) => c.toLowerCase() === q)) score = 140;
      else if (label.includes(q) || r.key.includes(q)) score = 60;
    } else if (label.includes(q) || r.section.includes(q)) {
      score = 70;
    }
    if (!score) continue;
    hits.push({
      kind: isCase ? "case" : "section",
      node: r.node,
      nodeLabel: r.nodeLabel,
      section: r.section,
      sectionShort: shortTitle(r.sectionTitle),
      key: r.key,
      code: r.code,
      name: isCase ? r.label.replace(/^[A-Z]{2,4}-[A-Z]{0,2}\d{1,3}[a-z]?(…[A-Z]{0,4}-?[A-Z]{0,2}\d{1,3}[a-z]?)?\s*·\s*/, "") : shortTitle(r.label),
      score,
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.node.localeCompare(b.node)).slice(0, limit);
};

/** 落点：先小节，再 case 标签行（SectionFrame 的 data-case）。找不到返回 null。 */
export const locateHit = (root: HTMLElement, hit: SearchHit): HTMLElement | null => {
  const sec = hit.section ? root.querySelector<HTMLElement>(`section[id="${hit.section}"]`) : null;
  if (hit.key) {
    const scope = sec ?? root;
    const el = scope.querySelector<HTMLElement>(`[data-case="${hit.key}"]`) ?? root.querySelector<HTMLElement>(`[data-case="${hit.key}"]`);
    if (el) return el;
  }
  return sec;
};
