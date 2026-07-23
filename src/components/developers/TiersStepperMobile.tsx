import { cn } from "@/lib/utils";

export type TierAccent = "muted" | "primary" | "amber";

export interface TierStep {
  name: string;
  tag: string;
  body: string;
  chips: readonly string[];
  accent: TierAccent;
}

/**
 * Single source of truth for tier node visuals.
 * (Mirrors the TIER_META pattern used in ApiManagement.)
 */
const TIER_NODE_STYLES: Record<
  TierAccent,
  { badge: string; title: string }
> = {
  muted: {
    badge:
      "border-border bg-background text-muted-foreground",
    title: "text-foreground",
  },
  primary: {
    badge:
      "border-primary/60 bg-primary/15 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]",
    title: "text-primary",
  },
  amber: {
    badge:
      "border-amber-400/60 bg-amber-400/10 text-amber-400",
    title: "text-amber-400",
  },
};

interface TiersStepperMobileProps {
  tiers: readonly TierStep[];
}

export function TiersStepperMobile({ tiers }: TiersStepperMobileProps) {
  return (
    <div className="relative pl-10">
      {/* Rail — passes through the centre of each badge (badges are w-7, offset -left-10 + p-3.5 = 14px center) */}
      <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gradient-to-b from-border via-primary/40 to-primary" />
      <div className="border-y border-border/40 divide-y divide-border/40">
        {tiers.map((t, i) => {
          const s = TIER_NODE_STYLES[t.accent];
          return (
            <div key={t.name} className="relative py-4">
              {/* Tier index badge */}
              <div
                className={cn(
                  "absolute -left-[34px] top-4 w-7 h-7 rounded-md border ring-2 ring-background flex items-center justify-center font-mono text-[11px] font-semibold",
                  s.badge,
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              <div className="flex items-center justify-between mb-1.5 gap-3">
                <div
                  className={cn(
                    "font-display font-medium tracking-[-0.01em] text-base",
                    s.title,
                  )}
                >
                  {t.name}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {t.tag}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.chips.map((c) => (
                  <span
                    key={c}
                    className="rounded border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
