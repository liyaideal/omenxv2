// ============================================================
// /style-guide 本页目录 —— 从渲染出的 <section id> + <h2> 自动读（nav 2026-09-21）。
// 只认叶子 section（不含子 section 的），所以 LitePage 外壳不会出现在目录里。
// codes = 该小节文字里出现的字典编号，按前缀压成范围：SL-D1…D4 · SL-M1…M2。
// ============================================================
export interface TocEntry {
  id: string;
  title: string;
  /** 去掉括号说明后的短标题，左栏用。 */
  short: string;
  codes: string;
}

const CODE_RE = /\b([A-Z]{2,4})-([A-Z]{0,2})(\d{1,3})([a-z]?)\b/g;

export const summarizeCodes = (text: string): string => {
  const groups = new Map<string, Set<string>>();
  for (const m of text.matchAll(CODE_RE)) {
    const prefix = `${m[1]}-${m[2]}`;
    if (!groups.has(prefix)) groups.set(prefix, new Set());
    groups.get(prefix)!.add(`${m[3]}${m[4]}`);
  }
  const parts: string[] = [];
  for (const [prefix, set] of groups) {
    const nums = [...set].map((v) => ({ v, n: parseInt(v, 10) })).sort((a, b) => a.n - b.n || a.v.localeCompare(b.v));
    const first = nums[0].v;
    const last = nums[nums.length - 1].v;
    parts.push(nums.length === 1 ? `${prefix}${first}` : `${prefix}${first}…${last}`);
  }
  return parts.slice(0, 4).join(" · ");
};

export const collectToc = (root: HTMLElement): TocEntry[] => {
  const sections = [...root.querySelectorAll<HTMLElement>("section[id]")].filter(
    (sec) => !sec.querySelector("section[id]"),
  );
  return sections
    .map((sec) => {
      const h = sec.querySelector("h2");
      const title = h?.textContent?.trim() ?? "";
      if (!title) return null;
      const short = title.replace(/[（(].*$/, "").trim() || title;
      // 编号只从 case 标签行（SectionFrame 的 label 行）里读，避免正文里的旧编号串进来。
      const labelText = [...sec.querySelectorAll<HTMLElement>(".font-mono.uppercase")].map((e) => e.textContent ?? "").join(" ");
      return { id: sec.id, title, short, codes: summarizeCodes(labelText || title) };
    })
    .filter((x): x is TocEntry => !!x);
};
