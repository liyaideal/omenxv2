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
import { ListStreamVideo } from "@/components/lite/sports/ListStreamVideo";
import { MatchScoreText } from "@/components/lite/sports/tennisScore";
import { kickoffInShort } from "@/components/lite/sports/sportsClock";
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
  shortVol,
} from "./homeAllShell";

/* ------------------------------ helpers -------------------------------- */

const abbr = (m: SportsMatch, side: "home" | "away") =>
  side === "home"
    ? m.homeAbbr || m.homeShort || shortName(m.home, { league: m.league }, [])
    : m.awayAbbr || m.awayShort || shortName(m.away, { league: m.league }, []);

const priceOf = (m: SportsMatch, side: "home" | "away"): number => {
  const name = side === "home" ? m.home : m.away;
  const o =
    m.options.find((x) => x.label === name) ??
    m.options.find((x) => new RegExp(`^${side}$`, "i").test(x.label)) ??
    m.options[side === "home" ? 0 : m.options.length - 1];
  return o?.price ?? 0.5;
};

/** "Sat" / "Today" day word for a kickoff (viewer-local). */
const dayWord = (d: Date | null): string => {
  if (!d) return "TBD";
  const now = new Date();
  const sod = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (sod(d) - sod(now)) / 86_400_000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

/** Rows and tiles always use the short weekday ("Sat"), the stage says Today / Tomorrow. */
const dayShort = (d: Date | null): string => (d ? d.toLocaleDateString(undefined, { weekday: "short" }) : "TBD");

const liveClock = (m: SportsMatch): string =>
  m.liveLabel || (m.minute != null ? `${m.minute}'` : m.phase || "Live");

const LeagueLabel = ({ m, short }: { m: SportsMatch; short?: boolean }) => (
  <>
    <SportIcon sport={sportCodeOf(m)} />
    {short ? leagueCodeOf(m) || m.league : m.league}
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
}: {
  m: SportsMatch;
  live: boolean;
  /** Live matches with a stream (the switcher's lineup). */
  streams: SportsMatch[];
  streamIndex: number;
  onSwitchStream: (i: number) => void;
  isMobile: boolean;
  onOpen: (id: string) => void;
}) => {
  const [dead, setDead] = useState<Record<string, boolean>>({});
  const hasVideo = live && !!m.streamUrl && !dead[m.id];
  const kickoffMs = m.kickoff ? m.kickoff.getTime() - Date.now() : 0;
  const label = live
    ? isMobile
      ? `Live now${m.liveLabel ? ` · ${m.liveLabel}` : ""}`
      : `Live now · ${leagueCodeOf(m) || m.league}${m.liveLabel ? ` · ${m.liveLabel}` : ""}`
    : `Biggest this week · kicks off in ${kickoffInShort(kickoffMs)}`;
  const badgeSize = isMobile ? 44 : 56;

  const rightLabel = live ? (
    streams.length > 1 ? (
      <span className="row" style={{ gap: isMobile ? 6 : 8 }}>
        <button
          type="button"
          className="sw"
          aria-label="Previous stream"
          onClick={() => onSwitchStream((streamIndex - 1 + streams.length) % streams.length)}
        >
          ‹
        </button>
        <span className="m" style={{ fontSize: isMobile ? 11.5 : 12, color: MU }}>
          Stream <b style={{ color: "#fff" }}>{streamIndex + 1}</b> / {streams.length}
        </span>
        <button
          type="button"
          className="sw"
          aria-label="Next stream"
          onClick={() => onSwitchStream((streamIndex + 1) % streams.length)}
        >
          ›
        </button>
      </span>
    ) : hasVideo && !isMobile ? (
      <span className="tc-lbl2" style={{ color: OR }}>
        ▶ Live stream
      </span>
    ) : null
  ) : null;

  return (
    <div>
      <div
        className="row"
        style={{ gap: 10, height: 28, justifyContent: "space-between", marginTop: isMobile ? 22 : 0 }}
      >
        <span className="row" style={{ gap: 10 }}>
          {live && <span className="livedot" />}
          <span className="tc-lbl2" style={{ color: live ? OR : MU }}>
            {label}
          </span>
        </span>
        {rightLabel}
      </div>

      {/* S2/S3: the picture is a PREVIEW that opens the match — no controls on
          the home page. Desktop: muted autoplay (tier ②) when the stream can
          be embedded; mobile and no-stream: the brand stage (tier ③). */}
      {live && (
        <div className="stage-vid" style={{ marginTop: isMobile ? 12 : 14 }}>
          {hasVideo && !isMobile ? (
            <ListStreamVideo
              src={m.streamUrl as string}
              onOpen={() => onOpen(m.id)}
              onFail={() => setDead((d) => ({ ...d, [m.id]: true }))}
            />
          ) : (
            <button
              type="button"
              className="stage-brand"
              style={{ width: "100%", border: 0, color: "inherit", cursor: "pointer" }}
              onClick={() => onOpen(m.id)}
              aria-label="Open match"
            >
              <TeamBadge code={abbr(m, "home")} size={isMobile ? 56 : 72} />
              <span className="row" style={{ gap: 8 }}>
                <span className="livedot" />
                <span className="tc-lbl2" style={{ color: OR }}>
                  Live
                </span>
              </span>
              <TeamBadge code={abbr(m, "away")} size={isMobile ? 56 : 72} />
            </button>
          )}
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
          <TeamBadge code={abbr(m, "home")} size={badgeSize} />
          <span className="tc-code" style={{ fontSize: isMobile ? 14 : 16 }}>
            {abbr(m, "home")}
          </span>
          <span className="tc-el" style={{ fontSize: isMobile ? 11 : 11.5, color: MU, maxWidth: isMobile ? 110 : 150 }}>
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
          <TeamBadge code={abbr(m, "away")} size={badgeSize} />
          <span className="tc-code" style={{ fontSize: isMobile ? 14 : 16 }}>
            {abbr(m, "away")}
          </span>
          <span className="tc-el" style={{ fontSize: isMobile ? 11 : 11.5, color: MU, maxWidth: isMobile ? 110 : 150 }}>
            {m.away}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: isMobile ? 16 : 20 }}>
        <OddsButton label={abbr(m, "home")} price={priceOf(m, "home")} onClick={() => onOpen(m.id)} />
        <OddsButton label={abbr(m, "away")} price={priceOf(m, "away")} onClick={() => onOpen(m.id)} />
      </div>
      <div className="row" style={{ gap: isMobile ? 14 : 16, marginTop: isMobile ? 12 : 16 }}>
        <button type="button" className="lnk" style={{ fontSize: isMobile ? 13 : 13.5 }} onClick={() => onOpen(m.id)}>
          {live ? "Open match →" : "☆ Remind me"}
        </button>
        <span className="kv">
          Vol <b>{shortVol(m.volume)}</b>
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
  onOpen: (id: string) => void;
}) => {
  const stream = live && !!m.streamUrl;
  return (
    <button type="button" className={`tc-tile${live ? " live" : ""}`} onClick={() => onOpen(m.id)}>
      <div className="tc-top">
        <span className="tc-tm">
          <TeamBadge code={abbr(m, "home")} size={30} />
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
          <TeamBadge code={abbr(m, "away")} size={30} />
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
                <span style={{ color: OR, fontWeight: 700 }}>▶ Stream</span>
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
        <span className="tc-pill">{cents(priceOf(m, "home"))}</span>
        <span className="tc-pill">{cents(priceOf(m, "away"))}</span>
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
  onOpen: (id: string) => void;
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
  onOpen: (id: string) => void;
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
      <TeamBadge code={abbr(m, "home")} size={isMobile ? 24 : 26} />
      <TeamBadge code={abbr(m, "away")} size={isMobile ? 24 : 26} />
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
              Vol{" "}
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
              <span style={{ color: OR, fontWeight: 700 }}>▶ Live stream</span>
            </>
          )}
        </div>
      </span>
    )}
    <span className="tc-pill">{cents(priceOf(m, "home"))}</span>
    <span className="tc-pill">{cents(priceOf(m, "away"))}</span>
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
}

export const HomeSportsSection = ({
  matches,
  isMobile,
  onOpenAll,
  nowOverride,
  nextUpRows = 8,
}: HomeSportsSectionProps) => {
  const navigate = useNavigate();
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
    const streams = live.filter((m) => !!m.streamUrl);
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
    const next = pool.filter((m) => !bigSet.has(m.id)).slice(0, isMobile ? 0 : nextUpRows);
    const remain = Math.max(0, upcoming.length - upNext.length - big.length - next.length);
    return { live, liveSet, upcoming, streams, stage, alsoLive, upNext, big, next, remain };
  }, [matches, now, day, streamIndex, isMobile, nextUpRows]);

  const strip = useMemo(() => buildDayStrip(matches, now), [matches, now]);
  const total = matches.length;
  const liveCount = model.live.length;
  const nextKick = model.upcoming[0]?.kickoff ? model.upcoming[0].kickoff.getTime() - now : null;
  const eyebrow =
    liveCount > 0
      ? `● Sports · ${total} matches this week · ${liveCount} live`
      : isMobile
        ? `Sports · ${total} matches${nextKick != null ? ` · kickoff in ${kickoffInShort(nextKick)}` : ""}`
        : `Sports · ${total} matches this week${nextKick != null ? ` · next kickoff in ${kickoffInShort(nextKick)}` : ""}`;

  const onOpen = (id: string) => navigate(`/trade?event=${id}`);

  if (!model.stage) return null;

  const dayStrip = (
    <div className={isMobile ? "hscroll" : "row"} style={{ gap: 8, marginTop: isMobile ? 18 : 0 }}>
      {strip.map((b) => {
        const w = b.label.split(" ")[0];
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
    />
  );

  const tiles = (
    <>
      {model.alsoLive.length > 0 && (
        <TileGroup
          label={`Also live · ${Math.max(liveCount - 1, model.alsoLive.length)}`}
          color={OR}
          items={model.alsoLive}
          liveSet={model.liveSet}
          isMobile={isMobile}
          onOpen={onOpen}
          more={liveCount - 1 > model.alsoLive.length ? `See all ${liveCount} live →` : undefined}
          onMore={onOpenAll}
        />
      )}
      {model.upNext.length > 0 && (
        <div style={{ marginTop: model.alsoLive.length ? (isMobile ? 22 : 24) : 0 }}>
          <TileGroup
            label={
              model.alsoLive.length
                ? `Up next · ${model.upNext.map((m) => hhmm(m.kickoff)).join(" / ")}`
                : "Up next"
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

  const table = (
    <div className="panel" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Head label="Big this week · by volume" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {model.big.map((m, i) => (
          <Row key={m.id} m={m} big hr={i < model.big.length - 1} isMobile={isMobile} onOpen={onOpen} />
        ))}
      </div>
      {!isMobile && model.next.length > 0 && (
        <>
          <Head label="Next up" top={22} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {model.next.map((m, i) => (
              <Row key={m.id} m={m} hr={i < model.next.length - 1} isMobile={isMobile} onOpen={onOpen} stretch />
            ))}
          </div>
          <div style={{ fontSize: 13, color: MU, paddingTop: 4, flex: "none" }}>
            +{model.remain} more this week ·{" "}
            <button type="button" className="lnk" style={{ fontSize: 13, fontWeight: 400 }} onClick={onOpenAll}>
              see all →
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <section className="sec">
        <SectionHead eyebrow={eyebrow} eyebrowColor={RED} question={<>Who wins <i>the match</i>?</>} isMobile />
        {dayStrip}
        {stage}
        <div style={{ marginTop: 28 }}>{tiles}</div>
        <div style={{ marginTop: 28 }}>{table}</div>
        <div className="row" style={{ marginTop: 18, justifyContent: "space-between" }}>
          <span className="kv">+{model.remain} more this week</span>
          <button type="button" className="lnk" onClick={onOpenAll}>
            All {total} matches →
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sec">
      <SectionHead eyebrow={eyebrow} eyebrowColor={RED} question={<>Who wins <i>the match</i>?</>} right={dayStrip} />
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
