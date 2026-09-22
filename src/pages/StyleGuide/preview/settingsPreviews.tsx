/**
 * Settings previews (2026-09-22 Lite reskin, mock v5).
 *
 * Truth Rule (§16.1.1): every case mounts the PRODUCTION component with
 * display-only fixture props (`preview*`). The only hand-written elements are
 * spacing wrappers (padding / max-width utilities) and, for dialog cases, a
 * position + height spacer so Radix's `fixed inset-0` overlay has a measurable
 * box inside the preview iframe. No hand-copied card markup.
 *
 * Preview surface falls back to "lite" (see PreviewApp). Mobile cases render
 * inside the 375-wide frame, where `useIsMobile()` is true and the components
 * switch to their compact / drawer forms on their own.
 */
import { ErrorState, LoadingState } from "@/components/states";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { ProfileHero } from "@/components/settings/ProfileHero";
import { ProviderSignInCard } from "@/components/settings/ProviderSignInCard";
import { AccountSecurityCard } from "@/components/settings/AccountSecurityCard";
import { WithdrawalVerificationCard } from "@/components/settings/WithdrawalVerificationCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { PreferencesCard } from "@/components/settings/PreferencesCard";
import { SessionsCard } from "@/components/settings/SessionsCard";
import { AccountCard } from "@/components/settings/AccountCard";
import { MoreCard } from "@/components/settings/MoreCard";
import { SETTINGS_GATE_COPY } from "@/pages/Settings";

const noop = () => undefined;

const Pad = ({ children, wide }: { children: React.ReactNode; wide?: boolean }) => (
  <div className={wide ? "p-6" : "p-6 max-w-2xl"}>{children}</div>
);

const DialogBox = ({ children }: { children: React.ReactNode }) => (
  <div className="relative" style={{ height: 420 }}>
    {children}
  </div>
);

/* ---------------- page states ---------------- */

const GateUnderlay = () => (
  <div className="p-6 space-y-6">
    <ProfileHero
      username="Flintpainter_Arrow"
      avatarUrl={null}
      fallbackInitial="F"
      userId="2ab853"
      joinDate="09-22-2026"
      onEditUsername={noop}
      onChangeAvatar={noop}
    />
    <AccountSecurityCard previewEmailUser />
  </div>
);

export const SettingsPageGuestPreview = () => (
  <LiteAuthGate title={SETTINGS_GATE_COPY.title} description={SETTINGS_GATE_COPY.description} forceSignedOut>
    <GateUnderlay />
  </LiteAuthGate>
);

export const SettingsPageLoadingPreview = () => (
  <div style={{ height: 320 }}>
    <LoadingState label="Loading profile…" />
  </div>
);

export const SettingsPageErrorPreview = () => (
  <Pad wide>
    <ErrorState
      title={SETTINGS_GATE_COPY.errorTitle}
      description={SETTINGS_GATE_COPY.errorDescription}
      retryLabel={SETTINGS_GATE_COPY.errorRetry}
      onRetry={noop}
    />
  </Pad>
);

/* ---------------- hero ---------------- */

export const SettingsHeroDefaultPreview = () => (
  <Pad wide>
    <ProfileHero
      username="Flintpainter_Arrow"
      avatarUrl="https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=felix&backgroundColor=b6e3f4"
      fallbackInitial="F"
      userId="2ab853"
      joinDate="09-22-2026"
      onEditUsername={noop}
      onChangeAvatar={noop}
    />
  </Pad>
);

export const SettingsHeroUnsetPreview = () => (
  <Pad wide>
    <ProfileHero
      username={null}
      avatarUrl={null}
      fallbackInitial="q"
      userId="2ab853"
      joinDate="09-22-2026"
      onEditUsername={noop}
      onChangeAvatar={noop}
    />
  </Pad>
);

export const SettingsHeroMobilePreview = () => (
  <div className="p-4">
    <ProfileHero
      username="Flintpainter_Arrow"
      avatarUrl="https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=felix&backgroundColor=b6e3f4"
      fallbackInitial="F"
      userId="2ab853"
      joinDate="09-22-2026"
      onEditUsername={noop}
      onChangeAvatar={noop}
      compact
    />
  </div>
);

/* ---------------- Sign-in · provider accounts ---------------- */

export const SettingsSignInGooglePreview = () => (
  <Pad>
    <ProviderSignInCard provider="google" providerValue="mia@omenx.dev" notificationEmail="mia@omenx.dev" onEditEmail={noop} />
  </Pad>
);

export const SettingsSignInWalletPreview = () => (
  <Pad>
    <ProviderSignInCard provider="wallet" notificationEmail={null} onEditEmail={noop} />
  </Pad>
);

export const SettingsSignInTelegramPreview = () => (
  <Pad>
    <ProviderSignInCard provider="telegram" notificationEmail="mia@omenx.dev" onEditEmail={noop} />
  </Pad>
);

/* ---------------- Account security ---------------- */

export const SettingsSecurityTotpEnabledPreview = () => (
  <Pad>
    <AccountSecurityCard previewEmailUser previewTotpEnabled />
  </Pad>
);

/* ---------------- Withdrawal verification ---------------- */

export const SettingsWithdrawalDefaultPreview = () => (
  <Pad>
    <WithdrawalVerificationCard previewState="default" />
  </Pad>
);

export const SettingsWithdrawalAllEnabledPreview = () => (
  <Pad>
    <WithdrawalVerificationCard previewState="all-enabled" />
  </Pad>
);

export const SettingsWithdrawalNothingPreview = () => (
  <Pad>
    <WithdrawalVerificationCard previewState="nothing" />
  </Pad>
);

/* ---------------- Notifications ---------------- */

export const SettingsNotificationsDefaultPreview = () => (
  <Pad>
    <NotificationsCard onAddEmail={noop} previewState="default" previewEmail="qa-vis-1@omenx.dev" />
  </Pad>
);

export const SettingsNotificationsSomeOffPreview = () => (
  <Pad>
    <NotificationsCard onAddEmail={noop} previewState="some-off" previewEmail="qa-vis-1@omenx.dev" />
  </Pad>
);

export const SettingsNotificationsNoEmailPreview = () => (
  <Pad>
    <NotificationsCard onAddEmail={noop} previewState="no-email" />
  </Pad>
);

/* ---------------- Preferences ---------------- */

export const SettingsPreferencesDefaultPreview = () => (
  <Pad>
    <PreferencesCard previewCode="en" />
  </Pad>
);

export const SettingsPreferencesOpenPreview = () => (
  <div className="p-6 max-w-2xl" style={{ minHeight: 420 }}>
    <PreferencesCard previewCode="en" previewOpen />
  </div>
);

/* ---------------- Sessions ---------------- */

export const SettingsSessionsManyPreview = () => (
  <Pad>
    <SessionsCard previewState="many" />
  </Pad>
);

export const SettingsSessionsSinglePreview = () => (
  <Pad>
    <SessionsCard previewState="single" />
  </Pad>
);

export const SettingsSessionsLoadingPreview = () => (
  <Pad>
    <SessionsCard previewState="loading" />
  </Pad>
);

export const SettingsSessionsErrorPreview = () => (
  <Pad>
    <SessionsCard previewState="error" />
  </Pad>
);

export const SettingsSessionsUnknownPreview = () => (
  <Pad>
    <SessionsCard previewState="unknown" />
  </Pad>
);

/* ---------------- Account ---------------- */

export const SettingsAccountDefaultPreview = () => (
  <Pad>
    <AccountCard previewState="default" />
  </Pad>
);

export const SettingsAccountBlockedPreview = () => (
  <DialogBox>
    <AccountCard previewState="blocked" previewBalance={326.8} />
  </DialogBox>
);

export const SettingsAccountConfirmPreview = () => (
  <DialogBox>
    <AccountCard previewState="confirm" previewBalance={0} />
  </DialogBox>
);

/* ---------------- More ---------------- */

export const SettingsMorePreview = () => (
  <Pad>
    <MoreCard />
  </Pad>
);
