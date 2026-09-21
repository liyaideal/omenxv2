#!/usr/bin/env node
/**
 * sg:index — 生成 /style-guide 全站搜索索引（nav 2026-09-21）。
 *
 * 从 src/pages/StyleGuide/sections/**.tsx 读出每个 case 的 { key, label }
 * 和每个 <SectionWrapper id title> 小节，按「哪个导出组件渲染了它」归到
 * nav.tsx 的节点，输出 src/pages/StyleGuide/searchIndex.json：
 *   [{ node, nodeLabel, section, sectionTitle, key, label, code }]
 *   · key 为空 = 小节本身一行（搜小节标题用）
 *   · code = label 开头的字典编号（TR-27 / SL-D2 / SS-1…），没有就空
 *
 * 归属规则：
 *   1. nav.tsx 里 sec("File", "Comp") / lp("File", "Comp") → 组件 → 节点
 *   2. 组件函数体按 <SectionWrapper …>…</SectionWrapper> 切块；块里
 *      cases={ARRAY} / byKey("k", …) / <Child … /> 归该小节（Child 自己有
 *      SectionWrapper 时以 Child 的为准）；块外的归节点顶部（section 空）
 *   3. 文件里没被任何组件点名、也没 byKey 点名的数组（走别的间接渲染）归该
 *      文件的每个组件、section 空
 *   4. 同一 case 出现在多个节点 → 都列（搜索结果各一行）
 *
 * --check：索引文件与生成结果不一致时 exit 1（sg:audit 用）。
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SG = path.join(ROOT, "src/pages/StyleGuide");
const SECTIONS = path.join(SG, "sections");
const OUT = path.join(SG, "searchIndex.json");
const CHECK = process.argv.includes("--check");

const read = (p) => fs.readFileSync(p, "utf8");
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith(".tsx") ? [path.join(dir, d.name)] : [],
  );

/* ---------- 1. every section file: case arrays + exported components ---------- */
const files = walk(SECTIONS);
/** `${file}::${arrayName}` → { file, cases } */
const arrays = new Map();
/** `${file}::${caseKey}` → case（byKey 用） */
const casesByKey = new Map();
/** componentName → { file, body } */
const components = new Map();

const CASE_RE = /\{\s*key:\s*"([^"]+)"\s*,\s*label:\s*"([^"]*)"/g;
const ARRAY_RE = /const\s+([A-Z][A-Z0-9_]*)\s*:\s*SectionCase\[\]\s*=\s*\[/g;
const EXPORT_RE = /export\s+(?:const|function)\s+([A-Z][A-Za-z0-9]*)\b/g;

for (const f of files) {
  const src = read(f);
  const base = path.basename(f);
  for (const m of src.matchAll(ARRAY_RE)) {
    const start = m.index + m[0].length;
    const end = src.indexOf("\n];", start);
    const body = src.slice(start, end < 0 ? undefined : end);
    const cases = [...body.matchAll(CASE_RE)].map((c) => ({ key: c[1], label: c[2] }));
    if (!cases.length) continue;
    arrays.set(`${base}::${m[1]}`, { file: f, cases });
    for (const c of cases) casesByKey.set(`${base}::${c.key}`, c);
  }
  const exps = [...src.matchAll(EXPORT_RE)];
  exps.forEach((e, i) => {
    const start = e.index;
    const end = i + 1 < exps.length ? exps[i + 1].index : src.length;
    components.set(e[1], { file: f, body: src.slice(start, end) });
  });
}

/** arrays referenced by name (`cases={NAME}`) anywhere, and keys referenced by byKey */
const namedAnywhere = new Set();
const keyedAnywhere = new Set();
for (const [, c] of components) {
  const base = path.basename(c.file);
  for (const m of c.body.matchAll(/cases=\{([A-Z][A-Z0-9_]*)\}/g)) namedAnywhere.add(`${base}::${m[1]}`);
  for (const m of c.body.matchAll(/byKey\(([^)]*)\)/g))
    for (const k of m[1].matchAll(/"([^"]+)"/g)) keyedAnywhere.add(`${base}::${k[1]}`);
}
/** arrays whose every case is reached through byKey → not "unnamed" */
const coveredByKey = (id) => {
  const hit = arrays.get(id);
  const base = id.split("::")[0];
  return hit.cases.every((c) => keyedAnywhere.has(`${base}::${c.key}`));
};

/** split a component body into SectionWrapper blocks + the remainder */
const splitBlocks = (body) => {
  const blocks = [];
  let rest = "";
  let pos = 0;
  for (;;) {
    const open = body.indexOf("<SectionWrapper", pos);
    if (open < 0) {
      rest += body.slice(pos);
      break;
    }
    rest += body.slice(pos, open);
    const attrsEnd = body.indexOf(">", open);
    const close = body.indexOf("</SectionWrapper>", attrsEnd);
    const attrs = body.slice(open, attrsEnd);
    const id = attrs.match(/\bid="([^"]+)"/)?.[1] ?? "";
    const title = attrs.match(/\btitle="([^"]*)"/)?.[1] ?? "";
    const inner = close < 0 ? body.slice(attrsEnd + 1) : body.slice(attrsEnd + 1, close);
    blocks.push({ id, title, inner });
    if (close < 0) break;
    pos = close + "</SectionWrapper>".length;
  }
  return { blocks, rest };
};

/**
 * collect rows reachable from a component: [{ section, sectionTitle, key, label }]
 * key "" = the section itself.
 */
const collect = (compName, seen = new Set(), inherit = { id: "", title: "" }) => {
  if (seen.has(compName)) return [];
  seen.add(compName);
  const comp = components.get(compName);
  if (!comp) return [];
  const base = path.basename(comp.file);
  const out = [];

  const scan = (text, sec) => {
    const push = (c) => out.push({ section: sec.id, sectionTitle: sec.title, key: c.key, label: c.label });
    for (const m of text.matchAll(/cases=\{([A-Z][A-Z0-9_]*)\}/g)) {
      const hit = arrays.get(`${base}::${m[1]}`);
      if (hit) hit.cases.forEach(push);
    }
    for (const m of text.matchAll(/byKey\(([^)]*)\)/g))
      for (const k of m[1].matchAll(/"([^"]+)"/g)) {
        const hit = casesByKey.get(`${base}::${k[1]}`);
        if (hit) push(hit);
      }
    for (const m of text.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)) {
      if (m[1] !== compName && components.has(m[1])) out.push(...collect(m[1], seen, sec));
    }
  };

  const { blocks, rest } = splitBlocks(comp.body);
  for (const b of blocks) {
    const sec = b.id ? { id: b.id, title: b.title } : inherit;
    if (b.id) out.push({ section: b.id, sectionTitle: b.title, key: "", label: b.title });
    scan(b.inner, sec);
  }
  scan(rest, inherit);
  // 文件里没被任何组件点名、也没走 byKey 的数组 → 归该文件每个组件，section 空
  for (const [id, hit] of arrays) {
    if (!id.startsWith(`${base}::`)) continue;
    if (namedAnywhere.has(id) || coveredByKey(id)) continue;
    for (const c of hit.cases) out.push({ section: "", sectionTitle: "", key: c.key, label: c.label });
  }
  return out;
};

/* ---------- 2. nav.tsx: node → component ---------- */
const nav = read(path.join(SG, "nav.tsx"));
const NODE_RE = /s\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(?:lp|sec)\(\s*"([^"]+)"(?:\s*,\s*"([^"]+)")?\s*\)\s*\)/g;
const nodes = [...nav.matchAll(NODE_RE)].map((m) => ({ id: m[1], label: m[2], comp: m[4] ?? m[3] }));
// composite nodes declared as local components (e.g. MobilePatternsNode)
for (const m of nav.matchAll(/s\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([A-Z][A-Za-z0-9]*)\s*\)/g)) {
  const at = nav.indexOf(`const ${m[3]}`);
  const local = nav.slice(at, at + 600);
  const inner = [...local.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)].map((x) => x[1]);
  nodes.push({ id: m[1], label: m[2], comp: inner });
}

/* ---------- 3. build ---------- */
const CODE_RE = /^([A-Z]{2,4}-[A-Z]{0,2}\d{1,3}[a-z]?)\b/;
const index = [];
const seenRow = new Set();
for (const n of nodes) {
  const comps = Array.isArray(n.comp) ? n.comp : [n.comp];
  for (const c of comps) {
    for (const r of collect(c)) {
      const id = `${n.id}|${r.section}|${r.key}`;
      if (seenRow.has(id)) continue;
      seenRow.add(id);
      const code = r.key ? (r.label.match(CODE_RE)?.[1] ?? "") : "";
      index.push({
        node: n.id,
        nodeLabel: n.label.replace(/\s[✅⏳🔧]$/, ""),
        section: r.section,
        sectionTitle: r.sectionTitle,
        key: r.key,
        label: r.label,
        code,
      });
    }
  }
}
index.sort((a, b) => a.node.localeCompare(b.node) || a.section.localeCompare(b.section) || a.key.localeCompare(b.key));
const json = JSON.stringify(index, null, 0) + "\n";

if (CHECK) {
  const cur = fs.existsSync(OUT) ? read(OUT) : "";
  if (cur !== json) {
    console.error("\x1b[31msg:index — searchIndex.json 过期，请跑 npm run sg:index 后一起提交。\x1b[0m");
    process.exit(1);
  }
  console.log(`\x1b[32msg:index — 索引最新（${index.length} 条）。\x1b[0m`);
} else {
  fs.writeFileSync(OUT, json);
  const byNode = {};
  for (const r of index) {
    const k = r.node;
    byNode[k] ??= { sections: 0, cases: 0 };
    r.key ? byNode[k].cases++ : byNode[k].sections++;
  }
  console.log(`sg:index — ${index.length} 条 → ${path.relative(ROOT, OUT)}`);
  for (const [k, v] of Object.entries(byNode)) console.log(`  ${k.padEnd(22)} ${v.sections} 节 · ${v.cases} case`);
}
