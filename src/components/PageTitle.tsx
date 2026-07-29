import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  /** Optional right-aligned actions (tabs, filters), baseline-aligned with the h1. */
  actions?: ReactNode;
}

/**
 * TITLE OPENING (DESIGN.md §4 — "two openings").
 *
 * Browse pages open with a single clean display h1. No eyebrow, no purple bar,
 * no subtitle. Account pages (Wallet / Portfolio) use the DATA OPENING instead
 * (no title at all — their data hero is the opening).
 */
export const PageTitle = ({ title, actions }: PageTitleProps) => (
  <div className="flex items-baseline justify-between gap-4">
    <h1
      className="font-display font-bold tracking-[-0.02em] leading-[1.05] text-foreground"
      style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
    >
      {title}
    </h1>
    {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageTitle;