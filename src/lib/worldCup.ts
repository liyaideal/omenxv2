// World Cup 2026 portal constants
// Kicks off June 11, 2026 — Mexico vs South Africa (Estadio Azteca)
// Runs through the final on July 19, 2026.
// Teaser window: any time before kickoff (so we can show pre-launch hype today).

export const WC2026_START = new Date("2026-06-11T20:00:00Z");
export const WC2026_END = new Date("2026-07-20T03:59:59Z");
export const SPORTS_URL = "https://omenx-sports.lovable.app";
export const SPORTS_REF_QUERY = "?ref=omenx-main&src=wc-panel";
export const SPORTS_LINK = `${SPORTS_URL}${SPORTS_REF_QUERY}`;

export type WorldCupPhase = "teaser" | "live" | "off";

export const getWorldCupPhase = (now: Date = new Date()): WorldCupPhase => {
  if (now < WC2026_START) return "teaser";
  if (now <= WC2026_END) return "live";
  return "off";
};

export const isWorldCupActive = (now: Date = new Date()): boolean =>
  getWorldCupPhase(now) !== "off";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export const getCountdownTo = (
  target: Date,
  now: Date = new Date()
): Countdown => {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
};

const DISMISS_KEY = "wc2026-panel-dismissed";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export const isPanelDismissed = (now: Date = new Date()): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return now.getTime() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
};

export const dismissPanel = (): void => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
};
