// ============================================================
// Quick-round TABLE mode — release switch (not a user toggle).
//
// 2026-10-19 (CPO): Table is NOT the 5m/15m form any more. After playing the
// build, Liya judged the chip-on-the-table cadence fits 30s / 1m rounds, so
// it moves to a separate quick-play zone (/arcade, spot wallet, no Boost —
// see DESIGN.md §Addendum 2026-10-19). Every crypto quick round (5m … 1d)
// renders Classic again. TABLE_TIMEFRAMES is therefore empty: the gate in
// LiteQuickTrade never fires. The components under
// src/components/lite/table stay — the arcade page is built on them.
//
// Original rule (2026-10-09, superseded): 5m / 15m → Table, 1h+ → Classic.
//
// Who sees Table while gated:
//   • ?table=1 on the URL (sticks in localStorage for the session's browser)
//   • localStorage omenx_table = "1"
//   • the demo account (alex_carter) and the internal list below
// ============================================================
import type { Timeframe } from "@/components/lite/intraday/intradayData";

export const TABLE_TIMEFRAMES: readonly Timeframe[] = [];
export const isTableTimeframe = (tf: Timeframe) => TABLE_TIMEFRAMES.includes(tf);

const LS_KEY = "omenx_table";
const INTERNAL_USERNAMES = new Set(["alex_carter"]);

/** Dead while TABLE_TIMEFRAMES is empty; kept for the arcade round. */
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
