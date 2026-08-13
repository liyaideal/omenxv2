/**
 * Redeem confirm bar — the summary read-out + Reset + confirm button.
 *
 * Vouchers v2.1: on mobile it does not exist until an outcome is picked; then
 * it rises from the bottom and sits fixed above the safe area (the redeem
 * screen has no BottomNav). Desktop keeps an inline card inside the desk.
 * Pure presentation; every action arrives through props.
 */
import { VT } from "./voucherTokens";
import { useIsMobile } from "@/hooks/use-mobile";

export interface RedeemSummaryBarProps {
  /** null → nothing picked yet */
  picked: {
    eventName: string;
    displayLabel: string;
    isBinary: boolean;
    side: "long" | "short";
    price: number;
  } | null;
  faceValue: number;
  maxHoldingHours: number;
  /** voucher cap in USD — printed as "Max profit $5.00" */
  maxProfit?: number;
  isRedeeming?: boolean;
  onConfirm?: () => void;
  onReset?: () => void;
  /** `inline` = lives inside the desk / redeem screen; `panel` = dialog card */
  variant?: "inline" | "panel";
  innerRef?: React.Ref<HTMLDivElement>;
}

export const RedeemSummaryBar = ({
  picked,
  faceValue,
  maxHoldingHours,
  maxProfit,
  isRedeeming = false,
  onConfirm,
  onReset,
  variant = "panel",
  innerRef,
}: RedeemSummaryBarProps) => {
  const isMobile = useIsMobile();

  /* line 1 — event name (truncates) + " · {side} at {price}¢" */
  const lineOne = picked && (
    <span className="flex items-baseline gap-[4px] min-w-0" style={{ fontSize: 12, color: "#C9CED6" }}>
      <span className="flex-1 min-w-0 truncate">
        {picked.eventName}
        {!picked.isBinary ? ` · ${picked.displayLabel}` : ""}
      </span>
      <span className="flex-none whitespace-nowrap tabular-nums" style={{ color: "#9AA1AC" }}>
        {" · "}
        {picked.isBinary ? picked.displayLabel : picked.side === "long" ? "Yes" : "No"} at{" "}
        {Math.round(picked.price * 100)}¢
      </span>
    </span>
  );

  /* line 2 — voucher terms, every number from the real voucher */
  const lineTwo = (
    <span className="tabular-nums" style={{ fontSize: 11, color: "#6B7280" }}>
      ${faceValue} voucher · closes automatically after {maxHoldingHours}h
      {maxProfit !== undefined ? ` · Max profit $${maxProfit.toFixed(2)}` : ""}
    </span>
  );

  const resetButton = (
    <button
      type="button"
      onClick={onReset}
      className="flex-none flex items-center justify-center"
      style={{ minHeight: 44, padding: "0 12px", fontSize: 11.5, color: "#9AA1AC" }}
    >
      Reset
    </button>
  );

  const confirmButton = (grow: boolean) => (
    <button
      type="button"
      onClick={onConfirm}
      disabled={!picked || isRedeeming}
      className={`font-display ${grow ? "flex-1" : "flex-none"}`}
      style={{
        minHeight: 44,
        borderRadius: 10,
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

  /* ------------------------------- mobile -------------------------------- */
  if (variant === "inline" && isMobile) {
    if (!picked) return null;
    return (
      <div
        ref={innerRef}
        className="fixed inset-x-0 bottom-0 z-[199] flex flex-col gap-[10px]"
        style={{
          borderTop: "1px solid #1D2026",
          background: "#101216",
          padding: "12px 16px 24px",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        }}
      >
        {lineOne}
        {lineTwo}
        <div className="flex items-center gap-[12px]">
          {resetButton}
          {confirmButton(true)}
        </div>
      </div>
    );
  }

  /* ------------------------- desktop / dialog card ------------------------ */
  const card = (
    <div className="w-full flex items-center justify-between gap-[14px] flex-wrap">
      {picked ? (
        <div className="flex flex-col gap-[3px] min-w-0 flex-1">
          {lineOne}
          {lineTwo}
        </div>
      ) : (
        <span style={{ fontSize: 12, color: VT.ink3 }}>Pick an outcome above to see your trial position.</span>
      )}
      <div className="flex-none flex items-center gap-[8px]">
        {picked && resetButton}
        {confirmButton(false)}
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div
        ref={innerRef}
        className="mx-5 mb-5 flex items-center"
        style={{ background: "#101216", border: "1px solid #1D2026", borderRadius: 12, padding: "13px 16px", minHeight: 60 }}
      >
        {card}
      </div>
    );
  }

  return (
    <div
      ref={innerRef}
      className="flex items-center"
      style={{ background: "#101216", border: "1px solid #1D2026", borderRadius: 12, padding: "13px 16px", minHeight: 60 }}
    >
      {card}
    </div>
  );
};
