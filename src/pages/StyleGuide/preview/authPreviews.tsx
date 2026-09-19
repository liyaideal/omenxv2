/**
 * Login / Registration previews (2026-09-04 「半活体」根治轮).
 *
 * Truth Rule (§16.1.1): every case mounts the PRODUCTION chrome itself —
 * AuthDialog (desktop Dialog) / AuthSheet (mobile Drawer) / LiteAuthGate /
 * GoogleAccountChooser — with display-only fixture props. No hand-copied
 * shell markup. The only hand-written elements are zero-visual positioning
 * spacers (position + height only) that give Radix's `fixed inset-0` overlay
 * a measurable height inside the preview iframe.
 *
 * Preview surface falls back to "lite" (see PreviewApp) — these are the Lite
 * faces of the auth layer.
 */
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { GoogleAccountChooser } from "@/components/auth/GoogleAccountChooser";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { AccountSecurityCard } from "@/components/settings/AccountSecurityCard";
import { LinkedEmailAccountCard } from "@/components/settings/LinkedEmailAccountCard";
import { ResetPasswordContent, ResetPasswordShell } from "@/pages/ResetPassword";
import type { AuthStep } from "@/hooks/useAuth";

type PreviewFixture = React.ComponentProps<typeof AuthDialog>["previewFixture"];

const noop = () => undefined;

/* ---------------- production chrome mounts ---------------- */

const DesktopCase = ({ step = "login" as AuthStep, fixture }: { step?: AuthStep; fixture?: PreviewFixture }) => (
  <div className="relative" style={{ height: 720 }}>
    <AuthDialog open onOpenChange={noop} previewStep={step} previewFixture={fixture} />
  </div>
);

const MobileCase = ({ step = "login" as AuthStep, fixture }: { step?: AuthStep; fixture?: PreviewFixture }) => (
  <div className="relative" style={{ height: 812 }}>
    <AuthSheet open onOpenChange={noop} previewStep={step} previewFixture={fixture} />
  </div>
);

/* ---------------- AU-L · login step ---------------- */

export const AuthLoginGoogleDefaultPreview = () => <DesktopCase step="login" />;
export const AuthLoginWalletTabPreview = () => (
  <DesktopCase step="login" fixture={{ authMethod: "wallet" }} />
);
export const AuthLoginTelegramTabPreview = () => (
  <DesktopCase step="login" fixture={{ authMethod: "telegram" }} />
);
export const AuthLoginLoadingPreview = () => (
  <DesktopCase step="login" fixture={{ isLoading: true }} />
);
export const AuthLoginMobilePreview = () => <MobileCase step="login" />;

/* ---------------- AU-W · createWallet step ---------------- */

export const AuthCreateWalletDesktopPreview = () => <DesktopCase step="createWallet" />;
export const AuthCreateWalletMobilePreview = () => <MobileCase step="createWallet" />;

/* ---------------- AU-P · completeProfile step ---------------- */

export const AuthProfileDefaultPreview = () => <DesktopCase step="completeProfile" />;
export const AuthProfileEmailErrorPreview = () => (
  <DesktopCase
    step="completeProfile"
    fixture={{ emailError: "Please enter a valid email address" }}
  />
);
export const AuthProfileReferralOpenPreview = () => (
  <DesktopCase step="completeProfile" fixture={{ referralOpen: true }} />
);
export const AuthProfileReferralPrefilledPreview = () => (
  <DesktopCase
    step="completeProfile"
    fixture={{ referralOpen: true, referralCode: "ABCDEF" }}
  />
);
export const AuthProfileLoadingPreview = () => (
  <DesktopCase step="completeProfile" fixture={{ isLoading: true }} />
);
export const AuthProfileMobilePreview = () => <MobileCase step="completeProfile" />;

/* ---------------- AU-G · auth gates ---------------- */

const GateUnderlay = () => (
  <div className="space-y-3 p-4">
    <div className="h-24 rounded-[18px] border border-border bg-card" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-28 rounded-xl border border-border bg-card" />
      <div className="h-28 rounded-xl border border-border bg-card" />
    </div>
  </div>
);

export const AuthGateLiteWalletPreview = () => (
  <LiteAuthGate
    forceSignedOut
    title="Sign in to view your wallet"
    description="Deposit, withdraw and move funds between your accounts by signing in."
  >
    <GateUnderlay />
  </LiteAuthGate>
);

export const AuthGateLitePortfolioPreview = () => (
  <LiteAuthGate forceSignedOut>
    <GateUnderlay />
  </LiteAuthGate>
);

export const AuthGateLiteSignedInPreview = () => (
  <LiteAuthGate forceSignedIn>
    <GateUnderlay />
  </LiteAuthGate>
);

/* ---------------- AU-D · Google account chooser ---------------- */

export const AuthGoogleChooserPreview = () => (
  <div className="min-h-[460px]">
    <GoogleAccountChooser
      open
      previewOnly
      onOpenChange={noop}
      onFixedAccountSignedIn={noop}
      onUseAnotherAccount={noop}
    />
  </div>
);

/* ---------------- AU-E · email step ("Other email" under the Google tab, 2026-09-19) ---------------- */

const DEMO_EMAIL = "zhang.wei@163.com";

export const AuthEmailSignInPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "signin", email: DEMO_EMAIL } }} />
);
export const AuthEmailSignInErrorPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "signin", email: DEMO_EMAIL, error: "invalid_credentials" } }} />
);
export const AuthEmailSignUpPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "signup", email: DEMO_EMAIL } }} />
);
export const AuthEmailSignUpExistsPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "signup", email: DEMO_EMAIL, error: "email_exists" } }} />
);
export const AuthEmailSignUpShortPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "signup", email: DEMO_EMAIL, error: "weak_password" } }} />
);
export const AuthEmailVerifyPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "verify", email: DEMO_EMAIL, cooldown: 42 } }} />
);
export const AuthEmailVerifyErrorPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "verify", email: DEMO_EMAIL, error: "incorrect_code" } }} />
);
export const AuthEmailForgotPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "forgot", email: DEMO_EMAIL } }} />
);
export const AuthEmailSentPreview = () => (
  <DesktopCase step="email" fixture={{ emailPanel: { mode: "sent", email: DEMO_EMAIL } }} />
);
export const AuthEmailSignInMobilePreview = () => (
  <MobileCase step="email" fixture={{ emailPanel: { mode: "signin", email: DEMO_EMAIL } }} />
);
export const AuthEmailVerifyMobilePreview = () => (
  <MobileCase step="email" fixture={{ emailPanel: { mode: "verify", email: DEMO_EMAIL, cooldown: 42 } }} />
);

/* ---------------- AU-R · /reset-password (link landing) ---------------- */

const ResetCase = ({
  variant,
  state,
  error,
}: {
  variant: "desktop" | "mobile";
  state: "form" | "success" | "expired";
  error?: "short" | "mismatch";
}) => (
  <ResetPasswordShell variant={variant}>
    <ResetPasswordContent variant={variant} fixtureState={state} fixtureError={error} fixtureEmail={DEMO_EMAIL} />
  </ResetPasswordShell>
);

export const AuthResetFormPreview = () => <ResetCase variant="desktop" state="form" />;
export const AuthResetMismatchPreview = () => <ResetCase variant="desktop" state="form" error="mismatch" />;
export const AuthResetShortPreview = () => <ResetCase variant="desktop" state="form" error="short" />;
export const AuthResetSuccessPreview = () => <ResetCase variant="desktop" state="success" />;
export const AuthResetExpiredPreview = () => <ResetCase variant="desktop" state="expired" />;
export const AuthResetFormMobilePreview = () => <ResetCase variant="mobile" state="form" />;

/* ---------------- AU-S · Settings › Account security · Password row ---------------- */

export const SettingsSecurityEmailDefaultPreview = () => (
  <div className="p-4">
    <AccountSecurityCard previewEmailUser />
  </div>
);
export const SettingsSecurityEmailSentPreview = () => (
  <div className="p-4">
    <AccountSecurityCard previewEmailUser previewSentSeconds={42} />
  </div>
);

/* ---------------- AU-S3…S8 · Settings › Linked Account · change login email ---------------- */

const LINKED_FIXTURE = { previewEmail: "liya@omenx.com", previewNewEmail: "liya.new@omenx.com" } as const;

export const SettingsLinkedEmailDefaultPreview = () => (
  <div className="p-4">
    <LinkedEmailAccountCard previewState="default" {...LINKED_FIXTURE} />
  </div>
);
export const SettingsLinkedEmailPendingPreview = () => (
  <div className="p-4">
    <LinkedEmailAccountCard previewState="pending" {...LINKED_FIXTURE} />
  </div>
);
export const SettingsLinkedEmailCooldownPreview = () => (
  <div className="p-4">
    <LinkedEmailAccountCard previewState="cooldown" {...LINKED_FIXTURE} />
  </div>
);
export const SettingsChangeEmailInputPreview = () => (
  <div className="p-4">
    <LinkedEmailAccountCard previewState="default" previewDialog="input" previewEmail={LINKED_FIXTURE.previewEmail} />
  </div>
);
export const SettingsChangeEmailErrorPreview = () => (
  <div className="p-4">
    <LinkedEmailAccountCard previewState="default" previewDialog="error" previewEmail={LINKED_FIXTURE.previewEmail} previewNewEmail="mia@omenx.dev" />
  </div>
);
export const SettingsChangeEmailSentPreview = () => (
  <div className="p-4">
    <LinkedEmailAccountCard previewState="default" previewDialog="sent" {...LINKED_FIXTURE} />
  </div>
);
