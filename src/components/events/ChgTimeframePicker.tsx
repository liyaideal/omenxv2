import { cn } from "@/lib/utils";
import { ChgTimeframe } from "@/hooks/useMarketListData";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const OPTIONS: { value: ChgTimeframe; label: string }[] = [
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "24h", label: "24H" },
];

interface Props {
  value: ChgTimeframe;
  onChange: (v: ChgTimeframe) => void;
  compact?: boolean;
}

export const ChgTimeframePicker = ({ value, onChange, compact = false }: Props) => {
  const [open, setOpen] = useState(false);

  if (compact) {
    const activeLabel = OPTIONS.find((o) => o.value === value)?.label ?? "24H";
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-0.5 rounded-md border border-border/50 px-2 py-1 text-[10px] font-medium text-primary bg-primary/10 transition-colors">
            {activeLabel}
            <ChevronDown className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto min-w-0 p-1 flex flex-col gap-0.5">
          {OPTIONS.map(({ value: v, label }) => (
            <button
              key={v}
              onClick={() => { onChange(v); setOpen(false); }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors text-left",
                value === v
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="inline-flex items-center rounded-md border border-border/50 overflow-hidden">
      {OPTIONS.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "px-2 py-1 text-[10px] font-medium transition-colors",
            value === v
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
