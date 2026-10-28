// ============================================================
// Quick Play entry banner — Events "All" view, above the stage.
// CPO 2026-10-28: 方案 C「pixel night scene」from the entry 比稿
// (artifact QeVaSA7hP2jwBpRXkoAJk4, scheme q) replaces the V1-B steel panel /
// V1-A CRT strip. One strip: a pixel skyline scrolling behind, the live index
// line glowing over it, the lynx walking the pavement, HUD left (title / price /
// 30 s change), HUD right (the table's 30-second clock / UP · DOWN quote / PLAY).
// It is a live readout of the BTC table: the same three-exchange index and
// model quote the cabinet shows (arcade_table_now). Numbers are never
// placeholders — while the index is invalid the banner says so.
// v2 product: no rounds — every chip is its own 30-second call. The clock on
// the right is the table's wall-clock 30 s slot (the road's cells), not a round.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTableNow, fetchTicks, type ArcadeTick } from "@/lib/arcade/arcadeCalls";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import "./arcade-entry.css";

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SLOT_MS = 30000;

interface Tick {
  /** the index is valid and quoting */
  live: boolean;
  /** the index now */
  price: number;
  /** the index 30 s ago (what a call placed then would be measured against) */
  open: number;
  /** UP price in cents, one decimal (0.40–0.60 model quote) */
  up: number;
  /** the last ~45 s of the index, one point per second */
  pts: number[];
}

/** Live readout of the BTC table — polls arcade_table_now every 2 s and keeps the last 45 s of index ticks. */
export const useArcadeTicker = (enabled = true): Tick => {
  const [tick, setTick] = useState<Tick>({ live: false, price: 0, open: 0, up: 50, pts: [] });
  const ptsRef = useRef<{ t: number; p: number }[]>([]);
  const lastTs = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const push = (t: ArcadeTick) => {
      if (!t.valid || t.idx == null) return;
      if (lastTs.current && t.ts <= lastTs.current) return;
      lastTs.current = t.ts;
      ptsRef.current.push({ t: new Date(t.ts.replace(" ", "T").replace(/\+00$/, "Z")).getTime(), p: t.idx });
      if (ptsRef.current.length > 60) ptsRef.current.shift();
    };
    const load = async () => {
      try {
        const d = await fetchTableNow();
        if (!alive) return;
        if (d.tick) push(d.tick);
        const pts = ptsRef.current;
        const nowMs = Date.now();
        const old = pts.find((x) => x.t >= nowMs - 31000) || pts[0];
        const t = d.tick;
        const live = !!(t && t.valid && t.p_up != null && !d.state?.paused_reason);
        setTick({ live, price: t && t.idx != null ? t.idx : pts.length ? pts[pts.length - 1].p : 0, open: old ? old.p : 0, up: t && t.p_up != null ? Math.round(t.p_up * 1000) / 10 : 50, pts: pts.map((x) => x.p) });
      } catch (e) {
        /* keep the last readout */
      }
    };
    void fetchTicks(45)
      .then((ts) => {
        if (!alive) return;
        ts.forEach(push);
      })
      .catch(() => {})
      .then(load);
    const poll = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [enabled]);
  return tick;
};

/** style-guide fixture: a frozen readout (no network, no clock) */
export type ArcadeBannerFixture = Tick;

/* ---------- the pixel skyline (2 px blocks): stars twinkle, clouds and buildings scroll, the pavement rolls ---------- */
const Level = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;
    const PX = 2;
    let W = 0,
      H = 0,
      stars: { x: number; y: number; t: number }[] = [],
      bld: { x: number; w: number; h: number; win: [number, number, boolean, number][] }[] = [],
      clouds: { x: number; y: number; w: number }[] = [];
    const size = () => {
      W = Math.floor(host.clientWidth / PX);
      H = Math.floor(host.clientHeight / PX);
      if (!W || !H) return;
      cv.width = W;
      cv.height = H;
      stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: 24 + Math.random() * (H * 0.45), t: Math.random() * 6 }));
      bld = [];
      let bx = 0;
      while (bx < W + 60) {
        const bw = 10 + Math.floor(Math.random() * 16),
          bh = 8 + Math.floor(Math.random() * 18);
        const win: [number, number, boolean, number][] = [];
        for (let yy = 4; yy < bh - 3; yy += 4) for (let xx = 3; xx < bw - 3; xx += 4) if (Math.random() < 0.35) win.push([xx, yy, Math.random() < 0.5, Math.random() * 6]);
        bld.push({ x: bx, w: bw, h: bh, win });
        bx += bw + 2 + Math.floor(Math.random() * 6);
      }
      clouds = Array.from({ length: 4 }, (_, i) => ({ x: (i * W) / 4 + Math.random() * 40, y: 26 + Math.random() * 12, w: 18 + Math.random() * 14 }));
    };
    const ro = new ResizeObserver(size);
    ro.observe(host);
    size();
    const rm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let off = 0,
      last = performance.now(),
      raf = 0;
    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const c = cv.getContext("2d");
      if (W && c && bld.length) {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#030913");
        g.addColorStop(0.75, "#0a2233");
        g.addColorStop(1, "#0f3346");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        stars.forEach((s) => {
          c.fillStyle = `rgba(200,240,255,${0.1 + 0.45 * Math.abs(Math.sin(t / 700 + s.t))})`;
          c.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
        });
        if (!rm) off += dt * 3;
        clouds.forEach((cl) => {
          const x = Math.round((((cl.x - off * 1.6) % (W + 40)) + W + 40) % (W + 40)) - 30;
          c.fillStyle = "rgba(30,70,95,.5)";
          c.fillRect(x, cl.y, cl.w, 3);
          c.fillRect(x + 3, cl.y - 2, cl.w - 8, 2);
        });
        const gy = H - 12;
        const lastB = bld[bld.length - 1];
        const span = lastB.x + lastB.w + 4;
        bld.forEach((b) => {
          const x = Math.round((((b.x - off) % span) + span) % span) - 20;
          c.fillStyle = "#0b2232";
          c.fillRect(x, gy - b.h, b.w, b.h);
          c.fillStyle = "#10304a";
          c.fillRect(x, gy - b.h, b.w, 1);
          b.win.forEach(([wx, wy, cy, ph]) => {
            if (Math.sin(t / 900 + ph) > -0.3) {
              c.fillStyle = cy ? "rgba(5,215,237,.7)" : "rgba(223,230,244,.45)";
              c.fillRect(x + wx, gy - b.h + wy, 1, 1);
            }
          });
        });
        c.fillStyle = "#2b3040";
        c.fillRect(0, gy, W, 12);
        c.fillStyle = "#a7b0c4";
        c.fillRect(0, gy, W, 1);
        c.fillStyle = "rgba(5,215,237,.35)";
        c.fillRect(0, gy + 1, W, 1);
        c.fillStyle = "#1c202b";
        const so = Math.round(off * 2) % 10;
        for (let y = gy + 2; y < H; y += 5) {
          c.fillRect(0, y + 4, W, 1);
          for (let x = (((y - gy) / 5) % 2) * 5 - so; x < W; x += 10) c.fillRect(x, y, 1, 4);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return <canvas ref={ref} className="bg" aria-hidden="true" />;
};

/* ---------- the index line: glow, open dashed line, area fill, pulsing head (entry 比稿 chart, nogrid · lw 3) ---------- */
const Chart = ({ pts, open, live }: { pts: number[]; open: number; live: boolean }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const data = useRef({ pts, open, live });
  data.current = { pts, open, live };
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const box = cv.parentElement?.getBoundingClientRect();
      if (!box || !box.width) return;
      const d = devicePixelRatio || 1;
      const W = box.width,
        H = box.height;
      if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) {
        cv.width = Math.round(W * d);
        cv.height = Math.round(H * d);
      }
      const x = cv.getContext("2d");
      if (!x) return;
      x.setTransform(d, 0, 0, d, 0, 0);
      x.clearRect(0, 0, W, H);
      const { pts, open, live } = data.current;
      if (pts.length < 2) return;
      let lo = open || pts[0],
        hi = open || pts[0];
      pts.forEach((p) => {
        lo = Math.min(lo, p);
        hi = Math.max(hi, p);
      });
      const pad = (hi - lo) * 0.18 + 1e-6;
      lo -= pad;
      hi += pad;
      const top = 6,
        bot = H - 6,
        n = pts.length - 1;
      const X = (i: number) => (i / n) * (W - 8);
      const Y = (v: number) => bot - ((v - lo) / (hi - lo)) * (bot - top);
      if (open) {
        x.setLineDash([4, 4]);
        x.strokeStyle = "rgba(238,242,248,.25)";
        x.beginPath();
        x.moveTo(0, Math.round(Y(open)) + 0.5);
        x.lineTo(W, Math.round(Y(open)) + 0.5);
        x.stroke();
        x.setLineDash([]);
      }
      const last = pts[pts.length - 1];
      const col = !live ? "#7f8a99" : last >= (open || last) ? "#33d6ff" : "#cfff4a";
      const path = () => {
        x.beginPath();
        pts.forEach((p, i) => (i ? x.lineTo(X(i), Y(p)) : x.moveTo(X(i), Y(p))));
      };
      path();
      x.lineWidth = 10;
      x.strokeStyle = col + "1c";
      x.stroke();
      path();
      x.lineWidth = 3;
      x.lineJoin = "round";
      x.strokeStyle = col;
      x.shadowColor = col;
      x.shadowBlur = 14;
      x.stroke();
      x.shadowBlur = 0;
      const lx = X(n),
        ly = Y(last);
      x.lineTo(lx, bot);
      x.lineTo(X(0), bot);
      x.closePath();
      const g = x.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, col + "38");
      g.addColorStop(1, col + "00");
      x.fillStyle = g;
      x.fill();
      const pulse = 1 + 0.5 * Math.abs(Math.sin(performance.now() / 300));
      x.fillStyle = col + "44";
      x.beginPath();
      x.arc(lx, ly, 5 * pulse, 0, 7);
      x.fill();
      x.fillStyle = col;
      x.shadowColor = col;
      x.shadowBlur = 6;
      x.beginPath();
      x.arc(lx, ly, 3, 0, 7);
      x.fill();
      x.shadowBlur = 0;
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span className="chart" aria-hidden="true">
      <canvas ref={ref} />
    </span>
  );
};

/* ---------- the lynx on the pavement: idle breathe · look · walk (dust) · hop · sit; now and then walks somewhere, hops and pops a coin ---------- */
const SPR = { lynx0: "/arcade/lynx0.png", lynx1: "/arcade/lynx1.png", lynx2: "/arcade/lynx2.png", lynx3: "/arcade/lynx3.png", coin0: "/arcade/coin0.png", coin1: "/arcade/coin1.png" };
type Act = { k: "idle" | "walk" | "look" | "hop" | "sit"; d: number; t: number; to?: number; then?: () => void; n?: number; h?: number; f?: number };
const Stage = ({ mobile, zone }: { mobile: boolean; zone: [number, number] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const z = useRef(zone);
  z.current = zone;
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const rm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const w = 28,
      ground = mobile ? 20 : 24,
      speed = 30;
    const el = document.createElement("img");
    el.className = "lynx";
    el.alt = "";
    el.style.width = w + "px";
    el.style.bottom = ground + "px";
    box.appendChild(el);
    const fx = (x: number, y: number, cls: string, html = "", dx = 0) => {
      const e = document.createElement("span");
      e.className = "fxp " + cls;
      e.innerHTML = html;
      e.style.left = x + "px";
      e.style.top = y + "px";
      if (dx) e.style.setProperty("--dx", dx + "px");
      box.appendChild(e);
      setTimeout(() => e.remove(), 1300);
    };
    const zoneNow = (): [number, number] => {
      const cw = box.clientWidth;
      const zz = mobile || cw < 760 ? [16, cw - 16] : z.current;
      return [zz[0], Math.max(zz[0] + 20, zz[1]) - w];
    };
    let x: number | null = null,
      dir = 1,
      act: Act = { k: "idle", d: 1, t: 0 },
      cur = "";
    const set = (a: Act) => {
      a.t = 0;
      act = a;
    };
    const hop = (n = 1, h = 10, then?: () => void, d = 0.5) => set({ k: "hop", d, n, h, then, t: 0 });
    const walkTo = (tx: number, then?: () => void) => {
      const [a, b] = zoneNow();
      set({ k: "walk", d: 0, to: Math.max(a, Math.min(b, tx)), then, t: 0 });
    };
    const head = () => box.clientHeight - ground - (w * 72) / 51;
    const special = () => {
      const [a, b] = zoneNow();
      walkTo(a + Math.random() * (b - a), () => {
        hop(1, 14);
        setTimeout(() => {
          if (x != null) fx(x + w / 2, head() - 4, "fx-coin", `<img alt="" src="${Math.random() < 0.5 ? SPR.coin0 : SPR.coin1}">`);
        }, 180);
      });
    };
    const pick = () => {
      const [a, b] = zoneNow();
      const q = Math.random();
      if (q < 0.3) special();
      else if (q < 0.55) walkTo(a + Math.random() * (b - a));
      else if (q < 0.72) set({ k: "idle", d: 1 + Math.random() * 1.6, t: 0 });
      else if (q < 0.84) set({ k: "look", d: 1.6, t: 0 });
      else if (q < 0.93) hop(1, 10);
      else set({ k: "sit", d: 1.3, t: 0 });
    };
    let last = performance.now(),
      raf = 0;
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      const dt = rm ? 0 : Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!box.clientWidth) return;
      {
        const [za, zb] = zoneNow();
        if (x == null || x < za - 40 || x > zb + 40) x = (za + zb) / 2;
      }
      let src = SPR.lynx0,
        fl = 1,
        sx = 1,
        sy = 1,
        y = 0;
      act.t += dt;
      const p = act.d ? Math.min(1, act.t / act.d) : 0;
      switch (act.k) {
        case "walk": {
          const dd = (act.to ?? x) - x;
          if (Math.abs(dd) < 1) {
            x = act.to ?? x;
            const th = act.then;
            set({ k: "idle", d: 0.3 + Math.random() * 0.4, t: 0 });
            th && th();
            break;
          }
          dir = Math.sign(dd);
          x += dir * Math.min(Math.abs(dd), speed * dt);
          src = SPR.lynx2;
          fl = -dir;
          y = -Math.abs(Math.sin(t / 85)) * 1.6;
          sy = 1 + 0.035 * Math.sin(t / 85);
          if (Math.random() < dt * 2.2) fx(x + w / 2 - dir * w * 0.3, box.clientHeight - ground, "fx-dust", "", -dir * 6);
          break;
        }
        case "idle":
          sy = 1 + 0.025 * Math.sin(t / 320);
          sx = 1 - 0.012 * Math.sin(t / 320);
          break;
        case "look":
          if (act.f == null) act.f = Math.random() < 0.5 ? 1 : -1;
          src = p < 0.85 ? SPR.lynx2 : SPR.lynx0;
          fl = p < 0.85 ? -act.f : 1;
          break;
        case "sit":
          src = SPR.lynx1;
          sy = 0.86 + 0.02 * Math.sin(t / 200);
          sx = 1.08;
          break;
        case "hop": {
          const h = act.h ?? 10;
          if (p < 0.16) {
            const q = p / 0.16;
            sy = 1 - 0.16 * q;
            sx = 1 + 0.1 * q;
            src = SPR.lynx1;
          } else if (p < 0.86) {
            const q = (p - 0.16) / 0.7;
            y = -Math.sin(q * Math.PI) * h;
            sy = 1.07 - 0.07 * q;
            sx = 0.94 + 0.06 * q;
            src = SPR.lynx0;
          } else {
            const q = (p - 0.86) / 0.14;
            sy = 0.86 + 0.14 * q;
            sx = 1.08 - 0.08 * q;
            src = SPR.lynx1;
          }
          if (p >= 1) {
            fx(x + w * 0.25, box.clientHeight - ground, "fx-dust", "", -8);
            fx(x + w * 0.75, box.clientHeight - ground, "fx-dust", "", 8);
            if ((act.n ?? 1) > 1) {
              act.n = (act.n ?? 1) - 1;
              act.t = 0;
            } else {
              const th = act.then;
              set({ k: "idle", d: 0.5 + Math.random() * 0.6, t: 0 });
              th && th();
            }
          }
          break;
        }
      }
      if (act.d && act.t >= act.d && act.k !== "hop" && act.k !== "walk") pick();
      if (cur !== src) {
        el.src = src;
        cur = src;
      }
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(fl * sx).toFixed(3)},${sy.toFixed(3)})`;
    };
    pick();
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      el.remove();
    };
  }, [mobile]);
  return <div ref={ref} className="stage" aria-hidden="true" />;
};

/** The table's 30-second clock (wall-clock slots, the same cells as the cabinet's road). */
const useSlotClock = (frozen?: number) => {
  const [left, setLeft] = useState(frozen ?? 22);
  useEffect(() => {
    if (frozen != null) return;
    const tick = () => setLeft(Math.ceil((SLOT_MS - (Date.now() % SLOT_MS)) / 1000));
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [frozen]);
  return left;
};

export const ArcadeEntryBanner = ({ isMobile, fixture }: { isMobile: boolean; fixture?: ArcadeBannerFixture }) => {
  const liveTick = useArcadeTicker(!fixture);
  const t = fixture ?? liveTick;
  const left = useSlotClock(fixture ? 22 : undefined);
  const host = useRef<HTMLAnchorElement>(null);
  const [cw, setCw] = useState(1232);
  useEffect(() => {
    ensureArcadeFonts();
  }, []);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth));
    ro.observe(el);
    setCw(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const live = t.live;
  const chg = t.price - t.open;
  const up = chg >= 0;
  const upC = live ? t.up.toFixed(1) : "—";
  const dnC = live ? (100 - t.up).toFixed(1) : "—";
  return (
    <Link ref={host} to="/arcade" className={`qpc${isMobile ? " m" : ""}${live ? "" : " off"}`} aria-label="Quick Play · BTC 30-second calls">
      <Level />
      <span className="vig" aria-hidden="true" />
      <Chart pts={t.pts} open={t.open} live={live} />
      <span className="lft">
        <span className="hrow">
          <span className="ttl">QUICK PLAY</span>
          <span className="sb">BTC · 30-SECOND CALLS · 24/7</span>
        </span>
        <span className="px">{t.price ? money(t.price) : "$—"}</span>
        <span className="op">
          {live && t.open ? (
            <>
              {money(t.open)} · <span className={up ? "u" : "d"}>{up ? "▲ +" : "▼ −"}{money(Math.abs(chg))}</span> · last 30s
            </>
          ) : (
            <span className="x">INDEX INVALID · WAITING FOR THE EXCHANGES</span>
          )}
        </span>
      </span>
      <span className="rgt">
        <span className="stt">
          <span className="tmc">
            <small>TIME</small>
            <i className="tb" style={{ ["--p" as string]: left / 30 }}>
              <b />
            </i>
            <b>00:{String(left).padStart(2, "0")}</b>
          </span>
          <span className="ods">
            <span className="od ou">
              <small>▲ UP</small>
              <b>{upC}¢</b>
            </span>
            <span className="od odn">
              <small>▼ DOWN</small>
              <b>{dnC}¢</b>
            </span>
          </span>
        </span>
        <i className="sep" aria-hidden="true" />
        <span className="gbtn">
          <span>
            PLAY <i>▸</i>
          </span>
        </span>
      </span>
      <Stage mobile={isMobile} zone={[310, cw - 490]} />
    </Link>
  );
};

export default ArcadeEntryBanner;
