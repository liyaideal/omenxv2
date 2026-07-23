import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CampaignPageShell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground", className)}>{children}</div>
);

export const CampaignSection = ({
  children,
  className,
  id,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "surface";
}) => (
  <section
    id={id}
    className={cn(
      "w-full max-w-full overflow-hidden border-t border-border/40 px-5 py-12 md:px-8 md:py-20",
      tone === "surface" && "bg-campaign-surface/35",
      className,
    )}
  >
    <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
  </section>
);

export const CampaignSectionHeader = ({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) => (
  <div className={cn("mb-7 max-w-3xl md:mb-10", className)}>
    {eyebrow && <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-campaign-accent">{eyebrow}</p>}
    <h2 className="max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">{title}</h2>
    {description && <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>}
  </div>
);

export const CampaignMetricStrip = ({
  metrics,
  className,
}: {
  metrics: Array<{ label: string; value: string; detail?: string }>;
  className?: string;
}) => (
  <div className={cn("grid min-w-0 border-y border-border/50 sm:grid-cols-3", className)}>
    {metrics.map((metric) => (
      <div key={metric.label} className="min-w-0 border-b border-border/50 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</p>
        <p className="mt-2 font-mono text-xl font-semibold text-foreground md:text-2xl">{metric.value}</p>
        {metric.detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.detail}</p>}
      </div>
    ))}
  </div>
);

export const CampaignLedgerPanel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("min-w-0 rounded-sm border border-border/50 bg-background/35 p-5 md:p-6", className)}>{children}</div>
);

export const CampaignCTA = ({
  children = "Start Trading",
  onClick,
  className,
}: {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <Button onClick={onClick} className={cn("h-12 gap-2 rounded-sm bg-campaign-accent px-6 font-mono text-sm font-semibold uppercase tracking-[0.08em] text-background hover:bg-campaign-accent/90", className)}>
    {children}
    <ArrowRight className="h-4 w-4" />
  </Button>
);

export const CampaignBannerFrame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("relative w-full max-w-full overflow-hidden rounded-md border border-campaign-accent/25 bg-campaign-surface text-left shadow-lg shadow-background/30", className)}>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.14)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" />
    <div className="relative z-10">{children}</div>
  </div>
);
