// ============================================================
// VERTICAL VIEW CHROME — module-header grammar + filter-row grammar
// shared by the Crypto and Finance vertical views. Pure assembly of
// the type scale already used by the Intraday / Sports views.
// ============================================================
import type { ReactNode } from "react";

export const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

export const ROW_LABEL: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
  flex: "none",
  width: 74,
};

/** Inline helper under a filter row — "Showing Stocks · US — 18 rounds open". */
export const RowHelper = ({
  scope,
  tail,
}: {
  scope: string;
  tail: string;
}) => (
  <span style={{ fontSize: 11, color: "#6B7280" }}>
    Showing <strong style={{ color: "#C9CED6", fontWeight: 700 }}>{scope}</strong> —{" "}
    {tail}
  </span>
);

/** Module header — eyebrow, display title, one plain-language line. */
export const VerticalHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
  compact,
}: {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  right?: ReactNode;
  compact?: boolean;
}) => (
  <div className="flex items-end justify-between" style={{ gap: 24 }}>
    <div className="flex flex-col" style={{ gap: 7 }}>
      <span style={{ ...EYEBROW, color: "#F2F3F5" }}>{eyebrow}</span>
      <span
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: compact ? 22 : 34,
          letterSpacing: "-0.03em",
          color: "#fff",
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: compact ? 12 : 13, color: "#9AA1AC" }}>{subtitle}</span>
    </div>
    {right}
  </div>
);

/** One labelled filter row: LABEL + a horizontal set of controls. */
export const DimensionRow = ({
  label,
  children,
  scroll,
  labelWidth,
}: {
  label: string;
  children: ReactNode;
  scroll?: boolean;
  /** Widen the label gutter for longer labels ("ASSET CLASS"). */
  labelWidth?: number;
}) => (
  <div className="flex items-center" style={{ gap: 14 }}>
    <span style={labelWidth ? { ...ROW_LABEL, width: labelWidth } : ROW_LABEL}>
      {label}
    </span>
    <div
      className={
        scroll
          ? "flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex flex-wrap items-center"
      }
      style={
        scroll
          ? {
              gap: 7,
              maskImage:
                "linear-gradient(to right,#000 0,#000 calc(100% - 18px),transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right,#000 0,#000 calc(100% - 18px),transparent 100%)",
            }
          : { gap: 7 }
      }
    >
      {children}
    </div>
  </div>
);

/**
 * Filter pill. Desktop = the list-page v3 pill (32px). Mobile = the 44px
 * MobileCategoryRow grammar (CHK-7 — touch targets never shrink).
 */
export const DimensionPill = ({
  label,
  active,
  onSelect,
  mobile,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  mobile?: boolean;
}) =>
  mobile ? (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="flex flex-none items-center"
      style={{
        borderRadius: 999,
        minHeight: 44,
        fontSize: 12,
        padding: active ? "0 15px" : "0 14px",
        background: active ? "#fff" : "transparent",
        color: active ? "#0A0B0D" : "#9AA1AC",
        border: `1px solid ${active ? "#fff" : "#23262D"}`,
        fontWeight: active ? 700 : 600,
      }}
    >
      {label}
    </button>
  ) : (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={active}
    className={`shrink-0 rounded-full px-[14px] py-[7px] text-[12.5px] transition-colors${
      active ? "" : " hover:border-[#F2F3F5] hover:text-white"
    }`}
    style={
      active
        ? { background: "#fff", color: "#0A0B0D", fontWeight: 600 }
        : {
            border: "1.5px solid #2B2F38",
            color: "#C9CED6",
          }
    }
  >
    {label}
  </button>
);

/** Catalogue section header — same grammar as "Will it happen?". */
export const CatalogueHeader = ({
  title,
  subtitle,
  count,
  compact,
}: {
  title: string;
  subtitle: ReactNode;
  count: number;
  compact?: boolean;
}) => (
  <div className="flex items-start justify-between" style={{ gap: 16 }}>
    <div className="flex flex-col" style={{ gap: 7 }}>
      <span
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: compact ? 22 : 20,
          color: "#fff",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: 12, color: "#9AA1AC" }}>{subtitle}</span>
    </div>
    <span style={{ fontSize: 11, color: "#6B7280", flex: "none" }}>{count} open</span>
  </div>
);
