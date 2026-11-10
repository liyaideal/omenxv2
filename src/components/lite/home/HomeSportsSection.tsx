// ============================================================
// HOME · §1 SPORTS (首页 All 改版 · Sports 规则稿 v2 + S0–S3, 2026-11-09)
//
// One fixed model whatever the live count (Liya 2026-11-06):
//   left  = the Live block — a stage (video preview when a stream exists,
//           bare match-up when not, the biggest upcoming match + Remind me
//           when nothing is live) + a 2×2 tile grid under it;
//   right = ONE table: "Big this week" (top 3 by volume) + "Next up" rows
//           that fill the column. A match appears once in the section:
//           stage > tiles > Big this week > Next up.
// Mobile (M-Sports ①–④, Liya 2026-11-09 15:32): same model stacked in one
// column; the table keeps only Big this week — Next up goes to "All N
// matches". Four states share this one component; the state is derived
// from the matches, never from a flag.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildDayStrip,
  compactVolume,
  liveAt,
  matchesInBucket,
  shortName,
  type SportsMatch,
} from "@/components/lite/sports/sportsData";
import { leagueCodeOf, sportCodeOf } from "@/components/lite/sports/sportsFilters";
import { StreamPreview } from "@/components/lite/sports/StreamPreview";
import { usePlayStream } from "@/hooks/usePlayStream";
import { MatchScoreText } from "@/components/lite/sports/tennisScore";
import { PREVIEW_WINDOW_MS } from "@/components/lite/sports/UpcomingStreams";
import { useStreamReminders } from "@/hooks/useStreamReminders";
import {
  CY,
  LM,
  MU,
  OR,
  OddsButton,
  RED,
  SectionHead,
  SportIcon,
  TeamBadge,
  cents,
  hhmm,
  ht,
  leftText,
  rich,
  shortVol,
  tradeLink,
  uiLocale,
} from "./homeAllShell";
import { t, useT } from "@/i18n";

/* ------------------------------ helpers -------------------------------- */

const abbr = (m: SportsMatch, side: "home" | "away") =>
  side === "home"
    ? m.homeAbbr || m.homeShort || shortName(m.home, { league: m.league }, [])
    : m.awayAbbr || m.awayShort || shortName(m.away, { league: m.league }, []);

/** The option a team's price button trades (R4: home = first option, away = last). */
const optionOf = (m: SportsMatch, side: "home" | "away") => {
  const name = side === "home" ? m.home : m.away;
  return (
    m.options.find((x) => x.label === name) ??
    m.options.find((x) => new RegExp(`^${side}$`, "i").test(x.label)) ??
    m.options[side === "home" ? 0 : m.options.length - 1]
  );
};
const priceOf = (m: SportsMatch, side: "home" | "away"): number => optionOf(m, side)?.price ?? 0.5;

/** A price pill inside a tile / row: picks that team (G3); the rest of the card opens the match. */
const PricePill = ({ m, side, onOpen }: { m: SportsMatch; side: "home" | "away"; onOpen: (id: string, optionId?: string) => void }) => (
  <span
    className="tc-pill"
    role="button"
    tabIndex={0}
    onClick={(e) => {
      e.stopPropagation();
      onOpen(m.id, optionOf(m, side)?.id);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        onOpen(m.id, optionOf(m, side)?.id);
      }
    }}
  >
    {cents(priceOf(m, side))}
  </span>
);

/** "Sat" / "Today" day word for a kickoff (viewer-local). */
const dayWord = (d: Date | null): string => {
  if (!d) return t("portfolio.tbd");
  const now = new Date();
  const sod = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (sod(d) - sod(now)) / 86_400_000;
  if (diff === 0) return t("events.screen.simple.sports_view.sports_streams.today");
  if (diff === 1) return t("events.screen.simple.sports_view.sports_streams.tomorrow");
  return d.toLocaleDateString(uiLocale(), { weekday: "short" });
};

/** Rows and tiles always use the short weekday ("Sat"), the stage says Today / Tomorrow. */
const dayShort = (d: Date | null): string => (d ? d.toLocaleDateString(uiLocale(), { weekday: "short" }) : t("portfolio.tbd"));

const liveClock = (m: SportsMatch): string =>
  m.liveLabel || (m.minute != null ? `${m.minute}'` : m.phase || ht("sports.live"));

const LeagueLabel = ({ m, short }: { m: SportsMatch; short?: boolean }) => (
  <>
    <SportIcon sport={sportCodeOf(m)} />
    {short ? (leagueCodeOf(m) || m.league).replace(/_/g, " ") : m.league}
  </>
);

/* ------------------------------- stage --------------------------------- */

const Stage = ({
  m,
  live,
  streams,
  streamIndex,
  onSwitchStream,
  isMobile,
  onOpen,
  onPlay,
  now,
  remind,
}: {
  m: SportsMatch;
  live: boolean;
  /** Live matches with a stream (the switcher's lineup). */
  streams: SportsMatch[];
  streamIndex: number;
  onSwitchStream: (i: number) => void;
  isMobile: boolean;
  onOpen: (id: string, optionId?: string) => void;
  /** Play button on the stream preview (R2 / R3). */
  onPlay: (id: string) => void;
  /** Same clock as the section (frozen in the style-guide), so the stage countdown never disagrees with the eyebrow. */
  now: number;
  /**
   * State ④ (CPO 2026-11-09): a real reminder when this match has a stream and
   * kicks off within 48h (same rule and same store as the Sports view rail,
   * EV-43 / EV-45 — a guest signs in first). Otherwise the link is "Open match →".
   */
  remind: { can: boolean; on: boolean; toggle: () => void };
}) => {
  const hasVideo = live && !!m.streamUrl;
  const kickoffMs = m.kickoff ? Math.max(0, m.kickoff.getTime() - now) : 0;
  // The clock (liveLabel) is the useful part: when space runs out only the league shrinks, never the clock.
  const labelHead = live
    ? isMobile
      ? ht("sports.live_now")
      : `${ht("sports.live_now")} · ${(leagueCodeOf(m) || m.league).replace(/_/g, " ")}`
    : ht("sports.biggest_kicks_off_in", { time: leftText(kickoffMs) });
  const labelTail = live && m.liveLabel ? `\u00a0·\u00a0${m.liveLabel}` : ""; // nbsp: a flex item would drop a plain leading space
  const label = labelHead + labelTail.replace(/\u00a0/g, " ");
  const badgeSize = isMobile ? 44 : 56;

  const rightLabel = live ? (
    streams.length > 1 ? (
      <span className="row" style={{ gap: isMobile ? 6 : 8, flexShrink: 0 }}>
        <button
          type="button"
          className="sw"
          aria-label={ht("sports.prev_stream")}
          onClick={() => onSwitchStream((streamIndex - 1 + streams.length) % streams.length)}
        >
          ‹
        </button>
        <span className="m" style={{ fontSize: isMobile ? 11.5 : 12, color: MU, whiteSpace: "nowrap" }}>
          {rich(ht("sports.stream_n", { n: streams.length }), { i: <b style={{ color: "#fff" }}>{streamIndex + 1}</b> })}
        </span>
        <button
          type="button"
          className="sw"
          aria-label={ht("sports.next_stream")}
          onClick={() => onSwitchStream((streamIndex + 1) % streams.length)}
        >
          ›
        </button>
      </span>
    ) : hasVideo && !isMobile ? (
      <span className="tc-lbl2" style={{ color: OR, whiteSpace: "nowrap", flexShrink: 0 }}>
        ▶ {ht("sports.live_stream")}
      </span>
    ) : null
  ) : null;

  return (
    <div>
      <div
        className="row"
        style={{ gap: 10, height: 28, justifyContent: "space-between", marginTop: isMobile ? 22 : 0 }}
      >
        <span className="row" style={{ gap: 10, minWidth: 0 }}>
          {live && <span className="livedot" />}
          <span className="tc-lbl2 row" style={{ color: live ? OR : MU, whiteSpace: "nowrap", minWidth: 0, gap: 0 }} title={label}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{labelHead}</span>
            {labelTail && <span style={{ flexShrink: 0 }}>{labelTail}</span>}
          </span>
        </span>
        {rightLabel}
      </div>

      {/* S2/S3 (CPO 2026-11-09「点了才播」): the home page never pulls the stream.
          The picture is a still — the 10-minute server snapshot, else the event
          cover, else a dark stage — with a play button. Play: signed in → the
          trade page plays; guest → sign in first, then the trade page plays. */}
      {live && !!m.streamUrl && (
        <div className="stage-vid" style={{ marginTop: isMobile ? 12 : 14 }}>
          <StreamPreview match={m} onPlay={() => onPlay(m.id)} compact={isMobile} nowMs={now} radius={12} />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: isMobile ? 12 : 16,
          marginTop: live ? (isMobile ? 16 : 18) : 22,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 6 : 8, minWidth: 0 }}
        >
          <TeamBadge code={abbr(m, "home")} logoUrl={m.homeLogo} tileColor={m.homeTile} size={badgeSize} />
          <span className="tc-code" style={{ fontSize: isMobile ? 14 : 16 }}>
            {abbr(m, "home")}
          </span>
          <span style={{ fontSize: isMobile ? 11 : 11.5, color: MU, maxWidth: "100%", width: isMobile ? undefined : 150, textAlign: "center", lineHeight: 1.3 }}>
            {m.home}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 4 : 6 }}>
          {live ? (
            <span
              className="m"
              style={{ fontSize: isMobile ? 40 : 56, fontWeight: 700, color: LM, lineHeight: 1, letterSpacing: "-.03em", whiteSpace: "nowrap" }}
            >
              <MatchScoreText sport={m.sport} score={m.score || "0 – 0"} base={isMobile ? 40 : 56} />
            </span>
          ) : (
            <span
              className="m"
              style={{ fontSize: isMobile ? 32 : 40, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-.02em", whiteSpace: "nowrap" }}
            >
              {hhmm(m.kickoff)}
            </span>
          )}
          <span className="tc-meta">
            {live ? (
              <>
                <span style={{ color: OR, fontWeight: 700 }}>{liveClock(m)}</span> · <LeagueLabel m={m} />
              </>
            ) : (
              <>
                {dayWord(m.kickoff)} · <LeagueLabel m={m} />
              </>
            )}
          </span>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 6 : 8, minWidth: 0 }}
        >
          <TeamBadge code={abbr(m, "away")} logoUrl={m.awayLogo} tileColor={m.awayTile} size={badgeSize} />
          <span className="tc-code" style={{ fontSize: isMobile ? 14 : 16 }}>
            {abbr(m, "away")}
          </span>
          <span style={{ fontSize: isMobile ? 11 : 11.5, color: MU, maxWidth: "100%", width: isMobile ? undefined : 150, textAlign: "center", lineHeight: 1.3 }}>
            {m.away}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: isMobile ? 16 : 20 }}>
        <OddsButton label={abbr(m, "home")} price={priceOf(m, "home")} onClick={() => onOpen(m.id, optionOf(m, "home")?.id)} />
        <OddsButton label={abbr(m, "away")} price={priceOf(m, "away")} onClick={() => onOpen(m.id, optionOf(m, "away")?.id)} />
      </div>
      <div className="row" style={{ gap: isMobile ? 14 : 16, marginTop: isMobile ? 12 : 16 }}>
        {!live && remind.can ? (
          <button
            type="button"
            className="lnk"
            aria-pressed={remind.on}
            data-remind=""
            style={{ fontSize: isMobile ? 13 : 13.5, color: remind.on ? OR : undefined }}
            onClick={remind.toggle}
          >
            {remind.on ? `★ ${t("events.screen.simple.sports_view.sports_streams.reminder_set")}` : `☆ ${t("events.screen.simple.sports_view.sports_streams.remind_me")}`}
          </button>
        ) : (
          <button type="button" className="lnk" style={{ fontSize: isMobile ? 13 : 13.5 }} onClick={() => onOpen(m.id)}>
            {ht("sports.open_match")}
          </button>
        )}
        <span className="kv">
          {t("common.vol")} <b>{shortVol(m.volume)}</b>
        </span>
      </div>
    </div>
  );
};

/* ------------------------------- tiles --------------------------------- */

const Tile = ({
  m,
  live,
  isMobile,
  onOpen,
}: {
  m: SportsMatch;
  live: boolean;
  isMobile: boolean;
  onOpen: (id: string, optionId?: string) => void;
}) => {
  const stream = live && !!m.streamUrl;
  return (
    <button type="button" className={`tc-tile${live ? " live" : ""}`} onClick={() => onOpen(m.id)}>
      <div className="tc-top">
        <span className="tc-tm">
          <TeamBadge code={abbr(m, "home")} logoUrl={m.homeLogo} tileColor={m.homeTile} size={30} />
          <span className="tc-code">{abbr(m, "home")}</span>
        </span>
        {live ? (
          <span className="tc-sc">
            <MatchScoreText sport={m.sport} score={m.score || "0 – 0"} base={20} />
          </span>
        ) : (
          <span className="tc-sc t">{hhmm(m.kickoff)}</span>
        )}
        <span className="tc-tm">
          <TeamBadge code={abbr(m, "away")} logoUrl={m.awayLogo} tileColor={m.awayTile} size={30} />
          <span className="tc-code">{abbr(m, "away")}</span>
        </span>
      </div>
      <div className="tc-meta">
        {live ? (
          <>
            <span style={{ color: OR }}>●</span>{" "}
            <span style={{ color: OR, fontWeight: 700 }}>{liveClock(m)}</span>
            {/* mobile: a streamed tile drops the league so "▶ Stream" never truncates */}
            {!(stream && isMobile) && (
              <>
                {" · "}
                <LeagueLabel m={m} short />
              </>
            )}
            {stream && (
              <>
                {" · "}
                <span style={{ color: OR, fontWeight: 700 }}>▶ {t("events.screen.simple.sports_view.sports_streams.stream_tag")}</span>
              </>
            )}
          </>
        ) : (
          <>
            {dayShort(m.kickoff)} · <LeagueLabel m={m} short />
          </>
        )}
      </div>
      <div className="tc-bot">
        <PricePill m={m} side="home" onOpen={onOpen} />
        <PricePill m={m} side="away" onOpen={onOpen} />
      </div>
    </button>
  );
};

const TileGroup = ({
  label,
  color = MU,
  items,
  liveSet,
  isMobile,
  onOpen,
  more,
  onMore,
}: {
  label: string;
  color?: string;
  items: SportsMatch[];
  liveSet: Set<string>;
  isMobile: boolean;
  onOpen: (id: string, optionId?: string) => void;
  more?: string;
  onMore?: () => void;
}) => (
  <div>
    <div className="tc-lbl2" style={{ color, marginBottom: 12 }}>
      {label}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {items.map((m, i) => (
        <div key={m.id} style={items.length % 2 === 1 && i === items.length - 1 ? { gridColumn: "1 / -1", display: "grid" } : { display: "grid" }}>
          <Tile m={m} live={liveSet.has(m.id)} isMobile={isMobile} onOpen={onOpen} />
        </div>
      ))}
    </div>
    {more && (
      <button
        type="button"
        onClick={onMore}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 10,
          height: 40,
          width: "100%",
          border: "1px solid rgba(148,163,184,.18)",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          color: "#DBE2EA",
          background: "transparent",
          fontFamily: "inherit",
        }}
      >
        {more}
      </button>
    )}
  </div>
);

/* ------------------------------- table --------------------------------- */

const Row = ({
  m,
  big,
  hr,
  isMobile,
  onOpen,
  stretch,
}: {
  m: SportsMatch;
  big?: boolean;
  hr: boolean;
  isMobile: boolean;
  onOpen: (id: string, optionId?: string) => void;
  /** Next-up rows share the column's leftover height so the panel ends flush with the left block. */
  stretch?: boolean;
}) => (
  <div
    className={`lrow${hr ? " hr" : ""}`}
    title={`${m.home} vs ${m.away}`}
    style={stretch ? { flex: 1, alignContent: "center" } : undefined}
    role="button"
    tabIndex={0}
    onClick={() => onOpen(m.id)}
    onKeyDown={(e) => e.key === "Enter" && onOpen(m.id)}
  >
    <span className="tc-pair">
      <TeamBadge code={abbr(m, "home")} logoUrl={m.homeLogo} tileColor={m.homeTile} size={isMobile ? 24 : 26} />
      <TeamBadge code={abbr(m, "away")} logoUrl={m.awayLogo} tileColor={m.awayTile} size={isMobile ? 24 : 26} />
    </span>
    {isMobile ? (
      <span style={{ minWidth: 0 }}>
        <div className="tc-code" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
          {abbr(m, "home")} <span style={{ color: "#6B7280", fontWeight: 500 }}>vs</span> {abbr(m, "away")}
          {big && (
            <b className="m" style={{ color: LM, fontWeight: 700, fontSize: 12, marginLeft: 6 }}>
              {shortVol(m.volume)}
            </b>
          )}
        </div>
        <div className="tc-meta" style={{ marginTop: 3 }}>
          <span className="m" style={{ color: "#DBE2EA", fontWeight: 600 }}>
            {dayShort(m.kickoff)} {hhmm(m.kickoff)}
          </span>{" "}
          · <LeagueLabel m={m} short />
        </div>
      </span>
    ) : (
      <span style={{ minWidth: 0 }}>
        <div className="tc-nm1 tc-code" style={{ fontSize: 15.5 }}>
          {abbr(m, "home")} <span style={{ color: "#6B7280", fontWeight: 500 }}>vs</span> {abbr(m, "away")}
          <span className="m" style={{ color: MU, fontWeight: 600, marginLeft: 8, fontSize: 13 }}>
            {dayShort(m.kickoff)} {hhmm(m.kickoff)}
          </span>
          {big && (
            <span className="kv" style={{ marginLeft: 10, fontSize: 12.5 }}>
              {t("common.vol")}{" "}
              <b className="m" style={{ color: LM, fontWeight: 700, fontSize: 13 }}>
                {shortVol(m.volume)}
              </b>
            </span>
          )}
        </div>
        <div className="tc-meta" style={{ marginTop: 4 }}>
          <LeagueLabel m={m} />
          {!big && <> · {shortVol(m.volume)}</>}
          {m.streamUrl && (
            <>
              {" · "}
              <span style={{ color: OR, fontWeight: 700 }}>▶ {ht("sports.live_stream")}</span>
            </>
          )}
        </div>
      </span>
    )}
    <PricePill m={m} side="home" onOpen={onOpen} />
    <PricePill m={m} side="away" onOpen={onOpen} />
  </div>
);

const Head = ({ label, top }: { label: string; top?: number }) => (
  <div className="lbl" style={{ paddingBottom: 10, flex: "none", paddingTop: top }}>
    {label}
  </div>
);

/* ------------------------------- section ------------------------------- */

export interface HomeSportsSectionProps {
  matches: SportsMatch[];
  isMobile: boolean;
  /** Opens the Sports category view (the "All N matches →" link). */
  onOpenAll: () => void;
  /** Frozen clock for style-guide fixtures; production leaves it unset. */
  nowOverride?: number;
  /** Rows the desktop "Next up" group shows (fills the column). */
  nextUpRows?: number;
  /** Style-guide only: event ids that already have a reminder (no auth, no DB). */
  remindedFixture?: string[];
  /** Style-guide only: every Remind me tap opens sign-in, as for a guest. */
  remindGuestFixture?: boolean;
}

export const HomeSportsSection = ({
  matches,
  isMobile,
  onOpenAll,
  nowOverride,
  nextUpRows = 8,
  remindedFixture,
  remindGuestFixture,
}: HomeSportsSectionProps) => {
  const navigate = useNavigate();
  useT(); // re-render on language change / catalog arrival
  const reminders = useStreamReminders(remindedFixture, remindGuestFixture);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (nowOverride != null) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [nowOverride]);
  const now = nowOverride ?? Date.now() + tick * 0;

  const [day, setDay] = useState("all");
  const [streamIndex, setStreamIndex] = useState(0);

  const model = useMemo(() => {
    const live = matches.filter((m) => liveAt(m, now));
    const liveSet = new Set(live.map((m) => m.id));
    const upcoming = matches
      .filter((m) => !liveSet.has(m.id) && m.kickoff && m.kickoff.getTime() > now)
      .sort((a, b) => (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0));
    // Same order as the Sports view stage (EV-37): biggest volume first, then earlier kickoff.
    const streams = live.filter((m) => !!m.streamUrl).sort((a, b) => b.volume - a.volume || (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0));
    // Stage: streamed live > any live > biggest upcoming this week.
    const byVol = (a: SportsMatch, b: SportsMatch) => b.volume - a.volume;
    const stage =
      streams.length > 0
        ? streams[Math.min(streamIndex, streams.length - 1)]
        : live.length > 0
          ? [...live].sort(byVol)[0]
          : [...upcoming].sort(byVol)[0] ?? null;
    const used = new Set<string>(stage ? [stage.id] : []);
    // Tiles: the other live matches first ("Also live"), then upcoming ("Up next"); 4 in total.
    const alsoLive = live.filter((m) => !used.has(m.id)).sort(byVol).slice(0, 4);
    alsoLive.forEach((m) => used.add(m.id));
    const upNext = upcoming.filter((m) => !used.has(m.id)).slice(0, 4 - alsoLive.length);
    upNext.forEach((m) => used.add(m.id));
    // Table: scoped by the day strip; Big this week top 3 by volume, Next up by kickoff.
    const pool = matchesInBucket(upcoming, day).filter((m) => !used.has(m.id));
    const big = [...pool].sort(byVol).slice(0, 3);
    const bigSet = new Set(big.map((m) => m.id));
    // Next up fills the table to the left column's height (D2-S3 states ①–④): a video stage is tall
    // (8 rows, +1 when the "See all N live" button shows); a stage without video is short (5 with live
    // tiles under it, 4 before kickoff). Otherwise the panel runs ~200px past the left column (looks broken).
    const stageHasVideo = streams.length > 0;
    const seeAll = live.length - 1 > alsoLive.length;
    const fill = stageHasVideo ? nextUpRows + (seeAll ? 1 : 0) : live.length > 0 ? nextUpRows - 3 : nextUpRows - 4;
    const next = pool.filter((m) => !bigSet.has(m.id)).slice(0, isMobile ? 0 : fill);
    // R2: "+N more" = not-started matches not shown anywhere — the stage counts too when it hasn't kicked off (state ④).
    const stageUpcoming = stage && upcoming.some((m) => m.id === stage.id) ? 1 : 0;
    const remain = Math.max(0, upcoming.length - stageUpcoming - upNext.length - big.length - next.length);
    return { live, liveSet, upcoming, streams, stage, alsoLive, upNext, big, next, remain };
  }, [matches, now, day, streamIndex, isMobile, nextUpRows]);

  const strip = useMemo(() => buildDayStrip(matches, now), [matches, now]);
  const total = matches.length;
  const liveCount = model.live.length;
  const nextKick = model.upcoming[0]?.kickoff ? model.upcoming[0].kickoff.getTime() - now : null;
  const eyebrow =
    liveCount > 0
      ? `● ${ht("sports.eyebrow_live", { count: total, live: liveCount })}`
      : isMobile
        ? `${ht("sports.eyebrow_short", { count: total })}${nextKick != null ? ht("sports.kickoff_in", { time: leftText(nextKick) }) : ""}`
        : `${ht("sports.eyebrow_week", { count: total })}${nextKick != null ? ht("sports.next_kickoff_in", { time: leftText(nextKick) }) : ""}`;

  const onOpen = (id: string, optionId?: string) => navigate(tradeLink(id, { option: optionId }));
  const question = <>{rich(ht("sports.question"))}</>;
  const playStream = usePlayStream();

  if (!model.stage) return null;

  const dayStrip = (
    <div className={isMobile ? "hscroll" : "row"} style={{ gap: 8, marginTop: isMobile ? 18 : 0 }}>
      {strip.map((b) => {
        // Weekday in the viewer's language (same rule as the Sports view); ALL / TODAY from the catalog.
        const w =
          b.id === "all"
            ? ht("sports.day_all")
            : b.label === "TODAY"
              ? ht("sports.day_today")
              : new Date(Number(b.id)).toLocaleDateString(uiLocale(), { weekday: "short" }).toUpperCase();
        const dom = b.id === "all" ? b.count : new Date(Number(b.id)).getDate();
        return (
          <button
            key={b.id}
            type="button"
            className={`daycell${day === b.id ? " on" : ""}`}
            onClick={() => setDay(b.id)}
          >
            <span className="dc-top">{w}</span>
            <span className="dc-mid">{dom}</span>
            {b.id !== "all" && <span className="dc-bot">{b.count}</span>}
          </button>
        );
      })}
    </div>
  );

  const stage = (
    <Stage
      m={model.stage}
      live={model.liveSet.has(model.stage.id)}
      streams={model.streams}
      streamIndex={Math.min(streamIndex, Math.max(0, model.streams.length - 1))}
      onSwitchStream={setStreamIndex}
      isMobile={isMobile}
      onOpen={onOpen}
      onPlay={playStream}
      now={now}
      remind={{
        can:
          !!model.stage.streamUrl &&
          !!model.stage.kickoff &&
          model.stage.kickoff.getTime() > now &&
          model.stage.kickoff.getTime() - now <= PREVIEW_WINDOW_MS,
        on: reminders.has(model.stage.id),
        toggle: () => reminders.toggle(model.stage.id),
      }}
    />
  );

  const tiles = (
    <>
      {model.alsoLive.length > 0 && (
        <TileGroup
          label={ht("sports.also_live", { count: Math.max(liveCount - 1, model.alsoLive.length) })}
          color={OR}
          items={model.alsoLive}
          liveSet={model.liveSet}
          isMobile={isMobile}
          onOpen={onOpen}
          more={liveCount - 1 > model.alsoLive.length ? ht("sports.see_all_live", { count: liveCount }) : undefined}
          onMore={onOpenAll}
        />
      )}
      {model.upNext.length > 0 && (
        <div style={{ marginTop: model.alsoLive.length ? (isMobile ? 22 : 24) : 0 }}>
          <TileGroup
            label={
              model.alsoLive.length
                ? ht("sports.up_next_times", { times: model.upNext.map((m) => hhmm(m.kickoff)).join(" / ") })
                : ht("sports.up_next")
            }
            items={model.upNext}
            liveSet={model.liveSet}
            isMobile={isMobile}
            onOpen={onOpen}
          />
        </div>
      )}
    </>
  );

  // #6 (CPO 2026-11-10): a single day picked in the strip → the panel says which day, and a day with nothing
  // left to list says so ("No more matches on Thu 6 · see all →") instead of the footer vanishing.
  const dayWord =
    day === "all"
      ? null
      : `${new Date(Number(day)).toLocaleDateString(uiLocale(), { weekday: "short" })} ${new Date(Number(day)).getDate()}`; // "Fri 7", same order as the strip
  const dayFooter = dayWord != null && model.next.length === 0 && (
    <div style={{ fontSize: 13, color: MU, paddingTop: model.big.length ? 14 : 4 }}>
      {ht("sports.no_more_on_day", { day: dayWord })} ·{" "}
      <button type="button" className="lnk" style={{ fontSize: 13, fontWeight: 400 }} onClick={onOpenAll}>
        {ht("sports.see_all")}
      </button>
    </div>
  );
  const table = (
    <div className="panel" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Head label={dayWord != null ? ht("sports.big_on_day", { day: dayWord }) : ht("sports.big_this_week")} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {model.big.map((m, i) => (
          <Row key={m.id} m={m} big hr={i < model.big.length - 1} isMobile={isMobile} onOpen={onOpen} />
        ))}
      </div>
      {!isMobile && model.next.length > 0 && (
        <>
          <Head label={ht("sports.next_up")} top={22} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {model.next.map((m, i) => (
              <Row key={m.id} m={m} hr={i < model.next.length - 1} isMobile={isMobile} onOpen={onOpen} stretch />
            ))}
          </div>
          <div style={{ fontSize: 13, color: MU, paddingTop: 4, flex: "none" }}>
            {ht("sports.more_this_week", { count: model.remain })} ·{" "}
            <button type="button" className="lnk" style={{ fontSize: 13, fontWeight: 400 }} onClick={onOpenAll}>
              {ht("sports.see_all")}
            </button>
          </div>
        </>
      )}
      {!isMobile && dayFooter}
    </div>
  );

  if (isMobile) {
    return (
      <section className="sec">
        <SectionHead eyebrow={eyebrow} eyebrowColor={RED} question={question} isMobile />
        {dayStrip}
        {stage}
        <div style={{ marginTop: 28 }}>{tiles}</div>
        <div style={{ marginTop: 28 }}>{table}</div>
        <div className="row" style={{ marginTop: 18, justifyContent: "space-between" }}>
          <span className="kv">{ht("sports.more_this_week", { count: model.remain })}</span>
          <button type="button" className="lnk" onClick={onOpenAll}>
            {t("events.screen.simple.sports_view.sports_vertical.all_matches", { count: total })}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sec">
      <SectionHead eyebrow={eyebrow} eyebrowColor={RED} question={question} right={dayStrip} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 20, marginTop: 44 }}>
        <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", paddingRight: 28 }}>
          {stage}
          <div style={{ marginTop: 32 }}>{tiles}</div>
        </div>
        <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", minWidth: 0 }}>{table}</div>
      </div>
    </section>
  );
};

export default HomeSportsSection;
