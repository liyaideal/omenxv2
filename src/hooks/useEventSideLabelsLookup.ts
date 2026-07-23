import { useMemo } from "react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { isSingleMarketBinary, parseSideLabels } from "@/lib/eventUtils";

/**
 * Returns a function that, given an event name, resolves the per-event
 * side labels for single-market binary events.
 *
 * - `labels` are the human-facing "yes/no" aliases (e.g. team names) if the
 *   event is single-market binary AND has sideLabels configured; otherwise
 *   undefined.
 * - `isBinary` is true when the event is single-market binary (regardless of
 *   whether sideLabels are configured), so callers can fall back to "Yes/No"
 *   when no alias exists.
 *
 * Used by DesktopTrading aggregate tables (Orders / Positions / Airdrops /
 * Close & Cancel dialogs) to replace hard-coded "Yes/No" without each row
 * re-fetching its event.
 */
export function useEventSideLabelsLookup() {
  const { events } = useActiveEvents();

  return useMemo(() => {
    const byName = new Map<
      string,
      { isBinary: boolean; labels: { yes: string; no: string } | undefined }
    >();
    for (const ev of events) {
      const isBinary = isSingleMarketBinary(ev.options);
      byName.set(ev.name, {
        isBinary,
        labels: isBinary ? parseSideLabels(ev.side_labels) : undefined,
      });
    }

    return (eventName: string): { isBinary: boolean; labels: { yes: string; no: string } | undefined } => {
      return byName.get(eventName) ?? { isBinary: false, labels: undefined };
    };
  }, [events]);
}

/**
 * Resolve a binary side ("buy" / "long" → yes, otherwise → no) to its display
 * label given an optional sideLabels object. Falls back to "Yes" / "No".
 */
export function resolveBinarySideLabel(
  side: "yes" | "no",
  labels: { yes: string; no: string } | undefined
): string {
  if (labels) return side === "yes" ? labels.yes : labels.no;
  return side === "yes" ? "Yes" : "No";
}
