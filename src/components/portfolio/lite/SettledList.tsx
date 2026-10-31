// ============================================================
// Lite /portfolio Settled list — month groups, lazy month loading,
// series aggregate rows. Literal spec (工单 §4).
// Month group headers are collapsible (mobile + desktop share this
// component): tap/click the header to hide or show that month's rows.
// ============================================================
import { t } from "@/i18n";
import { forwardRef, useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { savePortfolioScroll } from "@/lib/portfolioReturn";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LiteMonthGroup, LiteSettledRow } from "@/hooks/useLitePortfolio";
import { RED, signedMoney, pnlColor } from "./parts";
import { PortfolioEmptySettled } from "./PortfolioAsyncStates";
import { QuickPlayTag } from "./QuickPlayTag";

// `wrap`: the phone variant of a Quick Play session row may run to two lines
// (`BTC · 5 calls · won 1 of 5 · $100 a call · 1 cancelled` does not fit 375)
// instead of losing its tail to an ellipsis (CPO 2026-10-31).
const MetaLine = forwardRef<HTMLDivElement, { row: LiteSettledRow; parts?: string[]; wrap?: boolean }>(({ row, parts = row.metaParts, wrap }, ref) => (
  <div ref={ref} className={`${wrap ? "" : "truncate "}text-[11px] leading-[15px] text-[#6B7280]`}>
    {parts.map((p, i) => {
      const last = i === parts.length - 1;
      const isRemark = last && row.remark !== "none";
      // Separator outside the part, with a no-break space before the dot: a
      // wrapped line can only break after "· ", never inside "$5 – $25 a call".
      return (
        <Fragment key={p + i}>
          {i > 0 ? "\u00a0· " : ""}
          <span className={wrap ? "whitespace-nowrap" : undefined} style={isRemark && row.remark === "auto_close" ? { color: RED } : undefined}>
            {p}
          </span>
        </Fragment>
      );
    })}
  </div>
));
MetaLine.displayName = "MetaLine";

export const SettledRow = forwardRef<HTMLButtonElement, { row: LiteSettledRow; highlight?: boolean }>(({ row, highlight }, ref) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const narrow = isMobile && row.mobile ? row.mobile : null;
  const go = () => {
    savePortfolioScroll();
    if (row.kind === "quickplay") return navigate(`/portfolio/quick-play/${row.sessionKey}`);
    return row.isSeries
      ? navigate(`/portfolio?tab=settled&series=${encodeURIComponent(row.seriesId ?? "")}`)
      : navigate(`/portfolio/settlement/${row.id}`);
  };
  return (
    <button
      ref={ref}
      type="button"
      onClick={go}
      className="flex w-full items-center gap-3 px-4 py-[13px] text-left"
      style={{
        borderBottom: "1px solid rgba(28,31,38,.8)",
        // the row the cabinet just sent you to — a short lime wash, then gone
        background: highlight ? "rgba(207,255,74,.08)" : "transparent",
        transition: "background 1.2s ease",
      }}
    >

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-[#F2F3F5]">{narrow ? narrow.title : row.title}</span>
          {row.kind === "quickplay" && <QuickPlayTag />}
        </div>
        <MetaLine row={row} parts={narrow ? narrow.metaParts : undefined} wrap={!!narrow} />
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


export const SettledList = ({ groups, highlightId }: { groups: LiteMonthGroup[]; highlightId?: string | null }) => {
  const [visible, setVisible] = useState(2);
  // The highlighted row (arrived from the cabinet) washes lime for ~2 s.
  const [hl, setHl] = useState<string | null>(highlightId ?? null);
  useEffect(() => {
    setHl(highlightId ?? null);
    if (!highlightId) return;
    const t = setTimeout(() => setHl(null), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);
  // Collapsed month keys. Default: every group expanded; not persisted.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (groups.length === 0) {
    return <PortfolioEmptySettled />;
  }
  return (
    <div>
      {groups.slice(0, visible).map((g) => {
        const isCollapsed = collapsed.has(g.key);
        return (
          <div key={g.key}>
            <button
              type="button"
              onClick={() => toggle(g.key)}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center gap-1.5 px-4 pb-1.5 pt-4 text-left"
            >
              <span
                className="text-[10px] font-bold text-[#6B7280]"
                style={{ letterSpacing: "1.4px" }}
              >
                {g.label}
              </span>
              <span className="font-mono text-[10px] text-[#6B7280]/60">
                ({g.rows.length})
              </span>
              <ChevronDown
                className={`ml-auto h-3.5 w-3.5 text-[#6B7280] transition-transform duration-200 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
            {!isCollapsed && g.rows.map((r) => (
              <SettledRow key={r.id} row={r} highlight={hl === r.id} />
            ))}
          </div>
        );
      })}
      {visible < groups.length && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + 2)}
          className="mx-4 mt-4 h-10 w-[calc(100%-2rem)] rounded-[10px] text-[13px] font-semibold text-[#F2F3F5]"
          style={{ border: "1px solid #2A2F38" }}
        >
          {t("portfolio.lite.settled.load_more")}
        </button>
      )}
    </div>
  );
};
