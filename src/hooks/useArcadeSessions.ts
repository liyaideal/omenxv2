// ============================================================
// Quick Play sessions for the Lite portfolio (CPO 2026-10-29).
// One sitting = a session (30 minutes without a call closes it — see
// src/lib/arcade/session.ts). The server groups the user's own calls;
// this hook only caches the list and pages one session's calls.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchMySessionCalls, fetchMySessions, type ArcadeCall, type ArcadeSession } from "@/lib/arcade/arcadeCalls";

export const ARCADE_SESSION_PAGE = 30;

export const useArcadeSessions = () => {
  const { user } = useAuth();
  return useQuery<ArcadeSession[]>({
    queryKey: ["arcade-sessions", user?.id ?? null],
    queryFn: () => fetchMySessions(200),
    enabled: !!user,
    staleTime: 15_000,
  });
};

/** One session's calls, newest first, 30 at a time behind "Load more". */
export const useArcadeSessionCalls = (sessionKey: string | undefined) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ArcadeCall[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(
    async (offset: number) => {
      if (!sessionKey || !user) return;
      setLoading(true);
      try {
        const page = await fetchMySessionCalls(sessionKey, ARCADE_SESSION_PAGE, offset);
        setRows((cur) => (offset === 0 ? page : [...cur, ...page]));
        setHasMore(page.length === ARCADE_SESSION_PAGE);
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [sessionKey, user],
  );

  useEffect(() => {
    setRows([]);
    setHasMore(false);
    void load(0);
  }, [load]);

  return { rows, hasMore, loading, error, loadMore: () => load(rows.length) };
};
