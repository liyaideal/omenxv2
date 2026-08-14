// ============================================================
// /style-guide → "Lite · All stage".
// Playground registration ONLY. Every preset feeds the shipped
// components fixed mock data + a frozen mock "now" so the states
// render deterministically and never touch the database.
// ============================================================
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { IntradayStageCard } from "@/components/lite/allstage/IntradayStageCard";
import { SportsStageCard } from "@/components/lite/sports/SportsStageCard";
import { LiteIntradayView } from "@/components/lite/categoryviews/LiteIntradayView";
import { LiteSportsView } from "@/components/lite/categoryviews/LiteSportsView";
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import { DirectionButton } from "@/components/lite/categoryviews/verticalBlocks";
import { TraitChip } from "@/components/lite/LiteListControls";
import {
  Coin,
  QuickEvent,
  StockEventRow,
  Timeframe,
  TF_SECONDS,
} from "@/components/lite/intraday/intradayData";
import { SportsMatch } from "@/components/lite/sports/sportsData";
import { FROZEN_NOW } from "../frozenClock";
import { CategoryPill } from "@/components/lite/CategoryPill";
import { TOP_CATEGORIES } from "@/lib/taxonomy";
import { MobileSportsModule } from "@/components/lite/mobile/MobileSportsModule";

/* ---------------- Frozen mock clock ---------------- */
/** All mock timestamps hang off this single frozen instant. */
const NOW = FROZEN_NOW;
const MIN = 60_000;
const iso = (msFromNow: number) => new Date(NOW + msFromNow).toISOString();

/* ---------------- Preset rail ---------------- */
const PresetRail = <T extends { id: string; label: string }>({
  presets,
  activeId,
  onSelect,
}: {
  presets: readonly T[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {presets.map((p) => (
      <button
        key={p.id}
        type="button"
        onClick={() => onSelect(p.id)}
        className={cn(
          "shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
          p.id === activeId
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
);

const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground">{children}</p>
);

/* ---------------- Mock builders ---------------- */
const mockQuick = (
  coin: Coin,
  tf: Timeframe,
  upPrice: number,
  secondsLeft: number,
  base: number,
): QuickEvent => ({
  id: `crypto-${coin}-updown-${tf}-1`,
  name: `${coin.toUpperCase()} ${tf} round`,
  coin,
  tf,
  period: "1",
  base_price: base,
  start_date: iso(-(TF_SECONDS[tf] - secondsLeft) * 1000),
  end_date: iso(secondsLeft * 1000),
  volume: 48_200,
  is_resolved: false,
  options: [
    { id: `crypto-${coin}-${tf}-up`, label: "Up", price: upPrice, is_winner: null },
    {
      id: `crypto-${coin}-${tf}-down`,
      label: "Down",
      price: Number((1 - upPrice).toFixed(2)),
      is_winner: null,
    },
  ],
});

const COIN_BASE: Record<Coin, number> = { btc: 68420, eth: 3512, sol: 184.2 };
const COIN_UP: Record<Coin, number> = { btc: 0.58, eth: 0.46, sol: 0.63 };
const TFS: Timeframe[] = ["5m", "15m", "1h", "4h", "1d"];

/** Every coin × timeframe pre-populated so the per-card dials stay clickable. */
const currentFor = new Map<string, QuickEvent>();
const historyFor = new Map<string, ("up" | "down")[]>();
(["btc", "eth", "sol"] as Coin[]).forEach((coin, ci) => {
  TFS.forEach((tf, ti) => {
    currentFor.set(
      `${coin}-${tf}`,
      mockQuick(
        coin,
        tf,
        Math.min(0.86, Math.max(0.14, COIN_UP[coin] + ti * 0.04 - 0.06)),
        Math.round(TF_SECONDS[tf] * 0.42),
        COIN_BASE[coin],
      ),
    );
    historyFor.set(
      `${coin}-${tf}`,
      Array.from({ length: 8 }, (_, i) =>
        (i + ci + ti) % 3 === 0 ? "down" : "up",
      ) as ("up" | "down")[],
    );
  });
});

const usStock = (
  ticker: string,
  base: number,
  upPrice: number,
  endMin: number,
): StockEventRow => ({
  id: `us-${ticker.toLowerCase()}-updown-20260803`,
  name: `${ticker} — will it close higher today?`,
  base_price: base,
  start_date: iso(-210 * MIN),
  end_date: iso(endMin * MIN),
  freeze_time: null,
  event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
  upPrice,
  downPrice: Number((1 - upPrice).toFixed(2)),
});

const hkStock = (
  code: string,
  base: number,
  upPrice: number,
  endMin: number,
): StockEventRow => ({
  id: `hk-${code}-updown-20260803`,
  name: `${code}.HK — will it close higher today?`,
  base_price: base,
  start_date: iso(-180 * MIN),
  end_date: iso(endMin * MIN),
  freeze_time: null,
  event_subtype: "HK_STOCK_DAILY_UPDOWN_SPOT",
  upPrice,
  downPrice: Number((1 - upPrice).toFixed(2)),
});

const US_OPEN_ROWS: StockEventRow[] = [
  usStock("AAPL", 224.8, 0.61, 95),
  usStock("NVDA", 118.4, 0.44, 95),
  usStock("TSLA", 241.1, 0.52, 95),
];

const HK_OPEN_ROWS: StockEventRow[] = [
  hkStock("0700", 382.6, 0.57, 60),
  hkStock("9988", 84.3, 0.48, 60),
  hkStock("3690", 122.9, 0.53, 60),
];

const krStock = (
  code: string,
  base: number,
  upPrice: number,
  endMin: number,
): StockEventRow => ({
  id: `kr-${code}-updown-20260803`,
  name: `${code}.KS — will it close higher today?`,
  base_price: base,
  start_date: iso(-180 * MIN),
  end_date: iso(endMin * MIN),
  freeze_time: null,
  event_subtype: "KR_STOCK_DAILY_UPDOWN_SPOT",
  upPrice,
  downPrice: Number((1 - upPrice).toFixed(2)),
});

const KR_OPEN_ROWS: StockEventRow[] = [
  krStock("005930", 74_800, 0.55, 45),
  krStock("000660", 198_500, 0.47, 45),
];

/** HK 09:30–16:00 HKT and KR 09:00–15:30 KST overlap almost fully. */
const HK_KR_OPEN_ROWS: StockEventRow[] = [...HK_OPEN_ROWS, ...KR_OPEN_ROWS];

/** No open round; one future round so the header can show "Next open". */
const CLOSED_ROWS: StockEventRow[] = [
  { ...usStock("AAPL", 224.8, 0.61, 1_200), start_date: iso(960 * MIN) },
];

/* ---------------- Sports mocks ---------------- */
const opt = (id: string, label: string, price: number) => ({ id, label, price });

const match = (
  o: Partial<SportsMatch> & { id: string; league: string; home: string; away: string },
): SportsMatch => ({
  name: `${o.home} vs ${o.away}`,
  homeAbbr: o.home.slice(0, 3).toUpperCase(),
  awayAbbr: o.away.slice(0, 3).toUpperCase(),
  format: "1x2",
  kickoff: new Date(NOW + 90 * MIN),
  endDate: new Date(NOW + 210 * MIN),
  live: false,
  minute: null,
  phase: null,
  score: null,
  options: [
    opt(`${o.id}-h`, o.home, 0.44),
    opt(`${o.id}-d`, "Draw", 0.27),
    opt(`${o.id}-a`, o.away, 0.29),
  ],
  ...o,
} as SportsMatch);

const LIVE_1 = match({
  id: "s-live-1",
  league: "UEFA Champions League",
  home: "Arsenal",
  away: "Sevilla",
  live: true,
  minute: 63,
  phase: "2nd half",
  score: "1 – 0",
  kickoff: new Date(NOW - 63 * MIN),
  endDate: new Date(NOW + 30 * MIN),
});

const LIVE_2 = match({
  id: "s-live-2",
  league: "Serie A",
  home: "Inter",
  away: "Napoli",
  live: true,
  minute: 28,
  phase: "1st half",
  score: "0 – 0",
  kickoff: new Date(NOW - 28 * MIN),
  endDate: new Date(NOW + 70 * MIN),
});

const UPCOMING_TODAY = match({
  id: "s-up-1",
  league: "Premier League",
  home: "Chelsea",
  away: "Everton",
  kickoff: new Date(NOW + 150 * MIN),
  endDate: new Date(NOW + 270 * MIN),
});

const UPCOMING_TOMORROW = match({
  id: "s-up-2",
  league: "La Liga",
  home: "Girona",
  away: "Betis",
  kickoff: new Date(NOW + 26 * 60 * MIN),
  endDate: new Date(NOW + 28 * 60 * MIN),
});

const UPCOMING_H2H = match({
  id: "s-up-3",
  league: "NBA",
  home: "Celtics",
  away: "Nuggets",
  format: "h2h",
  kickoff: new Date(NOW + 27 * 60 * MIN),
  endDate: new Date(NOW + 29 * 60 * MIN),
  options: [opt("s-up-3-h", "Celtics", 0.56), opt("s-up-3-a", "Nuggets", 0.44)],
});

const UPCOMING_H2H_2 = match({
  id: "s-up-4",
  league: "UFC 312",
  home: "Adesanya",
  away: "Pereira",
  format: "h2h",
  kickoff: new Date(NOW + 52 * 60 * MIN),
  endDate: new Date(NOW + 54 * 60 * MIN),
  options: [opt("s-up-4-h", "Adesanya", 0.48), opt("s-up-4-a", "Pereira", 0.52)],
});

/* --- Sub-nav (13A) mocks: sport row + league row --------------- */
/** One soccer fixture per named league, spread over the next 3 days. */
const soccer = (
  id: string,
  league: string,
  home: string,
  away: string,
  hours: number,
) =>
  match({
    id,
    league,
    home,
    away,
    kickoff: new Date(NOW + hours * 60 * MIN),
    endDate: new Date(NOW + (hours * 60 + 120) * MIN),
  });

/** Four soccer leagues — the contract's 13A frame. */
const SOCCER_4 = [
  soccer("s13-1", "LaLiga", "Real Madrid", "Barcelona", 5),
  soccer("s13-2", "UEFA Champions League", "Bayern", "PSG", 6),
  soccer("s13-3", "Premier League", "Liverpool", "Newcastle", 28),
  soccer("s13-4", "K League 1", "Jeonbuk", "Ulsan", 52),
];

/** Nine soccer leagues — the 13A-max wrap frame. */
const SOCCER_9 = [
  ...SOCCER_4,
  soccer("s13-5", "World Cup", "Brazil", "Croatia", 30),
  soccer("s13-6", "Serie A", "Inter", "Roma", 31),
  soccer("s13-7", "Bundesliga", "Dortmund", "Leipzig", 32),
  soccer("s13-8", "Ligue 1", "Marseille", "Lyon", 54),
  soccer("s13-9", "Chinese Super League", "Shanghai Port", "Beijing Guoan", 56),
];

/** Other groups so the "switch sport above" line has live values. */
const OTHER_SPORTS = [UPCOMING_H2H, UPCOMING_H2H_2];

/** UFC only — one league in the group, so the league row is suppressed. */
const SINGLE_LEAGUE = [UPCOMING_H2H_2];

/* ---------------- 1. Category row ----------------
   Uses the production CategoryPill + TOP_CATEGORIES — no hand-copied pill
   markup, so this demo cannot drift from /events again. */

const CATEGORY_PRESETS = [
  {
    id: "all",
    label: "All active",
    sector: "all",
    sportsLive: false,
    boost: false,
    caption: "Default desktop landing — All selected, the stage renders below the row.",
  },
  {
    id: "intraday",
    label: "Intraday active",
    sector: "intraday",
    sportsLive: false,
    boost: false,
    caption:
      "Intraday selected — orange dot stays, pill fills white; the IntradayBand takes the full width.",
  },
  {
    id: "sports",
    label: "Sports active",
    sector: "sports",
    sportsLive: false,
    boost: false,
    caption:
      "Sports selected — chalk dot; the Sports card renders full-width in place of the stage.",
  },
  {
    id: "topic",
    label: "Topic active",
    sector: "crypto",
    sportsLive: false,
    boost: false,
    caption:
      "A plain topic (Crypto) is selected — white pill, no dot; the generic Events grid filters.",
  },
  {
    id: "sports-live",
    label: "Sports live pulse",
    sector: "all",
    sportsLive: true,
    boost: false,
    caption:
      "At least one SPORTS_MATCH is live right now — the chalk dot becomes a pulsing red dot.",
  },
  {
    id: "boost",
    label: "Boost chip active",
    sector: "all",
    sportsLive: false,
    boost: true,
    caption: "Boost trait chip toggled on — grid narrows to boosted categories only.",
  },
] as const;

/** The production taxonomy, trimmed to what the desktop row shows here. */
const CATEGORIES = TOP_CATEGORIES.slice(0, 7);

const CategoryRowDemo = () => {
  const [id, setId] = useState<string>(CATEGORY_PRESETS[0].id);
  const p = CATEGORY_PRESETS.find((x) => x.id === id) ?? CATEGORY_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={CATEGORY_PRESETS} activeId={id} onSelect={setId} />
      <div className="rounded-lg border border-border bg-[#0A0B0D] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.label}
              dot={c.dot}
              active={c.id === p.sector}
              live={c.id === "sports" && p.sportsLive}
            />
          ))}
          <span
            aria-hidden
            style={{ width: 1, height: 22, background: "#1D2026", margin: "0 5px" }}
          />
          <TraitChip kind="boost" active={p.boost} onClick={() => {}} />
        </div>
      </div>
      <Caption>{p.caption}</Caption>
      <Caption>
        Pills render only for categories that have something to show: All and Intraday are
        always present, Sports needs at least one fixture, every other category needs ≥1 live
        event (sectorCounts &gt; 0). Watchlist / Calendar / Boost sit in the fixed right-hand
        cluster.
      </Caption>
    </div>
  );
};

/* ---------------- 2. Intraday stage card ---------------- */
const INTRADAY_PRESETS = [
  {
    id: "state-a-us",
    label: "State A — US session live",
    rows: US_OPEN_ROWS,
    // 15:20 UTC = 11:20 ET → the US cash session is open at the frozen clock.
    sessionNow: new Date(NOW),
    caption:
      "State A (US) — production shape when a US session is open: ONE shared module-level window selector drives all three coin tiles, the \"STOCKS CLOSING TODAY\" row lists the open US tickers, and each stock row carries its art slot. Session line reads \"US session open · closes 16:00 ET\".",
  },
  {
    id: "state-a-hk",
    label: "State A — HK session live",
    rows: HK_OPEN_ROWS,
    // 05:00 UTC = 13:00 HKT → mid HK afternoon session.
    sessionNow: new Date("2026-08-03T05:00:00Z"),
    caption:
      "State A (HK) — same production shape driven by the HK exchange branch: shared window selector, \"STOCKS CLOSING TODAY\" row of HK tickers with art slots, close line in HKT and HK$ prices.",
  },
  {
    id: "state-b",
    label: "State B — no session",
    rows: CLOSED_ROWS,
    // 21:00 UTC — both US (17:00 ET) and HK (05:00 HKT) are shut.
    sessionNow: new Date("2026-08-03T21:00:00Z"),
    caption:
      "State B — the CURRENT production form when no exchange is open (not an old version): no stocks-closing row, coin-major layout, and each coin card owns its own window switcher; the stock row shows its next-open stamp instead.",
  },
  {
    id: "state-a-hk-kr",
    label: "State A — HK + KR overlap",
    rows: HK_KR_OPEN_ROWS,
    // 05:00 UTC = 13:00 HKT and 14:00 KST → both Asian sessions are open.
    sessionNow: new Date("2026-08-03T05:00:00Z"),
    caption:
      "Overlapping sessions — when more than one exchange is open, every open market gets its own entry, sorted by close time (earliest first): the close line reads \"KR closes 15:30 KST · HK closes 16:00 HKT\" and the stocks-closing row mixes both markets with their own currency prefixes.",
  },
  {
    id: "state-a-kr",
    label: "State A — KR only (pre-HK open)",
    rows: HK_KR_OPEN_ROWS,
    // 00:30 UTC = 09:30 KST (open) while HK only opens at 01:30 UTC.
    sessionNow: new Date("2026-08-03T00:30:00Z"),
    caption:
      "Korea alone — KRX runs 09:00–15:30 KST, so it opens an hour before Hong Kong. Only the KR session line shows; HK tickers fall into the asleep group with their next-open stamp.",
  },
] as const;

const IntradayDemo = () => {
  const [id, setId] = useState<string>(INTRADAY_PRESETS[0].id);
  const p = INTRADAY_PRESETS.find((x) => x.id === id) ?? INTRADAY_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={INTRADAY_PRESETS} activeId={id} onSelect={setId} />
      <div key={id} className="max-w-[860px]">
        <IntradayStageCard
          currentFor={currentFor}
          historyFor={historyFor}
          stockRows={[...p.rows]}
          tickSeconds={0}
          onOpenIntraday={() => {}}
          sessionNow={p.sessionNow}
        />
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

/* ---------------- 3. Sports stage card ---------------- */
const SPORTS_PRESETS = [
  {
    id: "two-live",
    label: "2 live + 1 upcoming",
    matches: [LIVE_1, LIVE_2, UPCOMING_TODAY, UPCOMING_TOMORROW, UPCOMING_H2H],
    variant: "stage" as const,
    caption:
      "Something is live — the LIVE block takes the top and the upcoming list is trimmed to a single next row.",
  },
  {
    id: "none-live",
    label: "Nothing live + 3 upcoming",
    matches: [UPCOMING_TODAY, UPCOMING_TOMORROW, UPCOMING_H2H],
    variant: "stage" as const,
    caption:
      "No match is live — the card falls back to a 3-row upcoming list under the day strip.",
  },
  {
    id: "day-filter",
    label: "Day tab — TODAY",
    matches: [LIVE_1, UPCOMING_TODAY, UPCOMING_TOMORROW, UPCOMING_H2H, UPCOMING_H2H_2],
    variant: "full" as const,
    caption:
      "stage 内部变体（variant=\"full\"）——Sports 类目视图现由 LiteSportsView（7B）承担。Day strip filtering — select TODAY to keep only matches kicking off before midnight local.",
  },
  {
    id: "formats",
    label: "h2h 2-chip vs 1x2 3-chip",
    matches: [UPCOMING_TODAY, UPCOMING_H2H, UPCOMING_H2H_2],
    variant: "full" as const,
    caption:
      "stage 内部变体（variant=\"full\"）——Sports 类目视图现由 LiteSportsView（7B）承担。Row price chips follow metadata.format — 1x2 renders home/draw/away, h2h renders two chips.",
  },
  {
    id: "sparse",
    label: "Fewer than 4 matches",
    matches: [LIVE_1, UPCOMING_TODAY],
    variant: "full" as const,
    caption:
      "stage 内部变体（variant=\"full\"）——Sports 类目视图现由 LiteSportsView（7B）承担。Sparse fallback — with fewer than 4 matches the card stacks full-width without padding rows.",
  },
] as const;

const SportsDemo = () => {
  const [id, setId] = useState<string>(SPORTS_PRESETS[0].id);
  const p = SPORTS_PRESETS.find((x) => x.id === id) ?? SPORTS_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={SPORTS_PRESETS} activeId={id} onSelect={setId} />
      <div key={id} className="max-w-[480px]">
        <SportsStageCard
          matches={[...p.matches]}
          variant={p.variant}
          onOpenAll={() => {}}
        />
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

/* ---------------- 4. Coin tile micro-states ---------------- */
const PLOT_PRESETS = [
  {
    id: "above",
    label: "Above open — blue",
    base: 68420,
    current: 68880,
    upOdds: 0.66,
    caption: "Current price above the round's open — the live segment renders Pulse Blue #33D6FF.",
  },
  {
    id: "below",
    label: "Below open — volt",
    base: 68420,
    current: 68010,
    upOdds: 0.34,
    caption: "Current price below the round's open — the live segment renders Volt #CFFF4A.",
  },
] as const;

const PlotDemo = () => {
  const [id, setId] = useState<string>(PLOT_PRESETS[0].id);
  const p = PLOT_PRESETS.find((x) => x.id === id) ?? PLOT_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={PLOT_PRESETS} activeId={id} onSelect={setId} />
      <div className="max-w-[320px] rounded-lg border border-[#1D2026] bg-[#111318] p-3">
        <RoundPlot
          eventId="crypto-btc-updown-5m-1"
          basePrice={p.base}
          currentPrice={p.current}
          upOdds={p.upOdds}
        />
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

/* ---------------- Section ---------------- */
const CHIP_TIER_PRESETS = [
  {
    id: "tier-1",
    label: "Tier 1 · direction button",
    caption:
      "Trigger — a binary DIRECTION pair (Up/Down on coin tiles and coin cards, Up/Not up on stock rows): tinted fill, coloured label AND price, hover brightens the fill.",
  },
  {
    id: "tier-2",
    label: "Tier 2 · outcome chip",
    caption:
      "Trigger — any multi-outcome or Yes/No market (sports 1x2, sports h2h, generic event chips): neutral #0A0B0D chip, muted label, only the price is coloured, hover sets border-color to the price colour.",
  },
] as const;

const T2 = ({ label, price, color }: { label: string; price: number; color: string }) => (
  <button
    type="button"
    className="chip-t2 flex items-center justify-between"
    style={
      { color, padding: "9px 10px", minWidth: 112, ["--chip-accent" as string]: color } as React.CSSProperties
    }
  >
    <span style={{ fontSize: 10, color: "#9AA1AC" }}>{label}</span>
    <span
      className="font-display"
      style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

const ChipTiersDemo = () => {
  const [id, setId] = useState<string>(CHIP_TIER_PRESETS[0].id);
  const p = CHIP_TIER_PRESETS.find((x) => x.id === id) ?? CHIP_TIER_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={CHIP_TIER_PRESETS} activeId={id} onSelect={setId} />
      <div className="grid gap-4 rounded-lg border border-[#1D2026] bg-[#111318] p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Tier 1 · direction button
          </p>
          <div className="flex flex-wrap gap-2">
            <DirectionButton
              label="Up"
              price={0.58}
              tone="up"
              labelSize={11}
              priceSize={15}
              padding="9px 12px"
              gap={10}
              onClick={() => {}}
            />
            <DirectionButton
              label="Down"
              price={0.42}
              tone="down"
              labelSize={11}
              priceSize={15}
              padding="9px 12px"
              gap={10}
              onClick={() => {}}
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Tier 2 · outcome chip
          </p>
          <div className="flex flex-wrap gap-2">
            <T2 label="Arsenal" price={0.44} color="#33D6FF" />
            <T2 label="Draw" price={0.27} color="#E6E9EE" />
            <T2 label="Sevilla" price={0.29} color="#CFFF4A" />
          </div>
          <div className="flex flex-wrap gap-2">
            <T2 label="Yes" price={0.63} color="#33D6FF" />
            <T2 label="No" price={0.37} color="#CFFF4A" />
          </div>
        </div>
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

/* ---------------- 6. Category views 7A / 7B ---------------- */
/* The category views group stock rows by "is a round open right now";
   like every other fixture here they hang off the frozen clock so the
   grouping (and therefore the render) is deterministic. */
const rel = (min: number) => new Date(NOW + min * MIN).toISOString();

const viewStock = (
  base: StockEventRow,
  startMin: number,
  endMin: number,
): StockEventRow => ({ ...base, start_date: rel(startMin), end_date: rel(endMin) });

const US_TRADING = US_OPEN_ROWS.map((r) => viewStock(r, -180, 95));
const US_ASLEEP = US_OPEN_ROWS.map((r) => viewStock(r, 900, 1290));
const HK_TRADING = HK_OPEN_ROWS.map((r) => viewStock(r, -120, 60));
const HK_ASLEEP = HK_OPEN_ROWS.map((r) => viewStock(r, 600, 990));

const VIEW_7A_PRESETS = [
  {
    id: "7a-us",
    label: "US session open",
    rows: [...US_TRADING, ...HK_ASLEEP],
    // 11:25 ET — US regular session open, 23:25 HKT so HK is shut.
    sessionNow: new Date("2026-08-03T15:25:00Z"),
    caption:
      "US session open — the 3 US names trade, the 3 HK names sit in the asleep group with \"Hong Kong opens …\".",
  },
  {
    id: "7a-hk",
    label: "HK session open",
    rows: [...HK_TRADING, ...US_ASLEEP],
    // 11:00 HKT — HK open, 23:00 ET so New York is shut.
    sessionNow: new Date("2026-08-03T03:00:00Z"),
    caption:
      "HK session open — inverse of the above; the session pill reads \"HK session open\" and prices use HK$.",
  },
  {
    id: "7a-none",
    label: "No session open",
    rows: [...US_ASLEEP, ...HK_ASLEEP],
    // 18:00 ET / 06:00 HKT — neither exchange is trading.
    sessionNow: new Date("2026-08-03T22:00:00Z"),
    caption:
      "No US/HK session open — all 6 stock rows fall into the asleep group; the coin rounds keep running.",
  },
] as const;

const IntradayViewDemo = () => {
  const [id, setId] = useState<string>(VIEW_7A_PRESETS[0].id);
  const p = VIEW_7A_PRESETS.find((x) => x.id === id) ?? VIEW_7A_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={VIEW_7A_PRESETS} activeId={id} onSelect={setId} />
      <div key={id}>
        <LiteIntradayView
          currentFor={currentFor}
          historyFor={historyFor}
          stockRows={[...p.rows]}
          tickSeconds={0}
          sessionNow={p.sessionNow}
        />
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

const VIEW_7B_PRESETS = [
  {
    id: "7b-live",
    label: "Live pinned + ledger",
    matches: [LIVE_1, LIVE_2, UPCOMING_TODAY, UPCOMING_TOMORROW, UPCOMING_H2H, UPCOMING_H2H_2],
    caption:
      "At least one match is live — \"PLAYING NOW\" pins the live cards above the ledger and those rows are excluded from the day groups.",
  },
  {
    id: "7b-nolive",
    label: "Nothing live",
    matches: [UPCOMING_TODAY, UPCOMING_TOMORROW, UPCOMING_H2H, UPCOMING_H2H_2],
    caption:
      "No live match — the pinned block is dropped entirely and the ledger starts right under the day strip.",
  },
  {
    id: "7b-h2h",
    label: "h2h 2-chip vs 1x2 3-chip",
    matches: [UPCOMING_TODAY, UPCOMING_H2H, UPCOMING_H2H_2],
    caption:
      "Chip cluster follows metadata.format — the Draw chip renders only for 1x2 football rows.",
  },
] as const;

const SportsViewDemo = () => {
  const [id, setId] = useState<string>(VIEW_7B_PRESETS[0].id);
  const p = VIEW_7B_PRESETS.find((x) => x.id === id) ?? VIEW_7B_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={VIEW_7B_PRESETS} activeId={id} onSelect={setId} />
      <div key={id}>
        <LiteSportsView matches={[...p.matches]} now={NOW} />
      </div>
      <Caption>
        {p.caption} Day chips filter the ledger in place — select a day chip to see
        the filtered state.
      </Caption>
    </div>
  );
};

/* ---------------- 13A · sports sub-nav ---------------- */
const SUBNAV_PRESETS = [
  {
    id: "13a-soccer",
    label: "Soccer · 4 leagues",
    matches: [...SOCCER_4, ...OTHER_SPORTS],
    boostOnly: false,
    sport: "SOCCER",
    caption:
      "Select Soccer on the SPORT row: the LEAGUE row appears with the four leagues that have markets this week (taxonomy order, leading All) and the footer counts the other groups.",
  },
  {
    id: "13a-single",
    label: "Single-league sport (UFC)",
    matches: SINGLE_LEAGUE,
    boostOnly: false,
    sport: "UFC",
    caption:
      "UFC has one league with markets, so the LEAGUE row is not rendered at all — the module starts straight under the SPORT row.",
  },
  {
    id: "13a-league",
    label: "League-filtered (Premier League)",
    matches: [...SOCCER_4, ...OTHER_SPORTS],
    boostOnly: false,
    sport: "SOCCER",
    league: "Premier League",
    caption:
      "A league pill is active: the SPORT and LEAGUE rows stay mounted and the ledger below narrows to that league only.",
  },
  {
    id: "13a-max",
    label: "Worst case · 9 leagues wrap",
    matches: [...SOCCER_9, ...OTHER_SPORTS],
    boostOnly: false,
    sport: "SOCCER",
    caption:
      "13A-max: all nine soccer leagues are live. The row wraps onto a second line at the same 7px gaps — never a horizontal scroll and never a truncated pill.",
  },
  {
    id: "13a-boost",
    label: "Boost on · nothing boosted",
    matches: [...SOCCER_4, ...OTHER_SPORTS],
    boostOnly: true,
    sport: "SOCCER",
    caption:
      "Boost composes in place: header and both filter rows stay mounted, the module body is replaced by the standard empty line.",
  },
] as const;

const SportsSubnavDemo = () => {
  const [id, setId] = useState<string>(SUBNAV_PRESETS[0].id);
  const p = SUBNAV_PRESETS.find((x) => x.id === id) ?? SUBNAV_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={SUBNAV_PRESETS} activeId={id} onSelect={setId} />
      <div key={id}>
        <LiteSportsView
          matches={[...p.matches]}
          now={NOW}
          defaultSport={p.sport}
          defaultLeague={"league" in p ? p.league : undefined}
          boostOnly={p.boostOnly}
          boostEnabled={false}
        />
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

const SportsSubnavMobileDemo = () => (
  <div className="space-y-3">
    <div style={{ width: 390 }}>
      <MobileSportsModule
        matches={[...SOCCER_4, ...OTHER_SPORTS]}
        filters
        onOpenAll={() => {}}
      />
    </div>
    <Caption>
      390 composition — both dimension rows use the 44px mobile pill grammar and
      scroll horizontally under the 18px fade mask (never wrap).
    </Caption>
  </div>
);

export const LiteAllStageSection = () => (
  <SectionWrapper
    id="lite-all-stage"
    title="Lite · All stage"
    platform="desktop"
    description="Desktop-only category-as-view stage. Every preset uses fixed mock data and a frozen mock now (2026-08-03 15:20 UTC) — nothing here reads the database."
  >
    <div className="space-y-10">
      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Chip tiers"
            description="Desktop & Mobile · same components. Tier-1 = DirectionButton, named layout variants: split (default) / centered (stock rows) / stacked (calendar). Tier-2 = outcome chip. The order-panel Yes/No pair is the COMPACT capsule variant."
          >
            <ChipTiersDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection title="Category row" description="Desktop · above the stage. Object name: Category pill (PILL_BASE, top-level category row) — not the Dimension pill (DimensionPill) used by the sub-dimension rows below.">
            <CategoryRowDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="IntradayStageCard"
            description="Desktop · left column (62%) of the All stage. Uses DirectionButton (centered), Last8Strip (strip variant, 9px) and LivePulse (6px)."
          >
            <IntradayDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="SportsStageCard"
            description="Desktop · right column (1fr) of the All stage, or full-width in the Sports view. Uses the shared Crest and LivePulse (5px)."
          >
            <SportsDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Coin tile plot micro-states"
            description="Desktop & Mobile · same component (RoundPlot)"
          >
            <PlotDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Category view 7A · Intraday"
            description="Desktop · full-width state when the Intraday category chip is active"
          >
            <IntradayViewDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Category view 7B · Sports"
            description="Desktop · full-width state when the Sports category chip is active"
          >
            <SportsViewDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="Sports sub-nav 13A · SPORT + LEAGUE rows"
            description="Desktop · dimension rows above the sports module. Object name: Dimension pill (DimensionPill, sub-dimension rows) — distinct from the Category pill (PILL_BASE) of the top-level category row."
          >
            <SportsSubnavDemo />
          </SubSection>
          <SubSection title="Sports sub-nav 13A · 390" description="Mobile composition">
            <SportsSubnavMobileDemo />
          </SubSection>
        </CardContent>
      </Card>
    </div>
  </SectionWrapper>
);

export default LiteAllStageSection;