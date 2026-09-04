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
