// ============================================================
// CRYPTO VERTICAL VIEW — category chip "Crypto".
// ASSEMBLY ONLY: every visible part is an already-shipped component —
// the module header grammar, the round-length dial, the coin tile
// (desktop) / mobile coin card, and the frozen LiteEventCard grid.
// Options come from src/lib/taxonomy.ts, never from literals.
// ============================================================
import { useMemo, useState } from "react";
import { CRYPTO_COINS, CRYPTO_TIMEFRAMES } from "@/lib/taxonomy";
import type { EventRow } from "@/hooks/useMarketListData";
import {
  Coin,
  QuickEvent,
  Timeframe,
  compactUsd,
} from "@/components/lite/intraday/intradayData";
import { CoinTile } from "./verticalBlocks";
import { Dial as StageDial } from "@/components/lite/allstage/IntradayStageCard";
import { MobileCoinCard, MobileRoundSwitcher } from "@/components/lite/mobile/MobileIntradayModule";
import {
  CatalogueHeader,
  DimensionPill,
  DimensionRow,
  EYEBROW,
  RowHelper,
  VerticalHeader,
} from "./verticalChrome";
import { coinOfEvent } from "./verticalFilters";
import { EmptyState } from "@/components/states";

const COIN_IDS = CRYPTO_COINS.map((c) => c.code as Coin);

export const LiteCryptoView = ({
  currentFor,
  historyFor,
  tickSeconds,
  events,
  renderGrid,
  isMobile,
  initialTf = "5m",
  initialCoin = "all",
  nowMs,
  boostOnly,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  tickSeconds: number;
  /** Crypto catalogue events (already category-filtered by the page). */
  events: EventRow[];
  renderGrid: (items: EventRow[]) => React.ReactNode;
  isMobile?: boolean;
  /** Style-guide only. */
  initialTf?: Timeframe;
  initialCoin?: string;
  /** Style-guide only — freeze every clock in the view. */
  nowMs?: number;
  /** Boost composes in place — engine hides until boost rounds exist. */
  boostOnly?: boolean;
}) => {
  const [tf, setTf] = useState<Timeframe>(initialTf);
  const [coin, setCoin] = useState<string>(initialCoin);

  const coins = coin === "all" ? COIN_IDS : (COIN_IDS.filter((c) => c === coin) as Coin[]);

  const rounds = useMemo(
    () => coins.map((c) => ({ coin: c, event: currentFor.get(`${c}-${tf}`) ?? null })),
    [coins, currentFor, tf],
  );

  /** Today's traded volume across every open crypto round. */
  const tradedToday = useMemo(() => {
    let sum = 0;
    for (const ev of currentFor.values()) sum += ev?.volume ?? 0;
    return sum;
  }, [currentFor]);

  const catalogue = useMemo(
    () => (coin === "all" ? events : events.filter((m) => coinOfEvent(m) === coin)),
    [events, coin],
  );

  const tfLabel = CRYPTO_TIMEFRAMES.find((t) => t.code === tf)?.label ?? tf;

  return (
    <div className="flex flex-col" style={{ marginTop: isMobile ? 18 : 20, gap: 22 }}>
      <VerticalHeader
        compact={isMobile}
        eyebrow="Crypto · around the clock"
        title="Where do the coins go next?"
        subtitle={
          <>
            Pick a window, pick a direction. Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 700 }}>$1</strong>, losing
            shares pay $0.
          </>
        }
        right={
          isMobile || tradedToday <= 0 ? undefined : (
            <div className="flex flex-col items-end" style={{ gap: 4 }}>
              <span
                className="font-display"
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#fff",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {compactUsd(tradedToday)}
              </span>
              <span style={{ ...EYEBROW, fontSize: 11 }}>Traded today</span>
            </div>
          )
        }
      />

      {/* Filters — row 1 WINDOW (dial), row 2 COIN (pills). */}
      <div className="flex flex-col" style={{ gap: 9 }}>
        {isMobile ? (
          <MobileRoundSwitcher value={tf} onSelect={setTf} />
        ) : (
          <DimensionRow label="Window">
            <StageDial value={tf} onChange={setTf} size="module" />
          </DimensionRow>
        )}
        <DimensionRow label="Coin" scroll={isMobile}>
          <DimensionPill
            label="All coins"
            active={coin === "all"}
            onSelect={() => setCoin("all")}
            mobile={isMobile}
          />
          {CRYPTO_COINS.map((c) => (
            <DimensionPill
              key={c.code}
              label={c.label}
              active={coin === c.code}
              onSelect={() => setCoin(c.code)}
              mobile={isMobile}
            />
          ))}
          {!isMobile && (
            <RowHelper
              scope={`Crypto · ${
                coin === "all"
                  ? "All coins"
                  : (CRYPTO_COINS.find((c) => c.code === coin)?.label ?? coin)
              }`}
              tail={`${rounds.filter((r) => r.event).length} rounds open`}
            />
          )}
        </DimensionRow>
      </div>

      {/* Engine — the selected window × coin rounds. Hidden under Boost:
          no boost-capable rounds exist yet (all round subtypes are *_SPOT). */}
      {!boostOnly && (
      <div className="flex flex-col" style={{ gap: 12 }}>
        {rounds.some((r) => r.event) ? (
          <div
            className={isMobile ? "flex flex-col" : "grid"}
            style={
              isMobile
                ? { gap: 12 }
                : {
                    gap: 16,
                    gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, rounds.length))},minmax(0,1fr))`,
                  }
            }
          >
            {rounds.map(({ coin: c, event }) =>
              isMobile ? (
                <MobileCoinCard
                  key={c}
                  coin={c}
                  event={event}
                  history={historyFor.get(`${c}-${tf}`) ?? []}
                  tf={tf}
                  tickSeconds={tickSeconds}
                  nowMs={nowMs}
                />
              ) : (
                <CoinTile
                  key={c}
                  coin={c}
                  event={event}
                  history={historyFor.get(`${c}-${tf}`) ?? []}
                  tickSeconds={tickSeconds}
                  nowMs={nowMs}
                />
              ),
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            No {tfLabel} round open right now — the next one starts shortly.
          </span>
        )}
      </div>
      )}

      {/* Catalogue */}
      <div
        className="flex flex-col"
        style={{ gap: 14, borderTop: "1px solid #1D2026", paddingTop: 22 }}
      >
        <CatalogueHeader
          compact={isMobile}
          title="What else could crypto do?"
          subtitle="Longer-running questions about coins, chains and the people behind them. Winning shares pay $1."
          count={catalogue.length}
        />
        {catalogue.length === 0 ? (
          boostOnly ? (
            <EmptyState
              variant="page"
              title="Nothing boosted here yet — check back soon."
            />
          ) : (
          <EmptyState
            variant="page"
            title="No open markets for this coin"
            description="New crypto markets land here as they open. Check back soon."
            actionLabel="See all coins"
            onAction={() => setCoin("all")}
          />
          )
        ) : (
          renderGrid(catalogue)
        )}
      </div>
    </div>
  );
};

export default LiteCryptoView;
