// ============================================================
// Live / Settled segmented control for the Lite markets list.
// Consumer wording only — never "Active/Resolved".
// Visual language matches the category pills (solid white active).
// ============================================================
import { cn } from "@/lib/utils";

interface Props {
  /** Which segment reads as active. */
  value: "live" | "settled";
  onSelect: (v: "live" | "settled") => void;
  className?: string;
}

export const LiveSettledSwitch = ({ value, onSelect, className }: Props) => (
  <div className={cn("flex items-center gap-1.5", className)}>
    <button
      type="button"
      onClick={() => onSelect("live")}
      className={cn(
        "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
        value === "live"
          ? "bg-white text-[#0A0B0D] font-semibold"
          : "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground",
      )}
    >
      Live
    </button>
    <button
      type="button"
      onClick={() => onSelect("settled")}
      className={cn(
        "rounded-full px-[18px] py-[9px] text-[13px] transition-colors",
        value === "settled"
          ? "bg-white text-[#0A0B0D] font-semibold"
          : "border-[1.5px] border-[#2B2F38] text-[#C9CED6] hover:text-foreground",
      )}
    >
      Settled
    </button>
  </div>
);

export default LiveSettledSwitch;
