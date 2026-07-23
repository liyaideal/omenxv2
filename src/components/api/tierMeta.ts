import { Eye, Zap, Rocket, type LucideIcon } from "lucide-react";
import type { ApiTier } from "@/hooks/useApiKeys";

/** Single tier token source — shared across ApiManagement and /style-guide. */
export type TierMeta = {
  label: string;
  icon: LucideIcon;
  /** Text/accent color class */
  accent: string;
  /** Tinted bg + border for accent chip */
  chip: string;
  /** Dot fill when eligible */
  dotFill: string;
  /** Faint surface tint for "current tier" hint */
  surfaceHint: string;
};

export const TIER_META: Record<ApiTier, TierMeta> = {
  read_only: {
    label: "Read-only",
    icon: Eye,
    accent: "text-muted-foreground",
    chip: "bg-muted text-muted-foreground border-border",
    dotFill: "bg-muted-foreground",
    surfaceHint: "bg-muted-foreground/[0.04]",
  },
  trading: {
    label: "Trading",
    icon: Zap,
    accent: "text-primary",
    chip: "bg-primary/10 text-primary border-primary/20",
    dotFill: "bg-primary",
    surfaceHint: "bg-primary/[0.04]",
  },
  pro_mm: {
    label: "Pro / Market Maker",
    icon: Rocket,
    accent: "text-amber-400",
    chip: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    dotFill: "bg-amber-400",
    surfaceHint: "bg-amber-400/[0.04]",
  },
};

export const TIER_ORDER: ApiTier[] = ["read_only", "trading", "pro_mm"];

export const isValidIp = (raw: string) => {
  const s = raw.trim();
  if (!s) return false;
  return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(s) || /^[0-9a-fA-F:]+(\/\d{1,3})?$/.test(s);
};
