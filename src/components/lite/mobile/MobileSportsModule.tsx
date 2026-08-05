// ============================================================
// MOBILE SPORTS MODULE (390) — live match card pinned above two
// upcoming match cards. Contract: list-final-touches-11.html 11B / 11C.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SportsMatch,
  isUpcoming,
  kickoffLabel,
} from "@/components/lite/sports/sportsData";
import {
  ALL_OPTION,
  filterMatches,
  leagueOptions,
  sportOptions,
} from "@/components/lite/sports/sportsFilters";
import {
  DimensionPill,
  DimensionRow,
} from "@/components/lite/categoryviews/verticalChrome";
import { EmptyState } from "@/components/states";
import { CHALK_SOFT, Crest, DIR_DOWN, DIR_UP, LivePulse } from "@/components/lite/shared/primitives";

const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

const CHIP: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#9AA1AC",
  background: "#131519",
  border: "1px solid #23262D",
  borderRadius: 999,
  padding: "5px 10px",
};

const outcomeTone = (label: string, i: number, total: number) => {
  if (/^draw$/i.test(label)) return CHALK_SOFT;
  if (i === 0) return DIR_UP;
  if (i === total - 1) return DIR_DOWN;
  return CHALK_SOFT;
};

/** Stacked-label Tier-2 chip used by both mobile match cards. */
const StackedChip = ({
  label,
  price,
  tone,
  onClick,
}: {
  label: string;
  price: number;
  tone: string;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="chip-t2 flex min-w-0 flex-1 flex-col items-center justify-center"
    style={
      {
        color: tone,
        minHeight: 48,
        padding: "0 10px",
        gap: 1,
        ["--chip-accent" as string]: tone,
      } as React.CSSProperties
    }
  >
    <span className="truncate" style={{ fontSize: 10, color: "#9AA1AC", maxWidth: "100%" }}>
      {label}
    </span>
    <span
      className="font-display"
      style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

const LiveMatchCard = ({ match }: { match: SportsMatch }) => {
  const navigate = useNavigate();
  const open = () => navigate(`/trade?event=${encodeURIComponent(match.id)}`);
  const pick = (optionId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/trade?event=${encodeURIComponent(match.id)}&option=${encodeURIComponent(optionId)}`,
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open();
      }}
      className="flex cursor-pointer flex-col"
      style={{
        background: "#131519",
        border: "1px solid #23262D",
        borderRadius: 14,
        padding: "13px 14px",
        gap: 12,
      }}
    >
      <div className="flex items-center justify-between">
        <span style={MICRO}>
          {match.league}
          {match.phase ? ` · ${match.phase}` : ""}
        </span>
        <span className="flex items-center" style={{ gap: 5 }}>
          <LivePulse size={5} color="#FF3B4E" />
          <span
            style={{
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {match.minute != null ? `${match.minute}'` : "LIVE"}
          </span>
        </span>
      </div>

      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="flex min-w-0 flex-1 items-center" style={{ gap: 8 }}>
          <Crest abbr={match.homeAbbr} size={30} />
          <span className="truncate" style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
            {match.home}
          </span>
        </span>
        <span
          className="font-display shrink-0"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {match.score || "–"}
        </span>
        <span
          className="flex min-w-0 flex-1 items-center justify-end"
          style={{ gap: 8 }}
        >
          <span className="truncate" style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
            {match.away}
          </span>
          <Crest abbr={match.awayAbbr} size={30} />
        </span>
      </div>

      <div className="flex" style={{ gap: 7 }}>
        {match.options.map((o, i) => (
          <StackedChip
            key={o.id}
            label={o.label}
            price={o.price}
            tone={outcomeTone(o.label, i, match.options.length)}
            onClick={pick(o.id)}
          />
        ))}
      </div>
    </div>
  );
};

const UpcomingMatchCard = ({ match }: { match: SportsMatch }) => {
  const navigate = useNavigate();
  const open = () => navigate(`/trade?event=${encodeURIComponent(match.id)}`);
  const pick = (optionId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/trade?event=${encodeURIComponent(match.id)}&option=${encodeURIComponent(optionId)}`,
    );
  };
  const { day, time } = kickoffLabel(match.kickoff);
  const isToday = day === "Today";
  const hour = match.kickoff ? match.kickoff.getHours() : 12;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open();
      }}
      className="flex cursor-pointer flex-col"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "13px 14px",
        gap: 11,
      }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="flex flex-col" style={{ gap: 1, width: 56, flex: "none" }}>
          <span
            className="font-display"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {time}
          </span>
          <span style={MICRO}>{isToday && hour >= 17 ? "Tonight" : day}</span>
        </span>
        <span className="flex items-center" style={{ flex: "none" }}>
          <Crest abbr={match.homeAbbr} size={28} />
          <Crest abbr={match.awayAbbr} size={28} overlap />
        </span>
        <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
          <span
            className="truncate"
            style={{ fontSize: 13, color: "#fff", fontWeight: 600, lineHeight: 1.25 }}
          >
            {match.name}
          </span>
          <span style={MICRO}>{match.league}</span>
        </span>
      </div>
      <div className="flex" style={{ gap: 7 }}>
        {match.options.map((o, i) => (
          <StackedChip
            key={o.id}
            label={o.label}
            price={o.price}
            tone={outcomeTone(o.label, i, match.options.length)}
            onClick={pick(o.id)}
          />
        ))}
      </div>
    </div>
  );
};

export const MobileSportsModule = ({
  matches,
  onOpenAll,
  filters,
  boostOnly,
  boostEnabled,
}: {
  matches: SportsMatch[];
  onOpenAll: () => void;
  /** Sports category view only — the All stage keeps the plain module. */
  filters?: boolean;
  boostOnly?: boolean;
  boostEnabled?: boolean;
}) => {
  const [sport, setSport] = useState<string>(ALL_OPTION);
  const [league, setLeague] = useState<string>(ALL_OPTION);

  const sports = useMemo(() => sportOptions(matches), [matches]);
  const leagues = useMemo(
    () => (sport === ALL_OPTION ? [] : leagueOptions(matches, sport)),
    [matches, sport],
  );
  const showLeagueRow = !!filters && leagues.length > 1;
  const activeLeague = showLeagueRow ? league : ALL_OPTION;
  const scoped = useMemo(
    () => (filters ? filterMatches(matches, sport, activeLeague) : matches),
    [matches, filters, sport, activeLeague],
  );
  const boostEmpty = !!filters && !!boostOnly && !boostEnabled;

  const live = scoped.filter((m) => m.live);
  const upcoming = scoped
    .filter((m) => !m.live && isUpcoming(m))
    .sort(
      (a, b) => (a.kickoff?.getTime() ?? Infinity) - (b.kickoff?.getTime() ?? Infinity),
    );
  const weekCount = live.length + upcoming.length;
  if (!filters && weekCount === 0) return null;

  return (
    <section className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex flex-col" style={{ gap: 7 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#F2F3F5",
            fontWeight: 700,
          }}
        >
          Sports · match winners
        </span>
        <h2
          className="font-display"
          style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: "#fff" }}
        >
          Who wins the match?
        </h2>
        <p style={{ fontSize: 12, color: "#9AA1AC" }}>
          Winning shares pay <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>.
          Matches over the next 7 days — trade before kickoff or during the match.
        </p>
        {!boostEmpty && (
        <span className="flex items-center" style={{ gap: 8, paddingTop: 2 }}>
          {live.length > 0 ? (
            <span
              className="flex items-center"
              style={{ ...CHIP, gap: 6, color: "#fff", fontWeight: 700 }}
            >
              <LivePulse size={5} color="#FF3B4E" />
              {live.length} playing now
            </span>
          ) : (
            <span style={CHIP}>Nothing playing now</span>
          )}
          <span style={CHIP}>{weekCount} this week</span>
        </span>
        )}
      </div>

      {/* Dimension rows — 44px pills, horizontal scroll with the fade mask. */}
      {filters && (
        <div className="flex flex-col" style={{ gap: 9 }}>
          <DimensionRow label="Sport" labelWidth={44} scroll>
            <DimensionPill
              mobile
              label="All"
              active={sport === ALL_OPTION}
              onSelect={() => {
                setSport(ALL_OPTION);
                setLeague(ALL_OPTION);
              }}
            />
            {sports.map((g) => (
              <DimensionPill
                key={g.code}
                mobile
                label={g.label}
                active={sport === g.code}
                onSelect={() => {
                  setSport(g.code);
                  setLeague(ALL_OPTION);
                }}
              />
            ))}
          </DimensionRow>
          {showLeagueRow && (
            <DimensionRow label="League" labelWidth={44} scroll>
              <DimensionPill
                mobile
                label="All"
                active={activeLeague === ALL_OPTION}
                onSelect={() => setLeague(ALL_OPTION)}
              />
              {leagues.map((l) => (
                <DimensionPill
                  key={l.code}
                  mobile
                  label={l.label}
                  active={activeLeague === l.code}
                  onSelect={() => setLeague(l.code)}
                />
              ))}
            </DimensionRow>
          )}
        </div>
      )}

      {boostEmpty ? (
        <EmptyState
          variant="page"
          title="Nothing boosted here yet — check back soon."
        />
      ) : (
        <>
      {live.slice(0, 1).map((m) => (
        <LiveMatchCard key={m.id} match={m} />
      ))}

      {upcoming.slice(0, live.length > 0 ? 2 : 3).map((m) => (
        <UpcomingMatchCard key={m.id} match={m} />
      ))}

      <button
        type="button"
        onClick={onOpenAll}
        className="self-start"
        style={{ fontSize: 12, color: "#F2F3F5", fontWeight: 700 }}
      >
        All {weekCount} matches →
      </button>
        </>
      )}
    </section>
  );
};

export default MobileSportsModule;