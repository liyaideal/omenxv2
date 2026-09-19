import { useEffect, useState } from "react";
import { Shield, Smartphone, CheckCircle2, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Setup2FADialog } from "./Setup2FADialog";
import { STATUS_STYLES } from "@/lib/statusStyles";
import { RESEND_COOLDOWN_SECONDS, sendPasswordReset } from "@/lib/emailAuth";

/**
 * Account-level credential management.
 * Currently exposes the authenticator app binding.
 * Email binding is handled by the dedicated Email Address card above.
 *
 * Designed so future flows (login 2FA, large transfer, API keys, etc.) can
 * all consume the same credentials surfaced here.
 *
 * Password row (CPO 2026-09-19): shown only for email + password accounts
 * (`profile.auth_method === "email"`). "Change" sends the reset link to the
 * sign-in email and the row flips to a 60s "sent" state; the link lands on
 * /reset-password. One flow for "forgot" and "change" — no old-password dialog.
 */
export const AccountSecurityCard = ({
  previewEmailUser,
  previewSentSeconds,
}: {
  /** Style-guide only: render the Password row as if auth_method === "email". Never set in product. */
  previewEmailUser?: boolean;
  /** Style-guide only: freeze the Password row in its "sent" state at N seconds. Never set in product. */
  previewSentSeconds?: number;
} = {}) => {
  const { profile, updateWithdraw2faMode, enableTotp, disableTotp } = useUserProfile();
  const totpEnabled = !!profile?.totp_enabled;
  const mode = (profile?.withdraw_2fa_mode as "email" | "totp" | "both") || "email";
  const isEmailUser = previewEmailUser || profile?.auth_method === "email";

  const [setupOpen, setSetupOpen] = useState(false);
  const [resetCooldown, setResetCooldown] = useState<number>(previewSentSeconds ?? 0);
  const [resetSending, setResetSending] = useState(false);

  useEffect(() => {
    if (resetCooldown <= 0 || previewSentSeconds !== undefined) return;
    const t = window.setTimeout(() => setResetCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resetCooldown, previewSentSeconds]);

  const handleSendReset = async () => {
    if (previewEmailUser) {
      toast.message("Preview: would send reset link");
      return;
    }
    const email = profile?.email;
    if (!email) {
      toast.error("No email on this account");
      return;
    }
    setResetSending(true);
    const res = await sendPasswordReset(email);
    setResetSending(false);
    if (res.ok === false) {
      toast.error(res.message);
      return;
    }
    setResetCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success(`Reset link sent to ${email}`);
  };

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

        {/* Password — email + password accounts only */}
        {isEmailUser && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">Password</span>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {resetCooldown > 0
                    ? "Reset link sent — check your inbox."
                    : "Change it with a link sent to your email"}
                </div>
              </div>
              {resetCooldown > 0 ? (
                <Button variant="outline" size="sm" className="h-8" disabled>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {resetCooldown}s
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={resetSending}
                  onClick={handleSendReset}
                >
                  Change
                </Button>
              )}
            </div>
          </div>
        )}

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
