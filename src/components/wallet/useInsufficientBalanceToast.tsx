import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TransferDialog } from "./TransferDialog";
import { TransferDrawer } from "./TransferDrawer";
import type { TransferDirection } from "./TransferForm";

/**
 * Insufficient-balance toast with an actionable follow-up.
 * If the other account still holds funds → "Transfer" (into `direction`'s
 * target account). Otherwise → "Add funds" (deposit flow).
 */
export const useInsufficientBalanceToast = (direction: TransferDirection) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { balance, spotBalance } = useUserProfile();
  const [open, setOpen] = useState(false);
  const Overlay = isMobile ? TransferDrawer : TransferDialog;

  // direction "to_spot" funds the Standard account, so the source is Boost.
  const sourceBalance = direction === "to_spot" ? balance : spotBalance;

  const notify = useCallback(() => {
    if (sourceBalance > 0) {
      toast.error("Not enough balance — add funds to continue", {
        action: { label: "Transfer", onClick: () => setOpen(true) },
      });
    } else {
      toast.error("Not enough balance — add funds to continue", {
        action: { label: "Add funds", onClick: () => navigate("/deposit") },
      });
    }
  }, [sourceBalance, navigate]);

  const overlay = <Overlay open={open} onOpenChange={setOpen} initialDirection={direction} />;

  return { notify, overlay };
};
