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
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import { TraitChip } from "@/components/lite/LiteListControls";
import {
  Coin,
  QuickEvent,
  StockEventRow,
  Timeframe,
  TF_SECONDS,
} from "@/components/lite/intraday/intradayData";
import { SportsMatch } from "@/components/lite/sports/sportsData";

/* ---------------- Frozen mock clock ---------------- */
/** All mock timestamps hang off this single frozen instant. */
const NOW = new Date("2026-08-03T15:20:00Z").getTime();
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

/* ---------------- 1. Category row ---------------- */
const PILL_BASE =
  "shrink-0 rounded-full px-[14px] py-[7px] text-[12.5px] transition-colors";
const PILL_ACTIVE = "bg-white text-[#0A0B0D] font-semibold";
const PILL_IDLE =
  "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground";

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

const CATEGORIES: Array<{ id: string; label: string; dot?: string }> = [
  { id: "all", label: "All" },
  { id: "intraday", label: "Intraday", dot: "#FF8A3D" },
  { id: "sports", label: "Sports", dot: "#F2F3F5" },
  { id: "crypto", label: "Crypto" },
  { id: "stocks", label: "Stocks" },
  { id: "politics", label: "Politics" },
  { id: "macro", label: "Economy" },
];

const CategoryRowDemo = () => {
  const [id, setId] = useState<string>(CATEGORY_PRESETS[0].id);
  const p = CATEGORY_PRESETS.find((x) => x.id === id) ?? CATEGORY_PRESETS[0];
  return (
    <div className="space-y-3">
      <PresetRail presets={CATEGORY_PRESETS} activeId={id} onSelect={setId} />
      <div className="rounded-lg border border-border bg-[#0A0B0D] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => {
            const liveDot = c.id === "sports" && p.sportsLive;
            return (
              <span
                key={c.id}
                className={cn(
                  PILL_BASE,
                  "flex items-center gap-[7px]",
                  c.id === p.sector ? PILL_ACTIVE : PILL_IDLE,
                )}
              >
                {c.dot && (
                  <span
                    className={liveDot ? "animate-pulse" : undefined}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: liveDot ? "#FF4D4F" : c.dot,
                    }}
                  />
                )}
                {c.label}
              </span>
            );
          })}
          <span
            aria-hidden
            style={{ width: 1, height: 22, background: "#1D2026", margin: "0 5px" }}
          />
          <TraitChip kind="boost" active={p.boost} onClick={() => {}} />
        </div>
      </div>
      <Caption>{p.caption}</Caption>
    </div>
  );
};

/* ---------------- 2. Intraday stage card ---------------- */
const INTRADAY_PRESETS = [
  {
    id: "state-a-us",
    label: "State A — US session live",
    rows: US_OPEN_ROWS,
    caption:
      "State A — a US session is open; one module-level dial drives all three coin tiles, plus the top 3 stock rows closing today.",
  },
  {
    id: "state-a-hk",
    label: "State A — HK session live",
    rows: HK_OPEN_ROWS,
    caption:
      "State A with HK rows — the close line reads \"HK closes … HKT\" and prices carry the HK$ prefix.",
  },
  {
    id: "state-b",
    label: "State B — no session",
    rows: CLOSED_ROWS,
    caption:
      "State B — no US/HK session open; coin-major layout, each card's window switcher is independent (try 5m / 15m / 1h on different cards).",
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
      "Day strip filtering — select TODAY to keep only matches kicking off before midnight local.",
  },
  {
    id: "formats",
    label: "h2h 2-chip vs 1x2 3-chip",
    matches: [UPCOMING_TODAY, UPCOMING_H2H, UPCOMING_H2H_2],
    variant: "full" as const,
    caption:
      "Row price chips follow metadata.format — 1x2 renders home/draw/away, h2h renders two chips.",
  },
  {
    id: "sparse",
    label: "Fewer than 4 matches",
    matches: [LIVE_1, UPCOMING_TODAY],
    variant: "full" as const,
    caption:
      "Sparse fallback — with fewer than 4 matches the card stacks full-width without padding rows.",
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

const T1 = ({ label, price, tone }: { label: string; price: number; tone: "up" | "down" }) => (
  <button
    type="button"
    className={cn(
      "chip-t1 flex items-center justify-between",
      tone === "up" ? "chip-t1-up" : "chip-t1-down",
    )}
    style={{ padding: "9px 12px", minWidth: 132 }}
  >
    <span style={{ fontSize: 11 }}>{label}</span>
    <span
      className="font-display"
      style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

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
            <T1 label="Up" price={0.58} tone="up" />
            <T1 label="Down" price={0.42} tone="down" />
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
            description="Desktop & Mobile · same components"
          >
            <ChipTiersDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection title="Category row" description="Desktop · above the stage">
            <CategoryRowDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="IntradayStageCard"
            description="Desktop · left column (62%) of the All stage"
          >
            <IntradayDemo />
          </SubSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <SubSection
            title="SportsStageCard"
            description="Desktop · right column (1fr) of the All stage, or full-width in the Sports view"
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
    </div>
  </SectionWrapper>
);

export default LiteAllStageSection;