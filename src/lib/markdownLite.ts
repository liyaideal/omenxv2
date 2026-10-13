/**
 * markdownLite — the Markdown subset announcements are written in (A6, CPO
 * 2026-10-13: paragraphs, headings, lists, links, bold / italic, inline code,
 * images AND tables — ops may launch a campaign straight from an announcement,
 * so a reward table and a banner image must render).
 *
 * Deliberately small and dependency-free: no raw HTML passthrough (every byte
 * of ops copy is rendered as text), no nesting beyond one list level, no
 * footnotes / task lists. Parsing yields a block AST that `MarkdownBody`
 * renders with the Lite prose tokens.
 */

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: Inline[] }
  | { kind: "em"; children: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; children: Inline[] }
  | { kind: "image"; src: string; alt: string };

export type Block =
  | { kind: "p"; children: Inline[] }
  | { kind: "h"; level: 2 | 3; children: Inline[] }
  | { kind: "ul"; items: Inline[][] }
  | { kind: "ol"; items: Inline[][] }
  | { kind: "quote"; children: Inline[] }
  | { kind: "hr" }
  | { kind: "image"; src: string; alt: string }
  | { kind: "table"; header: Inline[][]; rows: Inline[][][]; align: ("left" | "center" | "right" | null)[] };

const SAFE_HREF = /^(https?:\/\/|\/|mailto:)/i;
export const safeHref = (href: string) => (SAFE_HREF.test(href.trim()) ? href.trim() : "#");

/* ------------------------------ inline ------------------------------ */

const INLINE = /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/;

export const parseInline = (src: string): Inline[] => {
  const out: Inline[] = [];
  let rest = src;
  while (rest.length) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push({ kind: "text", text: rest });
      break;
    }
    if (m.index > 0) out.push({ kind: "text", text: rest.slice(0, m.index) });
    if (m[1]) out.push({ kind: "image", src: safeHref(m[3]), alt: m[2] });
    else if (m[4]) out.push({ kind: "link", href: safeHref(m[6]), children: parseInline(m[5]) });
    else if (m[7]) out.push({ kind: "code", text: m[8] });
    else if (m[9]) out.push({ kind: "strong", children: parseInline(m[10]) });
    else if (m[11]) out.push({ kind: "em", children: parseInline(m[12]) });
    else if (m[13]) out.push({ kind: "em", children: parseInline(m[14]) });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
};

/* ------------------------------ blocks ------------------------------ */

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const isAlignRow = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

const alignOf = (cell: string): "left" | "center" | "right" | null => {
  const l = cell.startsWith(":");
  const r = cell.endsWith(":");
  return l && r ? "center" : r ? "right" : l ? "left" : null;
};

export const parseMarkdown = (src: string): Block[] => {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const flushPara = (buf: string[]) => {
    if (buf.length) blocks.push({ kind: "p", children: parseInline(buf.join(" ").trim()) });
  };
  let para: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara(para);
      para = [];
      i++;
      continue;
    }
    // heading
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      flushPara(para);
      para = [];
      blocks.push({ kind: "h", level: h[1].length === 1 ? 2 : (h[1].length as 2 | 3), children: parseInline(h[2]) });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushPara(para);
      para = [];
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (img) {
      flushPara(para);
      para = [];
      blocks.push({ kind: "image", src: safeHref(img[2]), alt: img[1] });
      i++;
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      flushPara(para);
      para = [];
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        q.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "quote", children: parseInline(q.join(" ")) });
      continue;
    }
    if (/^[-*+]\s+/.test(trimmed)) {
      flushPara(para);
      para = [];
      const items: Inline[][] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^[-*+]\s+/, "")));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushPara(para);
      para = [];
      const items: Inline[][] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^\d+[.)]\s+/, "")));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }
    // GFM table: header | align row | body rows
    if (trimmed.includes("|") && i + 1 < lines.length && isAlignRow(lines[i + 1])) {
      flushPara(para);
      para = [];
      const header = splitRow(trimmed).map(parseInline);
      const align = splitRow(lines[i + 1]).map(alignOf);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        rows.push(splitRow(lines[i]).map(parseInline));
        i++;
      }
      blocks.push({ kind: "table", header, rows, align });
      continue;
    }
    para.push(trimmed);
    i++;
  }
  flushPara(para);
  return blocks;
};
