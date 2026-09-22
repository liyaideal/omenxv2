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
  google: { label: "Google", value: "Google account", icon: GoogleIcon },
  wallet: { label: "Wallet", value: "Wallet", icon: Wallet },
  telegram: { label: "Telegram", value: "Telegram", icon: TelegramIcon },
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
  const isMobile = useIsMobile();
  const p = PROVIDER[provider];

  return (
    <SettingsCard label="Sign-in" value={p.value} compact={isMobile}>
      <SettingsRow icon={p.icon} title={p.label} sub={providerValue || undefined} subMono />
      <SettingsRow
        icon={Mail}
        title={
          <>
            Notification email
            {!notificationEmail && <SettingsCapsule>Not set</SettingsCapsule>}
          </>
        }
        sub={notificationEmail || "Needed for alerts and account recovery"}
        subMono={!!notificationEmail}
        right={
          <Button variant="outline" size="sm" className="h-8" onClick={onEditEmail}>
            {notificationEmail ? "Edit" : "Add"}
          </Button>
        }
        last
      />
      <SettingsNote>
        You signed in via <span className="font-medium text-primary">{p.label}</span>. This cannot be changed. To use a
        different account, sign out and sign in again.
      </SettingsNote>
    </SettingsCard>
  );
};
