// ============================================================
// Surface dispatchers for the portfolio family (工单 §6).
// Lite → new tabbed /portfolio; Pro → untouched legacy pages.
// Legacy lite entries (/portfolio/settlements, /portfolio/airdrops) redirect
// into the new structure.
// ============================================================
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
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

  // Coming back from a Pro terminal that was opened from the Lite portfolio
  // (the "orders waiting to fill" row): return the reader to Lite.
  useEffect(() => {
    const back = takePortfolioReturnSurface();
    if (back === "lite" && surface !== "lite") setSurface("lite");
  }, [surface, setSurface]);

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
