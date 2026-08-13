/**
 * Pure presentational pieces of the voucher market picker.
 *
 * Vouchers v2.1 correction round (2026-08-13): every number below is copied
 * literally from the frozen mock's inline styles. Where a VT token or a
 * tailwind class disagreed with the mock, the literal wins — do not
 * "approximate with the nearest token".
 */
import { Lock, Search } from "lucide-react";
import { VT } from "./voucherTokens";

export const cents = (p: number) => `${Math.round(p * 100)}¢`;

/** meta caps — mobile 9px / desktop 9px, .12em, #6B7280 */
export const MetaCaps = ({ children }: { children: React.ReactNode }) => (
  <span
    className="font-display uppercase"
    style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "#6B7280" }}
  >
    {children}
  </span>
);

/** Boost / Standard / "4 options" tag — mock: 9px .1em, r5, pad 3px 6px */
export const LineBadge = ({
  children,
  strong,
  desktop,
}: {
  children: React.ReactNode;
  strong?: boolean;
  desktop?: boolean;
}) => (
  <span
    className="font-display uppercase"
    style={{
      fontSize: desktop ? 9.5 : 9,
      fontWeight: 700,
      letterSpacing: ".1em",
      color: strong ? "#C9CED6" : "#6B7280",
      background: "#101216",
      border: `1px solid ${strong ? "#2B2F38" : "#1D2026"}`,
      borderRadius: desktop ? 6 : 5,
      padding: desktop ? "4px 7px" : "3px 6px",
    }}
  >
    {children}
  </span>
);

export const SideButton = ({
  label,
  tone,
  picked,
  disabled,
  onClick,
  block,
  mobile,
  price,
  pair,
}: {
  label: string;
  tone: "neutral" | "yes" | "no";
  picked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  block?: boolean;
  mobile?: boolean;
  /** 0–1 probability rendered on the right edge of the button */
  price?: number;
  /** direction-pair geometry: min-h 44, r11, pad 0 14, label 12 / price 15 */
  pair?: boolean;
}) => {
  const AXIS = {
    yes: { fg: "#33D6FF", border: "rgba(51,214,255,.4)", tint: "rgba(51,214,255,.08)", fill: "#33D6FF" },
    no: { fg: "#CFFF4A", border: "rgba(207,255,74,.35)", tint: "rgba(207,255,74,.06)", fill: "#CFFF4A" },
    neutral: { fg: VT.ink, border: "#2B2F38", tint: "transparent", fill: "#CFFF4A" },
  }[tone];

  /* --- complementary direction pair (mock: 市场卡 · 方向对) --- */
  if (pair) {
    const fg = picked ? "#0A0B0D" : disabled ? VT.muted2 : AXIS.fg;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="font-display w-full flex items-center justify-between gap-[8px]"
        style={{
          minHeight: 44,
          borderRadius: 11,
          padding: "0 14px",
          background: picked ? AXIS.fill : disabled ? "transparent" : AXIS.tint,
          border: picked ? "none" : `1px solid ${disabled ? "#23262D" : AXIS.border}`,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span className="truncate" style={{ fontSize: 12, fontWeight: 700, color: fg }}>
          {label}
        </span>
        {price !== undefined && (
          <span className="tabular-nums flex-none" style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, color: fg }}>
            {cents(price)}
          </span>
        )}
      </button>
    );
  }

  /* --- multi-option Yes/No button (mock: 真多选卡) --- */
  if (price !== undefined) {
    const fg = picked ? "#0A0B0D" : disabled ? VT.muted2 : AXIS.fg;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="font-display w-full flex items-center justify-between gap-[8px]"
        style={{
          minHeight: 44,
          borderRadius: 8,
          padding: "0 14px",
          background: picked ? AXIS.fill : "transparent",
          border: picked ? "none" : `1px solid ${disabled ? "#23262D" : AXIS.border}`,
          fontSize: 12,
          fontWeight: 700,
          color: fg,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span>{picked ? "Picked" : label}</span>
        <span
          className="tabular-nums"
          style={{ fontSize: 12, fontWeight: 700, color: picked ? "#0A0B0D" : disabled ? VT.muted2 : "#9AA1AC" }}
        >
          {cents(price)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-display rounded-[8px] ${block ? "min-h-[44px] w-full flex items-center justify-center" : ""}`}
      style={{
        fontSize: block ? 12 : mobile ? 12 : 11.5,
        fontWeight: 700,
        padding: block ? undefined : mobile ? "0 14px" : "5px 10px",
        minHeight: block ? undefined : mobile ? 36 : undefined,
        color: picked ? "#0A0B0D" : disabled ? VT.muted2 : AXIS.fg,
        background: picked ? AXIS.fill : "transparent",
        border: picked ? "none" : `1px solid ${disabled ? "#23262D" : AXIS.border}`,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {picked ? "Picked" : label}
    </button>
  );
};

/**
 * Complementary market (two mutually exclusive outcomes) — one direction pair
 * replaces the two neutral Buy rows. Same branch on mobile and desktop desk:
 * it is a data rule, not a viewport rule.
 */
export const PickerDirectionPair = ({
  mobile,
  longLabel,
  longPrice,
  shortLabel,
  shortPrice,
  pickedLong,
  pickedShort,
  dimLong,
  dimShort,
  onPick,
}: {
  mobile: boolean;
  longLabel: string;
  longPrice: number;
  shortLabel: string;
  shortPrice: number;
  pickedLong?: boolean;
  pickedShort?: boolean;
  dimLong?: boolean;
  dimShort?: boolean;
  onPick?: (side: "long" | "short") => void;
}) => (
  <div className="grid grid-cols-2 gap-[8px]">
    <SideButton
      pair
      mobile={mobile}
      tone="yes"
      label={longLabel}
      price={longPrice}
      picked={pickedLong}
      disabled={dimLong}
      onClick={() => onPick?.("long")}
    />
    <SideButton
      pair
      mobile={mobile}
      tone="no"
      label={shortLabel}
      price={shortPrice}
      picked={pickedShort}
      disabled={dimShort}
      onClick={() => onPick?.("short")}
    />
  </div>
);

export interface PickerOptionRowProps {
  label: string;
  price: number;
  isBinary: boolean;
  mobile: boolean;
  dim?: boolean;
  pickedLong?: boolean;
  pickedShort?: boolean;
  onPick?: (side: "long" | "short") => void;
}

/** Real multi-option row — nested box, name line, Yes/No pair underneath. */
export const PickerOptionRow = ({
  label,
  price,
  mobile,
  dim,
  pickedLong,
  pickedShort,
  onPick,
}: PickerOptionRowProps) => {
  const picked = !!(pickedLong || pickedShort);
  return (
    <div
      className="flex flex-col gap-[8px]"
      style={{
        background: "#0A0B0D",
        border: `1px solid ${picked ? "#CFFF4A" : "#23262D"}`,
        borderRadius: 9,
        padding: "9px 11px 10px",
      }}
    >
      <span
        className="min-w-0 truncate"
        style={{ fontSize: 11.5, lineHeight: 1.3, fontWeight: picked ? 600 : 400, color: dim ? "#6B7280" : VT.ink }}
      >
        {label}
      </span>
      <div className="grid grid-cols-2 gap-[7px]">
        <SideButton mobile={mobile} label="Yes" tone="yes" price={price} picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
        <SideButton mobile={mobile} label="No" tone="no" price={1 - price} picked={pickedShort} disabled={dim} onClick={() => onPick?.("short")} />
      </div>
    </div>
  );
};

/** "Show N more options" / "Show fewer" — mock: plain text row, 11.5px #9AA1AC, pad-top 2. */
export const PickerMoreOptionsRow = ({
  hiddenCount,
  expanded,
  onToggle,
}: {
  hiddenCount: number;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-left"
    style={{ fontSize: 11.5, color: "#9AA1AC", paddingTop: 2, background: "none", border: "none", cursor: "pointer" }}
  >
    {expanded ? "Show fewer" : `Show ${hiddenCount} more option${hiddenCount === 1 ? "" : "s"}`}
  </button>
);

export const PickerBlockedReason = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-[6px]" style={{ fontSize: 11, color: "#9AA1AC", lineHeight: 1.5, paddingTop: 6 }}>
    <Lock className="w-3 h-3 flex-none" style={{ marginTop: 2, color: VT.ink2 }} />
    {children}
  </div>
);

export interface EventPickerCardProps {
  mobile: boolean;
  name: string;
  meta: React.ReactNode;
  /** raw product lines — "futures" → Boost badge, "spot" → Standard badge */
  lines: string[];
  tail?: React.ReactNode;
  eligible?: boolean;
  locked?: boolean;
  /** any outcome of this event is the current pick → volt card border */
  picked?: boolean;
  rowsLayout?: "grid" | "stack";
  children?: React.ReactNode;
}

/** Market card — mock: #0F1114 / 1px #1D2026 / r12 / pad 13 (volt border when picked). */
export const EventPickerCard = ({
  mobile,
  name,
  meta,
  lines,
  tail,
  eligible = true,
  locked = false,
  picked = false,
  rowsLayout = "stack",
  children,
}: EventPickerCardProps) => {
  const badges = (
    <>
      {lines.includes("futures") && <LineBadge strong desktop={!mobile}>Boost</LineBadge>}
      {lines.includes("spot") && <LineBadge strong desktop={!mobile}>Standard</LineBadge>}
      {!locked && tail && <LineBadge desktop={!mobile}>{tail}</LineBadge>}
      {locked && (
        <span className="flex items-center gap-[5px]" style={{ fontSize: 11, fontWeight: 600, color: VT.ink2 }}>
          <Lock className="w-3 h-3" />
          Voucher already used
        </span>
      )}
    </>
  );

  const mobileHeader = (
    <div className="flex flex-col gap-[3px]" style={{ marginBottom: 10 }}>
      <span className="line-clamp-2" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: eligible ? VT.ink : VT.ink2 }}>
        {name}
      </span>
      <div className="flex items-center gap-[6px] flex-wrap">
        {badges}
        <MetaCaps>{meta}</MetaCaps>
      </div>
    </div>
  );

  const desktopHeader = (
    <div className="flex items-start justify-between gap-[12px]" style={{ marginBottom: 10 }}>
      <div className="flex flex-col gap-[3px] min-w-0">
        <span className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: eligible ? VT.ink : VT.ink2 }}>
          {name}
        </span>
        <MetaCaps>{meta}</MetaCaps>
      </div>
      <div className="flex-none flex items-center gap-[6px] flex-wrap justify-end">{badges}</div>
    </div>
  );

  return (
    <div
      style={{
        background: "#0F1114",
        border: `1px solid ${picked && !locked ? "#CFFF4A" : "#1D2026"}`,
        borderRadius: 12,
        padding: 13,
        opacity: locked ? 0.5 : eligible ? 1 : 0.62,
      }}
    >
      {mobile ? mobileHeader : desktopHeader}
      <div className={rowsLayout === "grid" && !mobile ? "grid grid-cols-2 gap-[8px]" : "flex flex-col gap-[8px]"}>
        {children}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Picker chrome — skeleton / empty / search bar.
 * ------------------------------------------------------------------------ */

/** Loading placeholder cards shown while active events resolve. */
export const PickerSkeleton = () => (
  <>
    {[0, 1].map((i) => (
      <div
        key={i}
        className="flex flex-col gap-[10px]"
        style={{ background: "#0F1114", border: "1px solid #1D2026", borderRadius: 12, padding: 13 }}
      >
        <div className="flex flex-col gap-[6px]">
          <span className="rounded-[4px]" style={{ width: "70%", height: 12, background: "#171A1F" }} />
          <span className="rounded-[4px]" style={{ width: "38%", height: 9, background: "#15181C" }} />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          {[0, 1].map((j) => (
            <span key={j} style={{ height: 44, borderRadius: 11, background: "#0A0B0D", border: "1px solid #16191E" }} />
          ))}
        </div>
      </div>
    ))}
  </>
);

/** Empty result card — search miss. */
export const PickerEmpty = ({ query, onClear }: { query?: string; onClear?: () => void }) => (
  <div
    className="flex flex-col items-center gap-[9px] text-center"
    style={{ background: "#0F1114", border: "1px solid #1D2026", borderRadius: 12, padding: "26px 18px" }}
  >
    <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: VT.ink }}>
      {query ? `No markets match “${query}”` : "No markets take a voucher right now"}
    </span>
    <span style={{ fontSize: 11.5, color: "#9AA1AC", lineHeight: 1.6, maxWidth: 250 }}>
      Nothing here right now takes a voucher. Clear the filter to see everything eligible.
    </span>
    <button
      type="button"
      onClick={onClear}
      className="font-display flex items-center justify-center"
      style={{
        marginTop: 4,
        minHeight: 44,
        padding: "0 18px",
        border: "1px solid #2B2F38",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 700,
        color: VT.ink,
      }}
    >
      Clear filters
    </button>
  </div>
);

/**
 * Nothing eligible right now — the voucher stays alive, so this is a wait
 * state, not a failure. Copy is locked (Vouchers v2.1).
 */
export const PickerNoEligible = ({
  expiresLabel,
  onBrowse,
}: {
  expiresLabel: string;
  onBrowse?: () => void;
}) => (
  <div
    className="flex flex-col items-center gap-[9px] text-center"
    style={{ background: "#0F1114", border: "1px solid #1D2026", borderRadius: 12, padding: "26px 18px" }}
  >
    <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: VT.ink }}>
      No eligible markets right now
    </span>
    <span style={{ fontSize: 11.5, color: "#9AA1AC", lineHeight: 1.6, maxWidth: 250 }}>
      This voucher opens a trial position on Boost and Standard markets priced between 20¢ and 80¢. None are
      open at the moment — the voucher stays valid until {expiresLabel}.
    </span>
    <button
      type="button"
      onClick={onBrowse}
      className="font-display flex items-center justify-center"
      style={{
        marginTop: 4,
        minHeight: 44,
        padding: "0 18px",
        border: "1px solid #2B2F38",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 700,
        color: VT.ink,
      }}
    >
      Browse all events
    </button>
  </div>
);

/** Market search field. */
export const PickerSearchBar = ({
  value,
  onChange,
  mobile,
}: {
  value: string;
  onChange?: (v: string) => void;
  mobile?: boolean;
}) => (
  <div
    className="flex items-center gap-[9px]"
    style={{
      background: "#101216",
      border: "1px solid #1D2026",
      borderRadius: 10,
      padding: "0 12px",
      minHeight: mobile ? 44 : 40,
    }}
  >
    <Search className="w-[15px] h-[15px] flex-none" style={{ color: "#6B7280" }} />
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="Search markets"
      className="flex-1 bg-transparent outline-none"
      style={{ fontSize: 12.5, color: VT.ink }}
    />
  </div>
);
