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
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
  flex: "none",
  width: 62,
};

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
  subtitle: string;
  right?: ReactNode;
  compact?: boolean;
}) => (
  <div className="flex items-end justify-between" style={{ gap: 24 }}>
    <div className="flex flex-col" style={{ gap: 7 }}>
      <span style={EYEBROW}>{eyebrow}</span>
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
}: {
  label: string;
  children: ReactNode;
  scroll?: boolean;
}) => (
  <div className="flex items-center" style={{ gap: 14 }}>
    <span style={ROW_LABEL}>{label}</span>
    <div
      className={
        scroll
          ? "flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex flex-wrap items-center"
      }
      style={{ gap: 8 }}
    >
      {children}
    </div>
  </div>
);

/** Filter pill — the list-page pill language (v3 sizing). */
export const DimensionPill = ({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={active}
    className="shrink-0 rounded-full px-[14px] py-[7px] text-[12.5px] transition-colors"
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
  subtitle: string;
  count: number;
  compact?: boolean;
}) => (
  <div className="flex items-start justify-between" style={{ gap: 16 }}>
    <div className="flex flex-col" style={{ gap: 7 }}>
      <span
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: compact ? 22 : 26,
          color: "#fff",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: compact ? 12 : 13, color: "#9AA1AC" }}>{subtitle}</span>
    </div>
    <span style={{ fontSize: 12, color: "#6B7280", flex: "none" }}>{count} open</span>
  </div>
);
