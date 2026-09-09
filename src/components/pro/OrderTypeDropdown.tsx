// ============================================================
// Pro terminal order-type picker (SP-1 · B1). A dropdown, not a tab row —
// the trade panel only has room for ONE full-width selector and that slot
// belongs to BinarySideToggle.
// ============================================================
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ProOrderType = "Market" | "Limit";

interface OrderTypeDropdownProps {
  value: ProOrderType;
  onChange: (v: ProOrderType) => void;
  className?: string;
}

export const OrderTypeDropdown = ({ value, onChange, className }: OrderTypeDropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label="Order type"
        className={`h-7 px-2 rounded-md border border-border/60 text-[11px] font-semibold inline-flex items-center gap-1 text-foreground hover:bg-muted/40 transition-colors ${className ?? ""}`}
      >
        {value}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-[7rem]">
      {(["Market", "Limit"] as const).map((t) => (
        <DropdownMenuItem key={t} onSelect={() => onChange(t)} className="text-xs">
          {t}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
