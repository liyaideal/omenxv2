import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { clearPortfolioReturnSurface } from "@/lib/portfolioReturn";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

export type Surface = "lite" | "pro";

interface SurfaceContextValue {
  surface: Surface;
  setSurface: (s: Surface) => void;
  toggle: () => void;
}

const SurfaceContext = createContext<SurfaceContextValue | undefined>(undefined);

const LS_KEY = "omenx_surface";

const readInitial = (): Surface => {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v === "pro" ? "pro" : "lite";
  } catch {
    return "lite";
  }
};

export const SurfaceProvider = ({ children }: { children: ReactNode }) => {
  // The user's stored preference. Never cleared on sign-out — it comes back
  // when they sign in again.
  const [storedSurface, setStoredSurface] = useState<Surface>(readInitial);
  // null = the initial session has not resolved yet.
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { profile } = useUserProfile();

  // Auth listener — guests are always Lite (D6'-1 · FIX8).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setHasSession(!!session);
      if (event === "SIGNED_OUT") {
        clearPortfolioReturnSurface();
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session));
    return () => subscription.unsubscribe();
  }, []);

  // Sync from profile once loaded (profile wins on first hydration)
  useEffect(() => {
    const ps = (profile as unknown as { preferred_surface?: string } | null)?.preferred_surface;
    if (ps === "lite" || ps === "pro") {
      setStoredSurface(ps);
      try { localStorage.setItem(LS_KEY, ps); } catch { /* ignore */ }
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived surface: guests are forced to Lite. While the session is still
  // unknown, a stored `pro` is honoured so signed-in users never flash Lite.
  const surface: Surface =
    hasSession === null
      ? storedSurface
      : hasSession
        ? storedSurface
        : "lite";

  const setSurface = useCallback((s: Surface) => {
    // Guests cannot select Pro.
    if (hasSession === false) return;
    setStoredSurface(s);
    try { localStorage.setItem(LS_KEY, s); } catch { /* ignore */ }
    const userId = profile?.user_id;
    if (userId) {
      // Best-effort persist; ignore failures (offline, RLS, missing column, etc.).
      supabase
        .from("profiles")
        .update({ preferred_surface: s })
        .eq("user_id", userId)
        .then(() => undefined, () => undefined);
    }
  }, [profile?.user_id, hasSession]);

  const toggle = useCallback(() => {
    if (hasSession === false) return;
    // A manual switch cancels any pending "return to Lite" intent.
    clearPortfolioReturnSurface();
    setSurface(surface === "lite" ? "pro" : "lite");
  }, [surface, setSurface, hasSession]);

  return (
    <SurfaceContext.Provider value={{ surface, setSurface, toggle }}>
      {children}
    </SurfaceContext.Provider>
  );
};

export const useSurface = (): SurfaceContextValue => {
  const ctx = useContext(SurfaceContext);
  if (!ctx) {
    // Safe fallback when consumed outside provider (e.g. isolated preview).
    return {
      surface: "lite",
      setSurface: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
};
