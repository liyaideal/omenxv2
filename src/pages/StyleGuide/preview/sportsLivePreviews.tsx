// ============================================================
// Lite Sports · Live previews — PRODUCTION LiveMatchboard / LiveStage
// mounted with hand-written fixture events. Nothing is queried; nothing
// is re-drawn by hand.
// ============================================================
import { LiveMatchboard, type MatchboardEvent } from "@/components/lite/sports/LiveMatchboard";
import { LiveStage, type StageFixture } from "@/components/lite/sports/LiveStage";

/** Frozen clock — every fixture below is expressed relative to it. */
const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);
const at = (mins: number) => new Date(NOW + mins * 60_000).toISOString();

const cs2Base = {
  sport: "esports",
  league: "IEM Cologne",
  home: "Natus Vincere",
  away: "FaZe Clan",
  home_abbr: "NAVI",
  away_abbr: "FAZE",
  segments_key: "IEM Cologne · BO3",
};

const ufcBase = {
  sport: "mma",
  league: "UFC 321",
  home: "Alex Pereira",
  away: "Magomed Ankalaev",
  home_abbr: "PER",
  away_abbr: "ANK",
  segments_key: "UFC · main",
};

const board = (id: string, metadata: Record<string, unknown>, extra: Partial<MatchboardEvent> = {}): MatchboardEvent => ({
  id,
  name: `${metadata.home} vs ${metadata.away}`,
  event_subtype: "SPORTS_MATCH",
  start_date: at(-60),
  end_date: at(120),
  metadata,
  ...extra,
});

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="p-3">{children}</div>
);

/* ---------------- A · LiveMatchboard ---------------- */

export const M1Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board("sg-cs2-m1", {
        ...cs2Base,
        segment_index: 2,
        segment_results: [{ home: 13, away: 8 }, { home: 11, away: 8 }, null],
      })}
    />
  </Frame>
);

export const M2Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-cs2-m2",
        {
          ...cs2Base,
          kickoff_at: at(134),
          segment_index: null,
          segment_results: [null, null, null],
        },
        { start_date: at(134), end_date: at(320) },
      )}
    />
  </Frame>
);

export const M3Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board("sg-cs2-m3", {
        ...cs2Base,
        segment_index: 2,
        segment_results: [{ home: 13, away: 8 }, null, null],
      })}
    />
  </Frame>
);

export const M4Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-cs2-m4",
        {
          ...cs2Base,
          segment_index: 3,
          segment_results: [
            { home: 13, away: 8 },
            { home: 11, away: 13 },
            { home: 13, away: 10 },
          ],
        },
        { start_date: at(-180), end_date: at(-5) },
      )}
    />
  </Frame>
);

export const M5Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-cs2-m5",
        {
          ...cs2Base,
          segment_index: 3,
          segment_results: [
            { home: 13, away: 8 },
            { home: 11, away: 13 },
            { home: 13, away: 10 },
          ],
        },
        { start_date: at(-180), end_date: at(-5), is_resolved: true, winning_option_id: "sg-cs2-m5-o1" },
      )}
    />
  </Frame>
);

export const M6Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board("sg-cs2-m6", {
        ...cs2Base,
        segments_key: undefined,
        segment_index: null,
        segment_results: null,
      })}
    />
  </Frame>
);

export const U1Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board("sg-ufc-u1", {
        ...ufcBase,
        segment_index: 3,
        segment_results: [null, null, null, null, null],
        clock: 150,
        phase: "ROUND",
      })}
    />
  </Frame>
);

export const U2Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board("sg-ufc-u2", {
        ...ufcBase,
        segment_index: 3,
        segment_results: [null, null, null, null, null],
        clock: 0,
        phase: "BREAK",
      })}
    />
  </Frame>
);

export const U3Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-ufc-u3",
        {
          ...ufcBase,
          kickoff_at: at(320),
          segment_index: null,
          segment_results: [null, null, null, null, null],
        },
        { start_date: at(320), end_date: at(500) },
      )}
    />
  </Frame>
);

/** U4 — the only place the "W/L sits on the finishing round only" rule is visible. */
export const U4Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-ufc-u4",
        {
          ...ufcBase,
          segments_key: "UFC · main",
          segment_index: 2,
          segment_results: [null, null, null, null, null],
        },
        {
          start_date: at(-180),
          end_date: at(-30),
          is_resolved: true,
          winning_option_id: "sg-ufc-u4-o1",
        },
      )}
    />
  </Frame>
);

/* ---------------- B · LiveStage ---------------- */

const stageEvent = {
  id: "sg-stage",
  start_date: at(-60),
  end_date: at(120),
  metadata: {
    ...cs2Base,
    kickoff_at: at(134),
    segment_index: 2,
    stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
};

const stage = (fixture: StageFixture) => () => (
  <Frame>
    <LiveStage event={stageEvent} fixture={fixture} />
  </Frame>
);

export const S1Preview = stage("playing");
export const S2Preview = stage("loading");
export const S3Preview = stage("buffering");
export const S4Preview = stage("paused");
export const S5Preview = stage("blocked");
// S6's kickoff must live in the real future — the frozen NOW is in the past,
// which collapsed the copy to "in 0m". 2h 14m matches the approved canvas.
export const S6Preview = () => (
  <Frame>
    <LiveStage
      event={{
        ...stageEvent,
        metadata: {
          ...cs2Base,
          kickoff_at: new Date(Date.now() + 134 * 60_000).toISOString(),
          segment_index: 2,
          stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        },
      }}
      fixture="prekick"
    />
  </Frame>
);
export const S7Preview = stage("error");
export const S8Preview = stage("forbidden");
export const S9Preview = stage("finished");

/* ---------------- C · mini player / fullscreen / Watch key ---------------- */

const miniEvent = (metadata: Record<string, unknown>) => ({
  id: "sg-mini",
  start_date: at(-60),
  end_date: at(120),
  metadata: { ...metadata, stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
});

/** C1 — CS2 mini player: segment capsule carries `M2 · 9–7`. */
export const C1Preview = () => (
  <Frame>
    <LiveStage
      forceMode="mini"
      fixture="playing"
      event={miniEvent({
        ...cs2Base,
        segment_index: 2,
        segment_results: [{ home: 13, away: 8 }, { home: 9, away: 7 }, null],
      })}
    />
  </Frame>
);

/** C2 — UFC mini player: no per-round score exists, the capsule shows the clock. */
export const C2Preview = () => (
  <Frame>
    <LiveStage
      forceMode="mini"
      fixture="playing"
      event={miniEvent({
        ...ufcBase,
        segment_index: 3,
        segment_results: [null, null, null, null, null],
        clock: 135,
      })}
    />
  </Frame>
);

/** C3 — fullscreen chrome: score string on top, delay pill + two chips below. */
export const C3Preview = () => (
  <Frame>
    <LiveStage
      forceMode="fullscreen"
      fixture="playing"
      yesLabel="Spirit"
      noLabel="MOUZ"
      yesPrice={0.62}
      noPrice={0.38}
      event={miniEvent({
        ...cs2Base,
        home: "Spirit",
        away: "MOUZ",
        segment_index: 2,
        segment_results: [{ home: 13, away: 8 }, { home: 9, away: 7 }, null],
      })}
    />
  </Frame>
);

/** C4 — matchboard header with the Watch key. */
export const C4Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      forceWatchKey
      event={board("sg-cs2-watch", {
        ...cs2Base,
        home: "NAVI",
        away: "FaZe",
        segment_index: 2,
        segment_results: [{ home: 13, away: 8 }, { home: 9, away: 7 }, null],
      })}
    />
  </Frame>
);

/** M7 — mobile sticky bar, forced on. Must own its frame (position: fixed). */
export const M7Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={true}
      event={board("sg-cs2-m7", {
        ...cs2Base,
        segment_index: 2,
        segment_results: [{ home: 13, away: 8 }, { home: 6, away: 4 }, null],
      })}
    />
  </Frame>
);

/* ---------------- F · soccer (SPORT_FALLBACK.soccer) ---------------- */

const soccerBase = {
  sport: "soccer",
  league: "Ligue 1",
  home: "Paris Saint-Germain",
  away: "Marseille",
  home_abbr: "PSG",
  away_abbr: "OM",
  format: "1x2",
};

/** F1 — live second half, 63′. */
export const F1Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-soccer-f1",
        {
          ...soccerBase,
          kickoff_at: at(-63),
          segment_results: [{ home: 1, away: 0 }, { home: 0, away: 0 }],
        },
        { start_date: at(-63), end_date: at(50) },
      )}
    />
  </Frame>
);

/** F2 — upcoming. */
export const F2Preview = () => (
  <Frame>
    <LiveMatchboard
      fixtureNow={NOW}
      fixtureSticky={false}
      event={board(
        "sg-soccer-f2",
        {
          ...soccerBase,
          kickoff_at: at(120),
          segment_results: [null, null],
        },
        { start_date: at(120), end_date: at(230) },
      )}
    />
  </Frame>
);
