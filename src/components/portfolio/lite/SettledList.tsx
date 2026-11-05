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
import { ShareIconButton } from "@/components/lite/share/ShareIconButton";

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

export const SettledRow = forwardRef<HTMLDivElement, { row: LiteSettledRow; highlight?: boolean; onShare?: (row: LiteSettledRow) => void }>(({ row, highlight, onShare }, ref) => {
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
    // The whole row opens the detail (a full-bleed button underneath); the
    // share icon sits above it as its own button — never a button in a button.
    <div
      ref={ref}
      className={`relative flex w-full items-center ${isMobile ? "gap-2" : "gap-3"} px-4 py-[13px] text-left`}
      style={{
        borderBottom: "1px solid rgba(28,31,38,.8)",
        // the row the cabinet just sent you to — a short lime wash, then gone
        background: highlight ? "rgba(207,255,74,.08)" : "transparent",
        transition: "background 1.2s ease",
      }}
    >
      <button
        type="button"
        onClick={go}
        aria-label={row.title}
        className="absolute inset-0 h-full w-full"
      />

      <div className="pointer-events-none min-w-0 flex-1">
        {narrow ? (
          // Phone Quick Play row: the time span is the row's identity, so it wraps
          // (breaking only at " – ") with the tag flowing after it on the last line
          // instead of being cut to "Oct 29 23:50 – Oct…" (CPO 2026-10-31).
          <div className="min-w-0 text-[13.5px] font-semibold leading-[18px] text-[#F2F3F5]">
            {narrow.title.split(" – ").map((part, i) => (
              <Fragment key={i}>
                {i > 0 ? "\u00a0– " : ""}
                <span className="whitespace-nowrap">{part}</span>
              </Fragment>
            ))}
            {row.kind === "quickplay" && <QuickPlayTag className="ml-2 align-middle" />}
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            {/* Phone: the share icon + fixed amount column take ~70px, so the title
                may run to two lines and the meta wraps instead of losing its tail
                (e.g. `auto-closed`) to an ellipsis (2026-11-05). */}
            <span className={`${isMobile ? "line-clamp-2 leading-[18px]" : "truncate"} text-[13.5px] font-semibold text-[#F2F3F5]`}>{row.title}</span>
            {row.kind === "quickplay" && <QuickPlayTag />}
          </div>
        )}
        <MetaLine row={row} parts={narrow ? narrow.metaParts : undefined} wrap={!!narrow || isMobile} />
      </div>
      {/* 2026-11-05 · share on every settled row, left of the amount. The amount
          column is fixed-width + right-aligned so the icons line up in one column. */}
      {onShare && <ShareIconButton onClick={() => onShare(row)} className="relative z-10" />}
      <span
        className="pointer-events-none min-w-[88px] text-right font-mono text-[14px] font-bold"
        style={{ color: pnlColor(row.net) }}
      >
        {signedMoney(row.net)}
      </span>
      <span className="pointer-events-none text-[#6B7280]">›</span>
    </div>
  );
});
SettledRow.displayName = "SettledRow";


export const SettledList = ({ groups, highlightId, onShare }: { groups: LiteMonthGroup[]; highlightId?: string | null; onShare?: (row: LiteSettledRow) => void }) => {
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
              <SettledRow key={r.id} row={r} highlight={hl === r.id} onShare={onShare} />
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
