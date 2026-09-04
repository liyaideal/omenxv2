/**
 * Login / Registration previews (2026-08-27 audit round).
 *
 * Truth Rule (§16.1.1): every case mounts the PRODUCTION component
 * (AuthContent / LiteAuthGate / GoogleAccountChooser) with
 * display-only fixture props. No hand-copied markup.
 *
 * Preview surface falls back to "lite" (see PreviewApp) — these are the Lite
 * faces of the auth layer.
 */
import { useState } from "react";
import { AuthContent } from "@/components/auth/AuthContent";
import { GoogleAccountChooser } from "@/components/auth/GoogleAccountChooser";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { Logo } from "@/components/Logo";
import type { AuthStep } from "@/hooks/useAuth";

type Fixture = React.ComponentProps<typeof AuthContent>["fixture"];

const noop = () => undefined;

/* ---------------- shells: the real dialog / drawer chrome ---------------- */

const DesktopShell = ({
  step,
  fixture,
  loading = false,
}: {
  step: AuthStep;
  fixture?: Fixture;
  loading?: boolean;
}) => {
  const [s, setS] = useState<AuthStep>(step);
  const [isLoading, setIsLoading] = useState(loading);
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border/50 bg-background overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="p-6">
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>
        <AuthContent
          step={s}
          setStep={setS}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          variant="desktop"
          fixture={fixture}
        />
      </div>
    </div>
  );
};

const MobileShell = ({ step, fixture }: { step: AuthStep; fixture?: Fixture }) => {
  const [s, setS] = useState<AuthStep>(step);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[375px] rounded-t-3xl border border-border bg-background px-5 pt-4 pb-6">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
      <div className="flex justify-center mb-4">
        <Logo size="lg" />
      </div>
      <AuthContent
        step={s}
        setStep={setS}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        variant="mobile"
        fixture={fixture}
      />
    </div>
  );
};

/* ---------------- AU-L · login step ---------------- */

export const AuthLoginGoogleDefaultPreview = () => <DesktopShell step="login" />;
export const AuthLoginWalletTabPreview = () => (
  <DesktopShell step="login" fixture={{ authMethod: "wallet" }} />
);
export const AuthLoginTelegramTabPreview = () => (
  <DesktopShell step="login" fixture={{ authMethod: "telegram" }} />
);
export const AuthLoginLoadingPreview = () => <DesktopShell step="login" loading />;
export const AuthLoginMobilePreview = () => <MobileShell step="login" />;

/* ---------------- AU-W · createWallet step ---------------- */

export const AuthCreateWalletDesktopPreview = () => <DesktopShell step="createWallet" />;
export const AuthCreateWalletMobilePreview = () => <MobileShell step="createWallet" />;

/* ---------------- AU-P · completeProfile step ---------------- */

export const AuthProfileDefaultPreview = () => <DesktopShell step="completeProfile" />;
export const AuthProfileEmailErrorPreview = () => (
  <DesktopShell
    step="completeProfile"
    fixture={{ emailError: "Please enter a valid email address" }}
  />
);
export const AuthProfileReferralOpenPreview = () => (
  <DesktopShell step="completeProfile" fixture={{ referralOpen: true }} />
);
export const AuthProfileReferralPrefilledPreview = () => (
  <DesktopShell
    step="completeProfile"
    fixture={{ referralOpen: true, referralCode: "ABCDEF" }}
  />
);
export const AuthProfileLoadingPreview = () => (
  <DesktopShell step="completeProfile" loading />
);
export const AuthProfileMobilePreview = () => <MobileShell step="completeProfile" />;

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
