import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SheetTitle } from "@/components/ui/sheet";
import { GHOST_BUTTON_CLASS } from "@/components/auth/EmailAuthPanel";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";
import lynxCloseBlocked from "@/assets/settings/lynx-close-blocked.png";
import lynxCloseConfirm from "@/assets/settings/lynx-close-confirm.png";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › Account (CPO 2026-09-22 rules 19–21, mock v5 §1 / 4.15 / 4.16;
 * dialogs re-skinned 2026-09-23 from Figma omenx_lite 858:2323 / 858:2808
 * (desktop) and 858:2827 / 858:2840 (mobile)).
 *   · Sign out — immediate, back to `/`, no confirm.
 *   · Close account — red row (`#FF5C5C`, DESIGN §5 destructive; Wallet's
 *     Delete-address precedent). Balance (Standard + Boost) > 0 → "Withdraw
 *     your balance first" dialog with `Go to Wallet`; balance 0 → confirm
 *     dialog, type CLOSE, red primary. Lovable stops at the confirm:
 *     it signs the user out and toasts "Account closed"; the live platform
 *     deletes the account (docs/backend-boundary.md).
 * Both dialogs wear the Auth "Connect modal" shell (AuthDialog / AuthSheet
 * literal): teal-to-ink gradient top, `#23262D` hairline, r-16, × top-right;
 * body = 130px lynx illustration → 17px display title → 12px centred copy →
 * buttons (desktop two 190×44 side by side, mobile stacked, Cancel first).
 * Desktop = shadcn Dialog; mobile = MobileDrawer.
 */

export type AccountPreviewState = "default" | "blocked" | "confirm";

const CONFIRM_WORD = "CLOSE";

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

const Headline = ({ src, title, children }: { src: string; title: string; children: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 text-center">
    <div className="flex flex-col items-center gap-2.5">
      <Illustration src={src} />
      <h2 className="font-display text-[17px] font-bold leading-[25.5px] tracking-[-0.34px] text-white">{title}</h2>
    </div>
    <p className="max-w-[330px] text-[12px] leading-[18px] text-[#9CA2AB]">{children}</p>
  </div>
);

const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const AccountCard = ({
  previewState,
  previewBalance,
}: {
  /** Style-guide only: open a dialog in a given state. Never set in product. */
  previewState?: AccountPreviewState;
  previewBalance?: number;
} = {}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { balance, spotBalance } = useUserProfile();
  const preview = !!previewState;
  const total = preview ? previewBalance ?? 326.8 : (balance ?? 0) + (spotBalance ?? 0);

  const [blockedOpen, setBlockedOpen] = useState(previewState === "blocked");
  const [confirmOpen, setConfirmOpen] = useState(previewState === "confirm");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    if (preview) return toast.message("Preview: would sign out");
    await supabase.auth.signOut();
    navigate("/");
  };

  const openClose = () => {
    setTyped("");
    if (total > 0) setBlockedOpen(true);
    else setConfirmOpen(true);
  };

  const handleClose = async () => {
    if (typed.trim().toUpperCase() !== CONFIRM_WORD) return;
    if (preview) return toast.message("Preview: would close the account");
    setBusy(true);
    // Blueprint: no deletion — sign out and say so. Real platform: delete.
    await supabase.auth.signOut();
    setBusy(false);
    setConfirmOpen(false);
    toast.success("Account closed");
    navigate("/");
  };

  const canConfirm = typed.trim().toUpperCase() === CONFIRM_WORD && !busy;

  const blockedTitle = "Withdraw your balance first";
  const confirmTitle = "Close your account?";

  const blockedBody = (
    <>
      You still have {fmtUsd(total)} across Standard and Boost. Withdraw it before closing your account.
    </>
  );

  const confirmField = (
    <div className="w-full">
      <label htmlFor="close-account-confirm" className="block text-[12px] leading-[18px] text-[#9CA2AB] mb-1.5">
        Type <span className="text-white">{CONFIRM_WORD}</span> to confirm
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
  );

  const cancelClass = cn(GHOST_BUTTON_CLASS, "rounded-[12px]");
  const walletClass = "w-full h-[44px] btn-primary text-[14px] font-semibold";
  // Design 858:2825: #FF5C5C fill, ink text; the primary's cyan glow is not carried over.
  const closeClass =
    "w-full h-[44px] rounded-[12px] bg-[#FF5C5C] text-[#090A0B] text-[14px] font-semibold hover:bg-[#FF5C5C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  const blockedButtons = (stacked: boolean) => (
    <div className={cn("w-full", stacked ? "flex flex-col gap-2 py-2" : "grid grid-cols-2 gap-5 pt-[22px]")}>
      <button type="button" className={cancelClass} onClick={() => setBlockedOpen(false)}>
        Cancel
      </button>
      <Button className={walletClass} onClick={() => navigate("/wallet")}>
        Go to Wallet
      </Button>
    </div>
  );

  const confirmButtons = (stacked: boolean) => (
    <div className={cn("w-full", stacked ? "flex flex-col gap-2 py-2" : "grid grid-cols-2 gap-5")}>
      <button type="button" className={cancelClass} onClick={() => setConfirmOpen(false)}>
        Cancel
      </button>
      <button type="button" className={closeClass} disabled={!canConfirm} onClick={handleClose}>
        Close account
      </button>
    </div>
  );

  const blockedContent = (stacked: boolean) => (
    <div className="flex flex-col items-center gap-3">
      <Headline src={lynxCloseBlocked} title={blockedTitle}>
        {blockedBody}
      </Headline>
      {blockedButtons(stacked)}
    </div>
  );

  const confirmContent = (stacked: boolean) => (
    <div className="flex flex-col items-center gap-3">
      <Headline src={lynxCloseConfirm} title={confirmTitle}>
        Your profile, history and API keys are deleted. This cannot be undone.
      </Headline>
      {confirmField}
      {confirmButtons(stacked)}
    </div>
  );

  /* AuthDialog / AuthSheet shells, literal. */
  const DESKTOP_SHELL =
    "sm:max-w-md p-0 gap-0 rounded-[16px] sm:rounded-[16px] border border-[#23262D] bg-gradient-to-b from-[#012A35] from-[12.85%] via-[#0A0B0D] via-[21%] to-[#0A0B0D] overflow-hidden";
  const MOBILE_SHELL =
    "border-t border-[#23262D] [background-image:linear-gradient(180deg,#012A35_0px,#012A35_48px,#0A0B0D_136px)] pb-[calc(16px_+_env(safe-area-inset-bottom))]";

  return (
    <>
      <SettingsCard label="Account" compact={isMobile}>
        <SettingsRow
          icon={LogOut}
          title="Sign out"
          sub="Signs out this device only"
          right={
            <Button variant="outline" size="sm" className="h-8" onClick={handleSignOut}>
              Sign out
            </Button>
          }
        />
        <SettingsRow
          icon={Trash2}
          iconClassName="text-[#FF5C5C]"
          title="Close account"
          titleClassName="text-[#FF5C5C]"
          sub="Withdraw your balance first. This cannot be undone."
          right={
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[#FF5C5C] border-[#FF5C5C]/35 hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/10"
              onClick={openClose}
            >
              Close account
            </Button>
          }
          last
        />
      </SettingsCard>

      {isMobile ? (
        <>
          <MobileDrawer open={blockedOpen} onOpenChange={setBlockedOpen} showHandle={false} className={MOBILE_SHELL}>
            <VisuallyHidden>
              <SheetTitle>{blockedTitle}</SheetTitle>
            </VisuallyHidden>
            {blockedContent(true)}
          </MobileDrawer>
          <MobileDrawer open={confirmOpen} onOpenChange={setConfirmOpen} showHandle={false} className={MOBILE_SHELL}>
            <VisuallyHidden>
              <SheetTitle>{confirmTitle}</SheetTitle>
            </VisuallyHidden>
            {confirmContent(true)}
          </MobileDrawer>
        </>
      ) : (
        <>
          <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
            <DialogContent className={DESKTOP_SHELL}>
              <VisuallyHidden>
                <DialogTitle>{blockedTitle}</DialogTitle>
              </VisuallyHidden>
              <div className="p-6">{blockedContent(false)}</div>
            </DialogContent>
          </Dialog>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className={DESKTOP_SHELL}>
              <VisuallyHidden>
                <DialogTitle>{confirmTitle}</DialogTitle>
              </VisuallyHidden>
              <div className="p-6">{confirmContent(false)}</div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
};
