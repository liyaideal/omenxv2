// ============================================================
// Lite /portfolio Live list — mobile position card + desktop grid row +
// the "waiting to fill" Pro order tail row. Literal spec (工单 §3).
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { settleLabel } from "@/lib/settleLabel";
import { boostSuffix } from "@/lib/liteSideName";
import type { LiteLiveRow } from "@/hooks/useLitePortfolio";
import { VOLT, RED, money, signedMoney } from "./parts";

const cents = (p: number) => `${Math.round(p * 100)}¢`;

const chipText = (row: LiteLiveRow) => `${row.sideWord} ${cents(row.priceNow)}`;

const metaLine = (row: LiteLiveRow) => {
  const parts = [row.categoryLabel];
  if (row.settlesAt) parts.push(`settles ${settleLabel(row.settlesAt)}`);
  const boost = boostSuffix(row.leverageNum);
  if (boost) parts.push(boost);
  return parts;
};

/** Row 4 sentence for the Boost segment. */
const autoCloseSentence = (row: LiteLiveRow) =>
  row.autoClosePrice != null
    ? `Auto-closes if price hits ${cents(row.autoClosePrice)} · now ${cents(row.priceNow)}`
    : null;


/* ----------------------------- mobile card ----------------------------- */
export const LiveCard = ({
  row,
  onCashOut,
}: {
  row: LiteLiveRow;
  onCashOut?: (row: LiteLiveRow) => void;
}) => {
  const navigate = useNavigate();
  const hot = row.hot;
  const sentence =
    row.segment === "standard"
      ? `If ${row.sideWord} wins you get ${money(row.ifWins)}`
      : autoCloseSentence(row);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(row.tradePath)}
      onKeyDown={(e) => e.key === "Enter" && navigate(row.tradePath)}
      className="rounded-[12px] bg-[#12151A] p-3.5 text-left"
      style={hot ? { border: "1px solid rgba(255,92,92,.55)" } : undefined}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 text-[14.5px] font-semibold leading-[1.35] text-[#F2F3F5]">
          {row.eventName}
        </div>
        <span
          className="shrink-0 rounded-[8px] px-[9px] py-1 font-mono text-[12px] font-bold"
          style={{ background: VOLT, color: "#0B0D10" }}
        >
          {chipText(row)}
        </span>
      </div>

      <div className="mt-1 text-[11.5px] text-[#6B7280]">
        {metaLine(row).join(" · ")}
        {row.isVoucher && (
          <>
            {" · "}
            <span style={{ color: VOLT }}>Voucher</span>
          </>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { k: "COST", v: money(row.cost), c: "#F2F3F5" },
          { k: "NOW WORTH", v: money(row.nowWorth), c: "#F2F3F5" },
          { k: "PROFIT", v: signedMoney(row.profit), c: row.profit >= 0 ? VOLT : RED },
        ].map((cell) => (
          <div key={cell.k}>
            <div className="text-[9.5px] text-[#6B7280]" style={{ letterSpacing: "1px" }}>
              {cell.k}
            </div>
            <div className="font-mono text-[15px] font-bold" style={{ color: cell.c }}>
              {cell.v}
            </div>
          </div>
        ))}
      </div>

      {sentence && (
        <div
          className="mt-[11px] text-[12px]"
          style={{ color: hot ? RED : "#6B7280" }}
        >
          {sentence}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCashOut?.(row);
        }}
        className="mt-3 h-10 w-full rounded-[10px] text-[13px] font-semibold text-[#F2F3F5]"
        style={{ border: "1px solid #2A2F38" }}
      >
        Cash out
      </button>
    </div>
  );
};

/* ---------------------------- desktop rows ---------------------------- */
export const DESKTOP_GRID = "minmax(0,1fr) 110px 96px 104px 100px 150px 170px";

export const LiveRowHeader = () => (
  <div
    className="grid px-4 py-2 text-[10px] text-[#6B7280]"
    style={{ gridTemplateColumns: DESKTOP_GRID, letterSpacing: "1.1px" }}
  >
    <span>CALL</span>
    <span>SIDE</span>
    <span>COST</span>
    <span>NOW WORTH</span>
    <span>PROFIT</span>
    <span>AUTO-CLOSE</span>
    <span>IF WINS</span>
  </div>
);

export const LiveRow = ({
  row,
  onCashOut,
}: {
  row: LiteLiveRow;
  onCashOut?: (row: LiteLiveRow) => void;
}) => {
  const navigate = useNavigate();
  const hot = row.hot;
  const lastCol =
    row.segment === "standard"
      ? `If ${row.sideWord} wins → ${money(row.ifWins)}`
      : row.autoClosePrice != null
        ? `${cents(row.autoClosePrice)} · now ${cents(row.priceNow)}`
        : "—";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(row.tradePath)}
      onKeyDown={(e) => e.key === "Enter" && navigate(row.tradePath)}
      className="grid items-center px-4 py-[13px] text-left"
      style={{
        gridTemplateColumns: DESKTOP_GRID,
        borderTop: "1px solid #1A1E24",
        boxShadow: hot ? "inset 3px 0 0 rgba(255,92,92,.7)" : undefined,
        background: hot ? "rgba(255,92,92,.04)" : undefined,
      }}
    >
      <div className="min-w-0 pr-3">
        <div className="truncate text-[13.5px] font-semibold text-[#F2F3F5]">{row.eventName}</div>
        <div className="truncate text-[11px] text-[#6B7280]">
          {metaLine(row).join(" · ")}
          {row.isVoucher && (
            <>
              {" · "}
              <span style={{ color: VOLT }}>Voucher</span>
            </>
          )}
        </div>
      </div>
      <div>
        <span
          className="rounded-[8px] px-[9px] py-1 font-mono text-[12px] font-bold"
          style={{ background: VOLT, color: "#0B0D10" }}
        >
          {chipText(row)}
        </span>
      </div>
      <div className="font-mono text-[13px] font-semibold text-[#F2F3F5]">{money(row.cost)}</div>
      <div className="font-mono text-[13px] font-semibold text-[#F2F3F5]">{money(row.nowWorth)}</div>
      <div
        className="font-mono text-[13px] font-semibold"
        style={{ color: row.profit >= 0 ? VOLT : RED }}
      >
        {signedMoney(row.profit)}
      </div>
      <div className="text-[12px]" style={{ color: hot ? RED : "#6B7280" }}>
        {row.segment === "standard" ? "—" : lastCol}
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className="text-[12px] text-[#6B7280]">
          {row.segment === "standard" ? lastCol : money(row.ifWins)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCashOut?.(row);
          }}
          className="h-8 rounded-[8px] px-3 text-[12.5px] font-semibold text-[#F2F3F5]"
          style={{ border: "1px solid #2A2F38" }}
        >
          Cash out
        </button>
      </div>
    </div>
  );
};

/* ------------------------- pending Pro orders ------------------------- */
export const PendingOrdersRow = ({ orders }: { orders: any[] }) => {
  const [open, setOpen] = useState(false);
  if (orders.length === 0) return null;
  return (
    <div
      className="rounded-[10px] px-[13px] py-[11px] text-[12.5px] text-[#6B7280]"
      style={{ border: "1px dashed #2A2F38" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-[12.5px] text-[#6B7280]"
      >
        <span>
          {orders.length} {orders.length === 1 ? "order" : "orders"} waiting to fill · placed in Pro
        </span>
        <span>›</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-[12px]">
              <span className="truncate pr-3 text-[#C7CCD4]">{o.event}</span>
              <span className="font-mono text-[#C7CCD4]">
                {o.size} @ {o.price}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
