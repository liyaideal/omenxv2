/**
 * Redeem confirm bar — the summary read-out + Reset + confirm button that sits
 * at the bottom of the redeem desk. Extracted verbatim from
 * RedeemVoucherContent so the style-guide can mount the real bar with mock
 * props. Pure presentation; every action arrives through props.
 */
import { VT } from "./voucherTokens";
import { useIsMobile } from "@/hooks/use-mobile";

export interface RedeemSummaryBarProps {
  /** null → "Pick an outcome above" empty branch */
  picked: {
    eventName: string;
    displayLabel: string;
    isBinary: boolean;
    side: "long" | "short";
    price: number;
  } | null;
  faceValue: number;
  maxHoldingHours: number;
  isRedeeming?: boolean;
  onConfirm?: () => void;
  onReset?: () => void;
  /** `inline` = sticky bar inside the desk; `panel` = rounded card in dialog/drawer */
  variant?: "inline" | "panel";
  innerRef?: React.Ref<HTMLDivElement>;
}

export const RedeemSummaryBar = ({
  picked,
  faceValue,
  maxHoldingHours,
  isRedeeming = false,
  onConfirm,
  onReset,
  variant = "panel",
  innerRef,
}: RedeemSummaryBarProps) => {
  const isMobile = useIsMobile();
  const summaryLine = picked ? (
    <span className="flex items-baseline gap-[5px] min-w-0" style={{ fontSize: 12.5, fontWeight: 600, color: VT.ink }}>
      <span className="flex-1 min-w-0 truncate">
        {picked.eventName}
        {!picked.isBinary ? ` · ${picked.displayLabel}` : ""}
      </span>
      <span className="flex-none whitespace-nowrap tabular-nums">
        {" · "}
        {picked.isBinary ? picked.displayLabel : picked.side === "long" ? "Yes" : "No"} at{" "}
        {Math.round(picked.price * 100)}¢
      </span>
    </span>
  ) : null;

  const confirmButton = (fullWidth: boolean) => (
    <button
      type="button"
      onClick={onConfirm}
      disabled={!picked || isRedeeming}
      className={`font-display rounded-[10px] ${fullWidth ? "w-full" : "flex-none"}`}
      style={{
        minHeight: 44,
        padding: "0 20px",
        border: picked ? "none" : `1px solid ${VT.line3}`,
        background: picked ? "#FFFFFF" : VT.disabledBg,
        color: picked ? "#0A0B0D" : VT.muted2,
        fontSize: 13,
        fontWeight: 700,
        cursor: picked && !isRedeeming ? "pointer" : "default",
      }}
    >
      {isRedeeming ? "Redeeming…" : "Confirm & open position"}
    </button>
  );

  const body = (
    <>
      {picked ? (
        <div className="flex flex-col gap-[2px] min-w-0 flex-1">
          {summaryLine}
          <span className="tabular-nums" style={{ fontSize: 11, color: VT.ink3 }}>
            ${faceValue} voucher · closes automatically after {maxHoldingHours}h
          </span>
        </div>
      ) : (
        <span style={{ fontSize: 12, color: VT.ink3 }}>Pick an outcome above to see your trial position.</span>
      )}
      <div className="flex-none flex items-center gap-[12px]">
        {picked && (
          <button type="button" onClick={onReset} style={{ fontSize: 12.5, color: VT.ink3 }}>
            Reset
          </button>
        )}
        {confirmButton(false)}
      </div>
    </>
  );

  if (variant === "inline") {
    /* mobile: a real docked bar pinned above the BottomNav, stacked so the
       summary text gets a full line instead of being squeezed by the button. */
    if (isMobile) {
      return (
        <div
          ref={innerRef}
          className="fixed inset-x-0 bottom-[76px] z-[199] flex flex-col gap-[10px]"
          style={{
            borderTop: `1px solid ${VT.line}`,
            background: VT.surfaceInset,
            padding: "12px 16px",
          }}
        >
          {picked ? (
            <div className="flex items-start justify-between gap-[12px] min-w-0">
              <div className="flex flex-col gap-[3px] min-w-0 flex-1">
                <span className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: VT.ink }}>
                  {picked.eventName}
                </span>
                <span className="tabular-nums truncate" style={{ fontSize: 11, color: VT.ink3 }}>
                  {picked.isBinary ? picked.displayLabel : `${picked.displayLabel} · ${picked.side === "long" ? "Yes" : "No"}`}
                  {" at "}
                  {Math.round(picked.price * 100)}¢ · ${faceValue} voucher · closes after {maxHoldingHours}h
                </span>
              </div>
              <button
                type="button"
                onClick={onReset}
                className="flex-none"
                style={{ fontSize: 12.5, color: VT.ink3, minHeight: 28 }}
              >
                Reset
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: VT.ink3 }}>Pick an outcome above to see your trial position.</span>
          )}
          {confirmButton(true)}
        </div>
      );
    }

    return (
      <div
        ref={innerRef}
        className="sticky bottom-0 z-10 flex items-center justify-between gap-[14px] flex-wrap"
        style={{
          borderTop: `1px solid ${VT.line}`,
          background: VT.surfaceInset,
          padding: "13px 16px",
          minHeight: 60,
        }}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      ref={innerRef}
      className="flex items-center justify-between gap-[12px] rounded-[12px]"
      style={{ background: VT.surfaceInset, border: `1px solid ${VT.line}`, padding: "13px 16px" }}
    >
      {body}
    </div>
  );
};
