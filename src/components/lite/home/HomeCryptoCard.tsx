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
}: {
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const { up, down, base, upOdds, price, pct } = useNumbers(event, tickSeconds);
  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(`/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 16,
        padding: "22px 24px",
      }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <AssetAvatar symbol="BTC" kind="crypto" size={34} />
        <span style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>BTC</span>
        <span className="ml-auto">
          <PctChange value={pct} size={13.5} weight={600} />
        </span>
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 34,
          fontWeight: 700,
          marginTop: 10,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {price != null ? fmtUsd(price) : "—"}
      </div>
      <div style={{ marginTop: 14 }}>
        {event && base != null && price != null ? (
          <RoundPlot
            eventId={event.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={176}
          />
        ) : (
          <ChartSkeleton height={176} />
        )}
      </div>
      <div className="flex items-center" style={{ margin: "11px 2px 13px" }}>
        <span
          className="font-display"
          style={{ fontSize: 12, color: "#98A1AD", fontVariantNumeric: "tabular-nums" }}
        >
          {base != null ? `Round open ${fmtUsd(base)}` : "Round open —"}
        </span>
        <span className="ml-auto">
          <Last8Strip history={history} variant="strip" dot={11} />
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
          minHeight={44}
          labelSize={14.5}
          priceSize={14.5}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down ? down.price : 0.5}
          tone="down"
          minHeight={44}
          labelSize={14.5}
          priceSize={14.5}
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
}: {
  coin: Coin;
  event: QuickEvent | null;
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

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <div className="flex items-center" style={{ gap: 9 }}>
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={26} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{meta.ticker}</span>
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
        <span className="ml-auto">
          <PctChange value={pct} size={12} weight={600} />
        </span>
      </div>
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
      <div className="grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
        <DirectionButton
          label="Up"
          price={up ? up.price : 0.5}
          tone="up"
          minHeight={38}
          labelSize={13.5}
          priceSize={13.5}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down ? down.price : 0.5}
          tone="down"
          minHeight={38}
          labelSize={13.5}
          priceSize={13.5}
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
    <HomeCard style={{ padding: isMobile ? "18px 16px" : "26px 30px" }}>
      <HomeEyebrow color={ORANGE}>● Intraday · Rolling rounds</HomeEyebrow>
      <div
        className={isMobile ? "flex flex-col" : "flex items-center"}
        style={{ gap: isMobile ? 12 : 20, marginTop: 12 }}
      >
        <HomeQuestion size={isMobile ? 20 : 26}>Will the price go up?</HomeQuestion>
        <span className={isMobile ? "" : "ml-auto flex-none"}>
          <span className="flex items-center" style={{ gap: 16 }}>
            {!isMobile && (
              <span style={{ fontSize: 14, color: "#98A1AD" }}>Round length</span>
            )}
            <RoundDial value={tf} onSelect={onSelectTf} />
          </span>
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: "#98A1AD" }}>
        One clock for all three coins.
      </div>

      {isMobile ? (
        <div className="flex flex-col" style={{ gap: 12, marginTop: 16 }}>
          <MainTile
            event={btc}
            history={historyFor.get(`btc-${tf}`) ?? []}
            tickSeconds={tickSeconds}
          />
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CompactTile coin="eth" event={eventFor("eth")} tickSeconds={tickSeconds} />
            <CompactTile coin="sol" event={eventFor("sol")} tickSeconds={tickSeconds} />
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
