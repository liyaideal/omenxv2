import { useMemo, useState } from "react";
import { Search, Lock } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { parseSideLabels } from "@/lib/eventUtils";
import { usePositionVouchers, type PositionVoucher } from "@/hooks/usePositionVouchers";
import { useIsMobile } from "@/hooks/use-mobile";
import { VT } from "./voucherTokens";

export interface PickedOption {
  eventId: string;
  eventName: string;
  optionId: string;
  optionLabel: string;
  /** Display label resolved through sideLabels (e.g. "Pereira"); equal to optionLabel when no alias. */
  displayLabel: string;
  price: number;
  side: "long" | "short";
  isBinary: boolean;
  /** Product line of the event — drives post-redeem routing (/trade vs /spot). */
  productLine: "spot" | "futures";
}

interface EligibilityResult {
  ok: boolean;
  reason?: string;
}

const checkEligibility = (
  voucher: PositionVoucher,
  price: number,
  endDate: string | null,
  isResolved: boolean,
  eventLocked = false,
): EligibilityResult => {
  if (eventLocked) {
    return { ok: false, reason: "One voucher per event — you already opened a trial position here." };
  }
  if (isResolved) return { ok: false, reason: "Event already resolved" };
  if (!endDate) return { ok: false, reason: "No end date" };
  const hoursToEnd = (new Date(endDate).getTime() - Date.now()) / 3600 / 1000;
  if (hoursToEnd < voucher.minHoursToSettlement) {
    return { ok: false, reason: `Vouchers can't open a position this close to settlement.` };
  }
  if (price < voucher.entryPriceMin || price > voucher.entryPriceMax) {
    return { ok: false, reason: `Priced outside the voucher band — pick another option.` };
  }
  return { ok: true };
};

const cents = (p: number) => `${Math.round(p * 100)}¢`;

/* --------------------------------- chrome -------------------------------- */

const Chip = ({
  active,
  onClick,
  children,
  mobile,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  mobile?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-none rounded-full capitalize ${mobile ? "flex items-center min-h-[44px] px-[14px]" : "px-[14px] py-[7px]"}`}
    style={{
      fontSize: mobile ? 12 : 12.5,
      fontWeight: active ? 700 : 600,
      background: active ? "#fff" : "transparent",
      color: active ? "#0A0B0D" : mobile ? VT.ink3 : VT.ink2,
      border: active ? "1px solid #fff" : `${mobile ? 1 : 1.5}px solid ${mobile ? VT.line2 : VT.line3}`,
    }}
  >
    {children}
  </button>
);

const MetaCaps = ({ children }: { children: React.ReactNode }) => (
  <span
    className="font-display uppercase"
    style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", color: VT.muted }}
  >
    {children}
  </span>
);

const LineBadge = ({ children, strong }: { children: React.ReactNode; strong?: boolean }) => (
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

const SideButton = ({
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

/* --------------------------------- list ---------------------------------- */

interface EventPickerListProps {
  voucher: PositionVoucher;
  selected: PickedOption | null;
  onSelect: (picked: PickedOption | null) => void;
}

export const EventPickerList = ({ voucher, selected, onSelect }: EventPickerListProps) => {
  // Vouchers v2: Standard (spot) markets are redeemable too — the old
  // futures-only filter is gone (server match: redeem-position-voucher).
  const { events, isLoading } = useActiveEvents();
  const { usedEventIds } = usePositionVouchers();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [events]);

  const eventEligibility = useMemo(() => {
    const map = new Map<string, boolean>();
    events.forEach((e) => {
      if (usedEventIds.has(e.id)) {
        map.set(e.id, false);
        return;
      }
      map.set(
        e.id,
        e.options.some((o) => checkEligibility(voucher, o.price, e.end_date, e.is_resolved).ok),
      );
    });
    return map;
  }, [events, voucher, usedEventIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = events.filter((e) => {
      if (activeCat && e.category !== activeCat) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    });
    return [...base].sort(
      (a, b) => (eventEligibility.get(b.id) ? 1 : 0) - (eventEligibility.get(a.id) ? 1 : 0),
    );
  }, [events, query, activeCat, eventEligibility]);

  return (
    <div className="flex flex-col gap-[14px]">
      {categories.length > 0 && (
        <div className={isMobile ? "flex gap-[7px] overflow-x-auto no-scrollbar -mx-1 px-1" : "flex flex-wrap gap-[7px]"}>
          <Chip active={!activeCat} onClick={() => setActiveCat(null)} mobile={isMobile}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={activeCat === c} onClick={() => setActiveCat(c)} mobile={isMobile}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-[9px] rounded-[10px]"
        style={{
          background: VT.surfaceInset,
          border: `1px solid ${VT.line}`,
          padding: "0 12px",
          minHeight: isMobile ? 44 : 40,
        }}
      >
        <Search className="w-[15px] h-[15px] flex-none" style={{ color: VT.muted }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets"
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 12.5, color: VT.ink }}
        />
      </div>

      <div className={`flex flex-col gap-[10px] ${isMobile ? "" : "max-h-[520px] overflow-y-auto pr-1"}`}>
        {isLoading &&
          [0, 1].map((i) => (
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
                  <span key={j} className="rounded-[9px]" style={{ height: 44, background: VT.surfaceDeep, border: `1px solid ${VT.hairline}` }} />
                ))}
              </div>
            </div>
          ))}

        {!isLoading && filtered.length === 0 && (
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
              onClick={() => {
                setQuery("");
                setActiveCat(null);
              }}
              className="font-display rounded-[10px] flex items-center"
              style={{ marginTop: 4, minHeight: 40, padding: "0 16px", border: `1px solid ${VT.line3}`, fontSize: 12.5, fontWeight: 600, color: VT.ink }}
            >
              Clear filters
            </button>
          </div>
        )}

        {filtered.map((event) => {
          const labels = event.options.map((o) => o.label.trim().toLowerCase());
          const isBinary = event.options.length === 2 && labels.includes("yes") && labels.includes("no");
          const sideLabels = isBinary ? parseSideLabels((event as any).side_labels) : undefined;
          const displayLabel = (optLabel: string) => {
            if (!sideLabels) return optLabel;
            const l = optLabel.trim().toLowerCase();
            if (l === "yes") return sideLabels.yes;
            if (l === "no") return sideLabels.no;
            return optLabel;
          };
          const lines: string[] = ((event as any).product_lines as string[] | null) ?? ["futures"];
          const eventLocked = usedEventIds.has(event.id);
          const productLine: "spot" | "futures" = lines.includes("spot") ? "spot" : "futures";
          const cardEligible = eventEligibility.get(event.id);
          const blockedReason = !cardEligible && !eventLocked
            ? checkEligibility(voucher, event.options[0]?.price ?? 0, event.end_date, event.is_resolved).reason
            : null;

          const header = (
            <div className="flex items-start justify-between gap-[12px]" style={{ marginBottom: 11 }}>
              <div className="flex flex-col gap-[3px] min-w-0">
                <span className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: cardEligible ? VT.ink : VT.ink2 }}>
                  {event.name}
                </span>
                <MetaCaps>
                  {event.category}
                  {event.end_date ? ` · settles ${new Date(event.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                </MetaCaps>
              </div>
              <div className="flex-none flex items-center gap-[6px] flex-wrap justify-end">
                {lines.includes("futures") && <LineBadge strong>Boost</LineBadge>}
                {lines.includes("spot") && <LineBadge strong>Standard</LineBadge>}
                {!eventLocked && <LineBadge>{isBinary ? "Binary" : `${event.options.length} options`}</LineBadge>}
                {eventLocked && (
                  <span className="flex items-center gap-[5px]" style={{ fontSize: 11, fontWeight: 600, color: VT.ink2 }}>
                    <Lock className="w-3 h-3" />
                    Voucher already used
                  </span>
                )}
              </div>
            </div>
          );

          if (eventLocked) {
            return (
              <div
                key={event.id}
                className="rounded-[12px]"
                style={{ background: VT.surfaceCard, border: `1px solid ${VT.line}`, padding: 14, opacity: 0.5 }}
              >
                {header}
                <div style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5 }}>
                  One voucher per event — you already opened a trial position here. The lock covers both product
                  lines of this event.
                </div>
              </div>
            );
          }

          const pick = (opt: (typeof event.options)[number], side: "long" | "short") =>
            onSelect({
              eventId: event.id,
              eventName: event.name,
              optionId: opt.id,
              optionLabel: opt.label,
              displayLabel: displayLabel(opt.label),
              price: opt.price,
              side,
              isBinary,
              productLine,
            });

          const rows = event.options.map((opt) => {
            const eligibility = checkEligibility(voucher, opt.price, event.end_date, event.is_resolved);
            const pickedLong = selected?.optionId === opt.id && selected?.side === "long";
            const pickedShort = selected?.optionId === opt.id && selected?.side === "short";
            const shownLabel = displayLabel(opt.label);
            const dim = !eligibility.ok;

            const priceEl = (
              <span
                className="font-display tabular-nums flex-none"
                style={{ fontSize: 13, fontWeight: 700, color: dim ? VT.muted : VT.ink3 }}
              >
                {cents(opt.price)}
              </span>
            );

            // Mobile multi-option: label + price on top, Yes/No 44px grid beneath.
            if (!isBinary && isMobile) {
              return (
                <div
                  key={opt.id}
                  className="rounded-[9px] flex flex-col gap-[8px]"
                  style={{
                    background: VT.surfaceDeep,
                    border: `1px solid ${pickedLong || pickedShort ? VT.volt : VT.line2}`,
                    padding: "9px 11px 10px",
                  }}
                >
                  <div className="flex items-center justify-between gap-[10px]">
                    <span className="flex-1 min-w-0 truncate" style={{ fontSize: 11.5, color: dim ? VT.muted : VT.ink }}>
                      {shownLabel}
                    </span>
                    {priceEl}
                  </div>
                  <div className="grid grid-cols-2 gap-[7px]">
                    <SideButton block label="Yes" tone="yes" picked={pickedLong} disabled={dim} onClick={() => pick(opt, "long")} />
                    <SideButton block label="No" tone="no" picked={pickedShort} disabled={dim} onClick={() => pick(opt, "short")} />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={opt.id}
                className="flex items-center justify-between gap-[10px] rounded-[9px]"
                style={{
                  background: VT.surfaceDeep,
                  border: `1px solid ${pickedLong || pickedShort ? VT.volt : VT.line2}`,
                  padding: isMobile ? "0 12px" : "9px 12px",
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
                  {shownLabel}
                </span>
                <span className="flex-none flex items-center gap-[9px]">
                  {priceEl}
                  {isBinary ? (
                    <SideButton label="Buy" tone="neutral" picked={pickedLong} disabled={dim} onClick={() => pick(opt, "long")} />
                  ) : (
                    <>
                      <SideButton label="Yes" tone="yes" picked={pickedLong} disabled={dim} onClick={() => pick(opt, "long")} />
                      <SideButton label="No" tone="no" picked={pickedShort} disabled={dim} onClick={() => pick(opt, "short")} />
                    </>
                  )}
                </span>
              </div>
            );
          });

          return (
            <div
              key={event.id}
              className="rounded-[12px]"
              style={{
                background: VT.surfaceCard,
                border: `1px solid ${VT.line}`,
                padding: isMobile ? 13 : 14,
                opacity: cardEligible ? 1 : 0.62,
              }}
            >
              {header}
              <div className={isBinary && !isMobile ? "grid grid-cols-2 gap-[8px]" : "flex flex-col gap-[6px]"}>
                {rows}
                {blockedReason && (
                  <div
                    className="flex items-start gap-[6px]"
                    style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5, paddingTop: 2 }}
                  >
                    <Lock className="w-3 h-3 flex-none" style={{ marginTop: 2, color: VT.ink2 }} />
                    {blockedReason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
