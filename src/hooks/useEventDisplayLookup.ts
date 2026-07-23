import { useMemo } from "react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { parseSideLabels, getDisplayOptionLabel } from "@/lib/eventUtils";

/**
 * Returns a function that maps an event_name (and original option_label)
 * to the display label, applying sideLabels for single-market binary events.
 *
 * Used by usePositions / useOrders / useSettlements to enrich UnifiedPosition.displayOption
 * without each PositionCard / OrderCard re-fetching events.
 */
export function useEventDisplayLookup() {
  const { events } = useActiveEvents();

  return useMemo(() => {
    const byName = new Map<
      string,
      { options: { label: string }[]; sideLabels: { yes: string; no: string } | undefined }
    >();
    for (const ev of events) {
      byName.set(ev.name, {
        options: ev.options,
        sideLabels: parseSideLabels(ev.side_labels),
      });
    }

    return (eventName: string, optionLabel: string): string => {
      const ctx = byName.get(eventName);
      if (!ctx) return optionLabel;
      return getDisplayOptionLabel(optionLabel, ctx.options, ctx.sideLabels);
    };
  }, [events]);
}
