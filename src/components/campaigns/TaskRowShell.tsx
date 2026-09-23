import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Tier marker on the progress bar (tiered tasks only). `pct` is the marker's
 * position along the bar; `state` picks the dot colour; `label` is the
 * desktop hover tooltip (`Tier 4 · $30,000 → $40 USDC · Credited`).
 */
export interface TaskRowTick {
  pct: number;
  state: "pending" | "reached" | "credited";
  label?: ReactNode;
}

const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * The one row recipe shared by campaign grant tasks and referral invites
 * (design contract .task): #131519 card, 1px #1D2026 border, r14, 15/16 padding,
 * 36px round icon slot, title + subline, optional progress bar, right slot.
 *
 * Mobile (<768px) switches to the two-layer stack: icon + copy + full-width
 * progress on top, a hairline divider, then reward on the left and the action
 * on the right. The desktop three-column layout is unchanged.
 */
export const TaskRowShell = ({
  icon: Icon,
  title,
  subtitle,
  muted,
  dashed,
  faded,
  progress,
  reward,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  muted?: boolean;
  dashed?: boolean;
  faded?: boolean;
  /**
   * `pct` overrides the linear value/target fill (tiered rows fill
   * ordinally, one equal segment per tier); `ticks` draws tier markers.
   */
  progress?: { value: number; target: number; pct?: number; ticks?: TaskRowTick[] };
  reward?: ReactNode;
  action: ReactNode;
}) => {
  const isMobile = useIsMobile();
  const pct = progress
    ? Math.min(100, progress.pct ?? (progress.value / progress.target) * 100)
    : 0;

  const shellStyle = {
    background: muted ? "#101216" : "#131519",
    borderColor: "#1D2026",
    borderStyle: dashed ? "dashed" : "solid",
    borderWidth: 1,
    padding: "15px 16px",
    opacity: faded ? 0.5 : 1,
  } as const;

  const iconSlot = (
    <div
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
      style={{ background: muted ? "#15181D" : "#1B1E24", color: muted ? "#6B7280" : "#C9CED6" }}
    >
      <Icon size={17} strokeWidth={1.75} />
    </div>
  );

  const copySlot = (
    <div className="min-w-0 flex-1">
        <div className="font-display text-[14px] font-bold" style={{ color: muted ? "#9AA1AC" : "#ffffff" }}>
          {title}
        </div>
        {subtitle && <div className="mt-0.5 text-[12px] text-[#9AA1AC]">{subtitle}</div>}
        {progress && (
          <div className="mt-2 flex items-center gap-2">
          <div
            className={`relative h-[5px] w-full rounded-full bg-[#1D2026] ${progress.ticks ? "" : "overflow-hidden"} ${isMobile ? "" : "max-w-[280px]"}`}
          >
              <div className="h-full rounded-full bg-[#33D6FF]" style={{ width: `${pct}%` }} />
              {progress.ticks?.map((tick, i) => {
                const dot = (
                  <span
                    data-tier-tick={tick.state}
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${tick.pct}%`,
                      background: tick.state === "pending" ? "#2B2F38" : "#33D6FF",
                      boxShadow: `0 0 0 2px ${muted ? "#101216" : "#131519"}`,
                    }}
                  >
                    {tick.state === "credited" && (
                      <span className="absolute inset-[2px] rounded-full bg-[#0A0B0D] opacity-55" />
                    )}
                  </span>
                );
                if (!tick.label || isMobile) return <span key={i}>{dot}</span>;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>{dot}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="border-[#2B2F38] bg-[#1B1E24] font-display text-[11.5px] text-[#F2F3F5]"
                    >
                      {tick.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <span className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-[#9AA1AC]">
              <strong className="font-bold text-white">{fmtUsd(progress.value)}</strong> / {fmtUsd(progress.target)}
            </span>
          </div>
        )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="rounded-[14px] border" style={shellStyle}>
        <div className="flex items-start gap-[14px]">
          {iconSlot}
          {copySlot}
        </div>
        <div
          className="mt-3 flex items-center justify-between gap-3 pt-3"
          style={{ borderTop: "1px solid #1D2026" }}
        >
          <div className="min-w-0">{reward}</div>
          <div className="flex shrink-0 items-center justify-end">{action}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[14px] rounded-[14px] border" style={shellStyle}>
      {iconSlot}
      {copySlot}
      <div className="flex shrink-0 items-center gap-3">
        {reward}
        {action}
      </div>
    </div>
  );
};

/** The single white claim button used across campaign + referral rows. */
export const ClaimButton = ({
  onClick,
  disabled,
  children,
  fullWidth,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE] disabled:opacity-60 ${
      fullWidth ? "w-full" : ""
    }`}
    style={fullWidth ? { minHeight: 44 } : undefined}
  >
    {children}
  </button>
);
