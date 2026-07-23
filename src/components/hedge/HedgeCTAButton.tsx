import { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { PolymarketConnectDialog } from "./PolymarketConnectDialog";

export type HedgeCTAState =
  | "connect"
  | "open-hedge"
  | "view-hedges"
  | "loading"
  | "ended";

interface HedgeCTAButtonProps {
  label?: string;
  size?: "default" | "lg";
  className?: string;
  showArrow?: boolean;
  fullWidth?: boolean;
  /** Force a state — only used by Style Guide Playground. Default: derive from auth/account. */
  stateOverride?: HedgeCTAState;
}

const LABELS: Record<HedgeCTAState, string> = {
  connect: "CONNECT WALLET & CLAIM YOUR HEDGE",
  "open-hedge": "CLAIM YOUR HEDGE",
  "view-hedges": "View My Hedges",
  loading: "Connecting…",
  ended: "Campaign Ended",
};

/**
 * Retro-poster CTA: deep blue fill, thick ink border, hard offset shadow
 * that flattens on press (border-b-0 + translate). Page-scoped to /hedge.
 */
export const HedgeCTAButton = forwardRef<HTMLButtonElement, HedgeCTAButtonProps>(
  (
    {
      label,
      size = "lg",
      className,
      showArrow = true,
      fullWidth = false,
      stateOverride,
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { user } = useUserProfile();
    const { activeAccounts } = useConnectedAccounts();

    const polymarketAccount = activeAccounts.find(
      (a) => a.platform === "polymarket",
    );

    const [authOpen, setAuthOpen] = useState(false);
    const [connectOpen, setConnectOpen] = useState(false);
    const [autoOpenAfterAuth, setAutoOpenAfterAuth] = useState(false);

    useEffect(() => {
      if (autoOpenAfterAuth && user && !authOpen) {
        if (polymarketAccount) {
          navigate("/portfolio/airdrops");
        } else {
          setConnectOpen(true);
        }
        setAutoOpenAfterAuth(false);
      }
    }, [autoOpenAfterAuth, user, authOpen, polymarketAccount, navigate]);

    const derivedState: HedgeCTAState = stateOverride
      ? stateOverride
      : !user
        ? "connect"
        : polymarketAccount
          ? "view-hedges"
          : "open-hedge";

    const isDisabled = derivedState === "ended" || derivedState === "loading";
    const finalLabel = label ?? LABELS[derivedState];

    const handleClick = () => {
      if (stateOverride) return; // playground demo only
      if (!user) {
        setAutoOpenAfterAuth(true);
        setAuthOpen(true);
        return;
      }
      if (polymarketAccount) {
        navigate("/portfolio/airdrops");
        return;
      }
      setConnectOpen(true);
    };

    const handleConnected = () => navigate("/portfolio/airdrops");

    return (
      <>
        <button
          ref={ref}
          onClick={handleClick}
          disabled={isDisabled}
          className={cn(
            // base: blue ink-border push-button
            "group relative inline-flex items-center justify-center gap-3 font-poster uppercase tracking-tight text-white",
            "border-[3px] border-[#0E0E0E] border-b-[10px] border-r-[10px]",
            "bg-[#1D4ED8] hover:bg-[#1E40AF]",
            "transition-all duration-100",
            "active:border-b-[3px] active:border-r-[3px] active:translate-y-[7px] active:translate-x-[7px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFCF0]",
            size === "lg" ? "px-7 py-4 text-base md:text-lg" : "px-5 py-3 text-sm",
            fullWidth && "w-full",
            // state-specific palette
            derivedState === "ended" &&
              "bg-neutral-400 hover:bg-neutral-400 cursor-not-allowed text-white/80",
            derivedState === "view-hedges" &&
              "bg-[#E11D48] hover:bg-[#BE123C]",
            derivedState === "loading" &&
              "cursor-wait bg-[#1D4ED8] hover:bg-[#1D4ED8]",
            className,
          )}
        >
          {derivedState === "loading" && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
          <span>{finalLabel}</span>
          {showArrow && derivedState !== "loading" && (
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        {!stateOverride && (
          <>
            {isMobile ? (
              <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
            ) : (
              <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
            )}
            <PolymarketConnectDialog
              open={connectOpen}
              onOpenChange={setConnectOpen}
              onConnected={handleConnected}
            />
          </>
        )}
      </>
    );
  },
);

HedgeCTAButton.displayName = "HedgeCTAButton";
