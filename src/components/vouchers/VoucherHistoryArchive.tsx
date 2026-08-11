import { useState } from "react";
import type { PositionVoucher } from "@/hooks/usePositionVouchers";
import { VT, shortDate } from "./voucherTokens";

/**
 * Voucher history — collapsed / expanded archive bar.
 * Same shape as Ended campaigns: r12, 1px #1D2026, bg #0F1114, min-height 44,
 * in place, no route. Frozen spec: Vouchers v2 Final, frame 4.
 */
export const VoucherHistoryArchive = ({ items }: { items: PositionVoucher[] }) => {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  const settledProfit = items.reduce(
    (sum, v) => sum + Math.max(0, v.redeemedSettledPnl ?? 0),
    0,
  );

  const header = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full flex items-center justify-between gap-[10px] text-left"
      style={{ minHeight: 44, padding: "0 14px" }}
    >
      <span className="tabular-nums" style={{ fontSize: 12, color: VT.ink2 }}>
        Voucher history ({items.length})
        {settledProfit > 0 && (
          <>
            {" · "}
            <span style={{ color: VT.volt, fontWeight: 600 }}>${settledProfit.toFixed(2)} profit settled</span>
          </>
        )}
      </span>
      <span className="font-display" style={{ fontSize: 12, fontWeight: 600, color: VT.ink3 }}>
        {open ? "Hide ▴" : "Show ▾"}
      </span>
    </button>
  );

  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{ background: VT.surfaceCard, border: `1px solid ${VT.line}` }}
    >
      <div style={{ borderBottom: open ? `1px solid ${VT.line}` : undefined }}>{header}</div>
      {open && (
        <div style={{ padding: "4px 14px 12px" }}>
          {items.map((v, i) => (
            <HistoryRow key={v.id} voucher={v} last={i === items.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryRow = ({ voucher: v, last }: { voucher: PositionVoucher; last: boolean }) => {
  const isExpired = v.status === "expired";
  const settled = v.status === "settled" || v.redeemedAirdropStatus === "settled";
  const pnl = v.redeemedSettledPnl;
  const won = settled && pnl != null && pnl > 0;

  const title = isExpired
    ? "Voucher expired"
    : v.redeemedEventName ?? "Trial position";

  const meta = isExpired
    ? `$${v.faceValue} voucher · ${v.claimedAt ? "Claimed, not redeemed" : "Unclaimed"}`
    : `$${v.faceValue} voucher · ${settled ? (won ? "Won" : "Lost") : "Open"} · ${shortDate(
        v.redeemedAt ?? v.issuedAt,
      )}`;

  return (
    <div
      className="flex items-center gap-[10px]"
      style={{ padding: "10px 0", borderBottom: last ? undefined : `1px solid ${VT.hairline}` }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: isExpired ? VT.ink2 : VT.ink }}>
          {title}
        </span>
        <span className="tabular-nums" style={{ fontSize: 10.5, color: VT.muted }}>
          {meta}
        </span>
      </div>
      {isExpired ? (
        <span className="flex-none font-display" style={{ fontSize: 11.5, fontWeight: 700, color: VT.muted }}>
          Expired
        </span>
      ) : settled ? (
        <span className="flex-none flex flex-col items-end gap-[2px]">
          <span
            className="font-display tabular-nums"
            style={{ fontSize: 12.5, fontWeight: 700, color: won ? VT.volt : VT.muted }}
          >
            {won ? `+$${pnl!.toFixed(2)}` : "$0.00"}
          </span>
          <span style={{ fontSize: 10, color: VT.muted }}>
            {won
              ? v.payoutMode === "instant"
                ? "Credited to wallet"
                : "Added to pending"
              : "Voucher lost · nothing owed"}
          </span>
        </span>
      ) : (
        <span className="flex-none font-display" style={{ fontSize: 11.5, fontWeight: 700, color: VT.ink3 }}>
          Open
        </span>
      )}
    </div>
  );
};
