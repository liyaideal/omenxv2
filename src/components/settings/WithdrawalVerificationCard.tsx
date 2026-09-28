import { useT, t } from "@/i18n";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Setup2FADialog } from "./Setup2FADialog";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./SettingsCard";

type Mode = "email" | "totp" | "both";

const MODE_OPTIONS: { value: Mode; label: string; description: string }[] = [
  {
    value: "email",
    label: "settings.screen.sections.settings_withdrawal_verification_card.email_only",
    description: "settings.screen.sections.settings_withdrawal_verification_card.email_only_description",
  },
  {
    value: "totp",
    label: "settings.screen.sections.settings_withdrawal_verification_card.authenticator_only",
    description: "settings.screen.sections.settings_withdrawal_verification_card.authenticator_only_description",
  },
  {
    value: "both",
    label: "settings.screen.sections.settings_withdrawal_verification_card.email_and_authenticator",
    description: "settings.screen.sections.settings_withdrawal_verification_card.email_and_authenticator_description",
  },
];

export type WithdrawalVerificationPreviewState = "default" | "all-enabled" | "nothing";

/**
 * Per-feature security preference for the withdrawal flow (reskinned
 * 2026-09-22 into the ACCOUNT-family card grammar, mock v5 §1 / 4.8 / 4.9;
 * logic unchanged — rules 8–9).
 * Reads credential state from useUserProfile (email, totp_enabled) and
 * disables modes whose prerequisites are not bound. Options are hairline rows
 * with a radio; a disabled option carries an amber "Requires …" line; when
 * nothing is configured (wallet account, no email, no 2FA) an amber box
 * points at Sign-in / Account security and all three rows are disabled.
 */
export const WithdrawalVerificationCard = ({
  previewState,
}: {
  /** Style-guide only: freeze credential state with display fixtures. Never set in product. */
  previewState?: WithdrawalVerificationPreviewState;
} = {}) => {
  const { t } = useT();
  const isMobile = useIsMobile();
  const { profile, email, updateWithdraw2faMode, enableTotp } = useUserProfile();

  const preview = !!previewState;
  const storedMode: Mode = preview
    ? previewState === "all-enabled"
      ? "both"
      : "email"
    : ((profile?.withdraw_2fa_mode as Mode) || "email");
  const totpEnabled = preview ? previewState === "all-enabled" : !!profile?.totp_enabled;
  const hasEmail = preview ? previewState !== "nothing" : !!email;

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
    if (preview) {
      toast.message("Preview: would update withdrawal verification");
      return;
    }

    // Email requirement — direct the user to the Sign-in card.
    if ((next === "email" || next === "both") && !hasEmail) {
      toast.error(t("settings.withdrawal.needEmail"));
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
      toast.success(t("settings.screen.sections.settings_withdrawal_verification_card.update_success"));
    } else {
      toast.error(res.error || t("settings.screen.sections.settings_withdrawal_verification_card.update_failed"));
    }
  };

  const handleSetupSuccess = async (secret: string) => {
    await enableTotp(secret);
    if (pendingMode) {
      // 'both' still requires email — re-check after totp setup
      if (pendingMode === "both" && !hasEmail) {
        toast.error("Authenticator added. Add an email in Sign-in to enable Email + Authenticator");
      } else {
        const res = await updateWithdraw2faMode(pendingMode);
        if (!res.success) {
          toast.error(res.error || "Saved authenticator, failed to update mode");
        } else {
          toast.success(t("settings.screen.sections.settings_withdrawal_verification_card.update_success"));
        }
      }
      setPendingMode(null);
    }
  };

  return (
    <>
      <SettingsCard
        label={t("settings.screen.sections.settings_withdrawal_verification_card.withdrawal_verification")}
        description={t("settings.withdrawal.description")}
        compact={isMobile}
      >
        {nothingConfigured && (
          <div className="rounded-lg border border-trading-yellow/30 bg-trading-yellow/10 p-3 flex items-start gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-trading-yellow mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add an email in <span className="font-medium text-foreground">{t("settings.signin.label")}</span> or set up an authenticator in{" "}
              <span className="font-medium text-foreground">{t("settings.screen.sections.settings_account_security_card.account_security")}</span> to enable withdrawal verification.
            </p>
          </div>
        )}

        <RadioGroup value={activeMode} onValueChange={(v) => handleModeChange(v as Mode)}>
          {MODE_OPTIONS.map((opt, i) => {
            const ready = isModeReady(opt.value);
            const isActive = activeMode === opt.value;
            const missing: string[] = [];
            if (opt.value !== "totp" && !hasEmail) missing.push(t("settings.email"));
            if (opt.value !== "email" && !totpEnabled) missing.push(t("settings.screen.sections.settings_withdrawal_verification_card.authenticator_requirement"));
            const last = i === MODE_OPTIONS.length - 1;

            return (
              <label
                key={opt.value}
                htmlFor={`mode-${opt.value}`}
                className={cn(
                  "flex items-start gap-3 py-3.5",
                  !last && "border-b border-[#1D2026]",
                  last && "pb-0",
                  ready ? "cursor-pointer" : "cursor-not-allowed opacity-55",
                )}
              >
                {/* Not-ready options stay clickable: totp/both open the 2FA setup inline (existing logic). Only the nothing-configured state disables all three (rule 9). */}
                <RadioGroupItem id={`mode-${opt.value}`} value={opt.value} className="mt-0.5" disabled={nothingConfigured} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-medium", isActive && "text-foreground")}>{t(opt.label)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(opt.description)}</div>
                  {!ready && !nothingConfigured && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-trading-yellow">
                      <AlertTriangle className="w-3 h-3" />
                      {t("settings.screen.sections.settings_withdrawal_verification_card.requires_configuration", { methods: missing.join(" + ") })}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </SettingsCard>

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
