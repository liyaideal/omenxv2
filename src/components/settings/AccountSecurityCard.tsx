import { useState } from "react";
import { Shield, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Setup2FADialog } from "./Setup2FADialog";
import { STATUS_STYLES } from "@/lib/statusStyles";

/**
 * Account-level credential management.
 * Currently exposes the authenticator app binding.
 * Email binding is handled by the dedicated Email Address card above.
 *
 * Designed so future flows (login 2FA, password change, large transfer,
 * API keys, etc.) can all consume the same credentials surfaced here.
 */
export const AccountSecurityCard = () => {
  const { profile, updateWithdraw2faMode, enableTotp, disableTotp } = useUserProfile();
  const totpEnabled = !!profile?.totp_enabled;
  const mode = (profile?.withdraw_2fa_mode as "email" | "totp" | "both") || "email";

  const [setupOpen, setSetupOpen] = useState(false);

  const handleSetupSuccess = async (secret: string) => {
    await enableTotp(secret);
  };

  const handleDisable = async () => {
    const willResetMode = mode === "totp" || mode === "both";
    const confirmText = willResetMode
      ? "Disable authenticator? Withdrawal verification will fall back to Email only."
      : "Disable authenticator?";
    if (!window.confirm(confirmText)) return;

    const res = await disableTotp();
    if (!res.success) {
      toast.error(res.error || "Failed to disable");
      return;
    }
    if (willResetMode) {
      await updateWithdraw2faMode("email");
    }
    toast.success("Authenticator disabled");
  };

  return (
    <>
      <div className="trading-card p-4 md:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Account security</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verification methods linked to your account
            </p>
          </div>
        </div>

        {/* Authenticator app */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Authenticator app</span>
                {totpEnabled ? (
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_STYLES.success.badge}`}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Not set
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {totpEnabled
                  ? "TOTP codes from your authenticator app"
                  : "Connect Google Authenticator, Authy, or similar"}
              </div>
            </div>
            {totpEnabled ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleDisable}
              >
                Disable
              </Button>
            ) : (
              <Button size="sm" className="h-8" onClick={() => setSetupOpen(true)}>
                Set up
              </Button>
            )}
          </div>
        </div>
      </div>

      <Setup2FADialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSuccess={handleSetupSuccess}
      />
    </>
  );
};
