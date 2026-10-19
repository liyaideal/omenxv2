// ============================================================
// Quick Play (arcade) tables — what the roll job opens (roll_arcade_rounds):
// crypto 30s + 1m around the clock, US stocks 1m during the cash session.
// Mirror of the VALUES list in supabase/migrations/20261019120000_arcade_rounds.sql.
// ============================================================
import { supabase } from "@/integrations/supabase/client";
import type { ArcadeRoundRow } from "./arcadePath";

export type ArcadeKind = "crypto" | "stock";
export type ArcadeTf = "30s" | "1m";

export interface ArcadeAsset {
  symbol: string;
  name: string;
  kind: ArcadeKind;
  /** accent colour (asset dot / picker) */
  c: string;
  /** price unit used by the cents() curve + meter range ($ per "tick") */
  k: number;
}

export const ARCADE_ASSETS: Record<string, ArcadeAsset> = {
  BTC: { symbol: "BTC", name: "Bitcoin", kind: "crypto", c: "#f7931a", k: 1 },
  ETH: { symbol: "ETH", name: "Ethereum", kind: "crypto", c: "#8f93f8", k: 0.1 },
  SOL: { symbol: "SOL", name: "Solana", kind: "crypto", c: "#9945ff", k: 0.01 },
  AAPL: { symbol: "AAPL", name: "Apple", kind: "stock", c: "#8a93a6", k: 0.005 },
  NVDA: { symbol: "NVDA", name: "NVIDIA", kind: "stock", c: "#6fb92c", k: 0.004 },
  TSLA: { symbol: "TSLA", name: "Tesla", kind: "stock", c: "#e0413c", k: 0.006 },
  COIN: { symbol: "COIN", name: "Coinbase", kind: "stock", c: "#1652f0", k: 0.006 },
};
export const ARCADE_TFS: ArcadeTf[] = ["30s", "1m"];
export const tfSeconds = (tf: ArcadeTf) => (tf === "30s" ? 30 : 60);
export const isArcadeRoundId = (id: string) => id.startsWith("arcade-");

/* ---------- US cash session (ET) — same rule as public.us_session_open ---------- */
const ET = (d: Date) => {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);
  const g = (k: string) => p.find((x) => x.type === k)?.value ?? "";
  return { wd: g("weekday"), h: +g("hour") % 24, m: +g("minute") };
};
export const usSessionOpen = (d = new Date()) => {
  const e = ET(d);
  if (e.wd === "Sat" || e.wd === "Sun") return false;
  const t = e.h * 60 + e.m;
  return t >= 570 && t < 960;
};
export const nextUsSessionMs = () => {
  const now = Date.now();
  const e = ET(new Date(now));
  const t = e.h * 60 + e.m;
  const wk = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const wd = wk.indexOf(e.wd);
  let base = now - (t - 570) * 60000 - new Date(now).getSeconds() * 1000;
  let add = 0;
  if (t >= 570 || wd === 0 || wd === 6) {
    do add++;
    while ([0, 6].includes((wd + add) % 7));
    base += add * 86400000;
  }
  return base;
};
export const nextUsSessionText = () => {
  const at = nextUsSessionMs();
  const ms = at - Date.now();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const e = ET(new Date(at));
  return `${e.wd} 09:30 ET · in ${h ? h + "h " : ""}${m}m`;
};

/* ---------- rounds (public.arcade_rounds, RLS read-all) ---------- */
export interface ArcadeTableSnapshot {
  current: ArcadeRoundRow | null;
  next: ArcadeRoundRow | null;
  /** resolved rounds, oldest → newest, void rounds excluded */
  history: ArcadeRoundRow[];
}

export const fetchArcadeTable = async (symbol: string, tf: ArcadeTf, historyN = 60): Promise<ArcadeTableSnapshot> => {
  const nowIso = new Date().toISOString();
  // arcade_rounds is not in the generated Supabase types (table created by
  // migration 20261019120000 outside the Lovable type sync) — untyped client.
  const db = supabase as any;
  const [live, hist] = await Promise.all([
    db
      .from("arcade_rounds")
      .select("*")
      .eq("symbol", symbol)
      .eq("tf", tf)
      .gt("end_at", nowIso)
      .order("start_at", { ascending: true })
      .limit(3),
    db
      .from("arcade_rounds")
      .select("*")
      .eq("symbol", symbol)
      .eq("tf", tf)
      .not("winner", "is", null)
      .neq("winner", "void")
      .order("end_at", { ascending: false })
      .limit(historyN),
  ]);
  const rows = ((live.data || []) as ArcadeRoundRow[]).map(normalize);
  const now = Date.now();
  const current = rows.find((r) => new Date(r.start_at).getTime() <= now) || null;
  const next = rows.find((r) => new Date(r.start_at).getTime() > now) || null;
  const history = ((hist.data || []) as ArcadeRoundRow[]).map(normalize).reverse();
  return { current, next, history };
};

const normalize = (r: any): ArcadeRoundRow => ({
  ...r,
  open_price: Number(r.open_price),
  close_price: r.close_price == null ? null : Number(r.close_price),
  seed: Number(r.seed),
  steps: Number(r.steps),
  sigma: Number(r.sigma),
});
