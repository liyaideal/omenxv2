import { toast } from "sonner";

/**
 * Toast shown once per newly credited USDC tier (tiered tasks). The server
 * credits Standard the moment a tier is reached; the detail page notices the
 * new `claimed` tier on load and fires this once (seen-set in localStorage).
 * Same atom pattern as ClaimSuccessToastBody: production toast and the
 * style-guide static body render from the same strings.
 */
export const creditedToastTitle = (usdc: number) => `+$${usdc} USDC credited to Standard`;
export const creditedToastDescription = (tierIndex: number, taskName: string) =>
  `Tier ${tierIndex} of ${taskName}`;
export const CREDITED_TOAST_ACTION_LABEL = "Open wallet";

export const CreditedToastBody = ({
  usdc,
  tierIndex,
  taskName,
  onOpen,
}: {
  usdc: number;
  tierIndex: number;
  taskName: string;
  onOpen: () => void;
}) => (
  <>
    <div className="text-[13px] font-semibold text-[#F2F3F5]">{creditedToastTitle(usdc)}</div>
    <div className="mt-1 text-[12px] text-[#9AA1AC]">{creditedToastDescription(tierIndex, taskName)}</div>
    <div className="mt-3">
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-[32px] items-center rounded-[8px] bg-white px-3 font-display text-[12px] font-bold text-[#0A0B0D]"
      >
        {CREDITED_TOAST_ACTION_LABEL}
      </button>
    </div>
  </>
);

export const showCreditedToast = (usdc: number, tierIndex: number, taskName: string, onOpen: () => void) =>
  toast.success(creditedToastTitle(usdc), {
    description: creditedToastDescription(tierIndex, taskName),
    action: { label: CREDITED_TOAST_ACTION_LABEL, onClick: onOpen },
  });
