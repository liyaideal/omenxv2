import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileHome from "./pages/MobileHome";
import TradingCharts from "./pages/TradingCharts";
import TradeOrder from "./pages/TradeOrder";
import SpotTrading from "./pages/SpotTrading";
import LiteContractTrade from "./pages/lite/LiteContractTrade";
import LiteSpotTrade from "./pages/lite/LiteSpotTrade";
import OrderPreview from "./pages/OrderPreview";
import DesktopTrading from "./pages/DesktopTrading";
import StyleGuide from "./pages/StyleGuide/index";
import StyleGuidePreview from "./pages/StyleGuide/preview/StyleGuidePreview";

import EventsPage from "./pages/EventsPage";
import LiteEventsPage from "./pages/lite/LiteEventsPage";
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
import { SurfaceProvider, useSurface } from "./contexts/SurfaceContext";
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
  const { surface } = useSurface();
  if (surface === "lite") return <LiteEventsPage />;
  return isMobile ? <MobileHome /> : <EventsPage />;
};

const EventsRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? <LiteEventsPage /> : <EventsPage />;
};

// /trade forks by surface: Lite renders the Boost contract page,
// Pro renders the existing terminals untouched.
const TradingPage = () => {
  const { surface } = useSurface();
  const isMobile = useIsMobile();
  if (surface === "lite") return <LiteContractTrade />;
  return isMobile ? <TradingCharts /> : <DesktopTrading />;
};

const TradeOrderPage = () => {
  const isMobile = useIsMobile();
  const { surface } = useSurface();
  // Lite users must never land on the Pro TradeOrder terminal.
  if (surface === "lite") return <Navigate to="/trade" replace />;
  return isMobile ? <TradeOrder /> : <DesktopTrading />;
};

// /spot forks by surface: Lite renders its own odds-forward page,
// Pro renders the existing SpotTrading terminal untouched.
const SpotRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? <LiteSpotTrade /> : <SpotTrading />;
};

// /resolved forks by surface. Lite has no settled browser any more — a settled
// event's only home is its own trade page — so old links redirect there.
const ResolvedRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? <Navigate to="/events" replace /> : <ResolvedPage />;
};

/** Resolves the event's product line, then sends the reader to its trade page. */
const LiteSettledRedirect = () => {
  const { eventId = "" } = useParams();
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!eventId) {
        if (alive) setTo("/events");
        return;
      }
      const { data } = await supabase
        .from("events")
        .select("id, product_lines")
        .eq("id", eventId)
        .maybeSingle();
      if (!alive) return;
      if (!data) {
        setTo("/events");
        return;
      }
      const lines = Array.isArray(data.product_lines)
        ? (data.product_lines as string[])
        : [];
      setTo(
        lines.includes("spot")
          ? `/spot?event=${data.id}`
          : `/trade?event=${data.id}`,
      );
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  if (!to) return <div className="min-h-screen bg-background" />;
  return <Navigate to={to} replace />;
};

const ResolvedDetailRoute = () => {
  const { surface } = useSurface();
  return surface === "lite" ? <LiteSettledRedirect /> : <ResolvedEventDetail />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimePricesProvider>
      <SurfaceProvider>
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
              <Route path="/spot" element={<SpotRoute />} />
              <Route path="/order-preview" element={<OrderPreview />} />
              <Route path="/events" element={<EventsRoute />} />
              <Route path="/resolved" element={<ResolvedRoute />} />
              <Route path="/resolved/:eventId" element={<ResolvedDetailRoute />} />
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
      </SurfaceProvider>
    </RealtimePricesProvider>
  </QueryClientProvider>
);

export default App;
