import omenxLogo from "@/assets/omenx-logo.svg";
import { cn } from "@/lib/utils";
import { MainnetBadge } from "@/components/MainnetBadge";

export type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  showMainnetBadge?: boolean;
}

// Standard logo sizes - use these consistently across the app
const sizeClasses: Record<LogoSize, string> = {
  sm: "h-4 w-auto",   // Small: for compact headers, mobile nav items
  md: "h-5 w-auto",   // Medium: default for mobile headers (MobileHome, EventsPage)
  lg: "h-6 w-auto",   // Large: for desktop headers
  xl: "h-8 w-auto",   // Extra large: for landing pages, prominent branding
};

export function Logo({ size = "md", className, showMainnetBadge = true }: LogoProps) {
  const badgeSize = size === "xl" || size === "lg" ? "md" : "sm";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <img src={omenxLogo} alt="OMENX" className={sizeClasses[size]} />
      {showMainnetBadge && <MainnetBadge size={badgeSize} responsive={false} />}
    </span>
  );
}

// Export the raw logo for special cases (StyleGuide documentation, etc.)
export { omenxLogo };
