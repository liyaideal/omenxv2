import { supabase } from "@/integrations/supabase/client";

/**
 * Email + password sign-in helpers (CPO 2026-09-19, "Other email" under the
 * Google tab). Thin wrappers over Supabase auth that translate raw provider
 * errors into the fixed user-facing copy in copy-dictionary § Auth · Email.
 *
 * 🔴 Blueprint note for the real platform: sign-up verification here accepts
 * the fixed demo code (DEMO_VERIFY_CODE) instead of a real OTP email, and
 * the account is created only AFTER the code passes. Production must send a
 * real code and must check "email already registered" BEFORE sending it.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const RESEND_COOLDOWN_SECONDS = 60;
/** Demo-only verification code. Never rendered in UI. */
export const DEMO_VERIFY_CODE = "111111";

export type EmailAuthErrorCode =
  | "invalid_credentials"
  | "email_exists"
  | "weak_password"
  | "invalid_email"
  | "rate_limited"
  | "unknown";

export interface EmailAuthFailure {
  ok: false;
  code: EmailAuthErrorCode;
  /** Fixed user-facing sentence (see copy-dictionary). */
  message: string;
}
export type EmailAuthResult<T = undefined> = { ok: true; data: T } | EmailAuthFailure;

/** copy-dictionary § Auth · Email — error sentences */
export const EMAIL_AUTH_COPY = {
  invalid_credentials: "Email or password is incorrect.",
  email_exists: "This email is already registered.",
  weak_password: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  invalid_email: "Please enter a valid email address",
  incorrect_code: "Incorrect code. Try again.",
  passwords_mismatch: "Passwords don't match.",
  rate_limited: "Too many attempts. Please wait a minute and try again.",
  unknown: "Something went wrong. Please try again.",
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email.trim());
export const isValidPassword = (password: string): boolean => password.length >= PASSWORD_MIN_LENGTH;

/** Map a Supabase/GoTrue error message onto our fixed copy. */
export const mapAuthError = (raw: string | undefined | null): EmailAuthFailure => {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return { ok: false, code: "invalid_credentials", message: EMAIL_AUTH_COPY.invalid_credentials };
  }
  if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user_already_exists")) {
    return { ok: false, code: "email_exists", message: EMAIL_AUTH_COPY.email_exists };
  }
  if (msg.includes("password") && (msg.includes("at least") || msg.includes("weak") || msg.includes("short"))) {
    return { ok: false, code: "weak_password", message: EMAIL_AUTH_COPY.weak_password };
  }
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
    return { ok: false, code: "invalid_email", message: EMAIL_AUTH_COPY.invalid_email };
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return { ok: false, code: "rate_limited", message: EMAIL_AUTH_COPY.rate_limited };
  }
  return { ok: false, code: "unknown", message: EMAIL_AUTH_COPY.unknown };
};

/** Existing user → session. */
export const signInWithEmail = async (email: string, password: string): Promise<EmailAuthResult<{ userId: string }>> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return mapAuthError(error.message);
  if (!data.user) return { ok: false, code: "unknown", message: EMAIL_AUTH_COPY.unknown };
  return { ok: true, data: { userId: data.user.id } };
};

/**
 * New user → session (this project auto-confirms email sign-ups, verified
 * 2026-09-19, so a session is returned immediately).
 */
export const signUpWithEmail = async (email: string, password: string): Promise<EmailAuthResult<{ userId: string }>> => {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return mapAuthError(error.message);
  // With confirmations OFF Supabase returns an error for duplicates; with
  // confirmations ON it returns a user with zero identities. Treat both as "exists".
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    return { ok: false, code: "email_exists", message: EMAIL_AUTH_COPY.email_exists };
  }
  if (!data.session) return { ok: false, code: "unknown", message: EMAIL_AUTH_COPY.unknown };
  return { ok: true, data: { userId: data.user.id } };
};

/** Landing page for the reset link (both "Forgot password?" and Settings › Account security use it). */
export const RESET_PASSWORD_PATH = "/reset-password";

/** Sends the reset link. Always resolves ok:true for unknown emails (no account enumeration). */
export const sendPasswordReset = async (email: string): Promise<EmailAuthResult> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
  });
  if (error) {
    const mapped = mapAuthError(error.message);
    if (mapped.code === "rate_limited") return mapped;
    // Any other failure is swallowed on purpose — the UI must not reveal whether the email exists.
    console.error("sendPasswordReset:", error.message);
  }
  return { ok: true, data: undefined };
};

/** Sets a new password for the current (recovery or normal) session. */
export const updatePassword = async (password: string): Promise<EmailAuthResult> => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return mapAuthError(error.message);
  return { ok: true, data: undefined };
};
