/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Quick Play (arcade) engine — the designer's cabinet controller
// (artifact BKHuHJvFkzeLXQxLWBHxSF) ported 1:1 and wired to real data.
//
// Why a DOM controller and not React components: the cabinet is a game
// screen — two canvases, particle fx, a mascot, chip drag physics, a 100 ms
// price tick and a 60 fps clock. The designer's interaction layer is the
// spec (feedback_lovable_pixelmatch), so it is kept as written and only the
// data seams are replaced:
//   • rounds / price   ← public.arcade_rounds + the deterministic path
//   • orders           ← api.buy / api.sell (spot rail, executeSpotTrade)
//   • balance / today  ← api (spot_balance, closed arcade positions)
//   • auth             ← api.requireAuth() (chips bounce until signed in)
// React owns the shell (header, auth dialog, footer) in ArcadePage.tsx and
// mounts/unmounts this engine; everything below is scoped to `root`.
//
// Order semantics (CPO 2026-10-19):
//   chip → 1.5 s pending ring (tap to take back) → market buy on the spot rail
//   same side again → adds to the leg · opposite side → NET (ARCADE_FLIP="net",
//   CPO 2026-10-19): executeSpotTrade reduces the held leg share-for-share at
//   the implied price and opens the remainder on the other side — exactly what
//   every other spot trade on the platform does; "close-then-open" (sell the
//   held leg in full, then buy) stays available behind the constant
//   30s rounds: no cash out · 1m rounds: cash out (sell) any time before close
//   close == open → void, stakes returned (server) · stocks outside the US
//   cash session: table closed, chips bounce
// ============================================================
import {
  ARCADE_STEP_MS,
  arcadeEventName,
  arcadeNextOf,
  arcadePath,
  arcadePriceAt,
  type ArcadeRoundRow,
} from "@/lib/arcade/arcadePath";
import {
  ARCADE_ASSETS,
  fetchArcadeTable,
  nextUsSessionText,
  tfSeconds,
  usSessionOpen,
  type ArcadeTableSnapshot,
  type ArcadeTf,
} from "@/lib/arcade/arcadeTables";

export const ARCADE_FLIP: "close-then-open" | "net" = "net"; // CPO 2026-10-19: same netting as every other spot trade on the platform
export const ARCADE_PEND_MS = 1500;
export const ARCADE_FEE_RATE = 0.0015;
export const ARCADE_CHIPS = [10, 25, 50, 100, 500] as const;

export type Side = "u" | "d";

export interface ArcadeHolding {
  side: Side;
  sh: number;
  margin: number;
  avg: number;
  chips: number[];
  positionId?: string;
}

export interface ArcadeTradeResult {
  balanceDelta: number;
  realizedPnl?: number;
  positionId?: string;
  size?: number;
  margin?: number;
  entry?: number;
}

export interface ArcadeApi {
  isMobile: boolean;
  userId: string | null;
  requireAuth: () => void;
  getBalance: () => number;
  /** market buy `qty` shares of `side` at `price` (0–1); `amount` = chip incl. fee */
  buy: (a: { round: ArcadeRoundRow; side: Side; price: number; qty: number; fee: number; amount: number }) => Promise<ArcadeTradeResult>;
  /** sell `qty` shares of the held side at `price` */
  sell: (a: { round: ArcadeRoundRow; side: Side; price: number; qty: number }) => Promise<ArcadeTradeResult>;
  /** the open spot leg (if any) on this round for the signed-in user */
  loadHolding: (round: ArcadeRoundRow) => Promise<ArcadeHolding | null>;
  /** today's closed arcade legs (UTC day) */
  loadToday: () => Promise<{ net: number; won: number; lost: number; last: { s: Side; w: boolean; pnl: number; t: number }[] }>;
  referralLink: string;
  /** leave the zone (full-screen page: the cabinet carries its own exit key) */
  exit: () => void;
  username: string;
  avatarUrl?: string | null;
  onSettled?: () => void;
}

export interface ArcadeFixture {
  /** frozen wall clock — every countdown / price readout is computed at this instant */
  nowMs: number;
  snapshot: ArcadeTableSnapshot;
}

export interface ArcadeMountOptions {
  symbol: string;
  tf: ArcadeTf;
  onTableChange?: (symbol: string, tf: ArcadeTf) => void;
  /** style-guide: deterministic rounds + frozen clock, no network */
  fixture?: ArcadeFixture;
}

const C = { up: "#33d6ff", dn: "#cfff4a", cy: "#05d7ed", hot: "#ff5c5c" };
const money = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (n: number) => (n < 0 ? "−" : "+") + money(n);
const whole = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
const pad = (n: number) => String(n).padStart(2, "0");
const SIDE = (x: Side) => (x === "u" ? "Up" : "Down");
const chipCls = (v: number) => (v >= 500 ? "v500" : v >= 100 ? "v100" : v >= 50 ? "v50" : v >= 25 ? "v25" : "");
const round2 = (n: number) => Math.round(n * 100) / 100;
const fee = (amount: number) => round2(amount * ARCADE_FEE_RATE);

export function mountArcade(root: HTMLElement, api: ArcadeApi, opts: ArcadeMountOptions): () => void {
  const $ = (q: string) => root.querySelector(q) as any;
  const $$ = (q: string) => Array.from(root.querySelectorAll(q)) as any[];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const now = () => (opts.fixture ? opts.fixture.nowMs : Date.now());
  const disposers: (() => void)[] = [];
  const on = (el: any, ev: string, fn: any, o?: any) => {
    el.addEventListener(ev, fn, o);
    disposers.push(() => el.removeEventListener(ev, fn, o));
  };
  const timers: any[] = [];
  const every = (fn: () => void, ms: number) => timers.push(setInterval(fn, ms));
  let alive = true;
  const raf = (fn: (t: number) => void) => {
    const loop = (t: number) => {
      if (!alive) return;
      fn(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  /* ---------- state ---------- */
  const S: any = {
    asset: opts.symbol in ARCADE_ASSETS ? opts.symbol : "BTC",
    tf: opts.tf,
    dur: tfSeconds(opts.tf),
    round: null as ArcadeRoundRow | null,
    next: null as ArcadeRoundRow | null,
    path: [] as number[],
    start: 0,
    open: 0,
    price: 0,
    pts: [] as { t: number; p: number }[],
    marks: [] as any[],
    orders: [] as any[],
    pend: [] as any[],
    pos: null as ArcadeHolding | null,
    chip: 25,
    equity: api.getBalance(),
    today: 0,
    todayTouched: false,
    won: 0,
    lost: 0,
    last: [] as any[],
    hist: [] as Side[],
    histRounds: [] as ArcadeRoundRow[],
    nUp: 0,
    nDn: 0,
    longest: 0,
    longestS: "u",
    closed: false,
    busy: false,
    shareLast: null as any,
  };
  const K = () => ARCADE_ASSETS[S.asset].k;
  let OID = 0;

  /* ---------- audio ---------- */
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
    if (MUTED) return;
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
    tick: () => tone(1600, 0.03, "square", 0.03),
    win: () => {
      [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.14, "square", 0.05, 1, i * 0.07));
      for (let i = 0; i < 14; i++) tone(2400 + Math.random() * 1800, 0.05, "triangle", 0.03, 1, 0.5 + i * 0.05);
    },
    lose: () => {
      tone(440, 0.5, "sawtooth", 0.06, 0.25);
      tone(330, 0.6, "square", 0.04, 0.3, 0.12);
    },
    drop: () => tone(90, 0.18, "sine", 0.25, 0.5),
  };

  /* ---------- fx ---------- */
  const SPR = {
    lynx: ["/arcade/lynx0.png", "/arcade/lynx1.png", "/arcade/lynx2.png", "/arcade/lynx3.png"],
    coin0: "/arcade/coin0.png",
    coin1: "/arcade/coin1.png",
  };
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
        fctx.shadowColor = p.col;
        fctx.shadowBlur = 10;
        fctx.fillRect(Math.round(p.x), Math.round(p.y), p.r | 0, p.r | 0);
        fctx.shadowBlur = 0;
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
  function shake() {
    if (RM) return;
    const c = $("#cab");
    c.classList.remove("shake");
    void c.offsetWidth;
    c.classList.add("shake");
  }
  function press(el: any) {
    el.classList.add("is-press");
    setTimeout(() => el.classList.remove("is-press"), 120);
  }
  function center(el: any) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function splash(text: string, col: string) {
    const d = document.createElement("div");
    d.className = "splash";
    d.style.setProperty("--sc", col);
    d.innerHTML = `<div class="rays"></div><div class="num">${text}</div>`;
    root.appendChild(d);
    setTimeout(() => d.remove(), 2300);
  }

  /* ---------- round timing (all times local, like the rest of the site) ---------- */
  const fmtT = (d: Date, sec?: boolean) => pad(d.getHours()) + ":" + pad(d.getMinutes()) + (sec ? ":" + pad(d.getSeconds()) : "");
  const ROUND_NAMES: Record<number, string> = { 30: "30 SECOND ROUND", 60: "1 MINUTE ROUND" };
  function labelRound() {
    const s = new Date(S.start),
      e = new Date(S.start + S.dur * 1000);
    $("#win").textContent = `${fmtT(s, true)}–${fmtT(e, true)}`;
    $("#titleOpen").textContent = money(S.open);
    $("#roundLbl").textContent = ROUND_NAMES[S.dur];
  }
  /** make `r` the live round: path, open, chart points up to now */
  function adoptRound(r: ArcadeRoundRow) {
    S.round = r;
    S.dur = tfSeconds(r.tf);
    S.start = new Date(r.start_at).getTime();
    S.open = r.open_price;
    S.path = arcadePath(r.seed, r.open_price, r.steps, r.sigma);
    const at = now();
    const n = Math.max(0, Math.min(r.steps, Math.floor((at - S.start) / ARCADE_STEP_MS)));
    S.pts = [];
    for (let i = 0; i <= n; i++) S.pts.push({ t: S.start + i * ARCADE_STEP_MS, p: S.path[i] });
    S.price = arcadePriceAt(S.path, S.start, at);
    S.marks = [];
    S.orders = [];
    S.pend.slice().forEach((p: any) => dropPend(p));
    labelRound();
    renderResult();
    renderButtons();
    meter(S.price - S.open);
    scheduleReconcile();
  }

  /* ---------- pricing ---------- */
  function cents() {
    const rem = Math.max(0, (S.start + S.dur * 1000 - now()) / 1000) / S.dur;
    const z = (S.price - S.open) / ((60 + 520 * rem) * K()),
      up = Math.round(50 + 49 * Math.tanh(z));
    return { u: Math.min(99, Math.max(1, up)), d: Math.min(99, Math.max(1, 100 - up)) };
  }

  /* ---------- chart ---------- */
  const cv = $("#cv"),
    ctx = cv.getContext("2d");
  let CW = 0,
    CH = 0;
  const hov: any = { on: false, x: 0, pt: null };
  function sizeCv() {
    const r = cv.getBoundingClientRect(),
      d = devicePixelRatio || 1;
    CW = r.width;
    CH = r.height;
    cv.width = CW * d;
    cv.height = CH * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  const ro = new ResizeObserver(sizeCv);
  ro.observe($("#plot"));
  disposers.push(() => ro.disconnect());
  function scale() {
    let lo = S.open,
      hi = S.open;
    for (const p of S.pts) {
      lo = Math.min(lo, p.p);
      hi = Math.max(hi, p.p);
    }
    const u = 50 * K();
    let step = u;
    for (;;) {
      const c = Math.round(S.open / step) * step,
        a = c - 3 * step,
        b = c + 3 * step;
      if (a <= lo - step * 0.2 && b >= hi + step * 0.2) return { a, b, step };
      step += u;
    }
  }
  raf(() => {
    if (!CW || !S.round) return;
    ctx.clearRect(0, 0, CW, CH);
    const gl = api.isMobile ? 36 : 52,
      x0 = gl + 4,
      x1 = CW - 34,
      top = 8,
      bot = CH - 8;
    const X = (t: number) => x0 + ((t - S.start) / (S.dur * 1000)) * (x1 - x0);
    const { a, b, step } = scale(),
      Y = (v: number) => bot - ((v - a) / (b - a)) * (bot - top);
    ctx.strokeStyle = "rgba(5,215,237,.07)";
    ctx.lineWidth = 1;
    for (let x = x0; x < CW; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, top);
      ctx.lineTo(x + 0.5, bot);
      ctx.stroke();
    }
    ctx.font = api.isMobile ? "500 10px CPs, monospace" : "500 16px CPs, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let v = a; v <= b + 1; v += step) {
      const y = Math.round(Y(v)) + 0.5;
      ctx.strokeStyle = "rgba(240,245,255,.07)";
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(CW, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(240,245,255,.4)";
      ctx.fillText(api.isMobile ? (v >= 10000 ? (v / 1000).toFixed(2) + "k" : v.toFixed(K() < 0.05 ? 2 : 0)) : v.toLocaleString("en-US", { maximumFractionDigits: K() < 0.05 ? 2 : 0 }), 2, y);
    }
    ctx.strokeStyle = "rgba(240,245,255,.35)";
    ctx.beginPath();
    ctx.moveTo(x0 + 0.5, top);
    ctx.lineTo(x0 + 0.5, bot);
    ctx.lineTo(CW, bot + 0.5);
    ctx.stroke();
    const oy = Math.round(Y(S.open)) + 0.5;
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(240,245,255,.7)";
    ctx.beginPath();
    ctx.moveTo(x0, oy);
    ctx.lineTo(x1, oy);
    ctx.stroke();
    ctx.strokeStyle = "rgba(240,245,255,.6)";
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, top + 18);
    ctx.lineTo(x1 + 0.5, bot);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = api.isMobile ? "500 12px CPs, monospace" : "500 19px CPs, monospace";
    ctx.fillStyle = "#f0f5ff";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("OPEN " + money(S.open), x0 + 16, oy - 8);
    ctx.textAlign = "right";
    ctx.fillText("CLOSE", Math.min(CW - 2, x1 + 20), top + 12);
    ctx.textAlign = "left";
    const vis = S.pts;
    if (vis.length > 1) {
      const above = S.price >= S.open,
        col = above ? C.cy : C.dn;
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, above ? "rgba(5,215,237,.45)" : "rgba(207,255,74,.35)");
      g.addColorStop(1, above ? "rgba(5,215,237,.02)" : "rgba(207,255,74,.02)");
      ctx.beginPath();
      ctx.moveTo(X(vis[0].t), bot);
      for (const p of vis) ctx.lineTo(X(p.t), Y(p.p));
      ctx.lineTo(X(vis[vis.length - 1].t), bot);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      const path = () => {
        ctx.beginPath();
        vis.forEach((p: any, i: number) => (i ? ctx.lineTo(X(p.t), Y(p.p)) : ctx.moveTo(X(p.t), Y(p.p))));
      };
      ctx.lineJoin = "round";
      ctx.save();
      ctx.translate(-2, 0);
      path();
      ctx.strokeStyle = "rgba(51,214,255,.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(2, 0);
      path();
      ctx.strokeStyle = "rgba(207,255,74,.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      path();
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const h = vis[vis.length - 1],
        hx = X(h.t),
        hy = Y(h.p),
        pulse = 6 + 3 * Math.sin(now() / 160);
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(hx, hy, pulse, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, 7);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(x1, hy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (hov.on) {
        const t = S.start + ((hov.x - x0) / (x1 - x0)) * S.dur * 1000;
        let best: any = null;
        for (const p of vis) if (!best || Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
        if (best && hov.x >= x0 && hov.x <= X(vis[vis.length - 1].t) + 6) {
          const bx = X(best.t),
            by = Y(best.p);
          ctx.strokeStyle = "rgba(240,245,255,.55)";
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(bx + 0.5, top);
          ctx.lineTo(bx + 0.5, bot);
          ctx.moveTo(x0, by + 0.5);
          ctx.lineTo(x1, by + 0.5);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#fff";
          ctx.fillRect(bx - 4, by - 4, 8, 8);
          ctx.strokeStyle = "#07090f";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx - 4, by - 4, 8, 8);
          ctx.lineWidth = 1;
          hov.pt = best;
          const d = best.p - S.open;
          showTip(`${fmtT(new Date(best.t), true)} · ${money(best.p)} · ${d >= 0 ? "<b>▲ +" : '<span class="w">▼ −'}${Math.abs(d).toFixed(2)}${d >= 0 ? "</b>" : "</span>"}`, hov.cx, hov.cy);
        } else {
          hov.pt = null;
          hideTip();
        }
      }
      for (const e of S.marks) {
        ctx.fillStyle = e.s === "u" ? C.up : C.dn;
        ctx.fillRect(X(e.t) - 5, Y(e.p) - 5, 10, 10);
        ctx.strokeStyle = "#07090f";
        ctx.lineWidth = 2;
        ctx.strokeRect(X(e.t) - 5, Y(e.p) - 5, 10, 10);
        ctx.lineWidth = 1;
      }
    }
  });

  /* ---------- meter ---------- */
  const SEGS = 24;
  $("#bar").innerHTML = "<i></i>".repeat(SEGS);
  const segEls = [...$("#bar").children] as HTMLElement[];
  function meter(diff: number) {
    const RG = 200 * K(),
      half = SEGS / 2,
      n = Math.min(half, Math.ceil((Math.abs(diff) / RG) * half));
    segEls.forEach((s, i) => {
      let on = false,
        cls = "";
      if (diff >= 0 && i < half && i >= half - n) {
        on = true;
        cls = "u";
      }
      if (diff < 0 && i >= half && i < half + n) {
        on = true;
        cls = "d";
      }
      s.className = on ? "on " + cls : "";
    });
    const mb = $("#mbody"),
      H = mb.clientHeight,
      y = H / 2 - (Math.max(-RG, Math.min(RG, diff)) / RG) * (H / 2);
    const md = $("#mdiff");
    md.style.top = Math.max(10, Math.min(H - 10, Math.abs(y - H / 2) < 14 ? (diff >= 0 ? H / 2 - 16 : H / 2 + 16) : y)) + "px";
    md.textContent = `${diff >= 0 ? "▲ +" : "▼ −"}${Math.abs(diff).toFixed(2)}`;
    md.style.color = diff >= 0 ? C.up : C.dn;
  }

  /* ---------- history: resolved rounds of this table drive bead, road, stats ---------- */
  function streakInfo() {
    const h = S.hist;
    let best = { s: "u", n: 0 },
      cur = { s: h[0], n: 0 };
    for (const x of h) {
      cur = cur.s === x ? { s: x, n: cur.n + 1 } : { s: x, n: 1 };
      if (cur.n > best.n) best = { ...cur };
    }
    return { best, cur };
  }
  function buildRoad() {
    const cols: any[] = [];
    S.hist.forEach((x: Side, i: number) => {
      const c = cols[cols.length - 1];
      if (c && c.s === x && c.cells.length < 4) c.cells.push(i);
      else cols.push({ s: x, cells: [i] });
    });
    return cols;
  }
  function renderBead(newest?: boolean) {
    const el = $("#bead");
    el.innerHTML = "";
    const n = S.hist.length,
      from = Math.max(0, n - 36);
    for (let i = from; i < n; i++) {
      const b = document.createElement("span");
      b.className = "bead " + S.hist[i];
      b.dataset.i = String(i);
      if (newest && i === n - 1) b.classList.add("pop");
      el.appendChild(b);
    }
    $("#beadN").textContent = String(Math.min(36, n));
  }
  function renderRoad(newest?: boolean) {
    const el = $("#road");
    el.innerHTML = "";
    const cols = buildRoad().slice(-40),
      last = S.hist.length - 1;
    cols.forEach((c: any) => {
      const d = document.createElement("div");
      d.className = "col";
      c.cells.forEach((i: number) => {
        const b = document.createElement("span");
        b.className = "cell " + c.s;
        b.dataset.i = String(i);
        if (newest && i === last) b.classList.add("pop");
        d.appendChild(b);
      });
      el.appendChild(d);
    });
    const g = document.createElement("div");
    g.className = "col";
    g.innerHTML = '<span class="cell ghost"></span>';
    el.appendChild(g);
  }
  function renderStats() {
    S.nUp = S.hist.filter((x: Side) => x === "u").length;
    S.nDn = S.hist.length - S.nUp;
    const { best } = streakInfo();
    S.longest = best.n;
    S.longestS = best.s;
    $("#nUp").textContent = String(S.nUp);
    $("#nDn").textContent = String(S.nDn);
    $("#longest").textContent = (best.s === "u" ? "Up" : "Down") + " ×" + best.n;
  }
  function renderTicks() {
    const L = S.last.slice(-10);
    $("#ticks").innerHTML = L.map((l: any, i: number) => `<span class="tick ${l.w ? l.s : "x"}" data-li="${i}">${l.w ? "✓" : "✕"}</span>`).join("");
    const lp = $("#lastPnl"),
      sum = L.reduce((a: number, l: any) => a + (l.pnl || 0), 0);
    lp.textContent = signed(sum);
    lp.classList.toggle("neg", sum < 0);
    const mp = $("#mPeekS");
    if (mp) mp.innerHTML = `Last 10 <b style="color:${sum < 0 ? "var(--hot)" : "var(--lime)"};font-weight:600">${signed(sum)}</b>`;
    const mt = $("#mPeekTicks");
    if (mt) mt.innerHTML = $("#ticks").innerHTML;
  }

  /* ---------- equity (spot balance) ---------- */
  let eqShown = S.equity;
  function eqTo(v: number) {
    const from = eqShown,
      t0 = performance.now(),
      el = $("#equity"),
      b = $("#equityBtn");
    b.classList.remove("bump");
    void b.offsetWidth;
    b.classList.add("bump");
    (function step(t: number) {
      const k = Math.min(1, (t - t0) / 700),
        e = 1 - Math.pow(1 - k, 3);
      eqShown = from + (v - from) * e;
      el.textContent = money(eqShown);
      if (k < 1 && alive) requestAnimationFrame(step);
    })(t0);
    // background tabs pause rAF: land on the final figure regardless
    setTimeout(() => {
      if (!alive) return;
      eqShown = v;
      el.textContent = money(v);
    }, 760);
  }

  /* ---------- trading ---------- */
  const btnOf = (x: Side) => (x === "u" ? $("#btnU") : $("#btnD"));
  function posValue() {
    if (!S.pos) return 0;
    const c = cents()[S.pos.side as Side] / 100;
    return Math.max(0, S.pos.sh * c);
  }
  function toWin() {
    return S.pos ? Math.max(0, S.pos.sh - S.pos.margin) : 0;
  }
  let toastT: any = 0;
  function toast(html: string, warn?: boolean) {
    const t = $("#toast"),
      fr = ($(".m-q") || $(".feed")).getBoundingClientRect();
    t.style.top = Math.max(8, fr.top + 10) + "px";
    t.style.left = fr.left + fr.width / 2 + "px";
    t.className = "toast" + (warn ? " warn" : "");
    t.innerHTML = `<span class="ti">${warn ? "!" : "✓"}</span><span>${html}</span>`;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), 3800);
  }
  function logOrder(o: any) {
    S.orders.push({ t: now(), ...o });
    renderOrders();
  }
  function deny(btn: any, msg: string) {
    btn.classList.remove("deny");
    void btn.offsetWidth;
    btn.classList.add("deny");
    sfx.deny();
    toast(msg, true);
  }
  function place(side: Side, fromPt?: { x: number; y: number }) {
    audio();
    const btn = btnOf(side),
      margin = S.chip;
    if (!api.userId) {
      deny(btn, "Sign in to play");
      api.requireAuth();
      return;
    }
    if (!S.round) return;
    if (S.closed) return deny(btn, `${ARCADE_ASSETS[S.asset].name} is closed · next session ${nextUsSessionText()}`);
    if (S.start + S.dur * 1000 - now() < 1200) return deny(btn, "Round is closing · wait for the next one");
    if (ARCADE_FLIP === "net" && S.pos && S.pos.side !== side) {
      /* fallthrough: net mode lets the spot rail reduce share-for-share */
    }
    const pendSum = S.pend.reduce((a: number, p: any) => a + p.margin, 0);
    if (S.equity - pendSum < margin) return deny(btn, "Not enough Spot balance");
    S.shareLast = null;
    const p: any = { id: ++OID, side, margin, chip: S.chip };
    S.pend.push(p);
    const el = document.createElement("span");
    el.className = "pend";
    el.dataset.pid = String(p.id);
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Cancel ${whole(margin)} order`);
    el.innerHTML = `<svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="16" fill="none" stroke-width="3.5"/><circle class="fg" cx="18" cy="18" r="16" fill="none" stroke-width="3.5"/></svg><span class="mchip ${chipCls(p.chip)}">${p.chip}</span><span class="x">✕</span>`;
    el.style.setProperty("--pend", ARCADE_PEND_MS + "ms");
    (el as any)._t = now();
    btn.querySelector(".pendrow").appendChild(el);
    p.el = el;
    p.timer = setTimeout(() => void fill(p), ARCADE_PEND_MS);
    setTimeout(() => el.classList.add("armed"), 450);
    press(btn);
    sfx.chip();
    const chipEl = $(`.chip[data-v="${S.chip}"]`),
      from = fromPt || center(chipEl),
      to = center(el);
    const g = chipEl.cloneNode(true) as HTMLElement;
    g.removeAttribute("aria-pressed");
    g.className += " ghostchip";
    g.style.left = from.x + "px";
    g.style.top = from.y + "px";
    g.style.animation = "none";
    root.appendChild(g);
    const midY = Math.min(from.y, to.y) - 90;
    const anim = g.animate([{ transform: "translate(0,0) scale(1) rotate(0)" }, { transform: `translate(${(to.x - from.x) / 2}px,${midY - from.y}px) scale(1.1) rotate(180deg)` }, { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.45) rotate(360deg)` }], { duration: RM ? 1 : 360, easing: "cubic-bezier(.3,.6,.4,1)" });
    anim.onfinish = () => {
      g.remove();
      burst(to.x, to.y, side === "u" ? C.up : C.dn, 12);
      tone(520, 0.05, "square", 0.04);
    };
    Lx.react("poke");
    renderButtons();
    renderResult();
  }
  function dropPend(p: any) {
    S.pend = S.pend.filter((x: any) => x !== p);
    clearTimeout(p.timer);
    const el = p.el;
    if (el) {
      el.classList.add("out");
      setTimeout(() => el.remove(), 260);
    }
  }
  function cancelPend(id: number, quiet?: boolean) {
    const p = S.pend.find((x: any) => x.id === id);
    if (!p) return;
    dropPend(p);
    logOrder({ k: "cancel", side: p.side, txt: `${SIDE(p.side)} · ${whole(p.margin)} back in your hand` });
    if (!quiet) {
      toast(`Cancelled · ${whole(p.margin)} is back in your hand`);
      sfx.deny();
    }
    renderButtons();
    renderResult();
  }
  async function fill(p: any) {
    if (!S.pend.includes(p) || !S.round) return;
    dropPend(p);
    if (S.busy) {
      toast("One at a time · the previous chip is still filling", true);
      return;
    }
    const round: ArcadeRoundRow = S.round;
    const c = cents();
    const px = c[p.side as Side] / 100;
    const f = fee(p.margin);
    const sh = Math.floor((p.margin - f) / px);
    if (sh <= 0) return deny(btnOf(p.side), "Chip too small for one share at this price");
    const btn = btnOf(p.side);
    S.busy = true;
    let lead = "";
    const netting = !!(S.pos && S.pos.side !== p.side && ARCADE_FLIP === "net");
    try {
      if (S.pos && S.pos.side !== p.side && ARCADE_FLIP === "close-then-open") {
        const was: Side = S.pos.side;
        const sellPx = c[was] / 100;
        const r = await api.sell({ round, side: was, price: sellPx, qty: S.pos.sh });
        const back = r.balanceDelta,
          pnl = r.realizedPnl ?? back - S.pos.margin;
        S.equity += back;
        eqTo(S.equity);
        S.today += pnl;
        S.todayTouched = true;
        logOrder({ k: "flip", side: was, txt: `Closed ${SIDE(was)} ${S.pos.sh} sh · ${whole(back)} back · ${signed(pnl)}` });
        lead = `Flipped · ${SIDE(was)} closed ${signed(pnl)} · `;
        S.pos = null;
      }
      const r = await api.buy({ round, side: p.side, price: px, qty: sh, fee: f, amount: p.margin });
      S.equity += r.balanceDelta;
      eqTo(S.equity);
      if (netting) {
        // the spot rail reduced the held leg share-for-share and opened the rest: read back the truth
        const was: Side = S.pos.side;
        const before = S.pos.sh;
        const h = await api.loadHolding(round);
        S.pos = h;
        const reduced = Math.min(before, sh);
        const txt = h && h.side === p.side ? `${SIDE(was)} closed · ${SIDE(p.side)} ${h.sh} sh opened` : h ? `${SIDE(was)} reduced by ${reduced} sh · ${h.sh} sh left` : `${SIDE(was)} closed`;
        S.marks.push({ s: p.side, t: now(), p: S.price });
        logOrder({ k: "flip", side: p.side, txt: `${p.side === "u" ? "↑" : "↓"} ${SIDE(p.side)} · ${whole(p.margin)} netted · ${txt}` });
        toast(`${SIDE(p.side)} · ${whole(p.margin)} in · netted against your ${SIDE(was)} → ${txt}`);
        const to = center(btn),
          col = p.side === "u" ? C.up : C.dn;
        press(btn);
        sfx.bet();
        burst(to.x, to.y, col, 30);
        flash(col);
        Lx.react("bet");
        void loadToday();
        return;
      }
      const kind = S.pos ? "add" : lead ? "flip" : "open";
      if (S.pos && S.pos.side === p.side) {
        S.pos.margin += p.margin - f;
        S.pos.sh += sh;
        S.pos.chips.push(p.chip);
      } else {
        S.pos = { side: p.side, margin: p.margin - f, sh, chips: [p.chip], avg: px, positionId: r.positionId };
      }
      if (r.size != null && r.margin != null) {
        S.pos.sh = r.size;
        S.pos.margin = r.margin;
      }
      S.pos.avg = S.pos.margin / S.pos.sh;
      S.marks.push({ s: p.side, t: now(), p: S.price });
      logOrder({ k: kind === "flip" ? "open" : kind, side: p.side, txt: `${p.side === "u" ? "↑" : "↓"} ${SIDE(p.side)} · ${whole(p.margin)} · ${sh} sh @ ${(px * 100).toFixed(1)}¢` });
      toast(`${lead}${SIDE(p.side)} · ${whole(p.margin)} in → win +${whole(toWin())} if ${S.asset} closes ${p.side === "u" ? "above" : "below"} ${money(S.open)}`);
      const to = center(btn),
        col = p.side === "u" ? C.up : C.dn;
      press(btn);
      sfx.bet();
      shake();
      burst(to.x, to.y, col, 46);
      burst(to.x, to.y, col, 10, true);
      flash(col);
      setTimeout(sfx.drop, 120);
      Lx.react("bet");
      const pl = btn.querySelector(".posbtn");
      pl.classList.remove("bump");
      void pl.offsetWidth;
      pl.classList.add("bump");
    } catch (e: any) {
      deny(btn, e?.message || "Order failed");
    } finally {
      S.busy = false;
      lastStack = { u: "", d: "" };
      renderButtons();
      renderResult();
    }
  }
  async function cashOut(silent: boolean, pct = 100) {
    if (!S.pos || !S.round) return;
    if (S.busy) return;
    const P = S.pos,
      all = pct >= 100 || P.sh <= 1,
      shOut = all ? P.sh : Math.max(1, Math.min(P.sh - 1, Math.round((P.sh * pct) / 100))),
      f = shOut / P.sh;
    const sd: Side = P.side;
    const px = cents()[sd] / 100;
    S.busy = true;
    try {
      const r = await api.sell({ round: S.round, side: sd, price: px, qty: shOut });
      const v = r.balanceDelta,
        pnl = r.realizedPnl ?? v - P.margin * f;
      S.equity += v;
      eqTo(S.equity);
      S.today += pnl;
      S.todayTouched = true;
      logOrder({ k: "cash", side: sd, txt: `${all ? "" : Math.round(f * 100) + "% · "}${SIDE(sd)} ${shOut} sh · ${whole(v)} back · ${signed(pnl)}` });
      if (!silent) S.shareLast = { side: sd, put: P.margin * f, worth: v, live: false, cash: true, asset: S.asset, dur: S.dur };
      if (all) S.pos = null;
      else {
        P.margin -= P.margin * f;
        P.sh -= shOut;
        P.avg = P.margin / P.sh;
        const keep = Math.max(1, Math.round(P.chips.length * (1 - f)));
        P.chips = P.chips.slice(-keep);
      }
      if (!silent) {
        toast(`Cashed out ${all ? "" : Math.round(f * 100) + "% · "}${SIDE(sd)} · ${whole(v)} back · ${signed(pnl)}`, pnl < 0);
        const c = center($("#cashBtn"));
        burst(c.x, c.y, pnl >= 0 ? C.dn : C.hot, 30, pnl >= 0);
        rain(pnl >= 0 ? C.dn : C.hot, all ? 24 : 12);
        sfx[pnl >= 0 ? "bet" : "deny"]();
      }
    } catch (e: any) {
      toast(e?.message || "Cash out failed", true);
    } finally {
      S.busy = false;
      lastStack = { u: "", d: "" };
      renderButtons();
      renderResult();
    }
  }
  /** local, optimistic: the server pays within ~30 s (roll_arcade_rounds) */
  function settlePosition(r: Side) {
    S.pend.slice().forEach((p: any) => cancelPend(p.id, true));
    if (!S.pos) return;
    const won = S.pos.side === r,
      gross = won ? S.pos.sh : 0,
      profit = gross - S.pos.margin,
      wc = profit > 0 ? round2(0.05 * profit) : 0,
      payout = round2(gross - wc),
      pnl = round2(payout - S.pos.margin);
    S.equity += payout;
    eqTo(S.equity);
    S.today += pnl;
    S.todayTouched = true;
    if (won) S.won++;
    else S.lost++;
    S.last.push({ s: S.pos.side, w: won, t: now(), pnl });
    S.last = S.last.slice(-10);
    renderTicks();
    S.shareLast = { side: S.pos.side, put: S.pos.margin, worth: payout, live: false, asset: S.asset, dur: S.dur };
    if (won) {
      splash(signed(pnl), C.dn);
      rain(C.dn);
      rain(C.up, 40);
      sfx.win();
      flash(C.dn);
      warp();
      Lx.react("win");
    } else {
      splash(signed(pnl), C.hot);
      flash(C.hot);
      sfx.lose();
      shake();
      Lx.react("lose");
    }
    S.pos = null;
    api.onSettled?.();
  }
  function voidRound(why: string) {
    S.pend.slice().forEach((p: any) => cancelPend(p.id, true));
    if (S.pos) {
      const back = S.pos.margin;
      S.equity += back;
      eqTo(S.equity);
      logOrder({ k: "void", side: S.pos.side, txt: `Round void · ${why} · ${whole(back)} returned` });
      toast(`Round void · ${why} · ${whole(back)} returned to Spot`, true);
      S.pos = null;
    }
    flash("#9aa4b2");
  }
  function settle() {
    const r: ArcadeRoundRow = S.round;
    const close = S.path[r.steps];
    S.price = close;
    if (close === S.open) voidRound("closed exactly at the open");
    else {
      const w: Side = close > S.open ? "u" : "d";
      S.hist.push(w);
      if (S.hist.length > 240) S.hist = S.hist.slice(-240);
      S.histRounds.push({ ...r, close_price: close, winner: w === "u" ? "up" : "down" });
      S.histRounds = S.histRounds.slice(-240);
      renderBead(true);
      renderRoad(true);
      renderStats();
      if (S.pos || S.pend.length) settlePosition(w);
      else {
        flash(w === "u" ? C.up : C.dn);
        tone(w === "u" ? 880 : 440, 0.15, "triangle", 0.05);
      }
    }
    const nxt: ArcadeRoundRow = S.next && S.next.start_at === r.end_at ? S.next : arcadeNextOf(r);
    S.next = null;
    adoptRound(nxt);
    void refreshTable(false);
  }
  let lastStack: any = { u: "", d: "" };
  function renderButtons() {
    const bq = $("#betQuote");
    if (bq) bq.textContent = `${whole(S.chip)} SELECTED`;
    (["u", "d"] as Side[]).forEach((sd) => {
      const btn = btnOf(sd),
        wrap = sd === "u" ? $("#wrapU") : $("#wrapD"),
        pays = sd === "u" ? $("#paysU") : $("#paysD");
      const held = !!(S.pos && S.pos.side === sd),
        opp = !!(S.pos && S.pos.side !== sd),
        pend = S.pend.filter((p: any) => p.side === sd),
        sum = pend.reduce((a: number, p: any) => a + p.margin, 0);
      btn.classList.toggle("held", held);
      wrap.classList.toggle("held", held);
      const ch = held ? S.pos.chips.slice(-4) : [],
        stackHtml = ch.map((v: number, i: number) => `<span class="mchip ${chipCls(v)}${i === ch.length - 1 ? " tnew" : ""}">${v}</span>`).join("") + (held ? `<!--${S.pos.chips.length}-->` : "");
      if (stackHtml !== lastStack[sd]) {
        btn.querySelector(".stack").innerHTML = stackHtml;
        lastStack[sd] = stackHtml;
      }
      const pos = btn.querySelector(".posbtn");
      pos.hidden = !held;
      btn.querySelector(".tower").hidden = !held;
      if (held) {
        const v = whole(S.pos.margin),
          b = pos.querySelector("b");
        if (b.textContent !== v) b.textContent = v;
      }
      let txt: string,
        cls = "";
      if (pend.length) {
        cls = "fill";
        txt = opp ? (ARCADE_FLIP === "net" ? `Nets ${whole(sum)} against your ${SIDE(S.pos.side)} · tap chip to cancel` : `Flip to ${SIDE(sd)} · ${whole(sum)} · tap chip to cancel`) : `Filling ${whole(sum)} · tap chip to cancel`;
        if (held) txt = `+${whole(sum)} · tap chip to cancel`;
      } else if (held) {
        cls = "hold";
        txt = `${S.pos.sh} sh · to win +${whole(toWin())}`;
      } else if (opp) txt = ARCADE_FLIP === "net" ? `You hold ${SIDE(S.pos.side)} · a chip here nets against it` : `You hold ${SIDE(S.pos.side)} · a chip here flips it`;
      else {
        const px = cents()[sd] / 100,
          sh = Math.max(1, Math.floor((S.chip - fee(S.chip)) / px));
        txt = `${whole(S.chip)} in → win +${whole(sh - S.chip)} if ${SIDE(sd)}`;
      }
      if (pays.textContent !== txt) pays.textContent = txt;
      pays.className = "pays" + (cls ? " " + cls : "");
    });
  }
  function renderResult() {
    const n = $("#rNow"),
      s = $("#rNowS"),
      l = $("#rLive"),
      ls = $("#rLiveS");
    if (S.pos) {
      const Pp = S.pos;
      n.textContent = `${SIDE(Pp.side)} · ${whole(Pp.margin)} on the table`;
      n.className = "n " + (Pp.side === "u" ? "cu" : "cd");
      const fl = S.pend.filter((x: any) => x.side !== Pp.side),
        fs = fl.reduce((a: number, x: any) => a + x.margin, 0);
      s.textContent = fl.length
        ? ARCADE_FLIP === "net"
          ? `Netting · ${whole(fs)} on ${SIDE(fl[0].side)} reduces your ${SIDE(Pp.side)} share-for-share`
          : `Flipping · closes your ${SIDE(Pp.side)} (${whole(posValue())} back) · then ${whole(fs)} on ${SIDE(fl[0].side)}`
        : `${Pp.sh} sh @ ${(Pp.avg * 100).toFixed(1)}¢ · value ${money(posValue())}`;
      const v = posValue() - Pp.margin;
      l.textContent = signed(v);
      l.className = "n " + (v < 0 ? "neg" : "pos");
      ls.innerHTML = `if ${SIDE(Pp.side)} wins <span style="color:var(--lime)">+${whole(toWin())}</span>`;
    } else if (S.pend.length) {
      n.textContent = "Filling…";
      n.className = "n";
      s.textContent = `${S.pend.length} chip${S.pend.length > 1 ? "s" : ""} on the button · tap to cancel`;
      l.textContent = "-";
      l.className = "n";
      ls.textContent = "";
    } else {
      n.textContent = "-";
      n.className = "n";
      s.textContent = "Nothing on the table";
      l.textContent = "-";
      l.className = "n";
      ls.textContent = "";
    }
    const cb = $("#cashBtn");
    cb.disabled = !S.pos || S.dur < 60 || S.busy;
    cb.title = S.dur < 60 ? "Cash out is available on 1m rounds" : "";
    $("#shareBtn").disabled = !(S.pos || S.shareLast);
    const ob = $("#ordBtn");
    ob.hidden = !S.orders.length;
    $("#ordN").textContent = String(S.orders.length);
    const t = $("#rToday");
    if (S.todayTouched) {
      t.textContent = (S.today < 0 ? "−" : "+") + whole(S.today);
      t.className = "n " + (S.today < 0 ? "neg" : "pos");
    } else {
      t.textContent = "-";
      t.className = "n";
    }
    $("#rTodayS").textContent = `${S.won} won · ${S.lost} lost`;
  }
  function renderLive() {
    if (S.pos || S.pend.length) {
      renderResult();
      renderButtons();
    }
    if (!coM.hidden) renderCo();
    if (!shM.hidden && shLive) renderShare();
  }
  /* orders log (per round) */
  const ordEl = $("#orders"),
    ordBtn = $("#ordBtn");
  const KLBL: Record<string, string> = { open: "OPEN", add: "ADD", flip: "CLOSE", cancel: "CANCEL", cash: "CASH OUT", settle: "SETTLE", void: "VOID" };
  function renderOrders() {
    if (ordEl.hidden) return;
    const rows = S.orders
      .slice()
      .reverse()
      .map((o: any) => `<div class="orow"><span class="ot">${fmtT(new Date(o.t), true)}</span><span class="ok ${o.k}">${KLBL[o.k]}</span><span>${o.txt}</span></div>`)
      .join("");
    ordEl.innerHTML = `<h5>ORDERS THIS ROUND <span>${$("#win").textContent}</span></h5>${rows || '<div class="oempty">No orders yet</div>'}`;
  }
  let ordAnchor: any = null;
  function placeOrders() {
    const r = (ordAnchor || ordBtn).getBoundingClientRect(),
      w = ordEl.offsetWidth;
    ordEl.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left)) + "px";
    ordEl.style.top = "";
    ordEl.style.bottom = innerHeight - r.top + 10 + "px";
  }
  function openOrders(o: boolean, anchor?: any) {
    ordAnchor = o ? anchor || null : null;
    ordEl.hidden = !o;
    ordBtn.setAttribute("aria-expanded", String(o && !anchor));
    $$(".posbtn").forEach((b) => b.setAttribute("aria-expanded", String(o && b === anchor)));
    if (o) {
      renderOrders();
      placeOrders();
    }
  }
  on(ordBtn, "click", (e: Event) => {
    e.stopPropagation();
    audio();
    sfx.key();
    openOrders(ordEl.hidden);
  });
  on(document, "click", (e: any) => {
    if (!ordEl.hidden && !e.target.closest("#orders,#ordBtn")) openOrders(false);
  });
  on(window, "resize", () => {
    if (!ordEl.hidden) placeOrders();
  });
  ["#midU", "#midD"].forEach((id) => {
    const m = $(id);
    on(m, "click", (e: any) => {
      const pc = e.target.closest(".pend");
      if (pc && now() - pc._t > 450) {
        e.stopPropagation();
        e.preventDefault();
        cancelPend(+pc.dataset.pid);
      }
    });
    on(m, "keydown", (e: any) => {
      const pc = e.target.closest(".pend");
      if (pc && (e.key === "Enter" || e.key === " ")) {
        e.stopPropagation();
        e.preventDefault();
        cancelPend(+pc.dataset.pid);
      }
    });
  });

  /* ---------- live ticks (deterministic path, no randomness) ---------- */
  let lastPx = 0;
  every(() => {
    if (!S.round) return;
    const at = now();
    S.price = arcadePriceAt(S.path, S.start, at);
    const n = Math.max(0, Math.min(S.round.steps, Math.floor((at - S.start) / ARCADE_STEP_MS)));
    while (S.pts.length <= n) {
      const i = S.pts.length;
      S.pts.push({ t: S.start + i * ARCADE_STEP_MS, p: S.path[i] });
    }
    const diff = S.price - S.open,
      c = cents(),
      up = diff >= 0;
    const pe = $("#price");
    pe.textContent = money(S.price);
    pe.classList.toggle("up", S.price >= lastPx);
    pe.classList.toggle("dn", S.price < lastPx);
    lastPx = S.price;
    const ch = $("#chg");
    ch.textContent = `${up ? "▲ +" : "▼ −"}${money(diff)} ${up ? "above" : "below"} open`;
    ch.classList.toggle("dn", !up);
    $("#cU").textContent = c.u + "¢";
    $("#cD").textContent = c.d + "¢";
    meter(diff);
    renderLive();
  }, 100);
  let lastSec = -1;
  raf(() => {
    if (!S.round) return;
    const rem = S.start + S.dur * 1000 - now();
    if (rem <= 0) settle();
    const r = Math.max(0, rem),
      sec = Math.ceil(r / 1000);
    $("#clock").textContent = pad(Math.floor(sec / 60)) + ":" + pad(sec % 60);
    const panic = sec <= 5 && sec > 0;
    $("#timer").classList.toggle("panic", panic);
    if (panic && sec !== lastSec && AC) sfx.tick();
    lastSec = sec;
  });

  /* ---------- controls ---------- */
  $$("[data-dur]").forEach((b) =>
    on(b, "click", () => {
      audio();
      sfx.key();
      const tf: ArcadeTf = +b.dataset.dur === 30 ? "30s" : "1m";
      if (tf === S.tf) return;
      $$("[data-dur]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const c = center(b);
      burst(c.x, c.y, C.cy, 22);
      switchTable(S.asset, tf);
    }),
  );
  ["#btnU", "#btnD"].forEach((id) => on($(id), "click", () => place($(id).dataset.side)));
  on($("#cashBtn"), "click", (e: any) => {
    if (!S.pos) return;
    audio();
    sfx.key();
    press(e.currentTarget);
    openCo();
  });
  on($("#shareBtn"), "click", (e: any) => {
    if (e.currentTarget.disabled) return;
    audio();
    sfx.key();
    press(e.currentTarget);
    openShare();
  });
  on(window, "keydown", (e: KeyboardEvent) => {
    if ((e.target as any)?.closest?.("input,textarea,[contenteditable]")) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      place("u");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      place("d");
    }
    if (e.key === "Escape") {
      openOrders(false);
      openMenu(false);
      closeModal(coM);
      closeModal(shM);
    }
    if (e.key === "m" || e.key === "M") muteBtn.click();
  });

  /* chips: tap to select, drag onto UP / DOWN */
  function selectChip(v: number) {
    S.chip = v;
    $$(".chip").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.v === v)));
    renderButtons();
  }
  function zoneAt(x: number, y: number): Side | null {
    for (const id of ["#btnU", "#btnD"]) {
      const r = $(id).getBoundingClientRect();
      if (x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12) return $(id).dataset.side;
    }
    return null;
  }
  $$(".chip").forEach((ch) => {
    let sx = 0,
      sy = 0,
      drag: any = null,
      id: any = null;
    on(ch, "pointerdown", (e: PointerEvent) => {
      audio();
      sx = e.clientX;
      sy = e.clientY;
      id = e.pointerId;
      ch.setPointerCapture(id);
    });
    on(ch, "pointermove", (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      if (!drag && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) {
        selectChip(+ch.dataset.v);
        sfx.chip();
        drag = ch.cloneNode(true);
        drag.removeAttribute("aria-pressed");
        drag.className += " ghostchip drag";
        drag.style.animation = "none";
        root.appendChild(drag);
      }
      if (drag) {
        drag.style.left = e.clientX + "px";
        drag.style.top = e.clientY + "px";
        const z = zoneAt(e.clientX, e.clientY);
        $("#btnU").classList.toggle("hot", z === "u");
        $("#btnD").classList.toggle("hot", z === "d");
      }
    });
    const end = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      id = null;
      if (drag) {
        const z = zoneAt(e.clientX, e.clientY);
        $("#btnU").classList.remove("hot");
        $("#btnD").classList.remove("hot");
        const pt = { x: e.clientX, y: e.clientY };
        drag.remove();
        drag = null;
        if (z) place(z, pt);
        else sfx.click();
        ch.dataset.dragged = "1";
        setTimeout(() => delete ch.dataset.dragged, 50);
      }
    };
    on(ch, "pointerup", end);
    on(ch, "pointercancel", end);
    on(ch, "click", () => {
      if (ch.dataset.dragged) return;
      selectChip(+ch.dataset.v);
      sfx.chip();
      const c = center(ch);
      burst(c.x, c.y, C.dn, 14);
    });
  });

  /* ---------- mute / fullscreen / title plate ---------- */
  const muteBtn = $("#muteBtn");
  const syncMute = () => {
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
    press(muteBtn);
    if (!MUTED) {
      audio();
      sfx.key();
    }
    const c = center(muteBtn);
    burst(c.x, c.y, MUTED ? C.hot : C.cy, 12);
  });
  const fsBtn = $("#fsBtn");
  if (fsBtn)
    on(fsBtn, "click", () => {
      audio();
      sfx.key();
      try {
        document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen().catch(() => {});
      } catch (e) {
        /* unsupported */
      }
    });
  const exitBtn = $("#exitBtn");
  if (exitBtn)
    on(exitBtn, "click", () => {
      audio();
      sfx.click();
      api.exit();
    });
  on($("#logoPlate"), "click", (e: any) => {
    audio();
    sfx.key();
    const c = center(e.currentTarget);
    burst(c.x, c.y, C.cy, 24);
    burst(c.x, c.y, C.dn, 10, true);
  });

  /* ---------- asset picker ---------- */
  const amenu = $("#amenu"),
    catBtns = $$(".key.cat");
  let menuTab = "crypto";
  const lastOf: Record<string, string> = { crypto: "BTC", stock: "AAPL" };
  const curCat = () => catBtns.find((b) => b.dataset.kind === ARCADE_ASSETS[S.asset].kind);
  function renderCats() {
    const kind = ARCADE_ASSETS[S.asset].kind;
    catBtns.forEach((b) => {
      const onK = b.dataset.kind === kind;
      b.setAttribute("aria-pressed", String(onK));
      b.innerHTML = onK ? `${dotHtml(S.asset, ARCADE_ASSETS[S.asset], "adot")}<span>${S.asset}</span><span class="car">▼</span>` : b.dataset.kind === "crypto" ? "CRYPTO" : "STOCK";
      b.setAttribute("aria-label", onK ? `${ARCADE_ASSETS[S.asset].name} · choose another ${b.dataset.kind}` : `Switch to ${b.dataset.kind}`);
    });
  }
  const dotHtml = (k: string, a: any, cls: string) => (a.kind === "stock" ? `<span class="${cls} tk" style="--c:${a.c}">${k[0]}</span>` : `<span class="${cls}" style="--c:${a.c}"></span>`);
  function renderMenu() {
    amenu.innerHTML = Object.values(ARCADE_ASSETS)
      .filter((a) => a.kind === menuTab)
      .map((a) => `<button class="arow" role="option" data-a="${a.symbol}" aria-selected="${a.symbol === S.asset}">${dotHtml(a.symbol, a, "mdot")}<span class="sym">${a.symbol}</span><span class="nm">${a.name}</span><span class="pct">${a.kind === "stock" ? (usSessionOpen() ? "1m · open" : "1m · closed") : "30s · 1m"}</span></button>`)
      .join("");
  }
  function openMenu(o: boolean) {
    amenu.hidden = !o;
    catBtns.forEach((b) => b.setAttribute("aria-expanded", String(o && b === curCat())));
    if (o) {
      menuTab = ARCADE_ASSETS[S.asset].kind;
      renderMenu();
      const k = curCat(),
        w = amenu.parentNode.getBoundingClientRect(),
        kr = k.getBoundingClientRect();
      amenu.style.setProperty("--ml", Math.min(kr.left - w.left, innerWidth - w.left - amenu.offsetWidth - 12) + "px");
    }
  }
  catBtns.forEach((b) =>
    on(b, "click", (e: Event) => {
      audio();
      e.stopPropagation();
      if (b.dataset.kind === ARCADE_ASSETS[S.asset].kind) {
        sfx.key();
        openMenu(amenu.hidden);
      } else {
        openMenu(false);
        void setAsset(lastOf[b.dataset.kind]);
      }
    }),
  );
  on(amenu, "click", (e: any) => {
    const r = e.target.closest(".arow");
    if (!r) return;
    e.stopPropagation();
    void setAsset(r.dataset.a);
    openMenu(false);
  });
  on(document, "click", (e: any) => {
    if (!amenu.hidden && !e.target.closest(".assetwrap")) openMenu(false);
  });

  /* ---------- US session gate ---------- */
  function applyMarket() {
    const a = ARCADE_ASSETS[S.asset],
      stock = a.kind === "stock";
    S.closed = stock && !usSessionOpen();
    const ov = $("#closedOv");
    if (ov) {
      ov.hidden = !S.closed;
      if (S.closed) {
        $("#closedS").textContent = `${a.name} rounds run during the US cash session only. Crypto tables are open 24/7.`;
        $("#closedN").textContent = nextUsSessionText();
      }
    }
    ["#btnU", "#btnD"].forEach((q) => {
      const b = $(q);
      if (b) {
        b.classList.toggle("closed", S.closed);
        b.disabled = S.closed;
      }
    });
    $$('[data-dur="30"]').forEach((b) => {
      b.disabled = stock;
      b.title = stock ? "Stock tables run 1m rounds only" : "";
    });
    const fs = $("#feedSrc");
    if (fs) fs.textContent = stock ? `LIVE · ${S.asset} · NASDAQ` : `LIVE · ${S.asset}/USD`;
  }
  every(applyMarket, 30000);

  /* ---------- rules ⓘ ---------- */
  function rulesHtml() {
    const a = ARCADE_ASSETS[S.asset],
      n = S.dur < 60 ? "30-second" : "1-minute";
    return `<b>How a ${n} round settles</b><br>Every chip buys <b>Up</b> or <b>Down</b> shares at the price shown (e.g. 59¢). A share pays <b>$1.00</b> if your side wins, <b>$0</b> if not.<br><b>Up</b> wins when ${S.asset} closes the round above the open <b>${money(S.open)}</b>; <b>Down</b> wins when it closes below.<br>Closes <b>exactly at the open</b> → round void, every stake returned.<br>${a.kind === "stock" ? "Halted or outside the US cash session (09:30–16:00 ET) → round void, stakes returned.<br>" : ""}${S.dur < 60 ? "No cash out on 30s rounds — hold to the close." : "Cash out any time before the close at the live share price."}<span class="k">SPOT ACCOUNT · NO BOOST · MAX LOSS = YOUR STAKE · FEE 0.15% · 5% ON WINNINGS</span>`;
  }
  (function rulesInit() {
    const i = $("#rulesI"),
      r = $("#rules");
    if (!i) return;
    const open = (o: boolean) => {
      r.hidden = !o;
      if (o) {
        r.innerHTML = rulesHtml();
        const b = i.getBoundingClientRect();
        r.style.top = b.bottom + 8 + "px";
        r.style.left = Math.min(b.left, innerWidth - r.offsetWidth - 12) + "px";
      }
    };
    on(i, "click", (e: Event) => {
      e.stopPropagation();
      open(r.hidden);
    });
    on(i, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(r.hidden);
      }
    });
    on(document, "click", (e: any) => {
      if (!r.hidden && !e.target.closest("#rules")) open(false);
    });
  })();

  /* ---------- table switching + server sync ---------- */
  let reconcileT: any = 0;
  function scheduleReconcile() {
    clearTimeout(reconcileT);
    reconcileT = setTimeout(() => void refreshTable(false), 4000);
  }
  let loadSeq = 0;
  async function refreshTable(full: boolean) {
    const seq = ++loadSeq;
    const symbol = S.asset,
      tf = S.tf;
    try {
      const snap = opts.fixture ? opts.fixture.snapshot : await fetchArcadeTable(symbol, tf, 60);
      if (!alive || seq !== loadSeq || symbol !== S.asset || tf !== S.tf) return;
      if (snap.current) {
        if (!S.round || S.round.id !== snap.current.id) {
          // the server knows a different live round (first load, or we drifted)
          adoptRound(snap.current);
          if (api.userId) void loadHolding(snap.current);
        }
      } else if (!S.round && !S.closed) {
        // nothing open on this table right now (stock session gap / job lag)
        $("#clock").textContent = "--:--";
      }
      S.next = snap.next;
      if (full || snap.history.length !== S.histRounds.length) {
        S.histRounds = snap.history;
        S.hist = snap.history.map((r) => (r.winner === "up" ? "u" : "d"));
        renderBead();
        renderRoad();
        renderStats();
      }
    } catch (e) {
      /* keep running on the deterministic stream; retry on the next reconcile */
    }
  }
  async function loadHolding(round: ArcadeRoundRow) {
    try {
      const h = await api.loadHolding(round);
      if (!alive || !S.round || S.round.id !== round.id) return;
      S.pos = h;
      lastStack = { u: "", d: "" };
      renderButtons();
      renderResult();
    } catch (e) {
      /* no holding */
    }
  }
  async function loadToday() {
    if (!api.userId) return;
    try {
      const t = await api.loadToday();
      if (!alive) return;
      S.today = t.net;
      S.won = t.won;
      S.lost = t.lost;
      S.todayTouched = t.won + t.lost > 0;
      S.last = t.last.slice(-10);
      renderTicks();
      renderResult();
    } catch (e) {
      /* stays at zero */
    }
  }
  async function switchTable(symbol: string, tf: ArcadeTf) {
    S.pend.slice().forEach((p: any) => cancelPend(p.id, true));
    S.asset = symbol;
    S.tf = tf;
    S.dur = tfSeconds(tf);
    S.round = null;
    S.next = null;
    S.pos = null;
    S.pts = [];
    S.hist = [];
    S.histRounds = [];
    lastStack = { u: "", d: "" };
    $("#qsym").textContent = symbol;
    const rg = Math.round(200 * K() * 100) / 100;
    $("#mTop").textContent = "+$" + rg;
    $("#mBot").textContent = "−$" + rg;
    $$("[data-dur]").forEach((x) => x.setAttribute("aria-pressed", String((x.dataset.dur === "30") === (tf === "30s"))));
    renderCats();
    applyMarket();
    renderBead();
    renderRoad();
    renderStats();
    opts.onTableChange?.(symbol, tf);
    await refreshTable(true);
  }
  async function setAsset(k: string) {
    if (!ARCADE_ASSETS[k]) return;
    if (k === S.asset) {
      sfx.click();
      return;
    }
    const a = ARCADE_ASSETS[k];
    lastOf[a.kind] = k;
    const tf: ArcadeTf = a.kind === "stock" ? "1m" : S.tf;
    const cb = curCat();
    await switchTable(k, tf);
    const cc = curCat() || cb,
      c = center(cc);
    burst(c.x, c.y, a.c, 34);
    flash(a.c);
    sfx.bet();
    Lx.react("bet");
    press(cc);
  }

  /* ---------- modals ---------- */
  const coM = $("#coModal"),
    shM = $("#shModal");
  let coPct = 100,
    shLive = false,
    lastFocus: any = null;
  function openModal(m: any) {
    lastFocus = document.activeElement;
    m.hidden = false;
    openOrders(false);
    if (!amenu.hidden) openMenu(false);
    setTimeout(() => m.querySelector("[data-close]").focus(), 30);
  }
  function closeModal(m: any) {
    if (m.hidden) return;
    m.hidden = true;
    sfx.click();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  [coM, shM].forEach((m) =>
    on(m, "click", (e: any) => {
      if (e.target === m || e.target.closest("[data-close]")) closeModal(m);
    }),
  );
  function setCo(p: number) {
    coPct = Math.max(1, Math.min(100, Math.round(p)));
    const r = $("#coRange");
    r.value = coPct;
    r.style.setProperty("--p", ((coPct - 1) / 99) * 100 + "%");
    $$("[data-pct]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.pct === coPct)));
    renderCo();
  }
  function renderCo() {
    if (!S.pos) {
      closeModal(coM);
      return;
    }
    const Pp = S.pos,
      f = coPct >= 100 ? 1 : Math.max(1, Math.min(Pp.sh - 1, Math.round((Pp.sh * coPct) / 100))) / Pp.sh,
      get = posValue() * f,
      pnl = get - Pp.margin * f;
    $("#coOut").textContent = coPct + "%";
    $("#coInfo").innerHTML = `Cashing out <b>${coPct}%</b> of your <span class="sd${Pp.side}">${SIDE(Pp.side)}</span> call. You get back <span class="get">≈ ${money(get)}</span>`;
    $("#coGo").textContent = `Cash out ≈ ${money(get)}`;
    $("#coNote").innerHTML = `${coPct < 100 ? `Keeps ${Pp.sh - Math.round(Pp.sh * f)} sh riding · ` : ""}<span style="color:${pnl < 0 ? "var(--hot)" : "var(--lime)"}">${signed(pnl)}</span> vs what you put in`;
  }
  function openCo() {
    if (!S.pos) return;
    openModal(coM);
    setCo(100);
  }
  $$("[data-pct]").forEach((b) =>
    on(b, "click", () => {
      sfx.key();
      press(b);
      setCo(+b.dataset.pct);
    }),
  );
  on($("#coRange"), "input", (e: any) => {
    setCo(+e.target.value);
    if (AC) tone(300 + coPct * 6, 0.025, "square", 0.025);
  });
  on($("#coGo"), "click", (e: any) => {
    if (!S.pos) return;
    press(e.currentTarget);
    const p = coPct;
    coM.hidden = true;
    void cashOut(false, p);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  });
  /* share */
  function shareData() {
    if (S.pos) {
      const Pp = S.pos;
      return { side: Pp.side, put: Pp.margin, worth: posValue(), live: true, asset: S.asset, dur: S.dur };
    }
    return S.shareLast;
  }
  const durTxt = (d: number) => (d < 60 ? d + "s" : d / 60 + "m");
  const funLine = (roi: number) => (roi >= 100 ? "🔥 Absolute legend!" : roi >= 30 ? "💰 Nice gains!" : roi >= 0 ? "✨ Well played!" : roi <= -50 ? "😭 That's rough buddy..." : "📉 We go again!");
  let shArtWin: boolean | null = null;
  function renderShare() {
    const D = shareData();
    if (!D) return;
    const pnl = D.worth - D.put,
      roi = D.put ? (pnl / D.put) * 100 : 0,
      win = pnl >= 0,
      a = ARCADE_ASSETS[D.asset];
    $("#shBox").classList.toggle("loss", !win);
    $("#shTitle").textContent = win ? "Share Your Win 🏆" : "Share Your Trade";
    $("#shSub").textContent = win ? "Show off your trading success" : "We go again next time!";
    $("#shPill").textContent = D.live ? (win ? "⚡ Winning!" : "📉 Losing") : win ? (D.cash ? "💸 Cashed out" : "🏆 Won") : D.cash ? "💸 Cashed out" : "💀 Lost";
    $("#shTag").textContent = D.live ? "LIVE CALL" : "SETTLED";
    $("#shHeroL").textContent = (win ? "PROFIT" : "LOST") + (D.live ? " SO FAR" : "");
    $("#shPv").textContent = signed(pnl);
    $("#shRoi").textContent = `${roi >= 0 ? "+" : "−"}${Math.abs(roi).toFixed(1)}% ROI`;
    $("#shFun").textContent = funLine(roi);
    $("#shQ").textContent = `${a.name} — up or down?`;
    $("#shD").innerHTML = `<span class="${D.side === "u" ? "mu" : "mdn"}">${SIDE(D.side)}</span> · ${durTxt(D.dur)} round`;
    $("#shIn").textContent = money(D.put);
    $("#shOutL").textContent = D.live ? "Now worth" : D.cash ? "Cashed out" : "Paid out";
    $("#shOut").textContent = money(D.worth);
    $("#shCta").textContent = win ? "Join & trade like a pro!" : "Join & do better than me 😅";
    if (shArtWin !== win) {
      shArtWin = win;
      const im = $("#shArt");
      im.src = win ? "/arcade/share-win.png" : "/arcade/share-lose.png";
      im.alt = win ? "Lynx celebrating in a shower of gold coins" : "Lynx crying";
    }
  }
  (function drawQr() {
    const q = $("#shQr"),
      x = q.getContext("2d"),
      N = 25;
    x.fillStyle = "#fff";
    x.fillRect(0, 0, N, N);
    x.fillStyle = "#07090f";
    let r = 7531;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (rnd() < 0.5) x.fillRect(i, j, 1, 1);
    [
      [0, 0],
      [N - 7, 0],
      [0, N - 7],
    ].forEach(([a, b]) => {
      x.fillStyle = "#fff";
      x.fillRect(a - 1 < 0 ? 0 : a - 1, b - 1 < 0 ? 0 : b - 1, 9, 9);
      x.fillStyle = "#07090f";
      x.fillRect(a, b, 7, 7);
      x.fillStyle = "#fff";
      x.fillRect(a + 1, b + 1, 5, 5);
      x.fillStyle = "#07090f";
      x.fillRect(a + 2, b + 2, 3, 3);
    });
  })();
  $("#shAva").src = api.avatarUrl || SPR.lynx[0];
  const shName = $("#shName");
  if (shName) shName.textContent = api.username;
  const shRef = $("#shRef");
  if (shRef) shRef.textContent = api.referralLink.split("/").pop() || "";
  function openShare() {
    const D = shareData();
    if (!D) return;
    shLive = !!D.live;
    shArtWin = null;
    renderShare();
    openModal(shM);
    const win = D.worth >= D.put,
      c = { x: innerWidth / 2, y: innerHeight * 0.35 };
    if (win) {
      burst(c.x, c.y, C.dn, 36, true);
      rain(C.dn, 24);
      tone(880, 0.08, "square", 0.05);
    } else {
      flash(C.hot);
      tone(180, 0.18, "sawtooth", 0.05);
    }
  }
  $$("[data-sh]").forEach((b) =>
    on(b, "click", () => {
      audio();
      sfx.key();
      press(b);
      const k = b.dataset.sh,
        link = api.referralLink;
      if (k === "copy") {
        try {
          navigator.clipboard.writeText(link).then(
            () => toast("Link copied · " + link),
            () => toast("Link · " + link),
          );
        } catch (e) {
          toast("Link · " + link);
        }
      } else if (k === "x") window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(`${$("#shPv").textContent} on ${S.asset} ${durTxt(S.dur)} Up/Down at OmenX Quick Play`)}&url=${encodeURIComponent(link)}`, "_blank", "noopener");
      else if (k === "tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`${$("#shPv").textContent} on ${S.asset} at OmenX Quick Play`)}`, "_blank", "noopener");
      else if (k === "save") toast("Long-press the card to save it");
      else toast("More share options coming with the poster service");
      const c = center(b);
      burst(c.x, c.y, C.dn, 14);
    }),
  );

  /* ---------- hover readouts ---------- */
  const tip = $("#tip");
  function showTip(html: string, x: number, y: number) {
    tip.innerHTML = html;
    tip.hidden = false;
    const w = tip.offsetWidth,
      h = tip.offsetHeight;
    tip.style.left = Math.max(w / 2 + 8, Math.min(innerWidth - w / 2 - 8, x)) + "px";
    tip.style.top = Math.max(h + 16, y) + "px";
  }
  function hideTip() {
    tip.hidden = true;
  }
  const winOf = (r: ArcadeRoundRow) => `${fmtT(new Date(r.start_at), true)}–${fmtT(new Date(r.end_at), true)}`;
  const sideTxt = (r: boolean) => (r ? `<b>Up won</b>` : `<span class="w">Down won</span>`);
  function tipFor(t: any) {
    const el = t.closest && t.closest(".bead,.cell:not(.ghost),.tick,[data-tip]");
    if (el && root.contains(el)) {
      const r = el.getBoundingClientRect(),
        x = r.left + r.width / 2,
        y = r.top;
      if (el.classList.contains("bead") || el.classList.contains("cell")) {
        const i = +el.dataset.i,
          rr: ArcadeRoundRow | undefined = S.histRounds[i],
          up = el.classList.contains("u");
        if (!rr) return hideTip();
        const mv = (rr.close_price ?? rr.open_price) - rr.open_price;
        if (el.classList.contains("cell")) {
          const col = [...el.parentNode.children];
          return showTip(`${winOf(rr)} · ${sideTxt(up)} · streak ${col.indexOf(el) + 1}/${col.length}`, x, y);
        }
        return showTip(`${winOf(rr)} · ${sideTxt(up)} · ${up ? "▲ +" : "▼ −"}$${Math.abs(mv).toFixed(2)}`, x, y);
      }
      if (el.classList.contains("tick")) {
        const l = S.last.slice(-10)[+el.dataset.li];
        if (!l) return hideTip();
        const amt = Math.abs(l.pnl || 0).toFixed(2);
        return showTip(`${fmtT(new Date(l.t || now()), true)} · ${l.s === "u" ? "↑ UP" : "↓ DOWN"} · ${l.w ? `<span class="w">won +$${amt}</span>` : `<span class="l">lost −$${amt}</span>`}`, x, y);
      }
      const k = el.dataset.tip,
        tot = S.nUp + S.nDn;
      if (k === "split") return showTip(tot ? `Last ${tot} rounds · <b>Up ${Math.round((S.nUp / tot) * 100)}%</b> · <span class="w">Down ${Math.round((S.nDn / tot) * 100)}%</span>` : "No rounds settled yet", x, y);
      if (k === "longest") return showTip(`Longest ${S.longestS === "u" ? "Up" : "Down"} streak ×${S.longest} in the last ${tot} rounds`, x, y);
      if (k === "pnl") {
        const l = S.last.slice(-10),
          w = l.filter((x: any) => x.w).length;
        return showTip(`Your last ${l.length} rounds · <span class="w">${w} won</span> · <span class="l">${l.length - w} lost</span>`, x, y);
      }
    }
    if (hov.on) return;
    hideTip();
  }
  on(document, "mousemove", (e: any) => tipFor(e.target));
  on(document, "pointerdown", (e: any) => {
    if (e.pointerType !== "mouse") tipFor(e.target);
  });
  const plotEl = $("#plot");
  on(plotEl, "mousemove", (e: MouseEvent) => {
    const r = plotEl.getBoundingClientRect();
    hov.on = true;
    hov.x = e.clientX - r.left;
    hov.cx = e.clientX;
    hov.cy = e.clientY;
  });
  on(plotEl, "mouseleave", () => {
    hov.on = false;
    hov.pt = null;
    hideTip();
  });

  /* ---------- lynx pilot ---------- */
  const Lx = (() => {
    const el = $("#lynx"),
      img = $("#lynxImg"),
      emo = $("#emote"),
      win = $(".window");
    const V = SPR.lynx;
    let x = 60,
      tx = 60,
      dir = -1,
      mode = "idle",
      lockUntil = 0,
      nextThink = performance.now() + 1500,
      last = performance.now(),
      seq: any[] = [];
    const W = () => win.clientWidth - el.offsetWidth - 8;
    function view(i: number, flip?: boolean) {
      img.src = V[i];
      el.style.setProperty("--f", flip ? "-1" : "1");
    }
    function setMode(m: string) {
      if (mode === m) return;
      el.classList.remove("idle", "walk", "hop", "cheer", "sulk");
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
    function think(now: number) {
      const r = Math.random();
      if (r < 0.45) {
        tx = 12 + Math.random() * Math.max(10, W() - 12);
        dir = tx < x ? -1 : 1;
        setMode("walk");
        view(2, dir > 0);
      } else if (r < 0.65) {
        setMode("idle");
        view(1, Math.random() < 0.5);
        lockUntil = now + 900;
      } else if (r < 0.8) {
        setMode("idle");
        view(3);
        lockUntil = now + 1600;
      } else {
        setMode("idle");
        view(0);
      }
      nextThink = now + 1600 + Math.random() * 2600;
    }
    raf((now) => {
      const dt = Math.min(50, now - last);
      last = now;
      if (seq.length && now >= seq[0].t) {
        const st = seq.shift();
        st.f();
      }
      if (!seq.length && now > lockUntil) {
        if (mode === "walk") {
          const sp = 0.045 * dt;
          x += Math.sign(tx - x) * Math.min(sp, Math.abs(tx - x));
          if (Math.abs(tx - x) < 1) {
            setMode("idle");
            view(0);
          }
        } else if (mode !== "idle") {
          setMode("idle");
          view(0);
        } else if (now > nextThink && !RM) think(now);
      }
      x = Math.max(4, Math.min(W(), x));
      el.style.setProperty("--x", x + "px");
    });
    function react(kind: string) {
      const now = performance.now();
      seq = [];
      if (kind === "bet") {
        view(0);
        setMode("hop");
        emote("!");
        lockUntil = now + 600;
        nextThink = now + 2000;
      }
      if (kind === "win") {
        emote("★");
        setMode("cheer");
        const order = [
          [0, 0],
          [1, 0],
          [2, 1],
          [3, 0],
          [2, 0],
          [0, 0],
          [1, 1],
          [0, 0],
        ];
        order.forEach((v, i) => seq.push({ t: now + i * 220, f: () => view(v[0], !!v[1]) }));
        seq.push({ t: now + order.length * 220, f: () => {} });
        lockUntil = now + 1900;
        nextThink = now + 3000;
      }
      if (kind === "lose") {
        view(3);
        setMode("sulk");
        emote("…");
        lockUntil = now + 1800;
        nextThink = now + 2600;
      }
      if (kind === "poke") {
        view(0);
        setMode("hop");
        emote("♪");
        lockUntil = now + 500;
        nextThink = now + 1500;
        tone(880, 0.06, "square", 0.04, 1.5);
        tone(1320, 0.08, "square", 0.035, 1.2, 0.06);
      }
    }
    on(el, "click", () => {
      audio();
      react("poke");
    });
    return { react };
  })();

  /* ---------- space window (pixel art, 3× upscaled) ---------- */
  const sp = $("#space"),
    sctx = sp.getContext("2d");
  let SW = 0,
    SH = 0,
    stars: any[] = [],
    rocks: any[] = [],
    warpT = 0;
  const PX = 3;
  function makeRock(cx: number, w: number, h: number, seed: number) {
    const pts: any[] = [];
    let r = seed;
    const rnd = () => {
      r = (r * 9301 + 49297) % 233280;
      return r / 233280;
    };
    for (let x = -w / 2; x <= w / 2; x++) {
      const k = 1 - Math.pow(Math.abs(x) / (w / 2), 1.6);
      pts.push({ x: cx + x, h: Math.max(0, Math.round(h * k + (rnd() - 0.5) * 3)) });
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
  const ro2 = new ResizeObserver(sizeSpace);
  ro2.observe($(".window"));
  disposers.push(() => ro2.disconnect());
  function warp() {
    warpT = performance.now();
  }
  raf((t) => {
    if (!SW) return;
    sctx.fillStyle = "#00030a";
    sctx.fillRect(0, 0, SW, SH);
    const w = Math.max(0, 1 - (t - warpT) / 1600),
      cx = SW / 2,
      cy = SH * 0.4;
    for (const s of stars) {
      s.x -= (0.02 + s.z * 0.05) * (RM ? 0 : 1);
      if (s.x < 0) s.x += SW;
      const b = 0.5 + 0.5 * Math.sin(t / 400 + s.tw);
      if (w > 0 && !RM) {
        const dx = s.x - cx,
          dy = s.y - cy,
          len = w * 12 * (s.z + 0.3);
        sctx.strokeStyle = s.z > 0.6 ? "#cfff4a" : "#9fe9ff";
        sctx.globalAlpha = w;
        sctx.beginPath();
        sctx.moveTo(s.x, s.y);
        sctx.lineTo(s.x + (dx * 0.08 * len) / 6, s.y + (dy * 0.08 * len) / 6);
        sctx.stroke();
        sctx.globalAlpha = 1;
      }
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

  /* ---------- mobile: road & stats sheet + modals live inside the shell ---------- */
  (function mobileSheet() {
    const sh = $("#mSheet"),
      scrim = $("#mScrim"),
      peek = $("#mPeek"),
      hd = $("#mSheetH");
    if (!sh || !scrim || !peek || !hd) return;
    const shell = $(".m-shell");
    ["#orders", "#coModal", "#shModal", "#mScrim", "#mSheet"].forEach((q) => {
      const el = $(q);
      if (el && shell) shell.appendChild(el);
    });
    const open = (o: boolean) => {
      sh.classList.toggle("open", o);
      scrim.hidden = !o;
      peek.setAttribute("aria-expanded", String(o));
      sh.setAttribute("aria-hidden", String(!o));
      sh.style.transform = "";
      if (o) setTimeout(() => $("#mSheetX")?.focus(), 60);
      else peek.focus();
    };
    on(peek, "click", () => open(true));
    on(scrim, "click", () => open(false));
    on($("#mSheetX"), "click", (e: Event) => {
      e.stopPropagation();
      open(false);
    });
    on(window, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && sh.classList.contains("open")) open(false);
    });
    let y0: number | null = null,
      dy = 0;
    on(hd, "pointerdown", (e: PointerEvent) => {
      if ((e.target as any).closest("button")) return;
      y0 = e.clientY;
      dy = 0;
      sh.classList.add("drag");
      hd.setPointerCapture(e.pointerId);
    });
    on(hd, "pointermove", (e: PointerEvent) => {
      if (y0 === null) return;
      dy = Math.max(0, e.clientY - y0);
      sh.style.transform = `translate(-50%,${dy}px)`;
    });
    const end = () => {
      if (y0 === null) return;
      y0 = null;
      sh.classList.remove("drag");
      sh.style.transform = "";
      if (dy > 80) open(false);
    };
    on(hd, "pointerup", end);
    on(hd, "pointercancel", end);
    let py: number | null = null;
    on(peek, "touchstart", (e: TouchEvent) => (py = e.touches[0].clientY), { passive: true });
    on(peek, "touchend", (e: TouchEvent) => {
      if (py !== null && py - e.changedTouches[0].clientY > 30) open(true);
      py = null;
    }, { passive: true });
  })();

  /* ---------- boot ---------- */
  renderCats();
  $("#equity").textContent = money(S.equity);
  void switchTable(S.asset, S.tf).then(() => loadToday());
  if (!opts.fixture) every(() => void refreshTable(false), 15000);

  /* ---------- public setters (React → engine) ---------- */
  (root as any).__arcade = {
    setBalance(v: number) {
      if (Math.abs(v - S.equity) > 0.005) {
        S.equity = v;
        eqTo(v);
      }
    },
    setUser() {
      if (api.userId && S.round) {
        void loadHolding(S.round);
        void loadToday();
      }
    },
  };

  return () => {
    alive = false;
    timers.forEach(clearInterval);
    clearTimeout(reconcileT);
    clearTimeout(toastT);
    S.pend.forEach((p: any) => clearTimeout(p.timer));
    disposers.forEach((d) => d());
    delete (root as any).__arcade;
  };
}
