// ============================================================
// HOME · INTRADAY CRYPTO CARD (HP-1)
// BTC is the fixed hero tile; ETH / SOL are the compact right column.
// One module-level round dial drives all three tiles.
// ============================================================
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import { DirectionButton, RoundDial } from "@/components/lite/categoryviews/verticalBlocks";
import { Last8Strip, PctChange } from "@/components/lite/shared/primitives";
import {
  COIN_META,
  Coin,
  QuickEvent,
  Timeframe,
  derivedPrice,
  downOptionOf,
  seedFromId,
  upOptionOf,
} from "@/components/lite/intraday/intradayData";
import { HomeCard, HomeEyebrow, HomeQuestion, ORANGE } from "./homeShell";

const fmtUsd = (v: number) =>
  `$${v.toLocaleString(undefined, {
    minimumFractionDigits: v < 1000 ? 2 : 0,
    maximumFractionDigits: v < 1000 ? 2 : 0,
  })}`;

const useNumbers = (event: QuickEvent | null, tickSeconds: number) => {
  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const base = event?.base_price ?? null;
  const upOdds = up ? up.price : 0.5;
  const price = derivedPrice(base, upOdds, event ? seedFromId(event.id) : 0, tickSeconds);
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  return { up, down, base, upOdds, price, pct };
};

const ChartSkeleton = ({ height }: { height: number }) => (
  <div
    className="w-full animate-pulse"
    style={{ height, background: "#0E1116", borderRadius: 12 }}
  />
);

const MainTile = ({
  event,
  history,
  tickSeconds,
  compact = false,
}: {
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tickSeconds: number;
  compact?: boolean;
}) => {
  const navigate = useNavigate();
  const { up, down, base, upOdds, price, pct } = useNumbers(event, tickSeconds);
  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(`/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`);
  };
  const chartHeight = compact ? 132 : 176;

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 16,
        padding: compact ? "14px 14px" : "22px 24px",
      }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <AssetAvatar symbol="BTC" kind="crypto" size={compact ? 30 : 34} />
        <span style={{ fontWeight: 700, fontSize: compact ? 16 : 18, color: "#fff" }}>BTC</span>
        <span className="ml-auto">
          <PctChange value={pct} size={compact ? 12.5 : 13.5} weight={600} />
        </span>
      </div>
      <div
        className="font-display"
        style={{
          fontSize: compact ? 26 : 34,
          fontWeight: 700,
          marginTop: compact ? 6 : 10,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {price != null ? fmtUsd(price) : "—"}
      </div>
      <div style={{ marginTop: compact ? 10 : 14 }}>
        {event && base != null && price != null ? (
          <RoundPlot
            eventId={event.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={chartHeight}
          />
        ) : (
          <ChartSkeleton height={chartHeight} />
        )}
      </div>
      <div
        className="flex flex-wrap items-center"
        style={{ margin: "10px 2px 12px", gap: 8, rowGap: 6 }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 12,
            color: "#98A1AD",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {base != null ? `Round open ${fmtUsd(base)}` : "Round open —"}
        </span>
        <span className="ml-auto whitespace-nowrap">
          <Last8Strip history={history} variant="strip" dot={compact ? 10 : 11} />
        </span>
      </div>
      <div
        className="mt-auto grid"
        style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}
      >
        <DirectionButton
          label="Up"
          price={up ? up.price : 0.5}
          tone="up"
          minHeight={compact ? 46 : 44}
          labelSize={14.5}
          priceSize={14.5}
          gap={8}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down ? down.price : 0.5}
          tone="down"
          minHeight={compact ? 46 : 44}
          labelSize={14.5}
          priceSize={14.5}
          gap={8}
          onClick={go("down")}
        />
      </div>
    </div>
  );
};


const CompactTile = ({
  coin,
  event,
  tickSeconds,
  compact = false,
}: {
  coin: Coin;
  event: QuickEvent | null;
  tickSeconds: number;
  compact?: boolean;
}) => {
  const navigate = useNavigate();
  const meta = COIN_META[coin];
  const { up, down, base, upOdds, price, pct } = useNumbers(event, tickSeconds);
  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(`/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`);
  };

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 16,
        padding: compact ? "12px 12px" : "16px 18px",
      }}
    >
      <div className="flex items-center" style={{ gap: compact ? 7 : 9 }}>
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={compact ? 22 : 26} />
        <span style={{ fontWeight: 700, fontSize: compact ? 13.5 : 15, color: "#fff" }}>
          {meta.ticker}
        </span>
        {!compact && (
          <span
            className="font-display"
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginLeft: 6,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {price != null ? fmtUsd(price) : "—"}
          </span>
        )}
        <span className="ml-auto">
          <PctChange value={pct} size={compact ? 11 : 12} weight={600} />
        </span>
      </div>
      {compact && (
        <div
          className="font-display truncate"
          style={{
            marginTop: 6,
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {price != null ? fmtUsd(price) : "—"}
        </div>
      )}
      <div className="flex flex-1 flex-col" style={{ margin: "12px 0", minHeight: 62 }}>
        {event && base != null && price != null ? (
          <RoundPlot
            eventId={event.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={72}
          />
        ) : (
          <ChartSkeleton height={72} />
        )}
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: compact ? 6 : 8 }}
      >
        <DirectionButton
          label="Up"
          price={up ? up.price : 0.5}
          tone="up"
          layout={compact ? "stacked" : "split"}
          minHeight={compact ? 44 : 38}
          labelSize={compact ? 11 : 13.5}
          priceSize={compact ? 13.5 : 13.5}
          gap={compact ? 1 : 8}
          padding={compact ? "0 8px" : undefined}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down ? down.price : 0.5}
          tone="down"
          layout={compact ? "stacked" : "split"}
          minHeight={compact ? 44 : 38}
          labelSize={compact ? 11 : 13.5}
          priceSize={compact ? 13.5 : 13.5}
          gap={compact ? 1 : 8}
          padding={compact ? "0 8px" : undefined}
          onClick={go("down")}
        />


      </div>
    </div>
  );
};

/**
 * HP-3 · mobile round card — BTC / ETH / SOL share ONE layout: head
 * (avatar + `TICKER · {tf} round` + price + %) with an orange CLOSES clock,
 * chart, Last 8 strip, then the Up / Down pair.
 */
const MobileRoundCard = ({
  coin,
  event,
  history,
  tf,
  tickSeconds,
}: {
  coin: Coin;
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tf: Timeframe;
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const meta = COIN_META[coin];
  const { up, down, base, upOdds, price, pct } = useNumbers(event, tickSeconds);
  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(`/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`);
  };
  const closesIn = event?.end_date
    ? formatCountdown(new Date(event.end_date).getTime() - Date.now())
    : "--:--";
  const tfLabel = tf === "1d" ? "1d" : tf;

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 16,
        padding: "14px",
      }}
    >
      <div className="flex items-start" style={{ gap: 10 }}>
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline" style={{ gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{meta.ticker}</span>
            <span style={{ fontSize: 11.5, color: "#98A1AD" }}>· {tfLabel} round</span>
          </div>
          <div className="flex items-baseline" style={{ gap: 8, marginTop: 3 }}>
            <span
              className="font-display"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {price != null ? fmtUsd(price) : "—"}
            </span>
            <PctChange value={pct} size={12} weight={600} />
          </div>
        </div>
        <div className="flex flex-none flex-col items-end">
          <span
            className="font-mono"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: ORANGE,
              fontWeight: 700,
            }}
          >
            Closes
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: ORANGE,
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {closesIn}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {event && base != null && price != null ? (
          <RoundPlot
            eventId={event.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={110}
          />
        ) : (
          <ChartSkeleton height={110} />
        )}
      </div>

      <div className="flex items-center" style={{ marginTop: 10 }}>
        <span className="ml-auto whitespace-nowrap">
          <Last8Strip history={history} variant="strip" dot={10} />
        </span>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 10 }}
      >
        <DirectionButton
          label="Up"
          price={up ? up.price : 0.5}
          tone="up"
          minHeight={44}
          labelSize={14.5}
          priceSize={14.5}
          gap={8}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down ? down.price : 0.5}
          tone="down"
          minHeight={44}
          labelSize={14.5}
          priceSize={14.5}
          gap={8}
          onClick={go("down")}
        />
      </div>
    </div>
  );
};

export const HomeCryptoCard = ({
  currentFor,
  historyFor,
  tf,
  onSelectTf,
  tickSeconds,
  isMobile,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  tf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  tickSeconds: number;
  isMobile: boolean;
}) => {
  const eventFor = (coin: Coin) => currentFor.get(`${coin}-${tf}`) ?? null;
  const btc = eventFor("btc");

  return (
    <HomeCard style={{ padding: isMobile ? "16px" : "26px 30px" }}>
      <HomeEyebrow color={ORANGE}>● Intraday · Rolling rounds</HomeEyebrow>
      <div
        className={isMobile ? "flex flex-col" : "flex items-center"}
        style={{ gap: isMobile ? 10 : 20, marginTop: isMobile ? 10 : 12 }}
      >
        <HomeQuestion size={isMobile ? 20 : 26}>Will the price go up?</HomeQuestion>
        <span className={isMobile ? "" : "ml-auto flex-none"}>
          <span className="flex items-center" style={{ gap: 16 }}>
            {!isMobile && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#6B7280",
                  fontWeight: 700,
                }}
              >
                ROUND
              </span>
            )}
            <RoundDial value={tf} onSelect={onSelectTf} />
          </span>
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: isMobile ? 13 : 14, color: "#98A1AD" }}>
        One clock for all three coins.
      </div>

      {isMobile ? (
        <div className="flex flex-col" style={{ gap: 10, marginTop: 14 }}>
          <MainTile
            event={btc}
            history={historyFor.get(`btc-${tf}`) ?? []}
            tickSeconds={tickSeconds}
            compact
          />
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            <CompactTile coin="eth" event={eventFor("eth")} tickSeconds={tickSeconds} compact />
            <CompactTile coin="sol" event={eventFor("sol")} tickSeconds={tickSeconds} compact />
          </div>
        </div>

      ) : (
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: "7fr 5fr", gap: 16, marginTop: 20 }}
        >
          <MainTile
            event={btc}
            history={historyFor.get(`btc-${tf}`) ?? []}
            tickSeconds={tickSeconds}
          />
          <div className="flex flex-col self-stretch" style={{ gap: 16 }}>
            <CompactTile coin="eth" event={eventFor("eth")} tickSeconds={tickSeconds} />
            <CompactTile coin="sol" event={eventFor("sol")} tickSeconds={tickSeconds} />
          </div>
        </div>
      )}
    </HomeCard>
  );
};

export default HomeCryptoCard;
