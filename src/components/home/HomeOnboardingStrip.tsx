import { useNavigate } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActivationState } from "@/hooks/useActivationState";
import { cn } from "@/lib/utils";

/**
 * Single-row onboarding progress strip.
 * Hidden when user is unauthenticated, loading, or activation complete.
 */
export const HomeOnboardingStrip = () => {
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
  const currentIdx = steps.findIndex((s) => !s.done);
  const current = currentIdx >= 0 ? steps[currentIdx] : steps[steps.length - 1];
  const action = !hasDeposited ? "/deposit" : "/events";

  return (
    <button
      onClick={() => navigate(action)}
      className="w-full rounded-xl border border-trading-green/25 bg-trading-green/5 px-3 py-2.5 text-left transition-colors hover:bg-trading-green/10"
      aria-label={`Onboarding step ${completed + 1} of 3`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-trading-green/15 text-trading-green">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-trading-green">
            Onboarding {completed}/3
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{current.label}</p>
          <div className="mt-1.5 flex items-center gap-1">
            {steps.map((s, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  s.done
                    ? "bg-trading-green"
                    : i === currentIdx
                      ? "bg-trading-green/40"
                      : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
      </div>
    </button>
  );
};
