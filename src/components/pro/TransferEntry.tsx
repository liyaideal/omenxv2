// ============================================================
// Inline Transfer entry next to a displayed balance (CPO ruling 2026-08-06:
// every displayed account balance offers a Transfer entry). Reuses the
// wallet's TransferDialog (desktop) / TransferDrawer (mobile) — no new
// transfer UI. Used by the Pro contract and spot panels' `Available` row.
// ============================================================
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { TransferDialog } from "@/components/wallet/TransferDialog";
import { TransferDrawer } from "@/components/wallet/TransferDrawer";
import type { TransferDirection } from "@/components/wallet/TransferForm";
import { cn } from "@/lib/utils";

interface TransferEntryProps {
  /** Which way the form opens pre-selected: contract panel → to_futures, spot panel → to_spot. */
  direction: TransferDirection;
  /** Mobile panels open the bottom drawer (DESIGN §5: no Dialog on mobile). */
  mobile?: boolean;
  className?: string;
}

export const TransferEntry = ({ direction, mobile = false, className }: TransferEntryProps) => {
  const [open, setOpen] = useState(false);
  const Overlay = mobile ? TransferDrawer : TransferDialog;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Transfer funds"
        title="Transfer funds"
        className={cn(
          // ⇄ is the site-wide transfer glyph (wallet AccountBalanceLine uses it too).
          "inline-flex items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          mobile ? "min-h-[44px] min-w-[44px] -my-3 -mx-2" : "w-5 h-5 bg-muted hover:bg-muted-foreground/30 rounded-full",
          className,
        )}
      >
        <ArrowLeftRight className="w-3 h-3" />
      </button>
      <Overlay open={open} onOpenChange={setOpen} initialDirection={direction} />
    </>
  );
};
