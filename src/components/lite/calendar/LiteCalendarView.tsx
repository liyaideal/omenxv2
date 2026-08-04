// ============================================================
// CALENDAR VIEW — a lens on the Lite events page, not a route.
// Pixel contract: docs/design-contracts/calendar-final.html
//   Final · Week (desktop default) · Final · Day · Final · Empty day
//   Final · Mobile (390, week mode only this round)
// "Week is the map. Day is where you trade."
// CHK-8: every ticket/card/button routes into /trade or /spot.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventRow } from "@/hooks/useMarketListData";
import { SportsMatch } from "@/components/lite/sports/sportsData";
import { StockEventRow } from "@/components/lite/intraday/intradayData";
import { cn } from "@/lib/utils";
import {
  CalItem,
  DAY_MS,
  WEEK_DAYS,
  buildCalendarItems,
  buildSportsSubTypes,
  buildWeekColumns,
  itemMatchesCategory,
  itemMatchesSubType,
  localTime,
  startOfDay,
  stepperLabel,
  sumMarkets,
  ticketOf,
  userTzAbbrev,
} from "./calendarData";
import {
  GenericBlock,
  MobileTicket,
  SessionBlock,
  SpineRow,
  SportsBlock,
  StandingIntradayRow,
  WeekTicket,
} from "./CalendarBlocks";

export interface LiteCalendarViewProps {
  events: EventRow[];
  matches: SportsMatch[];
  stocks: StockEventRow[];
  /** Active category pill from the events page (still filters here). */
  sector: string;
  isMobile: boolean;
  /** Return to the normal list view. */
  onBackToList: () => void;
  /** Switch the page to the Intraday view. */
  onOpenIntraday: () => void;
  /** Frozen clock override — style-guide presets only. */
  nowOverride?: number;
}

const WEEK_TICKET_CAP = 4;
/** Everything with a decision moment past the week still gets a home. */
const LATER_HORIZON_DAYS = 730;
const LATER_TICKET_CAP = 6;

const SegPill = ({
  value,
  onSelect,
}: {
  value: "day" | "week";
  onSelect: (v: "day" | "week") => void;
}) => (
  <span
    className="flex"
    style={{
      background: "#131519",
      border: "1px solid #1D2026",
      borderRadius: 999,
      padding: 3,
    }}
  >
    {(["day", "week"] as const).map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => onSelect(v)}
        style={{
          borderRadius: 999,
          padding: "9px 18px",
          fontSize: 12,
          fontWeight: v === value ? 700 : 600,
          background: v === value ? "#fff" : "transparent",
          color: v === value ? "#0A0B0D" : "#9AA1AC",
        }}
      >
        {v === "day" ? "Day" : "Week"}
      </button>
    ))}
  </span>
);

const SubTypeChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex-none"
    style={{
      borderRadius: 999,
      padding: "5px 11px",
      fontSize: 11,
      fontWeight: active ? 700 : 600,
      background: active ? "#F2F3F5" : "transparent",
      color: active ? "#0A0B0D" : "#9AA1AC",
      border: active ? "1px solid #F2F3F5" : "1px solid #23262D",
    }}
  >
    {label}
  </button>
);

export const LiteCalendarView = ({
  events,
  matches,
  stocks,
  sector,
  isMobile,
  onBackToList,
  onOpenIntraday,
  nowOverride,
}: LiteCalendarViewProps) => {
  const navigate = useNavigate();
  const now = nowOverride ?? Date.now();
  const todayKey = startOfDay(now);
  const tz = userTzAbbrev();

  const [mode, setMode] = useState<"day" | "week">("week");
  const [dayKey, setDayKey] = useState<number>(todayKey);
  const [subType, setSubType] = useState<string>("all");
  /** Mobile: day-strip chip filters the ticket list in place. */
  const [mobileDay, setMobileDay] = useState<number | null>(null);

  const allItems = useMemo(
    () =>
      buildCalendarItems({
        events,
        matches,
        stocks,
        now,
        horizonDays: LATER_HORIZON_DAYS,
      }),
    [events, matches, stocks, now],
  );

  const subTypeRow = useMemo(() => buildSportsSubTypes(matches), [matches]);
  const showSubTypes = sector === "sports" && subTypeRow.leaves.length > 0;

  const items = useMemo(
    () =>
      allItems.filter(
        (i) =>
          itemMatchesCategory(i, sector) &&
          (!showSubTypes || itemMatchesSubType(i, subType)),
      ),
    [allItems, sector, showSubTypes, subType],
  );

  const weekEnd = todayKey + WEEK_DAYS * DAY_MS;
  /** In-window items drive the 7 columns; the rest fall into "Later". */
  const weekItems = useMemo(
    () => items.filter((i) => i.at.getTime() < weekEnd),
    [items, weekEnd],
  );
  const laterItems = useMemo(
    () => items.filter((i) => i.at.getTime() >= weekEnd),
    [items, weekEnd],
  );
  const laterTotal = useMemo(() => sumMarkets(laterItems), [laterItems]);

  const columns = useMemo(() => buildWeekColumns(weekItems, now), [weekItems, now]);
  const weekTotal = useMemo(() => sumMarkets(weekItems), [weekItems]);

  const dayItems = useMemo(
    () => weekItems.filter((i) => startOfDay(i.at) === dayKey),
    [weekItems, dayKey],
  );

  const nextItem = useMemo(
    () => items.find((i) => i.at.getTime() > now) ?? null,
    [items, now],
  );

  const goEvent = (eventId: string, optionId?: string) =>
    navigate(
      `/trade?event=${encodeURIComponent(eventId)}${optionId ? `&option=${encodeURIComponent(optionId)}` : ""}`,
    );
  const goSpot = (eventId: string, side?: "up" | "down") =>
    navigate(`/spot?event=${encodeURIComponent(eventId)}${side ? `&side=${side}` : ""}`);

  /** A ticket tap: week mode picks the day, mobile opens the market. */
  const openItem = (item: CalItem) => {
    if (item.kind === "session") {
      onOpenIntraday();
      return;
    }
    if (item.kind === "sports") goEvent(item.match.id);
    else goEvent(item.row.eventId);
  };

  /* ---------------- Shared header ---------------- */

  const header = (
    <div
      className={cn(
        isMobile ? "flex flex-col" : "flex items-end justify-between",
      )}
      style={{ gap: isMobile ? 14 : 24 }}
    >
      <div className="flex flex-col" style={{ gap: isMobile ? 6 : 7 }}>
        <h1
          className="font-display"
          style={{
            fontSize: isMobile ? 24 : 34,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#fff",
          }}
        >
          What's coming up?
        </h1>
        <span style={{ fontSize: isMobile ? 12 : 13, color: "#9AA1AC", textWrap: "pretty" }}>
          Every market with a decision moment, on one timeline. Winning shares pay{" "}
          <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>.
        </span>
      </div>
      {isMobile ? (
        <div className="flex items-center justify-between" style={{ gap: 10 }}>
          <SegPill value="week" onSelect={() => undefined} />
          <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
            Times in {tz}
          </span>
        </div>
      ) : (
        <div className="flex flex-none items-center" style={{ gap: 10 }}>
          <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
            Times in {tz}
          </span>
          {mode === "day" && (
            <div className="flex items-center" style={{ gap: 6 }}>
              {/* Back steps within the window; today is the floor (past days hold no live markets). */}
              <button
                type="button"
                onClick={() => setDayKey((k) => Math.max(k - DAY_MS, todayKey))}
                disabled={dayKey <= todayKey}
                aria-label="Previous day"
                className="flex items-center justify-center disabled:cursor-default disabled:opacity-40"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid #23262D",
                  color: "#9AA1AC",
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span
                className="font-display text-center"
                style={{ fontSize: 14, fontWeight: 700, color: "#fff", minWidth: 132 }}
              >
                {stepperLabel(dayKey, todayKey)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDayKey((k) =>
                    Math.min(k + DAY_MS, todayKey + (WEEK_DAYS - 1) * DAY_MS),
                  )
                }
                disabled={dayKey >= todayKey + (WEEK_DAYS - 1) * DAY_MS}
                aria-label="Next day"
                className="flex items-center justify-center disabled:cursor-default disabled:opacity-40"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid #23262D",
                  color: "#9AA1AC",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          <SegPill value={mode} onSelect={setMode} />
        </div>
      )}
    </div>
  );

  const subTypeStrip = showSubTypes && (
    <div className="flex flex-wrap items-center" style={{ gap: 9 }}>
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#F2F3F5",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {subTypeRow.micro}
      </span>
      <SubTypeChip
        label="All sports"
        active={subType === "all"}
        onClick={() => setSubType("all")}
      />
      {subTypeRow.groups.map((g) => (
        <SubTypeChip
          key={g.id}
          label={g.label}
          active={subType === g.id}
          onClick={() => setSubType(g.id)}
        />
      ))}
      {subTypeRow.leaves.length > 0 && (
        <span style={{ width: 1, height: 15, background: "#23262D" }} />
      )}
      {subTypeRow.leaves.map((l) => (
        <SubTypeChip
          key={l.id}
          label={l.label}
          active={subType === l.id}
          onClick={() => setSubType(l.id)}
        />
      ))}
    </div>
  );

  const standingRow = (
    <StandingIntradayRow compact={isMobile} onOpen={onOpenIntraday} />
  );

  /* ---------------- Mobile (week mode only) ---------------- */

  if (isMobile) {
    const strip = columns.filter((c) => c.markets > 0);
    const visible = mobileDay == null ? columns : columns.filter((c) => c.key === mobileDay);
    return (
      <div className="flex flex-col" style={{ gap: 14, paddingTop: 4 }}>
        {header}
        {subTypeStrip}
        {standingRow}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-[2px]">
          {strip.map((c) => {
            const active = mobileDay === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setMobileDay(active ? null : c.key)}
                className="flex flex-none flex-col items-center"
                style={{
                  background: active ? "#fff" : "#0A0B0D",
                  color: active ? "#0A0B0D" : "#9AA1AC",
                  border: `1px solid ${active ? "#fff" : "#23262D"}`,
                  borderRadius: 12,
                  padding: "8px 14px",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                  {c.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c.markets}
                </span>
              </button>
            );
          })}
        </div>

        {visible
          .filter((c) => c.items.length > 0)
          .map((c) => (
            <div key={c.key} className="flex flex-col" style={{ gap: 9 }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#F2F3F5",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </span>
                <span style={{ height: 1, background: "#1D2026", flex: 1 }} />
                <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>
                  {c.countLine}
                </span>
              </div>
              {c.items.map((it) => (
                <MobileTicket
                  key={it.id}
                  ticket={ticketOf(it)}
                  onClick={() => openItem(it)}
                />
              ))}
            </div>
          ))}

        {weekTotal === 0 && (
          <div
            className="flex flex-col items-center"
            style={{
              border: "1px dashed #23262D",
              borderRadius: 14,
              padding: "40px 20px",
              gap: 10,
            }}
          >
            <span
              className="font-display"
              style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}
            >
              Nothing scheduled this week
            </span>
            <button
              type="button"
              onClick={onBackToList}
              style={{ fontSize: 13, color: "#33D6FF", fontWeight: 700 }}
            >
              Back to all markets →
            </button>
          </div>
        )}

        <span style={{ fontSize: 11, color: "#6B7280", textWrap: "pretty" }}>
          {weekTotal} markets decide in the next 7 days. Tap a day to trade it.
        </span>
      </div>
    );
  }

  /* ---------------- Desktop ---------------- */

  return (
    <div className="flex flex-col" style={{ gap: 20, paddingTop: 6 }}>
      {header}
      {subTypeStrip}
      {standingRow}

      {mode === "week" ? (
        <>
          <div
            className="grid"
            style={{
              gridTemplateColumns: laterItems.length
                ? "repeat(7,1fr) 1fr"
                : "repeat(7,1fr)",
              gap: 8,
            }}
          >
            {columns.map((c) => {
              const shown = c.items.slice(0, WEEK_TICKET_CAP);
              const more = c.items.length - shown.length;
              return (
                <div
                  key={c.key}
                  className="flex flex-col"
                  style={{ gap: 7 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDayKey(c.key);
                      setMode("day");
                    }}
                    className="flex flex-col text-left"
                    style={{
                      gap: 1,
                      padding: "0 2px 5px",
                      borderBottom: "1px solid #1D2026",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#F2F3F5",
                        fontWeight: 700,
                      }}
                    >
                      {c.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#6B7280",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.countLine}
                    </span>
                  </button>
                  {shown.map((it) => (
                    <WeekTicket
                      key={it.id}
                      ticket={ticketOf(it)}
                      onClick={() => {
                        // No trading from week mode — tickets open the day.
                        setDayKey(c.key);
                        setMode("day");
                      }}
                    />
                  ))}
                  {more > 0 && (
                    <span style={{ fontSize: 10, color: "#6B7280", padding: "0 2px" }}>
                      +{more} more
                    </span>
                  )}
                </div>
              );
            })}
            {laterItems.length > 0 && (
              <div className="flex flex-col" style={{ gap: 7 }}>
                <div
                  className="flex flex-col text-left"
                  style={{ gap: 1, padding: "0 2px 5px", borderBottom: "1px solid #1D2026" }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#F2F3F5",
                      fontWeight: 700,
                    }}
                  >
                    Later
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#6B7280",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {laterTotal} {laterTotal === 1 ? "market" : "markets"}
                  </span>
                </div>
                {laterItems.slice(0, LATER_TICKET_CAP).map((it) => (
                  <WeekTicket
                    key={it.id}
                    ticket={ticketOf(it, { asDate: true })}
                    // Beyond the week there is no day frame — go straight to the market.
                    onClick={() => openItem(it)}
                  />
                ))}
                {laterItems.length > LATER_TICKET_CAP && (
                  <span style={{ fontSize: 10, color: "#6B7280", padding: "0 2px" }}>
                    +{laterItems.length - LATER_TICKET_CAP} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-between"
            style={{ borderTop: "1px solid #1D2026", paddingTop: 14 }}
          >
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {weekTotal} markets decide in the next 7 days. Pick a day to trade it —
              prices live in Day mode.
              {laterTotal > 0 && ` ${laterTotal} more decide later.`}
            </span>
            <span style={{ fontSize: 12, color: "#9AA1AC", fontWeight: 600 }}>
              Rolling Intraday rounds are not counted.
            </span>
          </div>
        </>
      ) : dayItems.length === 0 ? (
        <div
          className="flex flex-col items-center"
          style={{
            border: "1px dashed #23262D",
            borderRadius: 14,
            padding: "56px 24px",
            gap: 10,
          }}
        >
          <span
            className="font-display"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Nothing scheduled this day
          </span>
          <span style={{ fontSize: 13, color: "#9AA1AC" }}>
            {nextItem
              ? `${weekTotal} markets decide this week — the next one is ${stepperLabel(
                  startOfDay(nextItem.at),
                  todayKey,
                ).replace("Today · ", "")} at ${localTime(nextItem.at)} ${tz}.`
              : `${weekTotal} markets decide this week.`}
          </span>
          <button
            type="button"
            onClick={onBackToList}
            style={{ fontSize: 13, color: "#33D6FF", fontWeight: 700 }}
          >
            Back to all markets →
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {dayItems.map((it, i) => (
            <SpineRow
              key={it.id}
              time={localTime(it.at)}
              tz={tz}
              last={i === dayItems.length - 1}
            >
              {it.kind === "sports" ? (
                <SportsBlock item={it} onOpen={goEvent} />
              ) : it.kind === "session" ? (
                <SessionBlock
                  item={it}
                  now={now}
                  onOpenStock={goSpot}
                  onOpenIntraday={onOpenIntraday}
                />
              ) : (
                <GenericBlock item={it} now={now} onOpen={goEvent} />
              )}
            </SpineRow>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiteCalendarView;
