import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
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
  const [surface, setSurfaceState] = useState<Surface>(readInitial);
  const { profile } = useUserProfile();

  // Sync from profile once loaded (profile wins on first hydration)
  useEffect(() => {
    const ps = (profile as unknown as { preferred_surface?: string } | null)?.preferred_surface;
    if (ps === "lite" || ps === "pro") {
      setSurfaceState(ps);
      try { localStorage.setItem(LS_KEY, ps); } catch { /* ignore */ }
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSurface = useCallback((s: Surface) => {
    setSurfaceState(s);
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
  }, [profile?.user_id]);

  const toggle = useCallback(() => {
    setSurface(surface === "lite" ? "pro" : "lite");
  }, [surface, setSurface]);

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