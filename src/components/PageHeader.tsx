import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional right-aligned actions (buttons, tabs, filters). */
  actions?: ReactNode;
}

/**
 * Canonical product page title block (DESIGN.md §4).
 *
 * Fixed structure — do NOT extend with eyebrows, icons, or custom sizes.
 * The only escape hatch is `actions` (right-aligned slot).
 *
 * Layout:
 *   [purple bar (desktop)] [ h1 + subtitle ]              [actions]
 */
export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className="relative">
      <div className="absolute -left-4 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary/60 to-transparent hidden md:block" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1.5 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
