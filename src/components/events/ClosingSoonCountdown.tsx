import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClosingSoonCountdownProps {
  endDate: Date;
  className?: string;
}

const formatCountdown = (ms: number): { text: string; tier: 1 | 2 | 3 | 4 } => {
  if (ms <= 0) return { text: "EXPIRED", tier: 4 };

  const totalMinutes = ms / 60000;
  const totalHours = totalMinutes / 60;
  const totalDays = totalHours / 24;

  if (totalMinutes < 5) return { text: "CLOSING", tier: 4 };
  if (totalHours < 1) return { text: `${Math.floor(totalMinutes)}m`, tier: 3 };
  if (totalHours < 24) {
    const h = Math.floor(totalHours);
    const m = Math.floor(totalMinutes % 60);
    return { text: `${h}h ${m}m`, tier: 2 };
  }
  const d = Math.floor(totalDays);
  const h = Math.floor(totalHours % 24);
  return { text: `${d}d ${h}h`, tier: 1 };
};

export const ClosingSoonCountdown = ({ endDate, className }: ClosingSoonCountdownProps) => {
  const [now, setNow] = useState(Date.now());
  const ms = endDate.getTime() - now;

  const { text, tier } = useMemo(() => formatCountdown(ms), [ms]);

  useEffect(() => {
    const interval = ms < 300000 ? 1000 : 60000; // <5m → 1s, else 60s
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [ms < 300000]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-trading-red",
        tier === 2 && "font-bold",
        tier === 3 && "font-bold animate-pulse",
        tier === 4 && "font-bold",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {text}
    </span>
  );
};

/** Returns true when event is within 72h of expiry */
export const isClosingSoon = (endDate: Date | null): boolean => {
  if (!endDate) return false;
  return endDate.getTime() - Date.now() <= 72 * 3600000 && endDate.getTime() > Date.now();
};

/** Returns true when event was created within 72h */
export const isNewEvent = (createdAt: string): boolean => {
  return Date.now() - new Date(createdAt).getTime() <= 72 * 3600000;
};
