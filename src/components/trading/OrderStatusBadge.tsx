// ============================================================
// PF-1 · Order status badge with the partial-fill detail.
//
// One badge for every open-orders surface (desktop contract table, desktop
// spot table, mobile contract / spot cards). While an order is
// `Partial Filled` the badge opens a fill-progress card — hover on desktop,
// tap on mobile. Any other status is a plain badge.
// Content follows /style-guide "Order Status & Partial Fill":
//   Fill progress  60 / 100 (60%)  + bar  +  Filled / Remaining rows.
// ============================================================
import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type OrderStatusText = "Pending" | "Partial Filled" | "Partially Filled" | "Filled" | "Cancelled" | string;

export interface OrderStatusBadgeProps {
  status: OrderStatusText;
  /** Ordered quantity (string as the table prints it, "1,200" / "22.222"). */
  amount?: string | number;
  filledAmount?: string | number;
  remainingAmount?: string | number;
  /** hover (desktop) or tap (mobile). */
  variant: "desktop" | "mobile";
  /** Override the label (e.g. "Cancelled · market frozen"). */
  label?: string;
  className?: string;
  /** Style-guide only: open the detail on mount. */
  previewOpen?: boolean;
}

const toNum = (v: string | number | undefined) =>
  typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[$,]/g, "")) || 0;

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 3 });

const isPartial = (s: string) => s === "Partial Filled" || s === "Partially Filled";

const tone = (s: string) =>
  isPartial(s)
    ? "bg-cyan-500/20 text-cyan-400"
    : s === "Pending"
      ? "bg-trading-yellow/20 text-trading-yellow"
      : s === "Filled"
        ? "bg-trading-green/20 text-trading-green"
        : s === "Cancelled" || s.startsWith("Cancelled")
          ? "bg-trading-red/20 text-trading-red"
          : "bg-muted text-muted-foreground";

const FillDetail = ({ total, filled }: { total: number; filled: number }) => {
  const remaining = Math.max(0, total - filled);
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  return (
    <div className="w-60 text-xs">
      <div className="px-3 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-medium">Fill progress</span>
          <span className="font-mono text-cyan-400">
            {fmt(filled)} / {fmt(total)} ({pct}%)
          </span>
        </div>
        <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
          <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Filled</span>
          <span className="font-mono text-trading-green">{fmt(filled)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-mono text-trading-yellow">{fmt(remaining)}</span>
        </div>
      </div>
    </div>
  );
};

export const OrderStatusBadge = ({
  status,
  amount,
  filledAmount,
  remainingAmount,
  variant,
  label,
  className,
  previewOpen,
}: OrderStatusBadgeProps) => {
  const [open, setOpen] = useState(!!previewOpen);
  const text = label ?? (status === "Partially Filled" ? "Partial Filled" : status);
  const badge = (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap", tone(status), className)}>
      {text}
    </span>
  );
  if (!isPartial(status)) return badge;

  const total = toNum(amount);
  const filled = filledAmount !== undefined ? toNum(filledAmount) : Math.max(0, total - toNum(remainingAmount));
  const detail = <FillDetail total={total} filled={filled} />;

  if (variant === "desktop") {
    return (
      <HoverCard openDelay={100} closeDelay={100} {...(previewOpen ? { open: true } : {})}>
        <HoverCardTrigger asChild>
          <button type="button" className="cursor-help" aria-label="Fill progress">
            {badge}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" align="end" className="w-auto p-0">
          {detail}
        </HoverCardContent>
      </HoverCard>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Fill progress" aria-expanded={open}>
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-auto p-0">
        {detail}
      </PopoverContent>
    </Popover>
  );
};
