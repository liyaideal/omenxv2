import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LynxFigure, LynxMark } from "@/components/brand";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "page" | "module" | "card" | "inline";
export type EmptyStateMascot = "figure" | "mark" | "none";

export interface EmptyStateProps {
  /** Line 1 — the fact. "Nothing starred yet". */
  title: string;
  /** Line 2 — the method. How this list fills up. */
  description?: string;
  /** `page` (default) vertical block. `module` compact horizontal row. */
  variant?: EmptyStateVariant;
  /** Defaults to `figure` on page, `mark` on module. */
  mascot?: EmptyStateMascot;
  /** Pill action. Renders a <button> with onClick or an <a> with href. */
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  /** Escape hatch for a custom node (legacy call sites). Prefer actionLabel. */
  action?: ReactNode;
  /** Deprecated — mascot replaces per-instance icons. Accepted, not rendered. */
  icon?: LucideIcon;
  /** Suppress the dashed border (e.g. inside an already bordered card). */
  bordered?: boolean;
  className?: string;
}

const TITLE_CLS = "font-display text-[15px] font-semibold tracking-tight text-foreground";
const DESC_CLS = "font-sans text-xs leading-relaxed text-muted-foreground";
const PILL_CLS =
  "inline-flex items-center rounded-full border-[1.5px] border-border bg-transparent px-[18px] py-2 text-[13px] text-foreground/80 transition-colors hover:text-foreground";

/**
 * Canonical site-wide empty state (DESIGN.md §Empty states).
 *
 * Anatomy: lynx mascot → fact line → method line → optional pill action.
 * Blue underlined text links inside empty states are abolished — use the pill.
 */
export const EmptyState = ({
  title,
  description,
  variant = "page",
  mascot,
  actionLabel,
  onAction,
  href,
  action,
  bordered = true,
  className,
}: EmptyStateProps) => {
  const isModule = variant === "module" || variant === "inline";
  const resolvedMascot: EmptyStateMascot = mascot ?? (isModule ? "mark" : "figure");

  const pill =
    action ??
    (actionLabel
      ? href
        ? (
            <a href={href} className={PILL_CLS}>
              {actionLabel}
            </a>
          )
        : (
            <button type="button" onClick={onAction} className={PILL_CLS}>
              {actionLabel}
            </button>
          )
      : null);

  const art =
    resolvedMascot === "none" ? null : resolvedMascot === "mark" ? (
      <LynxMark size={isModule ? 40 : 64} strokeWidth={isModule ? 3.4 : 2.6} />
    ) : (
      <LynxFigure size={100} />
    );

  if (isModule) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl px-5 py-4 text-left",
          bordered && "border border-dashed border-border/80",
          className,
        )}
      >
        {art}
        <div className="min-w-0">
          <div className={TITLE_CLS}>{title}</div>
          {description && <p className={cn(DESC_CLS, "mt-[5px] max-w-[360px]")}>{description}</p>}
          {pill && <div className="mt-4">{pill}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-8 text-center",
        bordered && "rounded-2xl border border-dashed border-border/80",
        className,
      )}
    >
      {art}
      <div className={cn(TITLE_CLS, "mt-3")}>{title}</div>
      {description && <p className={cn(DESC_CLS, "mt-[5px] max-w-[360px]")}>{description}</p>}
      {pill && <div className="mt-4">{pill}</div>}
    </div>
  );
};

export default EmptyState;
