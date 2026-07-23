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
