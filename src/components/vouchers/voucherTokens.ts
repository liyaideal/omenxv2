// Flat token language for the Vouchers v2 surface (CD final, 2026-08-xx).
// Hex literals mirror the frozen design contract 1:1 — same convention the rest
// of the Lite surface uses (LiteRewardsPage, CampaignCard...).
export const VT = {
  volt: "#CFFF4A",
  blue: "#33D6FF",
  red: "#FF5C5C",
  ink: "#F2F3F5",
  ink2: "#C9CED6",
  ink3: "#9AA1AC",
  muted: "#6B7280",
  muted2: "#4A5058",
  line: "#1D2026",
  line2: "#23262D",
  line3: "#2B2F38",
  hairline: "#16191E",
  surfaceRow: "#131519",
  surfaceInset: "#101216",
  surfaceCard: "#0F1114",
  surfaceDesk: "#0B0C0E",
  surfaceDeep: "#0A0B0D",
  railOff: "#1A1D22",
  disabledBg: "#15171B",
} as const;

export const dispFont = "font-display tabular-nums";

/** "Expires in 5d" / "Expires in 7h" */
export const formatExpiresIn = (iso: string, now: number = Date.now()): string => {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `Expires in ${Math.floor(hours / 24)}d`;
  if (hours >= 1) return `Expires in ${hours}h`;
  return `Expires in ${Math.max(1, Math.floor(ms / 60_000))}m`;
};

export const shortDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

export const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const compactMoney = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
};
