import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3 | 4;

export const STEP_TITLES: Record<WizardStep, string> = {
  1: "Label & tier",
  2: "Scopes & IP",
  3: "Verify 2FA",
  4: "Save secret",
};

export const StepIndicator = ({
  current,
  titles = STEP_TITLES,
}: {
  current: WizardStep;
  titles?: Record<WizardStep, string>;
}) => {
  const steps: WizardStep[] = [1, 2, 3, 4];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const state = s < current ? "done" : s === current ? "current" : "todo";
        return (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div
              className={cn(
                "w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0 transition-colors",
                state === "done" && "bg-primary text-primary-foreground border-primary",
                state === "current" && "bg-primary/15 text-primary border-primary",
                state === "todo" && "bg-background text-muted-foreground/60 border-border",
              )}
            >
              {state === "done" ? <Check className="w-3 h-3" /> : s}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-1.5 transition-colors",
                  s < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
      <span className="sr-only">Step {current} of 4: {titles[current]}</span>
    </div>
  );
};
