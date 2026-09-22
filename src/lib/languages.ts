/**
 * Site languages — single source for the header switcher and
 * Settings › Preferences › Language (CPO 2026-09-22).
 *
 * Batch 1 (this round): EN · 简体中文 · 繁體中文 · 日本語 · 한국어 · Русский · Tiếng Việt.
 * Batch 2 (later, not shipped): Español · Bahasa Indonesia · Türkçe.
 *
 * Labels are the language's own name in its own script — the one accepted
 * exception to "user-visible copy is English only" (precedent: header).
 * `short` is the 2-letter code the header chip shows.
 * Page copy is NOT translated in the blueprint; the preference is stored
 * (profiles.language) and drives the header chip + the language of emails.
 */
export type LanguageCode = "en" | "zh-CN" | "zh-TW" | "ja" | "ko" | "ru" | "vi";

export interface SiteLanguage {
  code: LanguageCode;
  short: string;
  label: string;
}

export const SITE_LANGUAGES: SiteLanguage[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "zh-CN", short: "ZH", label: "简体中文" },
  { code: "zh-TW", short: "TW", label: "繁體中文" },
  { code: "ja", short: "JA", label: "日本語" },
  { code: "ko", short: "KO", label: "한국어" },
  { code: "ru", short: "RU", label: "Русский" },
  { code: "vi", short: "VI", label: "Tiếng Việt" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_STORAGE_KEY = "omenx.language";

export const isLanguageCode = (v: unknown): v is LanguageCode =>
  typeof v === "string" && SITE_LANGUAGES.some((l) => l.code === v);

export const getLanguage = (code: string | null | undefined): SiteLanguage =>
  SITE_LANGUAGES.find((l) => l.code === code) ?? SITE_LANGUAGES[0];
