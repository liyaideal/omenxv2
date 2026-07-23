import { useNavigate } from "react-router-dom";
import { Check, ArrowDownToLine, TrendingUp, ShieldCheck, ChevronRight } from "lucide-react";
import { useActivationState } from "@/hooks/useActivationState";
import { cn } from "@/lib/utils";

/**
 * Persistent 3-step onboarding checklist shown to S0/S1 users.
 * Hides itself once the user reaches S2 (first mainnet trade) or higher.
 */
export const ActivationChecklist = () => {
  const navigate = useNavigate();
  const { state, hasDeposited, hasTraded, isLoading } = useActivationState();

  if (isLoading) return null;
  if (state === "GUEST" || state === "S2_TRADED" || state === "S3_ACTIVE") return null;

  const steps = [
    {
      id: "verify",
      label: "Verify your account",
      desc: "Signed in with email or Google",
      icon: ShieldCheck,
      done: true,
      action: null,
      cta: "",
    },
    {
      id: "deposit",
      label: "Deposit USDC on Base",
      desc: "Real on-chain custody, instant credit",
      icon: ArrowDownToLine,
      done: hasDeposited,
      action: () => navigate("/deposit"),
      cta: "Deposit",
    },
    {
      id: "trade",
      label: "Place your first trade",
      desc: "Unlock launch campaign rebates",
      icon: TrendingUp,
      done: hasTraded,
      action: () => navigate("/events"),
      cta: "Browse markets",
    },
  ] as const;

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;

  return (
    <section
      aria-label="Mainnet activation checklist"
      className="relative overflow-hidden rounded-2xl border border-trading-green/30 bg-gradient-to-br from-trading-green/[0.08] via-background to-background p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-trading-green">
            Mainnet · Get started
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">
            Start trading in 3 steps
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {completed}/{total}
        </span>
      </div>

      <ol className="space-y-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                step.done
                  ? "border-trading-green/30 bg-trading-green/5"
                  : "border-border/50 bg-muted/20",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  step.done
                    ? "bg-trading-green/20 text-trading-green"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span className="font-mono text-xs font-semibold">{idx + 1}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      step.done ? "text-trading-green" : "text-muted-foreground",
                    )}
                  />
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      step.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                </div>
                {!step.done && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{step.desc}</p>
                )}
              </div>

              {!step.done && step.action && (
                <button
                  onClick={step.action}
                  className="flex flex-shrink-0 items-center gap-1 rounded-md bg-trading-green px-2.5 py-1.5 text-xs font-semibold text-background hover:bg-trading-green/90 transition-colors"
                >
                  {step.cta}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
