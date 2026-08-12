import { cn } from "@/lib/utils";
import { PlatformBadge, Platform } from "./PlatformBadge";

interface SectionWrapperProps {
  id: string;
  title: string;
  description?: string;
  platform?: Platform;
  children: React.ReactNode;
  className?: string;
}

export const SectionWrapper = ({
  id,
  title,
  description,
  platform,
  children,
  className,
}: SectionWrapperProps) => {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className="flex items-center gap-3 mb-4 border-b border-border pb-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {platform && <PlatformBadge platform={platform} />}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
      )}
      {children}
    </section>
  );
};

interface SubSectionProps {
  title: string;
  description?: string;
  platform?: Platform;
  children: React.ReactNode;
  className?: string;
}

export const SubSection = ({ title, description, platform, children, className }: SubSectionProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {platform && <PlatformBadge platform={platform} />}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground -mt-2">{description}</p>
      )}
      {children}
    </div>
  );
};

/**
 * Legacy hand-copied block marker.
 * Required on every static replica that has NOT been line-checked against
 * production (2026-08-12 review ruling).
 */
export const LegacyNotice = ({ className }: { className?: string }) => (
  <p
    className={cn(
      "rounded-md border border-trading-yellow/25 bg-trading-yellow/5 px-3 py-2 text-xs leading-5 text-trading-yellow",
      className,
    )}
  >
    存量手抄留档 — 未与生产逐行核对，不可作为研发规格；随该页改版一并转活体。
  </p>
);
