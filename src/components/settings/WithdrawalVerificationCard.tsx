import { useState } from "react";
import { Banknote, AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Setup2FADialog } from "./Setup2FADialog";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/statusStyles";

type Mode = "email" | "totp" | "both";

const MODE_OPTIONS: { value: Mode; label: string; description: string }[] = [
  {
    value: "email",
    label: "Email only",
    description: "Send a 6-digit code to your email",
  },
  {
    value: "totp",
    label: "Authenticator only",
    description: "Use codes from an authenticator app",
  },
  {
    value: "both",
    label: "Email + Authenticator",
    description: "Strongest — require both for every withdrawal",
  },
];

/**
 * Per-feature security preference for the withdrawal flow.
 * Reads credential state from useUserProfile (email, totp_enabled) and
 * disables modes whose prerequisites are not bound.
 */
export const WithdrawalVerificationCard = () => {
  const {
    profile,
    email,
    updateWithdraw2faMode,
    enableTotp,
  } = useUserProfile();

  const storedMode = (profile?.withdraw_2fa_mode as Mode) || "email";
  const totpEnabled = !!profile?.totp_enabled;
  const hasEmail = !!email;

  const isModeReady = (m: Mode) => {
    if (m === "email") return hasEmail;
    if (m === "totp") return totpEnabled;
    return hasEmail && totpEnabled;
  };

  const activeMode = isModeReady(storedMode) ? storedMode : undefined;
  const nothingConfigured = !hasEmail && !totpEnabled;

  const [setupOpen, setSetupOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const handleModeChange = async (next: Mode) => {
    if (next === activeMode) return;

    // Email requirement — direct the user to the Email Address card above.
    if ((next === "email" || next === "both") && !hasEmail) {
      toast.error("Add an email above to use this option");
      return;
    }

    // TOTP requirement — open setup inline.
    if ((next === "totp" || next === "both") && !totpEnabled) {
      setPendingMode(next);
      setSetupOpen(true);
      return;
    }

    const res = await updateWithdraw2faMode(next);
    if (res.success) {
      toast.success("Withdrawal verification updated");
    } else {
      toast.error(res.error || "Failed to update");
    }
  };

  const handleSetupSuccess = async (secret: string) => {
    await enableTotp(secret);
    if (pendingMode) {
      // 'both' still requires email — re-check after totp setup
      if ((pendingMode === "both") && !hasEmail) {
        toast.error("Authenticator added. Add an email above to enable Email + Authenticator");
      } else {
        const res = await updateWithdraw2faMode(pendingMode);
        if (!res.success) {
          toast.error(res.error || "Saved authenticator, failed to update mode");
        } else {
          toast.success("Withdrawal verification updated");
        }
      }
      setPendingMode(null);
    }
  };

  return (
    <>
      <div className="trading-card p-4 md:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">Withdrawal verification</h3>
              {!activeMode && (
                <Badge className={`text-xs ${STATUS_STYLES.neutral.badge}`}>
                  Not configured
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how to verify when you submit a withdrawal
            </p>
          </div>
        </div>

        {nothingConfigured && (
          <div className="rounded-lg border border-trading-yellow/30 bg-trading-yellow/10 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-trading-yellow mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              You haven't added an email or set up an authenticator yet. Configure one above
              in <span className="font-medium text-foreground">Email Address</span> or
              <span className="font-medium text-foreground"> Account security</span> first.
            </p>
          </div>
        )}

        <RadioGroup
          value={activeMode}
          onValueChange={(v) => handleModeChange(v as Mode)}
        >
          <div className="space-y-2">
            {MODE_OPTIONS.map((opt) => {
              const ready = isModeReady(opt.value);
              const isActive = activeMode === opt.value;
              const missing: string[] = [];
              if (opt.value !== "totp" && !hasEmail) missing.push("email");
              if (opt.value !== "email" && !totpEnabled) missing.push("authenticator");

              return (
                <label
                  key={opt.value}
                  htmlFor={`mode-${opt.value}`}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-muted/30 p-3 transition-colors",
                    ready ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : ready
                      ? "hover:bg-muted/50"
                      : ""
                  )}
                >
                  <RadioGroupItem
                    id={`mode-${opt.value}`}
                    value={opt.value}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {opt.description}
                    </div>
                    {!ready && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-trading-yellow">
                        <AlertTriangle className="w-3 h-3" />
                        Requires {missing.join(" + ")} to be configured
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      <Setup2FADialog
        open={setupOpen}
        onOpenChange={(o) => {
          setSetupOpen(o);
          if (!o) setPendingMode(null);
        }}
        onSuccess={handleSetupSuccess}
      />
    </>
  );
};
