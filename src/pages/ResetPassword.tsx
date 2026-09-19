import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/MobileHeader";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/states";
import { EMAIL_AUTH_COPY, isValidPassword, updatePassword } from "@/lib/emailAuth";

/**
 * /reset-password — landing page for the password reset link (CPO 2026-09-19).
 * Reached from "Forgot password?" in the sign-in dialog AND from
 * Settings › Account security › Password › Change: one flow for both.
 *
 * Supabase puts a recovery session in place when the link is opened
 * (`detectSessionInUrl`); we wait for it, then `updateUser({ password })`.
 *
 * States (style-guide AU-R*): loading → form | expired ; form → success.
 * Desktop: the auth-dialog shell rendered inline, centred. Mobile: full-bleed.
 */

export type ResetPasswordState = "loading" | "form" | "success" | "expired";

const INPUT_CLASS =
  "w-full h-[48px] rounded-[12px] bg-[#14161A] border border-[#23262D] px-4 pr-11 text-[14px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#33D6FF] transition-colors";
const INPUT_ERROR_CLASS = "border-trading-red focus:border-trading-red";
const GHOST_BUTTON_CLASS =
  "w-full h-[44px] rounded-[12px] border-[1.5px] border-[#1C1F26] bg-transparent text-[13px] text-white/80 transition-colors hover:text-white inline-flex items-center justify-center gap-2";

const PasswordField = ({
  id,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT_CLASS, error && INPUT_ERROR_CLASS)}
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

/** How long we wait for the recovery session before calling the link expired. */
const RECOVERY_WAIT_MS = 4000;

export const ResetPasswordContent = ({
  fixtureState,
  fixtureError,
  fixtureEmail,
  variant,
}: {
  /** Style-guide only. Never set in product. */
  fixtureState?: ResetPasswordState;
  /** Style-guide only: "short" | "mismatch". */
  fixtureError?: "short" | "mismatch";
  fixtureEmail?: string;
  variant: "desktop" | "mobile";
}) => {
  const navigate = useNavigate();
  const previewOnly = fixtureState !== undefined;
  const [state, setState] = useState<ResetPasswordState>(fixtureState ?? "loading");
  const [email, setEmail] = useState<string>(fixtureEmail ?? "");
  const [password, setPassword] = useState(fixtureError ? (fixtureError === "short" ? "short1" : "longenough1") : "");
  const [confirm, setConfirm] = useState(fixtureError === "mismatch" ? "longenough2" : fixtureError === "short" ? "short1" : "");
  const [passwordError, setPasswordError] = useState(fixtureError === "short" ? EMAIL_AUTH_COPY.weak_password : "");
  const [confirmError, setConfirmError] = useState(fixtureError === "mismatch" ? EMAIL_AUTH_COPY.passwords_mismatch : "");
  const [saving, setSaving] = useState(false);

  // Wait for the recovery session (or an already-signed-in user).
  useEffect(() => {
    if (previewOnly) return;
    let done = false;
    const accept = (mail: string | null | undefined) => {
      if (done) return;
      done = true;
      setEmail(mail ?? "");
      setState("form");
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        accept(session.user.email);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) accept(data.session.user.email);
    });
    const timer = window.setTimeout(() => {
      if (!done) {
        done = true;
        setState("expired");
      }
    }, RECOVERY_WAIT_MS);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [previewOnly]);

  const handleUpdate = async () => {
    if (previewOnly) return;
    let ok = true;
    if (!isValidPassword(password)) {
      setPasswordError(EMAIL_AUTH_COPY.weak_password);
      ok = false;
    } else {
      setPasswordError("");
    }
    if (confirm !== password) {
      setConfirmError(EMAIL_AUTH_COPY.passwords_mismatch);
      ok = false;
    } else {
      setConfirmError("");
    }
    if (!ok) return;
    setSaving(true);
    const res = await updatePassword(password);
    setSaving(false);
    if (res.ok === false) {
      setPasswordError(res.message);
      return;
    }
    setState("success");
  };

  const containerClass = variant === "mobile" ? "space-y-5" : "space-y-6";

  if (state === "loading") {
    return <LoadingState label="Checking your reset link…" />;
  }

  if (state === "expired") {
    return (
      <div className={containerClass}>
        <div className="text-center space-y-1">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-foreground">This link has expired</h2>
          <p className="text-[13px] text-muted-foreground leading-snug">
            Reset links work once and expire after 1 hour. Request a new one from{" "}
            <span className="text-white">Forgot password?</span> in the sign-in dialog, or from Settings › Account
            security.
          </p>
        </div>
        <button type="button" onClick={() => navigate("/events")} className={GHOST_BUTTON_CLASS}>
          Back to markets
        </button>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className={containerClass}>
        <div className="text-center space-y-1">
          <span className="inline-flex w-10 h-10 rounded-full bg-[rgba(207,255,74,0.1)] border border-[rgba(207,255,74,0.3)] text-[#CFFF4A] items-center justify-center mb-2">
            <Check className="w-5 h-5" strokeWidth={2.5} />
          </span>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-foreground">Password updated</h2>
          <p className="text-[13px] text-muted-foreground leading-snug">You're signed in. Use your new password next time.</p>
        </div>
        <Button onClick={() => navigate("/events")} className="w-full h-[48px] btn-primary text-[14px]">
          Go to markets
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="text-center space-y-1">
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-foreground">Set a new password</h2>
        {email && (
          <p className="text-[13px] text-muted-foreground leading-snug">
            for <span className="text-white">{email}</span>
          </p>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <PasswordField
            id="reset-password"
            placeholder="New password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (passwordError) setPasswordError("");
            }}
            error={!!passwordError}
          />
          {passwordError ? (
            <p className="text-[12px] text-trading-red mt-1.5">{passwordError}</p>
          ) : (
            <p className="text-[12px] text-[#6B7280] mt-1.5">At least 8 characters</p>
          )}
        </div>
        <div>
          <PasswordField
            id="reset-password-confirm"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              if (confirmError) setConfirmError("");
            }}
            error={!!confirmError}
          />
          {confirmError && <p className="text-[12px] text-trading-red mt-1.5">{confirmError}</p>}
        </div>
      </div>
      <Button onClick={handleUpdate} disabled={saving} className="w-full h-[48px] btn-primary text-[14px]">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
      </Button>
    </div>
  );
};

/** Page shell: auth-dialog skin inline. Desktop centred card, mobile full-bleed. */
export const ResetPasswordShell = ({
  variant,
  children,
}: {
  variant: "desktop" | "mobile";
  children: React.ReactNode;
}) => {
  if (variant === "mobile") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MobileHeader title="Reset password" showLogo={false} showBack={false} />
        <div className="px-4 py-6">
          <div className="flex justify-center mb-3">
            <Logo size="modal" />
          </div>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[16px] border border-[#23262D] bg-gradient-to-b from-[#012A35] from-[12.85%] via-[#0A0B0D] via-[21%] to-[#0A0B0D] p-[24px]">
        <div className="flex justify-center mb-3">
          <Logo size="modal" />
        </div>
        {children}
      </div>
    </div>
  );
};

const ResetPassword = () => {
  const isMobile = useIsMobile();
  const variant = isMobile ? "mobile" : "desktop";
  return (
    <ResetPasswordShell variant={variant}>
      <ResetPasswordContent variant={variant} />
    </ResetPasswordShell>
  );
};

export default ResetPassword;
