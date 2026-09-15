// ============================================================
// Inline Transfer entry next to a displayed balance (CPO ruling 2026-08-06:
// every displayed account balance offers a Transfer entry). Reuses the
// wallet's TransferDialog (desktop) / TransferDrawer (mobile) — no new
// transfer UI. Used by the Pro contract and spot panels' `Available` row.
// ============================================================
import { useState } from "react";
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
          // Text link, not the ⇄ glyph: the Amount row right below uses the same
          // arrow icon for its amount/qty toggle, so two identical glyphs 40px
          // apart would read as one control.
          "inline-flex items-center rounded px-1 text-[11px] text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2",
          mobile && "min-h-[44px] -my-3",
          className,
        )}
      >
        Transfer
      </button>
      <Overlay open={open} onOpenChange={setOpen} initialDirection={direction} />
    </>
  );
};
