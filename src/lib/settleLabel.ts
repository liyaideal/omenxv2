// ============================================================
// settleLabel() — the ONE settlement-time wording used across Portfolio.
//
//   same calendar day  → "today 16:00"
//   same year          → "Aug 21 16:00"
//   another year       → "Jan 12, 2027"   (no clock)
//
// 24h user-local time, no timezone suffix (site-wide time rule).
// Callers prepend the verb, e.g. `settles ${settleLabel(d)}`.
// Sports kickoffLabel is NOT part of this rule and stays untouched.
// ============================================================

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const clock = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export const settleLabel = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";

  const now = new Date();

  if (d.getFullYear() !== now.getFullYear()) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (sameDay) return `today ${clock(d)}`;

  return `${MONTHS[d.getMonth()]} ${d.getDate()} ${clock(d)}`;
};

/** "Aug 12" — the date-only form used in settled meta lines. */
export const settledDayLabel = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  if (d.getFullYear() !== now.getFullYear()) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** "AUGUST 2026" — month group label on the settled list. */
export const monthGroupLabel = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const full = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  return `${full[d.getMonth()]} ${d.getFullYear()}`;
};

/** Stable YYYY-MM key for grouping. */
export const monthKey = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** "Aug 1, 2026 · 14:00" — the settlement-detail meta stamp. */
export const settledStampLabel = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${clock(d)}`;
};
