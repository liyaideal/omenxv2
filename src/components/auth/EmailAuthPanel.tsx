import { useEffect, useRef, useState } from "react";
import { OTPInput, type SlotProps } from "input-otp";
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/useUserProfile";
import { upsertStarterProfile } from "@/lib/starterProfile";
import {
  DEMO_VERIFY_CODE,
  EMAIL_AUTH_COPY,
  RESEND_COOLDOWN_SECONDS,
  isValidEmail,
  isValidPassword,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/emailAuth";

/**
 * "Other email" wizard step (CPO 2026-09-19) — lives inside AuthDialog /
 * AuthSheet as `step === "email"`, after the Google tab's "Other email" button.
 *
 * Uses the existing wizard-step grammar from createWallet / completeProfile:
 * top-left "← Back", centred 20px display title + 13px muted subtitle.
 * No lynx, no method tabs on this step.
 *
 * Modes (all enumerated in /style-guide AU-E*):
 *   signin  → existing user; success closes the dialog (no onboarding)
 *   signup  → collects email + password, then `verify`
 *   verify  → 6-digit code (blueprint: fixed DEMO_VERIFY_CODE); account is
 *             created only after the code passes; success → createWallet step
 *   forgot  → sends reset link → `sent`
 *   sent    → confirmation, back to sign in
 */

export type EmailAuthMode = "signin" | "signup" | "verify" | "forgot" | "sent";
export type EmailAuthFixtureError = "invalid_credentials" | "email_exists" | "weak_password" | "incorrect_code";

export interface EmailAuthFixture {
  mode?: EmailAuthMode;
  email?: string;
  error?: EmailAuthFixtureError;
  /** Seconds left on the resend cooldown (verify mode). */
  cooldown?: number;
}

interface EmailAuthPanelProps {
  variant?: "desktop" | "mobile";
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  /** Leave the email step (back to the login step). */
  onBack: () => void;
  /** Existing user signed in → parent closes the dialog. */
  onSignedIn: () => void;
  /** New account created → parent continues to createWallet. */
  onSignedUp: () => void;
  /** Style-guide only: seeds internal UI state and disables network calls. Never passed in production. */
  fixture?: EmailAuthFixture;
}

/* ---------- literal skin (Lite) ---------- */
/** Exported so Settings › Change email (same Lite field) stays literally identical. */
export const INPUT_CLASS =
  "w-full h-[48px] rounded-[12px] bg-[#14161A] border border-[#23262D] px-4 text-[14px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#33D6FF] transition-colors";
export const INPUT_ERROR_CLASS = "border-trading-red focus:border-trading-red";
const HINT_CLASS = "text-[12px] text-[#6B7280] mt-1.5";
export const ERROR_CLASS = "text-[12px] text-trading-red mt-1.5";
const LINK_CLASS = "text-[#33D6FF] hover:underline cursor-pointer";
const FOOT_CLASS = "text-[12px] text-[#9CA2AB] text-center";
/** Exported so Settings › Close account dialogs (Connect-modal Cancel) stay literally identical. */
export const GHOST_BUTTON_CLASS =
  "w-full h-[44px] rounded-[12px] border-[1.5px] border-[#1C1F26] bg-transparent text-[13px] text-white/80 transition-colors hover:text-white inline-flex items-center justify-center gap-2";

const Slot = ({ char, isActive, hasFakeCaret, error }: SlotProps & { error: boolean }) => (
  <div
    className={`relative w-12 h-12 rounded-[12px] bg-[#14161A] border flex items-center justify-center font-display text-[20px] font-medium text-white transition-colors ${
      error ? "border-trading-red" : isActive ? "border-[#33D6FF]" : "border-[#23262D]"
    }`}
  >
    {char}
    {hasFakeCaret && (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="animate-caret-blink h-5 w-px bg-white duration-1000" />
      </div>
    )}
  </div>
);

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: boolean;
  autoComplete: string;
  id: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT_CLASS, "pr-11", error && INPUT_ERROR_CLASS)}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA2AB] hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

const Terms = () => (
  <p className={FOOT_CLASS}>
    By continuing, you agree to our <span className={LINK_CLASS}>Terms of Service</span> and{" "}
    <span className={LINK_CLASS}>Privacy Policy</span>
  </p>
);

export const EmailAuthPanel = ({
  variant = "desktop",
  isLoading,
  setIsLoading,
  onBack,
  onSignedIn,
  onSignedUp,
  fixture,
}: EmailAuthPanelProps) => {
  const queryClient = useQueryClient();
  const previewOnly = !!fixture;
  const isMobile = variant === "mobile";
  const containerClass = isMobile ? "space-y-5" : "space-y-6";

  const [mode, setMode] = useState<EmailAuthMode>(fixture?.mode ?? "signin");
  const [email, setEmail] = useState(fixture?.email ?? "");
  const [password, setPassword] = useState(
    fixture?.error === "invalid_credentials" ? "wrong-password" : fixture?.error === "weak_password" ? "short1" : "",
  );
  const [code, setCode] = useState(fixture?.error === "incorrect_code" ? "123456" : "");
  const [emailError, setEmailError] = useState<string>(
    fixture?.error === "email_exists" ? EMAIL_AUTH_COPY.email_exists : "",
  );
  const [passwordError, setPasswordError] = useState<string>(
    fixture?.error === "invalid_credentials"
      ? EMAIL_AUTH_COPY.invalid_credentials
      : fixture?.error === "weak_password"
        ? EMAIL_AUTH_COPY.weak_password
        : "",
  );
  const [codeError, setCodeError] = useState<string>(
    fixture?.error === "incorrect_code" ? EMAIL_AUTH_COPY.incorrect_code : "",
  );
  const [cooldown, setCooldown] = useState<number>(fixture?.cooldown ?? 0);
  const cooldownTimer = useRef<number | null>(null);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0 || previewOnly) return;
    cooldownTimer.current = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => {
      if (cooldownTimer.current) window.clearTimeout(cooldownTimer.current);
    };
  }, [cooldown, previewOnly]);

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setCodeError("");
  };

  const go = (next: EmailAuthMode) => {
    clearErrors();
    if (next !== "verify") setCode("");
    // Never carry a typed password across sign-in / create / reset forms.
    if (next === "signin" || next === "signup" || next === "forgot") setPassword("");
    setMode(next);
  };

  const validateEmailField = (): boolean => {
    if (!isValidEmail(email)) {
      setEmailError(EMAIL_AUTH_COPY.invalid_email);
      return false;
    }
    setEmailError("");
    return true;
  };

  /* ---------- actions ---------- */

  const handleSignIn = async () => {
    if (previewOnly) return toast.message("Preview: would sign in");
    if (!validateEmailField()) return;
    if (!password) {
      setPasswordError(EMAIL_AUTH_COPY.invalid_credentials);
      return;
    }
    setIsLoading(true);
    try {
      const res = await signInWithEmail(email, password);
      if (res.ok === false) {
        if (res.code === "invalid_credentials") {
          setEmailError(" ");
          setPasswordError(res.message);
        } else {
          toast.error(res.message);
        }
        return;
      }
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success("Welcome back!");
      onSignedIn();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpContinue = () => {
    if (previewOnly) return toast.message("Preview: would send code");
    const emailOk = validateEmailField();
    if (!isValidPassword(password)) {
      setPasswordError(EMAIL_AUTH_COPY.weak_password);
      if (!emailOk) return;
      return;
    }
    setPasswordError("");
    if (!emailOk) return;
    // Blueprint: no real code is sent. See DEMO_VERIFY_CODE.
    setCooldown(RESEND_COOLDOWN_SECONDS);
    go("verify");
  };

  const handleVerify = async () => {
    if (previewOnly) return toast.message("Preview: would verify");
    if (code.length !== 6) {
      setCodeError(EMAIL_AUTH_COPY.incorrect_code);
      return;
    }
    if (code !== DEMO_VERIFY_CODE) {
      setCodeError(EMAIL_AUTH_COPY.incorrect_code);
      return;
    }
    setIsLoading(true);
    try {
      const res = await signUpWithEmail(email, password);
      if (res.ok === false) {
        if (res.code === "email_exists") {
          // Production checks this before sending the code; the blueprint can only learn it here.
          setMode("signup");
          setCode("");
          setEmailError(res.message);
          return;
        }
        if (res.code === "weak_password" || res.code === "pwned_password") {
          // Supabase's password policy (incl. leaked-password check) runs at sign-up,
          // i.e. after the code step in the blueprint. Send the user back to the form.
          setMode("signup");
          setCode("");
          setPasswordError(res.message);
          return;
        }
        toast.error(res.message);
        return;
      }
      const profile = await upsertStarterProfile(res.data.userId, "email", email.trim());
      if (profile.error) console.error("Profile upsert error:", profile.error);
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success("Email verified — welcome to OMENX!");
      onSignedUp();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (previewOnly) return toast.message("Preview: would resend code");
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success(`Code sent to ${email.trim()}`);
  };

  const handleSendReset = async () => {
    if (previewOnly) return toast.message("Preview: would send reset link");
    if (!validateEmailField()) return;
    setIsLoading(true);
    try {
      const res = await sendPasswordReset(email);
      if (res.ok === false) {
        toast.error(res.message);
        return;
      }
      go("sent");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- chrome ---------- */

  const renderBack = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );

  const renderTitle = (title: string, sub: React.ReactNode) => (
    <div className="text-center space-y-1">
      <h2 className="font-display text-[20px] font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-[13px] text-muted-foreground leading-snug">{sub}</p>
    </div>
  );

  const renderPrimary = (label: string, onClick: () => void) => (
    <Button onClick={onClick} disabled={isLoading} className="w-full h-[48px] btn-primary text-[14px]">
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
    </Button>
  );

  // Render function (not a nested component) so the input keeps focus across re-renders.
  const renderEmailField = (autoFocus?: boolean) => (
    <div>
      <input
        id="auth-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus={autoFocus}
        placeholder="Email address"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError("");
        }}
        className={cn(INPUT_CLASS, !!emailError && INPUT_ERROR_CLASS)}
      />
      {emailError.trim() && (
        <p className={ERROR_CLASS}>
          {emailError}
          {emailError === EMAIL_AUTH_COPY.email_exists && (
            <>
              {" "}
              <button type="button" onClick={() => go("signin")} className={LINK_CLASS}>
                Sign in
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );

  /* ---------- modes ---------- */

  if (mode === "signin") {
    return (
      <div className={containerClass}>
        {renderBack(onBack)}
        {renderTitle("Sign in with email", "Use the email and password you registered with.")}
        <div className="space-y-3">
          {renderEmailField(true)}
          <div>
            <PasswordInput
              id="auth-password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (passwordError) {
                  setPasswordError("");
                  setEmailError("");
                }
              }}
              error={!!passwordError}
            />
            {passwordError && <p className={ERROR_CLASS}>{passwordError}</p>}
          </div>
          <div className="flex justify-end pt-1">
            <button type="button" onClick={() => go("forgot")} className={`text-[12px] ${LINK_CLASS}`}>
              Forgot password?
            </button>
          </div>
        </div>
        {renderPrimary("Sign in", handleSignIn)}
        <p className={FOOT_CLASS}>
          New to OMENX?{" "}
          <button type="button" onClick={() => go("signup")} className={LINK_CLASS}>
            Create account
          </button>
        </p>
        <Terms />
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <div className={containerClass}>
        {renderBack(onBack)}
        {renderTitle("Create your account", "We'll send a 6-digit code to verify your email.")}
        <div className="space-y-3">
          {renderEmailField(true)}
          <div>
            <PasswordInput
              id="auth-new-password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError("");
              }}
              error={!!passwordError}
            />
            {passwordError ? <p className={ERROR_CLASS}>{passwordError}</p> : <p className={HINT_CLASS}>At least 8 characters</p>}
          </div>
        </div>
        {renderPrimary("Continue", handleSignUpContinue)}
        <p className={FOOT_CLASS}>
          Already have an account?{" "}
          <button type="button" onClick={() => go("signin")} className={LINK_CLASS}>
            Sign in
          </button>
        </p>
        <Terms />
      </div>
    );
  }

  if (mode === "verify") {
    return (
      <div className={containerClass}>
        {renderBack(() => go("signup"))}
        {renderTitle(
          "Verify your email",
          <>
            Enter the 6-digit code we sent to <span className="text-white">{email.trim()}</span>
          </>,
        )}
        <div>
          <OTPInput
            maxLength={6}
            value={code}
            autoFocus
            inputMode="numeric"
            pattern="^[0-9]*$"
            onChange={(v) => {
              setCode(v);
              if (codeError) setCodeError("");
            }}
            onComplete={() => undefined}
            containerClassName="flex justify-center gap-2"
            render={({ slots }) => (
              <>
                {slots.map((slot, i) => (
                  <Slot key={i} {...slot} error={!!codeError} />
                ))}
              </>
            )}
          />
          {codeError && <p className={`${ERROR_CLASS} text-center`}>{codeError}</p>}
        </div>
        {renderPrimary("Verify & create account", handleVerify)}
        <p className={FOOT_CLASS}>
          Didn't get it?{" "}
          {cooldown > 0 ? (
            <span className="text-[#6B7280]">Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={handleResend} className={LINK_CLASS}>
              Resend code
            </button>
          )}
        </p>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className={containerClass}>
        {renderBack(() => go("signin"))}
        {renderTitle("Reset your password", "We'll email you a link to set a new password.")}
        {renderEmailField(true)}
        {renderPrimary("Send reset link", handleSendReset)}
      </div>
    );
  }

  // sent
  return (
    <div className={containerClass}>
      {renderBack(() => go("signin"))}
      <div className="text-center space-y-1">
        <span className="inline-flex w-10 h-10 rounded-full bg-[rgba(207,255,74,0.1)] border border-[rgba(207,255,74,0.3)] text-[#CFFF4A] items-center justify-center mb-2">
          <Check className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-foreground">Check your inbox</h2>
        <p className="text-[13px] text-muted-foreground leading-snug">
          If an account exists for <span className="text-white">{email.trim()}</span>, we've sent a link to reset your
          password.
        </p>
      </div>
      <button type="button" onClick={() => go("signin")} className={GHOST_BUTTON_CLASS}>
        Back to sign in
      </button>
    </div>
  );
};

export default EmailAuthPanel;
