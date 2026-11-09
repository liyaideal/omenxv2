// ============================================================
// MOBILE SPORTS MODULE (390) — live match card pinned above two
// upcoming match cards. Contract: list-final-touches-11.html 11B / 11C.
// ============================================================
import { t } from "@/i18n";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SportsMatch,
  isUpcoming,
  kickoffLabel,
  liveAt,
} from "@/components/lite/sports/sportsData";
import { useStreamLineup } from "@/components/lite/sports/streamLineup";
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
import { MatchScoreText, isTennisTiebreakLive, phaseLabel } from "@/components/lite/sports/tennisScore";
import { MobileStreamButton, PlayTriangle } from "@/components/lite/sports/streamChips";
import { StreamPreview } from "@/components/lite/sports/StreamPreview";
import { usePlayStream } from "@/hooks/usePlayStream";
import {
  RemindButton,
  StreamPoster,
  kickoffShort,
  upcomingStreams,
  useNowTick,
} from "@/components/lite/sports/UpcomingStreams";
import { useStreamReminders } from "@/hooks/useStreamReminders";

const SK = "events.screen.simple.sports_view.sports_streams";

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

const liveClock = (m: SportsMatch) =>
  m.liveLabel ?? (m.minute != null ? `${m.minute}'` : "LIVE");

/** Mobile live-stream stage — video on top, switcher, scoreboard, chips. */
const MobileLiveStreamStage = ({
  streams,
  streamFixture,
  onFail,
}: {
  streams: SportsMatch[];
  streamFixture?: "cover" | "none";
  /** The player can't play this match's stream — take it off the stage. */
  onFail: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(streams[0].id);
  const m = streams.find((x) => x.id === activeId) ?? streams[0];
  const open = () => navigate(`/trade?event=${encodeURIComponent(m.id)}`);
  const playStream = usePlayStream();
  const pick = (optionId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/trade?event=${encodeURIComponent(m.id)}&option=${encodeURIComponent(optionId)}`);
  };
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "#131519",
        border: "1px solid rgba(255,138,61,.28)",
        borderRadius: 16,
        boxShadow: "0 14px 36px -22px rgba(255,138,61,.4)",
      }}
    >
      {/* CPO 2026-11-09「点了才播」: a still + play button, never the stream itself. */}
      <StreamPreview key={m.id} match={m} onPlay={() => playStream(m.id)} compact fixture={streamFixture} />
      {streams.length > 1 && (
        <div
          className="flex items-center"
          style={{ gap: 6, padding: "9px 12px", borderBottom: "1px solid #23262D", overflowX: "auto", scrollbarWidth: "none" }}
        >
          {streams.map((x) => {
            const on = x.id === m.id;
            return (
              <button
                key={x.id}
                type="button"
                data-stream-tab={x.id}
                onClick={() => setActiveId(x.id)}
                className="flex flex-none items-center"
                style={{
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "rgba(255,138,61,.55)" : "#23262D"}`,
                  background: on ? "rgba(255,138,61,.09)" : "transparent",
                  color: on ? "#FF8A3D" : "#9AA1AC",
                }}
              >
                <PlayTriangle />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? "#fff" : "#C9CED6", whiteSpace: "nowrap" }}>
                  {x.homeAbbr}{" "}
                  <span className="font-display" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <MatchScoreText sport={x.sport} score={x.score} base={11.5} />
                  </span>{" "}
                  {x.awayAbbr}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col" style={{ padding: "13px 14px 14px", gap: 12 }}>
        <div className="flex items-center justify-between" style={{ gap: 8 }}>
          <span className="truncate" style={MICRO}>
            {m.league}
            {phaseLabel(m.phase) ? ` · ${phaseLabel(m.phase)}` : ""}
          </span>
          <span className="flex flex-none items-center" style={{ gap: 5 }}>
            <LivePulse size={5} color="#FF3B4E" />
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {liveClock(m)}
            </span>
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 10 }}>
          <span className="flex min-w-0 flex-1 items-center" style={{ gap: 8 }}>
            <Crest abbr={m.homeAbbr} logoUrl={m.homeLogo} tileColor={m.homeTile} size={34} />
            {/* Team names are identity — wrap to two lines on narrow screens, never ellipsis. */}
            <span className="line-clamp-2 min-w-0" style={{ fontSize: 14, lineHeight: 1.2, color: "#fff", fontWeight: 600 }}>
              {m.homeShort || m.home}
            </span>
          </span>
          <span
            className="font-display shrink-0"
            style={{ fontSize: m.sport === "tennis" ? 18 : 26, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
          >
            <MatchScoreText sport={m.sport} score={m.score} base={26} tennisBase={18} />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-end" style={{ gap: 8 }}>
            <span className="line-clamp-2 min-w-0 text-right" style={{ fontSize: 14, lineHeight: 1.2, color: "#fff", fontWeight: 600 }}>
              {m.awayShort || m.away}
            </span>
            <Crest abbr={m.awayAbbr} logoUrl={m.awayLogo} tileColor={m.awayTile} size={34} />
          </span>
        </div>
        <div className="flex" style={{ gap: 7 }}>
          {m.options.map((o, i) => (
            <StackedChip
              key={o.id}
              label={o.label}
              price={o.price}
              tone={outcomeTone(o.label, i, m.options.length)}
              onClick={pick(o.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Short option label for narrow preview chips, by position: first option =
 * home crest abbr, last = away abbr, anything between (`Draw`) as is. Option
 * labels don't always equal the team name (`Man City` vs `Manchester City`).
 */
const chipLabel = (m: SportsMatch, label: string, i: number) =>
  i === 0 ? m.homeAbbr : i === m.options.length - 1 ? m.awayAbbr : label;

const MobileSectionHead = ({ label, aside, live }: { label: string; aside?: string; live?: boolean }) => (
  <div className="flex items-center" style={{ gap: 8 }}>
    {live ? (
      <LivePulse size={6} color="#FF3B4E" />
    ) : (
      <span style={{ color: "#FF8A3D", display: "flex" }}>
        <PlayTriangle />
      </span>
    )}
    <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff", fontWeight: 700 }}>
      {label}
    </span>
    {aside ? <span style={{ fontSize: 11, color: "#6B7280" }}>{aside}</span> : null}
  </div>
);

/** Mobile rail card — swipe row, ~78% width so the next card peeks. */
const MobilePreviewCard = ({
  m,
  now,
  reminded,
  onRemind,
}: {
  m: SportsMatch;
  now: number;
  reminded: boolean;
  onRemind: () => void;
}) => {
  const navigate = useNavigate();
  const open = () => navigate(`/trade?event=${encodeURIComponent(m.id)}`);
  const pick = (optionId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/trade?event=${encodeURIComponent(m.id)}&option=${encodeURIComponent(optionId)}`);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      className="flex cursor-pointer flex-col overflow-hidden"
      style={{ background: "#131519", border: "1px solid #23262D", borderRadius: 14, width: "100%" }}
    >
      <StreamPoster match={m} now={now} />
      <div className="flex flex-col" style={{ padding: "11px 12px 12px", gap: 10 }}>
        <div className="flex min-w-0 flex-col" style={{ gap: 3 }}>
          <span className="truncate" style={MICRO}>
            {m.league} · {kickoffShort(m.kickoff as Date, now)}
          </span>
          <span className="truncate" style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>
            {m.homeShort || m.home} vs {m.awayShort || m.away}
          </span>
        </div>
        <div className="flex" style={{ gap: 6 }}>
          {m.options.map((o, i) => (
            <StackedChip key={o.id} label={chipLabel(m, o.label, i)} price={o.price} tone={outcomeTone(o.label, i, m.options.length)} onClick={pick(o.id)} />
          ))}
        </div>
        <RemindButton on={reminded} onToggle={onRemind} height={34} />
      </div>
    </div>
  );
};

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
          {phaseLabel(match.phase) ? ` · ${phaseLabel(match.phase)}` : ""}
          {match.sport === "tennis" && isTennisTiebreakLive(match.score) ? (
            <span style={{ color: "#FF8A3D" }}> · Tiebreak</span>
          ) : null}
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
            {match.liveLabel ?? (match.minute != null ? `${match.minute}'` : "LIVE")}
          </span>
        </span>
      </div>

      {/* Names are identity: crest 26 / gaps 6–8 leave the name room next to a wide
          tennis set string; a multi-word name that still doesn't fit wraps to two
          lines (never ellipsis). Cards whose names fit keep their height. */}
      <div className="flex items-center" style={{ gap: 8, minHeight: 30 }}>
        <span className="flex min-w-0 flex-1 items-center" style={{ gap: 6 }}>
          <Crest abbr={match.homeAbbr} logoUrl={match.homeLogo} tileColor={match.homeTile} size={26} />
          <span className="line-clamp-2 min-w-0" style={{ fontSize: 13, lineHeight: 1.2, color: "#fff", fontWeight: 600 }} title={match.home}>
            {match.homeShort || match.home}
          </span>
        </span>
        <span
          className="font-display shrink-0"
          style={{
            // 网球三盘串：按列表卡同比例（32→26）降到 16px。
            fontSize: match.sport === "tennis" ? 16 : 20,
            fontWeight: 700,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <MatchScoreText sport={match.sport} score={match.score} base={20} tennisBase={16} />
        </span>
        <span
          className="flex min-w-0 flex-1 items-center justify-end"
          style={{ gap: 6 }}
        >
          <span className="line-clamp-2 min-w-0 text-right" style={{ fontSize: 13, lineHeight: 1.2, color: "#fff", fontWeight: 600 }} title={match.away}>
            {match.awayShort || match.away}
          </span>
          <Crest abbr={match.awayAbbr} logoUrl={match.awayLogo} tileColor={match.awayTile} size={26} />
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
          <Crest abbr={match.homeAbbr} logoUrl={match.homeLogo} tileColor={match.homeTile} size={28} />
          <Crest abbr={match.awayAbbr} logoUrl={match.awayLogo} tileColor={match.awayTile} size={28} overlap />
        </span>
        <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
          {/* Match name is identity — wraps to two lines on narrow screens, never ellipsis (CPO 2026-11-04). */}
          <span
            className="line-clamp-2"
            style={{ fontSize: 13, color: "#fff", fontWeight: 600, lineHeight: 1.25 }}
            title={match.name}
          >
            {match.homeShort && match.awayShort ? `${match.homeShort} vs ${match.awayShort}` : match.name}
          </span>
          <span style={MICRO}>{match.league}</span>
        </span>
        {match.streamUrl ? (
          <MobileStreamButton
            size={26}
            solid={false}
            placement="inline"
            label={t(`${SK}.stream_at_kickoff`)}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          />
        ) : null}
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
  now,
  remindedFixture,
  remindGuestFixture,
  streamFixture,
}: {
  matches: SportsMatch[];
  onOpenAll: () => void;
  /** Sports category view only — the All stage keeps the plain module. */
  filters?: boolean;
  boostOnly?: boolean;
  boostEnabled?: boolean;
  /** Style-guide only — frozen clock; production reads the real clock. */
  now?: number;
  /** Style-guide only — events already reminded; toggles stay local, no DB. */
  remindedFixture?: string[];
  /** Style-guide only — Remind me behaves as for a guest (opens sign-in). */
  remindGuestFixture?: boolean;
  /** Style-guide only — freeze the stage player (loading / autoplay blocked / stream failed). */
  streamFixture?: "cover" | "none";
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

  const nowTick = useNowTick(now);
  // Category view: live matches split into the stage (playable stream) and
  // Playing now (the rest). The home module has no stage — all live is one list.
  const { live, streamed, others: playingNow, markFailed } = useStreamLineup(scoped, nowTick);
  // Style-guide frames (frozen clock) keep their stage whatever the network does.
  const onStreamFail = now == null ? markFailed : () => undefined;
  const reminders = useStreamReminders(remindedFixture, remindGuestFixture);
  const previews = filters ? upcomingStreams(scoped, nowTick) : [];
  // Previews always live in the rail (CPO 2026-11-04: no preview stage).
  const rail = previews;
  const upcoming = scoped
    .filter((m) => !liveAt(m, nowTick) && isUpcoming(m, nowTick))
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
          {t("events.screen.simple.all_stage.sports_stage_card.sports_match_winners")}
        </span>
        <h2
          className="font-display"
          style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: "#fff" }}
        >
          {t("events.screen.simple.home.home_sports_card.who_wins_the_match")}
        </h2>
        <p style={{ fontSize: 12, color: "#9AA1AC" }}>
          Winning shares pay <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>.
          Matches over the next 7 days — trade before kickoff or during the match.
        </p>
        {!boostEmpty && (
        <span className="flex items-center" style={{ gap: 8, paddingTop: 2 }}>
          {live.length > 0 ? (
            // Category view: one chip per live section, same numbers as the
            // section heads (on stream = stage, playing now = Playing now cards).
            (filters
              ? [
                  streamed.length > 0 ? t(`${SK}.on_stream`, { count: streamed.length }) : null,
                  playingNow.length > 0
                    ? t("events.screen.simple.mobile_all_stage.mobile_sports_module.playing_now", { count: playingNow.length })
                    : null,
                ]
              : [t("events.screen.simple.mobile_all_stage.mobile_sports_module.playing_now", { count: live.length })]
            )
              .filter((label): label is string => !!label)
              .map((label) => (
                <span
                  key={label}
                  className="flex items-center"
                  style={{ ...CHIP, gap: 6, color: "#fff", fontWeight: 700 }}
                >
                  <LivePulse size={5} color="#FF3B4E" />
                  {label}
                </span>
              ))
          ) : (
            <span style={CHIP}>{t("events.screen.simple.sports_view.sports_vertical_chrome.nothing_playing")}</span>
          )}
          <span style={CHIP}>{t("events.screen.simple.mobile_all_stage.mobile_sports_module.this_week", { count: weekCount })}</span>
        </span>
        )}
      </div>

      {/* Dimension rows — 44px pills, horizontal scroll with the fade mask. */}
      {filters && (
        <div className="flex flex-col" style={{ gap: 9 }}>
          <DimensionRow label={t("events.screen.simple.sports_view.sports_vertical.sport")} labelWidth={44} scroll>
            <DimensionPill
              mobile
              label={t("common.all")}
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
            <DimensionRow label={t("common.league")} labelWidth={44} scroll>
              <DimensionPill
                mobile
                label={t("common.all")}
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
          title={t("events.screen.simple.crypto_view.crypto_vertical.nothing_boosted_here_yet")}
          illustrationSrc="/assets/mobile/empty-no-boost.png"
        />
      ) : (
        <>
      {/* Priority: live on stream → coming up on stream → other live matches → ledger. */}
      {filters && streamed.length > 0 && (
        <>
          <MobileSectionHead live label={t(`${SK}.live_on_stream`, { count: streamed.length })} />
          <MobileLiveStreamStage streams={streamed} streamFixture={streamFixture} onFail={onStreamFail} />
        </>
      )}
      {filters && rail.length > 0 && (
        <>
          <MobileSectionHead label={t(`${SK}.coming_up`, { count: rail.length })} aside={t(`${SK}.next_48_hours`)} />
          <div
            key={rail[0].id}
            className="flex"
            style={{
              gap: 10,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              margin: "0 -16px",
              padding: "0 16px",
              scrollPaddingLeft: 16,
            }}
          >
            {rail.map((m) => (
              // A lone card takes the full row; 2+ peek the next one.
              <div key={m.id} style={{ flex: rail.length === 1 ? "0 0 100%" : "0 0 78%", scrollSnapAlign: "start" }}>
                <MobilePreviewCard m={m} now={nowTick} reminded={reminders.has(m.id)} onRemind={() => reminders.toggle(m.id)} />
              </div>
            ))}
          </div>
        </>
      )}
      {filters && playingNow.length > 0 && (
        <MobileSectionHead live label={t("events.screen.simple.sports_view.sports_vertical.playing_now", { count: playingNow.length })} />
      )}
      {(filters ? playingNow : live.slice(0, 1)).map((m) => (
        <LiveMatchCard key={m.id} match={m} />
      ))}

      {(filters ? upcoming : upcoming.slice(0, live.length > 0 ? 2 : 3)).map((m) => (
        <UpcomingMatchCard key={m.id} match={m} />
      ))}

      {!filters && (
      <button
        type="button"
        onClick={onOpenAll}
        className="self-start"
        style={{ fontSize: 12, color: "#F2F3F5", fontWeight: 700 }}
      >
        All {weekCount} matches →
      </button>
      )}
        </>
      )}
    </section>
  );
};

export default MobileSportsModule;