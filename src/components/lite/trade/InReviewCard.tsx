// ============================================================
// "In review" segment. Lives in the same rule-module slot as
// HowItSettled on BOTH Lite trade pages, for the intermediate state
// between trading close and settlement. Same panel recipe, no new chrome.
// Consumer wording only — no timing promise (review can run long).
// ============================================================
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const IN_REVIEW_BADGE = "In review · result pending";
export const IN_REVIEW_LINE = "Result is under review. Payout once confirmed.";
export const IN_REVIEW_HOLD_LINE =
  "Cash out is paused while the result is under review.";

interface Props {
  sourceName?: string | null;
  /** Show the "cash out is paused" line — pass when the user holds a leg. */
  holding?: boolean;
  className?: string;
}

export const InReviewCard = ({ sourceName, holding, className }: Props) => (
  <div
    className={cn(
      "flex gap-3 rounded-2xl border border-border bg-card p-4 text-xs",
      className,
    )}
  >
    <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#FF8A3D" }} />
    <div className="min-w-0 flex-1 space-y-2.5">
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
        style={{ border: "1px solid #FF8A3D", color: "#FF8A3D" }}
      >
        {IN_REVIEW_BADGE}
      </span>

      <p className="text-muted-foreground">{IN_REVIEW_LINE}</p>

      {holding && <p className="text-muted-foreground">{IN_REVIEW_HOLD_LINE}</p>}

      {sourceName && (
        <p className="text-[11px] text-muted-foreground">
          Result comes from {sourceName}.
        </p>
      )}
    </div>
  </div>
);

export default InReviewCard;
