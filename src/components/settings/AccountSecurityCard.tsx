import { useEffect, useState } from "react";
import { Smartphone, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Setup2FADialog } from "./Setup2FADialog";
import { RESEND_COOLDOWN_SECONDS, sendPasswordReset } from "@/lib/emailAuth";
import { SettingsCapsule, SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Account-level credential management (reskinned 2026-09-22 into the
 * ACCOUNT-family card grammar, mock v5 §1 / 4.7; logic unchanged — rule 8).
 *
 * Password row (CPO 2026-09-19): shown only for email + password accounts
 * (`profile.auth_method === "email"`). "Change" sends the reset link to the
 * sign-in email and the row flips to a 60s "sent" state; the link lands on
 * /reset-password. One flow for "forgot" and "change" — no old-password dialog.
 *
 * Authenticator row: `NOT SET` capsule + `Set up` → Setup2FADialog;
 * `ENABLED` capsule (accent) + `Disable` → confirm (falls back withdrawal
 * verification to Email only when it depended on the authenticator).
 */
export const AccountSecurityCard = ({
  previewEmailUser,
  previewSentSeconds,
  previewTotpEnabled,
}: {
  /** Style-guide only: render the Password row as if auth_method === "email". Never set in product. */
  previewEmailUser?: boolean;
  /** Style-guide only: freeze the Password row in its "sent" state at N seconds. Never set in product. */
  previewSentSeconds?: number;
  /** Style-guide only: render the Authenticator row as enabled. Never set in product. */
  previewTotpEnabled?: boolean;
} = {}) => {
  const isMobile = useIsMobile();
  const { profile, updateWithdraw2faMode, enableTotp, disableTotp } = useUserProfile();
  const totpEnabled = previewTotpEnabled ?? !!profile?.totp_enabled;
  const mode = (profile?.withdraw_2fa_mode as "email" | "totp" | "both") || "email";
  const isEmailUser = previewEmailUser || profile?.auth_method === "email";
  const preview = previewEmailUser || previewSentSeconds !== undefined || previewTotpEnabled !== undefined;

  const [setupOpen, setSetupOpen] = useState(false);
  const [resetCooldown, setResetCooldown] = useState<number>(previewSentSeconds ?? 0);
  const [resetSending, setResetSending] = useState(false);

  useEffect(() => {
    if (resetCooldown <= 0 || previewSentSeconds !== undefined) return;
    const t = window.setTimeout(() => setResetCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resetCooldown, previewSentSeconds]);

  const handleSendReset = async () => {
    if (preview) {
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
    if (preview) {
      toast.message("Preview: would disable authenticator");
      return;
    }
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
      <SettingsCard
        label="Account security"
        description="Verification methods linked to your account."
        compact={isMobile}
      >
        {isEmailUser && (
          <SettingsRow
            icon={Lock}
            title="Password"
            sub={resetCooldown > 0 ? "Reset link sent — check your inbox." : "Change it with a link sent to your email"}
            right={
              resetCooldown > 0 ? (
                <Button variant="outline" size="sm" className="h-8" disabled>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {resetCooldown}s
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="h-8" disabled={resetSending} onClick={handleSendReset}>
                  Change
                </Button>
              )
            }
          />
        )}

        <SettingsRow
          icon={Smartphone}
          title={
            <>
              Authenticator app
              {totpEnabled ? (
                <SettingsCapsule tone="accent">Enabled</SettingsCapsule>
              ) : (
                <SettingsCapsule>Not set</SettingsCapsule>
              )}
            </>
          }
          sub={totpEnabled ? "Codes from your authenticator app" : "Connect Google Authenticator, Authy, or similar"}
          right={
            totpEnabled ? (
              <Button variant="outline" size="sm" className="h-8" onClick={handleDisable}>
                Disable
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-8" onClick={() => setSetupOpen(true)}>
                Set up
              </Button>
            )
          }
          last
        />
      </SettingsCard>

      <Setup2FADialog open={setupOpen} onOpenChange={setSetupOpen} onSuccess={handleSetupSuccess} />
    </>
  );
};
