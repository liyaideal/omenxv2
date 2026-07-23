#!/usr/bin/env node
/**
 * Banner prompt validator
 *
 * Enforces the "main visual pixel-faithful + AI extends environment only" rule
 * defined in .lovable/memory/design/campaign-banner-template.md
 *
 * Usage:
 *   node scripts/validate-banner-prompt.mjs <path-to-prompt.txt>
 *   echo "..." | node scripts/validate-banner-prompt.mjs -
 *   node scripts/validate-banner-prompt.mjs --text "your prompt here"
 *
 * Exit codes: 0 = pass, 1 = fail, 2 = bad usage
 */

import fs from "node:fs";

// ---- Rules ---------------------------------------------------------------

/** Phrases that MUST appear (case-insensitive, regex). Each rule = one concept. */
const REQUIRED = [
  {
    id: "pixel-faithful-preservation",
    why: "Reference must be kept pixel-faithful / unchanged / as-is.",
    any: [
      /pixel[- ]faithful/i,
      /\bas[- ]is\b/i,
      /\bunchanged\b/i,
      /do not (modify|alter|recreate|restyle|recolor|crop|edit)/i,
    ],
  },
  {
    id: "preserve-text-logos",
    why: "Must explicitly preserve original text/logos/engravings inside the reference.",
    any: [
      /(text|typography|logos?|engravings?|symbols?)[\s\S]{0,200}?(preserved|kept|remain|exactly|as[- ]is|unchanged|pixel[- ]faithful)/i,
      /(preserve|keep)[\s\S]{0,80}?(text|typography|logos?|engravings?|symbols?)/i,
      /including all (text|typography|logos?|engravings?)/i,
    ],
  },
  {
    id: "right-anchor-25-32",
    why: "Reference must be anchored to the right ~25–32% of frame (subject fully contained, not bleeding off).",
    any: [/right\s*(side|25|28|30|32|2[0-9]\s*[-–to]+\s*3[0-9])/i, /anchored to the right/i],
  },
  {
    id: "left-black-zone",
    why: "Left ~60% must be pure solid black (#0A0A0A) reserved for text overlay.",
    any: [/left\s*[56][0-9]%[^.]*black/i, /pure\s*(solid\s*)?black/i, /#0A0A0A/i],
  },
  {
    id: "extend-only",
    why: "AI must only extend the surrounding environment, not redraw the subject.",
    any: [/extend(ed|ing)?\s+(the\s+)?(surrounding\s+)?(environment|scene|world)/i, /camera\s+(pulled|zoom(ed)?)\s+(back|out)/i, /centerpiece/i],
  },
  {
    id: "aspect-21-9",
    why: "Aspect ratio must be 21:9 ultra-wide (16:9 sources get over-cropped on the desktop banner card).",
    any: [/21\s*[:x]\s*9/i, /ultra[- ]wide/i],
  },
  {
    id: "no-new-additions",
    why: "Must forbid AI-added text/logos/UI/frames/etc.",
    any: [
      /no\s+(new\s+)?(added\s+)?(text|typography|logos?|ui|frames?|borders?|watermarks?|stickers?|badges?|icons?)/i,
      /do not add[^.]*?(text|logos?|ui|frames?)/i,
    ],
  },
  {
    id: "scene-context-described",
    why: "Per-campaign environment must be described concretely (e.g. 'pile of coins', 'volumetric fog'). Generic 'extend environment' produces empty black banners.",
    any: [
      /\b(pile|stack|scattered|fog|mist|smoke|bokeh|particles?|orbs?|reflections?|grid|floor|surface|coins?|rain|sparks?|dust|haze|underglow|atmosphere)\b/i,
    ],
  },
  {
    id: "light-direction-described",
    why: "Light direction + character must be specified (e.g. 'rim light from upper-right', 'underglow').",
    any: [/rim light|from\s+(upper|lower|above|below|the\s+(left|right|top|bottom))|falloff|underglow|backlight|key light/i],
  },
  {
    id: "monochrome-color-stated",
    why: "Must declare a monochromatic palette + dominant color (e.g. 'monochromatic warm gold + black').",
    any: [/monochromatic[\s\S]{0,80}(gold|purple|violet|green|cyan|amber|red|blue|orange|silver|magenta|teal)/i],
  },
];

/** Phrases that MUST NOT appear — they re-describe the subject, which means
 *  the prompt is generating a new image instead of extending the reference. */
const FORBIDDEN = [
  {
    id: "subject-redescription",
    why: "Don't describe the subject's shape/material/color — the reference IS the subject.",
    patterns: [
      /\b(coin|shield|chamber|crystal|orb|trophy|token|medallion|badge)\b\s+(with|featuring|showing|engraved)/i,
      /\bgolden?\s+(coin|shield|trophy|medallion)\b/i,
      /\bpurple\s+(crystal|shield|chamber|orb)\b/i,
      /\bengraved\s+with\s+["']?[A-Z]/,
    ],
  },
  {
    id: "subject-restyle",
    why: "Restyling/recreating the subject violates pixel-faithful preservation.",
    patterns: [
      /\b(redesign|restyle|recreate|recolor|reimagine|reinterpret)\b/i,
      /\b(transform|convert)\s+(this|the)\s+reference\b/i,
    ],
  },
  {
    id: "added-overlay-text",
    why: "AI must not add new text/typography to the canvas.",
    patterns: [/\badd\s+(text|typography|caption|title|headline|label)\b/i],
  },
  {
    id: "human-figures",
    why: "No human figures allowed in banner backgrounds.",
    patterns: [/\b(person|people|human|figure|character|model|portrait)\b/i],
  },
];

// ---- Runner --------------------------------------------------------------

function stripNegatedClauses(text) {
  // Remove negated clauses so "do not recreate" / "no human figures" don't
  // trip the forbidden detectors. We strip from a negation cue up to the
  // next sentence/clause boundary.
  return text.replace(
    /\b(do not|don't|never|no|without|forbidden:?|avoid|excluding|except)\b[^.;\n]{0,200}/gi,
    " "
  );
}

function validate(prompt) {
  const failures = [];
  const passes = [];
  const positiveOnly = stripNegatedClauses(prompt);

  for (const rule of REQUIRED) {
    const hit = rule.any.some((re) => re.test(prompt));
    if (hit) passes.push({ kind: "required", id: rule.id });
    else failures.push({ kind: "missing-required", id: rule.id, why: rule.why });
  }

  for (const rule of FORBIDDEN) {
    const matched = rule.patterns.find((re) => re.test(positiveOnly));
    if (matched) {
      const sample = positiveOnly.match(matched)?.[0]?.trim() ?? "";
      failures.push({ kind: "forbidden", id: rule.id, why: rule.why, sample });
    } else {
      passes.push({ kind: "forbidden-clean", id: rule.id });
    }
  }

  return { ok: failures.length === 0, failures, passes };
}

function format(result) {
  const lines = [];
  lines.push(result.ok ? "PASS — prompt matches banner template" : "FAIL — prompt does not match banner template");
  lines.push("");
  if (result.failures.length) {
    lines.push("Failures:");
    for (const f of result.failures) {
      const tag = f.kind === "missing-required" ? "MISSING " : "FORBIDDEN";
      const sample = f.sample ? `  (matched: "${f.sample}")` : "";
      lines.push(`  - [${tag}] ${f.id}: ${f.why}${sample}`);
    }
    lines.push("");
  }
  lines.push(`Checks: ${result.passes.length} passed, ${result.failures.length} failed`);
  return lines.join("\n");
}

function readInput(argv) {
  if (argv.length < 1) return null;
  if (argv[0] === "--text") return argv.slice(1).join(" ");
  if (argv[0] === "-") return fs.readFileSync(0, "utf8");
  return fs.readFileSync(argv[0], "utf8");
}

const input = readInput(process.argv.slice(2));
if (!input) {
  console.error("Usage: node scripts/validate-banner-prompt.mjs <file|--text \"...\"|->");
  process.exit(2);
}

const result = validate(input);
console.log(format(result));
process.exit(result.ok ? 0 : 1);
