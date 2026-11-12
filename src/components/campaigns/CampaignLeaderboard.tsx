import { t } from "@/i18n";
import type { CampaignLeaderboardDef, CampaignLeaderboardRow } from "@/hooks/useCampaigns";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * CampaignLeaderboard — the optional ranking block of a campaign entry (rules.leaderboard),
 * approved on the mock canvas 2026-11-12. Ranks the campaign's participants by one task.
 *
 * Ranks 1–3 are the leaders strip (three hairline-split columns on desktop, three rows on the phone);
 * the rest is a compact list.
 * The viewer's own row is pinned last — inside the list when ranked in the top N, appended
 * below it otherwise, and shown with a dash when they have no score yet.
 * Presentational only: rows come from `useCampaignLeaderboard()`.
 */

const CARD = "overflow-hidden rounded-[14px] border border-[#1D2026] bg-[#131519]";

const Avatar = ({ name, size, me }: { name: string; size: number; me?: boolean }) => (
  <span
    className="grid shrink-0 place-items-center rounded-full font-display font-bold"
    style={{
      height: size,
      width: size,
      fontSize: Math.round(size * 0.38),
      background: me ? "#0E2C36" : "#1B1E24",
      color: me ? "#33D6FF" : "#C9CED6",
    }}
    aria-hidden="true"
  >
    {name.slice(0, 1).toUpperCase()}
  </span>
);

const fmt = (n: number) => n.toLocaleString("en-US");

/** Thin bar under a leader's name: how far they are from the first place. */
const GapBar = ({ share, lead }: { share: number; lead: boolean }) => (
  <div className="h-[3px] overflow-hidden rounded-full bg-[#1D2026]" aria-hidden="true">
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%`, background: lead ? "#CFFF4A" : "#4A505C" }}
    />
  </div>
);

/**
 * One of the three leaders (design D, approved on the mock canvas 2026-11-12): no boxes and no avatars —
 * a big rank numeral (volt for first), the score, the name, and a thin bar showing the gap to first place.
 * Desktop: a column, split from its neighbours by a hairline. Phone: a row with the same parts.
 */
const Leader = ({
  row,
  unit,
  prize,
  youLabel,
  share,
  mobile,
  first,
}: {
  row: CampaignLeaderboardRow;
  unit?: string;
  prize?: string;
  youLabel: string;
  /** This leader's score as a share of the first place's (0–1). */
  share: number;
  mobile: boolean;
  /** First in the strip: no divider before it. */
  first: boolean;
}) => {
  const lead = row.rank === 1;
  const numeralColour = lead ? "#CFFF4A" : "#C9CED6";
  const name = (
    <span className="break-words [overflow-wrap:anywhere]" style={{ color: row.isMe ? "#33D6FF" : "#F2F3F5" }}>
      {row.isMe ? youLabel : row.username}
    </span>
  );
  const prizeLine = prize && (
    <div className="mt-1 whitespace-nowrap font-display text-[11.5px] font-bold text-[#33D6FF]" data-board-prize>
      {prize}
    </div>
  );
  if (mobile) {
    return (
      <div
        className="flex items-center gap-[14px] px-4 py-[14px]"
        style={first ? undefined : { borderTop: "1px solid #1D2026" }}
        data-board-tile={row.rank}
      >
        <span className="w-[26px] shrink-0 font-display text-[30px] font-bold leading-none" style={{ color: numeralColour }}>
          {row.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{name}</div>
          {prizeLine}
          <div className="mt-2">
            <GapBar share={share} lead={lead} />
          </div>
        </div>
        <span className="shrink-0 font-display text-[20px] font-bold leading-none tabular-nums text-white">
          {fmt(row.value)}
        </span>
      </div>
    );
  }
  return (
    <div
      className="min-w-0 flex-1 px-[22px] pb-[22px] pt-5"
      style={first ? undefined : { borderLeft: "1px solid #1D2026" }}
      data-board-tile={row.rank}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-[44px] font-bold leading-[0.9]" style={{ color: numeralColour }}>
          {row.rank}
        </span>
        <span className="flex items-baseline gap-[5px] whitespace-nowrap">
          <span className="font-display text-[22px] font-bold leading-none tabular-nums text-white">{fmt(row.value)}</span>
          {unit && <span className="text-[12px] text-[#9AA1AC]">{unit}</span>}
        </span>
      </div>
      <div className="mt-4 text-[14.5px] font-semibold">{name}</div>
      {prizeLine}
      <div className="mt-3">
        <GapBar share={share} lead={lead} />
      </div>
    </div>
  );
};

const ListRow = ({
  rank,
  name,
  value,
  me,
  prize,
  avatarName,
}: {
  rank: string;
  name: string;
  /** Initial shown in the avatar when `name` is the "You" label. */
  avatarName?: string;
  value: string;
  me?: boolean;
  prize?: string;
}) => (
  <div
    className="flex min-h-[44px] items-center gap-3 px-4 py-2"
    style={me ? { background: "#1B1E24", borderTop: "1px solid #2B2F38" } : { borderTop: "1px solid #1D2026" }}
    data-board-row={me ? "me" : rank}
  >
    <span
      className="w-7 shrink-0 font-mono text-[13px] tabular-nums"
      style={{ color: me ? "#33D6FF" : "#9AA1AC", fontWeight: me ? 700 : 500 }}
    >
      {rank}
    </span>
    <Avatar name={avatarName ?? name} size={24} me={me} />
    <span
      className="min-w-0 flex-1 break-words text-[13px] [overflow-wrap:anywhere]"
      style={{ color: me ? "#33D6FF" : "#F2F3F5", fontWeight: me ? 600 : 400 }}
    >
      {name}
      {prize && (
        <span className="mt-0.5 block whitespace-nowrap font-display text-[11.5px] font-bold text-[#33D6FF]" data-board-prize>
          {prize}
        </span>
      )}
    </span>
    <span
      className="shrink-0 font-mono text-[13px] font-bold tabular-nums"
      style={{ color: me ? "#33D6FF" : "#ffffff" }}
    >
      {value}
    </span>
  </div>
);

export const CampaignLeaderboard = ({
  def,
  rows,
  isLoading,
  isError,
  unit,
  signedOut,
  hideMe,
}: {
  def: CampaignLeaderboardDef;
  rows: CampaignLeaderboardRow[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  /** Unit word after the big number on tiles (`tickets`); omit for plain numbers. */
  unit?: string;
  signedOut?: boolean;
  /** The viewer cannot take part (not eligible): no "You" row. */
  hideMe?: boolean;
}) => {
  const isMobile = useIsMobile();
  const top = def.top ?? 10;
  const title = def.title ?? t("rewards.screen.campaign_leaderboard.title", { count: top });
  const youLabel = t("rewards.screen.campaign_leaderboard.you");
  const prizeOf = (rank: number) => def.prizes?.find((p) => p.rank === rank)?.label;

  const heading = <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{title}</div>;

  let body: JSX.Element;
  if (isLoading) {
    body = (
      <div className={CARD} data-board-state="loading" aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex h-11 items-center gap-3 px-4" style={{ borderTop: i ? "1px solid #1D2026" : undefined }}>
            <span className="h-3 w-5 animate-pulse rounded bg-[#1D2026]" />
            <span className="h-6 w-6 animate-pulse rounded-full bg-[#1D2026]" />
            <span className="h-3 flex-1 animate-pulse rounded bg-[#1D2026]" style={{ maxWidth: 180 }} />
            <span className="h-3 w-6 animate-pulse rounded bg-[#1D2026]" />
          </div>
        ))}
      </div>
    );
  } else if (isError) {
    body = (
      <div className={`${CARD} px-4 py-5 text-[12.5px] text-[#9AA1AC]`} data-board-state="error">
        {t("rewards.screen.campaign_leaderboard.load_error")}
      </div>
    );
  } else {
    const all = rows ?? [];
    const ranked = all.filter((r) => r.rank <= top);
    const me = all.find((r) => r.isMe);
    if (ranked.length === 0) {
      body = (
        <div className={`${CARD} px-4 py-5 text-[12.5px] text-[#9AA1AC]`} data-board-state="empty">
          {t("rewards.screen.campaign_leaderboard.empty")}
        </div>
      );
    } else {
      const tileCount = 3;
      const tiles = ranked.slice(0, tileCount);
      const list = ranked.slice(tileCount);
      const meOutside = me && me.rank > top;
      const showDash = !signedOut && !hideMe && !me;
      const topValue = tiles[0]?.value ?? 0;
      body = (
        <div className={CARD} data-board-state="ready">
          <div className={isMobile ? "" : "flex"}>
            {tiles.map((r, i) => (
              <Leader
                key={r.rank}
                row={r}
                unit={unit}
                prize={prizeOf(r.rank)}
                youLabel={youLabel}
                share={topValue > 0 ? r.value / topValue : 0}
                mobile={isMobile}
                first={i === 0}
              />
            ))}
          </div>
          {list.map((r) => (
            <ListRow
              key={r.rank}
              rank={String(r.rank)}
              name={r.isMe ? youLabel : r.username}
              avatarName={r.username}
              value={fmt(r.value)}
              me={r.isMe}
              prize={prizeOf(r.rank)}
            />
          ))}
          {meOutside && <ListRow rank={String(me!.rank)} name={youLabel} avatarName={me!.username} value={fmt(me!.value)} me />}
          {showDash && <ListRow rank="—" name={youLabel} value="—" me />}
        </div>
      );
    }
  }

  return (
    <section className="space-y-3" data-campaign-leaderboard>
      {heading}
      {body}
    </section>
  );
};
