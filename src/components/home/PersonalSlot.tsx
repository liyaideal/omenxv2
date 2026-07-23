import { useAuth } from "@/hooks/useAuth";
import { useActivationState } from "@/hooks/useActivationState";
import { usePositions } from "@/hooks/usePositions";
import { OnboardingCard } from "@/components/home/feed/cards/OnboardingCard";
import { PositionAlertCard } from "@/components/home/feed/cards/PositionAlertCard";

/**
 * Single personal slot for MobileHome — picks ONE card based on user state.
 *
 * Priority: Onboarding (S0_NEW / S1_DEPOSITED) > PositionAlert (activated + has position).
 * Guests and activated-but-empty users render nothing.
 */
export const PersonalSlot = () => {
  const { user } = useAuth();
  const { state, isLoading } = useActivationState();
  const { positions } = usePositions();

  if (!user || isLoading) return null;

  // Onboarding takes precedence while activation is incomplete.
  if (state === "S0_NEW" || state === "S1_DEPOSITED") {
    return <OnboardingCard />;
  }

  // Activated → surface most-moved real position (excluding airdrop demo).
  const topPosition = [...positions]
    .filter((p) => !p.isAirdrop)
    .sort((a, b) => {
      const pa = Math.abs(parseFloat(a.pnlPercent.replace(/[^\d.\-]/g, ""))) || 0;
      const pb = Math.abs(parseFloat(b.pnlPercent.replace(/[^\d.\-]/g, ""))) || 0;
      return pb - pa;
    })[0];

  if (topPosition) {
    return <PositionAlertCard positionId={topPosition.id} />;
  }

  return null;
};
