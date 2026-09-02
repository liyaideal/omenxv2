import { toast } from "sonner";

/**
 * Shared claim-success toast for campaign grants and referral vouchers
 * (precedent: IneligibleEntryToastBody). Extracted verbatim from the two
 * inline call sites (M3a-①) — same toast.success signature, copy, and action.
 */
export const showClaimSuccessToast = (onOpen: () => void) =>
  toast.success("Voucher sent to Position Vouchers", {
    description: "Open vouchers to reveal it.",
    action: { label: "Open", onClick: onOpen },
  });
