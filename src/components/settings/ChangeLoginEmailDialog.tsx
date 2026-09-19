import { useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { INPUT_CLASS, INPUT_ERROR_CLASS, ERROR_CLASS } from "@/components/auth/EmailAuthPanel";
import { EMAIL_AUTH_COPY, EMAIL_CHANGE_LINK_HOURS, requestEmailChange } from "@/lib/emailAuth";
import { cn } from "@/lib/utils";

/**
 * Settings › Linked Account › Change email (CPO 2026-09-19, plan A; mock v1 §2–3).
 *
 * Email + password accounts only. One field, one button: Supabase sends a
 * confirmation link to BOTH the current and the new address; the sent state
 * lists both mailboxes because "open both" is the one thing users miss.
 * No 6-digit code, no old-password field, no withdrawal-freeze sentence
 * (the blueprint has no freeze mechanism — see delivery doc §6).
 *
 * Desktop: shadcn Dialog (same shell as the old Edit-email dialog).
 * Mobile: MobileDrawer, single full-width primary, no Cancel.
 */

export type ChangeLoginEmailPreviewState = "input" | "error" | "sent";

interface ChangeLoginEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  /** Called once the links were sent, with the new address. */
  onSent?: (newEmail: string) => void;
  /** Style-guide only: freeze in a state with display fixtures. Never set in product. */
  previewState?: ChangeLoginEmailPreviewState;
  previewNewEmail?: string;
}

const TITLE = "Change email";
const DESCRIPTION = "We'll send a confirmation link to both your current and your new address. Open both to finish.";
const SENT_TITLE = "Check both inboxes";
const SENT_DESCRIPTION = `Open the link in each email to finish. Links expire in ${EMAIL_CHANGE_LINK_HOURS} hours.`;

export const ChangeLoginEmailDialog = ({
  open,
  onOpenChange,
  currentEmail,
  onSent,
  previewState,
  previewNewEmail,
}: ChangeLoginEmailDialogProps) => {
  const isMobile = useIsMobile();
  const preview = !!previewState;
  const [mode, setMode] = useState<"input" | "sent">(previewState === "sent" ? "sent" : "input");
  const [newEmail, setNewEmail] = useState(preview ? previewNewEmail ?? "" : "");
  const [error, setError] = useState(previewState === "error" ? EMAIL_AUTH_COPY.email_exists : "");
  const [sending, setSending] = useState(false);

  // Fresh form every time the dialog opens (product only).
  useEffect(() => {
    if (preview || !open) return;
    setMode("input");
    setNewEmail("");
    setError("");
  }, [open, preview]);

  const handleSend = async () => {
    if (preview) return toast.message("Preview: would send links");
    setError("");
    setSending(true);
    const res = await requestEmailChange(currentEmail, newEmail);
    setSending(false);
    if (res.ok === false) {
      if (res.code === "rate_limited" || res.code === "unknown") {
        toast.error(res.message);
        return;
      }
      setError(res.message);
      return;
    }
    setMode("sent");
    onSent?.(newEmail.trim());
  };

  const field = (
    <div>
      <input
        id="change-email-new"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus={!preview}
        placeholder="New email address"
        value={newEmail}
        onChange={(e) => {
          setNewEmail(e.target.value);
          if (error) setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        className={cn(INPUT_CLASS, !!error && INPUT_ERROR_CLASS)}
      />
      {error && <p className={ERROR_CLASS}>{error}</p>}
    </div>
  );

  const sentBody = (
    <>
      <div className="text-center">
        <span className="inline-flex w-10 h-10 rounded-full bg-[rgba(207,255,74,0.1)] border border-[rgba(207,255,74,0.3)] text-[#CFFF4A] items-center justify-center mb-3">
          <Check className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <h3 className="text-lg font-semibold leading-tight">{SENT_TITLE}</h3>
        <p className="text-sm text-muted-foreground mt-1.5">{SENT_DESCRIPTION}</p>
      </div>
      <div className="bg-muted/30 rounded-xl px-4 mt-4">
        {[
          { k: "Current", v: currentEmail },
          { k: "New", v: newEmail.trim() },
        ].map((row, i) => (
          <div
            key={row.k}
            className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-border")}
          >
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground w-16 shrink-0">{row.k}</span>
            <span className="text-sm font-mono truncate">{row.v}</span>
          </div>
        ))}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={mode === "input" ? TITLE : undefined}
        description={mode === "input" ? DESCRIPTION : undefined}
      >
        <MobileDrawerSection>
          {mode === "input" ? (
            <>
              {field}
              <Button onClick={handleSend} disabled={sending || !newEmail.trim()} className="w-full btn-primary h-12">
                Send links
              </Button>
            </>
          ) : (
            <>
              {sentBody}
              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </>
          )}
        </MobileDrawerSection>
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {mode === "input" ? (
          <>
            <DialogHeader>
              <DialogTitle>{TITLE}</DialogTitle>
              <DialogDescription>{DESCRIPTION}</DialogDescription>
            </DialogHeader>
            <div className="py-2">{field}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || !newEmail.trim()} className="btn-primary">
                Send links
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{SENT_TITLE}</DialogTitle>
              <DialogDescription>{SENT_DESCRIPTION}</DialogDescription>
            </DialogHeader>
            <div className="pt-2">{sentBody}</div>
            <DialogFooter>
              <Button className="btn-primary" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
