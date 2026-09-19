import { useEffect, useRef, useState } from "react";
import { Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { EMAIL_CHANGE_LINK_HOURS, RESEND_COOLDOWN_SECONDS } from "@/lib/emailAuth";
import { ChangeLoginEmailDialog, type ChangeLoginEmailPreviewState } from "./ChangeLoginEmailDialog";

/**
 * Settings › Linked Account — the email + password variant (CPO 2026-09-19,
 * plan A; mock v1 §1). Same card shell as the provider variant in Settings.tsx,
 * plus:
 *   · `Change` (outline sm h-8, the Password-row button) inside the provider box
 *   · `Pending` chip + "Changing to {new}…" helper while `user.new_email` is set
 *   · 60 s cooldown after sending (`✓ {n}s`), then `Resend`
 *   · once both links are opened Supabase swaps `user.email`; this card syncs
 *     `profiles.email` and toasts "Email updated to {new}"
 * The current address stays in the box until the swap — the account IS still
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
    <div className="trading-card p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold mb-1">Linked Account</h3>
          <p className="text-xs text-muted-foreground">The account you used to sign in</p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Email</span>
              {shownPending && (
                <Badge variant="outline" className="text-xs text-primary border-primary/35">
                  Pending
                </Badge>
              )}
            </div>
            <p className="text-sm font-mono text-muted-foreground truncate mt-0.5">{email}</p>
          </div>
          {button}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {shownPending ? (
          <>
            Changing to <span className="text-foreground">{shownPending}</span> — open the link in both inboxes to
            finish. Links expire in {EMAIL_CHANGE_LINK_HOURS} hours.
          </>
        ) : (
          <>
            You signed in via <span className="font-medium text-primary">Email</span>. To change it, we'll send a link to
            both your current and your new address.
          </>
        )}
      </p>

      <ChangeLoginEmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentEmail={email}
        onSent={handleSent}
        previewState={previewDialog}
        previewNewEmail={previewNewEmail}
      />
    </div>
  );
};
