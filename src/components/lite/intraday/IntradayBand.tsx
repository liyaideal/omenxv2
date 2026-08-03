// ============================================================
// INTRADAY BAND — Lite list page, between the filter row and grid.
// Sub-group A: crypto quick rounds. Sub-group B: stocks closing today.
// ============================================================
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { QuickRoundTile } from "./QuickRoundTile";
import { StocksSubGroup } from "./StocksSubGroup";
import {
  COINS,
  TIMEFRAMES,
  Timeframe,
  formatCountdown,
  useIntradayStocks,
  useQuickRounds,
  useSecondTick,
} from "./intradayData";

const MICRO: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6B7280",
};

export const IntradayBand = () => {
  const isMobile = useIsMobile();
  const tickSeconds = useSecondTick();
  const [tf, setTf] = useState<Timeframe>("15m");
  const { currentFor, historyFor, loading } = useQuickRounds(true);
  const { rows: stockRows } = useIntradayStocks(true);

  const tiles = useMemo(
    () =>
      COINS.map((coin) => ({
        coin,
        event: currentFor.get(`${coin}-${tf}`) ?? null,
        history: historyFor.get(`${coin}-${tf}`) ?? [],
      })),
    [currentFor, historyFor, tf],
  );

  const headerCountdown = useMemo(() => {
    const ends = tiles
      .map((t) => (t.event?.end_date ? new Date(t.event.end_date).getTime() : null))
      .filter((v): v is number => v != null);
    if (ends.length === 0) return null;
    return formatCountdown(Math.min(...ends) - Date.now());
  }, [tiles, tickSeconds]);

  const hasQuick = tiles.some((t) => t.event);
  if (loading && !hasQuick && stockRows.length === 0) return null;
  if (!hasQuick && stockRows.length === 0) return null;

  const Dial = (
    <div
      className={cn("flex items-center", isMobile && "w-full")}
      style={{
        background: "#101216",
        border: "1px solid #2B2F38",
        borderRadius: 11,
        padding: 3,
        gap: 2,
      }}
    >
      {TIMEFRAMES.map((t) => {
        const active = t.id === tf;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTf(t.id)}
            className={cn("font-display transition-colors", isMobile && "flex-1")}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 11px",
              borderRadius: 8,
              background: active ? "#FF8A3D" : "transparent",
              color: active ? "#2A1200" : "#9AA1AC",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,138,61,.18)",
        borderLeft: "3px solid #FF8A3D",
        background: "rgba(255,138,61,.03)",
        borderRadius: 16,
        padding: isMobile ? "14px 14px 16px" : "18px 20px 20px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="flex items-center gap-[6px]"
            style={{ ...MICRO, color: "#FF8A3D", fontSize: 10.5 }}
          >
            <span
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF8A3D" }}
            />
            Live now
          </div>
          <h2
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: isMobile ? 19 : 27,
              lineHeight: 1.1,
              marginTop: 4,
            }}
          >
            Intraday
          </h2>
          <p style={{ fontSize: 12.5, color: "#9AA1AC", marginTop: 4 }}>
            {isMobile
              ? "Opens and settles inside a single day. Winners pay $1."
              : "Events that open and settle inside a single day. Pick a direction — winning shares pay $1."}
          </p>
        </div>
        {isMobile && headerCountdown && (
          <div
            className="font-display shrink-0"
            style={{ fontWeight: 700, fontSize: 16, color: "#FF8A3D" }}
          >
            {headerCountdown}
          </div>
        )}
      </div>

      {/* Sub-group A */}
      {hasQuick && (
        <div style={{ marginTop: 16 }}>
          <div
            className={cn(
              "gap-3",
              isMobile ? "flex flex-col" : "flex items-end justify-between",
            )}
          >
            <div>
              <div className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>
                Quick rounds
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                crypto · rolls into the next round on settle
              </div>
            </div>
            {isMobile ? (
              Dial
            ) : (
              <div className="flex items-center gap-[10px]">
                <span style={MICRO}>Round window · All three</span>
                {Dial}
              </div>
            )}
          </div>

          <div
            className={cn(
              isMobile
                ? "flex gap-[10px] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                : "grid grid-cols-3 gap-[12px]",
            )}
            style={{ marginTop: 12, scrollSnapType: isMobile ? "x mandatory" : undefined }}
          >
            {tiles.map((t) => (
              <QuickRoundTile
                key={t.coin}
                coin={t.coin}
                event={t.event}
                history={t.history}
                tickSeconds={tickSeconds}
                compact={isMobile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sub-group B */}
      {stockRows.length > 0 && (
        <StocksSubGroup rows={stockRows} isMobile={!!isMobile} tickSeconds={tickSeconds} />
      )}
    </section>
  );
};

export default IntradayBand;