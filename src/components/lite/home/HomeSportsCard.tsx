// ============================================================
// HOME · SPORTS MATCH WINNERS (HP-1)
// Day strip → live cards (green only) → upcoming rows → week footer.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SportsMatch,
  buildDayStrip,
  kickoffLabel,
  matchesInBucket,
} from "@/components/lite/sports/sportsData";
import { HomeCard, HomeEyebrow, HomeQuestion, LIVE_GREEN, MUTED } from "./homeShell";

const CYAN = "#33D6FF";
const LIVE_MAX = 3;

const hashHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

const Monogram = ({ abbr, overlap }: { abbr: string; overlap?: boolean }) => (
  <span
    className="font-display inline-flex items-center justify-center"
    style={{
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: `hsl(${hashHue(abbr)} 45% 32%)`,
      color: "#fff",
      fontSize: 9.5,
      fontWeight: 700,
      border: "2px solid #13161C",
      marginLeft: overlap ? -9 : 0,
      flex: "none",
    }}
  >
    {abbr.slice(0, 3).toUpperCase()}
  </span>
);

const OddsButton = ({
  label,
  price,
  onClick,
  stacked,
}: {
  label: string;
  price: number;
  onClick: (e: React.MouseEvent) => void;
  /** HP-3 mobile: team name over price so 375px never truncates. */
  stacked?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      stacked
        ? "flex min-w-0 flex-1 flex-col items-center justify-center"
        : "flex min-w-0 flex-1 items-center justify-between"
    }
    style={{
      border: "1px solid rgba(148,163,184,0.2)",
      background: "#191D24",
      color: "#DBE2EA",
      borderRadius: 12,
      padding: stacked ? "7px 6px" : "10px 12px",
      fontSize: stacked ? 12.5 : 13.5,
      fontWeight: 700,
      gap: stacked ? 2 : 8,
    }}
  >
    <span className="w-full truncate text-center">{label}</span>
    <span
      className="font-mono flex-none"
      style={{ color: CYAN, fontVariantNumeric: "tabular-nums", fontSize: stacked ? 13 : undefined }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);


const abbrFor = (m: SportsMatch, label: string) => {
  const n = label.trim().toLowerCase();
  if (n === "draw") return "Draw";
  if (m.home && n === m.home.toLowerCase()) return m.homeAbbr || m.home;
  if (m.away && n === m.away.toLowerCase()) return m.awayAbbr || m.away;
  return label;
};

const MatchTitle = ({ m, live }: { m: SportsMatch; live: boolean }) => (
  <div
    className="truncate"
    style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}
  >
    {live && m.score ? (
      <>
        {m.home} <span className="font-display">{m.score}</span> {m.away}
      </>
    ) : (
      `${m.home || m.name} vs ${m.away}`
    )}
  </div>
);

const LiveCard = ({
  m,
  onOpen,
  isMobile,
}: {
  m: SportsMatch;
  onOpen: (id: string, o?: string) => void;
  isMobile?: boolean;
}) => (
  <div
    style={{
      marginTop: 12,
      padding: "14px 14px 16px",
      border: `1px solid rgba(74,222,128,0.35)`,
      background: "rgba(74,222,128,0.05)",
      borderRadius: 14,
    }}
  >
    <div className="flex items-center" style={{ gap: 12 }}>
      <span className="flex flex-none">
        <Monogram abbr={m.homeAbbr || m.home} />
        <Monogram abbr={m.awayAbbr || m.away} overlap />
      </span>
      <div className="min-w-0">
        <MatchTitle m={m} live />
        <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
          <span
            className="font-display"
            style={{
              color: MUTED,
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {m.league}
          </span>
          <span
            className="font-display"
            style={{
              color: LIVE_GREEN,
              fontSize: 10,
              fontWeight: 700,
              border: "1px solid rgba(74,222,128,0.45)",
              borderRadius: 999,
              padding: "1px 8px",
              background: "rgba(74,222,128,0.1)",
            }}
          >
            ● LIVE{m.minute != null ? ` ${m.minute}'` : ""}
          </span>
        </div>
      </div>
    </div>
    <div className="flex" style={{ gap: 8, marginTop: 12 }}>
      {m.options.map((o) => (
        <OddsButton
          key={o.id}
          label={abbrFor(m, o.label)}
          price={o.price}
          stacked={isMobile}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(m.id, o.id);
          }}
        />
      ))}
    </div>
  </div>
);

/** HP-3 · mobile upcoming card row: kickoff column, then teams + stacked odds. */
const MobileUpcomingCard = ({
  m,
  live,
  onOpen,
}: {
  m: SportsMatch;
  live?: boolean;
  onOpen: (id: string, o?: string) => void;
}) => {
  const k = kickoffLabel(m.kickoff);
  return (
    <div
      style={{
        marginTop: 10,
        padding: 12,
        borderRadius: 14,
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.10)",
      }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="flex flex-none flex-col items-center" style={{ width: 52 }}>
          <span
            className="font-display"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {k.time || "TBD"}
          </span>
          <span
            className="font-display"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: MUTED,
              marginTop: 2,
            }}
          >
            {k.day}
          </span>
        </span>
        <span className="flex flex-none">
          <Monogram abbr={m.homeAbbr || m.home} />
          <Monogram abbr={m.awayAbbr || m.away} overlap />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate"
            style={{ fontWeight: 700, fontSize: 14.5, color: "#fff" }}
          >
            {`${m.home || m.name} vs ${m.away}`}
          </div>
          <div
            className="font-display flex items-center truncate"
            style={{
              color: MUTED,
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginTop: 3,
              gap: 6,
            }}
          >
            {live && <span style={{ color: LIVE_GREEN }}>●</span>}
            {m.league}
          </div>
        </div>
      </div>
      <div className="flex" style={{ gap: 8, marginTop: 10 }}>
        {m.options.map((o) => (
          <OddsButton
            key={o.id}
            label={o.label}
            price={o.price}
            stacked
            onClick={(e) => {
              e.stopPropagation();
              onOpen(m.id, o.id);
            }}
          />
        ))}
      </div>
    </div>
  );
};

const UpcomingRow = ({
  m,
  live,
  onOpen,
  isMobile,
}: {
  m: SportsMatch;
  live?: boolean;
  onOpen: (id: string, o?: string) => void;
  isMobile?: boolean;
}) => {
  const k = kickoffLabel(m.kickoff);
  if (isMobile) return <MobileUpcomingCard m={m} live={live} onOpen={onOpen} />;
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="flex flex-none">
          <Monogram abbr={m.homeAbbr || m.home} />
          <Monogram abbr={m.awayAbbr || m.away} overlap />
        </span>
        <div className="min-w-0">
          <MatchTitle m={m} live={false} />
          <div
            className="font-display flex items-center"
            style={{
              color: MUTED,
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginTop: 3,
              gap: 6,
            }}
          >
            {live && <span style={{ color: LIVE_GREEN }}>●</span>}
            {m.league} · {k.day} {k.time}
          </div>
        </div>
      </div>
      <div className="flex" style={{ gap: 8, marginTop: 12 }}>
        {m.options.map((o) => (
          <OddsButton
            key={o.id}
            label={o.label}
            price={o.price}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(m.id, o.id);
            }}
          />
        ))}
      </div>
    </div>
  );
};


export const HomeSportsCard = ({
  matches,
  isMobile,
  extraRows = 0,
  onOpenAll,
}: {
  matches: SportsMatch[];
  isMobile: boolean;
  /** Editor's Desk is absent → the card grows to keep the columns flush. */
  extraRows?: number;
  onOpenAll: () => void;
}) => {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState("all");
  const strip = useMemo(() => buildDayStrip(matches), [matches]);

  const live = useMemo(
    () =>
      matches
        .filter((m) => m.live)
        .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0)),
    [matches],
  );
  const upcoming = useMemo(() => {
    const future = matches.filter((m) => !m.live && m.kickoff && m.kickoff > new Date());
    const set = matchesInBucket(future, bucket);
    return set.sort(
      (a, b) => (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0),
    );
  }, [matches, bucket]);

  const weekTotal = strip.find((d) => d.id === "all")?.count ?? upcoming.length;
  if (weekTotal === 0 && live.length === 0) return null;

  const pinned = live.slice(0, LIVE_MAX);
  const budget = Math.max(2, 5 - pinned.length) + extraRows;
  const liveRows = live.slice(LIVE_MAX, LIVE_MAX + budget);
  const rows = upcoming.slice(0, Math.max(0, budget - liveRows.length));
  const shown = pinned.length + liveRows.length + rows.length;
  const more = Math.max(0, weekTotal + live.length - shown);

  const open = (id: string, option?: string) =>
    navigate(`/trade?event=${encodeURIComponent(id)}${option ? `&option=${option}` : ""}`);

  return (
    <HomeCard style={{ padding: isMobile ? "18px 16px" : "26px 28px" }}>
      <HomeEyebrow color="#F87171">● Sports · Match winners</HomeEyebrow>
      <div style={{ marginTop: 12 }}>
        <HomeQuestion size={isMobile ? 20 : 26}>Who wins the match?</HomeQuestion>
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: MUTED }}>
        Winning shares pay $1. Trade before kickoff or live.
      </div>

      <div
        className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: 6, marginTop: isMobile ? 14 : 18 }}
      >
        {strip.map((d) => {
          const active = d.id === bucket;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setBucket(d.id)}
              className="flex-none text-center"
              style={{
                background: active ? "#FFFFFF" : "transparent",
                border: active ? "1px solid #FFFFFF" : "1px solid rgba(148,163,184,0.16)",
                color: active ? "#0B0D11" : "#DBE2EA",
                borderRadius: 10,
                padding: isMobile ? "6px 12px" : "7px 14px",
              }}
            >

              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {d.label === "ALL" ? "All" : d.label}
              </span>
              <span
                className="font-display"
                style={{
                  display: "block",
                  fontSize: 11,
                  marginTop: 2,
                  color: active ? "rgba(11,13,17,0.55)" : MUTED,
                }}
              >
                {d.count}
              </span>
            </button>
          );
        })}
      </div>

      {pinned.map((m) => (
        <LiveCard key={m.id} m={m} onOpen={open} isMobile={isMobile} />
      ))}
      {liveRows.map((m) => (
        <UpcomingRow key={m.id} m={m} live onOpen={open} isMobile={isMobile} />
      ))}
      {rows.map((m) => (
        <UpcomingRow key={m.id} m={m} onOpen={open} isMobile={isMobile} />
      ))}

      <div className="flex items-center" style={{ marginTop: 16 }}>
        <span className="font-display" style={{ fontSize: 13, color: MUTED }}>
          {more} more this week
        </span>
        <button
          type="button"
          onClick={onOpenAll}
          className="font-display ml-auto"
          style={{ fontSize: 14, color: CYAN }}
        >
          All {weekTotal + live.length} matches →
        </button>
      </div>
    </HomeCard>
  );
};

export default HomeSportsCard;
