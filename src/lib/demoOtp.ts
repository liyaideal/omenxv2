/**
 * Demo OTP utility for withdraw verification.
 * Both Email OTP and TOTP accept the fixed code below.
 */

export const DEMO_OTP_CODE = "111111";
export const DEMO_OTP_HINT = "Demo: use 111111";

export const verifyDemoOtp = (code: string) => {
  return code.trim() === DEMO_OTP_CODE;
};

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Generate a fake but realistic-looking base32 secret for demo display */
export const generateDemoTotpSecret = (length = 32) => {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE32_ALPHABET[Math.floor(Math.random() * BASE32_ALPHABET.length)];
  }
  return out;
};

/** Format secret with spaces every 4 chars for readability */
export const formatTotpSecret = (secret: string) => {
  return secret.replace(/(.{4})/g, "$1 ").trim();
};
