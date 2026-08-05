// ============================================================
// STYLE-GUIDE FROZEN CLOCK — single source of truth.
// Every playground fixture derives its timestamps from FROZEN_NOW so
// the guide renders pixel-identical output on every visit. No section
// may call Date.now() / new Date() with the real clock.
// ============================================================

/** The one frozen instant the whole style guide hangs off (ms epoch). */
export const FROZEN_NOW = new Date("2026-08-03T15:20:00Z").getTime();

/** ISO string at FROZEN_NOW + offset (ms). */
export const frozenIso = (msFromNow = 0) =>
  new Date(FROZEN_NOW + msFromNow).toISOString();

/** Date object at FROZEN_NOW + offset (ms). */
export const frozenDate = (msFromNow = 0) => new Date(FROZEN_NOW + msFromNow);
