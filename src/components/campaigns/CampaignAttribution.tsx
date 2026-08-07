import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PENDING_KEY = "omenx_pending_campaign_entry";

/**
 * Global campaign attribution. Any page visited with `?entry={link_code}`
 * soft-binds the signed-in user to that campaign entry (no Join button).
 * A participation whose `locked_at` is set can no longer be re-bound.
 */
export const CampaignAttribution = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const handled = useRef<string | null>(null);

  const linkCode = searchParams.get("entry");

  // Stash the code until the visitor signs in.
  useEffect(() => {
    if (!linkCode) return;
    try {
      localStorage.setItem(PENDING_KEY, linkCode);
    } catch {
      /* ignore */
    }
  }, [linkCode]);

  useEffect(() => {
    if (!user) return;
    let pending = linkCode;
    if (!pending) {
      try {
        pending = localStorage.getItem(PENDING_KEY);
      } catch {
        pending = null;
      }
    }
    if (!pending) return;
    const token = `${user.id}:${pending}`;
    if (handled.current === token) return;
    handled.current = token;

    (async () => {
      const { data: entry } = await supabase
        .from("campaign_entries")
        .select("id, campaign_id, branding, kind")
        .eq("link_code", pending)
        .maybeSingle();
      if (!entry) return;

      const displayName =
        ((entry.branding as Record<string, unknown> | null)?.display_name as string) ?? "This entry";

      const { data: existing } = await supabase
        .from("campaign_participations")
        .select("id, entry_id, locked_at")
        .eq("campaign_id", entry.campaign_id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("campaign_participations").insert({
          user_id: user.id,
          campaign_id: entry.campaign_id,
          entry_id: entry.id,
          source: "link",
        });
        if (!error) toast(`You're in — ${displayName}'s terms apply`);
      } else if (!existing.locked_at && existing.entry_id !== entry.id) {
        const { error } = await supabase
          .from("campaign_participations")
          .update({ entry_id: entry.id, source: "link" })
          .eq("id", existing.id);
        if (!error) toast(`You're in — ${displayName}'s terms apply`);
      }

      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {
        /* ignore */
      }
      queryClient.invalidateQueries({ queryKey: ["campaign-participations"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-joined"] });
    })();
  }, [user, linkCode, queryClient]);

  return null;
};

/** Soft-binds the signed-in user to a campaign's public entry on first detail visit. */
export const softBindPublicEntry = async (
  userId: string,
  campaignId: string,
  publicEntryId: string,
) => {
  const { data: existing } = await supabase
    .from("campaign_participations")
    .select("id")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (existing) return false;
  const { error } = await supabase.from("campaign_participations").insert({
    user_id: userId,
    campaign_id: campaignId,
    entry_id: publicEntryId,
    source: "direct",
  });
  return !error;
};