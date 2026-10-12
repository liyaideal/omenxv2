import { useT } from "@/i18n";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import { OTPInput } from "input-otp";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SheetTitle } from "@/components/ui/sheet";
import { CodeSlot, ERROR_CLASS, GHOST_BUTTON_CLASS } from "@/components/auth/EmailAuthPanel";
import { ColoredAddress } from "@/components/wallet/ColoredAddress";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWallets } from "@/hooks/useWallets";
import { verifyDemoOtp } from "@/lib/demoOtp";
import { getWithdrawMinimum } from "@/types/withdraw";
import { cn } from "@/lib/utils";
import lynxCloseBlocked from "@/assets/settings/lynx-close-blocked.png";
import lynxCloseConfirm from "@/assets/settings/lynx-close-confirm.png";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › Account (CPO 2026-09-22 rules 19–21; dialogs re-skinned
 * 2026-09-23 from Figma omenx_lite 858:2323 / 858:2808 / 858:2827 / 858:2840;
 * flow extended 2026-10-12 per CPO rules 1–10 + mock close-account-mock.html).
 *   · Sign out — immediate, back to `/`, no confirm.
 *   · Close account — red row (`#FF5C5C`, DESIGN §5 destructive). One
 *     dialog, four steps:
 *       blocked  total ≥ withdrawal minimum ($20) → "Withdraw your balance
 *                first" + Go to Wallet (rule 1).
 *       balance  0 < total < minimum → Step 1 of 2: send it to a SAVED
 *                address (address book only, never typed; rule 2) or forfeit
 *                (rule 3; without a saved address, forfeit needs an explicit
 *                tick + a link to add an address in Wallet). No disclaimer
 *                copy (rule 4).
 *       confirm  Step 2 of 2 (no step label when total is 0): verification =
 *                the account's Withdrawal verification setting — email code /
 *                authenticator code / both; nothing configured → only CLOSE
 *                (rule 5). Then type CLOSE, red primary.
 *       done     "Your account is closed" — no grace period, closed is closed
 *                (CPO 2026-10-12). Done → sign out → `/`.
 *     Lovable: payout = `record-transaction` withdraw row + balances to 0;
 *     codes accept the demo OTP; `profiles.closed_at` is written and the row
 *     stays (ClosedAccountGate blocks the next sign-in). The live platform
 *     sends the payout, verifies real codes, and deletes (docs/backend-boundary.md).
 * Both shells are the Auth "Connect modal" (AuthDialog / AuthSheet literal);
 * desktop two 190×44 buttons side by side, mobile stacked with Cancel first.
 */

export type AccountPreviewState =
  | "default"
  | "blocked"
  | "balance"
  | "balance-no-address"
  | "confirm"
  | "confirm-email"
  | "confirm-both"
  | "done"
  | "done-sent";

type Step = "blocked" | "balance" | "confirm" | "done";
type VerifyMode = "none" | "email" | "totp" | "both";
type BalanceChoice = "send" | "forfeit";

const CONFIRM_WORD = "CLOSE";
const RESEND_SECONDS = 60;

const PREVIEW_ADDRESSES = [
  { id: "p1", label: "Main wallet", address: "0x3F2a…9c1E", fullAddress: "0x3F2a91c04bE7d5a0C8e6f1b2D4a7c9E05b3F9c1E", isPrimary: true },
  { id: "p2", label: "Ledger", address: "0x81b0…44aD", fullAddress: "0x81b07e2A5c9D3f6B1a4E8c0d2F7b5A9e3C6d44aD", isPrimary: false },
];

/* ---------- Connect-modal body (Figma 858:2325 / 858:2810, literal) ---------- */

const Illustration = ({ src }: { src: string }) => (
  <img
    src={src}
    alt=""
    aria-hidden
    draggable={false}
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).style.display = "none";
    }}
    className="w-[130px] h-[130px] opacity-80 object-cover pointer-events-none select-none"
  />
);

const Headline = ({ src, title, step, children }: { src: string; title: string; step?: string; children: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 text-center">
    <div className="flex flex-col items-center gap-2.5">
      <Illustration src={src} />
      <div>
        <h2 className="font-display text-[17px] font-bold leading-[25.5px] tracking-[-0.34px] text-white">{title}</h2>
        {step && <div className="text-[11px] uppercase tracking-[0.08em] text-[#656E7C] mt-0.5">{step}</div>}
      </div>
    </div>
    <p className="max-w-[330px] text-[12px] leading-[18px] text-[#9CA2AB]">{children}</p>
  </div>
);

const Radio = ({ on }: { on: boolean }) => (
  <span
    className={cn(
      "relative mt-0.5 h-4 w-4 shrink-0 rounded-full border-[1.5px]",
      on ? "border-[#33D6FF] after:absolute after:inset-[3px] after:rounded-full after:bg-[#33D6FF]" : "border-[#656E7C]",
    )}
  />
);

const Check = ({ on }: { on: boolean }) => (
  <span
    className={cn(
      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[11px] font-bold leading-none",
      on ? "border-[#33D6FF] bg-[#33D6FF] text-[#090A0B]" : "border-[#656E7C]",
    )}
  >
    {on ? "✓" : ""}
  </span>
);

const CodeField = ({
  label,
  right,
  value,
  onChange,
  error,
  autoFocus,
}: {
  label: ReactNode;
  right?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
}) => (
  <div className="w-full">
    <div className="flex items-center justify-between gap-2 text-[12px] leading-[18px] text-[#9CA2AB] mb-1.5">
      <span className="shrink-0">{label}</span>
      {right && <span className="text-[11px] text-right">{right}</span>}
    </div>
    <OTPInput
      maxLength={6}
      value={value}
      autoFocus={autoFocus}
      inputMode="numeric"
      pattern="^[0-9]*$"
      onChange={onChange}
      containerClassName="flex justify-between gap-2"
      render={({ slots }) => (
        <>
          {slots.map((slot, i) => (
            <CodeSlot key={i} {...slot} error={!!error} />
          ))}
        </>
      )}
    />
    {error && <p className={ERROR_CLASS}>{error}</p>}
  </div>
);

const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const maskEmail = (e: string) => {
  const [u, d] = e.split("@");
  if (!d) return e;
  return `${u.slice(0, 2)}•••@${d}`;
};

const pickStep = (s?: AccountPreviewState): Step | null => {
  switch (s) {
    case "blocked":
      return "blocked";
    case "balance":
    case "balance-no-address":
      return "balance";
    case "confirm":
    case "confirm-email":
    case "confirm-both":
      return "confirm";
    case "done":
    case "done-sent":
      return "done";
    default:
      return null;
  }
};

export const AccountCard = ({
  previewState,
  previewBalance,
}: {
  /** Style-guide only: open the dialog in a given step. Never set in product. */
  previewState?: AccountPreviewState;
  previewBalance?: number;
} = {}) => {
  const { t } = useT();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, profile, email, balance, spotBalance, deductAvailableOnly, deductSpotBalance } = useUserProfile();
  const { wallets } = useWallets();

  const preview = !!previewState;
  const minimum = getWithdrawMinimum("USDC");

  const total = preview
    ? (previewBalance ??
      (previewState === "blocked"
        ? 326.8
        : previewState === "balance" || previewState === "balance-no-address" || previewState === "done-sent"
          ? 12.5
          : 0))
    : (balance ?? 0) + (spotBalance ?? 0);

  const addresses = useMemo(
    () =>
      preview
        ? previewState === "balance-no-address"
          ? []
          : PREVIEW_ADDRESSES
        : wallets.map((w) => ({ id: w.id, label: w.label, address: w.address, fullAddress: w.fullAddress, isPrimary: w.isPrimary })),
    [preview, previewState, wallets],
  );

  // Rule 5: close verification = the account's Withdrawal verification setting.
  const verifyMode: VerifyMode = useMemo(() => {
    if (preview) {
      if (previewState === "confirm-email") return "email";
      if (previewState === "confirm-both") return "both";
      return "none";
    }
    const hasEmail = !!email;
    const totp = !!profile?.totp_enabled;
    const stored = (profile?.withdraw_2fa_mode as VerifyMode) || "email";
    const ready = (m: VerifyMode) => (m === "email" ? hasEmail : m === "totp" ? totp : m === "both" ? hasEmail && totp : false);
    if (ready(stored)) return stored;
    if (hasEmail) return "email";
    if (totp) return "totp";
    return "none";
  }, [preview, previewState, email, profile?.totp_enabled, profile?.withdraw_2fa_mode]);
  const needsEmail = verifyMode === "email" || verifyMode === "both";
  const needsTotp = verifyMode === "totp" || verifyMode === "both";
  const shownEmail = preview ? "li•••@gmail.com" : email ? maskEmail(email) : "";

  const [step, setStep] = useState<Step | null>(pickStep(previewState));
  const [choice, setChoice] = useState<BalanceChoice>("send");
  const [addressId, setAddressId] = useState<string | null>(null);
  const [forfeitAck, setForfeitAck] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ sent?: { amount: number; address: string } } | null>(
    previewState === "done" || previewState === "done-sent"
      ? { sent: previewState === "done-sent" ? { amount: 12.5, address: PREVIEW_ADDRESSES[0].address } : undefined }
      : null,
  );
  const cooldownTimer = useRef<number | null>(null);

  // Preview: pre-select the primary address and show the mock's filled states.
  useEffect(() => {
    if (!preview) return;
    setAddressId(addresses.find((a) => a.isPrimary)?.id ?? addresses[0]?.id ?? null);
    setChoice(addresses.length ? "send" : "forfeit");
    if (previewState === "confirm-email" || previewState === "confirm-both") {
      setEmailCode("48");
      setCooldown(58);
    }
    if (previewState === "confirm-both") setTyped(CONFIRM_WORD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, previewState]);

  // Resend cooldown ticker (frozen in previews).
  useEffect(() => {
    if (cooldown <= 0 || preview) return;
    cooldownTimer.current = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => {
      if (cooldownTimer.current) window.clearTimeout(cooldownTimer.current);
    };
  }, [cooldown, preview]);

  const needsBalanceStep = preview
    ? previewState === "balance" || previewState === "balance-no-address" || previewState === "confirm-email" || previewState === "confirm-both"
    : total > 0 && total < minimum;

  const reset = () => {
    setChoice(addresses.length ? "send" : "forfeit");
    setAddressId(addresses.find((a) => a.isPrimary)?.id ?? addresses[0]?.id ?? null);
    setForfeitAck(false);
    setEmailCode("");
    setTotpCode("");
    setCodeError("");
    setCooldown(0);
    setTyped("");
    setDone(null);
  };

  const close = () => {
    if (preview) return;
    setStep(null);
  };

  const handleSignOut = async () => {
    if (preview) return toast.message("Preview: would sign out");
    await supabase.auth.signOut();
    navigate("/");
  };

  const sendEmailCode = () => {
    // Lovable: nothing is sent; the demo code is accepted. Live: email OTP.
    setCooldown(RESEND_SECONDS);
  };

  const enterConfirm = () => {
    setCodeError("");
    if (needsEmail) sendEmailCode();
    setStep("confirm");
  };

  const openClose = () => {
    reset();
    if (total >= minimum) setStep("blocked");
    else if (total > 0) setStep("balance");
    else enterConfirm();
  };

  const selectedAddress = addresses.find((a) => a.id === addressId) ?? null;
  const canContinue = choice === "send" ? !!selectedAddress : addresses.length ? true : forfeitAck;

  const canConfirm =
    typed.trim().toUpperCase() === CONFIRM_WORD &&
    (!needsEmail || emailCode.length === 6) &&
    (!needsTotp || totpCode.length === 6) &&
    !busy;

  const handleClose = async () => {
    if (!canConfirm) return;
    if ((needsEmail && !verifyDemoOtp(emailCode)) || (needsTotp && !verifyDemoOtp(totpCode))) {
      setCodeError(t("settings.account.confirm.invalidCode"));
      return;
    }
    if (preview) return toast.message("Preview: would close the account");
    if (!user) return;
    setBusy(true);
    try {
      let sent: { amount: number; address: string } | undefined;
      if (needsBalanceStep && choice === "send" && selectedAddress) {
        // Lovable: ledger row + balances to 0. Live: real USDC transfer on Base.
        const { error } = await supabase.functions.invoke("record-transaction", {
          body: {
            type: "withdraw",
            amount: -total,
            description: t("settings.account.payoutDescription", { address: selectedAddress.fullAddress }),
            status: "processing",
            network: "Base",
            account: (balance ?? 0) > 0 ? "futures" : "spot",
          },
        });
        if (error) throw new Error(error.message);
        sent = { amount: total, address: selectedAddress.address };
      }
      if (needsBalanceStep) {
        if ((balance ?? 0) > 0) await deductAvailableOnly(balance ?? 0);
        if ((spotBalance ?? 0) > 0) await deductSpotBalance(spotBalance ?? 0);
      }
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ closed_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (profileError) throw new Error(profileError.message);
      setDone({ sent });
      setStep("done");
      toast.success(t("settings.account.closed"));
    } catch (e: any) {
      toast.error(e?.message || "Couldn't close the account. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDone = async () => {
    if (preview) return toast.message("Preview: would sign out");
    await supabase.auth.signOut();
    navigate("/");
  };

  /* ---------- pieces ---------- */

  const cancelClass = cn(GHOST_BUTTON_CLASS, "rounded-[12px]");
  const primaryClass = "w-full h-[44px] btn-primary text-[14px] font-semibold disabled:opacity-40";
  // Design 858:2825: #FF5C5C fill, ink text; the primary's cyan glow is not carried over.
  const redClass =
    "w-full h-[44px] rounded-[12px] bg-[#FF5C5C] text-[#090A0B] text-[14px] font-semibold hover:bg-[#FF5C5C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  const buttons = (stacked: boolean, right: ReactNode, single = false) => (
    <div className={cn("w-full", single ? "pt-2.5" : stacked ? "flex flex-col gap-2 py-2" : "grid grid-cols-2 gap-5 pt-2.5")}>
      {!single && (
        <button type="button" className={cancelClass} onClick={close}>
          {t("common.cancel")}
        </button>
      )}
      {right}
    </div>
  );

  const optionClass = (on: boolean) =>
    cn(
      "flex w-full items-start gap-2.5 rounded-[12px] border bg-[#14161A] px-3 py-2.5 text-left transition-colors",
      on ? "border-[#33D6FF]/40" : "border-[#23262D] hover:border-[#2C3038]",
    );

  const [typeBefore, typeAfter] = t("settings.account.confirm.typeToConfirm", { word: "\u0000" }).split("\u0000");

  const balanceBody = (stacked: boolean) => (
    <div className="flex w-full flex-col items-center gap-3">
      <Headline
        src={lynxCloseBlocked}
        title={t("settings.account.balance.title", { amount: fmtUsd(total) })}
        step={t("settings.account.balance.step")}
      >
        {t("settings.account.balance.body", { min: fmtUsd(minimum).replace(/\.00$/, "") })}
      </Headline>
      <div className="flex w-full flex-col gap-1.5">
        {addresses.length > 0 ? (
          <>
            <button type="button" className={optionClass(choice === "send")} onClick={() => setChoice("send")}>
              <Radio on={choice === "send"} />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-white">{t("settings.account.balance.send")}</span>
                <span className="mt-0.5 block text-[11px] leading-[1.4] text-[#9CA2AB]">{t("settings.account.balance.sendSub")}</span>
              </span>
            </button>
            {choice === "send" && (
              <div className="ml-3 border-l border-[#23262D] pl-3">
                {addresses.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAddressId(a.id)}
                    className={cn("flex w-full items-center gap-2.5 py-2 text-left", i < addresses.length - 1 && "border-b border-[#1D2026]")}
                  >
                    <Radio on={addressId === a.id} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
                        {a.label}
                        {a.isPrimary && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: "rgba(207,255,74,0.16)", color: "#DCFF6A" }}
                          >
                            {t("settings.wallet.default")}
                          </span>
                        )}
                      </span>
                      <ColoredAddress address={a.fullAddress} className="text-[11px] leading-[1.35] break-all" />
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" className={optionClass(choice === "forfeit")} onClick={() => setChoice("forfeit")}>
              <Radio on={choice === "forfeit"} />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-white">
                  {t("settings.account.balance.forfeit", { amount: fmtUsd(total) })}
                </span>
                <span className="mt-0.5 block text-[11px] leading-[1.4] text-[#9CA2AB]">{t("settings.account.balance.forfeitSub")}</span>
              </span>
            </button>
          </>
        ) : (
          <>
            <button type="button" className={optionClass(forfeitAck)} onClick={() => setForfeitAck((v) => !v)} aria-pressed={forfeitAck}>
              <Check on={forfeitAck} />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-white">
                  {t("settings.account.balance.forfeitAck", { amount: fmtUsd(total) })}
                </span>
                <span className="mt-0.5 block text-[11px] leading-[1.4] text-[#9CA2AB]">{t("settings.account.balance.forfeitSub")}</span>
              </span>
            </button>
            <p className="mt-1 text-[12px] text-[#9CA2AB]">
              {t("settings.account.balance.keepIt")}{" "}
              <button type="button" className="text-[#33D6FF] hover:underline" onClick={() => (preview ? undefined : navigate("/wallet"))}>
                {t("settings.account.balance.addAddress")}
              </button>
            </p>
          </>
        )}
      </div>
      {buttons(
        stacked,
        <Button className={primaryClass} disabled={!canContinue} onClick={enterConfirm}>
          {t("settings.account.balance.continue")}
        </Button>,
      )}
    </div>
  );

  const confirmBody = (stacked: boolean) => (
    <div className="flex w-full flex-col items-center gap-3">
      <Headline
        src={lynxCloseConfirm}
        title={t("settings.account.confirm.title")}
        step={needsBalanceStep ? t("settings.account.confirm.step") : undefined}
      >
        {t("settings.account.confirm.body")}
      </Headline>
      {needsEmail && (
        <CodeField
          label={t("settings.account.confirm.emailCode")}
          right={
            <>
              {t("settings.account.confirm.sentTo", { email: shownEmail })} ·{" "}
              {cooldown > 0 ? (
                <span className="text-[#33D6FF]">{t("settings.account.confirm.resendIn", { seconds: cooldown })}</span>
              ) : (
                <button type="button" className="text-[#33D6FF] hover:underline" onClick={sendEmailCode}>
                  {t("settings.account.confirm.resend")}
                </button>
              )}
            </>
          }
          value={emailCode}
          onChange={(v) => {
            setEmailCode(v);
            setCodeError("");
          }}
          error={needsTotp ? undefined : codeError}
          autoFocus
        />
      )}
      {needsTotp && (
        <CodeField
          label={t("settings.account.confirm.totpCode")}
          value={totpCode}
          onChange={(v) => {
            setTotpCode(v);
            setCodeError("");
          }}
          error={codeError}
          autoFocus={!needsEmail}
        />
      )}
      <div className="w-full">
        <label htmlFor="close-account-confirm" className="block text-[12px] leading-[18px] text-[#9CA2AB] mb-1.5">
          {typeBefore}
          <span className="text-white">{CONFIRM_WORD}</span>
          {typeAfter}
        </label>
        <input
          id="close-account-confirm"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder={CONFIRM_WORD}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canConfirm) handleClose();
          }}
          className="w-full h-9 rounded-[8px] bg-[#14161A] border border-[#23262D] px-3.5 font-display text-[14px] tracking-[-0.34px] text-white placeholder:text-[#656E7C] focus:outline-none focus:border-[#33D6FF]/40 transition-colors"
        />
      </div>
      {buttons(
        stacked,
        <button type="button" className={redClass} disabled={!canConfirm} onClick={handleClose}>
          {t("settings.account.close")}
        </button>,
      )}
    </div>
  );

  const blockedBody = (stacked: boolean) => (
    <div className="flex w-full flex-col items-center gap-3">
      <Headline src={lynxCloseBlocked} title={t("settings.account.blocked.title")}>
        {t("settings.account.blocked.body", { amount: fmtUsd(total) })}
      </Headline>
      {buttons(
        stacked,
        <Button className={primaryClass} onClick={() => navigate("/wallet")}>
          {t("settings.account.blocked.wallet")}
        </Button>,
      )}
    </div>
  );

  const doneBody = (stacked: boolean) => {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <Headline src={lynxCloseConfirm} title={t("settings.account.done.title")}>
          {done?.sent
            ? t("settings.account.done.sent", { amount: fmtUsd(done.sent.amount), address: done.sent.address })
            : t("settings.account.done.plain")}
        </Headline>
        {buttons(
          stacked,
          <Button className={primaryClass} onClick={handleDone}>
            {t("settings.account.done.button")}
          </Button>,
          true,
        )}
      </div>
    );
  };

  const body = (stacked: boolean) =>
    step === "blocked"
      ? blockedBody(stacked)
      : step === "balance"
        ? balanceBody(stacked)
        : step === "confirm"
          ? confirmBody(stacked)
          : doneBody(stacked);

  const title =
    step === "blocked"
      ? t("settings.account.blocked.title")
      : step === "balance"
        ? t("settings.account.balance.title", { amount: fmtUsd(total) })
        : step === "confirm"
          ? t("settings.account.confirm.title")
          : t("settings.account.done.title");

  /* AuthDialog / AuthSheet shells, literal. */
  const DESKTOP_SHELL =
    "sm:max-w-md p-0 gap-0 rounded-[16px] sm:rounded-[16px] border border-[#23262D] bg-gradient-to-b from-[#012A35] from-[12.85%] via-[#0A0B0D] via-[21%] to-[#0A0B0D] overflow-hidden";
  const MOBILE_SHELL =
    "border-t border-[#23262D] [background-image:linear-gradient(180deg,#012A35_0px,#012A35_48px,#0A0B0D_136px)] pb-[calc(16px_+_env(safe-area-inset-bottom))]";

  const onOpenChange = (o: boolean) => {
    if (o) return;
    if (step === "done") {
      void handleDone();
      return;
    }
    close();
  };

  return (
    <>
      <SettingsCard label={t("settings.account.label")} compact={isMobile}>
        <SettingsRow
          icon={LogOut}
          title={t("common.sign_out")}
          sub={t("settings.account.signOutSub")}
          right={
            <Button variant="outline" size="sm" className="h-8" onClick={handleSignOut}>
              {t("common.sign_out")}
            </Button>
          }
        />
        <SettingsRow
          icon={Trash2}
          iconClassName="text-[#FF5C5C]"
          title={t("settings.account.close")}
          titleClassName="text-[#FF5C5C]"
          sub={t("settings.account.closeSub")}
          right={
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[#FF5C5C] border-[#FF5C5C]/35 hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/10"
              onClick={openClose}
            >
              {t("settings.account.close")}
            </Button>
          }
          last
        />
      </SettingsCard>

      {isMobile ? (
        <MobileDrawer open={step !== null} onOpenChange={onOpenChange} showHandle={false} className={MOBILE_SHELL}>
          <VisuallyHidden>
            <SheetTitle>{title}</SheetTitle>
          </VisuallyHidden>
          {step && body(true)}
        </MobileDrawer>
      ) : (
        <Dialog open={step !== null} onOpenChange={onOpenChange}>
          <DialogContent className={DESKTOP_SHELL}>
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
            <div className="p-6">{step && body(false)}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
