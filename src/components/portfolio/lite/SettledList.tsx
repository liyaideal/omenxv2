// ============================================================
// Lite /portfolio Settled list — month groups, lazy month loading,
// series aggregate rows. Literal spec (工单 §4).
// ============================================================
import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LiteMonthGroup, LiteSettledRow } from "@/hooks/useLitePortfolio";
import { RED, signedMoney, pnlColor } from "./parts";

const MetaLine = forwardRef<HTMLDivElement, { row: LiteSettledRow }>(({ row }, ref) => (
  <div ref={ref} className="truncate text-[11px] text-[#6B7280]">
    {row.metaParts.map((p, i) => {
      const last = i === row.metaParts.length - 1;
      const isRemark = last && row.remark !== "none";
      return (
        <span key={p + i} style={isRemark && row.remark === "auto_close" ? { color: RED } : undefined}>
          {i > 0 ? " · " : ""}
          {p}
        </span>
      );
    })}
  </div>
));
MetaLine.displayName = "MetaLine";

export const SettledRow = forwardRef<HTMLButtonElement, { row: LiteSettledRow }>(({ row }, ref) => {
  const navigate = useNavigate();
  const go = () =>
    row.isSeries
      ? navigate(`/portfolio?tab=settled&series=${encodeURIComponent(row.seriesId ?? "")}`)
      : navigate(`/portfolio/settlement/${row.id}`);
  return (
    <button
      ref={ref}
      type="button"
      onClick={go}
      className="flex w-full items-center gap-3 px-4 py-[13px] text-left"
      style={{ borderBottom: "1px solid rgba(28,31,38,.8)" }}
    >

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-[#F2F3F5]">{row.title}</div>
        <MetaLine row={row} />
      </div>
      <span
        className="font-mono text-[14px] font-bold"
        style={{ color: pnlColor(row.net) }}
      >
        {signedMoney(row.net)}
      </span>
      <span className="text-[#6B7280]">›</span>
    </button>
  );
});
SettledRow.displayName = "SettledRow";


export const SettledList = ({ groups }: { groups: LiteMonthGroup[] }) => {
  const [visible, setVisible] = useState(2);
  if (groups.length === 0) {
    return (
      <div className="py-14 text-center text-[13px] text-[#6B7280]">Nothing settled yet</div>
    );
  }
  return (
    <div>
      {groups.slice(0, visible).map((g) => (
        <div key={g.key}>
          <div
            className="px-4 pb-1.5 pt-4 text-[10px] font-bold text-[#6B7280]"
            style={{ letterSpacing: "1.4px" }}
          >
            {g.label}
          </div>
          {g.rows.map((r) => (
            <SettledRow key={r.id} row={r} />
          ))}
        </div>
      ))}
      {visible < groups.length && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + 2)}
          className="mx-4 mt-4 h-10 w-[calc(100%-2rem)] rounded-[10px] text-[13px] font-semibold text-[#F2F3F5]"
          style={{ border: "1px solid #2A2F38" }}
        >
          Load earlier months
        </button>
      )}
    </div>
  );
};
