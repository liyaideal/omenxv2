// ============================================================
// /arcade · Quick Play（BTC 30 秒合约 · 流式舞台）状态字典 previews。
// 铁律同 SP / TB 系列：只挂生产件（ArcadePage 的引擎 + 入口横幅），数据一律
// fixture 确定性注入——时钟冻结在 nowMs、指数序列由固定 LCG 生成、合约 / 路单 /
// 桌面 feed 全部写死、零网络（引擎 fixture 模式跳过 supabase 拉取；api 全部为桩）。
// ============================================================
import { useEffect, useRef } from "react";
import { mountArcade, type ArcadeApi, type ArcadeFixture } from "@/pages/arcade/arcadeEngine";
import { ARCADE_DESKTOP, ARCADE_MOBILE, ARCADE_OVERLAYS } from "@/pages/arcade/arcadeMarkup";
import { ArcadeEntryBanner, type ArcadeBannerFixture } from "@/components/lite/arcade/ArcadeEntryBanner";
import { ArcadeRunPoster } from "@/components/lite/arcade/ArcadeRunPoster";
import type { ArcadeCall, ArcadeFeedRow, ArcadeTick, RoadSlot } from "@/lib/arcade/arcadeCalls";
import { callPayout } from "@/lib/arcade/arcadeCalls";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import "@/pages/arcade/arcade.css";
import "@/pages/arcade/arcade-v2.css";

/* ---------- frozen fixtures ---------- */
const NOW = Date.UTC(2026, 9, 28, 7, 52, 17); // 2026-10-28 07:52:17Z
const iso = (t: number) => new Date(t).toISOString();

/** 1-second index ticks, deterministic LCG walk ending at NOW (valid, with the model quote) */
const ticksFx = (() => {
  const out: ArcadeTick[] = [];
  let x = 20261028,
    p = 80934.75;
  const rnd = () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
  for (let i = 90; i >= 0; i--) {
    p *= 1 + (rnd() - 0.5) * 0.00018;
    const t = NOW - i * 1000;
    out.push({ ts: iso(t), binance: p + 2.1, hyperliquid: p - 4.3, coinbase: p, usdt_usd: 0.99854, idx: p, valid: true, reason: null, p_up: 0.512 });
  }
  return out;
})();
const PX_AT = (t: number) => {
  let best = ticksFx[0];
  for (const k of ticksFx) if (new Date(k.ts).getTime() <= t) best = k;
  return best.idx!;
};

/** the table's road: 60 wall-clock slots before NOW with a fixed u/d sequence */
const ROAD_SEQ = "ud uu d uuu dd u d uuuu d uuuuuu u dd uu d u ddd u dd uuu d u udu".replace(/ /g, "");
const roadFx: RoadSlot[] = (() => {
  const cur = Math.floor(NOW / 30000) * 30000;
  return ROAD_SEQ.split("").map((c, i) => {
    const s = cur - (ROAD_SEQ.length - i) * 30000;
    return { slot_start: iso(s), open_idx: 80900, close_idx: c === "u" ? 80912 : 80888 };
  });
})();

const mkCall = (id: string, side: "up" | "down", gross: number, p: number, t0: number, status: ArcadeCall["status"] = "open", s1?: number): ArcadeCall => {
  const fee = Math.floor(gross * 3 + 0.5) / 100,
    net = gross - fee;
  const s0 = PX_AT(t0 + 1000);
  const pay = callPayout(gross, p);
  const won = status === "won";
  const commission = won ? Math.floor((pay - gross) * 5 + 0.5) / 100 : 0;
  return {
    id,
    user_id: "fixture-user",
    side,
    gross,
    fee,
    net,
    p,
    p_up: side === "up" ? p : 1 - p,
    win_payout: pay,
    quote_ts: iso(t0 - 300),
    quote_idx: s0,
    t0: iso(t0),
    t1: iso(t0 + 30000),
    s0,
    s1: status === "open" ? null : (s1 ?? PX_AT(t0 + 30000)),
    status,
    pnl: status === "open" ? null : won ? pay - commission - gross : status === "lost" ? -gross : 0,
    commission: won ? commission : null,
    cancel_fee: null,
    settled_at: status === "open" ? null : iso(t0 + 30600),
    created_at: iso(t0),
  };
};
const CALLS_LIVE: ArcadeCall[] = [
  mkCall("c1", "up", 25, 0.512, NOW - 27000),
  mkCall("c2", "up", 10, 0.511, NOW - 19000),
  mkCall("c3", "down", 50, 0.489, NOW - 16000),
  mkCall("c4", "up", 10, 0.512, NOW - 9000),
  mkCall("c5", "up", 5, 0.513, NOW - 4000),
  mkCall("c6", "down", 25, 0.488, NOW - 900),
  mkCall("d1", "up", 25, 0.51, NOW - 71000, "won"),
  mkCall("d2", "down", 10, 0.49, NOW - 64000, "lost"),
  mkCall("d3", "up", 50, 0.512, NOW - 58000, "won"),
];
const FEED: ArcadeFeedRow[] = [
  { id: "f1", who: "al***er", side: "up", gross: 25, p: 0.512, t0: iso(NOW - 22000), t1: iso(NOW + 8000), mine: false },
  { id: "f2", who: "kz***88", side: "down", gross: 100, p: 0.488, t0: iso(NOW - 14000), t1: iso(NOW + 16000), mine: false },
  { id: "f3", who: "sa***ra", side: "up", gross: 5, p: 0.511, t0: iso(NOW - 6000), t1: iso(NOW + 24000), mine: false },
  { id: "f4", who: "mi***to", side: "up", gross: 10, p: 0.513, t0: iso(NOW - 2000), t1: iso(NOW + 28000), mine: false },
];

const stubApi = (over: Partial<ArcadeApi> = {}): ArcadeApi => ({
  isMobile: false,
  userId: "fixture-user",
  requireAuth: () => {},
  getBalance: () => 6249.09,
  exit: () => {},
  deposit: () => {},
  transfer: () => {},
  username: "alex_carter",
  ...over,
});

const Cabinet = ({ mobile, fixture, width, height, after }: { mobile?: boolean; fixture: ArcadeFixture; width: number; height: number; /** runs once the engine is up — clicks the production controls to show an opened state */ after?: (root: HTMLElement) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    ensureArcadeFonts();
    root.innerHTML = ARCADE_OVERLAYS + (mobile ? ARCADE_MOBILE : ARCADE_DESKTOP);
    const un = mountArcade(root, stubApi({ isMobile: !!mobile }), { fixture });
    const t = after ? setTimeout(() => after(root), 250) : 0;
    return () => {
      clearTimeout(t);
      un();
      root.innerHTML = "";
    };
  }, [mobile, fixture, after]);
  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <div ref={ref} className={`arcade-root${mobile ? " is-m" : ""}`} style={mobile ? ({ "--arcade-top": "0px", height, transform: "translateZ(0)" } as React.CSSProperties) : { transform: "scale(.72)", transformOrigin: "0 0", width: 1440 }} />
    </div>
  );
};

const base = (over: Partial<ArcadeFixture> = {}): ArcadeFixture => ({ nowMs: NOW, ticks: ticksFx, calls: [], feed: FEED, road: roadFx, ack: true, ...over });

/* ---------- AR-1 desktop · first entry: the gate (once per account) ---------- */
const FX_GATE = base({ ack: false });
export const Ar1Preview = () => <Cabinet fixture={FX_GATE} width={1040} height={700} />;

/* ---------- AR-2 desktop · live: 6 open calls (one still cancellable), 3 settled, session +$ ---------- */
const FX_LIVE = base({ calls: CALLS_LIVE, session: { last: [true, false, true, true, false, true, true] } });
export const Ar2Preview = () => <Cabinet fixture={FX_LIVE} width={1040} height={700} />;

/* ---------- AR-3 desktop · table paused (index invalid) → the lynx runner ---------- */
const FX_PAUSED = base({
  ticks: ticksFx.map((t, i) => (i >= ticksFx.length - 4 ? { ...t, valid: false, idx: null, reason: "fewer than two sources", hyperliquid: null, coinbase: null, p_up: null } : t)),
  calls: CALLS_LIVE.slice(0, 3),
  state: { paused_reason: "index", breaker_until: null, worst_loss: 1240, open_calls: 3, open_stake: 85, updated_at: iso(NOW) },
});
export const Ar3Preview = () => <Cabinet fixture={FX_PAUSED} width={1040} height={700} />;

/* ---------- AR-4 mobile · nothing of mine on the table (TABLE strip) ---------- */
export const Ar4Preview = () => <Cabinet mobile fixture={base()} width={375} height={760} />;

/* ---------- AR-5 mobile · live with calls ---------- */
export const Ar5Preview = () => <Cabinet mobile fixture={FX_LIVE} width={375} height={760} />;

/* ---------- AR-7 desktop · nothing of mine open: TABLE tab, LAST SETTLED + Portfolio link, a cold streak ---------- */
const FX_TABLE = base({
  calls: [mkCall("e1", "up", 25, 0.51, NOW - 110000, "lost"), mkCall("e2", "down", 10, 0.49, NOW - 95000, "lost"), mkCall("e3", "up", 5, 0.512, NOW - 70000, "lost")],
  session: { last: [true, true, false, false, false] },
});
export const Ar7Preview = () => <Cabinet fixture={FX_TABLE} width={1040} height={700} />;

/* ---------- AR-8 desktop · the road note open + a tapped cell ---------- */
// a tapped cell un-highlights after 4 s and any tap closes the note, so the frame re-taps both every 3 s
const openNote = (root: HTMLElement) => {
  const tap = () => {
    (root.querySelector(".road .cell[data-i]:nth-last-child(6)") as HTMLElement | null)?.click();
    (root.querySelector("#roadI") as HTMLElement | null)?.click();
  };
  tap();
  const t = setInterval(() => (root.isConnected ? tap() : clearInterval(t)), 3000);
};
export const Ar8Preview = () => <Cabinet fixture={FX_LIVE} width={1040} height={700} after={openNote} />;

/* ---------- AR-9 desktop · RULES ---------- */
const openRules = (root: HTMLElement) => (root.querySelector("#rulesBtn") as HTMLElement | null)?.click();
export const Ar9Preview = () => <Cabinet fixture={base()} width={1040} height={700} after={openRules} />;

/* ---------- AR-10 mobile · ROAD & STATS drawer open · AR-11 mobile · the notice gate ---------- */
const openSheet = (root: HTMLElement) => (root.querySelector("#mPeek") as HTMLElement | null)?.click();
export const Ar10Preview = () => <Cabinet mobile fixture={FX_LIVE} width={375} height={760} after={openSheet} />;
export const Ar11Preview = () => <Cabinet mobile fixture={FX_GATE} width={375} height={760} />;

/* ---------- AR-6 · signed out, desktop + mobile: no balance, no Deposit / Transfer, one Sign in key ---------- */
const Guest = ({ mobile, width, height }: { mobile?: boolean; width: number; height: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    ensureArcadeFonts();
    root.innerHTML = ARCADE_OVERLAYS + (mobile ? ARCADE_MOBILE : ARCADE_DESKTOP);
    const un = mountArcade(root, stubApi({ isMobile: !!mobile, userId: null }), { fixture: base() });
    return () => {
      un();
      root.innerHTML = "";
    };
  }, [mobile]);
  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <div ref={ref} className={`arcade-root${mobile ? " is-m" : ""}`} style={mobile ? ({ "--arcade-top": "0px", height, transform: "translateZ(0)" } as React.CSSProperties) : { transform: "scale(.72)", transformOrigin: "0 0", width: 1440 }} />
    </div>
  );
};
export const Ar6Preview = () => <Guest width={1040} height={700} />;
export const Ar6MobilePreview = () => <Guest mobile width={375} height={760} />;

/* ---------- AB-1 / AB-2 entry banner, desktop + mobile (same index readout as the cabinet) ---------- */
const BANNER_TICK: ArcadeBannerFixture = { live: true, price: ticksFx[ticksFx.length - 1].idx!, open: ticksFx[ticksFx.length - 31].idx!, up: 51.2, pts: ticksFx.slice(-45).map((t) => t.idx!) };
const BANNER_OPENING: ArcadeBannerFixture = { live: false, price: 0, open: 0, up: 50, pts: [] };
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

/* ---------- AS-1 run poster · win / loss (the 400px card the Share key exports) ---------- */
const RUN_WIN = { pnl: 83.57, won: 7, lost: 3, bestRun: 4, biggestWin: 9.2, minutes: 23, calls: 10, stakeLine: "$5 each" };
const RUN_LOSS = { pnl: -21.4, won: 3, lost: 7, bestRun: 2, biggestWin: 4.6, minutes: 12, calls: 10, stakeLine: "$5 each" };
export const As1Preview = () => (
  <div className="flex flex-wrap gap-6 p-4">
    <ArcadeRunPoster run={RUN_WIN} username="alex_carter" referralCode="ALEX7K" />
    <ArcadeRunPoster run={RUN_LOSS} username="alex_carter" referralCode="ALEX7K" />
  </div>
);
