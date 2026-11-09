// useSignedIn — "is a user signed in", known on the first render.
// supabase-js keeps the session in localStorage (`sb-<ref>-auth-token`), so the
// first paint reads that synchronously (a signed-in viewer never sees the guest
// state flash), then follows the real auth state.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const storedSignedIn = (): boolean => {
  try {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    if (!key) return false;
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    const sess = raw?.currentSession ?? raw;
    return typeof sess?.user?.id === "string";
  } catch {
    return false;
  }
};

export const useSignedIn = (): boolean => {
  const [signedIn, setSignedIn] = useState<boolean>(storedSignedIn);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    supabase.auth.getSession().then(({ data: d }) => setSignedIn(!!d.session?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
};
