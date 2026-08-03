// ============================================================
// SPORTS STAGE CARD — right column of the "All stage" (desktop).
// Also rendered full-width when the Sports category is selected.
// Pixel contract: docs/design-contracts/all-stage-6A/6B.html
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DayBucket,
  SportsMatch,
  buildDayStrip,
  kickoffLabel,
  matchesInBucket,
} from "./sportsData";

const MICRO_LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#F2F3F5",
  fontWeight: 700,
};

const outcomeTone = (label: string, i: number, total: number) => {
  if (/^draw$/i.test(label)) return "#E6E9EE";
  if (i === 0) return "#33D6FF";
  if (i === total - 1) return "#CFFF4A";
  return "#E6E9EE";
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
    className="flex items-center justify-between transition-colors"
    style={{
      color,
      background: "#0A0B0D",
      border: "1px solid #23262D",
      borderRadius: 9,
      padding: "9px 10px",
    }}
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

const TeamToken = ({
  abbr,
  muted = false,
  overlap = false,
}: {
  abbr: string;
  muted?: boolean;
  overlap?: boolean;
}) => (
  <span
    className="font-display"
    style={{
      width: 30,
      height: 30,
      borderRadius: 999,
      background: muted ? "#23262D" : "#F2F3F5",
      border: "1px solid rgba(255,255,255,.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 9,
      color: muted ? "#E6E9EE" : "#0A0B0D",
      flex: "none",
      marginLeft: overlap ? -9 : 0,
    }}
  >
    {abbr}
  </span>
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
        <span
          className="animate-pulse"
          style={{ width: 5, height: 5, borderRadius: 999, background: "#FF3B4E" }}
        />
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
              color: "#E6E9EE",
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
}: {
  matches: SportsMatch[];
  /** "stage" = right column of the All view. "full" = Sports category view. */
  variant?: "stage" | "full";
}) => {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState("all");

  const live = useMemo(() => matches.filter((m) => m.live), [matches]);
  const days: DayBucket[] = useMemo(() => buildDayStrip(matches), [matches]);
  const pool = useMemo(
    () => matchesInBucket(matches, bucket).filter((m) => !m.live),
    [matches, bucket],
  );

  const upcomingLimit =
    variant === "full" ? pool.length : live.length > 0 ? 1 : 3;
  const upcoming = pool.slice(0, upcomingLimit);

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
            Sports · next 7 days
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
            Live events
          </span>
          <span style={{ fontSize: 12, color: "#9AA1AC" }}>
            Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>. Trade
            before kickoff or during the match.
          </span>
        </div>
      </div>

      {live.length > 0 && (
        <div
          className="flex items-center gap-[9px]"
          style={{ padding: "0 18px 9px" }}
        >
          <span
            className="animate-pulse"
            style={{ width: 6, height: 6, borderRadius: 999, background: "#FF3B4E" }}
          />
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Live now · {live.length}
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

      {upcoming.map((m) => (
        <UpcomingRow key={m.id} match={m} onOpen={open(m.id)} onPick={pick(m.id)} />
      ))}

      {variant === "stage" && (
        <div
          className="flex flex-col gap-[7px]"
          style={{ padding: "12px 18px 14px", borderTop: "1px solid #1D2026" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: "#9AA1AC" }}>
              All days mixed · newest kickoff first
            </span>
            <span style={{ fontSize: 12, color: "#F2F3F5", fontWeight: 700 }}>
              All {matches.length} matches →
            </span>
          </div>
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