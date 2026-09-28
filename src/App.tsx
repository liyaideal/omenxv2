import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TradingCharts from "./pages/TradingCharts";
import TradeOrder from "./pages/TradeOrder";
import SpotTrading from "./pages/SpotTrading";
import SpotTradingCharts from "./pages/SpotTradingCharts";
import SpotTradeOrder from "./pages/SpotTradeOrder";

import LiteContractTrade from "./pages/lite/LiteContractTrade";
import LiteSpotTrade from "./pages/lite/LiteSpotTrade";
import OrderPreview from "./pages/OrderPreview";
import DesktopTrading from "./pages/DesktopTrading";
import StyleGuide from "./pages/StyleGuide/index";
import StyleGuidePreview from "./pages/StyleGuide/preview/StyleGuidePreview";

import LiteEventsPage from "./pages/lite/LiteEventsPage";
import Leaderboard from "./pages/Leaderboard";
import {
  PortfolioRoute,
  PortfolioSettlementsRoute,
  PortfolioAirdropsRoute,
  SettlementDetailRoute,
} from "./pages/PortfolioRoutes";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import RecoveryRequest from "./pages/RecoveryRequest";
import RecoveryRequestDetail from "./pages/RecoveryRequestDetail";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import LiteRewardsPage from "./pages/lite/LiteRewardsPage";
import LiteCampaignDetailPage from "./pages/lite/LiteCampaignDetailPage";
import { CampaignAttribution } from "@/components/campaigns/CampaignAttribution";
import Vouchers from "./pages/Vouchers";
import GlossaryPage from "./pages/GlossaryPage";
import GlossaryEnPage from "./pages/GlossaryEnPage";
import GlossaryCnPage from "./pages/GlossaryCnPage";
import InsightsPage from "./pages/insights/InsightsPage";
import InsightsDailyPage from "./pages/insights/InsightsDailyPage";
import InsightsCategoryPage from "./pages/insights/InsightsCategoryPage";
import InsightsAssetPage from "./pages/insights/InsightsAssetPage";
import InsightsFamilyPage from "./pages/insights/InsightsFamilyPage";
import InsightsSportsPage from "./pages/insights/InsightsSportsPage";
import InsightsAccuracyPage from "./pages/insights/InsightsAccuracyPage";
import DevelopersPage from "./pages/DevelopersPage";
import AffiliatePage from "./pages/AffiliatePage";
import { ScrollToTop } from "./components/ScrollToTop";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import TransparencyPage from "./pages/TransparencyPage";
import ApiManagement from "./pages/ApiManagement";
import HedgeLanding from "./pages/HedgeLanding";

import CampaignStyleGuide from "./pages/CampaignStyleGuide";
import NotFound from "./pages/NotFound";
import { ExternalRedirect } from "./components/ExternalRedirect";
import { useT } from "./i18n";
import { HELP_CENTER_URL, HELP_FAQ_URL, HELP_GUIDE_URL } from "./lib/site";
import { useIsMobile } from "./hooks/use-mobile";
import { RealtimePricesProvider } from "./contexts/RealtimePricesContext";
import { SurfaceProvider, useSurface } from "./contexts/SurfaceContext";
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
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background [&_footer]:relative [&_footer]:left-1/2 [&_footer]:w-screen [&_footer]:-translate-x-1/2">
        {children}
      </div>
    );
  }
  
  return <div className="min-h-screen bg-background">{children}</div>;
};

// Route component that shows different pages based on device
// D6'-1: outside the trade pages there is no mode any more — always Lite.
const HomePage = () => <LiteEventsPage />;

const EventsRoute = () => <LiteEventsPage />;

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

// /spot forks by surface: Lite renders its own odds-forward page, Pro renders
// the desktop terminal or (SP-2) the mobile Charts view.
const SpotRoute = () => {
  const { surface } = useSurface();
  const isMobile = useIsMobile();
  if (surface === "lite") return <LiteSpotTrade />;
  return isMobile ? <SpotTradingCharts /> : <SpotTrading />;
};

// /spot/order — the mobile Pro order sub-page. Lite has no sub-page; desktop
// Pro keeps everything on the one terminal.
const SpotOrderRoute = () => {
  const { surface } = useSurface();
  const isMobile = useIsMobile();
  if (surface === "lite") return <Navigate to="/spot" replace />;
  return isMobile ? <SpotTradeOrder /> : <SpotTrading />;
};


// /resolved forks by surface. Lite has no settled browser any more — a settled
// event's only home is its own trade page — so old links redirect there.
const ResolvedRoute = () => <Navigate to="/events" replace />;

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
          : lines.includes("futures")
            ? `/trade?event=${data.id}`
            : "/events",
      );
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  if (!to) return <div className="min-h-screen bg-background" />;
  return <Navigate to={to} replace />;
};

const ResolvedDetailRoute = () => <LiteSettledRedirect />;

/**
 * Language-keyed subtree (i18n phase B, 2026-09-28): remounting the route tree
 * on language change lets every component use the module-level `t()` from
 * "@/i18n" without subscribing; `useT()` stays available for hot re-render
 * inside overlays that must not lose state.
 */
const LanguageKeyed = ({ children }: { children: React.ReactNode }) => {
  const { code } = useT();
  return <div key={code} className="contents">{children}</div>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimePricesProvider>
      <SurfaceProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <OrderSimulationRunner />
          <CampaignAttribution />
          <LanguageKeyed>
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
              <Route path="/spot/order" element={<SpotOrderRoute />} />

              <Route path="/order-preview" element={<OrderPreview />} />
              <Route path="/events" element={<EventsRoute />} />
              <Route path="/resolved" element={<ResolvedRoute />} />
              <Route path="/resolved/:eventId" element={<ResolvedDetailRoute />} />
              <Route path="/portfolio" element={<PortfolioRoute />} />
              <Route path="/portfolio/settlements" element={<PortfolioSettlementsRoute />} />
              <Route path="/portfolio/airdrops" element={<PortfolioAirdropsRoute />} />
              <Route path="/portfolio/settlement/:settlementId" element={<SettlementDetailRoute />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/wallet/recovery" element={<RecoveryRequest />} />
              <Route path="/wallet/recovery/:id" element={<RecoveryRequestDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/rewards" element={<LiteRewardsPage />} />
              <Route path="/rewards/campaign/:campaignId" element={<LiteCampaignDetailPage />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings/transparency" element={<TransparencyPage />} />
              <Route path="/settings/api" element={<ApiManagement />} />
              <Route path="/style-guide" element={<StyleGuide />} />
              {/* Help-center pages (CPO 2026-09-28): no in-app page, old paths forward out. */}
              <Route path="/faq" element={<ExternalRedirect to={HELP_FAQ_URL} />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/glossary/en" element={<GlossaryEnPage />} />
              <Route path="/glossary/cn" element={<GlossaryCnPage />} />
              <Route path="/about" element={<ExternalRedirect to={HELP_CENTER_URL} />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/insights/daily/:date" element={<InsightsDailyPage />} />
              <Route path="/insights/weekly/:week" element={<Navigate to="/insights/accuracy" replace />} />
              <Route path="/insights/category/:slug" element={<InsightsCategoryPage />} />
              <Route path="/insights/crypto" element={<InsightsFamilyPage family="crypto" />} />
              <Route path="/insights/stocks" element={<InsightsFamilyPage family="stocks" />} />
              <Route path="/insights/sports" element={<InsightsSportsPage />} />
              <Route path="/insights/sports/:sport" element={<InsightsSportsPage />} />
              <Route path="/insights/accuracy" element={<InsightsAccuracyPage />} />
              <Route path="/insights/accuracy/:month" element={<InsightsAccuracyPage />} />
              <Route path="/insights/crypto/:slug" element={<InsightsAssetPage family="crypto" />} />
              <Route path="/insights/stocks/:slug" element={<InsightsAssetPage family="stocks" />} />
              <Route path="/methodology" element={<ExternalRedirect to={HELP_GUIDE_URL} />} />
              <Route path="/developers" element={<DevelopersPage />} />
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="*" element={<NotFound />} />
                  </Routes>
                </ResponsiveLayout>
              }
            />
          </Routes>
          </LanguageKeyed>
        </BrowserRouter>
      </TooltipProvider>
      </SurfaceProvider>
    </RealtimePricesProvider>
  </QueryClientProvider>
);

export default App;
