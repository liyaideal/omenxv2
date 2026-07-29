// ============================================================
// "What the crowd thinks" split bar. MARKET axis only (yes = Pulse Blue,
// no = Volt Green). Pure presentational so the playground can drive it.
// ============================================================
interface Props {
  yesLabel: string;
  noLabel: string;
  /** 1..99 */
  yesPct: number;
  compact?: boolean;
}

export const LiteSentimentBar = ({ yesLabel, noLabel, yesPct, compact }: Props) => {
  const yes = Math.max(1, Math.min(99, Math.round(yesPct)));
  const no = 100 - yes;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          What the crowd thinks
        </div>
      </div>
      <div
        className="flex overflow-hidden rounded-[11px] border border-border"
        style={{ height: compact ? 38 : 44 }}
      >
        <div
          className="flex items-center bg-gradient-to-r from-yes/30 to-yes/15 px-3 text-xs font-semibold text-yes"
          style={{ width: `${yes}%`, borderRight: "2px solid hsl(var(--background))" }}
        >
          {yesLabel} {yes}%
        </div>
        <div className="flex flex-1 items-center justify-end bg-gradient-to-r from-no/15 to-no/25 px-3 text-xs font-semibold text-no">
          {no}% {noLabel}
        </div>
      </div>
    </div>
  );
};

export default LiteSentimentBar;