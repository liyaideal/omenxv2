import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import StyleGuidePreview from "./StyleGuidePreview";

/**
 * Slim entry used ONLY by /style-guide/preview iframes.
 *
 * Deliberately does NOT mount the app-wide services that App.tsx does
 * (RealtimePricesProvider websocket, OrderSimulationRunner, AirdropNotificationToast,
 * CampaignAttribution, SportsLauncher, Toasters) and does not import App.tsx,
 * so the preview bundle never pulls the full page module graph.
 *
 * Context deps of the preview registry are all optional-safe:
 *  - useRealtimePricesOptional() → returns null without a provider
 *  - useSurface() → falls back to "lite" without a provider
 */
const queryClient = new QueryClient();

const PreviewApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/style-guide/preview" element={<StyleGuidePreview />} />
          <Route path="*" element={<StyleGuidePreview />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default PreviewApp;