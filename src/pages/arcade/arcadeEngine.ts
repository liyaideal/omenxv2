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
// Clock: everything runs on SERVER time (arcade_table_now().now − Date.now()
// gives the offset) so t0 / t1 / tick timestamps line up with the chart.
// ============================================================
import {
  ARCADE_CHIPS_V2,
  ARCADE_CANCEL_MS,
  ARCADE_DURATION_MS,
  ARCADE_MAX_OPEN,
  acceptTerms,
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
  tableNow: async () => ({ tick: null, state: null, params: {}, now: new Date().toISOString(), my_open: 0, ack: null }),
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
  username: string;
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
}

const C = { up: "#33d6ff", dn: "#cfff4a", cy: "#05d7ed", hot: "#ff5c5c" };
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
    histInfo: [] as RoadSlotInfo[],
    /** a tapped road cell holds THIS SLOT until this time (perf ms) */
    peekUntil: 0,
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
  };
  const myOpen = () => S.calls.filter((c: Call) => c.status === "open" || c.status === "pending" || c.status === "settling");
  const openStake = () => myOpen().reduce((a: number, c: Call) => a + c.gross, 0);
  const nextT1 = () => Math.min(...myOpen().map((c: Call) => c.t1));
  const maxAge = () => Number(S.params?.tick_max_age_ms) || 4000;
  const liveQuote = () => !!(S.tick && S.tick.valid && S.pUp != null && now() - ms(S.tick.ts) < maxAge());

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
  /** "12:34:00 · ▲ +$39.46 · $80,101.44 → $80,140.90" — what one road cell was */
  function slotText(i: number): string {
    const info: RoadSlotInfo | undefined = S.histInfo[i];
    const cell = S.hist[i];
    if (!info) return "";
    if (info.carried || info.open == null || info.close == null) return `${clockOf(info.t)} · no index print · colour carried over`;
    const d = info.close - info.open;
    return `${clockOf(info.t)} · ${cell === "u" ? "▲ +" : "▼ −"}$${Math.abs(d).toFixed(2)} · ${money(info.open)} → ${money(info.close)}`;
  }
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
    for (const pre of ["", "m_"]) {
      const b = $("#" + pre + "bead");
      if (!b) continue;
      const from = Math.max(0, Math.ceil((n + 1) / 6) - 6) * 6;
      b.innerHTML = hist.slice(from).map((x, i) => `<span class="bead ${x}${newest && from + i === n - 1 ? " pop" : ""}" data-i="${from + i}" title="${slotText(from + i)}"></span>`).join("") + '<span class="bead ghost"></span>';
      $("#" + pre + "beadN").textContent = String(n - from);
      const rd = $("#" + pre + "road"),
        { cells, cols } = buildRoad(hist);
      const fit = Math.max(6, Math.floor((rd.clientWidth + 2) / 11)),
        first = Math.max(0, cols - fit);
      rd.innerHTML = cells
        .filter((q) => q.c >= first)
        .map((q) => `<span class="cell ${q.s}${newest && q.i === n - 1 ? " pop" : ""}" data-i="${q.i}" title="${slotText(q.i)}" style="grid-column:${q.c - first + 1};grid-row:${q.r + 1}"></span>`)
        .join("");
      const nu = hist.filter((x) => x === "u").length;
      $("#" + pre + "nUp").textContent = String(nu);
      $("#" + pre + "nDn").textContent = String(n - nu);
      $("#" + pre + "nSlots").textContent = String(n);
      let best = { s: "u", n: 0 },
        cur = { s: hist[0], n: 0 };
      for (const x of hist) {
        cur = cur.s === x ? { s: x, n: cur.n + 1 } : { s: x, n: 1 };
        if (cur.n > best.n) best = { ...cur };
      }
      $("#" + pre + "longest").textContent = n ? (best.s === "u" ? "Up" : "Down") + " ×" + best.n : "—";
    }
    const pk = $("#mPeekRoad");
    if (pk) {
      const h = hist.slice(-10).map((x) => `<i class="${x}"></i>`).join("");
      if (pk.innerHTML !== h) pk.innerHTML = h;
    }
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
    if (S.peekUntil > perf()) return;
    for (const pre of ["", "m_"]) {
      const e = $("#" + pre + "slotLbl");
      if (e) e.textContent = "THIS SLOT · " + (S.slotOpen != null && S.price ? (S.price >= S.slotOpen ? "▲ +" : "▼ −") + Math.abs(S.price - S.slotOpen).toFixed(2) + " · " : "") + Math.max(0, Math.ceil((cur + SLOT - w) / 1000)) + "s";
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
      deny(side, `$${ARCADE_MAX_OPEN} max open per account`);
      toast(`$${ARCADE_MAX_OPEN} max open per account`, true);
      return;
    }
    if (S.chip > S.bal + 1e-9) {
      deny(side, "Not enough in your spot account");
      return;
    }
    if (S.lastCallAt && now() - S.lastCallAt > ARCADE_SESSION_GAP_MS) newSession();
    S.lastCallAt = now();
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
    render();
    try {
      const row = await data.place(side === "u" ? "up" : "down", g, S.quoteTs!);
      const real = fromRow(row);
      Object.assign(c, { id: real.id, t0: real.t0, t1: real.t1, p: real.p, pay: real.pay, status: "open" });
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
      toast(`Cancelled · ${money(r.cancel_fee)} close fee`);
    } catch (e: any) {
      toast(String(e?.message || "Could not cancel"), true);
    }
    render();
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
        if (c && (c.status === "open" || c.status === "settling")) applySettled(c, r.status as any, r.pnl, r.s0, r.s1);
      }
    } catch (e) {
      /* retry below */
    }
    const due = S.calls.filter((c: Call) => c.status === "settling");
    if (due.length && settleTries++ < 8) scheduleSettle(900);
    else settleTries = 0;
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
    S.sesStart = now();
    S.sessionStart = new Date(now()).toISOString();
    $$(".combo").forEach((el) => {
      el.className = "combo";
      const sub = el.querySelector(".sub"),
        pips = el.querySelector(".pips");
      if (sub) sub.textContent = "";
      if (pips) pips.innerHTML = "";
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
    let run = 0;
    settled.forEach((r) => {
      run = r.status === "won" ? run + 1 : 0;
      S.bestRun = Math.max(S.bestRun, run);
    });
    if (w >= 2 || l >= 2) comboUpdate("boot");
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
    if (S.done.length > 12) S.done.pop();
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
        due = true;
      }
    }
    if (due && !settleT) scheduleSettle(650);
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
        } else if ((loc.status === "open" || loc.status === "settling") && (real.status === "won" || real.status === "lost" || real.status === "void")) {
          applySettled(loc, real.status, real.pnl, real.s0, real.s1);
        } else if (loc.status === "open" && real.status === "cancelled") {
          loc.status = "cancelled";
          loc.tDone = now();
        } else if (loc.status === "open" && real.s0 != null && loc.s0 == null) loc.s0 = real.s0;
      }
      S.done.sort((a: Call, b: Call) => (b.settledAt || 0) - (a.settledAt || 0));
      if (S.done.length > 12) S.done.length = 12;
    } catch (e) {
      /* next time */
    }
  }

  /* ---------- combo HUD ---------- */
  function comboUpdate(status: string) {
    const hot = S.streakW >= 2,
      cold = S.streakL >= 2,
      n = hot ? S.streakW : cold ? S.streakL : 0;
    $$(".combo").forEach((el) => {
      const big = el.querySelector(".big"),
        pips = el.querySelector(".pips"),
        sub = el.querySelector(".sub");
      if (status === "void") return;
      if (!hot && !cold) {
        if (el.classList.contains("on") && !el.classList.contains("break")) {
          big.textContent = el.classList.contains("cold") ? "STREAK OVER" : "COMBO BREAK";
          el.classList.add("break");
          sub.textContent = "";
          pips.innerHTML = "";
          setTimeout(() => (el.className = "combo"), 700);
        }
        return;
      }
      el.className = "combo on" + (cold ? " cold" : "");
      big.textContent = (cold ? "LOST ×" : "COMBO ×") + n;
      big.classList.remove("punch");
      void big.offsetWidth;
      big.classList.add("punch");
      const next = Math.ceil(n / 3) * 3,
        base = next - 3;
      pips.innerHTML = [0, 1, 2].map((i) => `<i class="${n - base > i ? "on" : ""}"></i>`).join("");
      sub.textContent = n % 3 === 0 ? (cold ? "ouch" : "bonus!") : `${next - n} more → ${cold ? "×" + next : "×" + next + " bonus"}`;
    });
    if (n && n % 3 === 0 && status !== "boot") {
      // a streak restored from history shows the HUD but earns no fireworks
      mega(cold, n);
      Lx.react(cold ? "cold" : "combo");
      if (!cold) {
        rain(C.dn, 70);
        const e = eqEls()[0];
        if (e) {
          const c = center(e);
          burst(c.x, c.y, C.dn, 30, true);
        }
        sfx.big();
      } else {
        flash(C.hot);
        sfx.cold();
      }
    }
  }
  function mega(cold: boolean, n: number) {
    $$(".mega").forEach((el) => {
      el.querySelector(".t").textContent = cold ? "×" + n + " LOST" : "×" + n + " COMBO";
      el.querySelector(".s").textContent = cold ? "take a breath · streak resets on a win" : "keep it rolling · next bonus at ×" + (n + 3);
      el.className = "mega on" + (cold ? " cold" : "");
      clearTimeout(el._t);
      el._t = setTimeout(() => (el.className = "mega"), 1600);
    });
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
    ch.className = "mchip fly v" + c.gross;
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
  /** what the line is drawn from: index ticks up to where the live feed starts, then the live book */
  function lineSeries(from: number): { t: number; p: number }[] {
    if (!liveOn()) return S.px.filter((x: any) => x.t >= from);
    const first = S.live[0].t;
    return S.px.filter((x: any) => x.t >= from && x.t < first - 200).concat(S.live.filter((x: any) => x.t >= from));
  }
  function geom(cv: any) {
    const W = cv.clientWidth,
      H = cv.clientHeight,
      t = now(),
      t0 = t - 45000,
      t1 = t + 32000;
    const open = S.calls.filter((c: Call) => c.s0 != null);
    const ps = lineSeries(t0).map((x: any) => x.p).concat(open.map((c: Call) => c.s0));
    if (S.slotOpen != null) ps.push(S.slotOpen);
    if (S.disp) ps.push(S.disp);
    let lo = Math.min(...ps),
      hi = Math.max(...ps);
    if (!isFinite(lo)) {
      lo = (S.price || 0) - 30;
      hi = (S.price || 0) + 30;
    }
    // fit the real range: BTC often moves only cents for a while — a $8 floor turned that into a flat line
    const pad = Math.max((hi - lo) * 0.25, 1.5);
    lo -= pad;
    hi += pad;
    return { W, H, x: (tt: number) => ((tt - t0) / (t1 - t0)) * W, y: (p: number) => H - ((p - lo) / (hi - lo)) * (H - 8) - 4 };
  }
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
      t = now();
    /* 30 s slot grid = the road's cells, shaded by result; the last one is the slot in progress */
    const curStart = S.slotStart || Math.floor(t / SLOT) * SLOT;
    for (let j = -2; j < 40; j++) {
      const st = curStart - j * SLOT,
        en = st + SLOT;
      if (en < t - 45000 || st > t + 32000) continue;
      const x0 = Math.max(0, g.x(st)),
        x1 = Math.min(W, g.x(en));
      const res = j >= 1 ? S.hist[S.hist.length - j] : null;
      ctx.fillStyle = res === "u" ? "rgba(51,214,255,.07)" : res === "d" ? "rgba(207,255,74,.07)" : j === 0 ? "rgba(255,255,255,.035)" : "transparent";
      ctx.fillRect(x0, 34, x1 - x0, H - 34);
      ctx.font = "600 9px Chakra Petch";
      if (j === 0) {
        ctx.fillStyle = "#5d6676";
        ctx.fillText("SLOT · " + Math.max(0, Math.ceil((en - t) / 1000)) + "s", x0 + 4, H - 6);
      }
      ctx.strokeStyle = "#1c2a33";
      ctx.beginPath();
      ctx.moveTo(g.x(st), 34);
      ctx.lineTo(g.x(st), H);
      ctx.stroke();
      if (res) {
        ctx.fillStyle = res === "u" ? C.up : C.dn;
        ctx.font = "700 9px Chakra Petch";
        ctx.fillText(res === "u" ? "▲" : "▼", x0 + 4, H - 6);
      }
    }
    /* grid + now line */
    ctx.strokeStyle = "#15262e";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (H * i) / 5);
      ctx.lineTo(W, (H * i) / 5);
      ctx.stroke();
    }
    const xn = g.x(t);
    ctx.fillStyle = "rgba(51,214,255,.06)";
    ctx.fillRect(xn, 0, W - xn, H);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#2a4a56";
    ctx.beginPath();
    ctx.moveTo(xn, 0);
    ctx.lineTo(xn, H);
    ctx.stroke();
    ctx.setLineDash([]);
    /* faint vertical grid (designer's CRT feed) */
    ctx.strokeStyle = "rgba(51,214,255,.05)";
    for (let gx = 0; gx < W; gx += 24) {
      ctx.beginPath();
      ctx.moveTo(gx + 0.5, 34);
      ctx.lineTo(gx + 0.5, H);
      ctx.stroke();
    }
    /* the slot's open: dashed reference, the line is cyan above it and lime below */
    const ref = S.slotOpen ?? S.price;
    if (ref) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(238,242,248,.22)";
      ctx.beginPath();
      ctx.moveTo(0, Math.round(g.y(ref)) + 0.5);
      ctx.lineTo(W, Math.round(g.y(ref)) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    /* price line: one point per valid second, the head eased toward the latest index; gaps where the index was invalid */
    const useLive = liveOn();
    const pts = lineSeries(t - 45000);
    if (pts.length > 1 || (pts.length && S.disp)) {
      const col = S.disp >= ref ? C.up : C.dn;
      const headX = Math.min(g.x(t), g.x(pts[pts.length - 1].t) + 40),
        headY = g.y(S.disp);
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
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      /* area under the line */
      ctx.lineTo(headX, H);
      ctx.lineTo(g.x(pts[0].t), H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 34, 0, H);
      grad.addColorStop(0, col + "38");
      grad.addColorStop(1, col + "00");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(headX, headY, 3, 0, 7);
      ctx.fill();
      if (useLive) {
        ctx.fillStyle = "rgba(238,242,248,.45)";
        for (const p of S.px) {
          if (p.t < t - 45000) continue;
          ctx.fillRect(Math.round(g.x(p.t)) - 1, Math.round(g.y(p.p)) - 1, 2, 2);
        }
      }
    }
    /* calls: entry dot + open line, settled badges */
    const live = S.calls.filter((c: Call) => c.s0 != null || c.status === "pending" || c.status === "open").sort((a: Call, b: Call) => a.t1 - b.t1);
    live.forEach((c: Call, i: number) => {
      const col = c.side === "u" ? C.up : C.dn;
      const isLive = c.status === "open" || c.status === "settling" || c.status === "pending";
      const s0 = c.s0 ?? S.price;
      const ahead = c.side === "u" ? S.price > s0 : S.price < s0;
      const x0 = g.x(c.t0),
        x1 = g.x(c.t1),
        y = g.y(s0);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = isLive ? (c.s0 == null ? "#8a93a3" : ahead ? col : "#5a6676") : c.status === "won" ? C.dn : c.status === "lost" ? "#ff4d4d" : "#889";
      ctx.globalAlpha = isLive ? (i < 6 ? 0.9 : 0.3) : 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(Math.min(x1, W), y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.globalAlpha = i < 6 || !isLive ? (isLive ? 1 : 0.6) : 0.55;
      ctx.beginPath();
      ctx.moveTo(x0, y - 4);
      ctx.lineTo(x0 + 4, y);
      ctx.lineTo(x0, y + 4);
      ctx.lineTo(x0 - 4, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      if (!isLive && c.s1 != null) {
        const ys = g.y(c.s1);
        const won = c.status === "won";
        const bc = won ? C.dn : c.status === "lost" ? "#ff4d4d" : "#aab";
        ctx.strokeStyle = bc;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x1, ys);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = bc;
        ctx.beginPath();
        ctx.arc(x1, ys, 7, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#020c10";
        ctx.font = "700 10px Chakra Petch";
        ctx.fillText(won ? "✓" : c.status === "lost" ? "✕" : "–", x1 - 4, ys + 4);
      }
    });
    /* settle burst: expanding ring + the open line flashes solid */
    for (const b of S.bursts) {
      const k = (perf() - b.t) / 900,
        c: Call = b.c;
      if (c.s0 == null) continue;
      const x1 = g.x(c.t1),
        ys = g.y(c.s1 ?? c.s0),
        col = c.status === "won" ? C.dn : c.status === "lost" ? "#ff4d4d" : "#aab";
      ctx.strokeStyle = col;
      ctx.globalAlpha = 1 - k;
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
    /* flag lane: two rows (even / odd seconds) so neighbours never overlap */
    const groups: Record<number, Call[]> = {};
    for (const c of live) {
      const k = Math.floor(c.t1 / 1000);
      (groups[k] = groups[k] || []).push(c);
    }
    const keys = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);
    ctx.fillStyle = "rgba(5,10,14,.55)";
    ctx.fillRect(0, 0, W, 34);
    keys.forEach((k, ki) => {
      const cs = groups[k],
        c = cs[0];
      const x1 = g.x(c.t1);
      if (x1 < -30 || x1 > W + 4) return;
      const row = ki % 2,
        y = 4 + row * 15;
      const isLive = cs.some((z) => z.status === "open" || z.status === "settling" || z.status === "pending"),
        settling = cs.some((z) => z.status === "settling");
      const won = cs.filter((z) => z.status === "won").length,
        lost = cs.filter((z) => z.status === "lost").length;
      const fill = settling ? "#fff" : isLive ? (cs.every((z) => z.side === c.side) ? (c.side === "u" ? C.up : C.dn) : "#dfe6ee") : won && !lost ? C.dn : lost && !won ? "#ff4d4d" : "#aab";
      ctx.fillStyle = fill;
      ctx.fillRect(x1 - 1, y, 2, 13);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x1 + 28, y);
      ctx.lineTo(x1 + 24, y + 6);
      ctx.lineTo(x1 + 28, y + 12);
      ctx.lineTo(x1, y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#020c10";
      ctx.font = "700 9px Chakra Petch";
      const secs = Math.max(0, Math.ceil((c.t1 - t) / 1000));
      const txt = settling ? "…" : isLive ? secs + "s" : won && !lost ? "✓" : lost && !won ? "✕" : won + "/" + cs.length;
      ctx.fillText(txt + (cs.length > 1 ? " ×" + cs.length : ""), x1 + 3, y + 9);
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
  }

  /* ---------- render: keys, rail, boards, price ---------- */
  const chipCls = (v: number) => "v" + v;
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
  function ringSvg(frac: number) {
    const r = 17,
      c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" fill="none" stroke="rgba(2,12,16,.25)" stroke-width="3"/><circle cx="20" cy="20" r="${r}" fill="none" stroke="#020c10" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 20 20)"/></svg>`;
  }
  function ringSvgLime(frac: number, side: Side) {
    const r = 17,
      c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" fill="none" stroke="#1b2630" stroke-width="3"/><circle cx="20" cy="20" r="${r}" fill="none" stroke="${side === "u" ? C.up : C.dn}" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 20 20)"/></svg>`;
  }
  const lastHtml: Record<string, string> = {};
  function renderKeys() {
    for (const side of ["u", "d"] as Side[]) {
      const key = keyOf(side);
      const live = S.calls.filter((c: Call) => c.side === side && (c.status === "open" || c.status === "pending" || c.status === "settling"));
      const canc = live.filter((c: Call) => now() - c.t0 < ARCADE_CANCEL_MS - 150 && c.status !== "settling");
      const chips = live.filter((c: Call) => !canc.includes(c)).map((c: Call) => c.gross);
      const max = canc.length ? 4 : 5;
      const st = key.querySelector(".stack"),
        h = stackHtml(chips, max);
      if (lastHtml[side] !== h) {
        st.innerHTML = h;
        lastHtml[side] = h;
      }
      const rw = key.querySelector(".ringwrap");
      if (canc.length) {
        const c = canc[canc.length - 1],
          frac = 1 - (now() - c.t0) / (ARCADE_CANCEL_MS - 150);
        rw.innerHTML = `<span class="ring" data-id="${c.id}" role="button" aria-label="Cancel">${ringSvg(frac)}<span class="mchip ${chipCls(c.gross)}">${c.gross}</span></span>`;
      } else rw.innerHTML = "";
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
        txt = `tap chip to cancel · costs ${money(cancelFee(c.gross))}`;
      } else txt = `${whole(S.chip)} in · fee ${money(fee(S.chip))} · wins +${money(netWin(S.chip, p))} if ${SIDE(side)}`;
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
  let railTab = "auto";
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
        row.innerHTML = `<span class="sd ${side}">${side === "u" ? "UP" : "DN"}</span><span class="mid"><b>${whole(o.gross)} @ ${cents(o.p)} <span class="who">· ${o.mine ? "you" : o.who}</span></b></span><span class="st"></span>`;
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
      const sum = `<span class="u">UP · ${su.length}<b>${whole(su.reduce((a: number, o: ArcadeFeedRow) => a + o.gross, 0))}</b></span><span class="d">DOWN · ${sd.length}<b>${whole(sd.reduce((a: number, o: ArcadeFeedRow) => a + o.gross, 0))}</b></span>`;
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
    const dOpenN = $("#dOpenN");
    if (dOpenN) {
      dOpenN.textContent = String(open.length);
      $("#dOpenSum").textContent = whole(open.reduce((a: number, c: Call) => a + c.gross, 0));
      renderTable();
      const mine = live.filter((c: Call) => !c.tDone || t - c.tDone < 1400);
      const showTable = railTab === "table" || (railTab === "auto" && !mine.length);
      $("#dTable").hidden = !showTable;
      $("#dList").hidden = showTable;
      /* MY CALLS tab: the hint sits on top while the list is empty; TABLE tab: the UP / DOWN summary, no hint, no settled block */
      $("#dHint").hidden = showTable || !!mine.length;
      const tsum = $("#dTsum");
      if (tsum) tsum.hidden = !showTable;
      const dHead = $(".rail .donehead"),
        dPl = $("#dPlink");
      if (dHead) dHead.hidden = showTable || !S.done.length;
      if (dPl) dPl.hidden = showTable || S.done.length < 2;
      const dD = $("#dDone");
      if (dD && !mobile) dD.hidden = showTable;
      if (showTable) $("#dOpenSum").textContent = whole(tableStake());
      $$(".tab").forEach((b) => b.classList.toggle("on", (b.dataset.tab === "table") === showTable));
      const list = $("#dList");
      const want = mine.slice().reverse();
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
        } else if (c.status === "won" || c.status === "lost") st = signed(c.pnl);
        else if (c.status === "void") st = "VOID";
        else if (t - c.t0 < ARCADE_CANCEL_MS - 150) {
          st = "cancel";
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
          row.innerHTML = `<span class="sd ${c.side}">${c.side === "u" ? "UP" : "DN"}</span><span class="mid"><b>${whole(c.gross)} @ ${cents(c.p)}</b><small></small><span class="bar"><i></i></span></span><span class="st"></span>`;
        }
        row.className = `row ${c.side} ${c.status}`;
        const sm = row.querySelector("small"),
          // the rail is 280px wide: the payout moves down here, the open price lives on the chart's dotted line
          txt = `wins +${money(netWin(c.gross, c.p))} · ${Math.max(0, Math.ceil((c.t1 - t) / 1000))}s`;
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
      /* more rows below the fold → fade the bottom edge */
      list.classList.toggle("more", list.scrollHeight > list.clientHeight + 2 && list.scrollTop + list.clientHeight < list.scrollHeight - 2);
    }
    const dDone = $("#dDone");
    if (dDone) {
      const dh = S.done
        .slice(0, mobile ? 6 : 1)
        .map(
          (c: Call) =>
            `<div class="row ${c.side}"><span class="sd ${c.side}">${c.side === "u" ? "UP" : "DN"}</span><span class="mid"><b>${whole(c.gross)} @ ${cents(c.p)} · ${c.status === "won" ? "won" : c.status === "lost" ? "lost" : c.status === "cancelled" ? "cancelled" : "void"}</b><small>${c.s0 != null && c.s1 != null ? `open ${money(c.s0)} · close ${money(c.s1)}` : c.status === "cancelled" ? "taken back within 2 s" : "no valid price · refunded"}</small></span><span class="st ${c.status === "won" ? "ahead" : c.status === "lost" ? "behind" : "pend"}">${c.status === "void" ? "VOID" : signed(c.pnl)}</span></div>`,
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
      } else if (feedLive.length) {
        lbl = `TABLE<br>${feedLive.length}`;
        sh = feedLive
          .slice(0, 7)
          .map((o: ArcadeFeedRow) => {
            const frac = 1 - clip((t - ms(o.t0)) / ARCADE_DURATION_MS, 0, 1);
            return `<span class="mc other">${ringSvgLime(frac, sideOf(o.side))}<span class="mchip ${chipCls(o.gross)}">${o.gross}</span><span class="t">${Math.max(0, Math.ceil((ms(o.t1) - t) / 1000))}</span></span>`;
          })
          .join("");
      } else {
        lbl = "MY CALLS<br>0";
        sh = '<span class="hint">Tap UP or DOWN — your calls show here</span>';
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
    set("#dStreak", S.streakW >= 2 ? `${S.streakW} in a row` : S.streakL >= 2 ? `${S.streakL} lost in a row` : "");
    set("#dNext", mobile ? (open.length ? "NEXT · " + nextS + "s" : "") : "NEXT SETTLE · " + (open.length ? nextS + "s" : "—"));
    set("#mOpen", open.length ? `${open.length} · ${whole(stake)}` : "—");
    $$("#dYourOpen").forEach((e) => (e.textContent = whole(stake) + " / $" + ARCADE_MAX_OPEN));
  }
  function renderPriceBig() {
    const p = S.disp || S.price;
    const pe = $("#price");
    if (!pe) return;
    const txt = p ? money(p) : "$—";
    if (pe.textContent !== txt) pe.textContent = txt;
    const ref = S.slotOpen;
    const up = ref == null || p >= ref;
    pe.classList.toggle("up", up);
    pe.classList.toggle("dn", !up);
    const ch = $("#chg");
    if (ch) {
      const diff = ref == null ? 0 : p - ref;
      const ct = ref == null || !p ? "—" : `${up ? "▲ +" : "▼ −"}${money(diff)} this slot`;
      if (ch.textContent !== ct) ch.textContent = ct;
      ch.classList.toggle("up", up && ref != null);
      ch.classList.toggle("dn", !up);
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
    const ds = $("#dSrc");
    if (ds) ds.classList.toggle("paused", invalid);
    const msrc = $("#mSrc");
    if (msrc) msrc.classList.toggle("paused", invalid);
    const nValid = tk ? [tk.binance, tk.hyperliquid, tk.coinbase].filter((v) => v != null).length : 0;
    set("#dSrcState", invalid ? (tk && tk.reason ? "INDEX INVALID · " + tk.reason : "INDEX INVALID") : `LIVE · ${nValid} of 3`);
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
      S.px.push({ t: ms(tk.ts), p: tk.idx });
      if (S.px.length > 200) S.px.shift();
      S.lastPx = S.price;
      S.price = tk.idx;
      if (tk.binance != null) {
        S.basisT = tk.idx - tk.binance; // index − Binance mid: shifts the live line onto the index
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
    const cell = e.target.closest(".road .cell[data-i], .beads .bead[data-i]");
    if (cell) {
      // a tapped cell tells what that 30-second slot did, for a few seconds
      const i = Number(cell.dataset.i);
      $$(".cell.sel, .bead.sel").forEach((c) => c.classList.remove("sel"));
      $$(`.cell[data-i="${i}"], .bead[data-i="${i}"]`).forEach((c) => c.classList.add("sel"));
      const txt = slotText(i);
      S.peekUntil = perf() + 4000;
      $$("#slotLbl,#m_slotLbl").forEach((l) => (l.textContent = txt));
      setTimeout(() => $$(".cell.sel, .bead.sel").forEach((c) => c.classList.remove("sel")), 4000);
    }
  });

  /* ---------- wiring ---------- */
  on(root, "click", (e: any) => {
    const tab = e.target.closest(".tab");
    if (tab) {
      railTab = tab.dataset.tab;
      render();
      return;
    }
    const ring = e.target.closest(".ring");
    if (ring) {
      e.stopPropagation();
      const c = S.calls.find((x: Call) => x.id == ring.dataset.id);
      if (c) void cancel(c);
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
    if (key && !e.target.closest(".ring")) {
      void place(key.dataset.side);
      return;
    }
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
  on($("#fsBtn"), "click", () => {
    audio();
    sfx.key();
    try {
      document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen().catch(() => {});
    } catch (e) {
      /* unsupported */
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
        const p = mid + S.basis,
          t = now();
        S.liveP = p;
        const last = S.live[S.live.length - 1];
        if (!last || t - last.t >= 100) {
          S.live.push({ t, p });
          if (S.live.length > 600) S.live.shift();
        } else last.p = p;
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
      const target = liveOn() ? S.liveP : S.price;
      if (target) S.disp += (target - S.disp) * Math.min(1, dt / (liveOn() ? 120 : 420)); // ease the head toward the latest print
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
      if (w >= 2 || l >= 2) comboUpdate("boot");
    }
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
