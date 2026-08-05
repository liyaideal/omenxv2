// ============================================================
// /style-guide → "Lite · Vertical views (Crypto / Finance)".
// Playground registration ONLY. Frozen clock 2026-08-03T15:20:00Z,
// fixed mock data, no database access.
// ============================================================
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { LiteCryptoView } from "@/components/lite/categoryviews/LiteCryptoView";
import { LiteFinanceView } from "@/components/lite/categoryviews/LiteFinanceView";
import { LiteEventCard } from "@/components/lite/LiteEventCard";
import type { EventRow } from "@/hooks/useMarketListData";
import {
  Coin,
  QuickEvent,
  StockEventRow,
  TF_SECONDS,
  Timeframe,
} from "@/components/lite/intraday/intradayData";

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

/* ---------------- Crypto mocks ---------------- */
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
const TFS: Timeframe[] = ["5m", "15m", "1h", "4h", "1d"];
const currentFor = new Map<string, QuickEvent>();
const historyFor = new Map<string, ("up" | "down")[]>();
(["btc", "eth", "sol"] as Coin[]).forEach((coin, ci) => {
  TFS.forEach((tf, ti) => {
    currentFor.set(
      `${coin}-${tf}`,
      mockQuick(coin, tf, 0.44 + ti * 0.04, Math.round(TF_SECONDS[tf] * 0.42), COIN_BASE[coin]),
    );
    historyFor.set(
      `${coin}-${tf}`,
      Array.from({ length: 8 }, (_, i) => ((i + ci + ti) % 3 === 0 ? "down" : "up")),
    );
  });
});

/* ---------------- Catalogue mocks ---------------- */
const mockEvent = (
  id: string,
  name: string,
  category: string,
  yes: number,
): EventRow =>
  ({
    id,
    eventId: id,
    eventName: name,
    eventIcon: "",
    category,
    categoryLabel: category,
    productLines: ["contract"],
    eventSubtype: null,
    lifecycleStatus: null,
    basePrice: null,
    change1h: 0,
    change4h: 0,
    change24h: 0,
    volume1h: 0,
    volume4h: 0,
    volume24h: 120_000,
    totalVolume: 480_000,
    openInterest: 0,
    expiry: new Date(NOW + 6 * 24 * 60 * MIN),
    createdAt: iso(-3 * 24 * 60 * MIN),
    isNew: false,
    isClosingSoon: false,
    topMarket: { label: "Yes" },
    childCount: 2,
    children: [
      {
        id: `${id}-yes`,
        optionLabel: "Yes",
        displayLabel: "Yes",
        markPrice: yes,
        change1h: 0,
        change4h: 0,
        change24h: 0,
        volume1h: 0,
        volume4h: 0,
        volume24h: 0,
        totalVolume: 0,
        openInterest: 0,
        fundingRate: 0,
      },
      {
        id: `${id}-no`,
        optionLabel: "No",
        displayLabel: "No",
        markPrice: Number((1 - yes).toFixed(2)),
        change1h: 0,
        change4h: 0,
        change24h: 0,
        volume1h: 0,
        volume4h: 0,
        volume24h: 0,
        totalVolume: 0,
        openInterest: 0,
        fundingRate: 0,
      },
    ],
  }) as EventRow;

const CRYPTO_EVENTS: EventRow[] = [
  mockEvent("c1", "Will BTC close above $80k this month?", "crypto", 0.42),
  mockEvent("c2", "Will ETH flip $5,000 before September?", "crypto", 0.31),
  mockEvent("c3", "Will SOL reach a new all-time high in 2026?", "crypto", 0.24),
];

const FINANCE_EVENTS: EventRow[] = [
  mockEvent("f1", "Will NVDA beat earnings this quarter?", "finance", 0.63),
  mockEvent("f2", "Will the S&P 500 index close green this week?", "finance", 0.55),
  mockEvent("f3", "Will Tencent (0700.HK) top HK$400 in August?", "finance", 0.38),
  mockEvent("f4", "Will gold hold above $2,400 this month?", "finance", 0.71),
];

const grid = (items: EventRow[]) => (
  <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
    {items.map((m, i) => (
      <LiteEventCard key={m.id} market={m} index={i} trendingCutoff={null} />
    ))}
  </div>
);

/* ---------------- Finance mocks ---------------- */
const usStock = (ticker: string, base: number, up: number): StockEventRow => ({
  id: `us-${ticker.toLowerCase()}-updown-20260803`,
  name: `${ticker} — will it close higher today?`,
  base_price: base,
  start_date: iso(-210 * MIN),
  end_date: iso(95 * MIN),
  freeze_time: null,
  event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
  upPrice: up,
  downPrice: Number((1 - up).toFixed(2)),
});

const hkStock = (code: string, base: number, up: number): StockEventRow => ({
  id: `hk-${code}-updown-20260803`,
  name: `${code}.HK — will it close higher today?`,
  base_price: base,
  start_date: iso(-180 * MIN),
  end_date: iso(60 * MIN),
  freeze_time: null,
  event_subtype: "HK_STOCK_DAILY_UPDOWN_SPOT",
  upPrice: up,
  downPrice: Number((1 - up).toFixed(2)),
});

const STOCK_ROWS: StockEventRow[] = [
  usStock("AAPL", 224.8, 0.61),
  usStock("NVDA", 118.4, 0.44),
  usStock("TSLA", 241.1, 0.52),
  hkStock("0700", 382.6, 0.57),
  hkStock("9988", 84.3, 0.48),
];

/**
 * ONE injected instant for the whole playground: row liveness, session
 * resolution, countdowns and traded-today all read it. At 15:20 UTC the US
 * cash session is open (11:20 ET) and Hong Kong is shut (23:20 HKT).
 */
const FROZEN_NOW = new Date(NOW);

/* ---------------- Presets ---------------- */
const CRYPTO_PRESETS = [
  { id: "all-5m", label: "All coins · 5m", coin: "all", tf: "5m" as Timeframe, events: CRYPTO_EVENTS },
  { id: "btc-15m", label: "BTC · 15m", coin: "btc", tf: "15m" as Timeframe, events: CRYPTO_EVENTS },
  { id: "eth-1d", label: "ETH · Daily", coin: "eth", tf: "1d" as Timeframe, events: CRYPTO_EVENTS },
  { id: "empty", label: "Empty catalogue", coin: "sol", tf: "1h" as Timeframe, events: [] },
] as const;

const FINANCE_PRESETS = [
  { id: "all", label: "All classes · all regions", cls: "all", region: "all" },
  { id: "us-stocks", label: "Stocks · US (open)", cls: "stocks", region: "us" },
  { id: "hk-stocks", label: "Stocks · HK (asleep)", cls: "stocks", region: "hk" },
  { id: "indices", label: "Indices · US", cls: "indices", region: "us" },
  { id: "commodities", label: "Commodities · US", cls: "commodities", region: "us" },
  { id: "kr", label: "Stocks · Korea (empty)", cls: "stocks", region: "kr" },
] as const;

export const LiteVerticalViewsSection = () => {
  const [cryptoId, setCryptoId] = useState<string>(CRYPTO_PRESETS[0].id);
  const [financeId, setFinanceId] = useState<string>(FINANCE_PRESETS[0].id);
  const crypto = CRYPTO_PRESETS.find((p) => p.id === cryptoId)!;
  const finance = FINANCE_PRESETS.find((p) => p.id === financeId)!;

  return (
    <SectionWrapper
      id="lite-verticals"
      title="Lite · Vertical views (Crypto / Finance)"
      description="Assembly-only category views. Frozen clock 2026-08-03T15:20:00Z."
    >
      <SubSection title="Crypto view">
        <PresetRail presets={CRYPTO_PRESETS} activeId={cryptoId} onSelect={setCryptoId} />
        <Caption>
          Row 1 is the round-length dial (module size), row 2 the coin pills. The engine
          renders the selected window × coin; the catalogue is the frozen event card grid.
        </Caption>
        <Card>
          <CardContent className="bg-[#0A0B0D] p-5">
            <LiteCryptoView
              key={crypto.id}
              currentFor={currentFor}
              historyFor={historyFor}
              tickSeconds={0}
              nowMs={NOW}
              events={[...crypto.events]}
              renderGrid={grid}
              initialTf={crypto.tf}
              initialCoin={crypto.coin}
            />
          </CardContent>
        </Card>
        <Caption>Mobile composition — single column, compact round switcher.</Caption>
        <Card>
          <CardContent className="bg-[#0A0B0D] p-4">
            <div style={{ width: 390, maxWidth: "100%" }}>
              <LiteCryptoView
                key={`m-${crypto.id}`}
                currentFor={currentFor}
                historyFor={historyFor}
                tickSeconds={0}
                nowMs={NOW}
                events={[...crypto.events]}
                renderGrid={grid}
                isMobile
                initialTf={crypto.tf}
                initialCoin={crypto.coin}
              />
            </div>
          </CardContent>
        </Card>
      </SubSection>

      <SubSection title="Finance view">
        <PresetRail
          presets={FINANCE_PRESETS}
          activeId={financeId}
          onSelect={setFinanceId}
        />
        <Caption>
          Row 1 is the asset-class pills, row 2 the region pills. Only Stocks carries the
          session engine; other classes show the catalogue alone.
        </Caption>
        <Card>
          <CardContent className="bg-[#0A0B0D] p-5">
            <LiteFinanceView
              key={finance.id}
              stockRows={STOCK_ROWS}
              tickSeconds={0}
              sessionNow={FROZEN_NOW}
              nowMs={NOW}
              events={FINANCE_EVENTS}
              renderGrid={grid}
              initialClass={finance.cls}
              initialRegion={finance.region}
            />
          </CardContent>
        </Card>
        <Caption>Mobile composition — single column, scrollable filter rows.</Caption>
        <Card>
          <CardContent className="bg-[#0A0B0D] p-4">
            <div style={{ width: 390, maxWidth: "100%" }}>
              <LiteFinanceView
                key={`m-${finance.id}`}
                stockRows={STOCK_ROWS}
                tickSeconds={0}
                sessionNow={FROZEN_NOW}
                nowMs={NOW}
                events={FINANCE_EVENTS}
                renderGrid={grid}
                isMobile
                initialClass={finance.cls}
                initialRegion={finance.region}
              />
            </div>
          </CardContent>
        </Card>
      </SubSection>
    </SectionWrapper>
  );
};

export default LiteVerticalViewsSection;
