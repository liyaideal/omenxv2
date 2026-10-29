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
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import { ARCADE_DESKTOP, ARCADE_MOBILE, ARCADE_OVERLAYS } from "./arcadeMarkup";
import { mountArcade, type ArcadeApi, type ArcadeRunShare } from "./arcadeEngine";
import { ArcadeShareCard } from "@/components/lite/arcade/ArcadeShareCard";
import "./arcade.css";
import "./arcade-v2.css";

/** tables the cabinet can show; only BTC has a real index feed today */
export const ARCADE_LIVE_TABLES = ["BTC"] as const;

const ArcadePage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { spotBalance, username, refetchProfile } = useUserProfile();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [shareRun, setShareRun] = useState<ArcadeRunShare | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ArcadeApi | null>(null);

  useEffect(() => {
    ensureArcadeFonts();
  }, []);

  const userId = user?.id ?? null;
  const onBalance = useCallback(() => {
    // the server moved money; pick it up without racing the engine's own readout
    setTimeout(() => void refetchProfile(), 400);
  }, [refetchProfile]);

  const api = useMemo<ArcadeApi>(
    () => ({
      isMobile: !!isMobile,
      userId,
      requireAuth: () => setAuthOpen(true),
      getBalance: () => spotBalance,
      onBalance,
      exit: () => navigate("/events"),
      deposit: () => navigate("/deposit"),
      transfer: () => navigate("/wallet"),
      portfolio: () => navigate("/portfolio?tab=settled&from=quick-play"),
      share: (run) => setShareRun(run),
      username: username || "you",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile, userId, onBalance, username],
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
    (rootRef.current as any)?.__arcade?.setBalance(spotBalance);
  }, [spotBalance]);
  const firstUser = useRef(true);
  useEffect(() => {
    if (firstUser.current) {
      firstUser.current = false;
      return;
    }
    (rootRef.current as any)?.__arcade?.setUser();
  }, [userId]);

  if (isMobile === undefined) return null;

  return (
    <div className="min-h-screen bg-black">
      <div ref={rootRef} className={`arcade-root${isMobile ? " is-m" : ""}`} style={isMobile ? ({ "--arcade-top": "0px" } as React.CSSProperties) : undefined} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <ArcadeShareCard run={shareRun} onClose={() => setShareRun(null)} />
    </div>
  );
};

export default ArcadePage;
