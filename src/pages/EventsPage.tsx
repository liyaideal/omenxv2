import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw, Star, ChevronDown, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { MobileStatusDropdown } from "@/components/EventFilters";
import { MobileActiveFilterDrawer } from "@/components/events/FilterChips";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/BottomNav";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { MobileHeader } from "@/components/MobileHeader";

import { AirdropHomepageModal } from "@/components/AirdropHomepageModal";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData, EventRow, ChgTimeframe, getChange, getVolume } from "@/hooks/useMarketListData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { EventTabs, EventTab } from "@/components/events/EventTabs";
import { FilterChips, FilterState } from "@/components/events/FilterChips";
import { ViewMode } from "@/components/events/ViewToggle";
import { ChgTimeframePicker } from "@/components/events/ChgTimeframePicker";
import { MarketListView } from "@/components/events/MarketListView";
import { MarketGridView } from "@/components/events/MarketGridView";
import { HotShelf } from "@/components/events/HotShelf";
import { CampaignBannerCarousel } from "@/components/campaign/CampaignBannerCarousel";
import { MarketStatusTabs } from "@/components/events/MarketStatusTabs";
import { WorldCupPortal } from "@/components/world-cup/WorldCupPortal";

// Persist view preference
const getStoredView = (): ViewMode => {
  try {
    const stored = localStorage.getItem("events_view") as ViewMode;
    if (stored === "list") return "list";
    return "grid";
  } catch {
    return "grid";
  }
};

const PAGE_SIZE_DESKTOP = 20;
const PAGE_SIZE_MOBILE = 10;

const EventsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const promptOpen = useAuthFlowStore((s) => s.promptOpen);
  const closePrompt = useAuthFlowStore((s) => s.closePrompt);

  // Open auth modal whenever a child component requests it via the global store
  useEffect(() => {
    if (promptOpen && !user) {
      setAuthOpen(true);
      closePrompt();
    }
  }, [promptOpen, user, closePrompt]);

  // Data
  const { events: dbEvents, isLoading, refetch } = useActiveEvents();
  const markets = useMarketListData(dbEvents);
  const { isWatched, toggle: toggleWatch } = useWatchlist();

  // Product line switch (Futures | Spot). Default Futures.
  const [productLine, setProductLine] = useState<"futures" | "spot">(
    () => (searchParams.get("pl") === "spot" ? "spot" : "futures")
  );

  // Tab from URL
  const [activeTab, setActiveTab] = useState<string>(
    () => searchParams.get("tab") || "all"
  );

  // View mode: mobile forces grid
  const [view, setView] = useState<ViewMode>(() =>
    isMobile ? "grid" : getStoredView()
  );

  // Change timeframe
  const [chgTimeframe, setChgTimeframe] = useState<ChgTimeframe>("24h");

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    expiry: "all",
    sort: "volume",
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  // Reset page when filters/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters, chgTimeframe, productLine]);

  // Sync tab & product line → URL
  useEffect(() => {
    const nextParams: Record<string, string> = { tab: activeTab };
    if (productLine !== "futures") nextParams.pl = productLine;
    setSearchParams(nextParams, { replace: true });
  }, [activeTab, productLine]);

  // Persist view
  useEffect(() => {
    if (!isMobile) localStorage.setItem("events_view", view);
  }, [view, isMobile]);

  // Default to grid on mobile (only on mount)
  useEffect(() => {
    if (isMobile && view !== "grid") setView("grid");
  }, [isMobile]);

  // 4B: full-catalog view — search or Watchlist tab bypasses the
  // Futures|Spot filter so users don't miss cross-product-line results.
  // Product-line switch is also hidden in these modes (see §16 rule).
  const isFullCatalog = filters.search.trim().length > 0 || activeTab === "watchlist";

  // Filter & sort markets
  const filteredMarkets = useMemo(() => {
    // Product-line filter — SKIPPED in full-catalog mode.
    let result = isFullCatalog
      ? markets.slice()
      : markets.filter((m) =>
          productLine === "spot"
            ? m.productLines?.includes("spot")
            : m.productLines?.includes("futures"),
        );

    // Tab-level filtering (category tabs)
    if (activeTab === "watchlist") {
      result = result.filter((m) => isWatched(m.eventId));
    } else if (activeTab !== "all" && activeTab !== "hot") {
      result = result.filter((m) => m.category === activeTab);
    }

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.eventName.toLowerCase().includes(q) ||
          m.children.some((c) => c.optionLabel.toLowerCase().includes(q))
      );
    }

    // Expiry filter
    if (filters.expiry !== "all") {
      const now = Date.now();
      result = result.filter((m) => {
        if (!m.expiry) return false;
        const diff = m.expiry.getTime() - now;
        switch (filters.expiry) {
          case "24h": return diff <= 86400000 && diff > 0;
          case "7d": return diff <= 7 * 86400000 && diff > 0;
          case "30d": return diff <= 30 * 86400000 && diff > 0;
          case "30d+": return diff > 30 * 86400000;
          default: return true;
        }
      });
    }

    // Sort
    const sortKey = filters.sort;
    result.sort((a, b) => {
      switch (sortKey) {
        case "volume": return getVolume(b, chgTimeframe) - getVolume(a, chgTimeframe);
        case "change": return Math.abs(getChange(b, chgTimeframe)) - Math.abs(getChange(a, chgTimeframe));
        case "oi": return b.openInterest - a.openInterest;
        default: return 0;
      }
    });

    return result;
  }, [markets, activeTab, filters, isWatched, chgTimeframe, productLine, isFullCatalog]);

  // Visible markets (cumulative load more)
  const visibleMarkets = useMemo(() => {
    return filteredMarkets.slice(0, currentPage * pageSize);
  }, [filteredMarkets, currentPage, pageSize]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const effectiveView: ViewMode = isMobile ? "grid" : view;

  const renderContent = () => {
    if (activeTab === "hot") {
      return (
        <HotShelf
          markets={markets}
          view={effectiveView}
          isWatched={isWatched}
          onToggleWatch={toggleWatch}
        />
      );
    }

    // Watchlist: not logged in → prompt sign in
    if (activeTab === "watchlist" && !user) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">Sign in to use Watchlist</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Save markets you're interested in and access them across devices.
          </p>
          <Button size="sm" onClick={() => setAuthOpen(true)} className="gap-2">
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>
      );
    }

    // Watchlist empty state (logged in)
    if (activeTab === "watchlist" && filteredMarkets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-base font-medium text-foreground mb-1">No watchlist items</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Click the star icon to save markets you're interested in for quick access.
          </p>
        </div>
      );
    }

    if (filteredMarkets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later.
          </p>
        </div>
      );
    }

    return effectiveView === "list" ? (
      <MarketListView
        markets={visibleMarkets}
        isWatched={isWatched}
        onToggleWatch={toggleWatch}
        chgTimeframe={chgTimeframe}
      />
    ) : (
      <MarketGridView
        markets={visibleMarkets}
        isWatched={isWatched}
        onToggleWatch={toggleWatch}
        chgTimeframe={chgTimeframe}
      />
    );
  };

  const hasMore = visibleMarkets.length < filteredMarkets.length;

  return (
    <div
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile
          ? "hsl(222 47% 6%)"
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)",
      }}
    >
      {/* Header */}
      {isMobile ? (
        <MobileHeader
          showLogo
          rightContent={
            <MobileStatusDropdown
              statusFilter="active"
              onStatusFilterChange={(status) => {
                if (status === "resolved") navigate("/resolved");
              }}
            />
          }
        />
      ) : (
        <EventsDesktopHeader />
      )}

      {/* Campaign Entry — desktop only; mobile users see campaigns on Home */}
      {!isMobile && (
        <div className="mx-auto w-full max-w-7xl overflow-hidden px-8 pt-6">
          <CampaignBannerCarousel variant="desktop" />
        </div>
      )}

      <main className={`${isMobile ? "px-4 py-6" : "mx-auto w-full max-w-7xl px-8 py-10"} space-y-6`}>

        {/* Page Title (desktop) — mobile title lives in MobileHeader */}
        {!isMobile ? (
          <PageHeader
            title="Explore Events"
            subtitle="Real-time markets, real-time edge"
            actions={<MarketStatusTabs active="active" />}
          />
        ) : (
          <div className="flex items-center justify-end gap-2">
            <ChgTimeframePicker value={chgTimeframe} onChange={setChgTimeframe} compact />
            <MobileActiveFilterDrawer filters={filters} onChange={setFilters} />
          </div>
        )}

        {/* Product line switch: Futures | Spot — hidden in full-catalog
            (search / Watchlist) mode per DESIGN.md §16. */}
        {!isFullCatalog && (
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
              {(["futures", "spot"] as const).map((pl) => (
                <button
                  key={pl}
                  onClick={() => { setProductLine(pl); setActiveTab("all"); }}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    productLine === pl
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pl}
                </button>
              ))}
            </div>
            {productLine === "spot" && (
              <p className="text-xs text-muted-foreground">
                Spot = buy outcome shares ($0–1). Winning shares pay $1. Max loss is what you pay.
              </p>
            )}
          </div>
        )}

        {/* Tabs + Timeframe picker */}
        <div className="flex items-center justify-between gap-3">
          <EventTabs active={activeTab} onChange={setActiveTab} categories={[...new Set(markets.filter((m) => productLine === "spot" ? m.productLines?.includes("spot") : m.productLines?.includes("futures")).map((m) => m.category))]} />
          {!isMobile && <ChgTimeframePicker value={chgTimeframe} onChange={setChgTimeframe} />}
        </div>


        {/* Desktop Filters */}
        {!isMobile && (
          <FilterChips
            filters={filters}
            onChange={setFilters}
            view={view}
            onViewChange={setView}
            showViewToggle
          />
        )}

        {/* Search indicator */}
        {filters.search.trim() && (
          <p className="text-xs text-muted-foreground">
            Showing results for "<span className="text-foreground">{filters.search}</span>"
          </p>
        )}

        {/* Main content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading markets...</p>
          </div>
        ) : (
          renderContent()
        )}

        {/* Load More */}
        {!isLoading && hasMore && activeTab !== "hot" && (
          <div className="flex flex-col items-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground border-border/60"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronDown className="h-4 w-4" />
              Load More
              <span className="text-xs font-mono opacity-60">
                {visibleMarkets.length}/{filteredMarkets.length}
              </span>
            </Button>
          </div>
        )}
      </main>

      {isMobile && <BottomNav />}
      
      
      {!isMobile && <AirdropHomepageModal />}

      <WorldCupPortal />


      {/* Auth modal for watchlist sign-in prompt */}
      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </div>
  );
};

export default EventsPage;
