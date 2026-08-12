import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { parseSideLabels } from "@/lib/eventUtils";
import { usePositionVouchers, type PositionVoucher } from "@/hooks/usePositionVouchers";
import { useIsMobile } from "@/hooks/use-mobile";
import { VT } from "./voucherTokens";
import {
  EventPickerCard,
  PickerOptionRow,
  PickerBlockedReason,
} from "./EventPickerCard";

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
        <div className={isMobile ? "flex gap-[7px] overflow-x-auto scrollbar-hide -mx-1 px-1" : "flex flex-wrap gap-[7px]"}>
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

          const meta = `${event.category}${event.end_date ? ` · settles ${new Date(event.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}`;

          if (eventLocked) {
            return (
              <EventPickerCard
                key={event.id}
                mobile={isMobile}
                name={event.name}
                meta={meta}
                lines={lines}
                eligible={!!cardEligible}
                locked
              >
                <div style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5 }}>
                  One voucher per event — you already opened a trial position here. The lock covers both product
                  lines of this event.
                </div>
              </EventPickerCard>
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

          return (
            <EventPickerCard
              key={event.id}
              mobile={isMobile}
              name={event.name}
              meta={meta}
              lines={lines}
              tail={isBinary ? "Binary" : `${event.options.length} options`}
              eligible={!!cardEligible}
              rowsLayout={isBinary && !isMobile ? "grid" : "stack"}
            >
              {event.options.map((opt) => {
                const eligibility = checkEligibility(voucher, opt.price, event.end_date, event.is_resolved);
                return (
                  <PickerOptionRow
                    key={opt.id}
                    label={displayLabel(opt.label)}
                    price={opt.price}
                    isBinary={isBinary}
                    mobile={isMobile}
                    dim={!eligibility.ok}
                    pickedLong={selected?.optionId === opt.id && selected?.side === "long"}
                    pickedShort={selected?.optionId === opt.id && selected?.side === "short"}
                    onPick={(side) => pick(opt, side)}
                  />
                );
              })}
              {blockedReason && <PickerBlockedReason>{blockedReason}</PickerBlockedReason>}
            </EventPickerCard>
          );
        })}
      </div>
    </div>
  );
};
