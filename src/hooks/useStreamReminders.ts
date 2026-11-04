// ============================================================
// useStreamReminders — "Remind me" on Sports list stream previews.
// One row per (user, event) in public.stream_reminders (RLS: own rows).
// At kickoff the cron producer notify_stream_reminders() turns each row into
// one `system.stream_live` notification (Notifications → Updates).
// Guests: the tap calls the global sign-in prompt (AuthPromptHost: the standard
// AuthDialog on desktop, AuthSheet on mobile); nothing is stored locally.
// `fixture` (style-guide only) seeds the set and keeps every toggle local —
// no auth, no DB; `guestFixture` makes every tap open sign-in as for a guest.
// Neither is passed in production.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";

const db = () => (supabase as any).from("stream_reminders");

export const useStreamReminders = (fixture?: string[], guestFixture?: boolean) => {
  const { user } = useAuth();
  const openAuthPrompt = useAuthFlowStore((s) => s.openPrompt);
  const [ids, setIds] = useState<Set<string>>(() => new Set(fixture ?? []));

  useEffect(() => {
    if (fixture) return;
    if (!user) {
      setIds(new Set());
      return;
    }
    let alive = true;
    db()
      .select("event_id")
      .eq("user_id", user.id)
      .then(({ data }: { data: { event_id: string }[] | null }) => {
        if (alive) setIds(new Set((data ?? []).map((r) => r.event_id)));
      });
    return () => {
      alive = false;
    };
    // fixture is a style-guide constant — identity never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const flip = (eventId: string, on: boolean) =>
    setIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(eventId);
      else next.delete(eventId);
      return next;
    });

  const toggle = useCallback(
    async (eventId: string) => {
      const on = !ids.has(eventId);
      if (guestFixture) {
        openAuthPrompt();
        return;
      }
      if (fixture) {
        flip(eventId, on);
        return;
      }
      if (!user) {
        openAuthPrompt();
        return;
      }
      flip(eventId, on); // optimistic
      const { error } = on
        ? await db().insert({ user_id: user.id, event_id: eventId })
        : await db().delete().eq("user_id", user.id).eq("event_id", eventId);
      if (error) {
        flip(eventId, !on);
        toast.error("Couldn't update the reminder", { description: "Please try again." });
      }
    },
    [ids, fixture, guestFixture, user, openAuthPrompt],
  );

  return { has: (eventId: string) => ids.has(eventId), toggle };
};
