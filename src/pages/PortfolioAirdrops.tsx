import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Clock, Zap, AlertTriangle, ChevronRight, CheckCircle2, Info } from "lucide-react";
import { EmptyState, LoadingState, ErrorState } from "@/components/states";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { ActivateAirdropButton } from "@/components/ActivateAirdropButton";
import { usePositions } from "@/hooks/usePositions";
import { useSettlements } from "@/hooks/useSettlements";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { AirdropPositionCard } from "@/components/AirdropPositionCard";
import { useEventSideLabelsLookup } from "@/hooks/useEventSideLabelsLookup";
import { STATUS_STYLES } from "@/lib/statusStyles";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TabType = "positions" | "settlements" | "airdrops";

const HeaderWithInfo = ({ label, description, align = "left" }: { label: string; description: React.ReactNode; align?: "left" | "right" }) => (
  <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : "justify-start"}`}>
    <span>{label}</span>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3 h-3 cursor-help text-muted-foreground/70 hover:text-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-left text-xs leading-relaxed">
        {description}
      </TooltipContent>
    </Tooltip>
  </div>
);

// Portfolio Tab 下拉组件
const PortfolioTabDropdown = ({
  activeTab,
  onTabChange,
  positionsCount,
  settlementsCount,
  airdropsCount,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  positionsCount: number;
  settlementsCount: number;
  airdropsCount: number;
}) => {
  const tabOptions: { value: TabType; label: string }[] = [
    { value: "positions", label: `Positions (${positionsCount})` },
    { value: "settlements", label: `Settlements (${settlementsCount})` },
    { value: "airdrops", label: `Airdrops (${airdropsCount})` },
  ];

  return (
    <Select value={activeTab} onValueChange={(v) => onTabChange(v as TabType)}>
      <SelectTrigger className="w-[140px] bg-secondary border-border/50 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tabOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Desktop table row for an airdrop
const AirdropStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { className: string; label: string }> = {
    pending: {
      className: STATUS_STYLES.pending.badge,
      label: "Pending",
    },
    activated: {
      className: STATUS_STYLES.success.badge,
      label: "Activated",
    },
    expired: {
      className: STATUS_STYLES.neutral.badge,
      label: "Expired",
    },
    settled: {
      className: "border-primary/50 text-primary bg-primary/10",
      label: "Settled",
    },
  };
  const c = config[status] || config.expired;
  return (
    <Badge variant="outline" className={`text-[10px] ${c.className}`}>
      {c.label}
    </Badge>
  );
};


export default function PortfolioAirdrops() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useUserProfile();
  const { airdrops, pendingAirdrops, activatedAirdrops, expiredAirdrops, settledAirdrops, isLoading, isError, refetch, activateAirdrop, isActivating, closePosition } = useAirdropPositions();
  const { positions } = usePositions();
  const { data: settlements = [] } = useSettlements();
  const sideLabelsLookup = useEventSideLabelsLookup();


  const handleTabChange = (tab: TabType) => {
    if (tab === "positions") {
      navigate("/portfolio");
    } else if (tab === "settlements") {
      navigate("/portfolio/settlements");
    }
  };

  const isGuest = !authLoading && !user;

  const totalValue = useMemo(() => {
    return airdrops.reduce((sum, a) => sum + a.airdropValue, 0);
  }, [airdrops]);

  return (
    <div 
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile 
          ? "hsl(222 47% 6%)" 
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)"
      }}
    >
      {/* Header */}
      {isMobile ? (
        <MobileHeader 
          showLogo
          rightContent={
            <PortfolioTabDropdown
              activeTab="airdrops"
              onTabChange={handleTabChange}
              positionsCount={positions.length}
              settlementsCount={settlements.length}
              airdropsCount={airdrops.length}
            />
          }
        />
      ) : (
        <EventsDesktopHeader />
      )}

      <AuthGateOverlay title="Sign in to view your airdrops" description="Track your H2E airdrop positions by signing in to your account.">
      <main className={`${isMobile ? "px-4 py-6" : "px-8 py-10 max-w-7xl mx-auto"} space-y-6`}>
        {/* Page Title */}
        {!isMobile && <PageHeader title="Portfolio" subtitle="Hedge-to-Earn airdrop positions from your external accounts" />}

        {/* Desktop Tabs */}
        {!isMobile && (
          <div className="flex border-b border-border">
            <button
              onClick={() => navigate("/portfolio")}
              className="py-2 px-4 text-sm font-medium transition-all text-muted-foreground"
            >
              Positions ({positions.length})
            </button>
            <button
              onClick={() => navigate("/portfolio/settlements")}
              className="py-2 px-4 text-sm font-medium transition-all text-muted-foreground"
            >
              Settlements ({settlements.length})
            </button>
            <button
              className="py-2 px-4 text-sm font-medium transition-all text-primary border-b-2 border-primary"
            >
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Airdrops ({airdrops.length})
              </span>
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="stats-card p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span>Total Value</span>
            </div>
            <p className="text-xl font-bold font-mono text-trading-green mt-3">${totalValue.toFixed(2)}</p>
          </div>
          <div className="stats-card p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Pending</span>
            </div>
            <p className="text-xl font-bold font-mono text-foreground mt-3">{pendingAirdrops.length}</p>
          </div>
          <div className="stats-card p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Activated</span>
            </div>
            <p className="text-xl font-bold font-mono text-foreground mt-3">{activatedAirdrops.length}</p>
          </div>
          <div className="stats-card p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Settled</span>
            </div>
            <p className="text-xl font-bold font-mono text-foreground mt-3">{settledAirdrops.length}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingState label="Loading airdrops…" />}

        {/* Error State */}
        {!isLoading && isError && (
          <ErrorState
            title="Couldn't load airdrops"
            description="Something went wrong fetching your airdrop positions."
            onRetry={() => refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && airdrops.length === 0 && (
          <EmptyState
            variant="card"
            icon={Gift}
            title="No airdrops yet"
            description="Connect an external account to start receiving counter-position airdrops."
            action={
              <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                Connect Account
              </Button>
            }
          />
        )}

        {/* Airdrop List */}
        {!isLoading && airdrops.length > 0 && (
          isMobile ? (
            <div className="space-y-3">
              {airdrops.map((airdrop) => (
                <div
                  key={airdrop.id}
                  className={airdrop.status === "activated" || airdrop.status === "settled" ? "cursor-pointer" : ""}
                  onClick={() => {
                    if (airdrop.status === "activated") {
                      navigate(`/trade?event=${airdrop.counterEventId}`);
                    } else if (airdrop.status === "settled") {
                      navigate(airdrop.source === "voucher" ? "/vouchers" : "/wallet");
                    }
                  }}
                >
                  <AirdropPositionCard
                    airdrop={airdrop}
                    onActivate={activateAirdrop}
                    isActivating={isActivating}
                    onClose={closePosition}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="trading-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Market</TableHead>
                    <TableHead className="text-muted-foreground">Side</TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      <HeaderWithInfo
                        label="Value"
                        align="right"
                        description="Before activation, this is the fixed $10 face value. After activation, it reflects current price × quantity."
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      <HeaderWithInfo
                        label="Entry Price"
                        align="right"
                        description="Entry price of the OmenX airdrop position."
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      <HeaderWithInfo
                        label="Source"
                        description={
                          <div className="space-y-1">
                            <p><span className="font-medium text-foreground">Matched:</span> price of the Polymarket source position this airdrop hedges.</p>
                            <p><span className="font-medium text-foreground">Welcome gift:</span> no external source — a free starter position.</p>
                            <p><span className="font-medium text-foreground">Voucher redemption:</span> no external source — opened by redeeming a position voucher.</p>
                          </div>
                        }
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      <HeaderWithInfo
                        label="Status"
                        description={
                          <div className="space-y-1">
                            <p><span className="font-medium text-foreground">Pending:</span> waiting for user activation.</p>
                            <p><span className="font-medium text-foreground">Activated:</span> activated and waiting for event resolution or source position close.</p>
                            <p><span className="font-medium text-foreground">Expired:</span> not activated within 72 hours.</p>
                            <p><span className="font-medium text-foreground">Settled:</span> activated and already settled. Settlement happens when the event resolves or the Polymarket source position is closed.</p>
                          </div>
                        }
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {airdrops.map((airdrop) => {
                    const { isBinary: rowIsBinary, labels: rowSideLabels } = sideLabelsLookup(airdrop.counterEventName ?? "");
                    const rawLabel = airdrop.counterOptionLabel ?? "";
                    const trimmed = rawLabel.trim().toLowerCase();
                    const isBinaryOutcome = rowIsBinary || trimmed === "yes" || trimmed === "no";
                    const aliasedLabel = isBinaryOutcome && rowSideLabels
                      ? trimmed === "yes" ? rowSideLabels.yes : trimmed === "no" ? rowSideLabels.no : rawLabel
                      : rawLabel;
                    const binaryColorClass = trimmed === "yes" ? "text-trading-green" : "text-trading-red";
                    return (
                    <TableRow key={airdrop.id} className="border-border/50">
                      <TableCell>
                        <div className="max-w-[220px]">
                          <div className="font-medium text-foreground truncate">{airdrop.counterEventName}</div>
                          <div className={`text-xs ${isBinaryOutcome ? binaryColorClass : "text-muted-foreground"}`}>
                            {aliasedLabel}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isBinaryOutcome ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              airdrop.counterSide === "long"
                                ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                                : "border-trading-red/50 text-trading-red bg-trading-red/10"
                            }`}
                          >
                            {airdrop.counterSide === "long" ? "Yes" : "No"}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-mono text-trading-green">
                        ${airdrop.airdropValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${airdrop.counterPrice.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">
                        {airdrop.source === "voucher"
                          ? "Voucher redemption"
                          : airdrop.source === "welcome_gift" || airdrop.externalPrice == null
                          ? "Welcome gift"
                          : `${airdrop.externalSide} @ $${airdrop.externalPrice.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <AirdropStatusBadge status={airdrop.status} />
                          {airdrop.status === "settled" && airdrop.settlementTrigger && (
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-muted/50 whitespace-nowrap px-2">
                              {airdrop.settlementTrigger === "event_resolved" ? "Resolved" : "Closed"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {airdrop.status === "pending" ? (
                          <ActivateAirdropButton
                            expiresAt={airdrop.expiresAt}
                            onClick={() => activateAirdrop(airdrop.id)}
                            isActivating={isActivating}
                            variant="table"
                          />
                        ) : airdrop.status === "activated" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigate(`/trade?event=${airdrop.counterEventId}`)}
                          >
                            View
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : airdrop.status === "settled" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigate(airdrop.source === "voucher" ? "/vouchers" : "/wallet")}
                          >
                            <span className={`font-mono ${(airdrop.settledPnl ?? 0) >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              {(airdrop.settledPnl ?? 0) >= 0 ? `+$${(airdrop.settledPnl ?? 0).toFixed(2)}` : `-$${Math.abs(airdrop.settledPnl ?? 0).toFixed(2)}`}
                            </span>
                            <span>View</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    );
                  })}

                </TableBody>
              </Table>
            </div>
          )
        )}
      </main>
      </AuthGateOverlay>

      {isMobile && <BottomNav />}
    </div>
  );
}
