import { useState } from "react";
import { ShieldCheck, AlertTriangle, Ban, Zap, Eye, EyeOff, Info } from "lucide-react";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useRealtimeRiskMetrics,
  getRiskColor,
  getRiskBgColor,
  getRiskMessage,
  type RiskLevel,
  type RiskMetrics,
} from "@/hooks/useRealtimeRiskMetrics";

const getRiskIcon = (level: RiskLevel) => {
  switch (level) {
    case "SAFE":
      return <ShieldCheck className="w-3 h-3" />;
    case "WARNING":
      return <AlertTriangle className="w-3 h-3" />;
    case "RESTRICTION":
      return <Ban className="w-3 h-3" />;
    case "LIQUIDATION":
      return <Zap className="w-3 h-3" />;
  }
};

/**
 * Compact MM indicator badge that opens full account risk drawer
 */
export function MobileRiskIndicator() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const riskMetrics = useRealtimeRiskMetrics();

  // MM ratio = MM / Equity
  const mmRatio = riskMetrics.equity > 0
    ? (riskMetrics.mmTotal / riskMetrics.equity) * 100
    : 0;

  return (
    <>
      {/* Compact MM Badge */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex flex-col items-center justify-center w-14 h-10 rounded-lg bg-muted/50 border border-border/30 hover:bg-muted transition-colors"
      >
        <span className="text-[10px] text-muted-foreground leading-none mb-0.5">MM</span>
        <span className={`text-xs font-mono font-medium leading-none ${getRiskColor(riskMetrics.riskLevel)}`}>
          {mmRatio.toFixed(2)}%
        </span>
      </button>

      {/* Full Account Risk Drawer */}
      <AccountRiskDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        riskMetrics={riskMetrics}
      />
    </>
  );
}

interface AccountRiskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskMetrics: RiskMetrics;
}

function AccountRiskDrawer({ open, onOpenChange, riskMetrics }: AccountRiskDrawerProps) {
  const [showValues, setShowValues] = useState(true);

  const getProgressWidth = (ratio: number) => Math.min(ratio, 100);

  return (
    <MobileDrawer open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 pb-6">
        {/* Title with icons on the right */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">Unified Trading Account</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValues(!showValues)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-[280px] p-3">
                <div className="space-y-2 text-xs">
                  <p><strong>Risk Ratio</strong> = IM / Equity</p>
                  <p><strong>IM (Initial Margin):</strong> Entry threshold - determines if you can open positions.</p>
                  <p><strong>MM (Maintenance Margin):</strong> Survival line - determines if you'll be liquidated.</p>
                  <p><strong>Equity:</strong> Your real wealth - determines how much you can still lose.</p>
                  <div className="pt-1 border-t border-border/50 space-y-1">
                    <p className="text-trading-green">SAFE: &lt;80% - Normal trading</p>
                    <p className="text-trading-yellow">WARNING: 80-95% - Reduce positions</p>
                    <p className="text-orange-500">RESTRICTION: 95-100% - Close only</p>
                    <p className="text-trading-red">LIQUIDATION: ≥100% - Force close</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Margin Mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Margin Mode</span>
          <span className="text-sm text-foreground">Cross Margin</span>
        </div>

        {/* Account Equity */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Account Equity</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-foreground">
              {showValues ? `$${riskMetrics.equity.toFixed(2)}` : "****"}
            </span>
            {riskMetrics.unrealizedPnL !== 0 && showValues && (
              <span className={`text-xs font-mono ${riskMetrics.unrealizedPnL >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                ({riskMetrics.unrealizedPnL >= 0 ? '+' : ''}{riskMetrics.unrealizedPnL.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {/* Risk Ratio - Main Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Risk Ratio</span>
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getRiskBgColor(riskMetrics.riskLevel)}/20 ${getRiskColor(riskMetrics.riskLevel)}`}>
                {getRiskIcon(riskMetrics.riskLevel)}
                {riskMetrics.riskLevel}
              </span>
            </div>
            <span className={`text-sm font-mono font-semibold ${getRiskColor(riskMetrics.riskLevel)}`}>
              {showValues ? `${riskMetrics.riskRatio.toFixed(2)}%` : "****"}
            </span>
          </div>

          {/* Risk Progress Bar with threshold markers */}
          <div className="relative">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getRiskBgColor(riskMetrics.riskLevel)}`}
                style={{ width: `${getProgressWidth(riskMetrics.riskRatio)}%` }}
              />
            </div>
            {/* Threshold markers */}
            <div className="absolute top-0 left-[80%] w-px h-2.5 bg-trading-yellow/70" />
            <div className="absolute top-0 left-[95%] w-px h-2.5 bg-orange-500/70" />
          </div>

          {/* Threshold labels */}
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className="text-trading-yellow">80%</span>
            <span className="text-orange-500">95%</span>
            <span className="text-trading-red">100%</span>
          </div>
        </div>

        {/* IM & MM with Rate Progress Bars */}
        <div className="space-y-4 pt-3 border-t border-border/30">
          {/* Initial Margin Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Initial Margin Rate</span>
              <span className="text-xs font-mono text-foreground">
                {showValues ? `$${riskMetrics.imTotal.toFixed(2)}` : "****"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-trading-green rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(riskMetrics.imRate, 100)}%` }}
                />
              </div>
              <span className="text-sm font-mono text-trading-green min-w-[50px] text-right">
                {showValues ? `${riskMetrics.imRate.toFixed(2)}%` : "****"}
              </span>
            </div>
          </div>

          {/* Maintenance Margin Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Maintenance Margin Rate</span>
              <span className="text-xs font-mono text-foreground">
                {showValues ? `$${riskMetrics.mmTotal.toFixed(2)}` : "****"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-trading-green rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(riskMetrics.mmRate, 100)}%` }}
                />
              </div>
              <span className="text-sm font-mono text-trading-green min-w-[50px] text-right">
                {showValues ? `${riskMetrics.mmRate.toFixed(2)}%` : "****"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </MobileDrawer>
  );
}
