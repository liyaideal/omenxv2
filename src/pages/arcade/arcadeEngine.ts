/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Quick Play v2 engine — the "stream stage" cabinet controller.
// Mock (spec): claude.ai/artifact/6AmwMxsb3aNDUgVDZ8epWJ v26 · CPO 2026-10-28.
// Shell: the designer's cabinet (artifact BKHuHJvFkzeLXQxLWBHxSF).
//
// Every chip is its own 30-second contract on the real three-exchange BTC
// index (supabase/migrations/20261028120000_arcade_calls.sql):
//   • the stage is a time axis: −45 s of index … now … +30 s; each call is an
//     entry diamond + open-price dash line + a flag in the lane at its t1;
//     at t1 the flag flips ✓/✕, a +$/−$ floats, the chip flies to the balance,
//     and a ✓/✕ badge stays at (t1, S1) until it scrolls off
//   • feedback has three levels: per call (flag · float · fly), per second
//     (one balance bump), per event (combo ×3 → coins / confetti + mega,
//     lost ×3 → red flash). Keys never lock.
//   • right rail: MY CALLS (open rows, 2-second cancel, ahead/behind) and
//     TABLE (everyone's open calls, anonymised); SETTLED under it
//   • road strip: the table's own road — 30 s wall-clock cells of the index
//   • first-entry gate (once per account) + RULES modal + ⓘ how-to
//   • the lynx: mood follows the session, reads the road, sleeps when idle,
//     and runs a Chrome-dino game in the space window while the table pauses
//
// Why a DOM controller and not React components: see v1 — a game screen with
// canvases, particles, a mascot and a 1 Hz data loop. Data seams go through
// `api` (React) and `opts.data` (network or style-guide fixture).
//
// James feedback round (CPO 2026-11-02, mock claude.ai/artifact/1hCirCctvs2VNkP2J5bUfC v17c):
//   the chart is about YOUR calls only — white price line, real-clock ticks, a right-hand
//   price scale with tags, a preview line ("if you call now · settles here") when nothing is
//   open or a key is hovered; colour = direction, never win/lose; UNDO key (2 s) instead of
//   the ring; chips land in the stack at once; LIVE TABLE until the first call; combo tiers
//   with a $2 Position Voucher every 3 wins in a row (server: arcade_combo_vouchers).
//
// Clock: everything runs on SERVER time (arcade_table_now().now − Date.now()
// gives the offset) so t0 / t1 / tick timestamps line up with the chart.
// ============================================================
import {
  ARCADE_CHIPS_V2,
  ARCADE_CANCEL_MS,
  ARCADE_DURATION_MS,
  ARCADE_MAX_OPEN,
  acceptTerms,
  callCredit,
  callFee,
  callNetWin,
  callPayout,
  cancelCall,
  cancelFee,
  fetchMyCalls,
  fetchRoad,
  fetchTableFeed,
  fetchTableNow,
  fetchTicks,
  fetchTicksAfter,
  feeText,
  placeCall,
  roadCells,
  settleMine,
  type ArcadeCall,
  type ArcadeFeedRow,
  type ArcadeTableNow,
  type ArcadeTick,
  type RoadCell,
  type RoadSlot,
} from "@/lib/arcade/arcadeCalls";
import { ARCADE_SESSION_GAP_MS, ARCADE_SESSION_NEW, ARCADE_SESSION_NOTE } from "@/lib/arcade/session";
import { roadSlotInfo, type RoadSlotInfo } from "@/lib/arcade/arcadeCalls";
import { spriteUrls } from "@/lib/arcade/sprites";

export type Side = "u" | "d";

/** data seams — the real module by default, a fixture in the style guide */
export interface ArcadeData {
  tableNow: () => Promise<ArcadeTableNow>;
  ticks: (seconds: number) => Promise<ArcadeTick[]>;
  ticksAfter: (afterTs: string) => Promise<ArcadeTick[]>;
  road: (slots: number) => Promise<RoadSlot[]>;
  place: (side: "up" | "down", gross: number, quoteTs: string) => Promise<ArcadeCall & { balance: number }>;
  cancel: (id: string) => Promise<{ cancel_fee: number; balance: number }>;
  settleMine: () => Promise<{ id: string; status: string; pnl: number; s0: number | null; s1: number | null }[]>;
  myCalls: (since: string | null, limit?: number) => Promise<ArcadeCall[]>;
  feed: () => Promise<ArcadeFeedRow[]>;
  acceptTerms: () => Promise<string>;
}

export const realData: ArcadeData = {
  tableNow: fetchTableNow,
  ticks: fetchTicks,
  ticksAfter: fetchTicksAfter,
  road: fetchRoad,
  place: placeCall,
  cancel: cancelCall,
  settleMine,
  myCalls: (since, limit) => fetchMyCalls(since, limit),
  feed: fetchTableFeed,
  acceptTerms,
};

/** style-guide stand-in: nothing leaves the page */
const previewData: ArcadeData = {
  tableNow: async () => ({ tick: null, state: null, params: {}, now: new Date().toISOString(), my_open: 0, ack: null, combo_today: 0 }),
  ticks: async () => [],
  ticksAfter: async () => [],
  road: async () => [],
  place: async () => {
    throw new Error("Preview only · play it on /arcade");
  },
  cancel: async () => {
    throw new Error("Preview only");
  },
  settleMine: async () => [],
  myCalls: async () => [],
  feed: async () => [],
  acceptTerms: async () => new Date().toISOString(),
};

export interface ArcadeApi {
  isMobile: boolean;
  userId: string | null;
  requireAuth: () => void;
  getBalance: () => number;
  /** React refreshes the profile after the server moved money */
  onBalance?: (balance: number) => void;
  exit: () => void;
  deposit: () => void;
  transfer: () => void;
  /** "All settled calls → Portfolio" at the bottom of the rail */
  portfolio?: () => void;
  /** 04 / YOUR RESULT · Share key → the page opens the run poster (CPO 2026-10-28) */
  share?: (run: ArcadeRunShare) => void;
  /** combo HUD · ⇪ SHARE → the combo poster (CPO 2026-11-02); nothing pops up on its own */
  shareCombo?: (combo: ArcadeComboShare) => void;
  /** the voucher chip on 03 → Rewards › Position Vouchers */
  vouchers?: () => void;
  username: string;
}

/** What the combo poster says: the run of wins that is on right now */
export interface ArcadeComboShare {
  /** wins in a row */
  n: number;
  /** net profit of those wins, commission already taken */
  pnl: number;
  /** chips staked on those wins */
  stake: number;
  /** largest single net win in the run */
  biggestWin: number;
}

/** What the share poster says about this run (this session of the cabinet, settled calls only) */
export interface ArcadeRunShare {
  /** net profit of the run, commission already taken */
  pnl: number;
  won: number;
  lost: number;
  /** longest winning streak this run */
  bestRun: number;
  /** largest single net win this run */
  biggestWin: number;
  /** minutes since the cabinet was opened, at least 1 */
  minutes: number;
  /** settled calls this run (won + lost) */
  calls: number;
  /** "$5 each" when every chip was the same size, otherwise "$80 staked" */
  stakeLine: string;
}

/** style-guide: a frozen moment with no network */
export interface ArcadeFixture {
  nowMs: number;
  ticks: ArcadeTick[];
  calls: ArcadeCall[];
  feed?: ArcadeFeedRow[];
  road?: RoadSlot[];
  state?: ArcadeTableNow["state"];
  ack?: boolean;
  /** pre-baked session numbers so the boards and combo have something to show */
  session?: { last: boolean[] };
  /** USD of combo vouchers already dropped today (the voucher chip on 03) */
  vouchersToday?: number;
  /** a key is hovered (desktop): the chart shades the winning side of the preview line */
  hover?: Side;
  /** replay the combo effects of the last settled win (the ×3 voucher drop) once the frame is up */
  comboEvent?: "won";
}

export interface ArcadeMountOptions {
  data?: ArcadeData;
  fixture?: ArcadeFixture;
}

/* ---------- local call model ---------- */
interface Call {
  id: string;
  side: Side;
  gross: number;
  p: number;
  t0: number; // server ms
  t1: number;
  s0: number | null;
  s1: number | null;
  pay: number; // win payout before commission
  status: "pending" | "open" | "settling" | "won" | "lost" | "void" | "cancelled";
  pnl: number;
  tDone?: number;
  settledAt?: number;
  cancelWanted?: boolean;
  /** server ms when the result is revealed: t1 + 0.5–1.2 s, the mock's settle beat */
  revealAt?: number;
}

const C = { up: "#33d6ff", dn: "#cfff4a", cy: "#05d7ed", hot: "#ff5c5c" };
/** the $500 cap, said once in the key note and the toast (James #15) */
const LIMIT_TEXT = `Limit reached · $${ARCADE_MAX_OPEN} in play · room frees up as your calls settle`;
/** ⓘ notes (header, phone header) */
const TIPS: Record<string, string> = {
  inplay: `You can have up to $${ARCADE_MAX_OPEN} in open calls at once. Room frees up as your calls settle.`,
  idx: "The BTC Index turns the live BTC prices from Binance, Hyperliquid and Coinbase into one price, updated every second. Every call opens and settles on it, so a glitch on any single exchange can't swing your result.",
};
const money = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (n: number) => (n < 0 ? "−" : "+") + money(n);
const whole = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
const cents = (p: number) => (p * 100).toFixed(1) + "¢";
const clip = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const SIDE = (x: Side) => (x === "u" ? "Up" : "Down");
const sideOf = (s: "up" | "down"): Side => (s === "up" ? "u" : "d");
/** Postgres "2026-10-28 07:43:57.28+00" and ISO both parse everywhere once normalised */
const ms = (iso: string) => new Date(iso.replace(" ", "T").replace(/\+00$/, "Z")).getTime();

/** server row → local call */
const fromRow = (r: ArcadeCall): Call => ({
  id: r.id,
  side: sideOf(r.side),
  gross: r.gross,
  p: r.p,
  t0: ms(r.t0),
  t1: ms(r.t1),
  s0: r.s0,
  s1: r.s1,
  pay: r.win_payout,
  status: r.status === "open" ? "open" : r.status,
  pnl: r.pnl ?? 0,
  settledAt: r.settled_at ? ms(r.settled_at) : undefined,
});

export function mountArcade(root: HTMLElement, api: ArcadeApi, opts: ArcadeMountOptions = {}): () => void {
  const $ = (q: string) => root.querySelector(q) as any;
  const $$ = (q: string) => Array.from(root.querySelectorAll(q)) as any[];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FX = opts.fixture;
  const data: ArcadeData = opts.data || (FX ? previewData : realData);
  const mobile = api.isMobile;
  const disposers: (() => void)[] = [];
  const on = (el: any, ev: string, fn: any, o?: any) => {
    if (!el) return;
    el.addEventListener(ev, fn, o);
    disposers.push(() => el.removeEventListener(ev, fn, o));
  };
  const timers: any[] = [];
  const every = (fn: () => void, msv: number) => {
    if (FX) return;
    timers.push(setInterval(fn, msv));
  };
  let alive = true;
  const raf = (fn: (t: number) => void) => {
    const loop = (t: number) => {
      if (!alive) return;
      fn(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  /* server clock */
  let off = 0; // server − client
  const now = () => (FX ? FX.nowMs : Date.now() + off);
  const perf = () => performance.now();

  /* ---------- state ---------- */
  const S: any = {
    px: [] as { t: number; p: number }[], // valid ticks (server ms)
    lastTs: null as string | null,
    tick: null as ArcadeTick | null,
    pUp: null as number | null,
    quoteTs: null as string | null,
    paused: null as string | null, // index | breaker | loss | full | off | null
    price: 0,
    disp: 0,
    lastPx: 0,
    live: [] as { t: number; p: number }[],
    liveP: 0,
    basis: 0,
    /** where the basis is heading — eased in the frame loop so a 2 s index step glides instead of stair-stepping */
    basisT: 0,
    /** latest Binance mid seen over the WebSocket (what the live line is drawn from) */
    wsMid: 0,
    histInfo: [] as RoadSlotInfo[],
    /** polls in a row that saw no accepted notice — the gate waits for two (the first after sign-in can race the token) */
    noAck: 0,
    bal: api.getBalance(),
    chip: 5,
    calls: [] as Call[],
    done: [] as Call[],
    bursts: [] as any[],
    feed: [] as ArcadeFeedRow[],
    roadRows: [] as RoadSlot[],
    hist: [] as RoadCell[],
    slotStart: 0,
    slotOpen: null as number | null,
    ses: 0,
    won: 0,
    lost: 0,
    last: [] as boolean[],
    streakW: 0,
    streakL: 0,
    bestRun: 0,
    bigWin: 0,
    sesStakes: [] as number[],
    sesStart: now(),
    /** when the last call went down — 30 min without one closes the session (CPO 2026-10-29) */
    lastCallAt: 0,
    ack: null as string | null,
    ackKnown: false,
    sessionStart: new Date(now()).toISOString(),
    busy: 0,
    params: {} as Record<string, number | null>,
    /** a call went down this session → the rail shows YOUR CALLS instead of the LIVE TABLE */
    played: false,
    /** the key under the mouse (desktop) → the chart shades that side of the preview line */
    hover: null as Side | null,
    /** combo vouchers today (USD), from arcade_table_now().combo_today; a fresh drop holds until perf ms vHold */
    vToday: 0,
    vHold: 0,
    /** the run of wins on right now: profit, stake, biggest win (the combo poster) */
    runPnl: 0,
    runStake: 0,
    runBig: 0,
  };
  const myOpen = () => S.calls.filter((c: Call) => c.status === "open" || c.status === "pending" || c.status === "settling");
  const openStake = () => myOpen().reduce((a: number, c: Call) => a + c.gross, 0);
  const nextT1 = () => Math.min(...myOpen().map((c: Call) => c.t1));
  const maxAge = () => Number(S.params?.tick_max_age_ms) || 4000;
  const liveQuote = () => !!(S.tick && S.tick.valid && S.pUp != null && now() - ms(S.tick.ts) < maxAge());
  /** combo voucher rules live in arcade_params (combo_voucher_every / _face / _cap_day) */
  const vEvery = () => Number(S.params?.combo_voucher_every) || 3;
  const vFace = () => Number(S.params?.combo_voucher_face) || 2;
  const vCap = () => Number(S.params?.combo_voucher_cap_day) || 10;
  /** YOUR CALLS replaces the LIVE TABLE from the first call until the session ends (30 min without a call) */
  const mineView = () => S.played && !(myOpen().length === 0 && S.lastCallAt && now() - S.lastCallAt > ARCADE_SESSION_GAP_MS);
  const hhmm = (t: number) => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  /* ---------- audio (designer's tones) ---------- */
  let AC: AudioContext | null = null;
  const audio = () => {
    if (!AC) {
      try {
        AC = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        /* no audio */
      }
    }
    return AC;
  };
  let MUTED = false;
  try {
    MUTED = localStorage.getItem("omx-mute") === "1";
  } catch (e) {
    /* private mode */
  }
  function tone(f: number, d = 0.08, type: OscillatorType = "square", v = 0.06, slide = 0, delay = 0) {
    if (MUTED || FX) return;
    const a = audio();
    if (!a) return;
    const t = a.currentTime + delay,
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  const sfx = {
    click: () => tone(1200, 0.04, "square", 0.04, 0.6),
    key: () => {
      tone(320, 0.05, "square", 0.05, 0.5);
      tone(1600, 0.02, "square", 0.03, 1, 0.02);
    },
    chip: () => {
      tone(2200, 0.03, "triangle", 0.07);
      tone(3100, 0.05, "triangle", 0.05, 1, 0.025);
    },
    bet: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.09, "square", 0.05, 1, i * 0.045)),
    deny: () => {
      tone(180, 0.12, "sawtooth", 0.07);
      tone(140, 0.16, "sawtooth", 0.07, 1, 0.1);
    },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.1, "square", 0.04, 1, i * 0.05)),
    big: () => {
      [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.14, "square", 0.05, 1, i * 0.07));
      for (let i = 0; i < 14; i++) tone(2400 + Math.random() * 1800, 0.05, "triangle", 0.03, 1, 0.5 + i * 0.05);
    },
    lose: () => tone(330, 0.25, "sawtooth", 0.04, 0.5),
    cold: () => {
      tone(440, 0.5, "sawtooth", 0.06, 0.25);
      tone(330, 0.6, "square", 0.04, 0.3, 0.12);
    },
    jump: () => tone(600, 0.08, "square", 0.04, 2),
    crash: () => tone(200, 0.3, "sawtooth", 0.06, 0.3),
  };

  /* ---------- fx: particles / coins / flash / toast ---------- */
  const SPR = { coin0: "/arcade/coin0.png", coin1: "/arcade/coin1.png" };
  const coinImg = { b: new Image(), l: new Image() };
  coinImg.b.src = SPR.coin0;
  coinImg.l.src = SPR.coin1;
  const fx = $("#fx"),
    fctx = fx.getContext("2d");
  let P: any[] = [];
  function sizeFx() {
    const d = devicePixelRatio || 1;
    fx.width = innerWidth * d;
    fx.height = innerHeight * d;
    fctx.setTransform(d, 0, 0, d, 0, 0);
  }
  sizeFx();
  on(window, "resize", sizeFx);
  function burst(x: number, y: number, col: string, n = 36, coin = false) {
    if (RM) n = Math.min(n, 8);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 3 + Math.random() * 9;
      P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, g: 0.35, life: 1, decay: 0.012 + Math.random() * 0.02, col, r: coin ? 11 + Math.random() * 7 : 3 + Math.random() * 3, coin, img: col === C.dn ? coinImg.l : coinImg.b, rot: Math.random() * 6, vr: 0.2 + Math.random() * 0.3 });
    }
  }
  function rain(col: string, n = 90) {
    for (let i = 0; i < (RM ? 10 : n); i++)
      P.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 4, g: 0.18, life: 1, decay: 0.006, col, r: 12 + Math.random() * 10, coin: true, img: Math.random() < 0.6 ? (col === C.dn ? coinImg.l : coinImg.b) : col === C.dn ? coinImg.b : coinImg.l, rot: Math.random() * 6, vr: 0.12 + Math.random() * 0.2 });
  }
  raf(() => {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    P = P.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of P) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.life -= p.decay;
      p.rot += p.vr;
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      if (p.coin) {
        const w = Math.max(2, Math.abs(Math.cos(p.rot)) * p.r * 2),
          h = p.r * 2;
        fctx.imageSmoothingEnabled = false;
        if (p.img.complete && p.img.naturalWidth) fctx.drawImage(p.img, Math.round(p.x - w / 2), Math.round(p.y - h / 2), Math.round(w), Math.round(h));
      } else {
        fctx.fillStyle = p.col;
        fctx.fillRect(Math.round(p.x), Math.round(p.y), p.r | 0, p.r | 0);
      }
    }
    fctx.globalAlpha = 1;
  });
  const flashEl = $("#flash");
  function flash(col: string) {
    flashEl.style.background = `radial-gradient(circle,${col},transparent 70%)`;
    flashEl.classList.remove("go");
    void flashEl.offsetWidth;
    flashEl.classList.add("go");
  }
  function center(el: any) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  let toastT: any;
  function toast(m: string, bad?: boolean) {
    const t = $("#toast");
    t.textContent = m;
    t.className = "v2toast" + (bad ? " bad" : "");
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), 2200);
  }
  // signed out there is no balance to paint — the strip shows a dash (renderAuth)
  const eqEls = () => (api.userId ? $$("#equity") : []);
  function bumpEq() {
    eqEls().forEach((e) => {
      e.textContent = money(S.bal);
      e.classList.remove("bump");
      void e.offsetWidth;
      e.classList.add("bump");
    });
  }
  function setBal(v: number) {
    S.bal = v;
    bumpEq();
    api.onBalance?.(v);
  }

  /* ---------- money math (研发稿 2.2, mirrored in arcadeCalls.ts) ---------- */
  const fee = callFee,
    payout = callPayout,
    netWin = callNetWin;

  /* ---------- the table's road (30 s wall-clock cells) ---------- */
  const SLOT = 30000;
  function rebuildRoad() {
    S.hist = roadCells(S.roadRows, 120, now());
    S.histInfo = roadSlotInfo(S.roadRows, 120, now());
  }
  const clockOf = (t: number) => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };
  function buildRoad(h: RoadCell[]) {
    const cells: any[] = [],
      occ = new Set<string>();
    let head = -1,
      c = 0,
      r = 0,
      prev: any = null,
      turned = false;
    h.forEach((x, i) => {
      if (x !== prev) {
        head += 1;
        c = head;
        r = 0;
        turned = false;
        prev = x;
        while (occ.has(c + ",0")) {
          c += 1;
          head = c;
        }
      } else if (!turned && r < 5 && !occ.has(c + "," + (r + 1))) {
        r += 1;
      } else {
        turned = true;
        c += 1;
      }
      occ.add(c + "," + r);
      cells.push({ i, s: x, c, r });
    });
    return { cells, cols: cells.length ? cells[cells.length - 1].c + 1 : 0 };
  }
  function renderRoads(newest?: boolean) {
    const hist: RoadCell[] = S.hist,
      n = hist.length;
    const tOf = (i: number) => (S.histInfo[i] ? (S.histInfo[i] as RoadSlotInfo).t : 0);
    for (const pre of ["", "m_"]) {
      const b = $("#" + pre + "bead");
      if (!b) continue;
      // desktop: a 6-column bead plate; the phone sheet card fills its width
      const colsB = pre ? Math.max(6, Math.floor((b.clientWidth + 2) / 11)) : 6;
      const from = Math.max(0, Math.ceil((n + 1) / 6) - colsB) * 6;
      b.innerHTML = hist.slice(from).map((x, i) => `<span class="bead ${x}${newest && from + i === n - 1 ? " pop" : ""}" data-i="${from + i}"></span>`).join("") + '<span class="bead ghost"></span>';
      const bn = $("#" + pre + "beadN");
      if (bn) bn.textContent = String(n - from);
      const bx = $("#" + pre + "bax0");
      if (bx) bx.textContent = n && tOf(from) ? "← " + hhmm(tOf(from)) : "←";
      const rd = $("#" + pre + "road"),
        { cells, cols } = buildRoad(hist);
      const fit = Math.max(6, Math.floor((rd.clientWidth + 2) / 11)),
        first = Math.max(0, cols - fit);
      const vis = cells.filter((q) => q.c >= first);
      rd.innerHTML = vis.map((q) => `<span class="cell ${q.s}${newest && q.i === n - 1 ? " pop" : ""}" data-i="${q.i}" style="grid-column:${q.c - first + 1};grid-row:${q.r + 1}"></span>`).join("");
      const ax = $("#" + pre + "rax0");
      if (ax) {
        const i0 = vis.length ? Math.min(...vis.map((q) => q.i)) : 0;
        ax.textContent = vis.length && tOf(i0) ? "← " + hhmm(tOf(i0)) : "←";
      }
      // LAST 30 MIN = the last 60 cells
      const h60 = hist.slice(-60);
      const nu = h60.filter((x) => x === "u").length;
      $("#" + pre + "nUp").textContent = String(nu);
      $("#" + pre + "nDn").textContent = String(h60.length - nu);
      const bar = $("#" + pre + "rsBar");
      if (bar) bar.style.width = (h60.length ? (nu / h60.length) * 100 : 50) + "%";
      let best = { s: "u", n: 0 },
        cur = { s: hist[0], n: 0 };
      for (const x of hist) {
        cur = cur.s === x ? { s: x, n: cur.n + 1 } : { s: x, n: 1 };
        if (cur.n > best.n) best = { ...cur };
      }
      const lg = $("#" + pre + "longest");
      if (lg) {
        lg.textContent = n ? (best.s === "u" ? "▲ Up" : "▼ Down") + " ×" + best.n : "—";
        lg.style.color = n ? (best.s === "u" ? "var(--up)" : "var(--lime)") : "";
      }
    }
    const pk = $("#mPeekRoad");
    if (pk) {
      const h = hist.slice(-10).map((x) => `<i class="${x}"></i>`).join("");
      if (pk.innerHTML !== h) pk.innerHTML = h;
    }
    const say = $("#mSay");
    if (say) {
      const t = roadSay();
      if (say.innerHTML !== t) say.innerHTML = t;
    }
  }
  /** the lynx in the phone sheet says what the road is doing, in words */
  function roadSay(): string {
    const hist: RoadCell[] = S.hist;
    if (!hist.length) return "";
    let run = 1;
    for (let i = hist.length - 1; i > 0 && hist[i] === hist[i - 1]; i--) run++;
    let alt = 1;
    for (let i = hist.length - 1; i > 0 && hist[i] !== hist[i - 1]; i--) alt++;
    const dir = hist[hist.length - 1] === "u" ? '<b class="cu">▲ Up</b>' : '<b class="cd">▼ Down</b>';
    if (run >= 4) return `${dir} ${run} boxes in a row — a streak is running.`;
    if (alt >= 5) return `Flip-flopping for ${alt} boxes — no clear direction.`;
    const h = hist.slice(-20),
      u = h.filter((x) => x === "u").length;
    if (u >= 13) return `Mostly <b class="cu">▲ Up</b> lately — ${u} of the last ${h.length} boxes.`;
    if (h.length - u >= 13) return `Mostly <b class="cd">▼ Down</b> lately — ${h.length - u} of the last ${h.length} boxes.`;
    return `Mixed — ${u} up, ${h.length - u} down in the last ${h.length} boxes.`;
  }
  function slotLoop() {
    const w = now();
    const cur = Math.floor(w / SLOT) * SLOT;
    if (cur !== S.slotStart) {
      S.slotStart = cur;
      S.slotOpen = null;
      if (!FX) void loadRoad(true);
    }
    if (S.slotOpen == null && S.price) {
      const first = S.px.find((x: any) => x.t >= cur);
      S.slotOpen = first ? first.p : S.price; // first index of the slot
    }
    const up = S.slotOpen == null || S.price >= S.slotOpen;
    const mv = S.slotOpen != null && S.price ? `<b class="${up ? "cu" : "cd"}">${up ? "▲ +$" : "▼ −$"}${Math.abs(S.price - S.slotOpen).toFixed(2)}</b>` : "<b>—</b>";
    const html = `Now ${mv} · ${Math.max(0, Math.ceil((cur + SLOT - w) / 1000))}s left`;
    for (const pre of ["", "m_"]) {
      const e = $("#" + pre + "slotLbl");
      if (e && e.innerHTML !== html) e.innerHTML = html;
      const pg = $("#" + pre + "slotProg");
      if (pg) {
        pg.style.width = Math.min(100, ((w - cur) / SLOT) * 100) + "%";
        pg.className = up ? "cu" : "cd";
      }
    }
  }
  async function loadRoad(newest?: boolean) {
    try {
      S.roadRows = await data.road(120);
      rebuildRoad();
      renderRoads(newest);
      if (newest) Lx.readRoad();
    } catch (e) {
      /* keep the last road */
    }
  }

  /* ---------- placing ---------- */
  let tmpId = 0;
  const keyOf = (side: Side) => $(side === "u" ? "#btnU" : "#btnD");
  function deny(side: Side, msg: string) {
    const k = keyOf(side);
    k.classList.remove("deny");
    void k.offsetWidth;
    k.classList.add("deny");
    sfx.deny();
    setPays(side, msg, true);
  }
  async function place(side: Side) {
    audio();
    if (!api.userId) {
      sfx.key();
      api.requireAuth();
      return;
    }
    if (S.ackKnown && !S.ack) {
      openGate(true);
      return;
    }
    if (S.paused) {
      deny(side, S.paused === "full" ? "Table full · room opens as calls settle" : "Table paused");
      return;
    }
    if (!liveQuote()) {
      deny(side, "No price right now · try again in a second");
      return;
    }
    const stake = openStake();
    if (stake + S.chip > ARCADE_MAX_OPEN) {
      deny(side, LIMIT_TEXT);
      toast(LIMIT_TEXT, true);
      return;
    }
    if (S.chip > S.bal + 1e-9) {
      deny(side, "Not enough in your spot account");
      return;
    }
    if (S.lastCallAt && now() - S.lastCallAt > ARCADE_SESSION_GAP_MS) newSession();
    S.lastCallAt = now();
    S.played = true;
    const p = side === "u" ? S.pUp : 1 - S.pUp,
      g = S.chip,
      t0 = now();
    const c: Call = { id: "tmp" + ++tmpId, side, gross: g, p, t0, t1: t0 + ARCADE_DURATION_MS, s0: null, s1: null, pay: payout(g, p), status: "pending", pnl: 0 };
    S.calls.push(c);
    setBal(S.bal - g);
    sfx.bet();
    Lx.react("bet");
    const k = keyOf(side),
      ctr = center(k);
    burst(ctr.x, ctr.y, side === "u" ? C.up : C.dn, 14);
    tapFloat(side, g);
    render();
    try {
      const row = await data.place(side === "u" ? "up" : "down", g, S.quoteTs!);
      const real = fromRow(row);
      Object.assign(c, { id: real.id, t0: real.t0, t1: real.t1, p: real.p, pay: real.pay, status: "open" });
      armSettle(c);
      if (typeof row.balance === "number") {
        S.bal = row.balance;
        api.onBalance?.(row.balance);
        eqEls().forEach((e) => (e.textContent = money(S.bal)));
      }
      if (c.cancelWanted) void cancel(c);
    } catch (e: any) {
      S.calls = S.calls.filter((x: Call) => x !== c);
      setBal(S.bal + g);
      const m = String(e?.message || "Could not place that");
      if (/Price moved/i.test(m)) flashCents();
      deny(side, m);
      if (/Accept the rules/i.test(m)) openGate(true);
    }
    render();
  }
  async function cancel(c: Call) {
    if (c.status !== "open" && c.status !== "pending") return;
    if (now() - c.t0 > ARCADE_CANCEL_MS - 150) return;
    if (c.id.startsWith("tmp")) {
      c.cancelWanted = true; // the accept is still in flight: cancel as soon as it lands
      sfx.click();
      return;
    }
    audio();
    sfx.click();
    try {
      const r = await data.cancel(c.id);
      c.status = "cancelled";
      c.tDone = now();
      S.bal = r.balance;
      bumpEq();
      api.onBalance?.(r.balance);
      toast(`Cancelled · ${feeText(r.cancel_fee)} close fee`);
    } catch (e: any) {
      toast(String(e?.message || "Could not cancel"), true);
    }
    render();
  }

  /** "+$5 ▲" pops above the key on every tap — each chip is seen landing (James #9) */
  function tapFloat(side: Side, g: number) {
    const k = keyOf(side);
    if (!k) return;
    const r = k.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const f = document.createElement("span");
    f.className = "tapf";
    f.textContent = "+" + whole(g) + (side === "u" ? " ▲" : " ▼");
    f.style.left = r.left + r.width / 2 + "px";
    f.style.top = r.top + 8 + "px";
    root.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  /* ---------- settling ---------- */
  let settleT: any = 0,
    settleTries = 0;
  function scheduleSettle(delay: number) {
    if (FX) return;
    clearTimeout(settleT);
    settleT = setTimeout(runSettle, delay);
  }
  async function runSettle() {
    settleT = 0;
    if (!api.userId) return;
    try {
      const res = await data.settleMine();
      for (const r of res) {
        const c = S.calls.find((x: Call) => x.id === r.id);
        if (c && (c.status === "open" || c.status === "settling")) reveal(c, r.status as any, r.pnl, r.s0, r.s1);
      }
    } catch (e) {
      /* retry below */
    }
    // the server's own sweep (every second) may have settled them first — then settleMine returns nothing for
    // them; read them back instead of waiting for the 15 s reconcile
    if (S.calls.some((c: Call) => c.status === "settling" && !(c as any).held)) await reconcile();
    const due = S.calls.filter((c: Call) => c.status === "settling" && !(c as any).held);
    if (due.length && settleTries++ < 25) scheduleSettle(300);
    else settleTries = 0;
  }
  /** at t1 sharp (not on the next 250 ms tick): the flag turns "…" and the server is asked right away */
  function armSettle(c: Call) {
    if (FX) return;
    timers.push(
      setTimeout(() => {
        if (c.status !== "open") return;
        c.status = "settling";
        c.revealAt = c.t1 + 500 + Math.random() * 700;
        render();
        if (!settleT) scheduleSettle(0);
      }, Math.max(0, c.t1 - now() + 20)),
    );
  }
  /** The flag shows "…" for 0.5–1.2 s after t1, then flips — the approved mock's beat (CPO 2026-11-02 "跟 mock 一样").
      A result that arrives earlier is held until then; one that arrives later shows at once. */
  function reveal(c: Call, status: "won" | "lost" | "void", pnl: number, s0: number | null, s1: number | null) {
    const at = c.revealAt ?? c.t1 + 500 + Math.random() * 700;
    const wait = at - now();
    if (wait <= 0 || FX) return applySettled(c, status, pnl, s0, s1);
    (c as any).held = true;
    timers.push(
      setTimeout(() => {
        (c as any).held = false;
        if (c.status === "settling" || c.status === "open") applySettled(c, status, pnl, s0, s1);
      }, wait),
    );
  }
  /** Thirty minutes without a call closes the sitting: 04 / YOUR RESULT starts over (CPO 2026-10-29). */
  function newSession() {
    S.ses = 0;
    S.won = 0;
    S.lost = 0;
    S.last = [];
    S.streakW = 0;
    S.streakL = 0;
    S.bestRun = 0;
    S.bigWin = 0;
    S.sesStakes = [];
    S.done = [];
    S.played = false;
    S.runPnl = 0;
    S.runStake = 0;
    S.runBig = 0;
    S.sesStart = now();
    S.sessionStart = new Date(now()).toISOString();
    $$(".combo").forEach((el) => {
      el.className = "combo";
      const sub = el.querySelector(".sub");
      if (sub) sub.textContent = "";
    });
    toast(ARCADE_SESSION_NEW);
    render();
  }

  /** Rebuild 04 / YOUR RESULT from the calls of the current sitting (same 30-minute rule as the server). */
  function restoreSession(hist: ArcadeCall[]) {
    const asc = hist.slice().sort((a, b) => ms(a.created_at) - ms(b.created_at));
    if (!asc.length || now() - ms(asc[asc.length - 1].created_at) > ARCADE_SESSION_GAP_MS) return;
    let i = asc.length - 1;
    while (i > 0 && ms(asc[i].created_at) - ms(asc[i - 1].created_at) <= ARCADE_SESSION_GAP_MS) i--;
    const ses = asc.slice(i);
    S.lastCallAt = ms(ses[ses.length - 1].created_at);
    S.played = true;
    S.sesStart = ms(ses[0].created_at);
    S.sessionStart = ses[0].created_at;
    ses.forEach((r) => {
      const c = fromRow(r);
      if (S.calls.find((x: Call) => x.id === c.id) || S.done.find((x: Call) => x.id === c.id)) return;
      if (c.status === "open") S.calls.push(c);
      else if (c.status !== "cancelled") S.done.push(c);
    });
    const settled = ses.filter((r) => r.status === "won" || r.status === "lost");
    S.ses = settled.reduce((a, r) => a + (r.pnl ?? 0), 0);
    S.won = settled.filter((r) => r.status === "won").length;
    S.lost = settled.length - S.won;
    S.last = settled.slice(-10).map((r) => r.status === "won");
    S.sesStakes = settled.map((r) => r.gross);
    S.bigWin = settled.reduce((a, r) => (r.status === "won" ? Math.max(a, r.pnl ?? 0) : a), 0);
    let w = 0,
      l = 0;
    for (let k = settled.length - 1; k >= 0; k--) {
      if (settled[k].status === "won") {
        if (l) break;
        w++;
      } else {
        if (w) break;
        l++;
      }
    }
    S.streakW = w;
    S.streakL = l;
    const runRows = w ? settled.slice(-w) : [];
    S.runPnl = runRows.reduce((a, r) => a + (r.pnl ?? 0), 0);
    S.runStake = runRows.reduce((a, r) => a + r.gross, 0);
    S.runBig = runRows.reduce((a, r) => Math.max(a, r.pnl ?? 0), 0);
    let run = 0;
    settled.forEach((r) => {
      run = r.status === "won" ? run + 1 : 0;
      S.bestRun = Math.max(S.bestRun, run);
    });
    if (w >= 2) comboUpdate("boot");
  }

  function applySettled(c: Call, status: "won" | "lost" | "void", pnl: number, s0: number | null, s1: number | null) {
    c.status = status;
    c.pnl = pnl;
    c.s0 = s0 ?? c.s0;
    c.s1 = s1;
    c.tDone = now();
    c.settledAt = now();
    const won = status === "won";
    if (status !== "void") {
      S.ses += pnl;
      if (won) S.won++;
      else S.lost++;
      S.last.push(won);
      if (S.last.length > 10) S.last.shift();
      if (won) {
        S.streakW++;
        S.streakL = 0;
        if (S.streakW === 1) {
          S.runPnl = 0;
          S.runStake = 0;
          S.runBig = 0;
        }
        S.runPnl += pnl;
        S.runStake += c.gross;
        S.runBig = Math.max(S.runBig, pnl);
      } else {
        S.streakL++;
        S.streakW = 0;
      }
      S.bestRun = Math.max(S.bestRun, S.streakW);
      if (won) S.bigWin = Math.max(S.bigWin, pnl);
      S.sesStakes.push(c.gross);
    }
    if (won) S.bal += c.pay - Math.round((c.pay - c.gross) * 5) / 100;
    else if (status === "void") S.bal += c.gross;
    flagFloat(c);
    flyChip(c);
    if (!coalesce) coalesce = setTimeout(() => {
      coalesce = 0;
      bumpEq();
      api.onBalance?.(S.bal);
    }, 60);
    if (won) sfx.win();
    else if (status === "lost") sfx.lose();
    comboUpdate(status);
    Lx.react(won ? "win" : status === "lost" ? "lose" : "bet");
    S.done.unshift(c);
    if (S.done.length > 30) S.done.pop();
    S.bursts.push({ t: perf(), c });
    render();
  }
  let coalesce: any = 0;
  function loop() {
    const t = now();
    S.calls = S.calls.filter((c: Call) => !(c.tDone && c.t1 < t - 46000) && !(c.status === "cancelled" && t - c.tDone! > 1500));
    S.bursts = S.bursts.filter((b: any) => perf() - b.t < 900);
    let due = false;
    for (const c of S.calls) {
      // S0 = the first valid index after the server accepted the chip (the server re-derives it at settlement)
      if (c.s0 == null && c.status === "open") {
        const first = S.px.find((x: any) => x.t > c.t0);
        if (first) c.s0 = first.p;
      }
      if (c.status === "open" && t >= c.t1) {
        c.status = "settling";
        c.revealAt = c.t1 + 500 + Math.random() * 700;
        due = true;
      }
    }
    if (due && !settleT) scheduleSettle(0);
  }
  /** reconcile with the server every few seconds: cron settlements, other tabs, reloads */
  async function reconcile() {
    if (!api.userId) return;
    try {
      const rows = await data.myCalls(S.sessionStart);
      for (const r of rows) {
        const loc = S.calls.find((x: Call) => x.id === r.id);
        const real = fromRow(r);
        if (!loc) {
          if (real.status === "open") S.calls.push(real);
          else if (!S.done.find((x: Call) => x.id === r.id) && real.settledAt && now() - real.settledAt < 120000) {
            // settled while we were away: count it, no fireworks
            real.tDone = now();
            S.done.unshift(real);
            if (real.status !== "void" && real.status !== "cancelled") {
              S.ses += real.pnl;
              if (real.status === "won") S.won++;
              else S.lost++;
              if (real.status === "won") S.bigWin = Math.max(S.bigWin, real.pnl);
              S.sesStakes.push(real.gross);
            }
          }
        } else if ((loc.status === "open" || loc.status === "settling") && !(loc as any).held && (real.status === "won" || real.status === "lost" || real.status === "void")) {
          reveal(loc, real.status, real.pnl, real.s0, real.s1);
        } else if (loc.status === "open" && real.status === "cancelled") {
          loc.status = "cancelled";
          loc.tDone = now();
        } else if (loc.status === "open" && real.s0 != null && loc.s0 == null) loc.s0 = real.s0;
      }
      S.done.sort((a: Call, b: Call) => (b.settledAt || 0) - (a.settledAt || 0));
      if (S.done.length > 30) S.done.length = 30;
    } catch (e) {
      /* next time */
    }
  }

  /* ---------- combo HUD ----------
     COMBO ×N from 2 wins in a row; every vEvery()-th win drops a $2 Position Voucher (server-side,
     arcade_combo_vouchers; max $10 a UTC day). The HUD says how far the next voucher is; tiers
     ×3 ON FIRE · ×5 UNSTOPPABLE · ×8 LEGENDARY punch harder. A loss ends the combo quietly —
     no COMBO BREAK, no LOST ×N (James #16 / #17). */
  const comboWord = (n: number) => (n >= 8 ? "legendary" : n >= 5 ? "unstoppable" : n >= 3 ? "on fire" : "");
  const comboTier = (n: number) => (n >= 8 ? 4 : n >= 5 ? 3 : n >= 3 ? 2 : 1);
  const isMega = (n: number) => n % vEvery() === 0 || n === 5 || n === 8;
  function comboUpdate(status: string) {
    if (status === "void") return;
    const n = S.streakW >= 2 ? S.streakW : 0;
    const face = vFace();
    let dropped = false;
    if (status === "won" && n && n % vEvery() === 0 && S.vToday + face <= vCap() + 1e-9) {
      // the server issues it on the same settlement; hold the optimistic total until its poll catches up
      S.vToday += face;
      S.vHold = perf() + 8000;
      dropped = true;
    }
    const left = vEvery() - (n % vEvery());
    const sub = !n
      ? ""
      : dropped
        ? `you got a ${whole(face)} voucher!`
        : S.vToday + face > vCap() + 1e-9
          ? "vouchers maxed today · keep it going"
          : `win ${left} more → free ${whole(face)} voucher`;
    $$(".combo").forEach((el) => {
      const big = el.querySelector(".big"),
        sb = el.querySelector(".sub");
      if (!n) {
        el.className = "combo";
        return;
      }
      el.className = "combo on t" + comboTier(n);
      big.textContent = "COMBO ×" + n;
      big.style.setProperty("--p", String(1.6 + Math.min(n, 10) * 0.14));
      big.classList.remove("punch");
      void big.offsetWidth;
      big.classList.add("punch");
      if (sb) sb.textContent = sub;
    });
    if (status === "won" && n && isMega(n)) {
      // a streak restored from history shows the HUD but earns no fireworks ("boot")
      mega(n, dropped);
      Lx.react("combo");
      rain(C.dn, n >= 5 ? 120 : 70);
      const e = eqEls()[0];
      if (e) {
        const c = center(e);
        burst(c.x, c.y, C.dn, n >= 5 ? 48 : 30, true);
      }
      sfx.big();
      if (n >= 5 && !RM) {
        const cab = $("#cab");
        if (cab) {
          cab.classList.remove("shake");
          void cab.offsetWidth;
          cab.classList.add("shake");
        }
      }
    }
    if (dropped) voucherFly();
    renderVouchers();
  }
  function mega(n: number, dropped: boolean) {
    $$(".mega").forEach((el) => {
      el.querySelector(".t").textContent = "×" + n + " COMBO";
      el.querySelector(".s").textContent = dropped ? `+${whole(vFace())} voucher · in your Vouchers` : comboWord(n);
      el.className = "mega on";
      clearTimeout(el._t);
      el._t = setTimeout(() => (el.className = "mega"), 1600);
    });
  }
  /** "+$2 VOUCHER" flies from the combo HUD to the voucher chip */
  function voucherFly() {
    const a = $("#dCombo"),
      b = $("#vouChip");
    if (!a || !b) return;
    const from = a.getBoundingClientRect(),
      to = b.getBoundingClientRect();
    const v = document.createElement("span");
    v.className = "vfly";
    v.textContent = `+${whole(vFace())} VOUCHER`;
    v.style.left = from.left + from.width / 2 + "px";
    v.style.top = from.top + from.height / 2 + "px";
    root.appendChild(v);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        v.style.transform = `translate(calc(-50% + ${to.left + to.width / 2 - (from.left + from.width / 2)}px),calc(-50% + ${to.top + to.height / 2 - (from.top + from.height / 2)}px)) scale(.7)`;
        v.style.opacity = ".2";
      }),
    );
    setTimeout(() => {
      v.remove();
      b.classList.remove("bump");
      void b.offsetWidth;
      b.classList.add("bump");
    }, 1100);
  }
  /** the voucher chip on 03 (desktop) / next to YOUR STAKE (phone): three states */
  function renderVouchers() {
    const e = $("#vouChip");
    if (!e) return;
    const cap = vCap(),
      v = S.vToday;
    const h = mobile
      ? v + 1e-9 >= cap
        ? `Today's <b>${whole(cap)}</b> vouchers claimed`
        : v
          ? `Vouchers <b>${whole(v)} / ${whole(cap)}</b> today ›`
          : `<b>${vEvery()} wins in a row</b> = ${whole(vFace())} voucher`
      : v + 1e-9 >= cap
        ? `Today's <b>${whole(cap)}</b> of vouchers claimed · resets 00:00 UTC`
        : v
          ? `Vouchers today <b>${whole(v)} / ${whole(cap)}</b> · View ›`
          : `Win <b>${vEvery()} in a row</b> = ${whole(vFace())} voucher · up to ${whole(cap)} a day`;
    if (e.innerHTML !== h) e.innerHTML = h;
  }

  /* ---------- per-call feedback: float + fly ---------- */
  function flagFloat(c: Call) {
    const cv = $("#cv");
    if (!cv) return;
    const g = geom(cv);
    const x = g.x(c.t1),
      y = g.y(c.s1 ?? c.s0 ?? S.price);
    const f = document.createElement("span");
    f.className = "float";
    f.style.cssText = `left:${x - 26}px;top:${y - 40}px;color:${c.status === "won" ? "var(--lime)" : c.status === "lost" ? "var(--hot)" : "#aab"}`;
    f.textContent = c.status === "void" ? "VOID" : signed(c.pnl);
    cv.parentElement.appendChild(f);
    setTimeout(() => f.remove(), 1600);
  }
  function flyChip(c: Call) {
    const key = keyOf(c.side),
      eq = eqEls()[0];
    if (!key || !eq) return;
    const a = key.getBoundingClientRect(),
      b = eq.getBoundingClientRect();
    const ch = document.createElement("span");
    ch.className = "mchip fly " + chipCls(c.gross);
    ch.textContent = String(c.gross);
    ch.style.cssText = `left:${a.left + a.width / 2}px;top:${a.top + a.height / 2}px;opacity:${c.status === "won" ? 1 : 0.5}`;
    root.appendChild(ch);
    requestAnimationFrame(() => {
      ch.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px,${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.5)`;
      ch.style.opacity = "0";
    });
    setTimeout(() => ch.remove(), 600);
  }
  function flashCents() {
    $$(".dir .cents").forEach((e) => {
      e.classList.remove("moved");
      void e.offsetWidth;
      e.classList.add("moved");
    });
  }
  const paysT: Record<string, any> = {};
  function setPays(side: Side, txt: string, warn?: boolean) {
    const e = $(side === "u" ? "#btnpU" : "#btnpD");
    if (!e) return;
    e.textContent = txt;
    e.className = "pays" + (warn ? " warn" : "");
    clearTimeout(paysT[side]);
    paysT[side] = setTimeout(() => {
      e.className = "pays";
      renderPays();
    }, 1800);
  }

  /* ---------- chart ---------- */
  /** The live line is Binance's book pinned to the index tick by tick: a point at time t is
      (index of the latest tick at or before t) + (Binance mid now − Binance mid when that tick
      arrived). So the line passes through every index print and still wiggles in between.
      Before the first tick that carries a mid, the first such tick anchors (no cliff at boot). */
  function anchorFor(t: number): { p: number; mid: number } | null {
    let a: any = null;
    for (let i = S.px.length - 1; i >= 0; i--) {
      const x = S.px[i];
      if (x.mid == null) continue;
      if (x.t <= t) return x;
      a = x;
    }
    return a;
  }
  function anchored(mid: number, t: number): number {
    const a = anchorFor(t);
    return a ? a.p + (mid - a.mid) : mid + S.basis;
  }
  /** what the line is drawn from: index ticks up to where the live feed starts, then the live book
      bridged between index prints — inside a segment the point is the straight line between the two
      prints plus Binance's deviation from its own straight line over the same segment (zero at both
      ends), so the line goes through every print exactly; after the latest print it rides the print
      plus Binance's move since. */
  /* ---------- display texture (CPO 2026-11-02) ----------
     Lovable's index is a demo feed (~1 print / 2 s) and Binance's top of book barely moves, so the bare line
     read as straight segments. The approved mock's line moves 10 times a second; CPO: "做成 mock 那个样子，
     研发按真实价格实现成这个效果". So on Lovable the line between two index prints is a seeded random walk
     (the mock's own step: r·1.2e-4 + momentum·4e-5 of price, every 100 ms) bridged to pass exactly through
     both prints; after the latest print it keeps walking until the next one lands. Calls' open / settle
     marks, the ✓ / ✕ and every number the server uses stay on the index prints.
     Main-net: draw the real feed at ≥ 10 Hz to get this look — no synthetic texture. arcade_params.display_texture = 0 turns it off. */
  const texOn = () => S.params?.display_texture !== 0;
  const TEX_STEP = 100;
  function texWalk(seedT: number, n: number, price: number): number[] {
    let x = Math.floor(seedT) % 2147483647 || 1;
    const rnd = () => {
      x = (x * 48271) % 2147483647;
      return x / 2147483647;
    };
    const w = [0];
    let mom = 0,
      v = 0;
    for (let i = 1; i <= n; i++) {
      const r = (rnd() - 0.5) * 2;
      mom = mom * 0.9 + r * 0.1;
      v += price * (r * 0.00012 + mom * 0.00004);
      w.push(v);
    }
    return w;
  }
  function texSeries(from: number): { t: number; p: number }[] {
    const ticks = S.px.filter((x: any) => x.t >= from - 4000);
    const out: { t: number; p: number }[] = [];
    const tNow = now();
    for (let k = 0; k < ticks.length; k++) {
      const a = ticks[k],
        b = ticks[k + 1];
      if (a.t >= from) out.push({ t: a.t, p: a.p });
      if (b && b.t - a.t > 3500) continue; // a gap in the index stays a gap
      const end = b ? b.t : tNow;
      const n = Math.max(1, Math.round((end - a.t) / TEX_STEP));
      const w = texWalk(a.t, n, a.p);
      const last = b ? n - 1 : Math.min(n, Math.floor((tNow - a.t) / TEX_STEP));
      for (let i = 1; i <= last; i++) {
        const t = a.t + i * TEX_STEP;
        if (t < from) continue;
        const p = b ? a.p + w[i] - (w[n] - (b.p - a.p)) * (i / n) : a.p + w[i];
        out.push({ t, p });
      }
    }
    return out;
  }
  function lineSeries(from: number): { t: number; p: number }[] {
    if (texOn() && S.px.length) return texSeries(from);
    if (!liveOn()) return S.px.filter((x: any) => x.t >= from);
    const first = S.live[0].t;
    const head = S.px.filter((x: any) => x.t >= from && x.t < first - 200);
    const ticks = S.px.filter((x: any) => x.mid != null);
    const out: { t: number; p: number }[] = [];
    let k = 0;
    for (const x of S.live) {
      while (k + 1 < ticks.length && ticks[k + 1].t <= x.t) k++;
      if (x.t < from) continue;
      const a = ticks[k];
      if (!a) {
        out.push({ t: x.t, p: x.m + S.basis });
        continue;
      }
      const b = ticks[k + 1];
      if (x.t < a.t || !b) {
        // before the first anchor, or after the latest print
        out.push({ t: x.t, p: a.p + (x.m - a.mid) });
      } else {
        const u = Math.max(0, Math.min(1, (x.t - a.t) / Math.max(1, b.t - a.t)));
        out.push({ t: x.t, p: a.p + (b.p - a.p) * u + (x.m - (a.mid + (b.mid - a.mid) * u)) });
      }
    }
    return head.concat(out);
  }
  /** the time of the index print a call was opened / settled on, so its marker sits on the line */
  const printTime = (price: number | null | undefined, after: number, fallback: number) => {
    if (price == null) return fallback;
    const hit = S.px.find((x: any) => x.t > after && Math.abs(x.p - price) < 1e-6);
    return hit ? hit.t : fallback;
  };
  const printTimeBefore = (price: number | null | undefined, before: number, fallback: number) => {
    if (price == null) return fallback;
    for (let i = S.px.length - 1; i >= 0; i--) if (S.px[i].t <= before && Math.abs(S.px[i].p - price) < 1e-6) return S.px[i].t;
    return fallback;
  };
  /** right-hand price scale width */
  const gut = (cv: any) => (cv.clientWidth < 420 ? 52 : 66);
  function geom(cv: any) {
    const W = cv.clientWidth,
      H = cv.clientHeight,
      PW = W - gut(cv),
      TOP = 34,
      BOT = 16,
      t = now(),
      t0 = t - 45000,
      t1 = t + 32000;
    const open = S.calls.filter((c: Call) => c.s0 != null);
    const ps = lineSeries(t0).map((x: any) => x.p).concat(open.map((c: Call) => c.s0));
    if (S.disp) ps.push(S.disp);
    let lo = Math.min(...ps),
      hi = Math.max(...ps);
    if (!isFinite(lo)) {
      lo = (S.price || 0) - 30;
      hi = (S.price || 0) + 30;
    }
    // fit the real range: BTC often moves only cents for a while — a $8 floor turned that into a flat line
    const pad = Math.max((hi - lo) * 0.25, texOn() ? 8 : 1.5);
    lo -= pad;
    hi += pad;
    return { W, H, PW, TOP, BOT, lo, hi, x: (tt: number) => ((tt - t0) / (t1 - t0)) * PW, y: (p: number) => H - BOT - ((p - lo) / (hi - lo)) * (H - BOT - TOP - 6) - 3 };
  }
  const fmtP = (p: number, dp: number) => p.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  function priceTag(ctx: any, g: any, y: number, txt: string, bg: string) {
    const x = g.PW + 2,
      w = g.W - g.PW - 3;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y - 8);
    ctx.lineTo(x + w, y - 8);
    ctx.lineTo(x + w, y + 8);
    ctx.lineTo(x + 6, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#020c10";
    ctx.font = "700 10px Chakra Petch";
    ctx.fillText(txt, x + 8, y + 4);
  }
  /** The stage only draws YOUR calls (James #1–#5): a neutral white price line, real-clock ticks every
      15 s, a right-hand scale with price tags, and — when nothing of yours is open, or a key is hovered —
      a preview of the call you would make now. Colour means direction only; won = filled ✓ in the
      call's colour, lost = grey ring ✕, tie = grey bar; a settled flag leaves the lane after 1.5 s. */
  function draw(cv: any) {
    const ctx = cv.getContext("2d");
    const dpr = devicePixelRatio || 1;
    const W = cv.clientWidth,
      H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== W * dpr || cv.height !== H * dpr) {
      cv.width = W * dpr;
      cv.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const g = geom(cv),
      t = now(),
      PW = g.PW,
      narrow = W < 420;
    /* grid */
    ctx.strokeStyle = "#15262e";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const yy = g.TOP + ((H - g.TOP - g.BOT) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(PW, yy);
      ctx.stroke();
    }
    /* real-clock ticks every 15 s */
    const xn = g.x(t);
    ctx.font = "500 9px Chakra Petch";
    ctx.fillStyle = "#5d6676";
    for (let w = Math.ceil((t - 45000) / 15000) * 15000; w < t + 32000; w += 15000) {
      const x = g.x(w);
      if (x < 14 || x > PW - 30) continue;
      ctx.strokeStyle = "#121e25";
      ctx.beginPath();
      ctx.moveTo(x, g.TOP);
      ctx.lineTo(x, H - g.BOT);
      ctx.stroke();
      if (Math.abs(x - xn) > 34) ctx.fillText(clockOf(w).slice(narrow ? 3 : 0), x - (narrow ? 12 : 20), H - 4);
    }
    /* now */
    ctx.fillStyle = "rgba(51,214,255,.05)";
    ctx.fillRect(xn, 0, PW - xn, H - g.BOT);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#2a4a56";
    ctx.beginPath();
    ctx.moveTo(xn, 0);
    ctx.lineTo(xn, H - g.BOT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#dfe6ee";
    ctx.font = "700 9px Chakra Petch";
    ctx.fillText("NOW", xn - 10, H - 4);
    /* price line — one neutral colour; it says nothing about winning or losing.
       One point per valid second, the head eased toward the latest index; gaps where the index was invalid */
    const useLive = liveOn();
    const pts = lineSeries(t - 45000);
    let headX = xn,
      headY = g.y(S.disp || S.price);
    if (pts.length > 1 || (pts.length && S.disp)) {
      headX = Math.min(xn, g.x(pts[pts.length - 1].t) + 40);
      ctx.beginPath();
      let prevT = 0;
      pts.forEach((p: any, i: number) => {
        const x = g.x(p.t),
          y = g.y(p.p);
        if (!i || p.t - prevT > 3500) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        prevT = p.t;
      });
      if (t - prevT < 3500) ctx.lineTo(headX, headY);
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#e8edf2";
      ctx.shadowColor = "rgba(220,235,255,.45)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineTo(headX, H - g.BOT);
      ctx.lineTo(g.x(pts[0].t), H - g.BOT);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, g.TOP, 0, H);
      grad.addColorStop(0, "rgba(232,237,242,.12)");
      grad.addColorStop(1, "rgba(232,237,242,0)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(headX, headY, 3.2, 0, 7);
      ctx.fill();
      if (useLive && !texOn()) {
        ctx.fillStyle = "rgba(238,242,248,.45)";
        for (const p of S.px) {
          if (p.t < t - 45000) continue;
          ctx.fillRect(Math.round(g.x(p.t)) - 1, Math.round(g.y(p.p)) - 1, 2, 2);
        }
      }
    }
    const live = S.calls.filter((c: Call) => c.s0 != null || c.status === "pending" || c.status === "open").sort((a: Call, b: Call) => a.t1 - b.t1);
    const anyLive = live.some((c: Call) => c.status === "open" || c.status === "settling" || c.status === "pending");
    /* preview: "if you call now" — when nothing of yours is open, and whenever a key is hovered (James #4) */
    const hs: Side | null = FX?.hover ?? S.hover;
    if ((!anyLive || hs) && (S.disp || S.price) && !S.paused) {
      const yp = headY,
        xe = g.x(t + ARCADE_DURATION_MS);
      if (hs) {
        ctx.fillStyle = hs === "u" ? "rgba(51,214,255,.10)" : "rgba(207,255,74,.09)";
        if (hs === "u") ctx.fillRect(xn, g.TOP, xe - xn, yp - g.TOP);
        else ctx.fillRect(xn, yp, xe - xn, H - g.BOT - yp);
        ctx.fillStyle = hs === "u" ? C.up : C.dn;
        ctx.font = "700 11px Chakra Petch";
        ctx.fillText(narrow ? (hs === "u" ? "▲ UP wins above" : "▼ DOWN wins below") : hs === "u" ? "▲ UP wins if BTC ends above" : "▼ DOWN wins if BTC ends below", xn + 8, hs === "u" ? yp - 8 : yp + 16);
      }
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = hs === "u" ? C.up : hs === "d" ? C.dn : "rgba(238,242,248,.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xn, yp);
      ctx.lineTo(xe, yp);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = ctx.fillStyle = hs === "u" ? C.up : hs === "d" ? C.dn : "#aab4c2";
      ctx.beginPath();
      ctx.moveTo(xe, yp);
      ctx.lineTo(xe, g.TOP + 2);
      ctx.stroke();
      const lbl = narrow ? "30s" : "if you call now · settles here";
      ctx.font = "700 9px Chakra Petch";
      const tw = ctx.measureText(lbl).width + 12;
      const fx0 = Math.min(xe, PW - tw - 2);
      ctx.fillRect(fx0, g.TOP - 14, tw, 13);
      ctx.fillStyle = "#020c10";
      ctx.fillText(lbl, fx0 + 6, g.TOP - 4);
    }
    /* calls: entry diamond + open line; colour = your side while you are ahead, grey while behind */
    live.forEach((c: Call, i: number) => {
      const col = c.side === "u" ? C.up : C.dn;
      const isLive = c.status === "open" || c.status === "settling" || c.status === "pending";
      const s0 = c.s0 ?? S.price;
      const ahead = c.side === "u" ? S.price > s0 : S.price < s0;
      // the entry diamond sits on the print that opened the call (the first index after the server took the chip)
      const x0 = g.x(c.s0 != null ? printTime(c.s0, c.t0 - 1, c.t0) : c.t0),
        x1 = g.x(c.t1),
        y = g.y(s0);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = isLive ? (c.s0 != null && ahead ? col : "#5a6676") : c.status === "won" ? col : "#5a6676";
      ctx.globalAlpha = isLive ? (i < 6 ? 0.9 : 0.3) : 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(Math.min(x1, PW), y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = i < 6 || !isLive ? (isLive ? 1 : 0.6) : 0.55;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x0, y - 5);
      ctx.lineTo(x0 + 5, y);
      ctx.lineTo(x0, y + 5);
      ctx.lineTo(x0 - 5, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      if (isLive && i < 3 && !narrow) {
        ctx.font = "700 10px Chakra Petch";
        ctx.fillText(c.side === "u" ? "▲" : "▼", x0 - 4, c.side === "u" ? y - 8 : y + 16);
      }
      if (!isLive && c.s1 != null) {
        // the result mark sits on the print the call settled on (the last index at or before t1)
        const xs = g.x(printTimeBefore(c.s1, c.t1 + 1, c.t1));
        const ys = g.y(c.s1);
        if (c.status === "won") {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(xs, ys, 6.5, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#020c10";
          ctx.font = "700 9px Chakra Petch";
          ctx.fillText("✓", xs - 3.6, ys + 3.4);
        } else if (c.status === "lost") {
          ctx.strokeStyle = "#6b7584";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(xs, ys, 5, 0, 7);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.fillStyle = "#8a93a3";
          ctx.font = "700 7px Chakra Petch";
          ctx.fillText("✕", xs - 2.6, ys + 2.6);
        } else {
          ctx.fillStyle = "#8a93a3";
          ctx.fillRect(xs - 4, ys - 1, 8, 2);
        }
      }
    });
    /* settle burst: expanding ring + the open line flashes solid (your colour on a win, grey otherwise) */
    for (const b of S.bursts) {
      const k = (perf() - b.t) / 900,
        c: Call = b.c;
      if (c.s0 == null) continue;
      const x1 = g.x(c.t1),
        ys = g.y(c.s1 ?? c.s0),
        col = c.status === "won" ? (c.side === "u" ? C.up : C.dn) : "#6b7584";
      ctx.strokeStyle = col;
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x1, ys, 8 + k * 26, 0, 7);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(g.x(c.t0), g.y(c.s0));
      ctx.lineTo(x1, g.y(c.s0));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }
    /* flag lane: ▲ / ▼ + seconds left; ✓ / ✕ for 1.5 s once settled, then the flag leaves */
    // flags closer than one flag's width merge into one ("▲▼ 24s  3 calls"), so rapid taps never pile up in the lane
    const groups: Record<number, Call[]> = {};
    let gk = -1,
      gx = -1e9;
    for (const c of live) {
      const on = c.status === "open" || c.status === "settling" || c.status === "pending" || (c.tDone && t - c.tDone < 1500);
      if (!on) continue;
      const x = g.x(c.t1);
      if (gk < 0 || x - gx > (narrow ? 30 : 40)) {
        gk = c.t1;
        gx = x;
      }
      (groups[gk] = groups[gk] || []).push(c);
    }
    const keys = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);
    if (keys.length) {
      ctx.fillStyle = "rgba(5,10,14,.55)";
      ctx.fillRect(0, 0, PW, g.TOP - 2);
    }
    keys.forEach((k, ki) => {
      const cs = groups[k],
        c = cs[0];
      const x1 = g.x(c.t1);
      if (x1 < -40 || x1 > PW + 4) return;
      const y = 3 + (ki % 2) * 15;
      const isLive = cs.some((z) => z.status === "open" || z.status === "settling" || z.status === "pending"),
        settling = cs.some((z) => z.status === "settling");
      const won = cs.filter((z) => z.status === "won").length,
        lost = cs.filter((z) => z.status === "lost").length;
      const same = cs.every((z) => z.side === c.side);
      const sideCol = c.side === "u" ? C.up : C.dn;
      const fill = settling ? "#fff" : isLive ? (same ? sideCol : "#dfe6ee") : won && !lost ? (same ? sideCol : "#e8edf2") : lost && !won ? "#2a323d" : "#aab";
      const secs = Math.max(0, Math.ceil((c.t1 - t) / 1000));
      const arrow = same ? (c.side === "u" ? "▲" : "▼") : "▲▼";
      const txt = settling ? "…" : isLive ? arrow + " " + secs + "s" : won && !lost ? "✓" : lost && !won ? "✕" : won + "/" + cs.length;
      const full = txt + (cs.length > 1 ? "  " + cs.length + " calls" : "");
      ctx.font = "700 9px Chakra Petch";
      const fw = Math.max(28, ctx.measureText(full).width + 10);
      ctx.fillStyle = fill;
      ctx.fillRect(x1 - 1, y, 2, 13);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x1 + fw, y);
      ctx.lineTo(x1 + fw - 4, y + 6);
      ctx.lineTo(x1 + fw, y + 12);
      ctx.lineTo(x1, y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = !isLive && lost && !won ? "#aab4c2" : "#020c10";
      ctx.fillText(full, x1 + 3, y + 9);
      if (isLive) {
        for (const z of cs) {
          const ye = g.y(z.s0 ?? S.price);
          ctx.strokeStyle = z.side === "u" ? "rgba(51,214,255,.22)" : "rgba(207,255,74,.22)";
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, y + 13);
          ctx.lineTo(x1, ye);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = z.side === "u" ? C.up : C.dn;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, ye - 5);
          ctx.lineTo(x1, ye + 5);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
    });
    /* right-hand price scale: ticks + the live price tag + the open price of your 3 soonest calls (James #5) */
    ctx.fillStyle = "#08100f";
    ctx.fillRect(PW, 0, W - PW, H);
    ctx.strokeStyle = "#1c2a33";
    ctx.beginPath();
    ctx.moveTo(PW + 0.5, 0);
    ctx.lineTo(PW + 0.5, H);
    ctx.stroke();
    ctx.font = "500 9px Chakra Petch";
    ctx.fillStyle = "#5d6676";
    const dp = narrow ? 0 : 1;
    for (let i = 0; i <= 4; i++) {
      const p = g.lo + ((g.hi - g.lo) * (i + 0.5)) / 5;
      ctx.fillText(fmtP(p, dp), PW + 6, g.y(p) + 3);
    }
    const used: number[] = [];
    const slot = (y0: number) => {
      // step away from the taken tags in one direction (toward the roomier half) so it never ping-pongs
      const step = y0 > H / 2 ? -17 : 17;
      let yy = y0;
      for (let k = 0; k < 8; k++) {
        if (used.every((u) => Math.abs(u - yy) >= 17)) break;
        yy += step;
      }
      used.push(yy);
      return yy;
    };
    if (S.disp || S.price) priceTag(ctx, g, slot(headY), fmtP(S.disp || S.price, dp), "#e8edf2");
    live
      .filter((c: Call) => c.status === "open" && c.s0 != null)
      .slice(0, 3)
      .forEach((c: Call) => priceTag(ctx, g, slot(g.y(c.s0!)), (c.side === "u" ? "▲" : "▼") + fmtP(c.s0!, narrow ? 0 : 1), c.side === "u" ? C.up : C.dn));
  }

  /* ---------- render: keys, rail, boards, price ---------- */
  /** chip colour class; $2 is "d2" because "v2" is the cabinet's own class (.cab.v2) and every .v2 layout rule hit the chip */
  const chipCls = (v: number) => (v === 2 ? "d2" : "v" + v);
  function stackHtml(chips: number[], max: number) {
    const g: Record<number, number> = {},
      last: Record<number, number> = {};
    chips.forEach((v, i) => {
      g[v] = (g[v] || 0) + 1;
      last[v] = i;
    });
    let dens = Object.keys(g)
      .map(Number)
      .sort((a, b) => last[a] - last[b]);
    let folded = 0;
    if (dens.length > max) {
      const cut = dens.slice(0, dens.length - max);
      folded = cut.reduce((a, v) => a + g[v], 0);
      dens = dens.slice(dens.length - max);
    }
    const size = dens.length + (folded ? 1 : 0);
    return `<span class="stk s${size}">${folded ? `<span class="den"><span class="mchip more">+${folded}</span></span>` : ""}${dens
      .map((v) => {
        const n = g[v],
          k = Math.min(5, n);
        return `<span class="den">${Array.from({ length: k }, () => `<span class="mchip ${chipCls(v)}">${v}</span>`).join("")}${n > 1 ? `<span class="cnt">×${n}</span>` : ""}</span>`;
      })
      .join("")}</span>`;
  }
  function ringSvgLime(frac: number, side: Side) {
    const r = 17,
      c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" fill="none" stroke="#1b2630" stroke-width="3"/><circle cx="20" cy="20" r="${r}" fill="none" stroke="${side === "u" ? C.up : C.dn}" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 20 20)"/></svg>`;
  }
  const lastHtml: Record<string, string> = {};
  /** the UNDO key: 2-second window, counts the chips still inside it; updated in place so a tap never lands on a
      node that was just replaced (that would fall through to the key and place another chip) */
  function renderKeys() {
    const win = ARCADE_CANCEL_MS - 150;
    for (const side of ["u", "d"] as Side[]) {
      const key = keyOf(side);
      if (!key) continue;
      const live = S.calls.filter((c: Call) => c.side === side && (c.status === "open" || c.status === "pending" || c.status === "settling"));
      const canc = live.filter((c: Call) => now() - c.t0 < win && c.status !== "settling");
      // every chip lands in the stack the moment it is tapped, the undo window included (James #9)
      const chips = live.map((c: Call) => c.gross);
      const st = key.querySelector(".stack"),
        h = stackHtml(chips, canc.length ? 3 : 5);
      if (lastHtml[side] !== h) {
        st.innerHTML = h;
        lastHtml[side] = h;
      }
      const rw = key.querySelector(".ringwrap");
      key.classList.toggle("hasundo", !!canc.length);
      if (canc.length) {
        const c = canc[canc.length - 1],
          left = Math.max(0, ARCADE_CANCEL_MS - (now() - c.t0));
        let u = rw.querySelector(".undo");
        if (!u) {
          rw.innerHTML = `<span class="undo" role="button" aria-label="Undo your latest chip" title="Take back your latest chip"><b></b><i></i><u></u></span>`;
          u = rw.querySelector(".undo");
        }
        u.dataset.id = c.id;
        const lbl = "UNDO" + (canc.length > 1 ? " (" + canc.length + ")" : "");
        if (u.firstChild.textContent !== lbl) u.firstChild.textContent = lbl;
        u.children[1].textContent = (left / 1000).toFixed(1) + "s";
        u.children[2].style.width = (left / ARCADE_CANCEL_MS) * 100 + "%";
      } else if (rw.firstChild) rw.innerHTML = "";
      key.classList.toggle("off", !!S.paused || !liveQuote());
      const p = side === "u" ? S.pUp : S.pUp == null ? null : 1 - S.pUp;
      $(side === "u" ? "#btncU" : "#btncD").textContent = p == null || !liveQuote() ? "—" : cents(p);
    }
  }
  function renderPays() {
    for (const side of ["u", "d"] as Side[]) {
      const e = $(side === "u" ? "#btnpU" : "#btnpD");
      if (!e || e.classList.contains("warn")) continue;
      const p = side === "u" ? S.pUp : S.pUp == null ? null : 1 - S.pUp;
      const live = S.calls.filter((c: Call) => c.side === side && (c.status === "open" || c.status === "pending"));
      const canc = live.filter((c: Call) => now() - c.t0 < ARCADE_CANCEL_MS - 150);
      let txt: string;
      if (S.paused === "full") txt = "Table full · room opens as calls settle";
      else if (S.paused) txt = S.paused === "breaker" ? "Table paused · market moving too fast" : S.paused === "loss" ? "Table paused · daily limit reached" : S.paused === "off" ? "Table closed" : "Table paused · index invalid";
      else if (!liveQuote() || p == null) txt = S.tick && S.tick.valid ? "Warming up · odds in a moment" : "Waiting for the price";
      else if (canc.length) {
        const c = canc[canc.length - 1];
        // "Placed ✓" first: the chip is already down, undo is the option (James #11)
        txt = canc.length > 1 ? `${canc.length} placed ✓ · undo removes the latest` : `Placed ✓ · undo costs ${feeText(cancelFee(c.gross))}`;
      } else if (openStake() + S.chip > ARCADE_MAX_OPEN) txt = LIMIT_TEXT;
      // "to win" = what comes back if it wins, chip included (same as the main site's To win)
      else txt = `${whole(S.chip)} in · fee ${money(fee(S.chip))} · to win ${money(callCredit(S.chip, p))} if ${SIDE(side)}`;
      if (e.textContent !== txt) e.textContent = txt;
    }
  }
  function renderChips() {
    const el = $("#chips");
    if (!el) return;
    const open = openStake();
    const h = ARCADE_CHIPS_V2.map((v) => `<button class="chip${v === S.chip ? " on" : ""}${open + v > ARCADE_MAX_OPEN ? " off" : ""}" data-v="${v}" aria-pressed="${v === S.chip}"><sup>$</sup>${v}</button>`).join("");
    if (lastHtml.chips !== h) {
      el.innerHTML = h;
      lastHtml.chips = h;
    }
    const sel = $("#dSel");
    if (sel) sel.textContent = whole(S.chip) + " SELECTED";
  }
  /** YOUR CALLS tab: "open" | "settled" */
  let railTab = "open";
  function renderTable() {
    const el = $("#dTable");
    if (!el) return;
    const t = now();
    const rows = S.feed.filter((o: ArcadeFeedRow) => ms(o.t1) > t - 500).slice(0, 9);
    const seen = new Set<string>();
    rows.forEach((o: ArcadeFeedRow, i: number) => {
      const side = sideOf(o.side),
        t0 = ms(o.t0),
        t1 = ms(o.t1);
      const frac = clip((t - t0) / ARCADE_DURATION_MS, 0, 1);
      let row = el.querySelector(`.row[data-id="${o.id}"]`);
      seen.add(o.id);
      if (!row) {
        row = document.createElement("div");
        row.dataset.id = o.id;
        row.className = `row other ${side}${o.mine ? " mine" : ""}`;
        row.innerHTML = `<span class="sd ${side}">${side === "u" ? "▲ UP" : "▼ DN"}</span><span class="mid"><b>${whole(o.gross)} @ ${cents(o.p)} <span class="who">· ${o.mine ? "you" : o.who}</span></b></span><span class="st"></span>`;
      }
      const left = Math.max(0, Math.ceil((t1 - t) / 1000));
      const st = row.querySelector(".st"),
        txt = left + "s";
      if (st.textContent !== txt) st.textContent = txt;
      st.className = "st" + (left <= 5 ? " soon" : "");
      if (el.children[i] !== row) el.insertBefore(row, el.children[i] || null);
    });
    [...el.children].forEach((r: any) => {
      if (!seen.has(r.dataset.id)) r.remove();
    });
    const all = S.feed.filter((o: ArcadeFeedRow) => ms(o.t1) > t - 500);
    const n = $("#dTableN");
    if (n) n.textContent = String(all.length);
    const ts = $("#dTsum");
    if (ts) {
      const su = all.filter((o: ArcadeFeedRow) => sideOf(o.side) === "u"),
        sd = all.filter((o: ArcadeFeedRow) => sideOf(o.side) === "d");
      const sum = `<span class="u">▲ UP · ${su.length}<b>${whole(su.reduce((a: number, o: ArcadeFeedRow) => a + o.gross, 0))}</b></span><span class="d">▼ DOWN · ${sd.length}<b>${whole(sd.reduce((a: number, o: ArcadeFeedRow) => a + o.gross, 0))}</b></span>`;
      if (ts.innerHTML !== sum) ts.innerHTML = sum;
    }
  }
  function tableStake() {
    const t = now();
    return S.feed.filter((o: ArcadeFeedRow) => ms(o.t1) > t - 500).reduce((a: number, o: ArcadeFeedRow) => a + o.gross, 0);
  }
  function renderRail() {
    const t = now();
    const live = S.calls.filter((c: Call) => c.status !== "cancelled");
    const open = myOpen();
    const mineV = mineView();
    /* phone: the OPEN / LIVE / SESSION boards appear with the first call */
    const sb = $("#mSb");
    if (sb) sb.hidden = !mineV;
    const dOpenN = $("#dOpenN");
    if (dOpenN) {
      /* before the first call the rail is the LIVE TABLE; from the first call it is YOURS for the session,
         OPEN | SETTLED, and 04 / YOUR RESULT gets its own plate underneath (James #18) */
      renderTable();
      const head = $("#dYoursHead");
      if (mineV && !S.wasMine && head) {
        head.classList.remove("pop");
        void head.offsetWidth;
        head.classList.add("pop");
      }
      S.wasMine = mineV;
      $("#dTblWrap").hidden = mineV;
      $("#dMineWrap").hidden = !mineV;
      const res = $("#dResPlate");
      if (res) res.hidden = !mineV;
      if (!mineV) railTab = "open";
      $("#dOpenPane").hidden = railTab !== "open";
      $("#dDonePane").hidden = railTab !== "settled";
      $$("#dMineWrap .tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === railTab));
      dOpenN.textContent = String(open.length);
      $("#dOpenSum").textContent = whole(open.reduce((a: number, c: Call) => a + c.gross, 0)) + " in play";
      $("#dDoneN").textContent = String(S.done.length);
      $("#dDoneHint").hidden = !!S.done.length;
      $("#dPlink").hidden = !S.done.length;
      const list = $("#dList");
      const want = live.filter((c: Call) => !c.tDone || t - c.tDone < 1400).reverse();
      $("#dHint").hidden = !!want.length;
      const seen = new Set<string>();
      want.forEach((c: Call, i: number) => {
        const frac = clip((t - c.t0) / ARCADE_DURATION_MS, 0, 1);
        const ahead = c.s0 != null && (c.side === "u" ? S.price > c.s0 : S.price < c.s0);
        let st: string,
          cls = "";
        if (c.status === "pending") {
          st = "open…";
          cls = "pend";
        } else if (c.status === "settling") {
          st = "settling";
          cls = "pend";
        } else if (c.status === "won" || c.status === "lost") {
          st = signed(c.pnl);
          cls = c.status === "won" ? "pos" : "neg";
        } else if (c.status === "void") st = "VOID";
        else if (t - c.t0 < ARCADE_CANCEL_MS - 150) {
          st = "undo…";
          cls = "lock";
        } else if (c.s0 == null) {
          st = "open…";
          cls = "pend";
        } else {
          st = ahead ? "ahead" : "behind";
          cls = ahead ? "ahead" : "behind";
        }
        let row = list.querySelector(`.row[data-id="${c.id}"]`);
        seen.add(String(c.id));
        if (!row) {
          row = document.createElement("div");
          row.dataset.id = c.id;
          row.innerHTML = `<span class="sd ${c.side}">${c.side === "u" ? "▲ UP" : "▼ DN"}</span><span class="mid"><b></b><small></small><span class="bar"><i></i></span></span><span class="st"></span>`;
        }
        row.className = `row ${c.side} ${c.status}`;
        // "to win" = what comes back if it wins, chip included (James #12)
        const b = `${whole(c.gross)} · to win ${money(callCredit(c.gross, c.p))}`;
        if (row.firstChild.nextSibling.firstChild.textContent !== b) row.firstChild.nextSibling.firstChild.textContent = b;
        const sm = row.querySelector("small"),
          txt = `@ ${cents(c.p)} · open ${c.s0 != null ? money(c.s0) : "…"} · ${Math.max(0, Math.ceil((c.t1 - t) / 1000))}s`;
        if (sm.textContent !== txt) sm.textContent = txt;
        row.querySelector(".bar i").style.width = frac * 100 + "%";
        const se = row.querySelector(".st");
        if (se.textContent !== st) se.textContent = st;
        se.className = "st " + cls;
        if (list.children[i] !== row) list.insertBefore(row, list.children[i] || null);
      });
      [...list.children].forEach((r: any) => {
        if (!seen.has(r.dataset.id)) r.remove();
      });
      /* more rows below the fold → fade the bottom edge + "↓ 3 more" (James #19) */
      let hid = 0;
      const lb = list.scrollTop + list.clientHeight;
      [...list.children].forEach((r: any) => {
        if (r.offsetTop - list.offsetTop + r.offsetHeight > lb + 2) hid++;
      });
      const mp = $("#dMore");
      const showM = railTab === "open" && hid > 0;
      mp.hidden = !showM;
      if (showM) mp.textContent = "↓ " + hid + " more";
      list.classList.toggle("more", list.scrollHeight > list.clientHeight + 2 && list.scrollTop + list.clientHeight < list.scrollHeight - 2);
    }
    const dDone = $("#dDone");
    if (dDone) {
      const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const dh = S.done
        .slice(0, mobile ? 6 : 30)
        .map(
          (c: Call) =>
            `<div class="row ${c.side} ${c.status}"><span class="sd ${c.side}">${c.side === "u" ? "▲ UP" : "▼ DN"}</span><span class="mid"><b>${whole(c.gross)} @ ${cents(c.p)} · ${c.status === "won" ? "won" : c.status === "lost" ? "lost" : c.status === "cancelled" ? "cancelled" : "void"}</b><small>${c.s0 != null && c.s1 != null ? `<span class="nw">open ${fmt(c.s0)} ·</span> <span class="nw">close ${fmt(c.s1)}</span>` : c.status === "cancelled" ? "taken back within 2 s" : "no valid price · refunded"}</small></span><span class="st ${c.status === "won" ? "pos" : c.status === "lost" ? "neg" : "pend"}">${c.status === "void" ? "VOID" : signed(c.pnl)}</span></div>`,
        )
        .join("");
      if (dDone.innerHTML !== dh) dDone.innerHTML = dh;
    }
    /* mobile strip */
    const strip = $("#mStrip");
    if (strip) {
      const mine = live.filter((c: Call) => !c.tDone || t - c.tDone < 1400);
      let sh: string, lbl: string;
      const feedLive = S.feed.filter((o: ArcadeFeedRow) => ms(o.t1) > t - 500);
      if (mine.length) {
        lbl = `MY CALLS<br>${mine.length}`;
        sh = mine
          .slice(-7)
          .map((c: Call) => {
            const frac = 1 - clip((t - c.t0) / ARCADE_DURATION_MS, 0, 1);
            const done = c.status === "won" || c.status === "lost" || c.status === "void";
            return `<span class="mc ${c.status}">${ringSvgLime(frac, c.side)}<span class="mchip ${chipCls(c.gross)}">${c.gross}</span>${done ? `<span class="fs">${c.status === "won" ? "✓" : c.status === "lost" ? "✕" : "–"}</span>` : `<span class="t">${c.status === "settling" ? "…" : Math.max(0, Math.ceil((c.t1 - t) / 1000))}</span>`}</span>`;
          })
          .join("");
      } else if (!mineView() && feedLive.length) {
        lbl = `LIVE TABLE<br>${feedLive.length}`;
        sh = feedLive
          .slice(0, 7)
          .map((o: ArcadeFeedRow) => {
            const frac = 1 - clip((t - ms(o.t0)) / ARCADE_DURATION_MS, 0, 1);
            return `<span class="mc other">${ringSvgLime(frac, sideOf(o.side))}<span class="mchip ${chipCls(o.gross)}">${o.gross}</span><span class="t">${Math.max(0, Math.ceil((ms(o.t1) - t) / 1000))}</span></span>`;
          })
          .join("");
      } else {
        lbl = "MY CALLS<br>0";
        sh = `<span class="hint">${mineView() ? "No open calls · tap UP or DOWN" : "Tap UP or DOWN — your calls show here"}</span>`;
      }
      if (strip.innerHTML !== sh) strip.innerHTML = sh;
      const le = $("#mStripLbl");
      if (le.innerHTML !== lbl) le.innerHTML = lbl;
    }
  }
  function renderBoard() {
    const open = myOpen();
    const stake = openStake();
    const liveP = open.reduce((a: number, c: Call) => {
      if (c.s0 == null) return a;
      const ahead = c.side === "u" ? S.price > c.s0 : S.price < c.s0;
      return a + (ahead ? netWin(c.gross, c.p) : -c.gross);
    }, 0);
    const nextS = open.length ? Math.max(0, Math.ceil((nextT1() - now()) / 1000)) : 0;
    const set = (id: string, v: string) => {
      const e = $(id);
      if (e && e.textContent !== v) e.textContent = v;
    };
    set("#dOpenBig", open.length ? `${open.length} call${open.length > 1 ? "s" : ""} · ${whole(stake)}` : "—");
    set("#dOpenS", open.length ? `next in ${nextS}s` : "none");
    const l = $("#dLive");
    if (l) {
      l.textContent = open.length ? signed(liveP) : "—";
      l.className = "n " + (liveP < 0 ? "neg" : open.length ? "pos" : "");
    }
    const s = $("#dSes");
    if (s) {
      s.textContent = signed(S.ses);
      s.className = "n " + (S.ses < 0 ? "neg" : S.ses > 0 ? "pos" : "");
    }
    set("#dSesS", `${S.won} won · ${S.lost} lost`);
    const sk = $("#shareKey") as HTMLButtonElement | null;
    if (sk) sk.disabled = !(S.won + S.lost);
    const tk = $("#dTicks");
    if (tk) {
      const h = S.last.map((w: boolean) => `<span class="${w ? "w" : "l"}">${w ? "✓" : "✕"}</span>`).join("");
      if (tk.innerHTML !== h) tk.innerHTML = h;
    }
    set("#dStreak", S.streakW >= 2 ? `${S.streakW} in a row` : "");
    set("#dNext", mobile ? (open.length ? "NEXT · " + nextS + "s" : "") : "NEXT SETTLE · " + (open.length ? nextS + "s" : "—"));
    set("#mOpen", open.length ? `${open.length} · ${whole(stake)}` : "—");
    $$("#dYourOpen").forEach((e) => (e.textContent = mobile ? `${whole(stake)} / $${ARCADE_MAX_OPEN}` : `Current ${whole(stake)} / Max $${ARCADE_MAX_OPEN}`));
    renderVouchers();
  }
  /** price `secs` ago (index prints) */
  const priceAgo = (secs: number) => {
    const tt = now() - secs * 1000;
    for (let i = S.px.length - 1; i >= 0; i--) if (S.px[i].t <= tt) return S.px[i].p;
    return null;
  };
  function renderPriceBig() {
    const p = S.disp || S.price;
    const pe = $("#price");
    if (!pe) return;
    const txt = p ? money(p) : "$—";
    if (pe.textContent !== txt) pe.textContent = txt;
    /* ▲▼ beside the big price: the last second's tick */
    const ar = $("#dArr");
    if (ar) {
      const p1 = priceAgo(1);
      const up = p1 == null || p >= p1;
      const a = p ? (up ? "▲" : "▼") : "";
      if (ar.textContent !== a) ar.textContent = a;
      ar.className = "parr " + (up ? "cu" : "cd");
    }
    /* "▲ +$136.86 in the last 30s" — only while nothing of yours is open (the chart then speaks for your calls) */
    const d30 = $("#d30");
    if (d30) {
      const p30 = priceAgo(30);
      const d = p30 == null || !p ? null : p - p30;
      const ct = myOpen().length || d == null ? "" : `${d >= 0 ? "▲ +" : "▼ −"}$${Math.abs(d).toFixed(2)} in the last 30s`;
      if (d30.textContent !== ct) d30.textContent = ct;
      d30.className = "chg30 " + (d != null && d < 0 ? "cd" : "cu");
    }
    const mp = $("#mPrice");
    if (mp && mp.textContent !== txt) mp.textContent = txt;
  }
  function renderPrice() {
    const tk: ArcadeTick | null = S.tick;
    const p = S.price;
    const stale = !tk || now() - ms(tk.ts) > maxAge();
    const set = (id: string, v: string) => {
      const e = $(id);
      if (e && e.textContent !== v) e.textContent = v;
    };
    renderPriceBig();
    const src = (v: number | null) => (v == null ? "—" : money(v));
    set("#s1", tk ? src(tk.binance) : "—");
    set("#s2", tk ? src(tk.hyperliquid) : "—");
    set("#s3", tk ? src(tk.coinbase) : "—");
    set("#mIdx", tk && tk.valid && !stale ? money(tk.idx!) : "INVALID");
    const invalid = !tk || !tk.valid || stale;
    const ds = $("#srcA");
    if (ds) ds.classList.toggle("paused", invalid);
    const msrc = $("#mSrc");
    if (msrc) msrc.classList.toggle("paused", invalid);
    const ov = $("#dOv");
    if (ov) {
      const onv = !!S.paused;
      ov.classList.toggle("on", onv);
      if (onv) {
        const r = S.paused;
        set("#dOvT", r === "full" ? "TABLE FULL" : mobile ? "PAUSED" : "TABLE PAUSED");
        set("#dOvS", r === "full" ? "Room opens as calls settle" : r === "breaker" ? "BTC is moving too fast · back in a moment" : r === "loss" ? "Daily limit reached · back tomorrow" : r === "off" ? "The table is closed" : mobile ? "Index invalid" : "Index invalid · waiting for the exchanges");
      }
    }
  }
  function render() {
    renderKeys();
    renderPays();
    renderChips();
    renderRail();
    renderBoard();
  }

  /* ---------- data loops ---------- */
  function adoptTick(tk: ArcadeTick, serverNow?: string) {
    if (serverNow && !FX) {
      const o = ms(serverNow) - Date.now();
      off = off ? off * 0.7 + o * 0.3 : o;
    }
    if (S.lastTs && tk.ts <= S.lastTs) return;
    S.lastTs = tk.ts;
    S.tick = tk;
    if (tk.valid && tk.idx != null) {
      S.px.push({ t: ms(tk.ts), p: tk.idx, mid: S.wsMid || null });
      if (S.px.length > 200) S.px.shift();
      S.lastPx = S.price;
      S.price = tk.idx;
      // index − Binance mid: shifts the live line onto the index. Measured against the
      // mid THIS browser is plotting, not the server's binance field — on the demo
      // table that field is simulated and the line drifted away from the index (QA 2026-10-29).
      const mid = S.wsMid || tk.binance;
      if (mid != null) {
        S.basisT = tk.idx - mid;
        if (!S.basis) S.basis = S.basisT;
      }
      if (!S.disp || FX) S.disp = tk.idx;
      if (tk.p_up != null) {
        S.pUp = tk.p_up;
        S.quoteTs = tk.ts;
      } else {
        S.pUp = null;
        S.quoteTs = null;
      }
    }
  }
  async function poll() {
    try {
      const d = await data.tableNow();
      const prevTs = S.lastTs;
      if (d.tick) {
        if (prevTs && ms(d.tick.ts) - ms(prevTs) > 1800) {
          try {
            const more = await data.ticksAfter(prevTs);
            more.forEach((t) => adoptTick(t));
          } catch (e) {
            /* fall through to the latest */
          }
        }
        adoptTick(d.tick, d.now);
      } else if (d.now && !FX) off = ms(d.now) - Date.now();
      if (d.params && Object.keys(d.params).length) S.params = d.params;
      if (api.userId && typeof d.combo_today === "number") S.vToday = perf() < S.vHold ? Math.max(S.vToday, d.combo_today) : d.combo_today;
      const wasPaused = S.paused;
      S.paused = d.state?.paused_reason || null;
      if (!S.paused && (!S.tick || !S.tick.valid || now() - ms(S.tick.ts) > maxAge())) S.paused = "index";
      if (S.paused !== wasPaused) {
        if (S.paused) Lx.gameStart();
        else Lx.gameStop();
      }
      if (api.userId) {
        S.ack = d.ack;
        S.ackKnown = true;
        if (!S.ack) {
          // right after sign-in the first poll can go out before the session
          // token is attached and come back without the notice — ask twice
          S.noAck += 1;
          if (S.noAck >= 2) openGate(true);
        } else {
          S.noAck = 0;
          if (gate && !gate.hidden) openGate(false);
        }
      }
      renderPrice();
    } catch (e) {
      if (S.tick && now() - ms(S.tick.ts) > maxAge() + 2000) {
        S.paused = S.paused || "index";
        renderPrice();
      }
    }
  }
  async function pollFeed() {
    try {
      S.feed = await data.feed();
    } catch (e) {
      /* keep */
    }
  }
  async function boot() {
    try {
      const ticks = await data.ticks(60);
      ticks.forEach((t) => adoptTick(t));
    } catch (e) {
      /* the poll fills it in */
    }
    await poll();
    await loadRoad();
    await pollFeed();
    if (api.userId) {
      try {
        // the sitting survives a reload: every board in 04 is rebuilt from the
        // calls of the current session (30 min without a call = a new one)
        const hist = await data.myCalls(null, 400);
        restoreSession(hist);
      } catch (e) {
        /* fresh session */
      }
    }
    render();
    renderPrice();
  }

  /* ---------- gate + rules + how-to ---------- */
  const gate = $("#gate"),
    rules = $("#rules");
  function openGate(o: boolean) {
    if (!gate) return;
    gate.hidden = !o;
  }
  on($("#gateGo"), "click", async () => {
    audio();
    sfx.key();
    if (!api.userId) {
      openGate(false);
      api.requireAuth();
      return;
    }
    const go = $("#gateGo") as HTMLButtonElement;
    const label = go.textContent;
    go.disabled = true;
    go.textContent = "SAVING…";
    try {
      S.ack = await data.acceptTerms();
      S.noAck = 0;
      openGate(false);
      const c = center(go);
      burst(c.x, c.y, C.dn, 24);
    } catch (e: any) {
      toast(String(e?.message || "Could not save that · try again"), true);
    } finally {
      go.disabled = false;
      go.textContent = label;
    }
  });
  const openRules = (e?: Event) => {
    e?.preventDefault();
    audio();
    sfx.key();
    rules.hidden = false;
  };
  $$("#rulesBtn,#gateRules").forEach((b) => on(b, "click", openRules));
  on($("#rulesX"), "click", () => (rules.hidden = true));
  on(rules, "click", (e: any) => {
    if (e.target === rules) rules.hidden = true;
  });
  // The note lives outside the steel plates: the plates clip their corners with
  // clip-path, which also clipped the note (QA 2026-10-29). It is placed under
  // the ⓘ that opened it, fixed to the viewport.
  $$(".howto").forEach((ht) => root.appendChild(ht));
  on(root, "click", (e: any) => {
    const info = e.target.closest("#roadI,#m_roadI");
    if (info) {
      const ht = $(info.id === "roadI" ? "#howto" : "#m_howto");
      if (!ht) return;
      hideTip();
      const open = ht.hidden;
      $$(".howto").forEach((h) => (h.hidden = true));
      if (open) {
        const r = info.getBoundingClientRect();
        const w = Math.min(520, window.innerWidth - 24);
        ht.style.width = w + "px";
        ht.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left - 12)) + "px";
        ht.hidden = false;
        // below the ⓘ when there is room, else above it, never off the bottom
        const h = ht.offsetHeight;
        ht.style.top = (r.bottom + 8 + h <= window.innerHeight - 12 ? r.bottom + 8 : Math.max(12, r.top - 8 - h)) + "px";
      }
      return;
    }
    $$(".howto").forEach((ht) => {
      if (!ht.hidden && !e.target.closest(".howto")) ht.hidden = true;
    });
    // a tap on a ⓘ or a road cell (phones have no hover) shows the same note as the hover
    const tipEl = e.target.closest(".info[data-tip], .road .cell[data-i], .beads .bead[data-i]");
    if (tipEl) showTipFor(tipEl);
    else hideTip();
  });
  /* ⓘ notes + what one road cell was: "▲ Up +$12.40" · "12:03:00 – 12:03:30" (James #6, #13, #14) */
  const qtip = $("#qtip");
  function showTip(el: any, html: string) {
    if (!qtip) return;
    qtip.innerHTML = html;
    qtip.hidden = false;
    const r = el.getBoundingClientRect();
    const w = Math.min(300, innerWidth - 16);
    qtip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left - 20)) + "px";
    const h = qtip.offsetHeight;
    qtip.style.top = (r.bottom + 8 + h <= innerHeight - 8 ? r.bottom + 8 : Math.max(8, r.top - 8 - h)) + "px";
  }
  const hideTip = () => {
    if (qtip) qtip.hidden = true;
  };
  function cellTip(i: number): string {
    const info: RoadSlotInfo | undefined = S.histInfo[i];
    const x = S.hist[i];
    if (!info) return "";
    const range = `${clockOf(info.t)} – ${clockOf(info.t + SLOT)}`;
    if (info.carried || info.open == null || info.close == null) return `<b>No index print</b><br>${range} · colour carried over`;
    const d = info.close - info.open;
    return `<b style="color:${x === "u" ? C.up : C.dn}">${x === "u" ? "▲ Up" : "▼ Down"} ${d >= 0 ? "+" : "−"}$${Math.abs(d).toFixed(2)}</b><br>${range}`;
  }
  function showTipFor(el: any) {
    if (el.dataset.tip) return showTip(el, TIPS[el.dataset.tip] || "");
    const h = cellTip(Number(el.dataset.i));
    if (h) showTip(el, h);
  }
  on(root, "mouseover", (e: any) => {
    const el = e.target.closest(".info[data-tip], .road .cell[data-i], .beads .bead[data-i]");
    if (el) showTipFor(el);
    else if (qtip && !qtip.hidden) hideTip();
  });

  /* ---------- wiring ---------- */
  on(root, "click", (e: any) => {
    const tab = e.target.closest(".tab");
    if (tab) {
      railTab = tab.dataset.tab;
      render();
      return;
    }
    const undo = e.target.closest(".undo");
    if (undo) {
      e.stopPropagation();
      e.preventDefault();
      const c = S.calls.find((x: Call) => x.id == undo.dataset.id);
      if (c) void cancel(c);
      return;
    }
    if (e.target.closest("#dMore")) {
      const l = $("#dList");
      l.scrollTo({ top: l.scrollHeight, behavior: "smooth" });
      return;
    }
    if (e.target.closest(".cshare")) {
      audio();
      sfx.key();
      api.shareCombo?.({ n: S.streakW, pnl: S.runPnl, stake: S.runStake, biggestWin: S.runBig });
      return;
    }
    if (e.target.closest("#vouChip")) {
      e.preventDefault();
      audio();
      sfx.key();
      api.vouchers?.();
      return;
    }
    const chip = e.target.closest(".chip");
    if (chip) {
      if (chip.classList.contains("off")) return;
      audio();
      S.chip = +chip.dataset.v;
      sfx.chip();
      const c = center(chip);
      burst(c.x, c.y, C.dn, 14);
      render();
      return;
    }
    const key = e.target.closest(".dir");
    if (key && !e.target.closest(".undo")) {
      void place(key.dataset.side);
      return;
    }
  });
  /* hovering a key previews that call on the chart (mouse only — a tap on a phone is a call, not a hover) */
  if (matchMedia("(hover: hover)").matches)
    $$(".dir").forEach((k) => {
      on(k, "mouseenter", () => (S.hover = k.dataset.side));
      on(k, "mouseleave", () => (S.hover = null));
    });
  on(window, "keydown", (e: KeyboardEvent) => {
    if ((e.target as any)?.closest?.("input,textarea,[contenteditable]")) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      void place("u");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      void place("d");
    }
    if (e.key === "Escape") {
      if (rules) rules.hidden = true;
      sheetOpen(false);
    }
    if (e.key === "m" || e.key === "M") muteBtn?.click();
  });
  on($("#depBtn"), "click", () => {
    audio();
    sfx.key();
    if (!api.userId) {
      api.requireAuth();
      return;
    }
    api.deposit();
  });
  /** Signed out, the money strip is not an empty account: no balance, no Deposit / Transfer, one Sign in key. */
  function renderAuth() {
    const out = !api.userId;
    const dep = $("#depBtn") as HTMLButtonElement | null;
    if (dep) {
      dep.classList.toggle("signin", out);
      dep.closest(".m-top")?.classList.toggle("guest", out);
      dep.textContent = out ? (api.isMobile ? "SIGN IN" : "→ Sign in") : api.isMobile ? "+" : "+ Deposit";
      dep.title = out ? "Sign in to play" : api.isMobile ? "Deposit" : "Buy USDC with card or deposit on Base";
    }
    const x = $("#xferBtn");
    if (x) x.hidden = out;
    $$("#equity").forEach((e) => (e.textContent = out ? "—" : money(S.bal)));
  }
  renderAuth();
  on($("#xferBtn"), "click", () => {
    audio();
    sfx.key();
    api.transfer();
  });
  $$(".seslbl").forEach((el) => {
    el.title = ARCADE_SESSION_NOTE;
    on(el, "click", () => toast(ARCADE_SESSION_NOTE));
  });
  on($("#shareKey"), "click", () => {
    if (!(S.won + S.lost)) return;
    audio();
    sfx.key();
    const same = S.sesStakes.length && S.sesStakes.every((g: number) => g === S.sesStakes[0]);
    api.share?.({
      pnl: S.ses,
      won: S.won,
      lost: S.lost,
      bestRun: S.bestRun,
      biggestWin: S.bigWin,
      minutes: Math.max(1, Math.round((now() - S.sesStart) / 60000)),
      calls: S.won + S.lost,
      stakeLine: same ? `${whole(S.sesStakes[0])} each` : `${whole(S.sesStakes.reduce((a: number, g: number) => a + g, 0))} staked`,
    });
  });
  on($("#dPlink"), "click", () => {
    audio();
    sfx.key();
    api.portfolio?.();
  });
  const muteBtn = $("#muteBtn");
  const syncMute = () => {
    if (!muteBtn) return;
    muteBtn.setAttribute("aria-pressed", String(MUTED));
    muteBtn.setAttribute("aria-label", MUTED ? "Unmute sound" : "Mute sound");
  };
  syncMute();
  on(muteBtn, "click", () => {
    MUTED = !MUTED;
    try {
      localStorage.setItem("omx-mute", MUTED ? "1" : "0");
    } catch (e) {
      /* private mode */
    }
    syncMute();
    if (!MUTED) {
      audio();
      sfx.key();
    }
  });
  const logo = $("#logoPlate");
  on(logo, "click", (e: any) => {
    audio();
    sfx.key();
    const c = center(e.currentTarget);
    burst(c.x, c.y, C.cy, 24);
    setTimeout(() => api.exit(), 160);
  });
  on(logo, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      api.exit();
    }
  });

  /* ---------- mobile sheet ---------- */
  const sheet = $("#mSheet"),
    scrim = $("#mScrim"),
    peek = $("#mPeek");
  function sheetOpen(o: boolean) {
    if (!sheet) return;
    sheet.hidden = !o;
    scrim.hidden = !o;
    peek.setAttribute("aria-expanded", String(o));
    if (o) {
      renderRoads();
      render();
    }
  }
  on(peek, "click", () => sheetOpen(true));
  on(scrim, "click", () => sheetOpen(false));
  on($("#mSheetX"), "click", () => sheetOpen(false));
  on($("#mLynx"), "click", (e: any) => {
    e.target.classList.remove("hop");
    void e.target.offsetWidth;
    e.target.classList.add("hop");
    tone(880, 0.06, "square", 0.04, 1.5);
  });

  /* ---------- the lynx (desktop dash) ---------- */
  const Lx = (() => {
    const el = $("#lynx"),
      img = $("#lynxImg"),
      emo = $("#emote"),
      win = $("#dWin"),
      sg = $("#sign");
    const G: any = { on: false, rocks: [] as any[], t0: 0, score: 0, hi: 0, dead: false, jumpUntil: 0, next: 0 };
    if (!el) return { react: (_k: string) => {}, readRoad: () => {}, gameStart: () => {}, gameStop: () => {}, gameTick: (_t: number, _c: any, _w: number, _h: number) => {}, G };
    const V = ["/arcade/lynx0.png", "/arcade/lynx1.png", "/arcade/lynx2.png", "/arcade/lynx3.png"];
    void spriteUrls(V).then((u) => u.forEach((x, i) => (V[i] = x)));
    let x = 60,
      tx = 60,
      dir = -1,
      mode = "idle",
      lockUntil = 0,
      nextThink = perf() + 1500,
      last = perf(),
      lastTouch = perf(),
      mood = "flat";
    const W = () => win.clientWidth - el.offsetWidth - 8;
    function view(i: number, flip?: boolean) {
      img.src = V[i];
      el.style.setProperty("--f", flip ? "-1" : "1");
    }
    function setMode(m: string) {
      if (mode === m) return;
      el.classList.remove("idle", "walk", "hop", "cheer", "sulk", "sleep", "strut", "mope", "run", "jump", "dead");
      void el.offsetWidth;
      el.classList.add(m);
      mode = m;
    }
    function emote(t: string) {
      emo.textContent = t;
      emo.classList.remove("show");
      void emo.offsetWidth;
      emo.classList.add("show");
    }
    let signT: any = 0;
    function sign(t: string) {
      sg.textContent = t;
      sg.hidden = false;
      clearTimeout(signT);
      signT = setTimeout(() => (sg.hidden = true), 4000);
    }
    /* 1 · mood follows the session: up → struts, down → mopes, idle 60 s → sleeps */
    const moodOf = () => (S.ses > 0.5 ? "up" : S.ses < -0.5 ? "down" : "flat");
    function think(t: number) {
      if (G.on) return;
      const asleep = t - lastTouch > 60000;
      if (asleep) {
        if (mode !== "sleep") {
          setMode("sleep");
          view(1, dir > 0);
        }
        if (Math.random() < 0.5) emote("z");
        nextThink = t + 1800;
        return;
      }
      mood = moodOf();
      const r = Math.random();
      if (r < (mood === "up" ? 0.6 : 0.4)) {
        tx = 12 + Math.random() * Math.max(10, W() - 12);
        dir = tx < x ? -1 : 1;
        setMode(mood === "up" ? "strut" : mood === "down" ? "mope" : "walk");
        view(2, dir > 0);
      } else if (r < 0.7) {
        setMode("idle");
        view(mood === "down" ? 1 : 0, dir > 0);
      } else if (r < 0.82 && mood !== "down") {
        setMode("hop");
        view(3, dir > 0);
        lockUntil = t + 500;
      } else {
        setMode("idle");
        view(mood === "down" ? 1 : 0, dir > 0);
      }
      nextThink = t + (mood === "up" ? 900 : mood === "down" ? 2200 : 1200) + Math.random() * 2000;
    }
    raf((t) => {
      const dt = Math.min(50, t - last);
      last = t;
      if (!G.on && t >= lockUntil) {
        if (mode === "walk" || mode === "strut" || mode === "mope") {
          const v = mode === "strut" ? 0.075 : mode === "mope" ? 0.035 : 0.055;
          x += dir * v * dt;
          if ((dir > 0 && x >= tx) || (dir < 0 && x <= tx)) {
            x = tx;
            setMode("idle");
            view(mood === "down" ? 1 : 0, dir > 0);
          }
        }
        if (t >= nextThink && !RM) think(t);
      }
      x = Math.max(4, Math.min(Math.max(4, W()), x));
      el.style.setProperty("--x", x + "px");
    });
    on(el, "click", (e: any) => {
      if (G.on) return;
      e.stopPropagation();
      audio();
      lastTouch = perf();
      setMode("hop");
      view(3, dir > 0);
      emote(["♥", "!", "meow", "?!", "✦"][Math.floor(Math.random() * 5)]);
      tone(880, 0.06, "square", 0.04, 1.5);
      tone(1320, 0.08, "square", 0.035, 1.2, 0.06);
      lockUntil = perf() + 600;
      nextThink = lockUntil + 200;
    });
    function react(kind: string) {
      if (G.on) return;
      const t = perf();
      lastTouch = t;
      if (kind === "win") {
        setMode("hop");
        view(3, dir > 0);
        emote("+");
        lockUntil = t + 500;
      } else if (kind === "lose") {
        setMode("idle");
        view(1, dir > 0);
        lockUntil = t + 700;
      } else if (kind === "combo") {
        setMode("cheer");
        view(3, dir > 0);
        emote("GG!");
        lockUntil = t + 1900;
      } else if (kind === "cold") {
        setMode("sulk");
        view(1, dir > 0);
        emote("...");
        lockUntil = t + 1400;
      } else if (kind === "bet") {
        setMode("hop");
        view(2, dir > 0);
        lockUntil = t + 450;
      }
      nextThink = lockUntil + 300;
    }
    /* 2 · reads the road: dragon ≥ 5 or chop ≥ 6 → holds up a sign */
    let lastRoad = "";
    function readRoad() {
      const hist: RoadCell[] = S.hist;
      if (!hist.length) return;
      let run = 1;
      for (let i = hist.length - 1; i > 0 && hist[i] === hist[i - 1]; i--) run++;
      let alt = 1;
      for (let i = hist.length - 1; i > 0 && hist[i] !== hist[i - 1]; i--) alt++;
      const key = run >= 5 ? "d" + run : alt >= 6 ? "c" + alt : "";
      if (key && key !== lastRoad) {
        sign(run >= 5 ? `DRAGON ×${run} ${hist[hist.length - 1] === "u" ? "▲" : "▼"}` : "choppy…");
        if (!G.on) {
          setMode("hop");
          view(3, dir > 0);
          lockUntil = perf() + 500;
        }
      }
      lastRoad = key;
    }
    try {
      G.hi = +localStorage.getItem("lynxHi")! || 0;
    } catch (e) {
      /* private mode */
    }
    /* new here? → points at ⓘ once, 8 s in, if nothing has been played */
    let hinted = false;
    timers.push(
      setTimeout(() => {
        if (!hinted && !G.on && !S.done.length && !S.calls.length && !S.last.length && !FX) {
          hinted = true;
          sign("new here? tap ⓘ ↗");
          setMode("hop");
          view(3, true);
          lockUntil = perf() + 600;
        }
      }, 8000),
    );
    /* 4 · runner game while the table is paused (Chrome-dino moment) */
    const hud = $("#ghud"),
      hudT = $("#ghudT"),
      hudS = $("#ghudS");
    function gameStart() {
      if (G.on) return;
      G.on = true;
      G.rocks = [];
      G.score = 0;
      G.dead = false;
      G.t0 = perf();
      G.next = G.t0 + 900;
      x = 36;
      el.style.setProperty("--x", x + "px");
      setMode("run");
      view(2, true);
      win.classList.add("game");
      hud.hidden = false;
      hudT.textContent = (S.paused === "full" ? "TABLE FULL" : "TABLE PAUSED") + " · TAP TO JUMP";
    }
    function gameStop() {
      if (!G.on) return;
      G.on = false;
      G.rocks = [];
      win.classList.remove("game");
      hud.hidden = true;
      setMode("idle");
      view(0, dir > 0);
      nextThink = perf() + 600;
    }
    function jump() {
      if (!G.on) return;
      const t = perf();
      if (G.dead) {
        G.on = false;
        gameStart();
        return;
      }
      if (t < G.jumpUntil) return;
      G.jumpUntil = t + 520;
      setMode("jump");
      sfx.jump();
      setTimeout(() => {
        if (G.on && !G.dead) setMode("run");
      }, 540);
    }
    on(win, "click", () => jump());
    on(document, "keydown", (e: KeyboardEvent) => {
      if (e.code === "Space" && G.on) {
        e.preventDefault();
        jump();
      }
    });
    /** draws the meteors in the space window's pixel space (PX-upscaled canvas) */
    function gameTick(t: number, ctx: any, SW: number, SH: number, PX: number) {
      if (!G.on) return;
      const lx = x / PX,
        lw = 60 / PX;
      if (!G.dead) {
        G.score = Math.floor((t - G.t0) / 100);
        if (t >= G.next) {
          G.rocks.push({ x: SW + 4, w: 5 + Math.random() * 3, h: 5 + Math.random() * 5 });
          G.next = t + 900 + Math.random() * 900 - Math.min(500, (t - G.t0) / 40);
        }
        const sp = (0.16 + Math.min(0.14, (t - G.t0) / 60000)) * (16 / PX);
        for (const r of G.rocks) r.x -= sp;
        G.rocks = G.rocks.filter((r: any) => r.x > -14);
        const air = t < G.jumpUntil - 120 && t > G.jumpUntil - 470;
        for (const r of G.rocks) {
          if (r.x < lx + lw * 0.75 && r.x + r.w > lx + lw * 0.25 && !air) {
            G.dead = true;
            setMode("dead");
            sfx.crash();
            hudT.textContent = "CRASH · TAP TO RETRY";
            if (G.score > G.hi) {
              G.hi = G.score;
              try {
                localStorage.setItem("lynxHi", String(G.hi));
              } catch (e) {
                /* private mode */
              }
            }
          }
        }
      }
      for (const r of G.rocks) {
        const y = SH - 5 - r.h;
        ctx.fillStyle = "rgba(255,120,40,.35)";
        ctx.fillRect(r.x + r.w, y + 1, 6, r.h - 2);
        ctx.fillStyle = "rgba(255,200,60,.5)";
        ctx.fillRect(r.x + r.w, y + 2, 3, r.h - 4);
        ctx.fillStyle = "#b9c2cf";
        ctx.fillRect(r.x + 1, y, r.w - 2, r.h);
        ctx.fillRect(r.x, y + 1, r.w, r.h - 2);
        ctx.fillStyle = "#5b6478";
        ctx.fillRect(r.x + 1, y + 1, 1, 1);
      }
      hudS.textContent = G.score + (G.hi ? " · HI " + G.hi : "");
    }
    return { react, readRoad, gameStart, gameStop, gameTick, G };
  })();

  /* ---------- space window (designer's pixel art, 3× upscaled) ---------- */
  (() => {
    const sp = $("#space");
    if (!sp) return;
    const sctx = sp.getContext("2d");
    let SW = 0,
      SH = 0,
      stars: any[] = [],
      rocks: any[] = [];
    const PX = 3;
    function makeRock(cx: number, w: number, h: number, seed: number) {
      const pts: any[] = [];
      let r = seed;
      const rnd = () => {
        r = (r * 9301 + 49297) % 233280;
        return r / 233280;
      };
      for (let xx = -w / 2; xx <= w / 2; xx++) {
        const k = 1 - Math.pow(Math.abs(xx) / (w / 2), 1.6);
        pts.push({ x: cx + xx, h: Math.max(0, Math.round(h * k + (rnd() - 0.5) * 3)) });
      }
      const craters: any[] = [];
      for (let i = 0; i < 6; i++) craters.push({ x: cx + (rnd() - 0.5) * w * 0.7, y: rnd() * h * 0.6, r: 1 + rnd() * 3 });
      return { pts, craters };
    }
    function sizeSpace() {
      const r = sp.getBoundingClientRect();
      SW = Math.max(1, Math.floor(r.width / PX));
      SH = Math.max(1, Math.floor(r.height / PX));
      sp.width = SW;
      sp.height = SH;
      stars = Array.from({ length: Math.round((SW * SH) / 90) }, () => ({ x: Math.random() * SW, y: Math.random() * SH * 0.85, z: Math.random(), tw: Math.random() * 6 }));
      rocks = [makeRock(SW * 0.2, SW * 0.34, SH * 0.5, 7), makeRock(SW * 0.82, SW * 0.3, SH * 0.62, 13), makeRock(SW * 0.52, SW * 0.1, SH * 0.16, 21)];
    }
    const ro = new ResizeObserver(sizeSpace);
    ro.observe($("#dWin"));
    disposers.push(() => ro.disconnect());
    raf((t) => {
      if (!SW) return;
      sctx.fillStyle = "#00030a";
      sctx.fillRect(0, 0, SW, SH);
      const game = Lx.G.on;
      for (const s of stars) {
        s.x -= (0.02 + s.z * 0.05) * (RM ? 0 : game ? 4 : 1);
        if (s.x < 0) s.x += SW;
        const b = 0.5 + 0.5 * Math.sin(t / 400 + s.tw);
        if (s.z > 0.92) {
          sctx.fillStyle = `rgba(255,240,170,${0.6 + 0.4 * b})`;
          sctx.fillRect(s.x | 0, s.y | 0, 1, 1);
          if (b > 0.7) {
            sctx.fillRect((s.x | 0) - 1, s.y | 0, 3, 1);
            sctx.fillRect(s.x | 0, (s.y | 0) - 1, 1, 3);
          }
        } else {
          sctx.fillStyle = s.z > 0.6 ? `rgba(150,200,255,${0.4 + 0.5 * b})` : `rgba(255,255,255,${0.25 + 0.4 * b})`;
          sctx.fillRect(s.x | 0, s.y | 0, 1, 1);
        }
      }
      if (game) {
        sctx.fillStyle = "#2a3a52";
        sctx.fillRect(0, SH - 5, SW, 5);
        Lx.gameTick(t, sctx, SW, SH, PX);
        return;
      }
      for (const r of rocks) {
        for (const p of r.pts) {
          if (!p.h) continue;
          const y = SH - p.h;
          sctx.fillStyle = "#8f96a6";
          sctx.fillRect(p.x | 0, y, 1, p.h);
          sctx.fillStyle = "#c5cad6";
          sctx.fillRect(p.x | 0, y, 1, 1);
          sctx.fillStyle = "#5f6575";
          sctx.fillRect(p.x | 0, (y + Math.max(2, p.h * 0.55)) | 0, 1, p.h);
        }
        sctx.fillStyle = "#5f6575";
        for (const c of r.craters) {
          const base = r.pts.find((p: any) => Math.abs(p.x - c.x) < 1);
          if (!base || base.h < c.y + 3) continue;
          sctx.beginPath();
          sctx.ellipse(c.x, SH - base.h + c.y + 2, c.r, c.r * 0.6, 0, 0, 7);
          sctx.fill();
        }
      }
    });
  })();

  /* ---------- live line: Binance's book over WebSocket, shifted onto the index ----------
     The index ticks once a second (Supabase); the market moves many times a second. The line
     between index points follows Binance's best bid/ask mid plus the latest (index − Binance)
     basis, so it passes through the index points and still wiggles like the real book.
     Settlement never reads it (CPO 2026-10-28: 做到 mock 那种"一直在扭"). */
  let ws: WebSocket | null = null,
    wsAlive = 0,
    wsTimer: any = 0;
  const liveOn = () => perf() - wsAlive < 3000 && S.live.length > 1;
  function wsOpen() {
    if (FX || !alive) return;
    try {
      ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@bookTicker");
    } catch (e) {
      ws = null;
      return;
    }
    ws.onmessage = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        const mid = (+d.b + +d.a) / 2;
        if (!mid) return;
        wsAlive = perf();
        S.wsMid = mid;
        const t = now();
        S.liveP = anchored(mid, t);
        const last = S.live[S.live.length - 1];
        if (!last || t - last.t >= 100) {
          S.live.push({ t, m: mid });
          if (S.live.length > 600) S.live.shift();
        } else last.m = mid;
      } catch (err) {
        /* ignore a bad frame */
      }
    };
    ws.onclose = () => {
      ws = null;
      if (alive) wsTimer = setTimeout(wsOpen, 3000);
    };
    ws.onerror = () => {
      try {
        ws?.close();
      } catch (e) {
        /* already closed */
      }
    };
  }
  wsOpen();
  disposers.push(() => {
    clearTimeout(wsTimer);
    try {
      ws?.close();
    } catch (e) {
      /* already closed */
    }
    ws = null;
  });

  /* ---------- clocks ---------- */
  const cv = $("#cv");
  let lastF = perf();
  raf((tf) => {
    const dt = Math.min(100, tf - lastF);
    lastF = tf;
    if (!FX) {
      if (S.basisT !== S.basis) S.basis += (S.basisT - S.basis) * Math.min(1, dt / 700);
      // the head (big price, dot, price tag) rides the drawn line, like the mock
      let target = liveOn() ? S.liveP : S.price;
      if (texOn() && S.px.length) {
        const ser = texSeries(now() - 1000);
        if (ser.length) target = ser[ser.length - 1].p;
      }
      if (target) S.disp += (target - S.disp) * Math.min(1, dt / (texOn() ? 60 : liveOn() ? 120 : 420)); // ease the head toward the latest print
    }
    draw(cv);
  });
  every(() => renderPriceBig(), 100);
  every(() => {
    if (liveOn()) S.price = S.liveP;
    loop();
    render();
    slotLoop();
  }, 250);
  every(() => void poll(), 1000);
  every(() => void pollFeed(), 2500);
  every(() => void reconcile(), 15000);
  every(() => renderRoads(), 30000);
  const ro = new ResizeObserver(() => renderRoads());
  const roadEl = $("#road");
  if (roadEl) ro.observe(roadEl);
  disposers.push(() => ro.disconnect());

  /* ---------- boot ---------- */
  eqEls().forEach((e) => (e.textContent = money(S.bal)));
  if (FX) {
    FX.ticks.forEach((t) => adoptTick(t));
    S.paused = FX.state?.paused_reason || null;
    if (S.paused) Lx.gameStart();
    S.feed = FX.feed || [];
    S.roadRows = FX.road || [];
    rebuildRoad();
    S.slotStart = Math.floor(now() / SLOT) * SLOT;
    FX.calls.forEach((r) => {
      const c = fromRow(r);
      if (c.status === "open" || c.status === "pending") S.calls.push(c);
      else S.done.push(c);
    });
    if (FX.session) {
      S.last = FX.session.last.slice();
      S.won = S.last.filter(Boolean).length;
      S.lost = S.last.length - S.won;
      S.ses = S.done.reduce((a: number, c: Call) => a + c.pnl, 0);
      let w = 0,
        l = 0;
      for (let i = S.last.length - 1; i >= 0; i--) {
        if (S.last[i]) {
          if (l) break;
          w++;
        } else {
          if (w) break;
          l++;
        }
      }
      S.streakW = w;
      S.streakL = l;
      let run = 0;
      S.last.forEach((x: boolean) => {
        run = x ? run + 1 : 0;
        S.bestRun = Math.max(S.bestRun, run);
      });
      S.bigWin = S.done.reduce((a: number, c: Call) => (c.status === "won" ? Math.max(a, c.pnl) : a), 0);
      S.sesStakes = S.done.filter((c: Call) => c.status === "won" || c.status === "lost").map((c: Call) => c.gross);
      S.sesStart = now() - 23 * 60000;
      S.played = true;
      const runCalls = S.done.filter((c: Call) => c.status === "won").slice(0, w);
      S.runPnl = runCalls.reduce((a: number, c: Call) => a + c.pnl, 0);
      S.runStake = runCalls.reduce((a: number, c: Call) => a + c.gross, 0);
      S.runBig = runCalls.reduce((a: number, c: Call) => Math.max(a, c.pnl), 0);
    }
    if (FX.calls.length) S.played = true;
    S.vToday = FX.vouchersToday || 0;
    if (FX.session && S.streakW >= 2) comboUpdate(FX.comboEvent || "boot");
    if (FX.ack === false) openGate(true);
    renderRoads();
    slotLoop();
    render();
    renderPrice();
  } else void boot();

  /* ---------- public setters (React → engine) ---------- */
  (root as any).__arcade = {
    setBalance(v: number) {
      if (!api.userId) return;
      if (Math.abs(v - S.bal) > 0.005 && !S.calls.some((c: Call) => c.status === "pending")) {
        S.bal = v;
        eqEls().forEach((e) => (e.textContent = money(S.bal)));
      }
    },
    /** QA peek at the price seams (index vs the drawn line); not used by the page */
    debug: () => ({
      index: S.price,
      tick: S.px[S.px.length - 1] || null,
      line: S.liveP,
      // every call: does its open / settle print exist in the tick history the line is drawn from?
      calls: S.calls.map((c: Call) => ({ id: c.id, status: c.status, t0: c.t0, s0: c.s0, s0OnLine: c.s0 != null && printTime(c.s0, c.t0 - 1, 0) > 0, s1: c.s1, s1OnLine: c.s1 != null && printTimeBefore(c.s1, c.t1 + 1, 0) > 0 })),
      series: lineSeries(now() - 45000).length, basis: S.basis, basisTarget: S.basisT, binanceMid: S.wsMid, tickAgeMs: S.tick ? now() - ms(S.tick.ts) : null }),
    setUser() {
      renderAuth();
      if (api.userId && !FX) {
        S.ackKnown = false;
        S.noAck = 0;
        void boot();
      }
    },
  };

  return () => {
    alive = false;
    timers.forEach((t) => {
      clearInterval(t);
      clearTimeout(t);
    });
    clearTimeout(settleT);
    clearTimeout(toastT);
    clearTimeout(coalesce);
    disposers.forEach((d) => d());
    delete (root as any).__arcade;
  };
}
