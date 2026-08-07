import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  /** Optional right-aligned actions (tabs, filters), baseline-aligned with the h1. */
  actions?: ReactNode;
}

/**
 * RETIRED (2026-08-07) — style-guide archive only, same treatment as PageHeader.
 *
 * Opening system v2: section pages carry no h1 at all. A page opens with an
 * ENTITY opening (entity name — trade event, campaign), a DATA opening (its own
 * hero/stat module) or a CONTROL opening (tabs / chips / filters).
 * Do not import this component into product pages.
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