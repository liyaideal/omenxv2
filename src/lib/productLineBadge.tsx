// Product-line badge — single source of truth for SPOT / FUTURES chips
// across Wallet TransactionHistory, TradeVerification, Settlements list,
// Resolved cards, and Events list rows.
//
// Locked visual (from ACCOUNT_BADGE_CONFIG in TransactionHistory):
//   SPOT     border-blue-500/30 bg-blue-500/10 text-blue-400
//   FUTURES  border-primary/30  bg-primary/10  text-primary
// Shape: rounded-full pill, 10px, uppercase-neutral, whitespace-nowrap.
//
// EXEMPTION (DESIGN.md §Product-line badge): the /spot trading terminal
// header uses a neutral outline SPOT chip and is not covered here.
import { cn } from "@/lib/utils";

export type ProductLine = "spot" | "futures";

export const PRODUCT_LINE_BADGE_CLASSES: Record<ProductLine, string> = {
  spot: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  futures: "border-primary/30 bg-primary/10 text-primary",
};

export const PRODUCT_LINE_LABELS: Record<ProductLine, string> = {
  spot: "SPOT",
  futures: "FUTURES",
};

interface ProductLineBadgeProps {
  line: ProductLine;
  className?: string;
}

export const ProductLineBadge = ({ line, className }: ProductLineBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold whitespace-nowrap",
      PRODUCT_LINE_BADGE_CLASSES[line],
      className,
    )}
  >
    {PRODUCT_LINE_LABELS[line]}
  </span>
);
