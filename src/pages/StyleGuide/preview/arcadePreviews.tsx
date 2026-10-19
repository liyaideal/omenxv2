// ============================================================
// /arcade · Quick Play（30s / 1m Up/Down · 机柜皮肤）状态字典 previews。
// 铁律同 SP / TB 系列：只挂生产件（ArcadePage 的引擎 + 入口横幅），数据一律
// fixture 确定性注入——时钟冻结在 nowMs、轮次种子固定、路单序列固定、零网络
// （引擎 fixture 模式跳过 supabase 拉取；api 全部为桩）。
// ============================================================
import { useEffect, useRef } from "react";
import { mountArcade, type ArcadeApi, type ArcadeFixture } from "@/pages/arcade/arcadeEngine";
import { ARCADE_DESKTOP, ARCADE_MOBILE, ARCADE_OVERLAYS } from "@/pages/arcade/arcadeMarkup";
import { ArcadeEntryBanner, type ArcadeBannerFixture } from "@/components/lite/arcade/ArcadeEntryBanner";
import { arcadePath, type ArcadeRoundRow } from "@/lib/arcade/arcadePath";
import type { ArcadeTableSnapshot } from "@/lib/arcade/arcadeTables";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import "@/pages/arcade/arcade.css";

/* ---------- frozen fixtures ---------- */
const T0 = Date.UTC(2026, 9, 19, 3, 51, 0); // 2026-10-19 03:51:00Z — a BTC 30s round start
const mkRound = (symbol: string, tf: "30s" | "1m", startMs: number, open: number, seed: number, winner: "up" | "down" | null = null): ArcadeRoundRow => {
  const secs = tf === "30s" ? 30 : 60;
  const kind = symbol === "BTC" || symbol === "ETH" || symbol === "SOL" ? "crypto" : "stock";
  const r: ArcadeRoundRow = {
    id: `arcade-${symbol.toLowerCase()}-${tf}-fixture-${startMs}`,
    symbol,
    kind,
    tf,
    start_at: new Date(startMs).toISOString(),
    end_at: new Date(startMs + secs * 1000).toISOString(),
    open_price: open,
    close_price: null,
    seed,
    steps: secs * 4,
    sigma: kind === "stock" ? 0.00022 : 0.00045,
    winner,
  };
  if (winner) r.close_price = arcadePath(seed, open, r.steps, r.sigma)[r.steps];
  return r;
};
/** 36 settled rounds before T0 with a fixed u/d sequence (the seed is irrelevant for history: winner is stored) */
const HIST_SEQ = "ud uu d uuu dd u d uuuu d uuuuuu u dd uu d u ddd u dd uuu d u".replace(/ /g, "");
const history = (symbol: string, tf: "30s" | "1m") => {
  const secs = tf === "30s" ? 30 : 60;
  return HIST_SEQ.split("").map((c, i) => mkRound(symbol, tf, T0 - (HIST_SEQ.length - i) * secs * 1000, 66400 + i * 3, 1000 + i, c === "u" ? "up" : "down"));
};
const SNAP_BTC_30S: ArcadeTableSnapshot = {
  current: mkRound("BTC", "30s", T0, 66474.49, 2177009297),
  next: mkRound("BTC", "30s", T0 + 30000, 66474.49, 843266656),
  history: history("BTC", "30s"),
};
const SNAP_AAPL_1M: ArcadeTableSnapshot = {
  current: mkRound("AAPL", "1m", T0, 235.22, 333751864),
  next: null,
  history: history("AAPL", "1m").slice(-12),
};

const stubApi = (over: Partial<ArcadeApi> = {}): ArcadeApi => ({
  isMobile: false,
  userId: "fixture-user",
  requireAuth: () => {},
  getBalance: () => 7879.07,
  buy: async () => ({ balanceDelta: 0 }),
  sell: async () => ({ balanceDelta: 0 }),
  loadHolding: async () => null,
  loadToday: async () => ({ net: -24.82, won: 0, lost: 1, last: [{ s: "u", w: false, pnl: -24.82, t: T0 - 30000 }] }),
  referralLink: "https://omenxv2.lovable.app?ref=75CN66",
  username: "alex_carter",
  avatarUrl: null,
  ...over,
});

const Cabinet = ({ mobile, symbol, tf, fixture, api, elapsedMs, width, height }: { mobile?: boolean; symbol: string; tf: "30s" | "1m"; fixture: ArcadeTableSnapshot; api?: Partial<ArcadeApi>; elapsedMs: number; width: number; height: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    ensureArcadeFonts();
    root.innerHTML = ARCADE_OVERLAYS + (mobile ? ARCADE_MOBILE : ARCADE_DESKTOP);
    const fx: ArcadeFixture = { nowMs: T0 + elapsedMs, snapshot: fixture };
    const un = mountArcade(root, stubApi({ isMobile: !!mobile, ...api }), { symbol, tf, fixture: fx });
    return () => {
      un();
      root.innerHTML = "";
    };
  }, [mobile, symbol, tf, fixture, api, elapsedMs]);
  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <div ref={ref} className={`arcade-root${mobile ? " is-m" : ""}`} style={mobile ? ({ "--arcade-top": "0px", height } as React.CSSProperties) : { transform: "scale(.72)", transformOrigin: "0 0", width: 1440 }} />
    </div>
  );
};

/* ---------- AR-1 desktop · idle, 9 s into a BTC 30s round ---------- */
export const Ar1Preview = () => <Cabinet symbol="BTC" tf="30s" fixture={SNAP_BTC_30S} elapsedMs={9000} width={1040} height={640} />;

/* ---------- AR-2 desktop · holding Up, 21 s in ---------- */
const HOLD = { loadHolding: async () => ({ side: "u" as const, sh: 146, margin: 24.82, avg: 0.17, chips: [25] }) };
export const Ar2Preview = () => <Cabinet symbol="BTC" tf="30s" fixture={SNAP_BTC_30S} api={HOLD} elapsedMs={21000} width={1040} height={640} />;

/* ---------- AR-3 desktop · stock table (AAPL 1m) — session gate renders from the wall clock of the viewer ---------- */
export const Ar3Preview = () => <Cabinet symbol="AAPL" tf="1m" fixture={SNAP_AAPL_1M} elapsedMs={15000} width={1040} height={640} />;

/* ---------- AR-4 mobile · idle ---------- */
export const Ar4Preview = () => <Cabinet mobile symbol="BTC" tf="30s" fixture={SNAP_BTC_30S} elapsedMs={9000} width={375} height={760} />;

/* ---------- AB-1 / AB-2 entry banner, desktop + mobile ---------- */
const BANNER_TICK: ArcadeBannerFixture = (() => {
  const r = SNAP_BTC_30S.current!;
  const path = arcadePath(r.seed, r.open_price, r.steps, r.sigma);
  const i = 36;
  return { round: r, price: path[i], open: r.open_price, secLeft: 21, up: 58, pts: path.slice(0, i + 1) };
})();
const BANNER_OPENING: ArcadeBannerFixture = { round: null, price: 0, open: 0, secLeft: 0, up: 50, pts: [] };
export const Ab1Preview = () => (
  <div className="p-4" style={{ width: 1120 }}>
    <ArcadeEntryBanner isMobile={false} fixture={BANNER_TICK} />
    <ArcadeEntryBanner isMobile={false} fixture={BANNER_OPENING} />
  </div>
);
export const Ab2Preview = () => (
  <div className="p-4" style={{ width: 375 }}>
    <ArcadeEntryBanner isMobile fixture={BANNER_TICK} />
    <ArcadeEntryBanner isMobile fixture={BANNER_OPENING} />
  </div>
);
