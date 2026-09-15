// ============================================================
// QO-1 · Amount-entry unit picker. Lives INSIDE the Amount input as its
// suffix (`USDC ▾` / `Contracts ▾` / `Shares ▾`) — no separate toggle
// icon, no extra row. Same DropdownMenu chrome as OrderTypeDropdown.
// ============================================================
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AmountMode } from "@/stores/useAmountModeStore";
import { cn } from "@/lib/utils";

interface AmountUnitDropdownProps {
  value: AmountMode;
  /** Word for the units option: "Contracts" (futures) or "Shares" (spot). */
  unitLabel: "Contracts" | "Shares";
  onChange: (v: AmountMode) => void;
  className?: string;
}

export const AmountUnitDropdown = ({ value, unitLabel, onChange, className }: AmountUnitDropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label="Amount unit"
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 -mr-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors",
          className,
        )}
      >
        {value === "units" ? unitLabel : "USDC"}
        <ChevronDown className="h-3 w-3" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-[7rem]">
      {([
        { v: "usdc" as const, label: "USDC" },
        { v: "units" as const, label: unitLabel },
      ]).map((o) => (
        <DropdownMenuItem key={o.v} onSelect={() => onChange(o.v)} className="text-xs">
          {o.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
