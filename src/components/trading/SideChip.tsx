// ============================================================
// SideChip — "which side do you hold" identity chip for the Pro tables
// (positions · current orders · pending airdrops) and the mobile PositionCard.
// 研发问题 #9 (2026-09-24): colour follows the MARKET axis (DESIGN §2 · 持仓标识):
//   Yes/Up = --yes (#33D6FF) · No/Down = --no (#CFFF4A), black text — the same
//   rule as the portfolio SIDE chip. Never the money axis (green/red).
// Extracted verbatim from DesktopTrading's inline span; zero visual change apart
// from the colour fix.
// ============================================================
import { cn } from "@/lib/utils";

export const SIDE_CHIP_CLASS = {
  yes: "bg-yes text-[#04222c]",
  no: "bg-no text-[#1a2408]",
} as const;

export const SideChip = ({
  side,
  children,
  className,
}: {
  side: "yes" | "no";
  children: React.ReactNode;
  className?: string;
}) => (
  <span className={cn("px-2 py-0.5 rounded text-xs font-medium", SIDE_CHIP_CLASS[side], className)}>
    {children}
  </span>
);
