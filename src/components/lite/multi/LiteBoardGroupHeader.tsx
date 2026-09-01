// ============================================================
// Group header for the sports game-lines board (Winner / Handicap /
// Total, plus the segmented esports / MMA groups). Shared by the trade
// page and the style guide so there is exactly one implementation.
// ============================================================
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

export const LiteBoardGroupHeader = ({
  title,
  note,
  tip,
  anchorId,
  annotation,
}: {
  title: string;
  note?: string;
  tip?: string;
  /** DOM id, so a scoreboard column can scroll to this group. */
  anchorId?: string;
  /** Right-hand status for segment groups — Final 13–8 / LIVE 9–7 /
   *  Not played yet. Mutually exclusive with the `note` tooltip. */
  annotation?: React.ReactNode;
}) => {
  const isMobile = useIsMobile();
  const trigger = (
    <button
      type="button"
      className="text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground underline decoration-dotted underline-offset-2"
    >
      {note}
    </button>
  );
  return (
    <div
      id={anchorId}
      className="mt-3.5 flex items-baseline justify-between"
      style={{ scrollMarginTop: "calc(var(--mobile-header-h, 56px) + 56px)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9CED6]">
        {title}
      </span>
      {annotation != null ? (
        annotation
      ) : note ? (
        isMobile ? (
          <Popover>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent align="end" className="w-64 text-xs text-muted-foreground">
              {tip}
            </PopoverContent>
          </Popover>
        ) : (
          // Desktop: hover tooltip — no overlay chrome for a passive note.
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="left" className="max-w-64 text-xs">
              {tip}
            </TooltipContent>
          </Tooltip>
        )
      ) : null}
    </div>
  );
};

export default LiteBoardGroupHeader;
