import { useEffect, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { isWorldCupActive, SPORTS_URL } from "@/lib/worldCup";
import soccerBallAsset from "@/assets/soccer-ball.png.asset.json";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "sports-launcher-dismissed";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;
const LAUNCHER_LINK = `${SPORTS_URL}?ref=omenx-main&src=launcher`;

const isLauncherDismissed = (now: number = Date.now()): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return now - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
};

const persistDismiss = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
};

/**
 * Desktop-only. Mobile Sports entry lives in BottomNav and is decoupled
 * from this component — do NOT re-introduce a mobile collapsed variant here.
 */
export interface SportsLauncherProps {
  /** Force the launcher visible regardless of window/dismiss state (playground only). */
  forceShow?: boolean;
  /** Don't write to localStorage when dismissed (playground only). */
  ephemeral?: boolean;
  /** Position override; defaults to bottom-left fixed. */
  className?: string;
}

export const SportsLauncher = ({
  forceShow = false,
  ephemeral = false,
  className,
}: SportsLauncherProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    if (!isWorldCupActive()) return;
    if (isLauncherDismissed()) return;
    setVisible(true);
  }, [forceShow]);

  if (!visible) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    if (!ephemeral) persistDismiss();
  };

  const handleOpen = () => {
    window.open(LAUNCHER_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "group z-40 animate-fade-in hidden md:block",
        className ?? "fixed bottom-6 left-6",
      )}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss OmenX Sports launcher"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Launcher pill */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open OmenX Sports — World Cup live"
        className="flex items-center gap-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-[0_10px_30px_-10px_hsl(var(--background)/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-trading-yellow/40 hover:shadow-[0_12px_36px_-8px_hsl(var(--trading-yellow)/0.25)] active:scale-[0.98] min-w-[210px] h-14 px-3"
      >
        {/* Soccer ball icon with LIVE pulse */}
        <span className="relative flex-shrink-0">
          <span
            className="block w-10 h-10 rounded-full overflow-hidden shadow-[0_0_12px_hsl(var(--trading-yellow)/0.3)] ring-1 ring-trading-yellow/30"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, hsl(48 100% 70%), hsl(36 100% 45%))",
            }}
          >
            <img
              src={soccerBallAsset.url}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-contain p-1"
              draggable={false}
            />
          </span>
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-trading-red opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-trading-red border-2 border-card" />
          </span>
        </span>

        {/* Text content */}
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            OmenX Sports
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-trading-yellow uppercase">
            <span>World Cup</span>
            <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground" />
            <span>Live</span>
          </span>
        </span>

        {/* Arrow */}
        <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </button>
    </div>
  );
};

export default SportsLauncher;
