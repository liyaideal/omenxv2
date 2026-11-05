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
import { ArcadeComboPoster } from "@/components/lite/arcade/ArcadeComboPoster";
import { ArcadeRunShareSheet } from "@/components/lite/arcade/ArcadeShareCard";
import type { ArcadeCall, ArcadeFeedRow, ArcadeTick, RoadSlot } from "@/lib/arcade/arcadeCalls";
import { callPayout } from "@/lib/arcade/arcadeCalls";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import { ARCADE_SESSION_NEW } from "@/lib/arcade/session";
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
// 63 results: a 24/7 table always has a full half hour behind it, so the 01 strip shows its real 60 (CPO 2026-11-04)
const ROAD_SEQ = "dd uuu d u d ddd uuu d uu d u ud uu d uuu dd u d uuuu d uuuuuu u dd uu d u ddd u dd uuu d u udu".replace(/ /g, "");
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
  { id: "f2", who: "kz***88", side: "down", gross: 50, p: 0.488, t0: iso(NOW - 14000), t1: iso(NOW + 16000), mine: false },
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
    // the preview document pads every frame 16 px; a phone cabinet is the whole 375 screen, so it cancels that
    // padding sideways instead of spilling 16 px past the frame's right edge (QA 2026-11-02)
    <div className="relative overflow-hidden" style={{ width, height, margin: mobile ? "0 -16px" : undefined }}>
      <div ref={ref} className={`arcade-root${mobile ? " is-m" : ""}`} style={mobile ? ({ "--arcade-top": "0px", height, transform: "translateZ(0)" } as React.CSSProperties) : { transform: "scale(.72)", transformOrigin: "0 0", width: 1440 }} />
    </div>
  );
};

const base = (over: Partial<ArcadeFixture> = {}): ArcadeFixture => ({ nowMs: NOW, ticks: ticksFx, calls: [], feed: FEED, road: roadFx, ack: true, ...over });

/* ---------- AR-1 desktop · first entry: the gate (once per account) ---------- */
const FX_GATE = base({ ack: false });
export const Ar1Preview = () => <Cabinet fixture={FX_GATE} width={1040} height={700} />;

/* ---------- AR-2 desktop · live: YOUR CALLS · Open (6, the newest just placed — no undo since 2026-11-04), 04 on its own plate,
   COMBO ×2 ("win 1 more → free $2 voucher"), voucher chip $4 / $10 ---------- */
const FX_LIVE = base({ calls: CALLS_LIVE, session: { last: [true, false, true, true, false, true, true] }, vouchersToday: 4 });
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

/* ---------- AR-7 desktop · played, nothing open: YOUR CALLS · Open empty ("No open calls"), three losses in a row — no LOST ×3, nothing shown ---------- */
const FX_TABLE = base({
  calls: [mkCall("e1", "up", 25, 0.51, NOW - 110000, "lost"), mkCall("e2", "down", 10, 0.49, NOW - 95000, "lost"), mkCall("e3", "up", 5, 0.512, NOW - 70000, "lost")],
  session: { last: [true, true, false, false, false] },
});
export const Ar7Preview = () => <Cabinet fixture={FX_TABLE} width={1040} height={700} />;

/* ---------- AR-8 desktop · the road note open + a tapped cell ---------- */
// AR-8: a tapped road cell shows what that 30 s did ("▲ Up +$12.00 · 07:49:00 – 07:49:30")
const tapCell = (root: HTMLElement) => (root.querySelector(".road .cell[data-i]:nth-last-child(6)") as HTMLElement | null)?.click();
export const Ar8Preview = () => <Cabinet fixture={FX_LIVE} width={1040} height={700} after={tapCell} />;
// AR-19: the Big road ⓘ opens the road note
const openNote = (root: HTMLElement) => (root.querySelector("#roadI") as HTMLElement | null)?.click();
export const Ar19Preview = () => <Cabinet fixture={FX_LIVE} width={1040} height={700} after={openNote} />;

/* ---------- AR-9 desktop · RULES ---------- */
const openRules = (root: HTMLElement) => (root.querySelector("#rulesBtn") as HTMLElement | null)?.click();
export const Ar9Preview = () => <Cabinet fixture={base()} width={1040} height={700} after={openRules} />;

/* ---------- AR-10 mobile · ROAD & STATS drawer open · AR-11 mobile · the notice gate ---------- */
const openSheet = (root: HTMLElement) => (root.querySelector("#mPeek") as HTMLElement | null)?.click();
export const Ar10Preview = () => <Cabinet mobile fixture={FX_LIVE} width={375} height={760} after={openSheet} />;
export const Ar11Preview = () => <Cabinet mobile fixture={FX_GATE} width={375} height={760} />;

/* ---------- AR-12 desktop · first visit, a key hovered: LIVE TABLE rail, the preview line shaded for UP ---------- */
export const Ar12Preview = () => <Cabinet fixture={base({ hover: "u" })} width={1040} height={700} />;

/* ---------- AR-13 desktop · YOUR CALLS · Settled tab (results, open → close, Portfolio link) ---------- */
const openSettled = (root: HTMLElement) => (root.querySelector('.tab[data-tab="settled"]') as HTMLElement | null)?.click();
const SETTLED = [
  mkCall("s1", "up", 5, 0.512, NOW - 160000, "won"),
  mkCall("s2", "down", 2, 0.488, NOW - 150000, "lost"),
  mkCall("s3", "up", 10, 0.51, NOW - 140000, "won"),
  mkCall("s4", "up", 25, 0.513, NOW - 130000, "lost"),
  mkCall("s5", "down", 50, 0.49, NOW - 120000, "won"),
  mkCall("s6", "up", 5, 0.511, NOW - 100000, "void"),
];
export const Ar13Preview = () => <Cabinet fixture={base({ calls: SETTLED, session: { last: [true, false, true, false, true] }, vouchersToday: 0 })} width={1040} height={700} after={openSettled} />;

/* ---------- AR-14 desktop · at the $500 cap: "Limit reached · …" on both keys, chips greyed, "↓ N more" under the list ---------- */
const CAP_CALLS: ArcadeCall[] = Array.from({ length: 18 }, (_, i) => mkCall("m" + i, i % 3 ? "up" : "down", i < 16 ? 25 : 50, 0.51, NOW - 28000 + i * 1500));
export const Ar14Preview = () => <Cabinet fixture={base({ calls: CAP_CALLS })} width={1040} height={700} />;

/* ---------- AR-15 desktop · ×3 COMBO: the $2 voucher drops (mega + "+$2 VOUCHER" flies to the chip), ⇪ SHARE in the HUD ---------- */
const WIN3 = [mkCall("w1", "up", 5, 0.51, NOW - 120000, "won"), mkCall("w2", "down", 5, 0.49, NOW - 90000, "won"), mkCall("w3", "up", 5, 0.51, NOW - 60000, "won")];
export const Ar15Preview = () => <Cabinet fixture={base({ calls: WIN3, session: { last: [false, true, true, true] }, vouchersToday: 2, comboEvent: "won" })} width={1040} height={700} />;

/* ---------- AR-16 desktop · ×5 UNSTOPPABLE with today's $10 already claimed ("vouchers maxed today · keep it going") ---------- */
export const Ar16Preview = () => <Cabinet fixture={base({ calls: WIN3, session: { last: [true, true, true, true, true] }, vouchersToday: 10 })} width={1040} height={700} />;

/* ---------- AR-17 mobile · combo HUD + ⇪, voucher chip by YOUR STAKE ---------- */
export const Ar17Preview = () => <Cabinet mobile fixture={base({ calls: WIN3, session: { last: [false, true, true, true] }, vouchersToday: 2, comboEvent: "won" })} width={375} height={760} />;

/* ---------- AR-18 mobile · an ⓘ note is a bottom sheet (TOTAL OPEN POSITIONS) ---------- */
const openTip = (root: HTMLElement) => (root.querySelector('.info[data-tip="inplay"]') as HTMLElement | null)?.click();
/* ---------- AR-24 mobile · the voucher meter at today's cap ---------- */
export const Ar24Preview = () => <Cabinet mobile fixture={base({ calls: WIN3, session: { last: [true, true, true, true, true] }, vouchersToday: 10 })} width={375} height={760} />;
/* ---------- AR-25 desktop / AR-26 mobile · the voucher meter while today's total is loading (first second after load / sign-in) ---------- */
export const Ar25Preview = () => <Cabinet fixture={base({ vouchersToday: 10, vouchersLoading: true })} width={1040} height={700} />;
export const Ar26Preview = () => <Cabinet mobile fixture={base({ vouchersToday: 10, vouchersLoading: true })} width={375} height={760} />;
export const Ar18Preview = () => <Cabinet mobile fixture={base()} width={375} height={760} after={openTip} />;

/* ---------- AR-20 … AR-23 · flag lane, a burst of 6 calls in 5 s (CPO 2026-11-02 option A,
   mock claude.ai/artifact/FFVTERd2KCS1cTfEiACpAA): one pole + pennant per call, one shared label ---------- */
const BURST_DT = [0, 900, 1800, 2900, 3800, 4900];
const BURST_SIDE: ("up" | "down")[] = ["up", "up", "down", "up", "up", "down"];
const BURST_LIVE: ArcadeCall[] = BURST_DT.map((d, i) => mkCall("b" + i, BURST_SIDE[i], 5, BURST_SIDE[i] === "up" ? 0.512 : 0.488, NOW - 7000 + d));
// mid-flip: four expired and flipped (✓ ✓ ✕ ✓), two still open → "✓3 ✕1 · ▲▼ 1s"
const BURST_FLIP: ArcadeCall[] = BURST_DT.map((d, i) => mkCall("b" + i, BURST_SIDE[i], 5, BURST_SIDE[i] === "up" ? 0.512 : 0.488, NOW - 33600 + d, i < 4 ? (i === 2 ? "lost" : "won") : "open"));
export const Ar20Preview = () => <Cabinet fixture={base({ calls: BURST_LIVE })} width={1040} height={700} />;
export const Ar21Preview = () => <Cabinet fixture={base({ calls: BURST_FLIP })} width={1040} height={700} />;
export const Ar22Preview = () => <Cabinet mobile fixture={base({ calls: BURST_LIVE })} width={375} height={760} />;
export const Ar23Preview = () => <Cabinet mobile fixture={base({ calls: BURST_FLIP })} width={375} height={760} />;

/* ---------- AR-27 … AR-67 · the states the pre-handoff read found no frame for (CPO 2026-11-05) ----------
   Every held state goes through a fixture prop the engine only reads in fixture mode (deny / toast / checking /
   offline / authLoading / poolEmpty / lynx) — production behaviour is untouched. */
const pausedFx = (reason: "full" | "off" | "breaker" | "loss" | "loss_hour" | "index") =>
  base({
    ticks: reason === "index" ? FX_PAUSED.ticks : ticksFx,
    calls: CALLS_LIVE.slice(0, 3),
    state: { paused_reason: reason, breaker_until: reason === "breaker" ? iso(NOW + 4000) : null, worst_loss: 1240, open_calls: 3, open_stake: 85, updated_at: iso(NOW) },
  });
/* item 10 · no answer 5 s after the tap: the newest chip stays, row "checking…", key note "Checking your call…" */
const FX_CHECKING = base({ calls: CALLS_LIVE, checking: true });
export const Ar27Preview = () => <Cabinet fixture={FX_CHECKING} width={1040} height={700} />;
export const Ar28Preview = () => <Cabinet mobile fixture={FX_CHECKING} width={375} height={760} />;
/* item 10.6 · not found after 15 s: the chip came back, "Didn't go through · nothing was charged" (red, 3 s live) */
const FX_NOT_PLACED = base({ calls: CALLS_LIVE.slice(0, 5), deny: { side: "d", msg: "Didn’t go through · nothing was charged" } });
export const Ar29Preview = () => <Cabinet fixture={FX_NOT_PLACED} width={1040} height={700} />;
export const Ar30Preview = () => <Cabinet mobile fixture={FX_NOT_PLACED} width={375} height={760} />;
/* item 11 · this browser is offline: CONNECTION LOST / OFFLINE mask, keys off, sources not red, lynx runs */
const FX_OFFLINE = base({ calls: CALLS_LIVE.slice(0, 3), offline: true });
export const Ar31Preview = () => <Cabinet fixture={FX_OFFLINE} width={1040} height={700} />;
export const Ar32Preview = () => <Cabinet mobile fixture={FX_OFFLINE} width={375} height={760} />;
/* item 12 · the sign-in state is still being read: balance —, no Deposit / Sign in key, meter loading, no gate */
const FX_AUTH = base({ authLoading: true });
export const Ar33Preview = () => <Cabinet fixture={FX_AUTH} width={1040} height={700} />;
export const Ar34Preview = () => <Cabinet mobile fixture={FX_AUTH} width={375} height={760} />;
/* item 5 · today's site-wide $2 pool is empty before this account's $10: the meter says so, COMBO still counts */
const FX_POOL = base({ calls: WIN3, session: { last: [false, true, true, true] }, vouchersToday: 4, poolEmpty: true });
export const Ar35Preview = () => <Cabinet fixture={FX_POOL} width={1040} height={700} />;
export const Ar36Preview = () => <Cabinet mobile fixture={FX_POOL} width={375} height={760} />;
/* warming up · the index is valid but the model has no quote yet (first minute after a restart) */
const FX_WARM = base({ ticks: ticksFx.map((t, i) => (i >= ticksFx.length - 3 ? { ...t, p_up: null } : t)) });
export const Ar37Preview = () => <Cabinet fixture={FX_WARM} width={1040} height={700} />;
export const Ar38Preview = () => <Cabinet mobile fixture={FX_WARM} width={375} height={760} />;
/* the server said no · three refusals the key shows for 1.8 s (held here) */
const denyFx = (msg: string) => base({ calls: CALLS_LIVE.slice(0, 2), deny: { side: "u", msg } });
const FX_MOVED = denyFx("Price moved · tap again");
const FX_FUNDS = denyFx("Not enough in your spot account");
const FX_FAST = denyFx("Too fast · 2 calls per second");
export const Ar39Preview = () => <Cabinet fixture={FX_MOVED} width={1040} height={700} />;
export const Ar40Preview = () => <Cabinet mobile fixture={FX_MOVED} width={375} height={760} />;
export const Ar41Preview = () => <Cabinet fixture={FX_FUNDS} width={1040} height={700} />;
export const Ar42Preview = () => <Cabinet mobile fixture={FX_FUNDS} width={375} height={760} />;
export const Ar43Preview = () => <Cabinet fixture={FX_FAST} width={1040} height={700} />;
export const Ar44Preview = () => <Cabinet mobile fixture={FX_FAST} width={375} height={760} />;
/* the table's own pauses · full / closed / breaker / daily loss (AR-3 is the index one) + the phone's index pause */
const FX_FULL = pausedFx("full"),
  FX_OFF = pausedFx("off"),
  FX_BREAKER = pausedFx("breaker"),
  FX_LOSS = pausedFx("loss"),
  FX_LOSS_HOUR = pausedFx("loss_hour");
export const Ar45Preview = () => <Cabinet fixture={FX_FULL} width={1040} height={700} />;
export const Ar46Preview = () => <Cabinet mobile fixture={FX_FULL} width={375} height={760} />;
export const Ar47Preview = () => <Cabinet fixture={FX_OFF} width={1040} height={700} />;
export const Ar48Preview = () => <Cabinet mobile fixture={FX_OFF} width={375} height={760} />;
export const Ar49Preview = () => <Cabinet fixture={FX_BREAKER} width={1040} height={700} />;
export const Ar50Preview = () => <Cabinet mobile fixture={FX_BREAKER} width={375} height={760} />;
export const Ar51Preview = () => <Cabinet fixture={FX_LOSS} width={1040} height={700} />;
export const Ar52Preview = () => <Cabinet mobile fixture={FX_LOSS} width={375} height={760} />;
export const Ar53Preview = () => <Cabinet mobile fixture={FX_PAUSED} width={375} height={760} />;
/* the 60-minute rolling loss limit (CPO 2026-11-05): back within the hour, not tomorrow */
export const Ar68Preview = () => <Cabinet fixture={FX_LOSS_HOUR} width={1040} height={700} />;
export const Ar69Preview = () => <Cabinet mobile fixture={FX_LOSS_HOUR} width={375} height={760} />;
/* a new session · the first call after 30 quiet minutes: boards reset, the "New session" toast (2.2 s live) */
const FX_NEWSES = base({ calls: CALLS_LIVE.slice(5), toast: ARCADE_SESSION_NEW });
export const Ar54Preview = () => <Cabinet fixture={FX_NEWSES} width={1040} height={700} />;
export const Ar55Preview = () => <Cabinet mobile fixture={FX_NEWSES} width={375} height={760} />;
/* one call flipping · won / lost / void: the row, the chart mark, the +$ / −$ / VOID float, 04 updated */
const flipFx = (status: "won" | "lost" | "void") => base({ calls: [mkCall("f1", "up", 10, 0.512, NOW - 30800, status)], session: { last: status === "won" ? [true] : status === "lost" ? [false] : [] } });
const FX_FLIP_WON = flipFx("won"),
  FX_FLIP_LOST = flipFx("lost"),
  FX_FLIP_VOID = flipFx("void");
export const Ar56Preview = () => <Cabinet fixture={FX_FLIP_WON} width={1040} height={700} />;
export const Ar57Preview = () => <Cabinet mobile fixture={FX_FLIP_WON} width={375} height={760} />;
export const Ar58Preview = () => <Cabinet fixture={FX_FLIP_LOST} width={1040} height={700} />;
export const Ar59Preview = () => <Cabinet mobile fixture={FX_FLIP_LOST} width={375} height={760} />;
export const Ar60Preview = () => <Cabinet fixture={FX_FLIP_VOID} width={1040} height={700} />;
export const Ar61Preview = () => <Cabinet mobile fixture={FX_FLIP_VOID} width={375} height={760} />;
/* ×8 LEGENDARY · the top combo tier (×3 ON FIRE · ×5 UNSTOPPABLE · ×8 LEGENDARY) */
const WIN8 = Array.from({ length: 8 }, (_, i) => mkCall("l" + i, i % 2 ? "down" : "up", 5, i % 2 ? 0.49 : 0.51, NOW - 300000 + i * 32000, "won"));
const FX_LEGEND = base({ calls: WIN8, session: { last: [true, true, true, true, true, true, true, true] }, vouchersToday: 4, comboEvent: "won" });
export const Ar62Preview = () => <Cabinet fixture={FX_LEGEND} width={1040} height={700} />;
export const Ar63Preview = () => <Cabinet mobile fixture={FX_LEGEND} width={375} height={760} />;
/* the lynx's moods (desktop window) · DRAGON ×N sign / choppy… sign / "new here?" hint / asleep after 60 s */
export const Ar64Preview = () => <Cabinet fixture={base({ lynx: "dragon" })} width={1040} height={700} />;
export const Ar65Preview = () => <Cabinet fixture={base({ lynx: "choppy" })} width={1040} height={700} />;
export const Ar66Preview = () => <Cabinet fixture={base({ lynx: "new" })} width={1040} height={700} />;
export const Ar67Preview = () => <Cabinet fixture={base({ lynx: "nap" })} width={1040} height={700} />;

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
    // the preview document pads every frame 16 px; a phone cabinet is the whole 375 screen, so it cancels that
    // padding sideways instead of spilling 16 px past the frame's right edge (QA 2026-11-02)
    <div className="relative overflow-hidden" style={{ width, height, margin: mobile ? "0 -16px" : undefined }}>
      <div ref={ref} className={`arcade-root${mobile ? " is-m" : ""}`} style={mobile ? ({ "--arcade-top": "0px", height, transform: "translateZ(0)" } as React.CSSProperties) : { transform: "scale(.72)", transformOrigin: "0 0", width: 1440 }} />
    </div>
  );
};
export const Ar6Preview = () => <Guest width={1040} height={700} />;
export const Ar6MobilePreview = () => <Guest mobile width={375} height={760} />;

/* ---------- AB-1 / AB-2 entry banner, desktop + mobile (same index readout as the cabinet) ---------- */
const BANNER_TICK: ArcadeBannerFixture = { live: true, price: ticksFx[ticksFx.length - 1].idx!, open: ticksFx[ticksFx.length - 31].idx!, up: 51.2, pts: ticksFx.slice(-45).map((t) => t.idx!) };
const BANNER_OPENING: ArcadeBannerFixture = { live: false, reason: "index", price: 0, open: 0, up: 50, pts: [] };
// B3 (2026-11-05): the red line names the reason — one strip per reason, same frozen readout
const BANNER_OFF = (["off", "full", "breaker", "loss", "loss_hour", "offline"] as const).map((reason): ArcadeBannerFixture => ({ ...BANNER_TICK, live: false, reason }));
// banners follow the frame's width like the Events container does (a fixed 1120 px wrapper clipped PLAY, QA 2026-11-02)
export const Ab1Preview = () => (
  <div className="space-y-4">
    <ArcadeEntryBanner isMobile={false} fixture={BANNER_TICK} />
    <ArcadeEntryBanner isMobile={false} fixture={BANNER_OPENING} />
    {BANNER_OFF.map((f) => (
      <ArcadeEntryBanner key={f.reason} isMobile={false} fixture={f} />
    ))}
  </div>
);
export const Ab2Preview = () => (
  <div className="space-y-4">
    <ArcadeEntryBanner isMobile fixture={BANNER_TICK} />
    <ArcadeEntryBanner isMobile fixture={BANNER_OPENING} />
    {BANNER_OFF.map((f) => (
      <ArcadeEntryBanner key={f.reason} isMobile fixture={f} />
    ))}
  </div>
);

/* ---------- AS-1 run poster · win / loss (the 400px card the Share key exports) ---------- */
const RUN_WIN = { pnl: 83.57, won: 7, lost: 3, bestRun: 4, biggestWin: 9.2, minutes: 23, calls: 10, stakeLine: "$5 each" };
const RUN_LOSS = { pnl: -21.4, won: 3, lost: 7, bestRun: 2, biggestWin: 4.6, minutes: 12, calls: 10, stakeLine: "$5 each" };
/* ---------- AS-2 combo poster (interim — the designer's B / E poster replaces it) ---------- */
export const As2Preview = () => (
  <div className="flex flex-wrap gap-6 p-4">
    <ArcadeComboPoster combo={{ n: 3, pnl: 13.92, stake: 15, biggestWin: 4.71 }} username="alex_carter" referralCode="ALEX7K" />
    <ArcadeComboPoster combo={{ n: 8, pnl: 37.12, stake: 40, biggestWin: 4.9 }} username="alex_carter" referralCode="ALEX7K" />
  </div>
);
const ALEX_AVATAR = "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=aneka&backgroundColor=ffdfbf";
// the longest amount a 30-minute session can plausibly show — the big number steps down so it never runs under the lynx
const RUN_BIG = { pnl: 1234.56, won: 41, lost: 12, bestRun: 9, biggestWin: 48.5, minutes: 30, calls: 53, stakeLine: "$25 – $50" };
const Fonts = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => ensureArcadeFonts(), []);
  return <>{children}</>;
};
export const As1Preview = () => (
  <Fonts>
    <div className="flex flex-wrap gap-6 p-4">
      <ArcadeRunPoster run={RUN_WIN} username="alex_carter" avatarUrl={ALEX_AVATAR} referralCode="ALEX7K" />
      <ArcadeRunPoster run={RUN_LOSS} username="alex_carter" avatarUrl={ALEX_AVATAR} referralCode="ALEX7K" />
      <ArcadeRunPoster run={RUN_BIG} username="alex_carter" avatarUrl={ALEX_AVATAR} referralCode="ALEX7K" />
    </div>
  </Fonts>
);
/* ---------- AS-3 / AS-4 · the share sheet open (Figma 1283:1437 desktop · 1283:1841 / 1283:2110 phone) ----------
   presentational mount: isDataReady=false keeps html-to-image off; one sheet per frame (it portals to the frame's body) */
const Sheet = ({ run }: { run: typeof RUN_WIN }) => (
  <Fonts>
    <ArcadeRunShareSheet run={run} username="alex_carter" avatarUrl={ALEX_AVATAR} referralCode="ALEX7K" isDataReady={false} onClose={() => {}} />
  </Fonts>
);
export const As3WinPreview = () => <Sheet run={RUN_WIN} />;
export const As3LosePreview = () => <Sheet run={RUN_LOSS} />;
export const As4WinPreview = () => <Sheet run={RUN_WIN} />;
export const As4LosePreview = () => <Sheet run={RUN_LOSS} />;
