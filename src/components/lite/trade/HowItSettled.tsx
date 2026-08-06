// ============================================================
// "How it settled" proof segment. Lives inside the rule-module area of
// BOTH Lite trade pages in the settled state — same panel style and
// typography as the rule card, no new surface. Consumer wording only.
// ============================================================
import { ArrowUpRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rewrites raw engine labels into plain English for consumer copy. */
export const consumerText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/\bNot Up\b/gi, "didn't go up")
    .replace(/\bNot up\b/g, "didn't go up");
};

export interface SettledCriterion {
  neededLabel: string;
  neededValue: string;
  actualLabel: string;
  actualValue: string;
}

interface Props {
  /** Conclusion sentence — usually events.settlement_description. */
  summary?: string | null;
  /** Numeric criterion rows. Omit entirely when the event has no numbers. */
  criterion?: SettledCriterion | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  className?: string;
}

export const HowItSettled = ({
  summary,
  criterion,
  sourceName,
  sourceUrl,
  className,
}: Props) => {
  const line = consumerText(summary);

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          How it settled
        </div>

        {line && <p className="text-muted-foreground">{line}</p>}

        {criterion && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{criterion.neededLabel}</span>
              <span className="font-mono font-semibold text-foreground">
                {criterion.neededValue}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{criterion.actualLabel}</span>
              <span className="font-mono font-semibold text-foreground">
                {criterion.actualValue}
              </span>
            </div>
          </div>
        )}

        <p className="text-muted-foreground">
          {sourceName ? (
            <>
              Settled from {sourceName} ·{" "}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                >
                  Official result <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                "Official result"
              )}
            </>
          ) : (
            "Settled by the OmenX team from the official result."
          )}
        </p>
      </div>
    </div>
  );
};

export default HowItSettled;