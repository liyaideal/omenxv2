// ============================================================
// Group header for the sports game-lines board (Winner / Handicap /
// Total). Shared by the trade page and the style guide so there is
// exactly one implementation.
// ============================================================
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const LiteBoardGroupHeader = ({
  title,
  note,
  tip,
}: {
  title: string;
  note: string;
  tip: string;
}) => (
  <div className="mt-3.5 flex items-baseline justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9CED6]">
      {title}
    </span>
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground underline decoration-dotted underline-offset-2"
        >
          {note}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 text-xs text-muted-foreground">
        {tip}
      </PopoverContent>
    </Popover>
  </div>
);

export default LiteBoardGroupHeader;
