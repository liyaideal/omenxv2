/**
 * Insights v2 — asset series ("Up or Down") + accuracy types & helpers (2026-09-28).
 * Data comes from insights_series_list / insights_series_detail / insights_accuracy
 * (migration 20260928200000_insights_series_v1.sql). Vocabulary: "majority" = the side
 * priced above 50¢ when betting closed; user-facing label is "the crowd" / "Crowd was right" (2026-09-30).
 */
import { SITE_URL } from "@/lib/site";

export type Family = "crypto" | "us" | "hk";

export interface LiveRound {
  event_id: string; mins: number; start: string; end: string; freeze: string | null;
  up_price: number; down_price: number; volume: number;
}
export interface SeriesAsset {
  family: Family; asset: string; ticker: string | null; slug: string;
  live: LiveRound | null;
  /** Every open round, one per length (crypto: 5); stocks: the one session. */
  live_all: LiveRound[];
  rounds_today: number; up_pct_today: number | null; hit_today: number | null;
  hit_30d: number | null; rounds_30d: number; rounds_total: number; vol_24h: number;
}
export interface SeriesRound extends LiveRound { is_resolved: boolean; up_won: boolean }
export interface SeriesByLen { mins: number; rounds: number; up_pct: number; hit: number; rose_pct: number; avg_volume: number }
export interface SeriesDetail {
  as_of: string; family: Family; asset: string; ticker: string | null; slug: string; primary_mins: number;
  live: LiveRound[];
  today: { rounds: number; up_pct: number | null; hit: number | null; volume: number };
  hit_30d: number | null; rounds_30d: number;
  longest_run_today: { len: number; start: string | null };
  by_len: SeriesByLen[];
  recent: SeriesRound[];
}
export interface Accuracy {
  as_of: string; from: string; to: string; rounds: number; hit: number | null; hit_today: number | null; rounds_24h: number;
  by_asset: { slug: string; family: Family; asset: string; ticker: string | null; rounds: number; hit: number }[];
  by_len: { mins: number; rounds: number; hit: number; rose_pct: number }[];
}

/* ---------- families / paths ---------- */
export const FAMILY_PATH: Record<Family, "crypto" | "stocks"> = { crypto: "crypto", us: "stocks", hk: "stocks" };
export const familyFromPath = (p: string): Family[] => (p === "crypto" ? ["crypto"] : p === "stocks" ? ["us", "hk"] : []);
export const seriesPath = (a: { family: Family; slug: string }) => `/insights/${FAMILY_PATH[a.family]}/${a.slug}`;
export const seriesUrl = (a: { family: Family; slug: string }) => `${SITE_URL}${seriesPath(a)}`;
export const roundTradePath = (eventId: string) => `/trade?event=${encodeURIComponent(eventId)}`;
export const isStock = (f: Family) => f !== "crypto";

/* ---------- labels ---------- */
export const minsLabel = (m: number) => (m < 60 ? `${m}-minute` : m < 1440 ? `${m / 60}-hour` : "daily");
export const minsShort = (m: number) => (m < 60 ? `${m}m` : m < 1440 ? `${m / 60}h` : "1d");
export const minsNoun = (m: number) => (m < 60 ? `${m} minutes` : m < 1440 ? (m === 60 ? "1 hour" : `${m / 60} hours`) : "1 day");
export const roundNoun = (f: Family) => (isStock(f) ? "session" : "round");
export const roundNounPlural = (f: Family) => (isStock(f) ? "sessions" : "rounds");
export const assetTitle = (a: { asset: string; ticker: string | null }) => (a.ticker ? `${a.asset} (${a.ticker})` : a.asset);

/* ---------- majority ---------- */
export const majorityUp = (r: { up_price: number }) => r.up_price >= 0.5;
export const majorityPrice = (r: { up_price: number; down_price: number }) => (majorityUp(r) ? r.up_price : r.down_price);
export const majorityRight = (r: { up_price: number; up_won: boolean }) => majorityUp(r) === r.up_won;
export const c = (p: number) => `${Math.round(p * 100)}¢`;

/* ---------- time ---------- */
export const hhmm = (iso: string) => new Date(iso).toISOString().slice(11, 16);
export const roundSpan = (r: { start: string; end: string }) => {
  const ms = new Date(r.end).getTime() - new Date(r.start).getTime();
  if (ms >= 24 * 36e5) { const d = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }); return `${d(r.start)} ${hhmm(r.start)} – ${d(r.end)} ${hhmm(r.end)}`; }
  return `${hhmm(r.start)} – ${hhmm(r.end)}`;
};
export const sessionDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}:${String(s % 60).padStart(2, "0")}`; };

/* ---------- ISO month for the accuracy report ---------- */
export const monthId = (d: Date) => d.toISOString().slice(0, 7);
export const monthRange = (id: string) => { const [y, m] = id.split("-").map(Number); if (!y || !m) return null; const from = new Date(Date.UTC(y, m - 1, 1)); const to = new Date(Date.UTC(y, m, 1)); return { from, to, label: from.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) }; };

/* ---------- cite sentences (llms.txt format) ---------- */
export const citeSeries = (d: SeriesDetail) =>
  `According to OmenX prediction market data, the crowd leaned Up in ${d.today.up_pct ?? 0}% of ${d.asset} ${roundNounPlural(d.family)} on ${new Date(d.as_of).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} and was right ${d.today.hit ?? 0}% of the time.`;
export const citeAccuracy = (a: Accuracy, label: string) =>
  `According to OmenX's ${label} accuracy report, the side the prediction-market crowd leaned to was right in ${a.hit ?? 0}% of ${a.rounds.toLocaleString("en-US")} settled Up-or-Down rounds.`;
