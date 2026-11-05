// ============================================================
// /arcade — Quick Play v2: BTC 30-second calls on the real three-exchange
// index. CPO 2026-10-27/28 (研发稿 v1.0 + her amendments), mock
// claude.ai/artifact/6AmwMxsb3aNDUgVDZ8epWJ v26.
// Full-screen game page (DESIGN.md §Addendum 2026-10-19): no site header,
// no footer; the logo plate is the exit; the Lite auth dialog gates chips.
//
// React owns the shell and the data seams; the cabinet runs as a DOM engine
// (arcadeEngine.ts) mounted into `.arcade-root`. Money moves server-side
// (arcade_place / arcade_cancel / arcade_settle_*), so the page only
// refetches the profile when the engine says the balance changed.
// Other tables (ETH / SOL / US stocks) are hidden behind ARCADE_LIVE_TABLES
// until their price feeds exist (CPO 2026-10-27: 先只上 BTC 30s).
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import { ARCADE_DESKTOP, ARCADE_MOBILE, ARCADE_OVERLAYS } from "./arcadeMarkup";
import { mountArcade, type ArcadeApi, type ArcadeComboShare, type ArcadeRunShare } from "./arcadeEngine";
import { ArcadeComboShareCard, ArcadeShareCard } from "@/components/lite/arcade/ArcadeShareCard";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { TransferDialog } from "@/components/wallet/TransferDialog";
import "./arcade.css";
import "./arcade-v2.css";

/** the session supabase-js keeps in localStorage (`sb-<ref>-auth-token`), read without touching auth itself */
const readStoredUser = (): { known: boolean; userId: string | null } => {
  try {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    if (!key) return { known: true, userId: null };
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    const sess = raw?.currentSession ?? raw;
    const id = sess?.user?.id ?? null;
    return { known: true, userId: typeof id === "string" ? id : null };
  } catch {
    return { known: false, userId: null };
  }
};

/** tables the cabinet can show; only BTC has a real index feed today */
export const ARCADE_LIVE_TABLES = ["BTC"] as const;

const ArcadePage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { spotBalance, username, refetchProfile, isLoading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [shareRun, setShareRun] = useState<ArcadeRunShare | null>(null);
  const [shareCombo, setShareCombo] = useState<ArcadeComboShare | null>(null);
  // Deposit / Transfer open in place on desktop (CPO 2026-10-29: leaving for
  // /wallet broke the flow); phones keep the full-screen deposit flow.
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ArcadeApi | null>(null);
  // item 12 (2026-11-05): until the stored session has been read, the cabinet shows neither a signed-in
  // nor a signed-out account — balance "—", no Sign in key, no gate. This only *reads* the session (12.5);
  // useAuth stays the owner of sign-in itself.
  // The stored session is first read straight from localStorage (synchronous, no auth lock): that
  // alone removes the flash. getSession() then confirms it; if it is slow (another tab of the site
  // holds the auth lock) or storage is unreadable, a 3 s cap ends the pending state either way.
  const [stored] = useState(readStoredUser);
  const [authKnown, setAuthKnown] = useState(stored.known);
  const [storedUserId, setStoredUserId] = useState<string | null>(stored.userId);
  useEffect(() => {
    let alive = true;
    const cap = setTimeout(() => alive && setAuthKnown(true), 3000);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setStoredUserId(data.session?.user?.id ?? null);
        setAuthKnown(true);
      })
      .catch(() => alive && setAuthKnown(true));
    return () => {
      alive = false;
      clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    ensureArcadeFonts();
  }, []);

  const userId = user?.id ?? (authKnown ? storedUserId : null);
  const onBalance = useCallback(() => {
    // the server moved money; pick it up without racing the engine's own readout
    setTimeout(() => void refetchProfile(), 400);
  }, [refetchProfile]);

  const api = useMemo<ArcadeApi>(
    () => ({
      isMobile: !!isMobile,
      userId,
      authKnown,
      balanceKnown: !profileLoading,
      requireAuth: () => setAuthOpen(true),
      getBalance: () => spotBalance,
      onBalance,
      exit: () => navigate("/events"),
      deposit: () => (isMobile ? navigate("/deposit") : setDepositOpen(true)),
      transfer: () => (isMobile ? navigate("/wallet") : setTransferOpen(true)),
      portfolio: () => navigate("/portfolio?tab=settled&from=quick-play"),
      share: (run) => setShareRun(run),
      shareCombo: (combo) => setShareCombo(combo),
      // combo vouchers (every 3 wins in a row) live in Rewards › Position Vouchers (CPO 2026-11-02)
      vouchers: () => navigate("/rewards?tab=vouchers"),
      username: username || "you",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile, userId, authKnown, profileLoading, onBalance, username],
  );
  apiRef.current = api;

  // ---- mount the engine once per surface ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root || isMobile === undefined) return;
    root.innerHTML = ARCADE_OVERLAYS + (isMobile ? ARCADE_MOBILE : ARCADE_DESKTOP);
    // the engine reads api through a stable proxy so re-renders never remount
    const proxy = new Proxy({} as ArcadeApi, { get: (_t, k) => (apiRef.current as any)?.[k] });
    const unmount = mountArcade(root, proxy);
    return () => {
      unmount();
      root.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // ---- React → engine: balance + sign-in ----
  useEffect(() => {
    // the strip shows — until the profile has loaded once; then every change of the figure
    if (!profileLoading) (rootRef.current as any)?.__arcade?.setBalance(spotBalance);
  }, [spotBalance, profileLoading]);
  // once the sign-in state is known, and on every later change of account, the engine re-reads it
  // (setUser boots the account's session once; it is a no-op for an account already loaded)
  const authKey = authKnown ? userId ?? "guest" : "pending";
  useEffect(() => {
    if (authKey === "pending") return;
    (rootRef.current as any)?.__arcade?.setUser();
  }, [authKey]);

  if (isMobile === undefined) return null;

  return (
    <div className="min-h-screen bg-black">
      <div ref={rootRef} className={`arcade-root${isMobile ? " is-m" : ""}`} style={isMobile ? ({ "--arcade-top": "0px" } as React.CSSProperties) : undefined} />
      {/* phones get the site's bottom-sheet sign-in, desktop the dialog (QA 2026-10-30) */}
      {isMobile ? <AuthSheet open={authOpen} onOpenChange={setAuthOpen} /> : <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />}
      <ArcadeShareCard run={shareRun} onClose={() => setShareRun(null)} />
      <ArcadeComboShareCard combo={shareCombo} onClose={() => setShareCombo(null)} />
      {!isMobile && (
        <>
          <DepositDialog
            open={depositOpen}
            initialAccount="spot"
            onOpenChange={(o) => {
              setDepositOpen(o);
              if (!o) onBalance();
            }}
          />
          <TransferDialog
            open={transferOpen}
            onOpenChange={(o) => {
              setTransferOpen(o);
              if (!o) onBalance();
            }}
            initialDirection="to_spot"
          />
        </>
      )}
    </div>
  );
};

export default ArcadePage;
