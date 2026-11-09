// ============================================================
// SG-HP · 首页 tape / 骨架 + /spot session 三态（ST-1）previews。
// 首页五段（Sports / Crypto / Stocks / Editor's Desk / More）2026-11-09 起在 homeAllPreviews.tsx（HA-*）。
//
// 铁律：只挂生产组件；fixture 只注数据与状态（禁布局型 prop、禁运行时
// fetch、禁 Date.now 派生的可变文案）。二阶漂移全部冻结：
//   - tickSeconds = 41（固定），派生价因此恒定；
//   - session 三态用 nowOverride 冻结（生产不传 = 实时钟，行为零变化）；
//   - 日期一律相对偏移，倒计时值由冻结的 nowOverride 反推。
// ============================================================
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { HomeTape, HomeTapeSkeleton, type TapeItem } from "@/components/lite/home/HomeTape";
import {
  LiteAllStageSkeleton,
  LiteMarketGridSkeleton,
  LiteMarketListSkeleton,
  LiteMobileStageSkeleton,
} from "@/components/lite/skeletons/LiteEventsSkeletons";
import { SpotSessionBanner } from "@/components/lite/trade/SpotSessionBanner";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import {
  HK_STOCK_MARKET,
  US_STOCK_MARKET,
  getStockSessionState,
} from "@/lib/usStockSessions";
import { useState } from "react";

/* ------------------------------ shells ---------------------------------- */

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#0A0B0D] p-4">{children}</div>
);


/* --------------------------- frozen session clocks ----------------------- */

/**
 * Session fixtures are anchored to a fixed weekday/weekend instant in the
 * VIEWER's own zone, so the phase a case demonstrates never depends on when
 * the page is opened. Times are chosen against each market's local calendar.
 */
const tzOffsetMinutes = (d: Date, tz: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => Number(parts.find((x) => x.type === t)?.value ?? 0);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  return (asUtc - d.getTime()) / 60_000;
};

/** Fixed exchange wall-clock instant on the next given weekday. */
const atMarketClock = (tz: string, dow: number, h: number, m = 0): Date => {
  const base = Date.now();
  for (let i = 0; i < 8; i += 1) {
    const cand = new Date(base + i * 86_400_000);
    const off = tzOffsetMinutes(cand, tz);
    const local = new Date(cand.getTime() + off * 60_000);
    if (local.getUTCDay() === dow) {
      return new Date(
        Date.UTC(
          local.getUTCFullYear(),
          local.getUTCMonth(),
          local.getUTCDate(),
          h,
          m,
        ) -
          off * 60_000,
      );
    }
  }
  return new Date(base);
};

const US_TZ = US_STOCK_MARKET.tz;

/** US live: Wednesday 11:00 ET (inside 09:30–16:00). */
export const NOW_US_LIVE = atMarketClock(US_TZ, 3, 11, 0);
/** US settling: Wednesday 16:22 ET → 38:00 left of the 60-minute window. */
export const NOW_US_SETTLING = atMarketClock(US_TZ, 3, 16, 22);
/** HK after close, no prints: Wednesday 18:00 HKT (16:00 close, next open Thursday 09:30). */
export const NOW_HK_AFTER_CLOSE = atMarketClock("Asia/Hong_Kong", 3, 18, 0);
/** US pre-session: Sunday 14:00 ET → next open is Monday 09:30 (weekend rule). */
export const NOW_US_PRESESSION = atMarketClock(US_TZ, 0, 14, 0);
/** SP-17: close + 15 min ET → 45:00 left. */
export const NOW_SPOT_SETTLING = atMarketClock(US_TZ, 3, 16, 15);

/* -------------------------------- EV-33 tape ----------------------------- */

const TAPE_ITEMS: TapeItem[] = [
  { key: "btc", symbol: "BTC", price: "$61,982", pct: 0.42, href: "/spot?event=btc" },
  { key: "eth", symbol: "ETH", price: "$2,984.11", pct: -1.42, href: "/spot?event=eth" },
  { key: "sol", symbol: "SOL", price: "$214.60", pct: 0.86, href: "/spot?event=sol" },
  { key: "NVDA", symbol: "NVDA", price: "$182.45", pct: 1.24, href: "/spot?event=nvda" },
  { key: "TSLA", symbol: "TSLA", price: "$268.30", pct: -0.63, href: "/spot?event=tsla" },
  { key: "AAPL", symbol: "AAPL", price: "$583.37", pct: 0.18, href: "/spot?event=aapl" },
  { key: "MSFT", symbol: "MSFT", price: "$445.20", pct: -0.24, href: "/spot?event=msft" },
  { key: "META", symbol: "META", price: "$615.40", pct: 0.77, href: "/spot?event=meta" },
];

/** EV-33 · 行情 tape（8 项固定顺序 + 恒滚 + loading 骨架 + items=0 → null）。 */
export const Ev33Preview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col" style={{ background: "#0A0B0D" }}>
      <HomeTape items={TAPE_ITEMS} loading={false} isMobile={!!isMobile} />
      <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        loading = true → 骨架条（桌面 42 / 移动 40）
      </div>
      <HomeTapeSkeleton height={isMobile ? 40 : 42} />
      <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        items = 0 → 整条 null（下方无元素）
      </div>
      <HomeTape items={[]} loading={false} isMobile={!!isMobile} />
    </div>
  );
};

/* --------------------------- EV-24 / EV-25 骨架 -------------------------- */

/** EV-24 · 首载 stage 骨架（tape 骨架条 + stage 骨架）。 */
export const Ev24Preview = () => {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: "#0A0B0D" }}>
      <HomeTapeSkeleton height={isMobile ? 40 : 42} />
      <div className="p-4">
        {isMobile ? <LiteMobileStageSkeleton /> : <LiteAllStageSkeleton />}
      </div>
    </div>
  );
};

/** EV-25 · 目录首载骨架（eventsFirstLoad，只有目录，无 stage）。 */
export const Ev25Preview = () => {
  const isMobile = useIsMobile();
  return <Stage>{isMobile ? <LiteMarketListSkeleton /> : <LiteMarketGridSkeleton />}</Stage>;
};

/* ------------------------- SP-17 / SP-18 session ------------------------- */

const SpotSessionDemo = ({ now }: { now: Date }) => {
  const isMobile = useIsMobile();
  const session = useMemo(() => getStockSessionState(US_STOCK_MARKET, now), [now]);
  const settling = session.phase === "settling";
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  return (
    <Stage>
      <div className="flex flex-col" style={{ gap: 14 }}>
        <SpotSessionBanner
          session={session}
          market={US_STOCK_MARKET}
          closePrice={583.37}
          pctToday={settling ? 0.42 : 0}
          nowOverride={now}
        />
        <LiteOrderPanel
          eventName="Apple (AAPL) — will close higher today?"
          eventId="us-aapl-updown-sg"
          countdownText={settling ? "00:00:00" : "12:50:01"}
          yesLabel="Up"
          noLabel="Down"
          yesPrice={0.41}
          noPrice={0.59}
          yesOptionId="sg-aapl-up"
          noOptionId="sg-aapl-down"
          yesOptionLabel="Up"
          noOptionLabel="Down"
          blocked={settling}
          blockedReason={settling ? "Settled" : undefined}
          side={side}
          onSideChange={setSide}
          amount={amount}
          onAmountChange={setAmount}
          variant={isMobile ? "mobile" : "desktop"}
          onRequestAuth={() => undefined}
        />
      </div>
    </Stage>
  );
};

/** SP-17 · SessionBanner settling + 禁单（收盘 +15 分 → Next session in 45:00）。 */
export const Sp17Preview = () => <SpotSessionDemo now={NOW_SPOT_SETTLING} />;
/** SP-18 · SessionBanner preSession（周日 → Opens 周一开盘；下单可用）。 */
export const Sp18Preview = () => <SpotSessionDemo now={NOW_US_PRESESSION} />;

/** HK market export kept for the SP/EV notes that reference the HK calendar. */
export const HK_MARKET_REF = HK_STOCK_MARKET;
