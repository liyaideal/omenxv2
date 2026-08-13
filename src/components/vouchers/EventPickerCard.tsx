/**
 * Pure presentational pieces of the voucher market picker.
 *
 * Extracted verbatim from EventPickerList (same JSX / same tokens) so the
 * style-guide can mount the real card + rows with mock props instead of a
 * hand-copied replica. No behaviour lives here — every interaction arrives
 * through props.
 */
import { Lock, Search } from "lucide-react";
import { VT } from "./voucherTokens";

export const cents = (p: number) => `${Math.round(p * 100)}¢`;

export const MetaCaps = ({ children }: { children: React.ReactNode }) => (
  <span
    className="font-display uppercase"
    style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", color: VT.muted }}
  >
    {children}
  </span>
);

export const LineBadge = ({ children, strong }: { children: React.ReactNode; strong?: boolean }) => (
  <span
    className="font-display uppercase rounded-[6px]"
    style={{
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: ".1em",
      color: strong ? VT.ink2 : VT.muted,
      background: VT.surfaceInset,
      border: `1px solid ${strong ? VT.line3 : VT.line}`,
      padding: "4px 7px",
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
  /** direction-pair geometry: 44px tall, radius 11, label left / price right */
  pair?: boolean;
}) => {
  const base = {
    yes: { color: "hsl(192 100% 60%)", border: "hsl(192 100% 60% / .4)" },
    no: { color: "hsl(74 100% 65%)", border: "hsl(74 100% 65% / .4)" },
    neutral: { color: VT.ink, border: VT.line3 },
  }[tone];
  /* Picked fill follows the market axis: Yes = --yes (Pulse Blue),
     No = --no (Volt). neutral (binary Buy) keeps its volt fill. */
  const pickedBg =
    tone === "yes" ? "hsl(192 100% 60%)" : tone === "no" ? "hsl(74 100% 65%)" : "hsl(74 100% 65%)";

  if (pair) {
    const tint = tone === "yes" ? "rgba(51,214,255,.08)" : "rgba(207,255,74,.06)";
    const brd = tone === "yes" ? "rgba(51,214,255,.4)" : "rgba(207,255,74,.35)";
    const fg = picked ? "#0A0B0D" : disabled ? VT.muted2 : base.color;
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
          background: picked ? pickedBg : disabled ? "transparent" : tint,
          border: picked ? "none" : `1px solid ${disabled ? VT.line2 : brd}`,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span className="truncate" style={{ fontSize: mobile ? 13 : 13.5, fontWeight: 700, color: fg }}>
          {label}
        </span>
        {price !== undefined && (
          <span
            className="tabular-nums flex-none"
            style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, color: fg }}
          >
            {cents(price)}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-display rounded-[8px] ${
        block
          ? "min-h-[44px] w-full flex items-center justify-center"
          : price !== undefined
            ? "flex items-center justify-between gap-[8px]"
            : ""
      }`}
      style={{
        fontSize: block ? 12 : mobile ? 12.5 : 11.5,
        fontWeight: 700,
        padding: block ? undefined : price !== undefined ? "0 14px" : mobile ? "0 14px" : "5px 10px",
        minHeight: block ? undefined : price !== undefined ? 44 : mobile ? 36 : undefined,
        borderRadius: price !== undefined ? 11 : undefined,
        minWidth: price !== undefined ? (mobile ? 96 : 108) : undefined,
        color: picked ? "#0A0B0D" : disabled ? VT.muted2 : base.color,
        background: picked ? pickedBg : "transparent",
        border: picked ? "none" : `1px solid ${disabled ? VT.line2 : base.border}`,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {price === undefined ? (
        picked ? "Picked" : label
      ) : (
        <>
          <span style={{ fontWeight: 700 }}>{label}</span>
          <span
            className="tabular-nums"
            style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, color: picked ? "#0A0B0D" : VT.ink3 }}
          >
            {cents(price)}
          </span>
        </>
      )}
    </button>
  );
};

/**
 * Complementary market (two mutually exclusive outcomes) — one direction pair
 * replaces the two neutral Buy rows. Same branch on mobile and on the desktop
 * desk: it is a data rule, not a viewport rule.
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
  <div className={`grid grid-cols-2 gap-[8px] ${mobile ? "px-4" : ""}`}>
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

export const PickerOptionRow = ({
  label,
  price,
  isBinary,
  mobile,
  dim,
  pickedLong,
  pickedShort,
  onPick,
}: PickerOptionRowProps) => {
  /* Multi-option rows carry the price inside each Yes/No button, so the
     row-level price is dropped to avoid printing the same number twice. */
  const priceInButtons = !isBinary;
  const priceEl = (
    <span
      className="font-display tabular-nums flex-none"
      style={{ fontSize: mobile ? 14 : 13, fontWeight: 700, color: dim ? VT.muted : VT.ink3 }}
    >
      {cents(price)}
    </span>
  );

  /* Mobile: Lite list grammar — flat hairline row, no nested box. Label owns
     the line, price sits mono on the right, the side chips are the only
     chrome. Picked state shows as a 3px volt rail. */
  if (mobile) {
    const isPicked = !!(pickedLong || pickedShort);
    return (
      <div
        className="flex items-center gap-[10px]"
        style={{
          minHeight: 52,
          borderTop: `1px solid ${VT.hairline}`,
          borderLeft: `3px solid ${isPicked ? VT.volt : "transparent"}`,
          paddingLeft: 13,
          paddingRight: 16,
        }}
      >
        <span
          className="flex-1 min-w-0"
          style={{
            fontSize: 13.5,
            lineHeight: 1.35,
            fontWeight: isPicked ? 600 : 500,
            color: dim ? VT.muted : VT.ink,
          }}
        >
          {label}
        </span>
        {!priceInButtons && priceEl}
        <span className="flex-none flex items-center gap-[7px]">
          {isBinary ? (
            <SideButton mobile label="Buy" tone="neutral" picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
          ) : (
            <>
              <SideButton mobile label="Yes" tone="yes" price={price} picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
              <SideButton mobile label="No" tone="no" price={1 - price} picked={pickedShort} disabled={dim} onClick={() => onPick?.("short")} />
            </>
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-[10px] rounded-[9px]"
      style={{
        background: VT.surfaceDeep,
        border: `1px solid ${pickedLong || pickedShort ? VT.volt : VT.line2}`,
        padding: mobile ? "8px 12px" : "9px 12px",
        minHeight: mobile ? 48 : 44,
      }}
    >
      <span
        className={`flex-1 min-w-0 ${mobile ? "" : "truncate"}`}
        style={{
          fontSize: mobile ? 13 : isBinary ? 11 : 11.5,
          lineHeight: 1.3,
          fontWeight: pickedLong || pickedShort ? 600 : 400,
          color: dim ? VT.muted : isBinary ? VT.ink3 : VT.ink,
        }}
      >
        {label}
      </span>
      <span className="flex-none flex items-center gap-[9px]">
        {!priceInButtons && priceEl}
        {isBinary ? (
          <SideButton mobile={mobile} label="Buy" tone="neutral" picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
        ) : (
          <>
            <SideButton mobile={mobile} label="Yes" tone="yes" price={price} picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
            <SideButton mobile={mobile} label="No" tone="no" price={1 - price} picked={pickedShort} disabled={dim} onClick={() => onPick?.("short")} />
          </>
        )}
      </span>
    </div>
  );
};

export const PickerBlockedReason = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-[6px] px-4 md:px-0" style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5, paddingTop: 6 }}>
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
  rowsLayout?: "grid" | "stack";
  children?: React.ReactNode;
}

export const EventPickerCard = ({
  mobile,
  name,
  meta,
  lines,
  tail,
  eligible = true,
  locked = false,
  rowsLayout = "stack",
  children,
}: EventPickerCardProps) => {
  /* Mobile: the title owns a full-width line (wraps to 2, never truncates to
     "…"), badges drop to the meta line underneath. */
  const mobileHeader = (
    <div className="flex flex-col gap-[6px] px-4" style={{ marginBottom: 10 }}>
      <span
        className="line-clamp-2"
        style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: eligible ? VT.ink : VT.ink2 }}
      >
        {name}
      </span>
      <div className="flex items-center gap-[6px] flex-wrap">
        {lines.includes("futures") && <LineBadge strong>Boost</LineBadge>}
        {lines.includes("spot") && <LineBadge strong>Standard</LineBadge>}
        <MetaCaps>{meta}</MetaCaps>
        {!locked && tail && <LineBadge>{tail}</LineBadge>}
        {locked && (
          <span className="flex items-center gap-[5px]" style={{ fontSize: 11, fontWeight: 600, color: VT.ink2 }}>
            <Lock className="w-3 h-3" />
            Voucher already used
          </span>
        )}
      </div>
    </div>
  );

  const desktopHeader = (
    <div className="flex items-start justify-between gap-[12px]" style={{ marginBottom: 11 }}>
      <div className="flex flex-col gap-[3px] min-w-0">
        <span className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: eligible ? VT.ink : VT.ink2 }}>
          {name}
        </span>
        <MetaCaps>{meta}</MetaCaps>
      </div>
      <div className="flex-none flex items-center gap-[6px] flex-wrap justify-end">
        {lines.includes("futures") && <LineBadge strong>Boost</LineBadge>}
        {lines.includes("spot") && <LineBadge strong>Standard</LineBadge>}
        {!locked && tail && <LineBadge>{tail}</LineBadge>}
        {locked && (
          <span className="flex items-center gap-[5px]" style={{ fontSize: 11, fontWeight: 600, color: VT.ink2 }}>
            <Lock className="w-3 h-3" />
            Voucher already used
          </span>
        )}
      </div>
    </div>
  );

  const header = mobile ? mobileHeader : desktopHeader;

  if (locked) {
    return (
      <div
        className={mobile ? "" : "rounded-[12px]"}
        style={
          mobile
            ? { borderBottom: `1px solid ${VT.line}`, padding: "14px 0 14px", opacity: 0.5 }
            : { background: VT.surfaceCard, border: `1px solid ${VT.line}`, padding: 14, opacity: 0.5 }
        }
      >
        {header}
        {mobile ? <div className="px-4">{children}</div> : children}
      </div>
    );
  }

  return (
    <div
      className={mobile ? "" : "rounded-[12px]"}
      style={
        mobile
          ? { borderBottom: `1px solid ${VT.line}`, padding: "14px 0 6px", opacity: eligible ? 1 : 0.62 }
          : {
              background: VT.surfaceCard,
              border: `1px solid ${VT.line}`,
              padding: 14,
              opacity: eligible ? 1 : 0.62,
            }
      }
    >
      {header}
      <div
        className={
          rowsLayout === "grid" && !mobile
            ? "grid grid-cols-2 gap-[8px]"
            : `flex flex-col ${mobile ? "" : "gap-[6px]"}`
        }
      >
        {children}
      </div>
      {mobile && <div style={{ height: 8 }} />}
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Picker chrome — skeleton / empty / search bar.
 * Pure presentational, extracted verbatim from EventPickerList so both
 * production and /style-guide render the exact same markup.
 * ------------------------------------------------------------------------ */

/** Loading placeholder cards shown while active events resolve. */
export const PickerSkeleton = () => (
  <>
    {[0, 1].map((i) => (
      <div
        key={i}
        className="rounded-[12px] flex flex-col gap-[11px] mx-4 md:mx-0"
        style={{ background: VT.surfaceCard, border: `1px solid ${VT.line}`, padding: 14 }}
      >
        <div className="flex flex-col gap-[6px]">
          <span className="rounded-[4px]" style={{ width: "70%", height: 12, background: "#171A1F" }} />
          <span className="rounded-[4px]" style={{ width: "38%", height: 9, background: "#15181C" }} />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          {[0, 1].map((j) => (
            <span
              key={j}
              className="rounded-[9px]"
              style={{ height: 44, background: VT.surfaceDeep, border: `1px solid ${VT.hairline}` }}
            />
          ))}
        </div>
      </div>
    ))}
  </>
);

/** Empty result card — search miss or nothing eligible. */
export const PickerEmpty = ({ query, onClear }: { query?: string; onClear?: () => void }) => (
  <div
    className="rounded-[12px] flex flex-col items-center gap-[8px] text-center mx-4 md:mx-0"
    style={{ background: VT.surfaceDeep, border: `1px solid ${VT.line}`, padding: "34px 24px" }}
  >
    <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: VT.ink }}>
      {query ? `No markets match “${query}”` : "No markets take a voucher right now"}
    </span>
    <span style={{ fontSize: 11.5, color: VT.ink3, lineHeight: 1.6, maxWidth: 270 }}>
      Nothing here right now takes a voucher. Clear the filter to see everything eligible.
    </span>
    <button
      type="button"
      onClick={onClear}
      className="font-display rounded-[10px] flex items-center"
      style={{
        marginTop: 4,
        minHeight: 40,
        padding: "0 16px",
        border: `1px solid ${VT.line3}`,
        fontSize: 12.5,
        fontWeight: 600,
        color: VT.ink,
      }}
    >
      Clear filters
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
    className="flex items-center gap-[9px] rounded-[10px]"
    style={{
      background: VT.surfaceInset,
      border: `1px solid ${VT.line}`,
      padding: "0 12px",
      minHeight: mobile ? 44 : 40,
    }}
  >
    <Search className="w-[15px] h-[15px] flex-none" style={{ color: VT.muted }} />
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="Search markets"
      className="flex-1 bg-transparent outline-none"
      style={{ fontSize: 12.5, color: VT.ink }}
    />
  </div>
);
