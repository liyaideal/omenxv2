import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  NOTIFICATION_PREF_KEYS,
  readNotificationPrefs,
  useUserProfile,
  type NotificationPrefKey,
} from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";
import { SettingsCard, SettingsNote } from "./SettingsCard";

/**
 * Settings › Notifications (new, CPO 2026-09-22 rules 10–13, mock v5 §1 / 4.10).
 * Email only this batch (browser push + Telegram deferred). Four toggles
 * stored in `profiles.notification_prefs`; new accounts default to all on.
 * Switch = save (optimistic; failure rolls back + toast). No email on the
 * account → the whole body is the empty state "Add an email to get alerts".
 * The blueprint stores the preference only — no mail is sent.
 * Copy is Lite vocabulary: buy / cash out / Boost / auto-close (no "Back").
 */

export const NOTIFICATION_EVENTS: { key: NotificationPrefKey; label: string; description: string }[] = [
  { key: "settled", label: "Settled results", description: "When a call you hold settles — won or lost" },
  { key: "auto_close", label: "Auto-close warnings", description: "When a Boost call gets close to its auto-close" },
  { key: "trades", label: "Trade confirmations", description: "Every buy and cash out" },
  { key: "funds", label: "Deposits & withdrawals", description: "When funds land or leave" },
];

export type NotificationsPreviewState = "default" | "some-off" | "no-email";

export const NotificationsCard = ({
  onAddEmail,
  previewState,
  previewEmail,
}: {
  /** Opens the notification-email dialog (Sign-in card's Add / Edit). */
  onAddEmail: () => void;
  /** Style-guide only: freeze the card in a state with display fixtures. Never set in product. */
  previewState?: NotificationsPreviewState;
  previewEmail?: string;
} = { onAddEmail: () => undefined }) => {
  const isMobile = useIsMobile();
  const { profile, user, updateNotificationPrefs } = useUserProfile();
  const preview = !!previewState;

  const email = preview ? (previewState === "no-email" ? null : previewEmail ?? "you@example.com") : profile?.email || null;
  const [previewPrefs, setPreviewPrefs] = useState(() =>
    readNotificationPrefs(previewState === "some-off" ? { auto_close: false, trades: false } : null),
  );
  const prefs = preview ? previewPrefs : readNotificationPrefs(profile?.notification_prefs);
  const [saving, setSaving] = useState<NotificationPrefKey | null>(null);

  // Email-change pending: the footnote keeps showing the CURRENT address (rule from the state table).
  const pendingEmail = (user as { new_email?: string | null } | null)?.new_email || null;

  const toggle = async (key: NotificationPrefKey, next: boolean) => {
    if (preview) {
      setPreviewPrefs((p) => ({ ...p, [key]: next }));
      return;
    }
    setSaving(key);
    const res = await updateNotificationPrefs({ ...prefs, [key]: next });
    setSaving(null);
    if (!res.success) toast.error("Couldn't save that. Try again.");
  };

  return (
    <SettingsCard label="Notifications" description="Email alerts for activity on your account." compact={isMobile}>
      {!email ? (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="text-sm font-semibold">Add an email to get alerts</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-[320px] leading-relaxed">
            Settled results, auto-close warnings, trade confirmations and funds movements.
          </p>
          <Button variant="outline" size="sm" className="h-8 mt-4" onClick={onAddEmail}>
            Add email
          </Button>
        </div>
      ) : (
        <>
          {NOTIFICATION_EVENTS.map((ev, i) => {
            const last = i === NOTIFICATION_EVENTS.length - 1;
            const id = `notif-${ev.key}`;
            return (
              <div
                key={ev.key}
                className={cn("flex items-center gap-4 py-3.5", !last && "border-b border-[#1D2026]", last && "pb-0")}
              >
                <label htmlFor={id} className="flex-1 min-w-0 cursor-pointer">
                  <div className="text-sm font-medium">{ev.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ev.description}</div>
                </label>
                <Switch
                  id={id}
                  checked={prefs[ev.key]}
                  disabled={saving === ev.key}
                  onCheckedChange={(v) => toggle(ev.key, v)}
                  aria-label={ev.label}
                />
              </div>
            );
          })}
          <SettingsNote>
            Sent to <span className="text-foreground">{email}</span>
            {pendingEmail ? " — until your email change is confirmed." : "."}
          </SettingsNote>
        </>
      )}
    </SettingsCard>
  );
};

export { NOTIFICATION_PREF_KEYS };
