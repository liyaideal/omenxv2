import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  progress?: { value: number; target: number };
  reward?: ReactNode;
  action: ReactNode;
}) => {
  const isMobile = useIsMobile();
  const pct = progress ? Math.min(100, (progress.value / progress.target) * 100) : 0;

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
            className={`h-[5px] w-full overflow-hidden rounded-full bg-[#1D2026] ${isMobile ? "" : "max-w-[280px]"}`}
          >
              <div className="h-full rounded-full bg-[#33D6FF]" style={{ width: `${pct}%` }} />
            </div>
            <span className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-[#9AA1AC]">
              <strong className="font-bold text-white">${progress.value}</strong> / ${progress.target}
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
