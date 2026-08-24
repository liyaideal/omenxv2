// ============================================================
// Surface dispatchers for the portfolio family (工单 §6).
// Lite → new tabbed /portfolio; Pro → untouched legacy pages.
// Legacy lite entries (/portfolio/settlements, /portfolio/airdrops) redirect
// into the new structure.
// ============================================================
import { useEffect } from "react";
import { Navigate, useNavigationType } from "react-router-dom";
import { useSurface } from "@/contexts/SurfaceContext";
import Portfolio from "./Portfolio";
import PortfolioSettlements from "./PortfolioSettlements";
import PortfolioAirdrops from "./PortfolioAirdrops";
import SettlementDetail from "./SettlementDetail";
import LitePortfolio from "./lite/LitePortfolio";
import LiteSettlementDetail from "./lite/LiteSettlementDetail";
import { takePortfolioReturnSurface } from "@/lib/portfolioReturn";

export const PortfolioRoute = () => {
  const { surface, setSurface } = useSurface();
  const navigationType = useNavigationType();

  // Coming BACK from a Pro terminal that was opened from the Lite portfolio
  // (the "orders waiting to fill" row): return the reader to Lite. Only on a
  // POP — on the outbound click this route briefly re-renders as Pro, and
  // consuming the flag there would bounce the reader into the Lite terminal.
  useEffect(() => {
    if (navigationType !== "POP") return;
    const back = takePortfolioReturnSurface();
    if (back === "lite" && surface !== "lite") setSurface("lite");
  }, [navigationType, surface, setSurface]);

  return surface === "lite" ? <LitePortfolio /> : <Portfolio />;
};

export const PortfolioSettlementsRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? (
    <Navigate to="/portfolio?tab=settled" replace />
  ) : (
    <PortfolioSettlements />
  );
};

export const PortfolioAirdropsRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? <Navigate to="/portfolio" replace /> : <PortfolioAirdrops />;
};

export const SettlementDetailRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? <LiteSettlementDetail /> : <SettlementDetail />;
};
