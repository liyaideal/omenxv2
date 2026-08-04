// ============================================================
// Calendar view — shared presentational blocks.
// Week tickets, the clock-spine row and the three Day-mode block
// types. Pixel contract: docs/design-contracts/calendar-final.html
// Every card routes into the existing trade pages (CHK-8).
// ============================================================
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import { kickoffCell } from "@/components/lite/sports/sportsData";
import {
  CalItem,
  TicketView,
  centLabel,
  closesSoon,
  compactUsd,
  localTime,
  marketShortName,
} from "./calendarData";

export const ORANGE = "#FF8A3D";
const UP = "#33D6FF";
const DOWN = "#CFFF4A";
const NEUTRAL = "#E6E9EE";

/* ---------------- Small parts ---------------- */

export const LivePulse = ({ size = 5 }: { size?: number }) => (
  <span
    className="animate-pulse"
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: "#FF3B4E",
      flex: "none",
    }}
  />
);

/** Muted outlined text badge — never coloured. */
export const ClosesSoonBadge = () => (
  <span
    style={{
      fontSize: 10,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#C9CED6",
      fontWeight: 700,
      border: "1px solid #23262D",
      borderRadius: 6,
      padding: "2px 7px",
      whiteSpace: "nowrap",
    }}
  >
    Closes soon
  </span>
);

export const CategoryBadge = ({
  label,
  tone,
}: {
  label: string;
  tone: "sports" | "intraday" | "outline";
}) => (
  <span
    style={{
      fontSize: 9,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      fontWeight: 700,
      borderRadius: 5,
      padding: "2px 7px",
      whiteSpace: "nowrap",
      color: tone === "outline" ? "#C9CED6" : "#0A0B0D",
      background:
        tone === "sports" ? "#F2F3F5" : tone === "intraday" ? ORANGE : "transparent",
      border: tone === "outline" ? "1px solid #23262D" : "1px solid transparent",
    }}
  >
    {label}
  </span>
);

const MicroCaption = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      fontSize: 9,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#6B7280",
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const Volume = ({ value }: { value: number }) => (
  <span style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>
    {compactUsd(value)} traded
  </span>
);

/** Tier-2 outcome chip — 128px, min-height 52. */
export const OutcomeChip = ({
  label,
  price,
  color,
  onClick,
}: {
  label: string;
  price: number;
  color: string;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="chip-t2 box-border flex items-center justify-between"
    style={
      {
        width: 128,
        minHeight: 52,
        padding: "0 13px",
        gap: 8,
        color,
        ["--chip-accent" as string]: color,
      } as React.CSSProperties
    }
  >
    <span
      className="truncate"
      style={{ fontSize: 11, color: "#9AA1AC", whiteSpace: "nowrap" }}
    >
      {label}
    </span>
    <span
      className="font-display"
      style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {centLabel(price)}
    </span>
  </button>
);

/** Tier-1 stacked direction button — 9px label over a 14px price. */
const DirectionButton = ({
  label,
  price,
  tone,
  onClick,
}: {
  label: string;
  price: number;
  tone: "up" | "down";
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`chip-t1 ${tone === "up" ? "chip-t1-up" : "chip-t1-down"} box-border flex flex-col items-center justify-center`}
    style={{ minHeight: 46, borderRadius: 11, padding: "0 11px", gap: 1 }}
  >
    <span style={{ fontSize: 9, fontWeight: 700 }}>{label}</span>
    <span
      className="font-display"
      style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {centLabel(price)}
    </span>
  </button>
);

/* ---------------- Standing intraday row ---------------- */

export const StandingIntradayRow = ({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen: () => void;
}) => (
  <button
    type="button"
    onClick={onOpen}
    className="box-border flex w-full items-center text-left transition-colors"
    style={{
      background: "#131519",
      border: "1px solid rgba(255,138,61,0.35)",
      borderRadius: 14,
      padding: compact ? "13px 14px" : "14px 18px",
      gap: compact ? 12 : 14,
    }}
  >
    <span
      className="flex flex-none items-center justify-center"
      style={{
        width: compact ? 30 : 34,
        height: compact ? 30 : 34,
        borderRadius: 999,
        background: "rgba(255,138,61,0.12)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <span
        className="animate-pulse"
        style={{
          width: compact ? 7 : 8,
          height: compact ? 7 : 8,
          borderRadius: 999,
          background: ORANGE,
        }}
      />
    </span>
    <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
      <span style={{ fontSize: compact ? 13 : 15, color: "#fff", fontWeight: 700 }}>
        {compact
          ? "Crypto rounds never stop"
          : "Crypto rounds never stop — trade Intraday any time"}
      </span>
      <span style={{ fontSize: compact ? 11 : 12, color: "#9AA1AC" }}>
        {compact
          ? "Trade Intraday any time"
          : "Rolling 5m to 1D rounds have no fixed date, so they are not on the timeline."}
      </span>
    </span>
    <span
      className="flex-none"
      style={{ fontSize: compact ? 16 : 12, color: ORANGE, fontWeight: 700 }}
    >
      {compact ? "→" : "Open Intraday →"}
    </span>
  </button>
);

/* ---------------- Week ticket ---------------- */

export const WeekTicket = ({
  ticket,
  onClick,
}: {
  ticket: TicketView;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="lite-cal-ticket box-border flex flex-col text-left"
    data-intraday={ticket.intraday ? "true" : "false"}
    style={{
      background: "#131519",
      border: `1px solid ${ticket.intraday ? "rgba(255,138,61,0.30)" : "#1D2026"}`,
      borderRadius: 10,
      padding: 8,
      gap: 3,
    }}
  >
    <span className="flex items-center" style={{ gap: 4 }}>
      {ticket.live && <LivePulse size={4} />}
      <span
        style={{
          fontSize: 10,
          color: ticket.intraday ? "#9AA1AC" : "#fff",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ticket.time}
      </span>
    </span>
    <span
      style={{
        fontSize: 11,
        color: "#fff",
        fontWeight: 600,
        lineHeight: 1.25,
        textWrap: "pretty",
      }}
    >
      {ticket.title}
    </span>
    <span
      style={{
        fontSize: 8,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: ticket.intraday ? ORANGE : "#6B7280",
        fontWeight: 700,
      }}
    >
      {ticket.cat}
    </span>
  </button>
);

/* ---------------- Mobile ticket ---------------- */

export const MobileTicket = ({
  ticket,
  onClick,
}: {
  ticket: TicketView;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="box-border flex w-full items-center text-left"
    style={{
      background: "#131519",
      border: "1px solid #1D2026",
      borderRadius: 12,
      padding: "0 13px",
      minHeight: 56,
      gap: 12,
    }}
  >
    <span className="flex flex-none flex-col" style={{ width: 46, gap: 1 }}>
      <span
        className="font-display"
        style={{
          fontSize: 13,
          color: "#fff",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ticket.time}
      </span>
      {ticket.live && (
        <span className="flex items-center" style={{ gap: 4 }}>
          <LivePulse size={4} />
          <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>live</span>
        </span>
      )}
    </span>
    <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
      <span
        style={{
          fontSize: 13,
          color: "#fff",
          fontWeight: 600,
          lineHeight: 1.25,
          textWrap: "pretty",
        }}
      >
        {ticket.title}
      </span>
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#6B7280",
          fontWeight: 700,
        }}
      >
        {ticket.cat}
      </span>
    </span>
    <span className="flex-none" style={{ fontSize: 16, color: "#4B5563" }}>
      ›
    </span>
  </button>
);

/* ---------------- Clock spine ---------------- */

export const SpineRow = ({
  time,
  tz,
  last,
  children,
}: {
  time: string;
  tz: string;
  last: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex" style={{ gap: 16 }}>
    <span
      className="flex flex-none flex-col items-end"
      style={{ width: 66, gap: 2, paddingTop: 3 }}
    >
      <span
        className="font-display"
        style={{
          fontSize: 16,
          color: "#fff",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {time}
      </span>
      <MicroCaption>{tz}</MicroCaption>
    </span>
    <span
      className="flex-none"
      style={{ width: 1, background: last ? "transparent" : "#1D2026" }}
    />
    <span
      className="min-w-0 flex-1"
      style={{ paddingBottom: last ? 0 : 16 }}
    >
      {children}
    </span>
  </div>
);

const CardShell = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter") onClick();
    }}
    className="box-border flex cursor-pointer items-center"
    style={{
      background: "#131519",
      border: "1px solid #1D2026",
      borderRadius: 14,
      padding: "14px 16px",
      gap: 16,
    }}
  >
    {children}
  </div>
);

/* ---------------- Day block: sports match ---------------- */

const Crest = ({ text }: { text: string }) => (
  <span
    className="font-display flex items-center justify-center"
    style={{
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "#22262D",
      border: "1px solid rgba(255,255,255,.08)",
      fontSize: 10,
      fontWeight: 700,
      color: "#F2F3F5",
    }}
  >
    {text}
  </span>
);

export const SportsBlock = ({
  item,
  onOpen,
}: {
  item: Extract<CalItem, { kind: "sports" }>;
  onOpen: (eventId: string, optionId?: string) => void;
}) => {
  const m = item.match;
  const kick = kickoffCell(m.kickoff, m.league);
  const colorFor = (i: number, n: number) => {
    if (i === 0) return UP;
    if (i === n - 1) return DOWN;
    return NEUTRAL;
  };
  return (
    <CardShell onClick={() => onOpen(m.id)}>
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 7 }}>
        <span className="flex flex-wrap items-center" style={{ gap: 9 }}>
          <CategoryBadge label="Sports" tone="sports" />
          <MicroCaption>
            {m.league} · {/ufc|mma/i.test(m.league) ? "MMA" : "Football"}
          </MicroCaption>
          <span style={{ fontSize: 10, color: "#4B5563" }}>
            kickoff {kick.time} {kick.zone}
          </span>
          {m.live && (
            <span className="flex items-center" style={{ gap: 5 }}>
              <LivePulse />
              <span
                style={{
                  fontSize: 12,
                  color: "#fff",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {m.minute}'
              </span>
            </span>
          )}
        </span>
        <span className="flex items-center" style={{ gap: 12 }}>
          <span className="flex flex-none items-center">
            <Crest text={m.homeAbbr || m.home.slice(0, 3).toUpperCase()} />
            <span style={{ marginLeft: -10 }}>
              <Crest text={m.awayAbbr || m.away.slice(0, 3).toUpperCase()} />
            </span>
          </span>
          <span style={{ fontSize: 17, color: "#fff", fontWeight: 600 }}>{m.name}</span>
          {m.live && m.score && (
            <span
              className="font-display"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {m.score}
            </span>
          )}
        </span>
        <Volume value={m.volume} />
      </span>
      <span className="flex flex-none" style={{ gap: 8 }}>
        {m.options.map((o, i) => (
          <OutcomeChip
            key={o.id}
            label={o.label}
            price={o.price}
            color={colorFor(i, m.options.length)}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(m.id, o.id);
            }}
          />
        ))}
      </span>
    </CardShell>
  );
};

/* ---------------- Day block: intraday session close ---------------- */

const TILE_CAP = 10;

export const SessionBlock = ({
  item,
  now,
  onOpenStock,
  onOpenIntraday,
}: {
  item: Extract<CalItem, { kind: "session" }>;
  now: number;
  onOpenStock: (eventId: string, side?: "up" | "down") => void;
  onOpenIntraday: () => void;
}) => {
  const short = marketShortName(item.market);
  const total = item.rows.length;
  const tiles = item.rows.slice(0, TILE_CAP);
  return (
    <span className="flex flex-col" style={{ gap: 9 }}>
      <span className="flex flex-wrap items-center" style={{ gap: 9 }}>
        <CategoryBadge label="Intraday" tone="intraday" />
        <span style={{ fontSize: 12, color: "#9AA1AC" }}>
          {short} session close · {total} {total === 1 ? "name" : "names"} settle at the
          bell
        </span>
        {closesSoon(item.at, now) && <ClosesSoonBadge />}
      </span>
      <span className="grid grid-cols-2" style={{ gap: 9 }}>
        {tiles.map((row) => {
          const ticker = deriveTickerFromEvent(row.id, row.name);
          const company = STOCK_NAME[ticker] ?? ticker;
          return (
            <span
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenStock(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onOpenStock(row.id);
              }}
              className="lite-cal-tile box-border flex cursor-pointer items-center"
              style={{
                background: "#131519",
                border: "1px solid #1D2026",
                borderRadius: 12,
                padding: "11px 13px",
                gap: 11,
              }}
            >
              <AssetAvatar symbol={ticker} kind="equity" size={28} />
              <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 1 }}>
                <span
                  className="truncate"
                  style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}
                >
                  {company} finishes up
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#6B7280",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ticker}
                </span>
              </span>
              <span className="flex flex-none" style={{ gap: 6 }}>
                <DirectionButton
                  label="Up"
                  price={row.upPrice}
                  tone="up"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStock(row.id, "up");
                  }}
                />
                <DirectionButton
                  label="Not up"
                  price={row.downPrice}
                  tone="down"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStock(row.id, "down");
                  }}
                />
              </span>
            </span>
          );
        })}
      </span>
      {total > TILE_CAP && (
        <span className="flex items-center" style={{ gap: 10 }}>
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            Showing {TILE_CAP} of {total} names settling at this bell
          </span>
          <span style={{ height: 1, background: "#16181D", flex: 1 }} />
          <button
            type="button"
            onClick={onOpenIntraday}
            style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}
          >
            See all {total} in Intraday →
          </button>
        </span>
      )}
    </span>
  );
};

/* ---------------- Day block: generic event ---------------- */

export const GenericBlock = ({
  item,
  now,
  onOpen,
}: {
  item: Extract<CalItem, { kind: "generic" }>;
  now: number;
  onOpen: (eventId: string, optionId?: string) => void;
}) => {
  const row = item.row;
  const chips = row.children.slice(0, 2);
  return (
    <CardShell onClick={() => onOpen(row.eventId)}>
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 7 }}>
        <span className="flex flex-wrap items-center" style={{ gap: 9 }}>
          <CategoryBadge label={row.categoryLabel || row.category} tone="outline" />
          {closesSoon(item.at, now) && <ClosesSoonBadge />}
        </span>
        <span
          style={{
            fontSize: 17,
            color: "#fff",
            fontWeight: 600,
            lineHeight: 1.3,
            textWrap: "pretty",
          }}
        >
          {row.eventName}
        </span>
        <Volume value={row.totalVolume} />
      </span>
      <span className="flex flex-none" style={{ gap: 8 }}>
        {chips.map((c, i) => (
          <OutcomeChip
            key={c.id}
            label={c.displayLabel}
            price={c.markPrice}
            color={i === 0 ? UP : DOWN}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(row.eventId, c.id);
            }}
          />
        ))}
      </span>
    </CardShell>
  );
};

/** Local HH:mm for the spine cell. */
export const spineTime = (item: CalItem) => localTime(item.at);
