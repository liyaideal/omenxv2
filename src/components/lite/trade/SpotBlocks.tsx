// ============================================================
// Shared trade-page blocks extracted verbatim from LiteSpotTrade so the
// crypto quick-round page can reuse the SAME visual species.
// Markup/classes are byte-identical to the stock page originals.
// ============================================================
import { cn } from "@/lib/utils";
import { ShareIconButton } from "@/components/lite/share/ShareIconButton";


// -------- "What the crowd thinks" split bar --------
export const SpotSentimentBar = ({
  yesLabel,
  noLabel,
  yesPct,
  volText,
}: {
  yesLabel: string;
  noLabel: string;
  /** 1..99 */
  yesPct: number;
  volText: string;
}) => {
  const upPct = Math.max(1, Math.min(99, Math.round(yesPct)));
  const downPct = 100 - upPct;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          What the crowd thinks
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          Vol {volText}
        </div>
      </div>
      <div className="flex h-11 overflow-hidden rounded-[11px] border border-border">
        <div
          className="flex items-center bg-gradient-to-r from-yes/30 to-yes/15 px-3 text-xs font-semibold text-yes"
          style={{ width: `${upPct}%`, borderRight: "2px solid hsl(var(--background))" }}
        >
          {yesLabel} {upPct}%
        </div>
        <div className="flex flex-1 items-center justify-end bg-gradient-to-r from-no/15 to-no/25 px-3 text-xs font-semibold text-no">
          {downPct}% {noLabel}
        </div>
      </div>
    </div>
  );
};

// -------- Settlement rail --------
export interface RailNode {
  key: string;
  label: string;
  time: string;
  /** Marks the pulsing "Trading NOW" node. */
  now?: boolean;
}

export const SpotRailTrack = ({
  blocked,
  settled,
  nodes,
}: {
  blocked: boolean;
  /** Settled events render every node complete. */
  settled?: boolean;
  nodes: RailNode[];
}) => (
  <div>
    <div className="relative h-[2px] rounded-full bg-border">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: blocked || settled ? "100%" : "50%",
          background: "linear-gradient(90deg, #013281 0%, #33D6FF 100%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-between">
        {nodes.map((n, i) => {
          const isNow = !!n.now;
          return (
            <span
              key={n.key}
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isNow ? "bg-yes shadow-[0_0_0_4px_rgba(51,214,255,.18)]" : "bg-border",
                (settled || i < 2) && !isNow ? "bg-yes/60" : "",
              )}
            />
          );
        })}
      </div>
    </div>
    <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
      {nodes.map((n) => (
        <div key={n.key} className="max-w-[80px] text-center">
          <div className="font-medium text-foreground">{n.label}</div>
          {n.time && <div className="font-mono">{n.time}</div>}
        </div>
      ))}
    </div>
  </div>
);

export const SpotSettlementRail = ({
  blocked,
  settled,
  tradingNow,
  nodes,
}: {
  blocked: boolean;
  settled?: boolean;
  tradingNow: boolean;
  nodes: RailNode[];
}) => (
  <div className="rounded-2xl border border-border bg-muted/20 p-4">
    <div className="mb-3 flex items-center justify-between">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        How it settles
      </div>
      {tradingNow && (
        <span className="flex items-center gap-1 text-[11px] font-medium text-yes">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yes" />
          Trading now
        </span>
      )}
    </div>
    <SpotRailTrack blocked={blocked} settled={settled} nodes={nodes} />
  </div>
);

// -------- Position cell --------
export const PosCell = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red" | "yes";
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div
      className={cn(
        "font-mono text-sm font-semibold",
        tone === "green" && "text-trading-green",
        tone === "red" && "text-trading-red",
        tone === "yes" && "text-yes",
      )}
    >
      {value}
    </div>
  </div>
);

// -------- Your position card --------
export const SpotYourPosition = ({
  sideLabel,
  isYesSide,
  sizeDisplay,
  pnl,
  pnlPercent,
  currentValue,
  avgCost,
  ifWinsLabel,
  ifWinsValue,
  cashOutDisabledText,
  onCashOut,
  onShare,
}: {
  sideLabel: string;
  isYesSide: boolean;
  sizeDisplay: string;
  pnl: string;
  pnlPercent: string;
  currentValue: number;
  avgCost: string;
  ifWinsLabel: string;
  ifWinsValue: string;
  /** When set, Cash out is disabled and this note renders below it. */
  cashOutDisabledText?: string;
  onCashOut: () => void;
  /** Pure-display share entry (SH-b §1). Omitted = zero DOM change. */
  onShare?: () => void;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-semibold",
            isYesSide ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
          )}
        >
          {sideLabel}
        </span>
        <span className="font-mono text-sm">{sizeDisplay} shares</span>
        <span
          className={cn(
            "font-mono text-sm font-semibold",
            pnl.startsWith("-") ? "text-trading-red" : "text-trading-green",
          )}
        >
          {pnl.startsWith("-") ? "▼" : "▲"} {pnl} / {pnlPercent}
        </span>
      </div>
      {onShare && <ShareIconButton onClick={onShare} />}
    </div>

    <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-xs">
      <PosCell label="Current value" value={`$${currentValue.toFixed(2)}`} />
      <PosCell label="Avg cost" value={avgCost} />
      <PosCell label="Profit" value={pnl} tone={pnl.startsWith("-") ? "red" : "green"} />
      <PosCell label={ifWinsLabel} value={ifWinsValue} tone="yes" />
    </div>
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={cashOutDisabledText ? undefined : onCashOut}
        disabled={!!cashOutDisabledText}
        className={cn(
          "h-9 w-full rounded-lg bg-muted text-xs font-semibold",
          cashOutDisabledText ? "opacity-50" : "hover:bg-muted/80",
        )}
      >
        Cash out ·{" "}
        <span className="font-mono">${currentValue.toFixed(2)}</span>
      </button>
      {cashOutDisabledText && (
        <p className="mt-2 text-[11px] text-muted-foreground">{cashOutDisabledText}</p>
      )}
    </div>
  </div>
);