// ============================================================
// SPORTS CATEGORY VIEW (7B) — desktop, category chip "Sports".
// Pixel contract: docs/design-contracts/category-views-7.html #7b
// Live matches pinned, ALL day strip, day-grouped ledger.
// Every row/chip routes into the existing /trade contract page.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DayBucket,
  SportsMatch,
  buildDayGroups,
  buildDayStrip,
  compactVolume,
  isUpcoming,
  kickoffCell,
  matchesInBucket,
} from "@/components/lite/sports/sportsData";
import {
  ALL_OPTION,
  filterMatches,
  leagueOptions,
  otherGroupsSummary,
  sportLabel,
  sportOptions,
} from "@/components/lite/sports/sportsFilters";
import { DimensionPill, DimensionRow } from "./verticalChrome";
import { EmptyState } from "@/components/states";

const CHALK = "#F2F3F5";

const toneOf = (label: string, i: number, total: number) => {
  if (/^draw$/i.test(label)) return "#E6E9EE";
  if (i === 0) return "#33D6FF";
  if (i === total - 1) return "#CFFF4A";
  return "#E6E9EE";
};

const Crest = ({
  abbr,
  size = 34,
  overlap = false,
}: {
  abbr: string;
  size?: number;
  overlap?: boolean;
}) => (
  <span
    className="font-display"
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: CHALK,
      border: "1px solid rgba(255,255,255,.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: size >= 38 ? 10 : 9,
      color: "#0A0B0D",
      flex: "none",
      marginLeft: overlap ? -10 : 0,
    }}
  >
    {abbr}
  </span>
);

/** Tier-2 outcome chip — the only pattern allowed for match outcomes. */
const OutcomeChip = ({
  label,
  price,
  color,
  minHeight,
  priceSize,
  grow,
  onClick,
}: {
  label: string;
  price: number;
  color: string;
  minHeight: number;
  priceSize: number;
  grow?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="chip-t2 box-border flex items-center justify-between"
    style={
      {
        color,
        flex: grow ? 1 : undefined,
        minHeight,
        padding: grow ? "0 13px" : "0 14px",
        gap: 8,
        ["--chip-accent" as string]: color,
      } as React.CSSProperties
    }
  >
    <span
      className="truncate"
      style={{ fontSize: 11, color: "#9AA1AC" }}
    >
      {label}
    </span>
    <span
      className="font-display"
      style={{ fontSize: priceSize, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

const LiveCard = ({
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
    className="box-border flex cursor-pointer items-center"
    style={{
      background: "#131519",
      border: "1px solid #23262D",
      borderRadius: 16,
      padding: "20px 22px",
      gap: 28,
    }}
  >
    <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 14 }}>
      <div className="flex items-center" style={{ gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#6B7280",
            fontWeight: 700,
          }}
        >
          {match.league}
          {match.phase ? ` · ${match.phase}` : ""}
        </span>
        <span className="flex items-center" style={{ gap: 5 }}>
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
      <div className="flex items-center" style={{ gap: 16 }}>
        <span className="flex min-w-0 flex-1 items-center" style={{ gap: 11 }}>
          <Crest abbr={match.homeAbbr} size={38} />
          <span
            className="truncate"
            style={{ fontSize: 17, color: "#fff", fontWeight: 600 }}
          >
            {match.home}
          </span>
        </span>
        <span
          className="font-display flex-none"
          style={{
            fontWeight: 700,
            fontSize: 32,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {match.score || "–"}
        </span>
        <span
          className="flex min-w-0 flex-1 items-center justify-end"
          style={{ gap: 11 }}
        >
          <span
            className="truncate"
            style={{ fontSize: 17, color: "#fff", fontWeight: 600 }}
          >
            {match.away}
          </span>
          <Crest abbr={match.awayAbbr} size={38} />
        </span>
      </div>
    </div>
    <div
      className="grid flex-none"
      style={{
        gridTemplateColumns: `repeat(${match.options.length}, minmax(0, 1fr))`,
        gap: 8,
        width: 420,
      }}
    >
      {match.options.map((o, i) => (
        <OutcomeChip
          key={o.id}
          label={o.label}
          price={o.price}
          color={toneOf(o.label, i, match.options.length)}
          minHeight={52}
          priceSize={17}
          onClick={onPick(o.id)}
        />
      ))}
    </div>
  </div>
);

const LedgerRow = ({
  match,
  onOpen,
  onPick,
}: {
  match: SportsMatch;
  onOpen: () => void;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => {
  const { time, zone } = kickoffCell(match.kickoff, match.league);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="box-border flex cursor-pointer items-center transition-colors hover:border-[#23262D]"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "12px 16px",
        gap: 18,
      }}
    >
      <span className="flex flex-none flex-col" style={{ gap: 1, width: 74 }}>
        <span
          className="font-display"
          style={{
            fontSize: 15,
            color: "#fff",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {time}
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
          {zone}
        </span>
      </span>
      <span className="flex flex-none items-center">
        <Crest abbr={match.homeAbbr} />
        <Crest abbr={match.awayAbbr} overlap />
      </span>
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
        <span
          className="truncate"
          style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}
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
      <span
        className="flex-none whitespace-nowrap"
        style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}
      >
        {compactVolume(match.volume)}
      </span>
      <span className="flex flex-none" style={{ gap: 8, width: 420 }}>
        {match.options.map((o, i) => (
          <OutcomeChip
            key={o.id}
            label={o.label}
            price={o.price}
            color={toneOf(o.label, i, match.options.length)}
            minHeight={48}
            priceSize={16}
            grow
            onClick={onPick(o.id)}
          />
        ))}
      </span>
    </div>
  );
};

export const LiteSportsView = ({
  matches,
  boostOnly,
  boostEnabled,
  now,
  defaultSport,
}: {
  matches: SportsMatch[];
  /** Boost filter composes IN PLACE — chrome stays, content narrows. */
  boostOnly?: boolean;
  /** Sports boost predicate (category boost config, ≥2x). */
  boostEnabled?: boolean;
  /** Frozen clock for the style guide; production reads the real clock. */
  now?: number;
  /** Style-guide only — preselect a sport so a preset renders its league row. */
  defaultSport?: string;
}) => {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState("all");
  const [sport, setSport] = useState<string>(defaultSport ?? ALL_OPTION);
  const [league, setLeague] = useState<string>(ALL_OPTION);
  const clock = now ?? Date.now();

  // ---- Dimension rows (taxonomy-driven, data-gated) ----
  const sports = useMemo(() => sportOptions(matches, now), [matches, now]);
  const leagues = useMemo(
    () => (sport === ALL_OPTION ? [] : leagueOptions(matches, sport, now)),
    [matches, sport, now],
  );
  // The league row exists only when the sport has MORE THAN ONE league live.
  const showLeagueRow = leagues.length > 1;
  const activeLeague = showLeagueRow ? league : ALL_OPTION;

  const scoped = useMemo(
    () => filterMatches(matches, sport, activeLeague),
    [matches, sport, activeLeague],
  );
  const boostEmpty = !!boostOnly && !boostEnabled;

  const live = useMemo(() => scoped.filter((m) => m.live), [scoped]);
  const days: DayBucket[] = useMemo(
    () => buildDayStrip(scoped, clock),
    [scoped, clock],
  );
  // Header count stays consistent with the strip + ledger: live now plus
  // everything still to kick off. Past/finished matches are never counted.
  const weekCount = useMemo(
    () => scoped.filter((m) => m.live || isUpcoming(m, clock)).length,
    [scoped, clock],
  );
  const groups = useMemo(
    () => buildDayGroups(matchesInBucket(scoped, bucket), clock),
    [scoped, bucket, clock],
  );
  const others = useMemo(
    () => otherGroupsSummary(matches, sport, now),
    [matches, sport, now],
  );
  const dayScope =
    bucket === "all"
      ? "all days mixed"
      : (days.find((d) => d.id === bucket)?.label ?? "all days mixed").toLowerCase();
  const sportWord = sport === ALL_OPTION ? "" : `${sportLabel(sport).toLowerCase()} `;

  const open = (id: string) => () =>
    navigate(`/trade?event=${encodeURIComponent(id)}`);
  const pick = (id: string) => (optionId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/trade?event=${encodeURIComponent(id)}&option=${encodeURIComponent(optionId)}`,
    );
  };

  return (
    <div className="flex flex-col" style={{ marginTop: 20, gap: 20 }}>
      {/* Header */}
      <div className="flex items-end justify-between" style={{ gap: 24 }}>
        <div className="flex flex-col" style={{ gap: 7 }}>
          <span
            className="flex items-center"
            style={{
              gap: 8,
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: CHALK,
              fontWeight: 700,
            }}
          >
            Sports · match winners
          </span>
          <span
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            Who wins the match?
          </span>
          <span style={{ fontSize: 13, color: "#9AA1AC" }}>
            Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>. Matches
            over the next 7 days — trade before kickoff or during the match.
          </span>
        </div>
        <span className="flex flex-none flex-col items-end" style={{ gap: 4 }}>
          <span
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 26,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {weekCount}
          </span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6B7280",
              fontWeight: 700,
            }}
          >
            matches this week
          </span>
        </span>
      </div>

      {/* Dimension filter rows — SPORT, then LEAGUE (13A). */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        <DimensionRow label="Sport" labelWidth={66}>
          <DimensionPill
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
          <DimensionRow label="League" labelWidth={66}>
            <DimensionPill
              label="All"
              active={activeLeague === ALL_OPTION}
              onSelect={() => setLeague(ALL_OPTION)}
            />
            {leagues.map((l) => (
              <DimensionPill
                key={l.code}
                label={l.label}
                active={activeLeague === l.code}
                onSelect={() => setLeague(l.code)}
              />
            ))}
            <span
              className="whitespace-nowrap"
              style={{ fontSize: 11, color: "#6B7280", marginLeft: 5 }}
            >
              Only leagues with markets this week
            </span>
          </DimensionRow>
        )}
      </div>

      {boostEmpty && (
        <EmptyState
          variant="page"
          title="Nothing boosted here yet — check back soon."
        />
      )}

      {!boostEmpty && (
        <>
      {/* Playing now */}
      {live.length > 0 && (
        <div className="flex flex-col" style={{ gap: 10 }}>
          <div className="flex items-center" style={{ gap: 9 }}>
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
              Playing now · {live.length}
            </span>
          </div>
          {live.map((m) => (
            <LiveCard key={m.id} match={m} onOpen={open(m.id)} onPick={pick(m.id)} />
          ))}
        </div>
      )}

      {/* Day strip */}
      <div
        className="flex flex-wrap"
        style={{ gap: 8, borderTop: "1px solid #1D2026", paddingTop: 18 }}
      >
        {days.map((d) => {
          const active = d.id === bucket;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setBucket(d.id)}
              className="flex flex-none flex-col items-center transition-colors"
              style={{
                background: active ? CHALK : "#0A0B0D",
                color: active ? "#0A0B0D" : "#9AA1AC",
                border: `1px solid ${active ? CHALK : "#23262D"}`,
                borderRadius: 12,
                padding: "9px 16px",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                {d.label}
              </span>
              <span
                style={{
                  fontSize: 12,
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

      {/* Day-grouped ledger */}
      <div className="flex flex-col" style={{ gap: 18 }}>
        {groups.map((g) => (
          <div key={g.key} className="flex flex-col" style={{ gap: 10 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <span
                className="whitespace-nowrap"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: CHALK,
                  fontWeight: 700,
                }}
              >
                {g.label}
              </span>
              <span style={{ height: 1, background: "#1D2026", flex: 1 }} />
              <span
                className="whitespace-nowrap"
                style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}
              >
                {g.note}
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {g.matches.map((m) => (
                <LedgerRow
                  key={m.id}
                  match={m}
                  onOpen={open(m.id)}
                  onPick={pick(m.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex flex-col"
        style={{ borderTop: "1px solid #1D2026", paddingTop: 14, gap: 7 }}
      >
        <div className="flex items-center justify-between" style={{ gap: 16 }}>
          <span style={{ fontSize: 12, color: "#9AA1AC" }}>
            {sport === ALL_OPTION ? "All sports" : sportLabel(sport)} · {dayScope} ·
            next kickoff first
          </span>
          <span
            className="flex-none whitespace-nowrap"
            style={{ fontSize: 12, color: CHALK, fontWeight: 700 }}
          >
            All {weekCount} {sportWord}matches →
          </span>
        </div>
        {others.count > 0 && (
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            {others.count} more {others.count === 1 ? "match" : "matches"} in{" "}
            {others.labels} — switch sport above.
          </span>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default LiteSportsView;
