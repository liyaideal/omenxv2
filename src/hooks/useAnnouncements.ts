/**
 * Announcements data hooks — public reads (RLS: status = 'published').
 *   useAnnouncementPages()    /announcements list, 20 per page, newest first
 *   useAnnouncement(id)       /announcements/:id — null = withdrawn / unknown
 *   useRecentAnnouncements()  "More announcements" rail (3, excluding current)
 */
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ANNOUNCEMENT_COLUMNS,
  ANNOUNCEMENT_LIST_COLUMNS,
  PAGE_SIZE,
  type Announcement,
  type AnnouncementListRow,
} from "@/lib/announcements";

// `announcements` post-dates the generated Database type (same pattern as notifications).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from("announcements");

export const useAnnouncementPages = (enabled = true) =>
  useInfiniteQuery({
    queryKey: ["announcements", "list"],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      const { data, error } = await db()
        .select(ANNOUNCEMENT_LIST_COLUMNS)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as AnnouncementListRow[];
    },
    getNextPageParam: (last, all) => (last.length < PAGE_SIZE ? undefined : all.length * PAGE_SIZE),
    staleTime: 60_000,
  });

export const useAnnouncement = (id: string | undefined) =>
  useQuery({
    queryKey: ["announcements", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db().select(ANNOUNCEMENT_COLUMNS).eq("id", id).eq("status", "published").maybeSingle();
      if (error) throw error;
      return (data ?? null) as Announcement | null;
    },
    staleTime: 60_000,
  });

export const useRecentAnnouncements = (excludeId: string | undefined, limit = 3) =>
  useQuery({
    queryKey: ["announcements", "recent", excludeId, limit],
    queryFn: async () => {
      let q = db().select(ANNOUNCEMENT_LIST_COLUMNS).eq("status", "published").order("published_at", { ascending: false }).limit(limit + 1);
      if (excludeId) q = q.neq("id", excludeId);
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as AnnouncementListRow[]).slice(0, limit);
    },
    staleTime: 60_000,
  });
