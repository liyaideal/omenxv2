// ============================================================
// /style-guide → "Lite · Final touches (11)".
// Playground registration for the Editor's picks module, the mobile
// events page (11B full-live / 11C nothing-live) and the mobile
// category-row control cluster. Deterministic mocks, frozen clock.
// Pixel contract: docs/design-contracts/list-final-touches-11.html
// ============================================================
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { EditorPicksModule } from "@/components/lite/picks/EditorPicksModule";
import type { EditorPick } from "@/components/lite/picks/editorialPicks";
import { MobileCategoryRow } from "@/components/lite/mobile/MobileCategoryRow";
import { MobileIntradayModule } from "@/components/lite/mobile/MobileIntradayModule";
import { MobileSportsModule } from "@/components/lite/mobile/MobileSportsModule";
import type {
  QuickEvent,
  StockEventRow,
} from "@/components/lite/intraday/intradayData";
import type { SportsMatch } from "@/components/lite/sports/sportsData";

/* ---------------- Frozen clock ---------------- */
const NOW = new Date("2026-08-03T15:20:00Z").getTime();
const MIN = 60_000;
const iso = (ms: number) => new Date(NOW + ms).toISOString();

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

const Canvas = ({
  width,
  children,
}: {
  width: number | "100%";
  children: React.ReactNode;
}) => (
  <div
    className="overflow-hidden rounded-xl border border-border"
    style={{ background: "#0A0B0D", width, maxWidth: "100%", padding: 16 }}
  >
    {children}
  </div>
);

/* ---------------- Mocks ---------------- */
const pick = (
  i: number,
  name: string,
  category: string,
  note: string,
  yes: number,
): EditorPick => ({
  id: `pick-${i}`,
  name,
  category,
  imageUrl: null,
  rank: i,
  note,
  updatedAt: new Date(NOW - i * 47 * MIN),
  volume: 1_240_000 / i,
  isSpot: false,
  yesLabel: "Yes",
  noLabel: "No",
  yesPrice: yes,
  noPrice: 1 - yes,
  yesOptionId: `pick-${i}-yes`,
  noOptionId: `pick-${i}-no`,
});

const PICKS: EditorPick[] = [
  pick(
    1,
    "US and Iran sign a nuclear deal in 2026?",
    "politics",
    "Talks resumed in Geneva this week — the first working text since 2015.",
    0.31,
  ),
  pick(
    2,
    "Fed cuts rates in September?",
    "macro",
    "Two soft CPI prints in a row have moved the odds more than any Fed speech.",
    0.68,
  ),
  pick(
    3,
    "GTA 6 ships in 2026?",
    "entertainment",
    "Rockstar's parent reaffirmed the window on the last earnings call.",
    0.54,
  ),
];

const quick = (coin: "btc" | "eth" | "sol", base: number, up: number): QuickEvent => ({
  id: `crypto-${coin}-updown-15m-202608031515`,
  name: `${coin.toUpperCase()} — up or down?`,
  coin,
  tf: "15m",
  period: "202608031515",
  base_price: base,
  start_date: iso(-5 * MIN),
  end_date: iso(10 * MIN),
  volume: 42_000,
  is_resolved: false,
  options: [
    { id: `${coin}-up`, label: "Up", price: up, is_winner: null },
    { id: `${coin}-down`, label: "Down", price: 1 - up, is_winner: null },
  ],
});

const CURRENT = new Map<string, QuickEvent>([
  ["btc-15m", quick("btc", 64210.5, 0.53)],
  ["eth-15m", quick("eth", 3118.4, 0.47)],
  ["sol-15m", quick("sol", 188.22, 0.61)],
]);

const HIST: ("up" | "down")[] = [
  "up",
  "down",
  "up",
  "up",
  "down",
  "up",
  "down",
  "up",
];
const HISTORY = new Map<string, ("up" | "down")[]>([
  ["btc-15m", HIST],
  ["eth-15m", [...HIST].reverse()],
  ["sol-15m", HIST],
]);

const STOCKS: StockEventRow[] = Array.from({ length: 18 }, (_, i) => ({
  id: `us-mock-${i}`,
  name: `Mock Co ${i}`,
  base_price: 100 + i,
  start_date: iso(-6 * 60 * MIN),
  end_date: iso(90 * MIN),
  freeze_time: iso(85 * MIN),
  event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
  upPrice: 0.52,
  downPrice: 0.48,
}));

const match = (
  id: string,
  name: string,
  league: string,
  home: string,
  away: string,
  ha: string,
  aa: string,
  live: boolean,
  offsetMin: number,
): SportsMatch => ({
  id,
  name,
  league,
  home,
  away,
  homeAbbr: ha,
  awayAbbr: aa,
  format: "1x2",
  kickoff: new Date(NOW + offsetMin * MIN),
  endDate: new Date(NOW + (offsetMin + 120) * MIN),
  live,
  minute: live ? 63 : null,
  phase: live ? "2nd half" : null,
  score: live ? "1–1" : null,
  volume: 320_000,
  options: [
    { id: `${id}-h`, label: home, price: 0.44 },
    { id: `${id}-d`, label: "Draw", price: 0.27 },
    { id: `${id}-a`, label: away, price: 0.29 },
  ],
});

const MATCHES_LIVE: SportsMatch[] = [
  match("m1", "Arsenal vs Chelsea", "Premier League", "Arsenal", "Chelsea", "ARS", "CHE", true, -63),
  match("m2", "Real Madrid vs Sevilla", "La Liga", "Real Madrid", "Sevilla", "RMA", "SEV", false, 260),
  match("m3", "Inter vs Roma", "Serie A", "Inter", "Roma", "INT", "ROM", false, 1_500),
];
const MATCHES_QUIET = MATCHES_LIVE.filter((m) => !m.live);

/* ---------------- Section ---------------- */
const PICK_PRESETS = [
  { id: "desktop", label: "Desktop · 3 picks" },
  { id: "mobile", label: "Mobile · stacked" },
  { id: "one", label: "Desktop · 1 valid pick" },
] as const;

const PAGE_PRESETS = [
  { id: "live", label: "11B · everything live" },
  { id: "quiet", label: "11C · nothing live" },
] as const;

const ROW_PRESETS = [
  { id: "all", label: "All selected" },
  { id: "intraday", label: "Intraday selected" },
  { id: "watchlist", label: "Watchlist active" },
  { id: "calendar", label: "Calendar active" },
] as const;

export const LiteFinalTouchesSection = () => {
  const [pickPreset, setPickPreset] = useState<string>("desktop");
  const [pagePreset, setPagePreset] = useState<string>("live");
  const [rowPreset, setRowPreset] = useState<string>("all");
  const [tf, setTf] = useState<"5m" | "15m" | "1h" | "4h" | "1d">("15m");

  const quiet = pagePreset === "quiet";

  return (
    <SectionWrapper
      title="Lite · Final touches (11)"
      description="Editor's picks module, the rebuilt mobile events page and the mobile category-row control cluster. Contract: docs/design-contracts/list-final-touches-11.html"
    >
      <SubSection title="Editor's picks">
        <PresetRail presets={PICK_PRESETS} activeId={pickPreset} onSelect={setPickPreset} />
        <Caption>
          Ops-curated via <code>events.metadata.editorial</code>. Max 3 picks ordered by
          rank. A pick with <strong>no reason text is skipped</strong> (the reason is
          mandatory by design) and logs a console warning; with zero valid picks the whole
          module disappears.
        </Caption>
        <Canvas width={pickPreset === "mobile" ? 390 : "100%"}>
          <EditorPicksModule
            picks={pickPreset === "one" ? PICKS.slice(0, 1) : PICKS}
            updatedAt={new Date(NOW - 47 * MIN)}
            isMobile={pickPreset === "mobile"}
          />
        </Canvas>
      </SubSection>

      <SubSection title="Mobile events page (390)">
        <PresetRail presets={PAGE_PRESETS} activeId={pagePreset} onSelect={setPagePreset} />
        <Caption>
          11C is a data state of the same build: no live match → "Nothing playing now" and
          no live card; both stock sessions closed → the session row is replaced by the
          market-calendar caption line. Round switcher always shows all five windows.
        </Caption>
        <Canvas width={390}>
          <div className="flex flex-col" style={{ gap: 22 }}>
            <MobileIntradayModule
              currentFor={CURRENT}
              historyFor={HISTORY}
              stockRows={quiet ? [] : STOCKS}
              tf={tf}
              onSelectTf={setTf}
              tickSeconds={0}
              onOpenIntraday={() => {}}
            />
            <MobileSportsModule
              matches={quiet ? MATCHES_QUIET : MATCHES_LIVE}
              onOpenAll={() => {}}
            />
            <EditorPicksModule
              picks={PICKS}
              updatedAt={new Date(NOW - 47 * MIN)}
              isMobile
            />
          </div>
        </Canvas>
      </SubSection>

      <SubSection title="Mobile category row · control cluster">
        <PresetRail presets={ROW_PRESETS} activeId={rowPreset} onSelect={setRowPreset} />
        <Caption>
          Categories scroll under a right fade mask; the divider, the 52px Watchlist count
          chip and the 44px Calendar icon chip are fixed at the right end and never scroll.
        </Caption>
        <Canvas width={390}>
          <MobileCategoryRow
            categories={[
              { id: "all", label: "All" },
              { id: "intraday", label: "Intraday", dot: "#FF8A3D" },
              { id: "sports", label: "Sports", dot: "#FF3B4E", pulse: true },
              { id: "crypto", label: "Crypto" },
              { id: "stocks", label: "Stocks" },
              { id: "politics", label: "Politics" },
            ]}
            value={rowPreset === "intraday" ? "intraday" : "all"}
            onSelect={() => {}}
            watchlistActive={rowPreset === "watchlist"}
            watchlistCount={7}
            onWatchlist={() => {}}
            calendarActive={rowPreset === "calendar"}
            onCalendar={() => {}}
          />
        </Canvas>
      </SubSection>
    </SectionWrapper>
  );
};

export default LiteFinalTouchesSection;