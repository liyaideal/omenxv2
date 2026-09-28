/**
 * Insights SEO/GEO — shared types, math and formatters.
 * Spec: OmenX/SEO_P2_Insights_Page_Spec.md (2026-03-30) · delivery: docs/delivery/lite-insights-seo-v1.md.
 * Search vocabulary rule (omenx-seo-geo): headings / sentences say "prediction market",
 * "probability", "odds"; price pills keep the product's ¢ form.
 */
import type { EventWithOptions } from "@/hooks/useActiveEvents";
import { TOP_CATEGORIES, categoryLabelForKey, topCategoryForKey } from "@/lib/taxonomy";
import { SITE_URL } from "@/lib/site";

export const INSIGHTS_PATH = "/insights";
export const MOVE_THRESHOLD = 0.05; // 5 pts — spec §A3; below this a move is noise

export interface PlatformStats {
  as_of: string;
  total_volume: number;
  open_interest: number;
  active_markets: number;
  resolved_markets: number;
  volume_24h: number;
  volume_prev_24h: number;
  trades_24h: number;
  trades_prev_24h: number;
  volume_7d: number;
  volume_30d: number;
}

export interface Activity { trades: number; volume: number }
export interface Mover { event_id: string; option_id: string; first_price: number; last_price: number; first_at: string; last_at: string }

/** One row of any market list — everything a card / table row / JSON-LD item needs. */
export interface MarketRow {
  event: EventWithOptions;
  /** Leading option (highest price) — the "crowd says" side. */
  lead: { id: string; label: string; price: number };
  other: { id: string; label: string; price: number } | null;
  probability: number; // 0..100 of lead
  activity: Activity;
  move: { from: number; to: number; delta: number } | null; // lead option, window
  series: number[]; // sparkline prices (lead option)
}

/* ---------- formatting ---------- */
export const fmtUsd = (n: number, compact = true) => {
  if (!Number.isFinite(n)) return "—";
  if (!compact) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const a = Math.abs(n);
  if (a >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(0);
};
export const fmtInt = (n: number) => n.toLocaleString("en-US");
export const fmtPct = (n: number) => (n > 0 ? "+" : "") + n.toFixed(1) + "%";
export const fmtPts = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(Math.round(n)) + " pts";
export const cents = (p: number) => Math.round(p * 100) + "¢";
export const pct = (p: number) => Math.round(p * 100);
export const deltaPct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTimeUtc = (d: Date | string) => {
  const x = new Date(d);
  return x.toISOString().slice(0, 16).replace("T", " ") + " UTC";
};
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const untilLabel = (end: string | Date) => {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "settling";
  const h = ms / 36e5;
  if (h < 1) return Math.max(1, Math.round(ms / 6e4)) + " min";
  if (h < 48) return Math.round(h) + " h";
  return Math.round(h / 24) + " d";
};

/* ---------- ISO week ---------- */
export interface IsoWeek { year: number; week: number; start: Date; end: Date; id: string }
export const isoWeekOf = (d: Date): IsoWeek => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  const year = date.getUTCFullYear();
  const start = new Date(date); start.setUTCDate(date.getUTCDate() - 3); // Monday
  const end = new Date(start); end.setUTCDate(start.getUTCDate() + 7);
  return { year, week, start, end, id: `${year}-W${String(week).padStart(2, "0")}` };
};
export const parseIsoWeek = (id: string): IsoWeek | null => {
  const m = /^(\d{4})-W(\d{2})$/.exec(id);
  if (!m) return null;
  const year = +m[1], week = +m[2];
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4); monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return isoWeekOf(new Date(monday.getTime() + 3 * 864e5));
};
export const weekLabel = (w: IsoWeek) => {
  const s = w.start, e = new Date(w.end.getTime() - 1);
  const f = (d: Date, y: boolean) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(y ? { year: "numeric" } : {}), timeZone: "UTC" });
  return `Week ${w.week} · ${f(s, false)}–${f(e, true)}`;
};

/* ---------- categories ---------- */
export const CATEGORY_SLUGS = TOP_CATEGORIES.filter((c) => c.kind === "sector" || c.id === "sports").map((c) => c.id);
export const categorySlugFor = (key: string | null | undefined) => topCategoryForKey(key)?.id ?? "other";
export const categoryLabelForSlug = (slug: string) => TOP_CATEGORIES.find((c) => c.id === slug)?.label ?? "Other";
export { categoryLabelForKey };

/* ---------- rows ---------- */
/** Crypto 15-minute rounds are a rolling series (one page per round would be duplicate content for a crawler):
 *  they are excluded from ranked lists / movers / feed and only surface in "closing soon". */
export const isQuickRound = (e: EventWithOptions) => (e.event_subtype ?? "").startsWith("CRYPTO_QUICK");

export const buildRows = (
  events: EventWithOptions[],
  activity: Map<string, Activity>,
  movers: Map<string, Mover>,
  series: Map<string, number[]>,
): MarketRow[] =>
  events
    .filter((e) => e.options && e.options.length > 0)
    .map((e) => {
      const opts = [...e.options].map((o) => ({ id: o.id, label: o.label, price: Number(o.price) }));
      const sorted = [...opts].sort((a, b) => b.price - a.price);
      const lead = sorted[0];
      const other = e.options.length === 2 ? sorted[1] : null;
      const mv = movers.get(lead.id);
      return {
        event: e,
        lead,
        other,
        probability: pct(lead.price),
        activity: activity.get(e.name) ?? { trades: 0, volume: 0 },
        move: mv ? { from: mv.first_price, to: mv.last_price, delta: (mv.last_price - mv.first_price) * 100 } : null,
        series: series.get(lead.id) ?? [],
      };
    });

const noQuick = (rows: MarketRow[]) => rows.filter((r) => !isQuickRound(r.event));
export const rankTrending = (rows: MarketRow[]) => noQuick(rows).sort((a, b) => (Math.abs(b.move?.delta ?? 0) * 1000 + b.activity.volume) - (Math.abs(a.move?.delta ?? 0) * 1000 + a.activity.volume));
export const rankVolume = (rows: MarketRow[]) => noQuick(rows).sort((a, b) => b.activity.volume - a.activity.volume);
export const rankActive = (rows: MarketRow[]) => noQuick(rows).sort((a, b) => b.activity.trades - a.activity.trades);
export const rankNew = (rows: MarketRow[]) => noQuick(rows).sort((a, b) => +new Date(b.event.created_at) - +new Date(a.event.created_at));
export const rankClosing = (rows: MarketRow[]) => {
  const seen = new Set<string>();
  return [...rows]
    .filter((r) => new Date(r.event.end_date) > new Date())
    .sort((a, b) => +new Date(a.event.end_date) - +new Date(b.event.end_date))
    .filter((r) => (seen.has(r.event.name) ? false : (seen.add(r.event.name), true))); // rolling rounds: one row per series
};
export const gainers = (rows: MarketRow[]) => noQuick(rows).filter((r) => (r.move?.delta ?? 0) >= MOVE_THRESHOLD * 100).sort((a, b) => b.move!.delta - a.move!.delta);
export const losers = (rows: MarketRow[]) => noQuick(rows).filter((r) => (r.move?.delta ?? 0) <= -MOVE_THRESHOLD * 100).sort((a, b) => a.move!.delta - b.move!.delta);

/** Canonical market URL for links + JSON-LD. Lovable route is /trade?event=; the platform must serve /event/{slug} (spec keyword map). */
export const marketPath = (e: EventWithOptions) => `/trade?event=${encodeURIComponent(e.id)}`;
export const marketUrl = (e: EventWithOptions) => `${SITE_URL}${marketPath(e)}`;

/* ---------- JSON-LD ---------- */
export const marketJsonLd = (r: MarketRow, asOf: string) => ({
  "@type": "DataFeedItem",
  dateModified: asOf,
  url: marketUrl(r.event),
  item: {
    "@type": "Thing",
    name: r.event.name,
    additionalProperty: [
      { "@type": "PropertyValue", name: "implied_probability", value: `${r.probability}%`, description: r.lead.label },
      { "@type": "PropertyValue", name: "price", value: r.lead.price.toFixed(2), unitText: "USDC" },
      { "@type": "PropertyValue", name: "trading_volume_24h", value: Math.round(r.activity.volume), unitText: "USD" },
      { "@type": "PropertyValue", name: "trades_24h", value: r.activity.trades },
      ...(r.move ? [{ "@type": "PropertyValue", name: "probability_change_24h", value: `${r.move.delta > 0 ? "+" : ""}${Math.round(r.move.delta)} pts` }] : []),
      { "@type": "PropertyValue", name: "category", value: categoryLabelForKey(r.event.category) },
      { "@type": "PropertyValue", name: "closes", value: r.event.end_date },
    ],
  },
});
export const dataFeedJsonLd = (name: string, url: string, asOf: string, rows: MarketRow[]) => ({
  "@context": "https://schema.org",
  "@type": "DataFeed",
  name,
  url,
  dateModified: asOf,
  provider: { "@type": "Organization", name: "OmenX", url: SITE_URL },
  dataFeedElement: rows.map((r) => marketJsonLd(r, asOf)),
});

/** The llms.txt citation sentence, filled. */
export const citeSentence = (r: MarketRow, asOf: string) =>
  `According to OmenX prediction market data, "${r.event.name}" (${r.lead.label}) is trading at ${cents(r.lead.price)}, implying a ${r.probability}% probability as of ${fmtDate(asOf)}.`;
