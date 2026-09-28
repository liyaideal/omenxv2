/**
 * Site i18n (Lovable, i18n phase B · 2026-09-28).
 *
 * Source of truth = the production catalog `OMENX-i18n.xlsx` (27 namespaces,
 * ~5.9k keys, 7 languages) exported to `src/locales/<lang>.json` as
 * `{ namespace: { flatKey: text } }`. Keys are `namespace.flatKey`, e.g.
 * `settings.screen.sections.settings_account_security_card.enabled`.
 * Lovable-only strings (features the platform hasn't built yet) are appended
 * to the same catalog with source = "Lovable <date>"; the xlsx with those
 * rows lives in the OmenX folder and goes back to the platform team.
 *
 * Dependency-free on purpose (the Mac autopush never runs `bun install`);
 * the format is i18next-compatible so the real platform wires the same
 * files into i18next:
 *   - `{{var}}` interpolation (legacy `{var}` also accepted)
 *   - `key_one` / `key_other` plural pick via `{ count }`
 *   - missing key → English → the key itself (never throws)
 *   - non-English locales are code-split and loaded on first use;
 *     until loaded, English renders, then the page re-renders.
 *
 * Scope rule: UI chrome + fixed copy only. Event titles, match names,
 * campaign copy and other content data stay in their source language.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/languages";
import en from "@/locales/en.json";

type Catalog = Record<string, Record<string, string>>;

const catalogs: Partial<Record<LanguageCode, Catalog>> = { en: en as Catalog };
const loaders: Record<LanguageCode, () => Promise<{ default: Catalog }>> = {
  en: () => Promise.resolve({ default: en as Catalog }),
  "zh-CN": () => import("@/locales/zh-CN.json") as Promise<{ default: Catalog }>,
  "zh-TW": () => import("@/locales/zh-TW.json") as Promise<{ default: Catalog }>,
  ja: () => import("@/locales/ja.json") as Promise<{ default: Catalog }>,
  ko: () => import("@/locales/ko.json") as Promise<{ default: Catalog }>,
  ru: () => import("@/locales/ru.json") as Promise<{ default: Catalog }>,
  vi: () => import("@/locales/vi.json") as Promise<{ default: Catalog }>,
};

let current: LanguageCode = DEFAULT_LANGUAGE;
let version = 0; // bumps on language change AND on catalog arrival
const listeners = new Set<() => void>();
const notify = () => {
  version += 1;
  listeners.forEach((l) => l());
};

export const getI18nLanguage = () => current;
const getVersion = () => version;

const pending: Partial<Record<LanguageCode, Promise<void>>> = {};

/** Resolve once the locale's catalog is in memory (English resolves immediately). */
export const loadLanguage = (code: LanguageCode): Promise<void> => {
  if (catalogs[code]) return Promise.resolve();
  if (!pending[code]) {
    pending[code] = loaders[code]().then((m) => {
      catalogs[code] = m.default;
      if (code === current) notify();
    });
  }
  return pending[code]!;
};

const ensureLoaded = (code: LanguageCode) => {
  void loadLanguage(code);
};

let locked = false;

/** Style-guide preview only: pin the language regardless of the viewer's preference. */
export const lockI18nLanguage = (code: LanguageCode) => {
  locked = true;
  if (code !== current) {
    current = code;
    ensureLoaded(code);
    notify();
  }
};

export const setI18nLanguage = (code: LanguageCode) => {
  if (locked || code === current) return;
  current = code;
  try {
    document.documentElement.lang = code;
  } catch {
    /* SSR / tests */
  }
  ensureLoaded(code);
  notify();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export type TVars = Record<string, string | number>;

const lookup = (cat: Catalog | undefined, key: string): string | undefined => {
  if (!cat) return undefined;
  const dot = key.indexOf(".");
  if (dot < 0) return undefined;
  const ns = key.slice(0, dot);
  const rest = key.slice(dot + 1);
  const v = cat[ns]?.[rest];
  return typeof v === "string" ? v : undefined;
};

const pluralKey = (key: string, vars?: TVars) => {
  if (!vars || typeof vars.count !== "number") return key;
  return `${key}_${vars.count === 1 ? "one" : "other"}`;
};

const interpolate = (s: string, vars?: TVars) =>
  vars ? s.replace(/\{\{?(\w+)\}?\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;

/** Translate with an explicit language (for non-React code paths). */
export const tIn = (code: LanguageCode, key: string, vars?: TVars): string => {
  const cat = catalogs[code];
  const pk = pluralKey(key, vars);
  const s =
    lookup(cat, pk) ?? lookup(cat, key) ?? lookup(catalogs.en, pk) ?? lookup(catalogs.en, key) ?? key;
  return interpolate(s, vars);
};

/** Translate in the current language (module-level; prefer useT() in components). */
export const t = (key: string, vars?: TVars) => tIn(current, key, vars);

/** React hook: returns a `t` bound to the current language; re-renders on change / catalog load. */
export const useT = () => {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  const code = current;
  return { t: (key: string, vars?: TVars) => tIn(code, key, vars), code };
};

/** True when the key exists in the English catalog (guards against typos in dev). */
export const hasKey = (key: string) => lookup(catalogs.en, key) !== undefined;
