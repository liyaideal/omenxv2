import { useMemo, useState } from "react";
import { Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { parseSideLabels } from "@/lib/eventUtils";
import type { PositionVoucher } from "@/hooks/usePositionVouchers";

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
): EligibilityResult => {
  if (isResolved) return { ok: false, reason: "Event already resolved" };
  if (!endDate) return { ok: false, reason: "No end date" };
  const hoursToEnd = (new Date(endDate).getTime() - Date.now()) / 3600 / 1000;
  if (hoursToEnd < voucher.minHoursToSettlement) {
    return { ok: false, reason: `Closes within ${voucher.minHoursToSettlement}h` };
  }
  if (price < voucher.entryPriceMin || price > voucher.entryPriceMax) {
    return {
      ok: false,
      reason: `Price out of ${voucher.entryPriceMin.toFixed(2)}–${voucher.entryPriceMax.toFixed(2)} band`,
    };
  }
  return { ok: true };
};

interface EventPickerListProps {
  voucher: PositionVoucher;
  selected: PickedOption | null;
  onSelect: (picked: PickedOption | null) => void;
}

export const EventPickerList = ({ voucher, selected, onSelect }: EventPickerListProps) => {
  const { events: allEvents, isLoading } = useActiveEvents();
  // Position vouchers are FUTURES-only — spot events must not be pickable
  // (server also enforces this in redeem-position-voucher; see
  // docs/backend-boundary.md).
  const events = useMemo(
    () => allEvents.filter((e: any) => !(e.product_lines?.includes("spot"))),
    [allEvents],
  );
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [events]);

  const toggleCat = (c: string) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  // Per-event eligibility: at least one option passes the voucher rules
  const eventEligibility = useMemo(() => {
    const map = new Map<string, boolean>();
    events.forEach((e) => {
      const any = e.options.some(
        (o) => checkEligibility(voucher, o.price, e.end_date, e.is_resolved).ok,
      );
      map.set(e.id, any);
    });
    return map;
  }, [events, voucher]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = events.filter((e) => {
      if (activeCats.size > 0 && !activeCats.has(e.category)) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    });
    return [...base].sort((a, b) => {
      const ae = eventEligibility.get(a.id) ? 1 : 0;
      const be = eventEligibility.get(b.id) ? 1 : 0;
      return be - ae;
    });
  }, [events, query, activeCats, eventEligibility]);

  return (
    <div className="space-y-3">
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCats(new Set())}
            className={[
              "h-7 px-2.5 rounded-full text-[11px] border transition",
              activeCats.size === 0
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-muted/30 border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            All
          </button>
          {categories.map((c) => {
            const active = activeCats.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                className={[
                  "h-7 px-2.5 rounded-full text-[11px] border capitalize transition",
                  active
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events..."
          className="pl-9 h-9 text-sm"
        />
      </div>


      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
        {isLoading && <div className="text-xs text-muted-foreground text-center py-6">Loading events...</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-6">No events found</div>
        )}
        {filtered.map((event) => {
          const labels = event.options.map((o) => o.label.trim().toLowerCase());
          const isBinary =
            event.options.length === 2 &&
            labels.includes("yes") &&
            labels.includes("no");
          const sideLabels = isBinary ? parseSideLabels((event as any).side_labels) : undefined;
          const displayLabel = (optLabel: string) => {
            if (!sideLabels) return optLabel;
            const l = optLabel.trim().toLowerCase();
            if (l === "yes") return sideLabels.yes;
            if (l === "no") return sideLabels.no;
            return optLabel;
          };

          return (
          <div key={event.id} className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{event.name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{event.category}</div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {isBinary ? "Binary" : `${event.options.length} options`}
              </Badge>
            </div>

            <div className="space-y-1.5">
              {event.options.map((opt) => {
                const eligibility = checkEligibility(voucher, opt.price, event.end_date, event.is_resolved);
                const isSelectedLong = selected?.optionId === opt.id && selected?.side === "long";
                const isSelectedShort = selected?.optionId === opt.id && selected?.side === "short";
                const isYes = opt.label.trim().toLowerCase() === "yes";
                const shownLabel = displayLabel(opt.label);

                const pickButton = (side: "long" | "short", isSelected: boolean, label: string, colorClass: string) => {
                  const inner = (
                    <button
                      type="button"
                      disabled={!eligibility.ok}
                      onClick={() => {
                        if (!eligibility.ok) return;
                        onSelect({
                          eventId: event.id,
                          eventName: event.name,
                          optionId: opt.id,
                          optionLabel: opt.label,
                          displayLabel: shownLabel,

                          price: opt.price,
                          side,
                          isBinary,
                        });
                      }}
                      className={[
                        "h-7 px-2 rounded text-[11px] font-medium border transition",
                        eligibility.ok
                          ? isSelected
                            ? `${colorClass} ring-2 ring-offset-1 ring-offset-background`
                            : `${colorClass} opacity-80 hover:opacity-100`
                          : "border-border bg-muted/40 text-muted-foreground cursor-not-allowed",
                      ].join(" ")}
                    >
                      {!eligibility.ok && <Lock className="w-3 h-3 inline mr-1" />}
                      {label}
                    </button>
                  );

                  if (eligibility.ok) return inner;
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>{inner}</TooltipTrigger>
                      <TooltipContent className="text-xs">{eligibility.reason}</TooltipContent>
                    </Tooltip>
                  );
                };

                return (
                  <div key={opt.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 text-xs text-foreground/90 truncate">{shownLabel}</div>
                    <div className="font-mono text-xs text-muted-foreground tabular-nums w-12 text-right">
                      ${opt.price.toFixed(2)}
                    </div>
                    <div className="flex gap-1">
                      {isBinary ? (
                        // Binary 市场：option 本身就是 Yes/No（或队名别名），只显示一个 Buy 按钮
                        pickButton(
                          "long",
                          isSelectedLong,
                          `Buy ${shownLabel}`,
                          isYes
                            ? "border-trading-green/40 bg-trading-green/15 text-trading-green"
                            : "border-trading-red/40 bg-trading-red/15 text-trading-red",
                        )
                      ) : (
                        <>
                          {pickButton(
                            "long",
                            isSelectedLong,
                            "Yes",
                            "border-trading-green/40 bg-trading-green/15 text-trading-green",
                          )}
                          {pickButton(
                            "short",
                            isSelectedShort,
                            "No",
                            "border-trading-red/40 bg-trading-red/15 text-trading-red",
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}

      </div>
    </div>
  );
};
