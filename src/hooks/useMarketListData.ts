import { useMemo } from "react";
import { EventWithOptions } from "@/hooks/useActiveEvents";
import { isClosingSoon, isNewEvent } from "@/components/events/ClosingSoonCountdown";
import { getCategoryInfo } from "@/lib/categoryUtils";
import { parseSideLabels, getDisplayOptionLabel } from "@/lib/eventUtils";

export type ChgTimeframe = "1h" | "4h" | "24h";

export interface MarketChildRow {
  id: string;
  optionLabel: string;
  /** Display label after applying sideLabels (e.g. team name for binary sports events). */
  displayLabel: string;
  markPrice: number;
  change1h: number;
  change4h: number;
  change24h: number;
  volume1h: number;
  volume4h: number;
  volume24h: number;
  totalVolume: number;
  openInterest: number;
  fundingRate: number;
}

export interface EventRow {
  // Identity
  id: string;
  eventId: string;
  eventName: string;
  eventIcon: string;
  category: string;
  categoryLabel: string;

  // Product line extensions (Pro / Spot)
  productLines: string[];
  eventSubtype: string | null;
  lifecycleStatus: string | null;
  basePrice: number | null;

  // Event-level aggregated metrics
  change1h: number;
  change4h: number;
  change24h: number;
  volume1h: number;
  volume4h: number;
  volume24h: number;
  totalVolume: number;
  openInterest: number;

  // Dates
  expiry: Date | null;
  createdAt: string;

  // Computed flags
  isNew: boolean;
  isClosingSoon: boolean;

  // Top market preview
  topMarket: { label: string } | null;

  // Children
  childCount: number;
  children: MarketChildRow[];
}

/** @deprecated Use EventRow instead */
export type MarketRow = EventRow;

// Seeded pseudo-random for deterministic mocks
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const mockValue = (seed: number, min: number, max: number) =>
  min + seededRandom(seed) * (max - min);

/** Helper: get the change value for a given timeframe */
export const getChange = (
  row: Pick<EventRow, "change1h" | "change4h" | "change24h"> | Pick<MarketChildRow, "change1h" | "change4h" | "change24h">,
  tf: ChgTimeframe
): number => {
  switch (tf) {
    case "1h": return row.change1h;
    case "4h": return row.change4h;
    case "24h": return row.change24h;
  }
};

/** Helper: get the volume for a given timeframe */
export const getVolume = (
  row: Pick<EventRow, "volume1h" | "volume4h" | "volume24h"> | Pick<MarketChildRow, "volume1h" | "volume4h" | "volume24h">,
  tf: ChgTimeframe
): number => {
  switch (tf) {
    case "1h": return row.volume1h;
    case "4h": return row.volume4h;
    case "24h": return row.volume24h;
  }
};

export const useMarketListData = (events: EventWithOptions[]): EventRow[] => {
  return useMemo(() => {
    const nowMs = Date.now();
    return events
      .filter((event) => {
        // Defensive: hide events whose end_date is already in the past.
        if (!event.end_date) return true;
        return new Date(event.end_date).getTime() > nowMs;
      })
      .map((event) => {
      const endDate = event.end_date ? new Date(event.end_date) : null;
      const closingSoon = isClosingSoon(endDate);
      const newEvent = !closingSoon && isNewEvent(event.created_at);
      const catInfo = getCategoryInfo(event.category);
      const seed = event.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

      const sideLabels = parseSideLabels(event.side_labels);

      // Build child market rows
      const children: MarketChildRow[] = event.options.map((opt, i) => {
        const optSeed = seed + i * 137;
        return {
          id: opt.id,
          optionLabel: opt.label,
          displayLabel: getDisplayOptionLabel(opt.label, event.options, sideLabels),
          markPrice: opt.price,
          change1h: parseFloat(mockValue(optSeed + 10, -5, 5).toFixed(2)),
          change4h: parseFloat(mockValue(optSeed + 11, -10, 10).toFixed(2)),
          change24h: parseFloat(mockValue(optSeed + 1, -15, 15).toFixed(2)),
          volume1h: parseFloat(mockValue(optSeed + 12, 5000, 500000).toFixed(0)),
          volume4h: parseFloat(mockValue(optSeed + 13, 20000, 2000000).toFixed(0)),
          volume24h: parseFloat(mockValue(optSeed + 2, 50000, 5000000).toFixed(0)),
          totalVolume: parseFloat(mockValue(optSeed + 20, 500000, 50000000).toFixed(0)),
          openInterest: parseFloat(mockValue(optSeed + 3, 10000, 2000000).toFixed(0)),
          fundingRate: parseFloat(mockValue(optSeed + 4, -0.05, 0.05).toFixed(4)),
        };
      });

      // Event-level change: use change of the child with max volume
      const maxVolChild = children.length > 0
        ? children.reduce((best, c) => (c.volume24h > best.volume24h ? c : best), children[0])
        : null;

      const row: EventRow = {
        id: event.id,
        eventId: event.id,
        eventName: event.name,
        eventIcon: event.icon,
        category: event.category,
        categoryLabel: catInfo.label,
        productLines: event.product_lines && event.product_lines.length > 0 ? event.product_lines : ["futures"],
        eventSubtype: event.event_subtype ?? null,
        lifecycleStatus: event.lifecycle_status ?? null,
        basePrice: event.base_price != null ? Number(event.base_price) : null,
        change1h: maxVolChild?.change1h || 0,
        change4h: maxVolChild?.change4h || 0,
        change24h: maxVolChild?.change24h || 0,
        volume1h: children.reduce((s, c) => s + c.volume1h, 0),
        volume4h: children.reduce((s, c) => s + c.volume4h, 0),
        volume24h: children.reduce((s, c) => s + c.volume24h, 0),
        totalVolume: children.reduce((s, c) => s + c.totalVolume, 0),
        openInterest: children.reduce((s, c) => s + c.openInterest, 0),
        expiry: endDate,
        createdAt: event.created_at,
        isNew: newEvent,
        isClosingSoon: closingSoon,
        topMarket: maxVolChild && children.length >= 2
          ? { label: maxVolChild.displayLabel }
          : null,
        childCount: children.length,
        children: children.length >= 2 ? children : [],
      };

      return row;
    });
  }, [events]);
};
