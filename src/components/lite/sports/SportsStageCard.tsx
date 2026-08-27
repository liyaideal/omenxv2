// ============================================================
// SPORTS STAGE CARD — right column of the "All stage" (desktop).
// Also rendered full-width when the Sports category is selected.
// Pixel contract: docs/design-contracts/all-stage-6A/6B.html
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DayBucket,
  SportsMatch,
  buildDayStrip,
  kickoffLabel,
  matchesInBucket,
} from "./sportsData";
import { CHALK_SOFT, Crest, DIR_DOWN, DIR_UP, LivePulse } from "@/components/lite/shared/primitives";

const MICRO_LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#F2F3F5",
  fontWeight: 700,
};

const outcomeTone = (label: string, i: number, total: number) => {
  if (/^draw$/i.test(label)) return CHALK_SOFT;
  if (i === 0) return DIR_UP;
  if (i === total - 1) return DIR_DOWN;
  return CHALK_SOFT;
};

const OutcomeButton = ({
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
    className="chip-t2 flex items-center justify-between"
    style={{
      color,
      padding: "9px 10px",
      ["--chip-accent" as string]: color,
    } as React.CSSProperties}
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

/** Stage-card crest: 30px, 9px monogram, -9px overlap, muted away side. */
const TeamToken = ({
  abbr,
  muted = false,
  overlap = false,
}: {
  abbr: string;
  muted?: boolean;
  overlap?: boolean;
}) => (
  <Crest abbr={abbr} size={30} fontSize={9} muted={muted} overlap={overlap} overlapPx={-9} />
);

const OutcomeGrid = ({
  match,
  onPick,
}: {
  match: SportsMatch;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => (
  <div
    className="grid gap-[6px]"
    style={{
      gridTemplateColumns: `repeat(${match.options.length}, minmax(0, 1fr))`,
    }}
  >
    {match.options.map((o, i) => (
      <OutcomeButton
        key={o.id}
        label={o.label}
        price={o.price}
        color={outcomeTone(o.label, i, match.options.length)}
        onClick={onPick(o.id)}
      />
    ))}
  </div>
);

const LiveBlock = ({
  match,
  onOpen,
  onPick,
}: {
  match: SportsMatch;
  onOpen: () => void;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (e.key === "Enter") onOpen();
    }}
    className="flex cursor-pointer flex-col gap-[13px]"
    style={{
      padding: "22px 18px 24px",
      borderTop: "1px solid #16181D",
      background: "#101216",
    }}
  >
    <div className="flex items-center justify-between gap-2">
      <span
        className="truncate"
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#6B7280",
          fontWeight: 700,
        }}
      >
        {match.league}
        {match.phase ? ` · ${match.phase}` : ""}
      </span>
      <span className="flex flex-none items-center gap-[5px]">
        <LivePulse size={5} color="#FF3B4E" />
        <span
          style={{
            fontSize: 12,
            color: "#fff",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {match.minute}'
        </span>
      </span>
    </div>
    <div className="flex items-center gap-[10px]">
      <span className="flex min-w-0 flex-1 items-center gap-[8px]">
        <TeamToken abbr={match.homeAbbr} />
        <span
          className="truncate"
          style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}
        >
          {match.home}
        </span>
      </span>
      <span
        className="font-display flex-none"
        style={{
          fontWeight: 700,
          fontSize: 24,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        }}
      >
        {match.score || "–"}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-[8px]">
        <span
          className="truncate"
          style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}
        >
          {match.away}
        </span>
        <TeamToken abbr={match.awayAbbr} />
      </span>
    </div>
    <OutcomeGrid match={match} onPick={onPick} />
  </div>
);

const UpcomingRow = ({
  match,
  onOpen,
  onPick,
}: {
  match: SportsMatch;
  onOpen: () => void;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => {
  const { day, time } = kickoffLabel(match.kickoff);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="flex cursor-pointer flex-col gap-[9px]"
      style={{ padding: "13px 18px 14px", borderTop: "1px solid #16181D" }}
    >
      <div className="flex items-center gap-[10px]">
        <span
          className="flex flex-none items-center gap-[5px]"
          style={{ width: 78 }}
        >
          <span
            style={{
              fontSize: 11,
              color: CHALK_SOFT,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {day}
            <br />
            {time}
          </span>
        </span>
        <span className="flex items-center">
          <TeamToken abbr={match.homeAbbr} muted={match.format === "h2h"} />
          <TeamToken abbr={match.awayAbbr} muted={match.format === "h2h"} overlap />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
          <span
            className="truncate"
            style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}
          >
            {match.home} v {match.away}
          </span>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6B7280",
              fontWeight: 700,
            }}
          >
            {match.league}
          </span>
        </span>
      </div>
      <OutcomeGrid match={match} onPick={onPick} />
    </div>
  );
};

export const SportsStageCard = ({
  matches,
  variant = "stage",
  onOpenAll,
  initialBucket,
}: {
  matches: SportsMatch[];
  /** "stage" = right column of the All view. "full" = Sports category view. */
  variant?: "stage" | "full";
  onOpenAll?: () => void;
  /**
   * Style-guide only — opening day-rail bucket id. Production never passes
   * it, so the rail keeps opening on "all" exactly as before.
   */
  initialBucket?: string;
}) => {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState(initialBucket ?? "all");

  const allLive = useMemo(() => matches.filter((m) => m.live), [matches]);
  const days: DayBucket[] = useMemo(() => buildDayStrip(matches), [matches]);
  const pool = useMemo(
    () => matchesInBucket(matches, bucket).filter((m) => !m.live),
    [matches, bucket],
  );

  // Stage variant keeps a fixed row budget so the card can't outgrow the
  // Intraday card beside it. Overflow lives on the Sports category page.
  const ROW_BUDGET = 4;
  const LIVE_BUDGET = 3;
  const live =
    variant === "full" ? allLive : allLive.slice(0, LIVE_BUDGET);
  const upcomingLimit =
    variant === "full" ? pool.length : Math.max(0, ROW_BUDGET - live.length);
  const upcoming = pool.slice(0, upcomingLimit);

  // Stage keeps the same number of row slots on every day bucket so the card
  // height never jumps when the user taps a different date.
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [rowH, setRowH] = useState(96);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setRowH(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [upcoming.length]);
  const fillerCount =
    variant === "full" ? 0 : Math.max(0, upcomingLimit - upcoming.length);

  const open = (id: string) => () => navigate(`/trade?event=${encodeURIComponent(id)}`);
  const pick = (id: string) => (optionId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/trade?event=${encodeURIComponent(id)}&option=${encodeURIComponent(optionId)}`,
    );
  };

  const next = pool[0];
  const tomorrowCount = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const end = start + 86_400_000;
    return matches.filter(
      (m) =>
        m.kickoff && m.kickoff.getTime() >= start && m.kickoff.getTime() < end,
    ).length;
  }, [matches]);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "#111318",
        border: "1px solid #1D2026",
        borderRadius: 18,
        paddingBottom: live.length > 0 ? 14 : 0,
        justifyContent: live.length > 0 ? undefined : "space-between",
      }}
    >
      <div
        className="flex items-start justify-between gap-[14px]"
        style={{ padding: live.length > 0 ? "18px 18px 12px" : "20px 18px 14px" }}
      >
        <div className="flex flex-col gap-[6px]">
          <span className="flex items-center gap-[8px]" style={MICRO_LABEL}>
            Sports · match winners
          </span>
          <span
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Who wins the match?
          </span>
          <span style={{ fontSize: 12, color: "#9AA1AC" }}>
            Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>. Matches
            over the next 7 days — trade before kickoff or during the match.
          </span>
        </div>
      </div>

      {live.length > 0 && (
        <div
          className="flex items-center gap-[9px]"
          style={{ padding: "0 18px 9px" }}
        >
          <LivePulse size={6} color="#FF3B4E" />
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Live now · {allLive.length}
          </span>
        </div>
      )}

      {live.map((m) => (
        <LiveBlock key={m.id} match={m} onOpen={open(m.id)} onPick={pick(m.id)} />
      ))}

      <div
        className="flex gap-[6px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ padding: "17px 18px 15px", borderTop: "1px solid #1D2026" }}
      >
        {days.map((d) => {
          const active = d.id === bucket;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setBucket(d.id)}
              className="flex flex-none flex-col items-center gap-[1px]"
              style={{
                background: active ? "#F2F3F5" : "#0A0B0D",
                color: active ? "#0A0B0D" : "#9AA1AC",
                border: active ? "1px solid #F2F3F5" : "1px solid #23262D",
                borderRadius: 10,
                padding: "7px 12px",
              }}
            >
              <span
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {d.count}
              </span>
            </button>
          );
        })}
      </div>

      {upcoming.map((m, i) => (
        <div key={m.id} ref={i === 0 ? rowRef : undefined}>
          <UpcomingRow match={m} onOpen={open(m.id)} onPick={pick(m.id)} />
        </div>
      ))}

      {Array.from({ length: fillerCount }).map((_, i) => (
        <div
          key={`filler-${i}`}
          className="flex items-center justify-center"
          style={{ height: rowH, borderTop: "1px solid #16181D" }}
        >
          {i === 0 && upcoming.length === 0 && (
            <span style={{ fontSize: 11.5, color: "#6B7280" }}>
              No matches on this day
            </span>
          )}
        </div>
      ))}

      {variant === "stage" && (
        <div
          className="flex flex-col gap-[7px]"
          style={{ padding: "12px 18px 14px", borderTop: "1px solid #1D2026" }}
        >
          <button
            type="button"
            onClick={onOpenAll}
            className="flex items-center justify-between"
          >
            <span style={{ fontSize: 12, color: "#9AA1AC" }}>
              All days mixed · newest kickoff first
            </span>
            <span style={{ fontSize: 12, color: "#F2F3F5", fontWeight: 700 }}>
              All {matches.length} matches →
            </span>
          </button>
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            {next
              ? `Next kickoff ${kickoffLabel(next.kickoff).time} · ${tomorrowCount} more matches tomorrow`
              : "No further kickoffs scheduled"}
          </span>
        </div>
      )}
    </div>
  );
};

export default SportsStageCard;