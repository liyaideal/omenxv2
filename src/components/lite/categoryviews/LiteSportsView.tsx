// ============================================================
// SPORTS CATEGORY VIEW (7B) — desktop, category chip "Sports".
// Pixel contract: docs/design-contracts/category-views-7.html #7b
// Live matches pinned, ALL day strip, day-grouped ledger.
// Every row/chip routes into the existing /trade contract page.
// ============================================================
import { t } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  DayBucket,
  SportsMatch,
  buildDayGroups,
  buildDayStrip,
  compactVolume,
  isUpcoming,
  kickoffCell,
  liveAt,
  matchesInBucket,
} from "@/components/lite/sports/sportsData";
import { useStreamLineup } from "@/components/lite/sports/streamLineup";
import { MatchScoreText, isTennisTiebreakLive, phaseLabel } from "@/components/lite/sports/tennisScore";
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
import { CHALK, CHALK_SOFT, Crest, DIR_DOWN, DIR_UP, LivePulse } from "@/components/lite/shared/primitives";
import { PlayTriangle, StreamAtKickoffChip } from "@/components/lite/sports/streamChips";
import { ListStreamVideo } from "@/components/lite/sports/ListStreamVideo";
import {
  RemindButton,
  StreamPoster,
  kickoffShort,
  upcomingStreams,
  useNowTick,
} from "@/components/lite/sports/UpcomingStreams";
import { useStreamReminders } from "@/hooks/useStreamReminders";

const SK = "events.screen.simple.sports_view.sports_streams";



const toneOf = (label: string, i: number, total: number) => {
  if (/^draw$/i.test(label)) return CHALK_SOFT;
  if (i === 0) return DIR_UP;
  if (i === total - 1) return DIR_DOWN;
  return CHALK_SOFT;
};

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
      <div className="flex items-center" style={{ gap: 16 }}>
        <span className="flex min-w-0 flex-1 items-center" style={{ gap: 11 }}>
          <Crest abbr={match.homeAbbr} size={38} />
          <span
            className="truncate"
            style={{ fontSize: 17, color: "#fff", fontWeight: 600 }}
            title={match.home}
          >
            {match.homeShort || match.home}
          </span>
        </span>
        <span
          className="font-display flex-none"
          style={{
            fontWeight: 700,
            // 网球三盘串远长于 `1 – 0`，固定 26px 免撞队名；其他运动维持 32px。
            fontSize: match.sport === "tennis" ? 26 : 32,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          <MatchScoreText sport={match.sport} score={match.score} base={32} tennisBase={26} />
        </span>
        <span
          className="flex min-w-0 flex-1 items-center justify-end"
          style={{ gap: 11 }}
        >
          <span
            className="truncate"
            style={{ fontSize: 17, color: "#fff", fontWeight: 600 }}
            title={match.away}
          >
            {match.awayShort || match.away}
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

const liveClock = (m: SportsMatch) =>
  m.liveLabel ?? (m.minute != null ? `${m.minute}'` : "LIVE");

/**
 * Live-stream stage — every live match that carries a stream lives here,
 * one player at a time. Video left, scoreboard + outcome chips right; the
 * switcher under it swaps which stream plays. Live matches without a
 * stream keep the plain LiveCard below the stage.
 */
const LiveStreamStage = ({
  streams,
  streamFixture,
  onOpen,
  onPick,
  onFail,
}: {
  streams: SportsMatch[];
  streamFixture?: "loading" | "blocked" | "error";
  onOpen: (id: string) => () => void;
  onPick: (id: string) => (optionId: string) => (e: React.MouseEvent) => void;
  /** The player can't play this match's stream — take it off the stage. */
  onFail: (id: string) => void;
}) => {
  const [activeId, setActiveId] = useState(streams[0].id);
  const m = streams.find((x) => x.id === activeId) ?? streams[0];
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "#131519",
        border: "1px solid rgba(255,138,61,.28)",
        borderRadius: 18,
        boxShadow: "0 0 0 1px rgba(255,138,61,.06), 0 18px 48px -24px rgba(255,138,61,.35)",
      }}
    >
      <div className="flex">
        <div style={{ flex: "0 0 58%" }}>
          <ListStreamVideo key={m.id} src={m.streamUrl as string} onOpen={onOpen(m.id)} onFail={() => onFail(m.id)} fixture={streamFixture} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ padding: "22px 24px 20px" }}>
          <div className="flex items-center justify-between" style={{ gap: 10 }}>
            <span
              className="truncate"
              style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", fontWeight: 700 }}
            >
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

          <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 12 }}>
            <span className="flex min-w-0 flex-col items-center" style={{ gap: 9 }}>
              <Crest abbr={m.homeAbbr} size={48} />
              <span className="max-w-full truncate" style={{ fontSize: 15, color: "#fff", fontWeight: 600 }} title={m.home}>
                {m.homeShort || m.home}
              </span>
            </span>
            <span
              className="font-display"
              style={{ fontWeight: 700, fontSize: m.sport === "tennis" ? 30 : 46, color: "#fff", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}
            >
              <MatchScoreText sport={m.sport} score={m.score} base={46} tennisBase={30} />
            </span>
            <span className="flex min-w-0 flex-col items-center" style={{ gap: 9 }}>
              <Crest abbr={m.awayAbbr} size={48} />
              <span className="max-w-full truncate" style={{ fontSize: 15, color: "#fff", fontWeight: 600 }} title={m.away}>
                {m.awayShort || m.away}
              </span>
            </span>
          </div>

          <div className="flex flex-col" style={{ gap: 10 }}>
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${m.options.length}, minmax(0, 1fr))`, gap: 8 }}
            >
              {m.options.map((o, i) => (
                <OutcomeChip
                  key={o.id}
                  label={o.label}
                  price={o.price}
                  color={toneOf(o.label, i, m.options.length)}
                  minHeight={54}
                  priceSize={18}
                  onClick={onPick(m.id)(o.id)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between" style={{ fontSize: 11, color: "#6B7280" }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{t(`${SK}.traded`, { volume: compactVolume(m.volume) })}</span>
              <button
                type="button"
                onClick={onOpen(m.id)}
                className="inline-flex items-center"
                style={{ gap: 4, color: "#fff", fontWeight: 600, fontSize: 12 }}
              >
                {t(`${SK}.open_match`)}
                <ArrowRight size={12} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {streams.length > 1 && (
        <div
          className="flex items-center"
          style={{ borderTop: "1px solid #23262D", padding: "10px 14px", gap: 8, overflowX: "auto" }}
        >
          <span
            className="flex-none"
            style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B7280", fontWeight: 700, marginRight: 4 }}
          >
            {t(`${SK}.live_streams`, { count: streams.length })}
          </span>
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
                  gap: 8,
                  padding: "7px 12px",
                  borderRadius: 10,
                  border: `1px solid ${on ? "rgba(255,138,61,.55)" : "#23262D"}`,
                  background: on ? "rgba(255,138,61,.09)" : "transparent",
                  color: on ? "#FF8A3D" : "#9AA1AC",
                }}
              >
                <PlayTriangle />
                <span style={{ fontSize: 12, fontWeight: 700, color: on ? "#fff" : "#C9CED6", whiteSpace: "nowrap" }}>
                  {x.homeAbbr}{" "}
                  <span className="font-display" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <MatchScoreText sport={x.sport} score={x.score} base={12} />
                  </span>{" "}
                  {x.awayAbbr}
                </span>
                <span style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {liveClock(x)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Short option label for narrow chips: team abbr, `Draw` stays. */
/**
 * Short option label for narrow preview chips, by position: first option =
 * home crest abbr, last = away abbr, anything between (`Draw`) as is. Option
 * labels don't always equal the team name (`Man City` vs `Manchester City`).
 */
const chipLabel = (m: SportsMatch, label: string, i: number) =>
  i === 0 ? m.homeAbbr : i === m.options.length - 1 ? m.awayAbbr : label;

const SectionHead = ({ icon, label, aside }: { icon: React.ReactNode; label: string; aside?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center" style={{ gap: 9 }}>
      {icon}
      <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff", fontWeight: 700 }}>
        {label}
      </span>
    </div>
    {aside ? <span style={{ fontSize: 11, color: "#6B7280" }}>{aside}</span> : null}
  </div>
);

/**
 * Rail card, wide — used when the rail holds 1–2 streams, so the row is
 * filled by halves / one full card instead of leaving 3-up gaps.
 */
const PreviewCardWide = ({
  m,
  now,
  reminded,
  onRemind,
  onOpen,
  onPick,
}: {
  m: SportsMatch;
  now: number;
  reminded: boolean;
  onRemind: () => void;
  onOpen: () => void;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    className="flex h-full cursor-pointer overflow-hidden transition-colors hover:border-[rgba(255,138,61,.35)]"
    style={{ background: "#131519", border: "1px solid #23262D", borderRadius: 16 }}
  >
    <div style={{ flex: "0 0 42%", maxWidth: 360 }}>
      <StreamPoster match={m} now={now} fill />
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ padding: "14px 16px", gap: 12 }}>
      <div className="flex min-w-0 flex-col" style={{ gap: 4 }}>
        <span className="truncate" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", fontWeight: 700 }}>
          {m.league} · {kickoffShort(m.kickoff as Date, now)}
        </span>
        <span className="truncate" style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>
          {m.homeShort || m.home} vs {m.awayShort || m.away}
        </span>
      </div>
      <div className="flex" style={{ gap: 6 }}>
        {m.options.map((o, i) => (
          <OutcomeChip
            key={o.id}
            label={chipLabel(m, o.label, i)}
            price={o.price}
            color={toneOf(o.label, i, m.options.length)}
            minHeight={42}
            priceSize={15}
            grow
            onClick={onPick(o.id)}
          />
        ))}
      </div>
      <RemindButton on={reminded} onToggle={onRemind} height={34} />
    </div>
  </div>
);

/** Rail card — one upcoming stream inside the next 48h. */
const PreviewCard = ({
  m,
  now,
  reminded,
  onRemind,
  onOpen,
  onPick,
}: {
  m: SportsMatch;
  now: number;
  reminded: boolean;
  onRemind: () => void;
  onOpen: () => void;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    className="flex cursor-pointer flex-col overflow-hidden transition-colors hover:border-[rgba(255,138,61,.35)]"
    style={{ background: "#131519", border: "1px solid #23262D", borderRadius: 16 }}
  >
    <StreamPoster match={m} now={now} />
    <div className="flex flex-col" style={{ padding: "12px 14px 14px", gap: 11 }}>
      <div className="flex min-w-0 flex-col" style={{ gap: 3 }}>
        <span className="truncate" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", fontWeight: 700 }}>
          {m.league} · {kickoffShort(m.kickoff as Date, now)}
        </span>
        <span className="truncate" style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>
          {m.homeShort || m.home} vs {m.awayShort || m.away}
        </span>
      </div>
      <div className="flex" style={{ gap: 6 }}>
        {m.options.map((o, i) => (
          <OutcomeChip
            key={o.id}
            label={chipLabel(m, o.label, i)}
            price={o.price}
            color={toneOf(o.label, i, m.options.length)}
            minHeight={42}
            priceSize={14}
            grow
            onClick={onPick(o.id)}
          />
        ))}
      </div>
      <RemindButton on={reminded} onToggle={onRemind} height={34} />
    </div>
  </div>
);

/** Horizontal rail — 3 cards per view, arrows appear only when it overflows. */
const PreviewRail = ({
  children,
  count,
  firstId,
}: {
  children: React.ReactNode;
  count: number;
  /** Soonest card. When it changes (data arrives, a match kicks off), snap
   *  would otherwise keep the previously snapped card in view — reset left. */
  firstId?: string;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState({ prev: false, next: false });
  const sync = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [count]);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = 0;
    sync();
  }, [firstId]);
  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: "smooth" });
  const Arrow = ({ dir, on }: { dir: 1 | -1; on: boolean }) => (
    <button
      type="button"
      aria-label={dir === 1 ? t(`${SK}.rail_next`) : t(`${SK}.rail_prev`)}
      disabled={!on}
      onClick={() => go(dir)}
      className="flex items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        border: "1px solid #2A2E36",
        color: on ? "#fff" : "#3A3F48",
        cursor: on ? "pointer" : "default",
      }}
    >
      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {dir === 1 ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
      </svg>
    </button>
  );
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 9 }}>
          <span style={{ color: "#FF8A3D", display: "flex" }}><PlayTriangle /></span>
          <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff", fontWeight: 700 }}>
            {t(`${SK}.coming_up`, { count })}
          </span>
          <span style={{ fontSize: 11, color: "#6B7280" }}>{t(`${SK}.next_48_hours`)}</span>
        </div>
        {(edge.prev || edge.next) && (
          <div className="flex items-center" style={{ gap: 6 }}>
            <Arrow dir={-1} on={edge.prev} />
            <Arrow dir={1} on={edge.next} />
          </div>
        )}
      </div>
      <div
        ref={ref}
        className="grid"
        style={{
          gridAutoFlow: "column",
          // 1 → one full-width card · 2 → halves · 3+ → three per view, arrows.
          gridAutoColumns:
            count === 1 ? "100%" : count === 2 ? "calc((100% - 12px) / 2)" : "calc((100% - 24px) / 3)",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const LedgerRow = ({
  match,
  onOpen,
  onPick,
}: {
  match: SportsMatch;
  onOpen: () => void;
  onPick: (optionId: string) => (e: React.MouseEvent) => void;
}) => {
  const { time } = kickoffCell(match.kickoff);
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
      <span className="flex flex-none items-center" style={{ width: 74 }}>
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
          {match.homeShort || match.home} vs {match.awayShort || match.away}
        </span>
        <span className="flex min-w-0 items-center" style={{ gap: 8 }}>
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
          </span>
          {match.streamUrl ? <StreamAtKickoffChip /> : null}
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
  defaultLeague,
  remindedFixture,
  remindGuestFixture,
  streamFixture,
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
  /** Style-guide only — preselect a league so a preset renders the filtered ledger. */
  defaultLeague?: string;
  /** Style-guide only — events already reminded; toggles stay local, no DB. */
  remindedFixture?: string[];
  /** Style-guide only — Remind me behaves as for a guest (opens sign-in). */
  remindGuestFixture?: boolean;
  /** Style-guide only — freeze the stage player (loading / autoplay blocked / stream failed). */
  streamFixture?: "loading" | "blocked" | "error";
}) => {
  const navigate = useNavigate();
  const [bucket, setBucket] = useState("all");
  const [sport, setSport] = useState<string>(defaultSport ?? ALL_OPTION);
  const [league, setLeague] = useState<string>(defaultLeague ?? ALL_OPTION);
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

  const tick = useNowTick(now);
  const reminders = useStreamReminders(remindedFixture, remindGuestFixture);
  const nowMs = now ?? tick;
  // Streams within 48h → the preview rail (always the rail, never the stage).
  const previews = useMemo(() => upcomingStreams(scoped, nowMs), [scoped, nowMs]);
  // Live + playable stream → the stage (busiest first); the rest keep LiveCard.
  const { streamed, others: playingNow, isOnStream, markFailed } = useStreamLineup(scoped, nowMs);
  // Style-guide frames (frozen clock) keep their stage whatever the network
  // does; only fixture "error" demonstrates a stream leaving the stage.
  const onStreamFail = now == null || streamFixture === "error" ? markFailed : () => undefined;
  const days: DayBucket[] = useMemo(
    () => buildDayStrip(scoped, clock),
    [scoped, clock],
  );
  // Header count stays consistent with the strip + ledger: live now plus
  // everything still to kick off. Past/finished matches are never counted.
  const weekCount = useMemo(
    () => scoped.filter((m) => liveAt(m, nowMs) || isUpcoming(m, nowMs)).length,
    [scoped, nowMs],
  );
  const groups = useMemo(
    () => buildDayGroups(matchesInBucket(scoped, bucket), nowMs, isOnStream),
    [scoped, bucket, nowMs, isOnStream],
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
            {t("events.screen.simple.all_stage.sports_stage_card.sports_match_winners")}
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
            {t("events.screen.simple.home.home_sports_card.who_wins_the_match")}
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
            {t("events.screen.simple.sports_view.sports_vertical_chrome.matches_this_week")}
          </span>
        </span>
      </div>

      {/* Dimension filter rows — SPORT, then LEAGUE (13A). */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        <DimensionRow label={t("events.screen.simple.sports_view.sports_vertical.sport")} labelWidth={66}>
          <DimensionPill
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
          <DimensionRow label={t("common.league")} labelWidth={66}>
            <DimensionPill
              label={t("common.all")}
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
          </DimensionRow>
        )}
      </div>

      {boostEmpty && (
        <EmptyState
          variant="page"
          title={t("events.screen.simple.crypto_view.crypto_vertical.nothing_boosted_here_yet")}
          illustrationSrc="/assets/desktop/empty-no-boost.png"
        />
      )}

      {!boostEmpty && (
        <>
      {/* Priority: live on stream → coming up on stream → other live matches → ledger. */}
      {(() => {
        // Previews always live in the rail (CPO 2026-11-04: no preview stage).
        const rail = previews;
        const others = playingNow;
        const pulse = <LivePulse size={6} color="#FF3B4E" />;
        const play = (
          <span style={{ color: "#FF8A3D", display: "flex" }}>
            <PlayTriangle />
          </span>
        );
        return (
          <>
            {streamed.length > 0 && (
              <div className="flex flex-col" style={{ gap: 10 }}>
                <SectionHead icon={pulse} label={t(`${SK}.live_on_stream`, { count: streamed.length })} />
                <LiveStreamStage streams={streamed} streamFixture={streamFixture} onOpen={open} onPick={pick} onFail={onStreamFail} />
              </div>
            )}
            {rail.length > 0 && (
              <PreviewRail count={rail.length} firstId={rail[0]?.id}>
                {rail.map((m) => (
                  <div key={m.id} style={{ scrollSnapAlign: "start" }}>
                    {rail.length <= 2 ? (
                      <PreviewCardWide m={m} now={nowMs} reminded={reminders.has(m.id)} onRemind={() => reminders.toggle(m.id)} onOpen={open(m.id)} onPick={pick(m.id)} />
                    ) : (
                      <PreviewCard m={m} now={nowMs} reminded={reminders.has(m.id)} onRemind={() => reminders.toggle(m.id)} onOpen={open(m.id)} onPick={pick(m.id)} />
                    )}
                  </div>
                ))}
              </PreviewRail>
            )}
            {others.length > 0 && (
              <div className="flex flex-col" style={{ gap: 10 }}>
                <SectionHead icon={pulse} label={t("events.screen.simple.sports_view.sports_vertical.playing_now", { count: others.length })} />
                {others.map((m) => (
                  <LiveCard key={m.id} match={m} onOpen={open(m.id)} onPick={pick(m.id)} />
                ))}
              </div>
            )}
          </>
        );
      })()}

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
