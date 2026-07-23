import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/70",
        outline: "text-foreground hover:bg-muted",
        // Trading status variants
        success: "border-trading-green/30 bg-trading-green/10 text-trading-green hover:bg-trading-green/20",
        error: "border-trading-red/30 bg-trading-red/10 text-trading-red hover:bg-trading-red/20",
        warning: "border-trading-yellow/30 bg-trading-yellow/10 text-trading-yellow hover:bg-trading-yellow/20",
        info: "border-trading-purple/30 bg-trading-purple/10 text-trading-purple hover:bg-trading-purple/20",
        // Category-specific variants with matching hover states
        social: "border-primary/30 bg-primary/20 text-primary hover:bg-primary/30",
        crypto: "border-trading-yellow/30 bg-trading-yellow/20 text-trading-yellow hover:bg-trading-yellow/30",
        finance: "border-trading-green/30 bg-trading-green/20 text-trading-green hover:bg-trading-green/30",
        politics: "border-trading-red/30 bg-trading-red/20 text-trading-red hover:bg-trading-red/30",
        tech: "border-cyan-500/30 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30",
        entertainment: "border-orange-500/30 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
        sports: "border-blue-500/30 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
        general: "border-border bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
