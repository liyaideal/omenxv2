// ============================================================
// Quick-round TABLE mode — release switch (not a user toggle).
//
// Rule (Liya, 2026-10-09): order form follows the round length.
//   5m / 15m  → Table (chip-on-the-table ordering)      ← this flag gates it
//   1h / 4h / 1d → Classic quick page, untouched
// While the flag is closed, 5m/15m keep rendering Classic — external users
// see no change. Desktop only until the mobile Table ships.
//
// Who sees Table while gated:
//   • ?table=1 on the URL (sticks in localStorage for the session's browser)
//   • localStorage omenx_table = "1"
//   • the demo account (alex_carter) and the internal list below
// ============================================================
import type { Timeframe } from "@/components/lite/intraday/intradayData";

export const TABLE_TIMEFRAMES: readonly Timeframe[] = ["5m", "15m"];
export const isTableTimeframe = (tf: Timeframe) => TABLE_TIMEFRAMES.includes(tf);

const LS_KEY = "omenx_table";
const INTERNAL_USERNAMES = new Set(["alex_carter"]);

/** Flip this to true to open Table to everyone on 5m/15m (step 2). */
export const TABLE_PUBLIC = false;

export const tableFlagFromUrl = () => {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search).get("table");
  if (q === "1") localStorage.setItem(LS_KEY, "1");
  if (q === "0") localStorage.removeItem(LS_KEY);
};

export const isTableEnabled = (username?: string | null): boolean => {
  if (TABLE_PUBLIC) return true;
  if (typeof window !== "undefined") {
    tableFlagFromUrl();
    if (localStorage.getItem(LS_KEY) === "1") return true;
  }
  return !!username && INTERNAL_USERNAMES.has(username);
};
