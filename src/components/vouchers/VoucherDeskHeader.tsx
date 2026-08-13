import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
    return <VoucherStub voucher={voucher} sourceLabel={sourceLabel} />;
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

/**
 * Mobile / compact form — a ticket stub. Collapsed by default (56px single
 * line); tapping grows a non-modal disclosure panel underneath with the three
 * terms + code + payout sentence. Vouchers v2.1.
 */
const VoucherStub = ({
  voucher,
  sourceLabel,
}: {
  voucher: PositionVoucher;
  sourceLabel?: string | null;
}) => {
  const [open, setOpen] = useState(false);
  const cap = voucher.faceValue * voucher.redeemableCapPct;
  const instant = voucher.payoutMode === "instant";
  const terms = [
    { label: "Max profit", value: `$${cap.toFixed(2)}` },
    { label: "Hold window", value: `${voucher.maxHoldingHours}h` },
    { label: "Payout", value: instant ? "Instant" : "Tiered by volume" },
  ];

  return (
    <div className="overflow-hidden" style={{ background: VT.surfaceDesk, borderBottom: `1px solid ${VT.line}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-[10px] text-left"
        style={{ minHeight: 56, borderLeft: `3px solid ${VT.volt}`, padding: "0 14px 0 13px" }}
      >
        <span
          className="font-display tabular-nums flex-none"
          style={{ fontSize: 24, lineHeight: 1, fontWeight: 700, letterSpacing: "-.02em", color: VT.volt }}
        >
          ${voucher.faceValue}
        </span>
        <span className="flex-1 min-w-0 truncate" style={{ fontSize: 12, fontWeight: 600, color: VT.ink }}>
          {sourceLabel ? `From ${sourceLabel}` : "Trial Position Voucher"}
        </span>
        {instant && (
          <span
            className="font-display uppercase flex-none"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: VT.volt }}
          >
            Instant
          </span>
        )}
        <ChevronDown
          className="w-4 h-4 flex-none transition-transform"
          style={{ color: VT.muted, transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {open && (
        <div
          className="flex flex-col gap-[10px]"
          style={{ borderTop: `1px solid ${VT.line}`, background: VT.surfaceInset, padding: "12px 14px" }}
        >
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            {terms.map((t) => (
              <div key={t.label} className="flex flex-col gap-[3px]">
                <span
                  className="font-display uppercase"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: VT.muted }}
                >
                  {t.label}
                </span>
                <span className="font-display tabular-nums" style={{ fontSize: 12.5, fontWeight: 700, color: VT.ink }}>
                  {t.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-[10px]">
            <span className="font-mono flex-none" style={{ fontSize: 10, color: VT.muted }}>
              {voucher.code}
            </span>
            <span className="text-right" style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.4 }}>
              {instant
                ? "Profit goes straight to your wallet"
                : "Profit lands in your pending balance, unlocked by volume"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
