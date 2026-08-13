import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePositionVouchers, type PositionVoucher } from "@/hooks/usePositionVouchers";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventPickerList, type PickedOption } from "./EventPickerList";
import { VoucherDeskHeader } from "./VoucherDeskHeader";
import { VT } from "./voucherTokens";
import { RedeemSummaryBar } from "./RedeemSummaryBar";

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
  const isMobile = useIsMobile();
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

  const mobileBleed = isInline && isMobile;

  const picker = (
    <div className="flex flex-col gap-[14px]">
      <EventPickerList voucher={voucher} selected={picked} onSelect={setPicked} />
      {metaCells && <div className={mobileBleed ? "px-4" : ""}>{metaCells}</div>}
    </div>
  );

  /* --------------------------------- inline -------------------------------- */
  if (isInline) {
    return (
      <div className="flex flex-col">
        <div className="md:px-5 pt-4 pb-5">
          {picker}
        </div>
        {/* mobile: room for the confirm bar once it rises from the bottom */}
        {picked && <div className="h-[150px] md:hidden" aria-hidden />}

        <RedeemSummaryBar
          innerRef={stickyBarRef}
          variant="inline"
          picked={picked}
          faceValue={voucher.faceValue}
          maxHoldingHours={voucher.maxHoldingHours}
          isRedeeming={isRedeeming}
          onConfirm={handleSubmit}
          onReset={() => setPicked(null)}
        />
      </div>
    );
  }

  /* --------------------------- dialog / drawer shell ------------------------ */
  return (
    <div className="flex flex-col gap-[12px]">
      <VoucherDeskHeader voucher={voucher} sourceLabel={sourceLabel} compact />
      {picker}
      <RedeemSummaryBar
        picked={picked}
        faceValue={voucher.faceValue}
        maxHoldingHours={voucher.maxHoldingHours}
        isRedeeming={isRedeeming}
        onConfirm={handleSubmit}
        onReset={() => setPicked(null)}
      />
    </div>
  );
};
