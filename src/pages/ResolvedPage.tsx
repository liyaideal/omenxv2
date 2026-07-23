import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/BottomNav";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileStatusDropdown } from "@/components/EventFilters";
import { ResolvedGroupedGrid } from "@/components/resolved/ResolvedGroupedGrid";
import { ResolvedViewToggle, ResolvedViewMode } from "@/components/resolved/ResolvedViewToggle";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  ResolvedFilters,
  MobileResolvedFilterDrawer,
} from "@/components/ResolvedFilters";
import { useResolvedEvents } from "@/hooks/useResolvedEvents";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MarketStatusTabs } from "@/components/events/MarketStatusTabs";

const ResolvedPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useUserProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const viewMode: ResolvedViewMode =
    searchParams.get("view") === "mine" ? "mine" : "all";

  const handleViewChange = (next: ResolvedViewMode) => {
    if (next === "mine" && !user) {
      setAuthDialogOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (next === "mine") params.set("view", "mine");
    else params.delete("view");
    setSearchParams(params, { replace: true });
    setDisplayCount(20);
  };

  const { data: events = [], isLoading } = useResolvedEvents({
    category,
    search,
  });

  const filteredEvents = useMemo(() => {
    if (viewMode === "mine") {
      return events
        .filter((e) => e.userParticipated)
        .sort((a, b) => {
          const ta = a.settled_at ? new Date(a.settled_at).getTime() : 0;
          const tb = b.settled_at ? new Date(b.settled_at).getTime() : 0;
          return tb - ta;
        });
    }
    return events;
  }, [events, viewMode]);

  const displayedEvents = filteredEvents.slice(0, displayCount);
  const hasMore = filteredEvents.length > displayCount;

  const handleLoadMore = () => setDisplayCount((prev) => prev + 20);
  const handleEventClick = (eventId: string) => navigate(`/resolved/${eventId}`);

  return (
    <div
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile
          ? "hsl(222 47% 6%)"
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)",
      }}
    >
      {isMobile ? (
        <MobileHeader
          showLogo
          rightContent={
            <MobileStatusDropdown
              statusFilter="resolved"
              onStatusFilterChange={(status) => {
                if (status === "active") navigate("/events");
              }}
            />
          }
        />
      ) : (
        <EventsDesktopHeader />
      )}

      <main
        className={`${
          isMobile ? "px-4 py-6" : "px-8 py-10 max-w-7xl mx-auto"
        } space-y-6`}
      >
        {/* Page Title (desktop) — mobile title lives in MobileHeader */}
        {!isMobile ? (
          <PageHeader
            title="Resolved Events"
            subtitle="Every prediction has an ending — see who called it right"
            actions={<MarketStatusTabs active="resolved" />}
          />
        ) : (
          <div className="flex items-center justify-end">
            <MobileResolvedFilterDrawer
              viewMode={viewMode}
              onViewModeChange={handleViewChange}
              category={category}
              onCategoryChange={setCategory}
              search={search}
              onSearchChange={setSearch}
            />
          </div>
        )}

        {/* Tabs row: All Resolved / My Settled (mirrors /events EventTabs) */}
        <div className="flex items-center justify-between gap-3">
          <ResolvedViewToggle value={viewMode} onChange={handleViewChange} />
        </div>

        {/* Desktop inline filter chips (mirrors /events FilterChips) */}
        {!isMobile && (
          <ResolvedFilters
            category={category}
            onCategoryChange={setCategory}
            search={search}
            onSearchChange={setSearch}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {/* Grouped Grid */}
        {!isLoading && displayedEvents.length > 0 && (
          <ResolvedGroupedGrid
            events={displayedEvents}
            isMobile={isMobile}
            onEventClick={handleEventClick}
          />
        )}

        {/* Empty state */}
        {!isLoading && filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {viewMode === "mine"
                ? "You haven't settled any markets yet"
                : "No resolved events found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {viewMode === "mine"
                ? "Trade on active markets and your settled outcomes will appear here."
                : search || category !== "all"
                ? "Try adjusting your filters to find more events."
                : "There are no resolved events yet. Check back later!"}
            </p>
            {viewMode === "mine" && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Browse Active Markets
              </Button>
            )}
          </div>
        )}

        {/* Load more */}
        {!isLoading && hasMore && (
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              className="gap-2 border-border/50 hover:border-primary hover:text-primary transition-colors"
              onClick={handleLoadMore}
            >
              <RefreshCw className="h-4 w-4" />
              Load More
            </Button>
          </div>
        )}
      </main>

      {isMobile && <BottomNav />}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default ResolvedPage;
