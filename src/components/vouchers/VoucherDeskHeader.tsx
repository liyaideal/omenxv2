import type { PositionVoucher } from "@/hooks/usePositionVouchers";
import { VT } from "./voucherTokens";

/**
 * Redeem desk header — flat chrome, no gradient band.
 * Desktop: pad 18-20, 34px volt face value, code chip, three #101216 r10 meta
 * cells (Max profit / Hold window / Payout) + tiered disclosure line.
 * Mobile: compact summary card above the picker.
 * Frozen spec: Vouchers v2 Final, frames 1 / 7 / 9.
 */
export const VoucherDeskHeader = ({
  voucher,
  sourceLabel,
  compact,
}: {
  voucher: PositionVoucher;
  sourceLabel?: string | null;
  compact?: boolean;
}) => {
  const cap = voucher.faceValue * voucher.redeemableCapPct;
  const payout = voucher.payoutMode === "instant" ? "Instant" : "Tiered by volume";

  const cells = (
    <div
      className="grid gap-[10px]"
      style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}
    >
      {[
        { label: "Max profit", value: `$${cap.toFixed(2)}` },
        { label: "Hold window", value: `${voucher.maxHoldingHours}h` },
        { label: "Payout", value: compact ? (voucher.payoutMode === "instant" ? "Instant" : "Tiered") : payout },
      ].map((c) => (
        <div
          key={c.label}
          className={compact ? "flex flex-col gap-[3px]" : "flex flex-col gap-[4px] rounded-[10px]"}
          style={
            compact
              ? undefined
              : { background: VT.surfaceInset, border: `1px solid ${VT.line}`, padding: "11px 13px" }
          }
        >
          <span
            className="font-display uppercase"
            style={{ fontSize: compact ? 9 : 9.5, fontWeight: 700, letterSpacing: compact ? ".1em" : ".12em", color: VT.muted }}
          >
            {c.label}
          </span>
          <span
            className="font-display tabular-nums"
            style={{ fontSize: compact ? 12.5 : 16, fontWeight: 700, color: VT.ink }}
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="overflow-hidden rounded-[12px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
        <div className="flex flex-col gap-[6px]" style={{ padding: "13px 14px 12px" }}>
          <div className="flex items-center justify-between gap-[10px]">
            <span className="font-display uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: VT.muted }}>
              Redeeming voucher
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: VT.muted }}>{voucher.code}</span>
          </div>
          <div className="flex items-baseline gap-[9px] min-w-0">
            <span
              className="font-display tabular-nums"
              style={{ fontSize: 28, lineHeight: 1, fontWeight: 700, letterSpacing: "-.02em", color: VT.volt }}
            >
              ${voucher.faceValue}
            </span>
            <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: VT.ink }}>
              {sourceLabel ? `From ${sourceLabel}` : "Trial Position Voucher"}
            </span>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${VT.line}`, background: VT.surfaceInset, padding: "10px 14px" }}>
          {cells}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[12px]" style={{ padding: "18px 20px", borderBottom: `1px solid ${VT.line}` }}>
      <div className="flex items-start justify-between gap-[16px]">
        <div className="flex flex-col gap-[7px] min-w-0">
          <span className="font-display uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: VT.muted }}>
            Redeeming voucher
          </span>
          <div className="flex items-end gap-[10px] min-w-0">
            <span
              className="font-display tabular-nums flex-none"
              style={{ fontSize: 34, lineHeight: 1, fontWeight: 700, letterSpacing: "-.03em", color: VT.volt }}
            >
              ${voucher.faceValue}
            </span>
            <span className="truncate" style={{ fontSize: 12.5, color: VT.ink3, paddingBottom: 3 }}>
              Trial Position Voucher{sourceLabel ? ` · From ${sourceLabel}` : ""}
            </span>
          </div>
        </div>
        <span
          className="flex-none font-mono rounded-[6px]"
          style={{ fontSize: 11, color: VT.ink3, background: VT.surfaceInset, border: `1px solid ${VT.line}`, padding: "5px 9px" }}
        >
          {voucher.code}
        </span>
      </div>
      {cells}
      <div style={{ fontSize: 11, lineHeight: 1.5, color: VT.ink3, paddingTop: 2 }}>
        {voucher.payoutMode === "instant"
          ? "Instant payout: profit lands straight in your Standard balance when the trial position closes."
          : "Tiered payout: profit lands in your pending balance, and how much you can claim at once unlocks with traded volume."}
      </div>
    </div>
  );
};
