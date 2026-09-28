import { useT } from "@/i18n";
import { Mail, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { SettingsCapsule, SettingsCard, SettingsNote, SettingsRow } from "./SettingsCard";

/**
 * Settings › Sign-in — Google / Wallet / Telegram accounts (CPO 2026-09-22,
 * mock v5 §2, rules 6–7). Merges the old Email card + Linked Account card:
 *   row 1 = the provider (no action — it cannot be changed);
 *   row 2 = Notification email + `Edit`, or `NOT SET` capsule + `Add`
 *           (opens the existing notification-email dialog).
 * Wallet accounts have no email by default → row 2 is the Add state and the
 * helper reads "Needed for alerts and account recovery".
 */

export type SignInProvider = "google" | "wallet" | "telegram";

const PROVIDER: Record<
  SignInProvider,
  { label: string; value: string; icon: React.ComponentType<{ className?: string }> }
> = {
  google: { label: "settings.login_method_google", value: "settings.signin.googleAccount", icon: GoogleIcon },
  wallet: { label: "settings.account_type_wallet", value: "settings.account_type_wallet", icon: Wallet },
  telegram: { label: "settings.login_method_telegram", value: "settings.login_method_telegram", icon: TelegramIcon },
};

export const ProviderSignInCard = ({
  provider,
  providerValue,
  notificationEmail,
  onEditEmail,
}: {
  provider: SignInProvider;
  /** What the provider row shows under its name: the Google email, the short wallet address, the Telegram handle. Omitted when unknown. */
  providerValue?: string | null;
  notificationEmail: string | null;
  onEditEmail: () => void;
}) => {
  const { t } = useT();
  const isMobile = useIsMobile();
  const p = PROVIDER[provider];

  return (
    <SettingsCard label={t("settings.signin.label")} value={t(p.value)} compact={isMobile}>
      <SettingsRow icon={p.icon} title={t(p.label)} sub={providerValue || undefined} subMono />
      <SettingsRow
        icon={Mail}
        title={
          <>
            {t("settings.signin.notificationEmail")}
            {!notificationEmail && <SettingsCapsule>{t("settings.not_set")}</SettingsCapsule>}
          </>
        }
        sub={notificationEmail || t("settings.signin.notificationEmailSub")}
        subMono={!!notificationEmail}
        right={
          <Button variant="outline" size="sm" className="h-8" onClick={onEditEmail}>
            {notificationEmail ? t("common.edit") : t("settings.signin.add")}
          </Button>
        }
        last
      />
      <SettingsNote>
        {t("settings.signin.providerNote", { provider: t(p.label) })}
      </SettingsNote>
    </SettingsCard>
  );
};
