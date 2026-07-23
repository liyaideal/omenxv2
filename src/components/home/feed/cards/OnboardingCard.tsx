import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActivationState } from "@/hooks/useActivationState";
import { FeedCard } from "@/components/home/feed/FeedCard";
import { cn } from "@/lib/utils";

interface OnboardingCardProps {
  compact?: boolean;
}

/**
 * Tier 1 personal signal — only renders when user is authed and activation is incomplete.
 */
export const OnboardingCard = ({ compact }: OnboardingCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, hasDeposited, hasTraded, isLoading } = useActivationState();

  if (!user || isLoading) return null;
  if (state !== "S0_NEW" && state !== "S1_DEPOSITED") return null;

  const steps = [
    { label: "Verify your account", done: true },
    { label: "Deposit USDC on Base", done: hasDeposited },
    { label: "Place your first trade", done: hasTraded },
  ];
  const completed = steps.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done) ?? steps[steps.length - 1];
  const action = !hasDeposited ? "/deposit" : "/events";

  return (
    <FeedCard
      tag={`Onboarding · ${completed}/3`}
      tier={1}
      accent="primary"
      compact={compact}
      unread
      onClick={() => navigate(action)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{current.label}</p>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2.5} />
      </div>
      <div className="mt-3 flex items-center gap-1">
        {steps.map((s, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              s.done ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </FeedCard>
  );
};
