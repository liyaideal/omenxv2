/**
 * useNotifications — list + unread counters + mark read, realtime-refreshed.
 *
 * Read rules (CPO 2026-10-13 D8): opening the panel / page never marks
 * anything read; clicking a row marks that row; "Mark all read" marks all.
 * Writes go through the SECURITY DEFINER RPC `mark_notifications_read`
 * (the table has no UPDATE policy). New rows arrive over Supabase realtime
 * and only refresh the query — no toast (D5).
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import {
  countsAsUnread,
  tabOf,
  type NotificationRow,
  type NotificationTab,
} from "@/lib/notifications";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const POPOVER_LIMIT = 20;
export const PAGE_SIZE = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from("notifications");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, args?: Record<string, unknown>) => (supabase as any).rpc(fn, args);

const toRow = (r: Record<string, unknown>): NotificationRow => ({
  id: String(r.id),
  user_id: String(r.user_id),
  category: String(r.category),
  type: String(r.type),
  params: (r.params as Record<string, unknown>) ?? {},
  entity_type: (r.entity_type as string | null) ?? null,
  entity_id: (r.entity_id as string | null) ?? null,
  deep_link: (r.deep_link as string | null) ?? null,
  read_at: (r.read_at as string | null) ?? null,
  created_at: String(r.created_at),
});

/** Unread counters: bell badge + per-tab dot. One cheap query (unread only). */
export const useNotificationCounts = () => {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread", user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await db()
        .select("id, type, category, read_at")
        .is("read_at", null)
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Pick<NotificationRow, "id" | "type" | "category" | "read_at">[];
    },
  });
  return useMemo(() => {
    const rows = q.data ?? [];
    const counted = rows.filter(countsAsUnread);
    const byTab: Record<NotificationTab, number> = { trading: 0, account: 0 };
    for (const r of counted) byTab[tabOf(r)] += 1;
    return {
      badge: counted.length,
      byTab,
      hasAnyUnread: rows.length > 0, // includes trade.* → drives "Mark all read" visibility
      isLoading: q.isLoading,
    };
  }, [q.data, q.isLoading]);
};

/** Recent N rows for the desktop popover. */
export const useRecentNotifications = (limit = POPOVER_LIMIT, enabled = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "recent", user?.id, limit],
    enabled: !!user && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await db()
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(toRow);
    },
  });
};

/** Full page: infinite scroll, PAGE_SIZE per page, 90-day retention is server-side. */
export const useNotificationPages = (enabled = true) => {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "pages", user?.id],
    enabled: !!user && enabled,
    staleTime: 15_000,
    initialPageParam: 0,
    getNextPageParam: (last: NotificationRow[], all) => (last.length < PAGE_SIZE ? undefined : all.length * PAGE_SIZE),
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      const { data, error } = await db()
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(toRow);
    },
  });
};

/** Mark one / many / all read. Optimistic: cached rows flip at once. */
export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  const apply = useCallback(
    (ids: string[] | null) => {
      const now = new Date().toISOString();
      const flip = (r: NotificationRow) => (r.read_at || (ids && !ids.includes(r.id)) ? r : { ...r, read_at: now });
      qc.setQueriesData({ queryKey: [...NOTIFICATIONS_QUERY_KEY, "recent"] }, (old: NotificationRow[] | undefined) =>
        old ? old.map(flip) : old,
      );
      qc.setQueriesData(
        { queryKey: [...NOTIFICATIONS_QUERY_KEY, "pages"] },
        (old: { pages: NotificationRow[][]; pageParams: unknown[] } | undefined) =>
          old ? { ...old, pages: old.pages.map((p) => p.map(flip)) } : old,
      );
      qc.setQueriesData(
        { queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread"] },
        (old: Pick<NotificationRow, "id" | "type" | "category" | "read_at">[] | undefined) =>
          old ? old.filter((r) => ids && !ids.includes(r.id)) : old,
      );
    },
    [qc],
  );
  const markRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      apply(ids);
      const { error } = await rpc("mark_notifications_read", { p_ids: ids });
      if (error) void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    [apply, qc],
  );
  const markAllRead = useCallback(async () => {
    apply(null);
    const { error } = await rpc("mark_notifications_read", { p_ids: null });
    if (error) void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  }, [apply, qc]);
  return { markRead, markAllRead };
};

/** One realtime subscription per signed-in app: INSERT / UPDATE → refetch. Mount once (App level). */
export const useNotificationsRealtime = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);
};

/**
 * Client-side producers (Lovable demo only — docs/backend-boundary.md 🔴):
 *  - Boost check tier (useRealtimeRiskMetrics riskRatio ≥ 80 → tight, ≥ 95 → soon):
 *    one notification per entry into a tier; leaving and re-entering fires again.
 *  - New sign-in: fires once per auth session id on SIGNED_IN.
 * The real platform's risk engine / auth service emit these server-side.
 */
export const useNotificationProducers = () => {
  const { user } = useAuth();
  const { riskRatio, hasPositions } = useRealtimeRiskMetrics();
  const tierRef = useRef<"healthy" | "tight" | "soon">("healthy");
  const episodeRef = useRef<string>("");

  useEffect(() => {
    if (!user || !hasPositions) {
      tierRef.current = "healthy";
      return;
    }
    const tier = riskRatio >= 95 ? "soon" : riskRatio >= 80 ? "tight" : "healthy";
    if (tier === tierRef.current) return;
    const prev = tierRef.current;
    tierRef.current = tier;
    if (tier === "healthy") return;
    // New episode when coming from healthy; escalation inside an episode reuses it.
    if (prev === "healthy") episodeRef.current = new Date().toISOString().slice(0, 16);
    void rpc("notify_self", {
      p_type: `autoclose.${tier}`,
      p_params: { ratio: Math.round(riskRatio * 100) / 100 },
      p_dedupe: `autoclose.${tier}:${user.id}:${episodeRef.current}`,
    });
  }, [user, riskRatio, hasPositions]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" || !session) return;
      let sid = "";
      try {
        sid = String(JSON.parse(atob(session.access_token.split(".")[1])).session_id ?? "");
      } catch {
        sid = "";
      }
      if (!sid) return;
      const ua = navigator.userAgent;
      const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
      const os = /Mac OS/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "Unknown OS";
      void rpc("notify_self", {
        p_type: "account.new_session",
        p_params: { device: `${browser} · ${os}`, location: "", at: new Date().toISOString() },
        p_dedupe: `account.new_session:${sid}`,
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);
};
