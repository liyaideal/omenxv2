import { cn } from "@/lib/utils";

interface NewBadgeProps {
  className?: string;
}

export const NewBadge = ({ className }: NewBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
      "bg-trading-green/20 text-trading-green animate-pulse",
      className
    )}
    style={{ animationDuration: "1.5s" }}
  >
    NEW
  </span>
);
