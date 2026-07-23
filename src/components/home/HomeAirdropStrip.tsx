import { useNavigate } from "react-router-dom";
import { ChevronRight, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";

/**
 * Single-row airdrop notification strip.
 * Hidden when user is unauthenticated or has no pending airdrops.
 */
export const HomeAirdropStrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingAirdrops } = useAirdropPositions();

  if (!user) return null;
  if (pendingAirdrops.length === 0) return null;

  const count = pendingAirdrops.length;

  return (
    <button
      onClick={() => navigate("/portfolio/airdrops")}
      className="w-full rounded-xl border border-trading-yellow/25 bg-trading-yellow/5 px-3 py-2.5 text-left transition-colors hover:bg-trading-yellow/10"
      aria-label="Airdrop ready to claim"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-trading-yellow/15 text-trading-yellow">
          <Gift className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-trading-yellow">
              Airdrop
            </p>
            <span className="rounded bg-trading-yellow px-1 py-px font-mono text-[8px] font-bold uppercase tracking-wider text-background">
              New
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {count} Airdrop{count > 1 ? "s" : ""} ready
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Trade to activate counter-positions
          </p>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
      </div>
    </button>
  );
};
