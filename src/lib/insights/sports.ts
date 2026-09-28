/**
 * Insights v2 — sports fixtures for the SEO pages (2026-09-28). One row per match:
 * crowd favourite (winner market), the main total line, live state. Built from the
 * public events list; grouping mirrors lite/sports/sportsData (fixture_id + market_type).
 */
import type { EventWithOptions } from "@/hooks/useActiveEvents";
import { fixtureMeta, isFixtureLive, type FixtureMeta } from "@/components/lite/sports/sportsData";

export interface Fixture {
  id: string; name: string; sport: string; league: string; kickoff: string | null; end: string | null;
  live: boolean; minute: number | null; phase: string | null; score: string | null;
  main: EventWithOptions; favourite: { label: string; price: number } | null;
  line: { label: string; price: number; kind: "goals" | "maps" | "points" | "rounds" } | null;
  volume: number; settled: boolean; favouriteWon: boolean | null; draw: boolean;
}

export const SPORT_LABEL: Record<string, string> = { soccer: "Soccer", esports: "Esports", tennis: "Tennis", basketball: "Basketball", mma: "MMA", football: "American football", baseball: "Baseball", hockey: "Ice hockey", cricket: "Cricket" };
export const sportLabel = (s: string) => SPORT_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
export const sportPath = (s: string) => `/insights/sports/${s}`;
export const settleWord = (s: string) => (s === "esports" ? "official result" : "full-time result");

const lineKind = (meta: FixtureMeta): "goals" | "maps" | "points" | "rounds" => {
  const s = meta.sport ?? "";
  if (s === "esports") return "maps"; if (s === "mma") return "rounds"; if (s === "basketball" || s === "football") return "points"; return "goals";
};

export const buildFixtures = (events: EventWithOptions[], now = Date.now()): Fixture[] => {
  const groups = new Map<string, EventWithOptions[]>();
  for (const e of events) {
    if (e.event_subtype !== "SPORTS_MATCH") continue;
    if (e.end_date && new Date(e.end_date).getTime() - now > 365 * 864e5) continue; // demo fixtures parked in 2126
    const m = fixtureMeta(e); const key = m.fixture_id ?? e.id;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(e);
  }
  const out: Fixture[] = [];
  for (const [key, list] of groups) {
    const main = list.find((e) => { const mt = fixtureMeta(e).market_type; return !mt || mt === "winner"; }) ?? list[0];
    const m = fixtureMeta(main);
    const opts = main.options.map((o) => ({ ...o, price: Number(o.price) })).filter((o) => !/^draw$/i.test(o.label));
    const fav = opts.length ? [...opts].sort((a, b) => b.price - a.price)[0] : null;
    const totals = list.filter((e) => fixtureMeta(e).market_type === "total").sort((a, b) => Math.abs((fixtureMeta(a).line ?? 0) - 2.5) - Math.abs((fixtureMeta(b).line ?? 0) - 2.5));
    const tot = totals[0] ?? null;
    let line: Fixture["line"] = null;
    if (tot && tot.options.length) { const o = [...tot.options].map((x) => ({ ...x, price: Number(x.price) })).sort((a, b) => b.price - a.price)[0]; line = { label: `${o.label}`, price: o.price, kind: lineKind(fixtureMeta(tot)) }; }
    const winner = main.is_resolved ? main.options.find((o) => o.is_winner) ?? null : null;
    out.push({
      id: key, name: m.home && m.away ? `${m.home} vs ${m.away}` : main.name.split(" —")[0],
      sport: m.sport ?? "other", league: m.league ?? "", kickoff: m.kickoff_at ?? main.start_date, end: main.end_date,
      live: isFixtureLive(main, now), minute: m.minute ?? null, phase: m.phase ?? null, score: m.score ?? null,
      main, favourite: fav ? { label: fav.label, price: fav.price } : null, line,
      volume: list.reduce((s, e) => s + (Number(e.volume) || 0), 0),
      settled: !!main.is_resolved, favouriteWon: winner && fav ? winner.id === fav.id : null, draw: !!winner && /^draw$/i.test(winner.label),
    });
  }
  return out.sort((a, b) => Number(b.live) - Number(a.live) || (+new Date(a.kickoff ?? 0)) - (+new Date(b.kickoff ?? 0)));
};

export const kickoffShort = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) : "—";
export const kickoffLong = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) : "—";
export const liveLabel = (f: Fixture) => f.live ? `${f.minute != null ? `${f.minute}′` : f.phase ?? "Live"}${f.score ? ` · ${f.score}` : ""}` : kickoffShort(f.kickoff);
