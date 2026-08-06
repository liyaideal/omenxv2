import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransferDialog } from "./TransferDialog";
import { TransferDrawer } from "./TransferDrawer";
import type { TransferDirection } from "./TransferForm";
import { cn } from "@/lib/utils";

/**
 * Balance read-out + inline Transfer entry.
 * CPO ruling 2026-08-06: every displayed account balance offers a Transfer entry.
 * Reuses the existing TransferDialog / TransferDrawer — no new transfer UI.
 */
export const AccountBalanceLine = ({
  label = "Balance",
  value,
  direction,
  className,
}: {
  label?: string;
  value: string;
  direction: TransferDirection;
  className?: string;
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const Overlay = isMobile ? TransferDrawer : TransferDialog;

  return (
    <>
      <div className={cn("flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground", className)}>
        <span>
          {label} {value}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Transfer funds"
          className={cn(
            "inline-flex items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            // Mobile needs a >=44px tap target; negative margin keeps layout unchanged.
            isMobile ? "min-h-[44px] min-w-[44px] -my-3 -mx-2" : "p-0.5",
          )}
        >
          <ArrowLeftRight className="h-3 w-3" />
        </button>
      </div>
      <Overlay open={open} onOpenChange={setOpen} initialDirection={direction} />
    </>
  );
};
