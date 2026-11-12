import { t } from "@/i18n";
import type { CampaignLeaderboardDef, CampaignLeaderboardRow } from "@/hooks/useCampaigns";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * CampaignLeaderboard — the optional ranking block of a campaign entry (rules.leaderboard),
 * approved on the mock canvas 2026-11-12. Ranks the campaign's participants by one task.
 *
 * Desktop: ranks 1–3 as three tiles (big number), the rest as a compact list.
 * Phone: rank 1 as a tile, 2…N as the list (three tiles side by side break long names).
 * The viewer's own row is pinned last — inside the list when ranked in the top N, appended
 * below it otherwise, and shown with a dash when they have no score yet.
 * Presentational only: rows come from `useCampaignLeaderboard()`.
 */

const CARD = "overflow-hidden rounded-[14px] border border-[#1D2026] bg-[#131519]";

const Avatar = ({ name, size, lit }: { name: string; size: number; lit?: boolean }) => (
  <span
    className="grid shrink-0 place-items-center rounded-full font-display font-bold"
    style={{
      height: size,
      width: size,
      fontSize: Math.round(size * 0.38),
      background: lit ? "#2A3310" : "#1B1E24",
      color: lit ? "#CFFF4A" : "#C9CED6",
    }}
    aria-hidden="true"
  >
    {name.slice(0, 1).toUpperCase()}
  </span>
);

const RankBadge = ({ rank }: { rank: number }) => (
  <span
    className="grid h-[22px] min-w-[22px] place-items-center rounded-full font-mono text-[12px] font-bold tabular-nums"
    style={{ background: rank === 1 ? "#CFFF4A" : "#1B1E24", color: rank === 1 ? "#0A0B0D" : "#C9CED6" }}
  >
    {rank}
  </span>
);

const fmt = (n: number) => n.toLocaleString("en-US");

const Tile = ({
  row,
  unit,
  prize,
  youLabel,
}: {
  row: CampaignLeaderboardRow;
  unit?: string;
  prize?: string;
  youLabel: string;
}) => (
  <div
    className="min-w-0 rounded-[12px] bg-[#0F1115] p-[14px]"
    style={{ border: `1px solid ${row.rank === 1 ? "#4A5C1B" : "#1D2026"}` }}
    data-board-tile={row.rank}
  >
    <div className="flex items-center gap-[10px]">
      <RankBadge rank={row.rank} />
      <Avatar name={row.username} size={36} lit={row.rank === 1} />
      <span
        className="min-w-0 break-words text-[13px] font-semibold [overflow-wrap:anywhere]"
        style={{ color: row.isMe ? "#33D6FF" : "#F2F3F5" }}
      >
        {row.isMe ? youLabel : row.username}
      </span>
    </div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className="font-display text-[24px] font-bold leading-none tabular-nums text-white">{fmt(row.value)}</span>
      {unit && <span className="text-[12px] text-[#9AA1AC]">{unit}</span>}
    </div>
    {prize && (
      <div
        className="mt-[10px] inline-flex rounded-full border border-[#1D2026] bg-[#131519] px-[10px] py-[5px] font-display text-[11.5px] font-bold text-[#33D6FF]"
        data-board-prize
      >
        {prize}
      </div>
    )}
  </div>
);

const ListRow = ({
  rank,
  name,
  value,
  me,
  prize,
}: {
  rank: string;
  name: string;
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
    <Avatar name={name} size={24} />
    <span
      className="min-w-0 flex-1 break-words text-[13px] [overflow-wrap:anywhere]"
      style={{ color: me ? "#33D6FF" : "#F2F3F5", fontWeight: me ? 600 : 400 }}
    >
      {name}
      {prize && <span className="ml-2 font-display text-[11.5px] font-bold text-[#33D6FF]">{prize}</span>}
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
      const tileCount = isMobile ? 1 : 3;
      const tiles = ranked.slice(0, tileCount);
      const list = ranked.slice(tileCount);
      const meOutside = me && me.rank > top;
      const showDash = !signedOut && !hideMe && !me;
      body = (
        <div className={CARD} data-board-state="ready">
          <div
            className={isMobile ? "p-3" : "grid gap-3 p-[14px]"}
            style={isMobile ? undefined : { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            {tiles.map((r) => (
              <Tile key={r.rank} row={r} unit={unit} prize={prizeOf(r.rank)} youLabel={youLabel} />
            ))}
          </div>
          {list.map((r) => (
            <ListRow
              key={r.rank}
              rank={String(r.rank)}
              name={r.isMe ? youLabel : r.username}
              value={fmt(r.value)}
              me={r.isMe}
              prize={prizeOf(r.rank)}
            />
          ))}
          {meOutside && <ListRow rank={String(me!.rank)} name={youLabel} value={fmt(me!.value)} me />}
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
