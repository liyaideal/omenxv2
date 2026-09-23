import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileDrawer, MobileDrawerSection } from "@/components/ui/mobile-drawer";
import { INPUT_CLASS } from "@/components/auth/EmailAuthPanel";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › Account (new, CPO 2026-09-22 rules 19–21, mock v5 §1 / 4.15 / 4.16).
 *   · Sign out — immediate, back to `/`, no confirm.
 *   · Close account — red row (`#FF5C5C`, DESIGN §5 destructive; Wallet's
 *     Delete-address precedent). Balance (Standard + Boost) > 0 → "Withdraw
 *     your balance first" dialog with `Go to Wallet`; balance 0 → confirm
 *     dialog, type CLOSE, red primary. The blueprint stops at the confirm:
 *     it signs the user out and toasts "Account closed"; the live platform
 *     deletes the account (docs/backend-boundary.md).
 * Desktop = shadcn Dialog; mobile = MobileDrawer.
 */

export type AccountPreviewState = "default" | "blocked" | "confirm";

const CONFIRM_WORD = "CLOSE";

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
  const blockedBody = (
    <>
      You still have <span className="font-mono text-foreground">{fmtUsd(total)}</span> across Standard and Boost.
      Withdraw it before closing your account.
    </>
  );
  const confirmTitle = "Close your account?";
  const confirmDesc = "Your profile, history and API keys are deleted. This cannot be undone.";
  const confirmField = (
    <div>
      <label htmlFor="close-account-confirm" className="block text-xs text-muted-foreground mb-2">
        Type <span className="font-mono text-foreground">{CONFIRM_WORD}</span> to confirm
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
        className={INPUT_CLASS}
      />
    </div>
  );

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
          <MobileDrawer open={blockedOpen} onOpenChange={setBlockedOpen} title={blockedTitle}>
            <MobileDrawerSection>
              <p className="text-sm text-muted-foreground leading-relaxed">{blockedBody}</p>
              <Button className="w-full btn-primary h-12" onClick={() => navigate("/wallet")}>
                Go to Wallet
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setBlockedOpen(false)}>
                Cancel
              </Button>
            </MobileDrawerSection>
          </MobileDrawer>
          <MobileDrawer open={confirmOpen} onOpenChange={setConfirmOpen} title={confirmTitle} description={confirmDesc}>
            <MobileDrawerSection>
              {confirmField}
              <Button
                className="w-full h-12 rounded-xl bg-trading-red hover:bg-trading-red/90 text-white font-semibold"
                disabled={!canConfirm}
                onClick={handleClose}
              >
                Close account
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
            </MobileDrawerSection>
          </MobileDrawer>
        </>
      ) : (
        <>
          <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{blockedTitle}</DialogTitle>
                <DialogDescription>{blockedBody}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBlockedOpen(false)}>
                  Cancel
                </Button>
                <Button className="btn-primary" onClick={() => navigate("/wallet")}>
                  Go to Wallet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{confirmTitle}</DialogTitle>
                <DialogDescription>{confirmDesc}</DialogDescription>
              </DialogHeader>
              <div className="py-2">{confirmField}</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-trading-red hover:bg-trading-red/90 text-white"
                  disabled={!canConfirm}
                  onClick={handleClose}
                >
                  Close account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
};
