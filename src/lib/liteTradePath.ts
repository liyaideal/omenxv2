// ============================================================
// ONE source of truth for "where does this event live on Lite".
// Live position cards, settlement details and series details must all link
// through here — /event/:id does NOT exist and 404s.
// ============================================================
export type LiteTradeSegment = "boost" | "standard";

/** Standard (spot) events live on /spot, Boost (futures) on /trade. */
export const liteTradePath = (
  eventId: string | null | undefined,
  segment: LiteTradeSegment,
): string => (eventId ? `${segment === "standard" ? "/spot" : "/trade"}?event=${eventId}` : "/events");

export const segmentFromProductLine = (productLine?: string | null): LiteTradeSegment =>
  productLine === "spot" ? "standard" : "boost";
