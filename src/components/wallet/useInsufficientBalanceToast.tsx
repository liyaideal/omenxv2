import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TransferDialog } from "./TransferDialog";
import { TransferDrawer } from "./TransferDrawer";
import type { TransferDirection } from "./TransferForm";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { useAccountPreference } from "@/hooks/useAccountPreference";

/**
 * Insufficient-balance toast with an actionable follow-up.
 * If the other account still holds funds → "Transfer" (into `direction`'s
 * target account). Otherwise → "Add funds" (deposit flow).
 *
 * Fork (CPO 2026-11-13): the other account can actually fund a $1 order
 * (floor(other) >= 1) → Transfer; otherwise → deposit. A few cents in the
 * other account would leave the user still under $1 after transferring.
 *
 * `addMoney` is the same fork without the toast — the low-balance hint's
 * "Add money" link calls it directly (CPO 2026-11-12, deposit-ux ③): other
 * account has money → open Transfer; other account at 0 → deposit (desktop opens
 * the Deposit dialog pre-set to this card's account — /deposit on desktop only
 * redirects to /wallet; mobile goes to the /deposit page with the same account
 * pre-selected).
 */
export const useInsufficientBalanceToast = (direction: TransferDirection) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { balance, spotBalance } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const { setAccount: setDepositAccount } = useAccountPreference("deposit");
  const depositAccount = direction === "to_spot" ? "spot" : "futures";
  const Overlay = isMobile ? TransferDrawer : TransferDialog;

  // direction "to_spot" funds the Standard account, so the source is Boost.
  const sourceBalance = direction === "to_spot" ? balance : spotBalance;

  const hasOtherFunds = Math.floor(sourceBalance) >= 1;

  // Deposit leg shared by the hint link and the toast's "Add funds" (CPO 2026-11-13:
  // the toast used to navigate to /deposit, which on desktop only lands on /wallet).
  const openDeposit = useCallback(() => {
    if (isMobile) {
      // Same pre-select as the desktop dialog's initialAccount (it persists too).
      setDepositAccount(depositAccount);
      navigate("/deposit");
    }
    else setDepositOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, navigate, depositAccount]);

  const addMoney = useCallback(() => {
    if (hasOtherFunds) setOpen(true);
    else openDeposit();
  }, [hasOtherFunds, openDeposit]);

  const notify = useCallback(() => {
    if (hasOtherFunds) {
      toast.error("Not enough balance — add funds to continue", {
        action: { label: "Transfer", onClick: () => setOpen(true) },
      });
    } else {
      toast.error("Not enough balance — add funds to continue", {
        action: { label: "Add funds", onClick: openDeposit },
      });
    }
  }, [hasOtherFunds, openDeposit]);

  const overlay = (
    <>
      <Overlay open={open} onOpenChange={setOpen} initialDirection={direction} />
      {!isMobile && (
        <DepositDialog
          open={depositOpen}
          onOpenChange={setDepositOpen}
          initialAccount={depositAccount}
        />
      )}
    </>
  );

  return { notify, addMoney, overlay };
};
