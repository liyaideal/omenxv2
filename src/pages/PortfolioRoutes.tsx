// ============================================================
// Surface dispatchers for the portfolio family (工单 §6).
// Lite → new tabbed /portfolio; Pro → untouched legacy pages.
// Legacy lite entries (/portfolio/settlements, /portfolio/airdrops) redirect
// into the new structure.
// ============================================================
import { Navigate } from "react-router-dom";
import { useSurface } from "@/contexts/SurfaceContext";
import Portfolio from "./Portfolio";
import PortfolioSettlements from "./PortfolioSettlements";
import PortfolioAirdrops from "./PortfolioAirdrops";
import SettlementDetail from "./SettlementDetail";
import LitePortfolio from "./lite/LitePortfolio";
import LiteSettlementDetail from "./lite/LiteSettlementDetail";

export const PortfolioRoute = () => {
  const { surface } = useSurface();
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
