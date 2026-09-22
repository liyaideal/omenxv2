import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Settings · ACCOUNT-family card grammar (CPO 2026-09-22, mock v5).
 *
 * Every Settings card is one `trading-card` with:
 *   · header = 11px uppercase micro-label (Wallet "SAVED ADDRESSES" voice);
 *     the right slot holds a VALUE or COUNT only (`Email & password`,
 *     `3 devices`) — never a sentence;
 *   · optional 12px muted description line under the label, only where it
 *     adds information;
 *   · body = hairline rows (`py-3.5 border-b border-[#1D2026]`, Wallet
 *     saved-address rows): 18px muted lucide icon · 14px/500 title · 12px
 *     muted sub (mono for addresses / emails) · right slot (outline sm h-8
 *     button, capsule, switch, chevron);
 *   · capsules from the productLineBadge shape.
 * Locked in DESIGN.md §Addendum 2026-09-22.
 */

export const SettingsCard = ({
  label,
  value,
  description,
  children,
  className,
  compact,
}: {
  label: string;
  /** Right slot: a value or a count only. */
  value?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Mobile: p-4 instead of p-6. */
  compact?: boolean;
}) => (
  <section className={cn("trading-card", compact ? "p-4" : "p-6", className)}>
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {value !== undefined && value !== null && (
        <span className="text-xs text-muted-foreground shrink-0">{value}</span>
      )}
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>}
    <div className={cn(description ? "mt-2" : "mt-1")}>{children}</div>
  </section>
);

export const SettingsRow = ({
  icon: Icon,
  iconClassName,
  title,
  titleClassName,
  sub,
  subMono,
  subClassName,
  right,
  last,
  onClick,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  title: ReactNode;
  titleClassName?: string;
  sub?: ReactNode;
  subMono?: boolean;
  subClassName?: string;
  right?: ReactNode;
  last?: boolean;
  /** Whole row is a button (More links). */
  onClick?: () => void;
  className?: string;
}) => {
  const body = (
    <>
      {Icon && <Icon className={cn("w-[18px] h-[18px] text-muted-foreground shrink-0", iconClassName)} />}
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium flex items-center gap-2 flex-wrap", titleClassName)}>{title}</div>
        {sub && (
          <div
            className={cn(
              "text-xs text-muted-foreground mt-0.5 truncate",
              subMono && "font-mono text-[13px]",
              subClassName,
            )}
          >
            {sub}
          </div>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center">{right}</div>}
    </>
  );
  const cls = cn(
    "flex items-center gap-3 py-3.5",
    !last && "border-b border-[#1D2026]",
    last && "pb-0",
    onClick && "w-full text-left hover:text-foreground transition-colors",
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
};

export type SettingsCapsuleTone = "muted" | "primary" | "accent";

const CAPSULE_TONE: Record<SettingsCapsuleTone, string> = {
  muted: "border-border text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  accent: "border-accent/40 bg-accent/15 text-accent",
};

export const SettingsCapsule = ({ tone = "muted", children }: { tone?: SettingsCapsuleTone; children: ReactNode }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-[0.04em] leading-4 whitespace-nowrap",
      CAPSULE_TONE[tone],
    )}
  >
    {children}
  </span>
);

/** 11px footnote under a card body. */
export const SettingsNote = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("text-[11px] text-muted-foreground leading-relaxed mt-3.5", className)}>{children}</p>
);
