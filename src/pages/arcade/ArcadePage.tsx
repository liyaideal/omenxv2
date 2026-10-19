// ============================================================
// /arcade — Quick Play: 30s / 1m Up/Down on the spot rail, cabinet skin.
// CPO 2026-10-19. Third page type (DESIGN.md §Addendum 2026-10-19): a
// FULL-SCREEN game page — no site header, no footer (CPO: the cabinet looked
// stuck in the middle with them). The cabinet carries its own exit key
// (✕ → /events); the Lite auth dialog still gates chips.
//
// React owns the shell and the data seams; the designer's cabinet runs as a
// DOM engine (arcadeEngine.ts) mounted into `.arcade-root`. Orders go
// through executeSpotTrade exactly like the Lite spot panel (fee on the
// chip, qty = floor((chip − fee) / price)); cash-out / flip are spot SELLs
// at the live share price, so realised P&L is real (not the stored mark).
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useReferral } from "@/hooks/useReferral";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { executeSpotTrade } from "@/services/tradingService";
import { ARCADE_ASSETS, ARCADE_TFS, type ArcadeTf } from "@/lib/arcade/arcadeTables";
import { arcadeEventName, type ArcadeRoundRow } from "@/lib/arcade/arcadePath";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import { ARCADE_DESKTOP, ARCADE_MOBILE, ARCADE_OVERLAYS } from "./arcadeMarkup";
import { mountArcade, type ArcadeApi, type ArcadeHolding, type Side, colorUp } from "./arcadeEngine";
import "./arcade.css";

const SITE_URL = "https://omenxv2.lovable.app";

const ArcadePage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { spotBalance, username, avatarUrl, deductSpotBalance, addSpotBalance, refetchProfile } = useUserProfile();
  const { referralLink } = useReferral();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ArcadeApi | null>(null);

  const symbol = (params.get("table") || "BTC").toUpperCase() in ARCADE_ASSETS ? (params.get("table") || "BTC").toUpperCase() : "BTC";
  const tfParam = params.get("tf") as ArcadeTf | null;
  const tf: ArcadeTf = tfParam && ARCADE_TFS.includes(tfParam) ? tfParam : ARCADE_ASSETS[symbol].kind === "stock" ? "1m" : "30s";

  useEffect(() => {
    ensureArcadeFonts();
  }, []);

  // ---- data seams the engine calls ----
  const userId = user?.id ?? null;
  const buy = useCallback<ArcadeApi["buy"]>(
    async ({ round, side, price, qty, fee, amount }) => {
      if (!userId) throw new Error("Sign in to play");
      const res = await executeSpotTrade(userId, {
        eventName: arcadeEventName(round),
        optionLabel: side === "u" ? "Up" : "Down",
        optionId: `${round.id}-${side === "u" ? "up" : "down"}`,
        side: "buy",
        price,
        quantity: qty,
        fee,
      });
      void amount;
      if (res.balanceDelta < 0) await deductSpotBalance(-res.balanceDelta);
      else if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
      const p: any = res.position;
      return { balanceDelta: res.balanceDelta, positionId: p?.id, size: p ? Number(p.size) : undefined, margin: p ? Number(p.margin) : undefined, entry: p ? Number(p.entry_price) : undefined };
    },
    [userId, deductSpotBalance, addSpotBalance],
  );
  const sell = useCallback<ArcadeApi["sell"]>(
    async ({ round, side, price, qty }) => {
      if (!userId) throw new Error("Sign in to play");
      const res = await executeSpotTrade(userId, {
        eventName: arcadeEventName(round),
        optionLabel: side === "u" ? "Up" : "Down",
        optionId: `${round.id}-${side === "u" ? "up" : "down"}`,
        side: "sell",
        price,
        quantity: qty,
      });
      if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
      return { balanceDelta: res.balanceDelta, realizedPnl: (res as any).realizedPnl };
    },
    [userId, addSpotBalance],
  );
  const loadHolding = useCallback<ArcadeApi["loadHolding"]>(
    async (round: ArcadeRoundRow): Promise<ArcadeHolding | null> => {
      if (!userId) return null;
      const { data } = await supabase
        .from("positions")
        .select("id, option_id, size, margin, entry_price")
        .eq("user_id", userId)
        .eq("product_line", "spot")
        .eq("status", "Open")
        .in("option_id", [`${round.id}-up`, `${round.id}-down`])
        .limit(1);
      const p = data?.[0];
      if (!p) return null;
      const side: Side = p.option_id.endsWith("-up") ? "u" : "d";
      const margin = Number(p.margin);
      return { side, sh: Number(p.size), margin, avg: Number(p.entry_price), chips: colorUp(margin), positionId: p.id };
    },
    [userId],
  );
  const loadToday = useCallback<ArcadeApi["loadToday"]>(async () => {
    const empty = { net: 0, won: 0, lost: 0, last: [] as { s: Side; w: boolean; pnl: number; t: number }[] };
    if (!userId) return empty;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("positions")
      .select("option_id, pnl, winning_commission, closed_at")
      .eq("user_id", userId)
      .eq("product_line", "spot")
      .eq("status", "Closed")
      .like("option_id", "arcade-%")
      .gte("closed_at", start.toISOString())
      .order("closed_at", { ascending: true })
      .limit(500);
    const rows = data || [];
    let net = 0,
      won = 0,
      lost = 0;
    const last = rows.map((r) => {
      const pnl = Number(r.pnl || 0) - Number(r.winning_commission || 0);
      net += pnl;
      if (pnl >= 0) won++;
      else lost++;
      return { s: (r.option_id.endsWith("-up") ? "u" : "d") as Side, w: pnl >= 0, pnl, t: new Date(r.closed_at).getTime() };
    });
    return { net, won, lost, last: last.slice(-10) };
  }, [userId]);

  const api = useMemo<ArcadeApi>(
    () => ({
      isMobile: !!isMobile,
      userId,
      requireAuth: () => setAuthOpen(true),
      getBalance: () => spotBalance,
      buy,
      sell,
      loadHolding,
      loadToday,
      referralLink: referralLink || SITE_URL,
      exit: () => navigate("/events"),
      username: username || "you",
      avatarUrl,
      onSettled: () => setTimeout(() => void refetchProfile(), 35000),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile, userId, buy, sell, loadHolding, loadToday, referralLink, username, avatarUrl],
  );
  apiRef.current = api;

  // ---- mount the engine once per surface ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root || isMobile === undefined) return;
    root.innerHTML = ARCADE_OVERLAYS + (isMobile ? ARCADE_MOBILE : ARCADE_DESKTOP);
    // the engine reads api through a stable proxy so re-renders never remount
    const proxy = new Proxy({} as ArcadeApi, { get: (_t, k) => (apiRef.current as any)?.[k] });
    const unmount = mountArcade(root, proxy, {
      symbol,
      tf,
      onTableChange: (s, t) => setParams({ table: s, tf: t }, { replace: true }),
    });
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
  useEffect(() => {
    (rootRef.current as any)?.__arcade?.setUser();
  }, [userId]);

  if (isMobile === undefined) return null;

  return (
    <div className="min-h-screen bg-black">
      <div ref={rootRef} className={`arcade-root${isMobile ? " is-m" : ""}`} style={isMobile ? ({ "--arcade-top": "0px" } as React.CSSProperties) : undefined} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default ArcadePage;
