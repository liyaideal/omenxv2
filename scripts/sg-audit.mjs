#!/usr/bin/env node
/**
 * sg:audit — style-guide「半活体」闸门。
 *
 * 扫描 src/pages/StyleGuide/preview/*.tsx（排除 registry.tsx），
 * 找出 preview 文件里手写的视觉外壳（className / 内联 style），
 * 与 scripts/sg-audit-baseline.json 做棘轮比较：
 *   违规数 ≤ 基线 → PASS；> 基线（或新文件有违规）→ FAIL exit 1。
 *
 * 参数：
 *   --report            只打印全表，不 exit 1
 *   --update-baseline   重写基线（仅在违规数不上升时允许）
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const PREVIEW_DIR = path.join(ROOT, "src/pages/StyleGuide/preview");
const BASELINE_PATH = path.join(ROOT, "scripts/sg-audit-baseline.json");

const args = process.argv.slice(2);
const REPORT_ONLY = args.includes("--report");
const UPDATE_BASELINE = args.includes("--update-baseline");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

/* ---------------- 判定规则 ---------------- */

const CLASS_VIOLATIONS = [
  { re: /(^|:)rounded-/, name: "rounded-" },
  { re: /(^|:)border(?!-none\b)/, name: "border" },
  { re: /(^|:)bg-(?!transparent\b)/, name: "bg-" },
  { re: /(^|:)shadow/, name: "shadow" },
  { re: /(^|:)ring-/, name: "ring-" },
  { re: /(^|:)backdrop-/, name: "backdrop-" },
  { re: /(^|:)max-w-\[/, name: "max-w-[" },
  { re: /(^|:)w-\[/, name: "w-[" },
  { re: /(^|:)min-w-\[/, name: "min-w-[" },
];

const STYLE_VIOLATIONS = ["background", "border", "borderRadius", "boxShadow"];

function tokenViolation(token) {
  // 去掉 tailwind variant 前缀（md: / hover: / dark: ...）后判定
  const bare = token.replace(/^(?:[a-zA-Z0-9@[\]().<>-]+:)+/, "");
  for (const v of CLASS_VIOLATIONS) {
    if (v.re.test(bare)) return v.name;
  }
  return null;
}

function scanFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  const hits = [];

  lines.forEach((line, i) => {
    const lineNo = i + 1;

    // className="..." 字符串字面量
    for (const m of line.matchAll(/className=(?:"([^"]*)"|\{"([^"]*)"\})/g)) {
      const value = m[1] ?? m[2] ?? "";
      for (const token of value.split(/\s+/).filter(Boolean)) {
        const kind = tokenViolation(token);
        if (kind) hits.push({ line: lineNo, kind, snippet: token });
      }
    }

    // style={{ ... }} 内联对象
    for (const m of line.matchAll(/style=\{\{([^}]*)\}\}/g)) {
      const body = m[1];
      for (const key of STYLE_VIOLATIONS) {
        const re = new RegExp(`(^|[\\s,{])${key}\\s*:`);
        if (re.test(body)) hits.push({ line: lineNo, kind: `style.${key}`, snippet: body.trim() });
      }
    }
  });

  return hits;
}

/* ---------------- run ---------------- */

const files = fs
  .readdirSync(PREVIEW_DIR)
  .filter((f) => f.endsWith(".tsx") && f !== "registry.tsx")
  .sort();

const results = new Map();
for (const f of files) {
  results.set(f, scanFile(path.join(PREVIEW_DIR, f)));
}

let baseline = {};
if (fs.existsSync(BASELINE_PATH)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
}

const rows = [...results.entries()].map(([file, hits]) => ({
  file,
  count: hits.length,
  base: Object.prototype.hasOwnProperty.call(baseline, file) ? baseline[file] : null,
  hits,
}));

const nameW = Math.max(12, ...rows.map((r) => r.file.length));
console.log(`\nstyle-guide preview 手写外壳审计 · ${files.length} 个文件\n`);
console.log(
  `${"FILE".padEnd(nameW)}  ${"COUNT".padStart(5)}  ${"BASE".padStart(5)}  STATUS`,
);
console.log("-".repeat(nameW + 26));

const failures = [];
for (const r of rows) {
  const base = r.base;
  let status;
  if (base === null) {
    status = r.count > 0 ? "NEW+FAIL" : "new/clean";
    if (r.count > 0) failures.push(r);
  } else if (r.count > base) {
    status = "FAIL (+" + (r.count - base) + ")";
    failures.push(r);
  } else if (r.count < base) {
    status = "improved (-" + (base - r.count) + ")";
  } else {
    status = "ok";
  }
  console.log(
    `${r.file.padEnd(nameW)}  ${String(r.count).padStart(5)}  ${String(base ?? "-").padStart(5)}  ${status}`,
  );
}

const total = rows.reduce((a, r) => a + r.count, 0);
console.log("-".repeat(nameW + 26));
console.log(`${"TOTAL".padEnd(nameW)}  ${String(total).padStart(5)}\n`);

if (REPORT_ONLY) {
  for (const r of rows.filter((x) => x.count)) {
    console.log(`${DIM}── ${r.file}${RESET}`);
    for (const h of r.hits) {
      console.log(`   L${String(h.line).padStart(4)}  ${h.kind.padEnd(12)}  ${h.snippet}`);
    }
    console.log("");
  }
}

if (UPDATE_BASELINE) {
  const rising = rows.filter((r) => r.base !== null && r.count > r.base);
  const newDirty = rows.filter((r) => r.base === null && r.count > 0);
  if (rising.length || newDirty.length) {
    console.log(
      `${RED}拒绝写入基线：以下文件违规数上升或为带违规的新文件 — ${[...rising, ...newDirty]
        .map((r) => r.file)
        .join(", ")}${RESET}`,
    );
    process.exit(1);
  }
  const next = {};
  for (const r of rows) next[r.file] = r.count;
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`${GREEN}基线已更新：scripts/sg-audit-baseline.json${RESET}`);
  process.exit(0);
}

if (failures.length && !REPORT_ONLY) {
  console.log(`${RED}FAIL — 以下文件违规数超出基线：${RESET}`);
  for (const r of failures) {
    console.log(`${RED}  ${r.file}  ${r.count} > ${r.base ?? 0}${RESET}`);
    for (const h of r.hits) {
      console.log(`${RED}    L${h.line}  ${h.kind}  ${h.snippet}${RESET}`);
    }
  }
  console.log(
    `${RED}preview 文件不许手写视觉外壳——请挂生产组件本体；生产件没导出就先做零视觉变化的 export 提取。${RESET}`,
  );
  process.exit(1);
}

console.log(`${GREEN}PASS — 无文件超出基线。${RESET}`);
