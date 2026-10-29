// ============================================================
// Quick Play "session" — the one unit the cabinet (04 / YOUR RESULT), the
// run poster and the Portfolio rows all count in (CPO 2026-10-29).
// A session is one sitting: it ends after 30 minutes without a call. The
// next call after that gap opens a new one. Pure grouping rule over the
// calls themselves — nothing is stored server-side; the SQL
// (arcade_my_sessions / arcade_my_session_calls) uses the same 30 minutes,
// so change both when changing one.
// ============================================================

/** Minutes without a call that close a session. Mirror of the SQL interval. */
export const ARCADE_SESSION_GAP_MIN = 30;
export const ARCADE_SESSION_GAP_MS = ARCADE_SESSION_GAP_MIN * 60_000;

/** The one explanation, used wherever the word "session" needs a footnote. */
export const ARCADE_SESSION_NOTE = `A session ends after ${ARCADE_SESSION_GAP_MIN} minutes without a call.`;

/** Short form for the cabinet toast when a new session opens on the next call. */
export const ARCADE_SESSION_NEW = "New session";

/** Session key as the URL and the SQL spell it: epoch ms of the first call. */
export const arcadeSessionKey = (startedAtIso: string) => String(new Date(startedAtIso).getTime());

/** "Oct 28, 16:47 – 16:53" / "Oct 28 23:50 – Oct 29 00:12" / "Oct 28, 16:47" (one minute) — the row + page title span. */
export const arcadeSessionSpan = (startedAtIso: string, endedAtIso: string): string => {
  const a = new Date(startedAtIso);
  const b = new Date(endedAtIso);
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = (d: Date) => `${M[d.getMonth()]} ${d.getDate()}`;
  const clock = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const sameDay = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay && clock(a) === clock(b)) return `${day(a)}, ${clock(a)}`; // one call, or all inside one minute
  return sameDay ? `${day(a)}, ${clock(a)} – ${clock(b)}` : `${day(a)} ${clock(a)} – ${day(b)} ${clock(b)}`;
};

/** Whole minutes between first and last call, never below 1. */
export const arcadeSessionMinutes = (startedAtIso: string, endedAtIso: string) =>
  Math.max(1, Math.round((new Date(endedAtIso).getTime() - new Date(startedAtIso).getTime()) / 60_000));
