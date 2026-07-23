import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MobileHome from "./pages/MobileHome";
import TradingCharts from "./pages/TradingCharts";
import TradeOrder from "./pages/TradeOrder";
import SpotTrading from "./pages/SpotTrading";
import OrderPreview from "./pages/OrderPreview";
import DesktopTrading from "./pages/DesktopTrading";
import StyleGuide from "./pages/StyleGuide/index";
import StyleGuidePreview from "./pages/StyleGuide/preview/StyleGuidePreview";

import EventsPage from "./pages/EventsPage";
import ResolvedPage from "./pages/ResolvedPage";
import ResolvedEventDetail from "./pages/ResolvedEventDetail";
import Leaderboard from "./pages/Leaderboard";
import Portfolio from "./pages/Portfolio";
import PortfolioSettlements from "./pages/PortfolioSettlements";
import PortfolioAirdrops from "./pages/PortfolioAirdrops";
import SettlementDetail from "./pages/SettlementDetail";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import RecoveryRequest from "./pages/RecoveryRequest";
import RecoveryRequestDetail from "./pages/RecoveryRequestDetail";
import Settings from "./pages/Settings";
import Rewards from "./pages/Rewards";
import Vouchers from "./pages/Vouchers";
import FaqPage from "./pages/FaqPage";
import GlossaryPage from "./pages/GlossaryPage";
import GlossaryEnPage from "./pages/GlossaryEnPage";
import GlossaryCnPage from "./pages/GlossaryCnPage";
import AboutPage from "./pages/AboutPage";
import InsightsPage from "./pages/InsightsPage";
import MethodologyPage from "./pages/MethodologyPage";
import DevelopersPage from "./pages/DevelopersPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import TransparencyPage from "./pages/TransparencyPage";
import ApiManagement from "./pages/ApiManagement";
import HedgeLanding from "./pages/HedgeLanding";

import CampaignStyleGuide from "./pages/CampaignStyleGuide";
import NotFound from "./pages/NotFound";
import { useIsMobile } from "./hooks/use-mobile";
import { RealtimePricesProvider } from "./contexts/RealtimePricesContext";
import { AirdropNotificationToast } from "./components/AirdropNotificationToast";
import { SportsLauncher } from "./components/SportsLauncher";
import { useOrderSimulation } from "./hooks/useOrderSimulation";

const queryClient = new QueryClient();

// Global simulation runner
const OrderSimulationRunner = () => {
  useOrderSimulation();
  return null;
};

// Responsive layout wrapper
const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <div className="max-w-md mx-auto min-h-screen bg-background">{children}</div>;
  }
  
  return <div className="min-h-screen bg-background">{children}</div>;
};

// Route component that shows different pages based on device
const HomePage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHome /> : <EventsPage />;
};

const TradingPage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <TradingCharts /> : <DesktopTrading />;
};

const TradeOrderPage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <TradeOrder /> : <DesktopTrading />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimePricesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OrderSimulationRunner />
          <AirdropNotificationToast />
          <Routes>
            {/* Full-width landing pages (rendered outside max-w-md mobile shell) */}
            <Route path="/hedge" element={<Navigate to="/campaign/world-cup-polymarket-hedge" replace />} />
            <Route path="/campaign/world-cup-polymarket-hedge" element={<HedgeLanding />} />
            <Route path="/mainnet-launch" element={<Navigate to="/" replace />} />
            <Route path="/campaign-style-guide" element={<CampaignStyleGuide />} />
            <Route path="/style-guide/preview" element={<StyleGuidePreview />} />
            <Route
              path="*"
              element={
                <ResponsiveLayout>
                  <SportsLauncher />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
              <Route path="/trade" element={<TradingPage />} />
              <Route path="/trade/order" element={<TradeOrderPage />} />
              <Route path="/spot" element={<SpotTrading />} />
              <Route path="/order-preview" element={<OrderPreview />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/resolved" element={<ResolvedPage />} />
              <Route path="/resolved/:eventId" element={<ResolvedEventDetail />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio/settlements" element={<PortfolioSettlements />} />
              <Route path="/portfolio/airdrops" element={<PortfolioAirdrops />} />
              <Route path="/portfolio/settlement/:settlementId" element={<SettlementDetail />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/wallet/recovery" element={<RecoveryRequest />} />
              <Route path="/wallet/recovery/:id" element={<RecoveryRequestDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/transparency" element={<TransparencyPage />} />
              <Route path="/settings/api" element={<ApiManagement />} />
              <Route path="/style-guide" element={<StyleGuide />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/glossary/en" element={<GlossaryEnPage />} />
              <Route path="/glossary/cn" element={<GlossaryCnPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="/developers" element={<DevelopersPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="*" element={<NotFound />} />
                  </Routes>
                </ResponsiveLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RealtimePricesProvider>
  </QueryClientProvider>
);

export default App;
