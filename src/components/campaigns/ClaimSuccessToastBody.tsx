import { toast } from "sonner";

/**
 * Shared claim-success toast for campaign grants and referral vouchers
 * (precedent: IneligibleEntryToastBody). The copy atoms are the single
 * source of truth: `showClaimSuccessToast` (production) and the static
 * `ClaimSuccessToastBody` (style-guide RW-12) both render from them.
 */
export const CLAIM_SUCCESS_TITLE = "Voucher sent to Position Vouchers";
export const CLAIM_SUCCESS_DESCRIPTION = "Open vouchers to reveal it.";
export const CLAIM_SUCCESS_ACTION_LABEL = "Open";

/**
 * Statically renderable toast body (title / description / action) for the
 * style-guide dictionary. Production toasts pass the same atoms to sonner,
 * which draws its own chrome — this component never ships in the live toast.
 */
export const ClaimSuccessToastBody = ({ onOpen }: { onOpen: () => void }) => (
  <>
    <div className="text-[13px] font-semibold text-[#F2F3F5]">{CLAIM_SUCCESS_TITLE}</div>
    <div className="mt-1 text-[12px] text-[#9AA1AC]">{CLAIM_SUCCESS_DESCRIPTION}</div>
    <div className="mt-3">
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-[32px] items-center rounded-[8px] bg-white px-3 font-display text-[12px] font-bold text-[#0A0B0D]"
      >
        {CLAIM_SUCCESS_ACTION_LABEL}
      </button>
    </div>
  </>
);

export const showClaimSuccessToast = (onOpen: () => void) =>
  toast.success(CLAIM_SUCCESS_TITLE, {
    description: CLAIM_SUCCESS_DESCRIPTION,
    action: { label: CLAIM_SUCCESS_ACTION_LABEL, onClick: onOpen },
  });
