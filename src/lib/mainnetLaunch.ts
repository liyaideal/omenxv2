export const MAINNET_LAUNCH_START = new Date("2026-05-14T02:00:00.000Z");
export const MAINNET_LAUNCH_END = new Date("2026-05-28T02:00:00.000Z");
export const FIRST_TRADE_VOLUME = 5_000;

export const MAINNET_REBATE_TIERS = [
  { volume: 10_000, rebate: 5 },
  { volume: 50_000, rebate: 10 },
  { volume: 100_000, rebate: 20 },
  { volume: 300_000, rebate: 60 },
  { volume: 500_000, rebate: 100 },
  { volume: 750_000, rebate: 150 },
  { volume: 1_000_000, rebate: 200 },
] as const;

export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

export const getCountdownParts = (target = MAINNET_LAUNCH_END): CountdownParts => {
  const totalMs = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);

  return { totalMs, days, hours, minutes, seconds, ended: totalMs <= 0 };
};

export const formatShortCountdown = (parts: CountdownParts) => {
  if (parts.ended) return "Ended";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
};

export const formatLongCountdown = (parts: CountdownParts) => {
  if (parts.ended) return "Campaign ended";
  return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
};

export const formatUsd = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);

export const getCurrentTier = (volume: number) =>
  [...MAINNET_REBATE_TIERS].reverse().find((tier) => volume >= tier.volume) ?? null;

export const getNextTier = (volume: number) => MAINNET_REBATE_TIERS.find((tier) => volume < tier.volume) ?? null;

export const getTierProgress = (volume: number) => {
  const current = getCurrentTier(volume);
  const next = getNextTier(volume);
  if (!next) return 100;
  const floor = current?.volume ?? 0;
  const span = next.volume - floor;
  return Math.max(0, Math.min(100, ((volume - floor) / span) * 100));
};

export const getCampaignDayLabel = () => {
  const now = Date.now();
  const start = MAINNET_LAUNCH_START.getTime();
  const end = MAINNET_LAUNCH_END.getTime();
  if (now < start) return "Starts soon";
  if (now > end) return "Campaign ended";
  const day = Math.min(14, Math.max(1, Math.floor((now - start) / 86_400_000) + 1));
  return `Day ${day} of 14`;
};

export const trackMainnetLaunch = (eventName: string, payload?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.debug(`[mainnet-launch] ${eventName}`, payload ?? {});
  }
};
