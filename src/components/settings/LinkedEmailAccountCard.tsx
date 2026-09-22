import { useEffect, useRef, useState } from "react";
import { Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { EMAIL_CHANGE_LINK_HOURS, RESEND_COOLDOWN_SECONDS } from "@/lib/emailAuth";
import { ChangeLoginEmailDialog, type ChangeLoginEmailPreviewState } from "./ChangeLoginEmailDialog";
import { SettingsCapsule, SettingsCard, SettingsNote, SettingsRow } from "./SettingsCard";

/**
 * Settings › Sign-in — the email + password variant (CPO 2026-09-19 plan A;
 * reskinned 2026-09-22 into the ACCOUNT-family card grammar, mock v5 §1).
 *   · header `SIGN-IN · Email & password`
 *   · one hairline row: Email / {address mono} / `Change` (outline sm h-8)
 *   · `PENDING` capsule (accent) + `Resend` while `user.new_email` is set
 *   · 60 s cooldown after sending (`✓ {n}s`), then `Resend`
 *   · once both links are opened Supabase swaps `user.email`; this card syncs
 *     `profiles.email` and toasts "Email updated to {new}"
 * The current address stays in the row until the swap — the account IS still
 * that email. No Cancel: Supabase has no API for it; links lapse in 24 h.
 */

export type LinkedEmailPreviewState = "default" | "pending" | "cooldown";

interface LinkedEmailAccountCardProps {
  /** Style-guide only: freeze the card in a state with display fixtures. Never set in product. */
  previewState?: LinkedEmailPreviewState;
  previewEmail?: string;
  previewNewEmail?: string;
  /** Style-guide only: open the dialog in a given state. */
  previewDialog?: ChangeLoginEmailPreviewState;
}

export const LinkedEmailAccountCard = ({
  previewState,
  previewEmail,
  previewNewEmail,
  previewDialog,
}: LinkedEmailAccountCardProps = {}) => {
  const preview = !!previewState;
  const isMobile = useIsMobile();
  const { profile, user, updateEmail } = useUserProfile();

  const email = preview ? previewEmail ?? "" : profile?.email || user?.email || "";
  const pendingEmail = preview
    ? previewState === "default"
      ? null
      : previewNewEmail ?? null
    : (user as { new_email?: string | null } | null)?.new_email || null;

  const [dialogOpen, setDialogOpen] = useState(!!previewDialog);
  const [cooldown, setCooldown] = useState(previewState === "cooldown" ? 57 : 0);
  // Sent-this-session hint so the pending copy shows even before the auth user refreshes.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const shownPending = pendingEmail || sentTo;

  useEffect(() => {
    if (cooldown <= 0 || preview) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown, preview]);

  // Both links opened → auth email changed → mirror it into profiles.email once.
  const syncedRef = useRef<string | null>(null);
  useEffect(() => {
    if (preview) return;
    const authEmail = user?.email;
    if (!authEmail || !profile?.email || pendingEmail) return;
    if (authEmail === profile.email || syncedRef.current === authEmail) return;
    syncedRef.current = authEmail;
    updateEmail(authEmail).then((res) => {
      if (res.success) toast.success(`Email updated to ${authEmail}`);
    });
    setSentTo(null);
  }, [user?.email, profile?.email, pendingEmail, preview, updateEmail]);

  const handleSent = (next: string) => {
    setSentTo(next);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const button =
    cooldown > 0 ? (
      <Button variant="outline" size="sm" className="h-8 shrink-0" disabled>
        <Check className="w-3.5 h-3.5 mr-1.5" />
        {cooldown}s
      </Button>
    ) : (
      <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => setDialogOpen(true)}>
        {shownPending ? "Resend" : "Change"}
      </Button>
    );

  return (
    <SettingsCard label="Sign-in" value="Email & password" compact={isMobile}>
      <SettingsRow
        icon={Mail}
        title={
          <>
            Email
            {shownPending && <SettingsCapsule tone="accent">Pending</SettingsCapsule>}
          </>
        }
        sub={email}
        subMono
        right={button}
        last
      />

      <SettingsNote>
        {shownPending ? (
          <>
            Changing to <span className="text-foreground">{shownPending}</span> — open the link in both inboxes to
            finish. Links expire in {EMAIL_CHANGE_LINK_HOURS} hours.
          </>
        ) : (
          <>
            You signed in via <span className="font-medium text-primary">Email</span>. To change it, we'll send a link
            to both your current and your new address.
          </>
        )}
      </SettingsNote>

      <ChangeLoginEmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentEmail={email}
        onSent={handleSent}
        previewState={previewDialog}
        previewNewEmail={previewNewEmail}
      />
    </SettingsCard>
  );
};
