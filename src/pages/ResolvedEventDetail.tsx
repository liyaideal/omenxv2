import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ExternalHedgeLinks } from "@/components/ExternalHedgeLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Check, 
  X, 
  RefreshCw,
  Briefcase,
  ChevronRight
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/BottomNav";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { useResolvedEventDetail } from "@/hooks/useResolvedEventDetail";
import { SettlementTimeline } from "@/components/resolved/SettlementTimeline";
import { PriceHistoryChart } from "@/components/resolved/PriceHistoryChart";
import { EventStatisticsCard } from "@/components/resolved/EventStatisticsCard";
import { RelatedEventCard } from "@/components/resolved/RelatedEventCard";
import { SettlementEvidenceCard } from "@/components/resolved/SettlementEvidenceCard";
import { EventRulesCard } from "@/components/resolved/EventRulesCard";
import { getCategoryInfo, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { format } from "date-fns";

const ResolvedEventDetail = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const isMobile = useIsMobile();

  const { data: event, isLoading, error } = useResolvedEventDetail({
    eventId: eventId || "",
  });

  const handleRelatedEventClick = (relatedEventId: string) => {
    navigate(`/resolved/${relatedEventId}`);
  };

  const handleGoToPortfolio = () => {
    // Navigate to settlement detail page with event name as ID
    if (event?.name) {
      const settlementId = encodeURIComponent(event.name);
      navigate(`/portfolio/settlement/${settlementId}`);
    } else {
      navigate("/portfolio/settlements");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="outline" onClick={() => navigate("/resolved")}>
          Back to Resolved Events
        </Button>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(event.category);
  const winningOption = event.options.find((o) => o.is_winner);
  const settledDate = event.settled_at
    ? format(new Date(event.settled_at), "MMM d, yyyy")
    : "N/A";

  // Mobile Layout - flat scrollable design
  if (isMobile) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "hsl(222 47% 6%)" }}>
        {/* Header */}
        <MobileHeader title="Event Details" showLogo={false} />

        <main className="px-4 py-5 space-y-5">
          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1: CORE INFO - 核心信息区域
          ═══════════════════════════════════════════════════════════════ */}
          
          {/* Event Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={CATEGORY_STYLES[categoryInfo.label as CategoryType]?.variant || "general"}
                className="text-[10px] uppercase tracking-wide border-0"
              >
                {categoryInfo.label}
              </Badge>
              <Badge 
                variant="outline"
                className="text-[10px] uppercase tracking-wide bg-muted/50 text-muted-foreground border-border/50"
              >
                Settled {settledDate}
              </Badge>
            </div>
            
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {event.name}
            </h1>

            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* User Participation Banner */}
          {event.userParticipated && (
            <div 
              className={`flex items-center justify-between p-3 rounded-xl border ${
                (event.userPnl || 0) >= 0 
                  ? "bg-trading-green/10 border-trading-green/30" 
                  : "bg-trading-red/10 border-trading-red/30"
              }`}
              onClick={handleGoToPortfolio}
            >
              <div className="flex items-center gap-2">
                <Briefcase className={`h-4 w-4 ${(event.userPnl || 0) >= 0 ? "text-trading-green" : "text-trading-red"}`} />
                <span className="text-sm font-medium text-foreground">You participated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-semibold ${
                  (event.userPnl || 0) >= 0 ? "text-trading-green" : "text-trading-red"
                }`}>
                  {(event.userPnl || 0) >= 0 ? "+" : ""}${(event.userPnl || 0).toFixed(2)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Combined Results & Evidence Card - 主卡片 */}
          <Card className="border-border/50 overflow-hidden" style={{ background: "var(--gradient-card)" }}>
            {/* Final Results Section */}
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-base font-semibold">Final Results</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {event.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                    option.is_winner
                      ? "bg-trading-green/15 border border-trading-green/30"
                      : "bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option.is_winner ? (
                      <Check className="h-4 w-4 text-trading-green" />
                    ) : (
                      <X className="h-4 w-4 text-trading-red/70" />
                    )}
                    <span className={`text-sm ${option.is_winner ? "text-trading-green font-medium" : "text-muted-foreground"}`}>
                      {option.displayLabel}
                    </span>
                  </div>
                  <span className={`font-mono text-sm font-semibold ${option.is_winner ? "text-trading-green" : "text-muted-foreground"}`}>
                    ${option.is_winner ? "1.00" : "0.00"}
                  </span>
                </div>
              ))}
            </CardContent>

            {/* Divider */}
            <div className="h-px bg-border/40 mx-4" />

            {/* Settlement Evidence Section */}
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Settlement Evidence</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <SettlementEvidenceCard
                sourceName={event.source_name}
                sourceUrl={event.source_url}
                settlementDescription={event.settlement_description}
                winningOptionLabel={winningOption?.displayLabel || null}
              />
            </CardContent>
          </Card>

          {/* External Spot Market Links - Mobile */}
          {event.external_links && event.external_links.length > 0 && (
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardContent className="px-4 py-3">
                <ExternalHedgeLinks links={event.external_links} label="Compare on spot markets" />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Settlement Progress</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <SettlementTimeline
                startDate={event.start_date}
                endDate={event.end_date}
                settledAt={event.settled_at}
              />
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2: ANALYSIS - 分析数据区域
          ═══════════════════════════════════════════════════════════════ */}
          
          {/* Section Divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Analysis</span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          {/* Price History Chart */}
          <Card className="border-border/30" style={{ background: "var(--gradient-card)" }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Price History</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <PriceHistoryChart
                priceHistory={event.priceHistory}
                options={event.options}
                isMobile={true}
              />
            </CardContent>
          </Card>

          {/* Statistics - 单行紧凑版 */}
          <Card className="border-border/30" style={{ background: "var(--gradient-card)" }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-base font-semibold text-foreground">
                    {event.statistics.participants}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Participants</div>
                </div>
                <div>
                  <div className="text-base font-semibold text-foreground">
                    {event.statistics.totalTrades}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Trades</div>
                </div>
                <div>
                  <div className="text-base font-semibold text-foreground">
                    {event.statistics.avgHoldingTime}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Avg Hold</div>
                </div>
                <div>
                  <div className="text-base font-semibold text-foreground">
                    {event.volume ? (parseFloat(event.volume.replace(/[$,]/g, "")) >= 1000000 
                      ? `$${(parseFloat(event.volume.replace(/[$,]/g, "")) / 1000000).toFixed(1)}M`
                      : parseFloat(event.volume.replace(/[$,]/g, "")) >= 1000
                        ? `$${(parseFloat(event.volume.replace(/[$,]/g, "")) / 1000).toFixed(0)}K`
                        : `$${parseFloat(event.volume.replace(/[$,]/g, "")).toFixed(0)}`)
                      : "$0"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Volume</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Rules - 可折叠或精简显示 */}
          {event.rules && (
            <Card className="border-border/30" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Settlement Rules</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {event.rules}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Related Events */}
          {event.relatedEvents.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Related</span>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              
              <div className="space-y-2">
                {event.relatedEvents.map((related) => (
                  <RelatedEventCard
                    key={related.id}
                    event={related}
                    onClick={() => handleRelatedEventClick(related.id)}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        <BottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div 
      className="min-h-screen"
      style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)"
      }}
    >
      <EventsDesktopHeader />

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={CATEGORY_STYLES[categoryInfo.label as CategoryType]?.variant || "general"}
                  className="text-[10px] uppercase tracking-wide border-0"
                >
                  {categoryInfo.label}
                </Badge>
                <Badge 
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide bg-muted/50 text-muted-foreground border-border/50"
                >
                  Settled {settledDate}
                </Badge>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {event.name}
              </h1>

              {event.description && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {event.description}
                </p>
              )}

              {/* User Participation Banner */}
              {event.userParticipated && (
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:opacity-90 transition-opacity ${
                    (event.userPnl || 0) >= 0 
                      ? "bg-trading-green/10 border-trading-green/30" 
                      : "bg-trading-red/10 border-trading-red/30"
                  }`}
                  onClick={handleGoToPortfolio}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className={`h-5 w-5 ${(event.userPnl || 0) >= 0 ? "text-trading-green" : "text-trading-red"}`} />
                    <div>
                      <span className="text-sm font-medium text-foreground">You participated in this event</span>
                      <p className="text-xs text-muted-foreground">Click to view your trade history</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-lg font-semibold ${
                      (event.userPnl || 0) >= 0 ? "text-trading-green" : "text-trading-red"
                    }`}>
                      {(event.userPnl || 0) >= 0 ? "+" : ""}${(event.userPnl || 0).toFixed(2)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Options Result Card */}
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Final Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {event.options.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                        option.is_winner
                          ? "bg-trading-green/15 border border-trading-green/30"
                          : "bg-muted/20 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {option.is_winner ? (
                          <Check className="h-5 w-5 text-trading-green" />
                        ) : (
                          <X className="h-5 w-5 text-trading-red/70" />
                        )}
                        <span className={`font-medium ${option.is_winner ? "text-trading-green" : "text-muted-foreground"}`}>
                          {option.displayLabel}
                        </span>
                      </div>
                      <span className={`font-mono font-semibold ${option.is_winner ? "text-trading-green" : "text-muted-foreground"}`}>
                        ${option.is_winner ? "1.00" : "0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price History Chart */}
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Price History</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceHistoryChart
                  priceHistory={event.priceHistory}
                  options={event.options}
                  isMobile={false}
                />
              </CardContent>
            </Card>

            {/* Event Statistics */}
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Event Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <EventStatisticsCard 
                  statistics={event.statistics} 
                  volume={event.volume}
                  isMobile={false}
                />
              </CardContent>
            </Card>

            {/* Event Rules */}
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Event Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <EventRulesCard
                  startDate={event.start_date}
                  endDate={event.end_date}
                  settledAt={event.settled_at}
                  rules={event.rules}
                  eventName={event.name}
                  isMobile={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Settlement Timeline */}
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Settlement Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <SettlementTimeline
                  startDate={event.start_date}
                  endDate={event.end_date}
                  settledAt={event.settled_at}
                />
              </CardContent>
            </Card>

            {/* Settlement Evidence */}
            <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Settlement Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <SettlementEvidenceCard
                  sourceName={event.source_name}
                  sourceUrl={event.source_url}
                  settlementDescription={event.settlement_description}
                  winningOptionLabel={winningOption?.displayLabel || null}
                />
              </CardContent>
            </Card>

            {/* External Spot Market Links - Desktop */}
            {event.external_links && event.external_links.length > 0 && (
              <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Spot Market Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExternalHedgeLinks links={event.external_links} label="Compare on spot markets" />
                </CardContent>
              </Card>
            )}

            {/* Related Events */}
            {event.relatedEvents.length > 0 && (
              <Card className="border-border/40" style={{ background: "var(--gradient-card)" }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Related Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.relatedEvents.map((related) => (
                    <RelatedEventCard
                      key={related.id}
                      event={related}
                      onClick={() => handleRelatedEventClick(related.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResolvedEventDetail;
