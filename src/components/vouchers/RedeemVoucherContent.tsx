import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePositionVouchers, type PositionVoucher } from "@/hooks/usePositionVouchers";
import { EventPickerList, type PickedOption } from "./EventPickerList";
import { VoucherDeskHeader } from "./VoucherDeskHeader";
import { VT } from "./voucherTokens";

interface RedeemVoucherContentProps {
  voucher: PositionVoucher;
  onClose?: () => void;
  /** dialog/drawer wrap actions in a footer; `inline` renders inside the desk */
  variant?: "dialog" | "drawer" | "inline";
  sourceLabel?: string | null;
}

/**
 * Redeem flow — logic unchanged; chrome redrawn in flat tokens.
 * Frozen spec: OmenX Lite Vouchers v2 Final, frames 7 / 8 / 9.
 */
export const RedeemVoucherContent = ({
  voucher,
  onClose,
  variant = "dialog",
  sourceLabel,
}: RedeemVoucherContentProps) => {
  const [picked, setPicked] = useState<PickedOption | null>(null);
  const { redeem, isRedeeming } = usePositionVouchers();
  const navigate = useNavigate();
  const stickyBarRef = useRef<HTMLDivElement | null>(null);

  const cap = voucher.faceValue * voucher.redeemableCapPct;
  const size = picked ? voucher.faceValue / picked.price : 0;
  const isInline = variant === "inline";

  useEffect(() => {
    if (!isInline || !picked) return;
    const el = stickyBarRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const bottomNavOffset = window.matchMedia("(max-width: 767px)").matches ? 96 : 16;
      const targetBottom = window.innerHeight - bottomNavOffset;
      const delta = rect.bottom - targetBottom;
      if (delta > 0) window.scrollBy({ top: delta + 8, behavior: "smooth" });
    });
  }, [picked?.optionId, picked?.side, isInline]);

  const handleSubmit = async () => {
    if (!picked) return;
    const res = await redeem(voucher.id, picked.eventId, picked.optionId, picked.side);
    if (res.success) {
      onClose?.();
      // Route by product line: Standard (spot) markets live on /spot.
      const path = picked.productLine === "spot" ? "/spot" : "/trade";
      navigate(`${path}?event=${picked.eventId}`);
    }
  };

  /* ------------------------------ summary read-out ------------------------------ */
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

  const metaCells = picked && (
    <div className="grid gap-[10px]" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
      {[
        { label: "Entry", value: `${Math.round(picked.price * 100)}¢`, color: VT.ink },
        { label: "Size", value: `${size.toFixed(0)} shares`, color: VT.ink },
        { label: "Max profit", value: `$${cap.toFixed(2)}`, color: VT.volt },
      ].map((c) => (
        <div
          key={c.label}
          className="rounded-[10px] flex flex-col gap-[4px]"
          style={{ background: VT.surfaceInset, border: `1px solid ${VT.line}`, padding: "11px 13px" }}
        >
          <span className="font-display uppercase" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", color: VT.muted }}>
            {c.label}
          </span>
          <span className="font-display tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: c.color }}>
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );

  const confirmButton = (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!picked || isRedeeming}
      className="font-display rounded-[10px] flex-none"
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

  const resetWord = (
    <button type="button" onClick={() => setPicked(null)} style={{ fontSize: 12.5, color: VT.ink3 }}>
      Reset
    </button>
  );

  const picker = (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-baseline justify-between gap-[12px]">
        <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: VT.ink }}>
          Pick a market
        </span>
        <span style={{ fontSize: 11.5, color: VT.muted }}>One voucher opens one trial position</span>
      </div>
      <EventPickerList voucher={voucher} selected={picked} onSelect={setPicked} />
      {metaCells}
    </div>
  );

  /* --------------------------------- inline -------------------------------- */
  if (isInline) {
    return (
      <div className="flex flex-col">
        <div style={{ padding: "16px 20px 20px" }}>{picker}</div>

        <div
          ref={stickyBarRef}
          className="sticky bottom-[88px] md:bottom-0 z-10 flex items-center justify-between gap-[14px] flex-wrap"
          style={{
            borderTop: `1px solid ${VT.line}`,
            background: VT.surfaceInset,
            padding: "13px 16px",
            minHeight: 60,
          }}
        >
          {picked ? (
            <div className="flex flex-col gap-[2px] min-w-0 flex-1">
              {summaryLine}
              <span className="tabular-nums" style={{ fontSize: 11, color: VT.ink3 }}>
                ${voucher.faceValue} voucher · closes automatically after {voucher.maxHoldingHours}h
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: VT.ink3 }}>Pick an outcome above to see your trial position.</span>
          )}
          <div className="flex-none flex items-center gap-[12px]">
            {picked && resetWord}
            {confirmButton}
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------- dialog / drawer shell ------------------------ */
  return (
    <div className="flex flex-col gap-[12px]">
      <VoucherDeskHeader voucher={voucher} sourceLabel={sourceLabel} compact />
      {picker}
      <div
        className="flex items-center justify-between gap-[12px] rounded-[12px]"
        style={{ background: VT.surfaceInset, border: `1px solid ${VT.line}`, padding: "13px 16px" }}
      >
        {picked ? (
          <div className="flex flex-col gap-[2px] min-w-0 flex-1">
            {summaryLine}
            <span className="tabular-nums" style={{ fontSize: 11, color: VT.ink3 }}>
              ${voucher.faceValue} voucher · closes automatically after {voucher.maxHoldingHours}h
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: VT.ink3 }}>Pick an outcome above to see your trial position.</span>
        )}
        <div className="flex-none flex items-center gap-[12px]">
          {picked && resetWord}
          {confirmButton}
        </div>
      </div>
    </div>
  );
};
