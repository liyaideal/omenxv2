import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatLongCountdown, formatShortCountdown, getCountdownParts } from "@/lib/mainnetLaunch";

interface CountdownProps {
  compact?: boolean;
  className?: string;
  /** Optional override target — defaults to MAINNET_LAUNCH_END. Useful for previews & other campaigns. */
  endsAt?: Date;
}

export const Countdown = ({ compact, className, endsAt }: CountdownProps) => {
  const [parts, setParts] = useState(() => getCountdownParts(endsAt));

  useEffect(() => {
    const timer = window.setInterval(() => setParts(getCountdownParts(endsAt)), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return (
    <span className={cn("inline-flex items-center gap-2 font-mono", className)}>
      {compact ? formatShortCountdown(parts) : formatLongCountdown(parts)}
    </span>
  );
};
