import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";

const LOCAL_KEY = "trading_favorites";

const getLocalWatchlist = (): Set<string> => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
};

const saveLocalWatchlist = (set: Set<string>) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...set]));
};

export const useWatchlist = () => {
  const { user } = useAuth();
  const openAuthPrompt = useAuthFlowStore((s) => s.openPrompt);
  const [ids, setIds] = useState<Set<string>>(getLocalWatchlist);
  const [loaded, setLoaded] = useState(false);

  // Fetch from DB when logged in
  useEffect(() => {
    if (!user) {
      setIds(getLocalWatchlist());
      setLoaded(true);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("user_watchlist")
        .select("event_id")
        .eq("user_id", user.id);

      const dbSet = new Set((data || []).map((r) => r.event_id));

      // Merge localStorage → DB on first login
      const localSet = getLocalWatchlist();
      const toInsert = [...localSet].filter((id) => !dbSet.has(id));
      if (toInsert.length > 0) {
        await supabase.from("user_watchlist").insert(
          toInsert.map((event_id) => ({ user_id: user.id, event_id }))
        );
        toInsert.forEach((id) => dbSet.add(id));
        // Clear localStorage after merge
        localStorage.removeItem(LOCAL_KEY);
      }

      setIds(dbSet);
      setLoaded(true);
    };

    fetch();
  }, [user?.id]);

  const toggle = useCallback(
    async (eventId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();

      // Require auth for watchlist
      if (!user) {
        toast.info("Sign in to use Watchlist", {
          description: "Save markets and access them across devices.",
        });
        openAuthPrompt();
        return;
      }

      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(eventId)) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }
        if (prev.has(eventId)) {
          supabase
            .from("user_watchlist")
            .delete()
            .eq("user_id", user.id)
            .eq("event_id", eventId)
            .then();
        } else {
          supabase
            .from("user_watchlist")
            .insert({ user_id: user.id, event_id: eventId })
            .then();
        }
        return next;
      });
    },
    [user, openAuthPrompt]
  );

  const isWatched = useCallback((eventId: string) => ids.has(eventId), [ids]);

  return { watchlist: ids, toggle, isWatched, loaded };
};
