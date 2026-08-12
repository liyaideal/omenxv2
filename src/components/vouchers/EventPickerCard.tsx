/**
 * Pure presentational pieces of the voucher market picker.
 *
 * Extracted verbatim from EventPickerList (same JSX / same tokens) so the
 * style-guide can mount the real card + rows with mock props instead of a
 * hand-copied replica. No behaviour lives here — every interaction arrives
 * through props.
 */
import { Lock } from "lucide-react";
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
}: {
  label: string;
  tone: "neutral" | "yes" | "no";
  picked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  block?: boolean;
}) => {
  const base = {
    yes: { color: "hsl(74 100% 65%)", border: "hsl(74 100% 65% / .4)" },
    no: { color: "hsl(0 100% 68%)", border: "hsl(0 100% 68% / .4)" },
    neutral: { color: VT.ink, border: VT.line3 },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-display rounded-[8px] ${block ? "min-h-[44px] w-full flex items-center justify-center" : ""}`}
      style={{
        fontSize: block ? 12 : 11.5,
        fontWeight: 700,
        padding: block ? undefined : "5px 10px",
        color: picked ? "#0A0B0D" : disabled ? VT.muted2 : base.color,
        background: picked ? "hsl(74 100% 65%)" : "transparent",
        border: picked ? "none" : `1px solid ${disabled ? VT.line2 : base.border}`,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {picked ? "Picked" : label}
    </button>
  );
};

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
  const priceEl = (
    <span
      className="font-display tabular-nums flex-none"
      style={{ fontSize: 13, fontWeight: 700, color: dim ? VT.muted : VT.ink3 }}
    >
      {cents(price)}
    </span>
  );

  // Mobile multi-option: label + price on top, Yes/No 44px grid beneath.
  if (!isBinary && mobile) {
    return (
      <div
        className="rounded-[9px] flex flex-col gap-[8px]"
        style={{
          background: VT.surfaceDeep,
          border: `1px solid ${pickedLong || pickedShort ? VT.volt : VT.line2}`,
          padding: "9px 11px 10px",
        }}
      >
        <div className="flex items-center justify-between gap-[10px]">
          <span className="flex-1 min-w-0 truncate" style={{ fontSize: 11.5, color: dim ? VT.muted : VT.ink }}>
            {label}
          </span>
          {priceEl}
        </div>
        <div className="grid grid-cols-2 gap-[7px]">
          <SideButton block label="Yes" tone="yes" picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
          <SideButton block label="No" tone="no" picked={pickedShort} disabled={dim} onClick={() => onPick?.("short")} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-[10px] rounded-[9px]"
      style={{
        background: VT.surfaceDeep,
        border: `1px solid ${pickedLong || pickedShort ? VT.volt : VT.line2}`,
        padding: mobile ? "0 12px" : "9px 12px",
        minHeight: 44,
      }}
    >
      <span
        className="flex-1 min-w-0 truncate"
        style={{
          fontSize: isBinary ? 11 : 11.5,
          fontWeight: pickedLong || pickedShort ? 600 : 400,
          color: dim ? VT.muted : isBinary ? VT.ink3 : VT.ink,
        }}
      >
        {label}
      </span>
      <span className="flex-none flex items-center gap-[9px]">
        {priceEl}
        {isBinary ? (
          <SideButton label="Buy" tone="neutral" picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
        ) : (
          <>
            <SideButton label="Yes" tone="yes" picked={pickedLong} disabled={dim} onClick={() => onPick?.("long")} />
            <SideButton label="No" tone="no" picked={pickedShort} disabled={dim} onClick={() => onPick?.("short")} />
          </>
        )}
      </span>
    </div>
  );
};

export const PickerBlockedReason = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-[6px]" style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5, paddingTop: 2 }}>
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
  const header = (
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

  if (locked) {
    return (
      <div
        className="rounded-[12px]"
        style={{ background: VT.surfaceCard, border: `1px solid ${VT.line}`, padding: 14, opacity: 0.5 }}
      >
        {header}
        {children}
      </div>
    );
  }

  return (
    <div
      className="rounded-[12px]"
      style={{
        background: VT.surfaceCard,
        border: `1px solid ${VT.line}`,
        padding: mobile ? 13 : 14,
        opacity: eligible ? 1 : 0.62,
      }}
    >
      {header}
      <div className={rowsLayout === "grid" ? "grid grid-cols-2 gap-[8px]" : "flex flex-col gap-[6px]"}>{children}</div>
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
        className="rounded-[12px] flex flex-col gap-[11px]"
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
    className="rounded-[12px] flex flex-col items-center gap-[8px] text-center"
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
