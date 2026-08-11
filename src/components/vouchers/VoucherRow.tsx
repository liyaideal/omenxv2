import type { ReactNode } from "react";
import { VT } from "./voucherTokens";

/**
 * Voucher row — GrantTaskRow family anatomy (3px left rail, 40px face-value
 * cell, source line + meta line, right action). Identical at 400 / 672 / 375;
 * mobile stacks the action to a full-width 44px button.
 * Frozen spec: OmenX Lite Vouchers v2 Final, frame 3.
 */
export interface VoucherRowProps {
  faceValue: number;
  /** Line 1 — where the voucher came from, or the redeemed market name. */
  sourceLine: string;
  /** Line 2 — timing and daily-pool facts only. */
  metaLine: ReactNode;
  /** Line 3 — exception only: Active instant vouchers. */
  instantLine?: boolean;
  /** Grey rail + grey face value: redeemed / expired rows. */
  spent?: boolean;
  /** Volt border: this voucher is loaded in the redeem desk. */
  selected?: boolean;
  /** Right-hand action; on mobile it drops to a full-width 44px block. */
  action?: ReactNode;
  /** Right-hand static read-out (profit / status word) — never stacks. */
  readout?: ReactNode;
  mobile?: boolean;
}

export const VoucherRow = ({
  faceValue,
  sourceLine,
  metaLine,
  instantLine,
  spent,
  selected,
  action,
  readout,
  mobile,
}: VoucherRowProps) => {
  const rail = spent ? VT.line3 : VT.volt;
  const faceColor = spent ? VT.muted : VT.volt;

  const body = (
    <div className="flex items-center gap-[10px] min-w-0">
      <span
        className="font-display tabular-nums flex-none w-10 text-left"
        style={{ fontSize: 22, lineHeight: 1, fontWeight: 700, letterSpacing: "-.02em", color: faceColor }}
      >
        ${faceValue % 1 === 0 ? faceValue : faceValue.toFixed(2)}
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <div
          className="truncate"
          style={{ fontSize: 12, fontWeight: 600, color: spent ? VT.ink2 : VT.ink }}
        >
          {sourceLine}
        </div>
        <div className="tabular-nums" style={{ fontSize: 11, color: VT.ink3 }}>
          {metaLine}
        </div>
        {instantLine && (
          <div style={{ fontSize: 11, color: VT.volt }}>Profit goes straight to your wallet</div>
        )}
      </div>
      {!mobile && action}
      {readout}
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] ${mobile ? "flex flex-col gap-[11px]" : ""}`}
      style={{
        background: VT.surfaceRow,
        border: `1px solid ${selected ? VT.volt : VT.line}`,
        padding: "13px 14px 13px 17px",
      }}
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: rail }} />
      {body}
      {mobile && action}
    </div>
  );
};

/** White primary action (Claim). */
export const RowPrimaryButton = ({
  children,
  onClick,
  disabled,
  mobile,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  mobile?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`font-display rounded-[10px] ${mobile ? "w-full min-h-[44px]" : "flex-none min-h-[40px] px-[14px]"}`}
    style={{
      fontSize: 12.5,
      fontWeight: 600,
      border: disabled ? `1px solid ${VT.line3}` : "none",
      background: disabled ? VT.disabledBg : "#FFFFFF",
      color: disabled ? VT.muted2 : "#0A0B0D",
      cursor: disabled ? "default" : "pointer",
    }}
  >
    {children}
  </button>
);

/** Outline action (Redeem). */
export const RowOutlineButton = ({
  children,
  onClick,
  mobile,
}: {
  children: ReactNode;
  onClick?: () => void;
  mobile?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`font-display rounded-[10px] ${mobile ? "w-full min-h-[44px]" : "flex-none min-h-[40px] px-[14px]"}`}
    style={{
      fontSize: 12.5,
      fontWeight: 600,
      border: `1px solid ${VT.line3}`,
      background: "transparent",
      color: VT.ink,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

/** Static word in the action slot (Selected / Expired). */
export const RowStatusWord = ({ children, tone = "muted" }: { children: ReactNode; tone?: "volt" | "muted" }) => (
  <span
    className="flex-none font-display"
    style={{ fontSize: 11.5, fontWeight: 700, color: tone === "volt" ? VT.volt : VT.muted }}
  >
    {children}
  </span>
);

/** Two-line right read-out: profit + destination. */
export const RowAmountReadout = ({ amount, caption }: { amount: number | null; caption: string }) => {
  const won = amount != null && amount > 0;
  return (
    <span className="flex-none flex flex-col items-end gap-[2px]">
      <span
        className="font-display tabular-nums"
        style={{ fontSize: 15, fontWeight: 700, color: won ? VT.volt : VT.muted }}
      >
        {won ? `+$${amount.toFixed(2)}` : "$0.00"}
      </span>
      <span style={{ fontSize: 10.5, color: VT.muted }}>{caption}</span>
    </span>
  );
};
