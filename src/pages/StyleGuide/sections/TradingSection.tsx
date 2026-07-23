import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Ban, Clock, Check } from "lucide-react";
import { SectionWrapper } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { CATEGORY_STYLES, getCategoryFromName } from "@/lib/categoryUtils";
import { OptionChips } from "@/components/OptionChips";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlatformBadge } from "../components";

interface TradingSectionProps {
  isMobile: boolean;
}

export const TradingSection = ({ isMobile }: TradingSectionProps) => {
  const [selectedOption, setSelectedOption] = useState("opt1");

  // Single-market binary toggle playground
  const binaryPresets = [
    { id: "yn", label: "Yes / No (default)", yes: "Yes", no: "No", yesPrice: 0.3, noPrice: 0.7 },
    { id: "nba", label: "NBA teams (long labels)", yes: "Boston Celtics", no: "Oklahoma City Thunder", yesPrice: 0.52, noPrice: 0.48 },
    { id: "epl", label: "Single-word teams", yes: "Arsenal", no: "Chelsea", yesPrice: 0.61, noPrice: 0.39 },
  ];
  const [binaryPresetIdx, setBinaryPresetIdx] = useState(0);
  const [binaryActive, setBinaryActive] = useState<"yes" | "no">("yes");
  const binaryPreset = binaryPresets[binaryPresetIdx];
  
  // Account Risk Playground
  const [riskTotalAssets, setRiskTotalAssets] = useState(100);
  const [riskUnrealizedPnL, setRiskUnrealizedPnL] = useState(0);
  const [riskIMTotal, setRiskIMTotal] = useState(50);

  // Partial Fill Playground
  const [partialFillAmount, setPartialFillAmount] = useState(60);
  const [partialFillTotal, setPartialFillTotal] = useState(100);

  const playgroundRiskMetrics = useMemo(() => {
    const equity = riskTotalAssets + riskUnrealizedPnL;
    const riskRatio = equity > 0 ? (riskIMTotal / equity) * 100 : 0;
    
    let riskLevel: "SAFE" | "WARNING" | "RESTRICTION" | "LIQUIDATION" = "SAFE";
    if (riskRatio >= 100) riskLevel = "LIQUIDATION";
    else if (riskRatio >= 95) riskLevel = "RESTRICTION";
    else if (riskRatio >= 80) riskLevel = "WARNING";
    
    return { equity, riskRatio: Math.min(riskRatio, 150), riskLevel };
  }, [riskTotalAssets, riskUnrealizedPnL, riskIMTotal]);

  const mockOptions = [
    { id: "opt1", label: "Yes", price: "0.65" },
    { id: "opt2", label: "No", price: "0.35" },
    { id: "opt3", label: ">$100k", price: "0.42" },
  ];

  // Mock fill history for partial fill demo
  const mockFillHistory = [
    { time: "14:32:05", amount: 30, price: "0.652", total: "$19.56" },
    { time: "14:28:12", amount: 20, price: "0.648", total: "$12.96" },
    { time: "14:25:33", amount: 10, price: "0.645", total: "$6.45" },
  ];

  const filledPercent = Math.round((partialFillAmount / partialFillTotal) * 100);

  return (
    <div className="space-y-12">
      {/* Trading Colors */}
      <SectionWrapper
        id="trading-colors"
        title="Trading Color Semantics"
        platform="shared"
        description="Consistent color usage for trading contexts"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Color Meaning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
              <div className="p-4 bg-trading-green/10 border border-trading-green/30 rounded-lg text-center">
                <TrendingUp className="h-6 w-6 text-trading-green mx-auto mb-2" />
                <p className="text-sm font-medium text-trading-green">Green</p>
                <p className="text-xs text-muted-foreground">Profit, Yes side, Success</p>
              </div>
              <div className="p-4 bg-trading-red/10 border border-trading-red/30 rounded-lg text-center">
                <TrendingDown className="h-6 w-6 text-trading-red mx-auto mb-2" />
                <p className="text-sm font-medium text-trading-red">Red</p>
                <p className="text-xs text-muted-foreground">Loss, No side, Error</p>
              </div>
              <div className="p-4 bg-trading-yellow/10 border border-trading-yellow/30 rounded-lg text-center">
                <AlertTriangle className="h-6 w-6 text-trading-yellow mx-auto mb-2" />
                <p className="text-sm font-medium text-trading-yellow">Yellow</p>
                <p className="text-xs text-muted-foreground">Warning, Pending</p>
              </div>
              <div className="p-4 bg-trading-purple/10 border border-trading-purple/30 rounded-lg text-center">
                <ShieldCheck className="h-6 w-6 text-trading-purple mx-auto mb-2" />
                <p className="text-sm font-medium text-trading-purple">Purple</p>
                <p className="text-xs text-muted-foreground">Brand, Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Category Labels */}
      <SectionWrapper
        id="category-labels"
        title="Event Category Labels"
        platform="shared"
        description="Consistent category styling for prediction events"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Category Badge Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                <Badge key={key} variant={style.variant}>
                  {key}
                </Badge>
              ))}
            </div>
            <CodePreview 
              code={`import { CATEGORY_STYLES, getCategoryFromName } from "@/lib/categoryUtils";

const category = getCategoryFromName(eventName);
const style = CATEGORY_STYLES[category];

<Badge className={style.badge}>
  {style.icon} {style.label}
</Badge>`}
            />
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Option Chips */}
      <SectionWrapper
        id="option-chips"
        title="Option Chips"
        platform="shared"
        description="Selection chips for event options with price display"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Option Chips Component</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-xl p-6 mb-4">
              <OptionChips
                options={mockOptions}
                selectedId={selectedOption}
                onSelect={setSelectedOption}
              />
            </div>
            <CodePreview 
              code={`<OptionChips
  options={[
    { id: "opt1", label: "Yes", price: "0.65" },
    { id: "opt2", label: "No", price: "0.35" },
  ]}
  selectedId={selectedOption}
  onSelect={setSelectedOption}
/>`}
            />
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Account Risk Indicator */}
      <SectionWrapper
        id="account-risk"
        title="Account Risk Indicator"
        platform="shared"
        description="4-tier risk classification based on Risk Ratio (IM / Equity × 100)"
      >
        {/* Risk Model Documentation */}
        <Card className="trading-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Risk Model Overview</CardTitle>
            <CardDescription>Equity = Balance + Unrealized PnL | Risk Ratio = Initial Margin / Equity × 100</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
              <div className="p-4 bg-trading-green/10 border border-trading-green/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-trading-green" />
                  <span className="text-sm font-medium text-trading-green">SAFE</span>
                </div>
                <p className="text-2xl font-mono font-bold text-trading-green">&lt; 80%</p>
                <p className="text-xs text-muted-foreground mt-1">Normal trading allowed</p>
              </div>
              <div className="p-4 bg-trading-yellow/10 border border-trading-yellow/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-trading-yellow" />
                  <span className="text-sm font-medium text-trading-yellow">WARNING</span>
                </div>
                <p className="text-2xl font-mono font-bold text-trading-yellow">80-95%</p>
                <p className="text-xs text-muted-foreground mt-1">Reduce positions suggested</p>
              </div>
              <div className="p-4 bg-trading-red/10 border border-trading-red/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="h-4 w-4 text-trading-red" />
                  <span className="text-sm font-medium text-trading-red">RESTRICTION</span>
                </div>
                <p className="text-2xl font-mono font-bold text-trading-red">95-100%</p>
                <p className="text-xs text-muted-foreground mt-1">Close-only mode</p>
              </div>
              <div className="p-4 bg-trading-red/20 border border-trading-red/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-trading-red animate-pulse" />
                  <span className="text-sm font-medium text-trading-red">LIQUIDATION</span>
                </div>
                <p className="text-2xl font-mono font-bold text-trading-red">≥ 100%</p>
                <p className="text-xs text-muted-foreground mt-1">Forced liquidation triggered</p>
              </div>
            </div>
            
            {/* Margin Terms */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Key Terms</h4>
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div>
                  <p className="text-xs text-muted-foreground">Initial Margin (IM)</p>
                  <p className="text-sm">Entry threshold - margin required to open a position</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maintenance Margin (MM)</p>
                  <p className="text-sm">Survival line - minimum margin to keep position open</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Simulator */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Risk Level Simulator</CardTitle>
            <CardDescription>Adjust values to test risk tier transitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {/* Preview */}
              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-xl border",
                  playgroundRiskMetrics.riskLevel === "SAFE" && "bg-trading-green/5 border-trading-green/20",
                  playgroundRiskMetrics.riskLevel === "WARNING" && "bg-trading-yellow/5 border-trading-yellow/20",
                  playgroundRiskMetrics.riskLevel === "RESTRICTION" && "bg-trading-red/5 border-trading-red/20",
                  playgroundRiskMetrics.riskLevel === "LIQUIDATION" && "bg-trading-red/10 border-trading-red/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Account Risk</span>
                    <Badge className={cn(
                      playgroundRiskMetrics.riskLevel === "SAFE" && "bg-trading-green/10 text-trading-green",
                      playgroundRiskMetrics.riskLevel === "WARNING" && "bg-trading-yellow/10 text-trading-yellow",
                      playgroundRiskMetrics.riskLevel === "RESTRICTION" && "bg-trading-red/10 text-trading-red",
                      playgroundRiskMetrics.riskLevel === "LIQUIDATION" && "bg-trading-red/20 text-trading-red"
                    )}>
                      {playgroundRiskMetrics.riskLevel}
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.min(playgroundRiskMetrics.riskRatio, 100)} 
                    className={cn(
                      "h-2",
                      playgroundRiskMetrics.riskLevel === "SAFE" && "[&>div]:bg-trading-green",
                      playgroundRiskMetrics.riskLevel === "WARNING" && "[&>div]:bg-trading-yellow",
                      (playgroundRiskMetrics.riskLevel === "RESTRICTION" || playgroundRiskMetrics.riskLevel === "LIQUIDATION") && "[&>div]:bg-trading-red"
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Risk Ratio</span>
                    <span className="font-mono">{playgroundRiskMetrics.riskRatio.toFixed(1)}%</span>
                  </div>
                  
                  {/* Calculated Values */}
                  <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Equity</span>
                      <p className="font-mono font-medium">${playgroundRiskMetrics.equity.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Formula</span>
                      <p className="font-mono text-muted-foreground">{riskIMTotal} / {playgroundRiskMetrics.equity.toFixed(0)} × 100</p>
                    </div>
                  </div>
                </div>

                {/* Risk Level Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-trading-green" />
                    <span>SAFE: &lt; 80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-trading-yellow" />
                    <span>WARNING: 80-95%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-trading-red" />
                    <span>RESTRICTION: 95-100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-trading-red animate-pulse" />
                    <span>LIQUIDATION: ≥ 100%</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Total Assets</Label>
                    <span className="text-xs font-mono">${riskTotalAssets}</span>
                  </div>
                  <Slider value={[riskTotalAssets]} onValueChange={([v]) => setRiskTotalAssets(v)} min={10} max={500} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Unrealized PnL</Label>
                    <span className={cn("text-xs font-mono", riskUnrealizedPnL >= 0 ? "text-trading-green" : "text-trading-red")}>
                      {riskUnrealizedPnL >= 0 ? "+" : ""}${riskUnrealizedPnL}
                    </span>
                  </div>
                  <Slider value={[riskUnrealizedPnL]} onValueChange={([v]) => setRiskUnrealizedPnL(v)} min={-100} max={100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Initial Margin (IM)</Label>
                    <span className="text-xs font-mono">${riskIMTotal}</span>
                  </div>
                  <Slider value={[riskIMTotal]} onValueChange={([v]) => setRiskIMTotal(v)} min={0} max={200} />
                </div>
                
                {/* Quick Presets */}
                <div className="pt-4 border-t border-border/50">
                  <Label className="text-xs mb-2 block">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(20); setRiskIMTotal(50); }}>
                      Safe Example
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(-10); setRiskIMTotal(75); }}>
                      Warning Example
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setRiskTotalAssets(100); setRiskUnrealizedPnL(-20); setRiskIMTotal(85); }}>
                      Liquidation Risk
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Order Status & Partial Fill */}
      <SectionWrapper
        id="order-status"
        title="Order Status & Partial Fill"
        platform="shared"
        description="Order status badges and partial fill hover interaction"
      >
        {/* Status Badges */}
        <Card className="trading-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Status Badges</CardTitle>
            <CardDescription>Visual indicators for different order states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Pending</Badge>
              <Badge className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">Partial Filled</Badge>
              <Badge className="bg-trading-green/20 text-trading-green hover:bg-trading-green/30">Filled</Badge>
              <Badge className="bg-trading-red/20 text-trading-red hover:bg-trading-red/30">Cancelled</Badge>
            </div>
            <CodePreview 
              code={`const statusColors = {
  Pending: "bg-amber-500/20 text-amber-400",
  "Partial Filled": "bg-cyan-500/20 text-cyan-400",
  Filled: "bg-trading-green/20 text-trading-green",
  Cancelled: "bg-trading-red/20 text-trading-red",
};

<Badge className={statusColors[status]}>{status}</Badge>`}
            />
          </CardContent>
        </Card>

        {/* Desktop: Table Row Partial Fill Hover */}
        <Card className="trading-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Desktop: Table Row Hover</CardTitle>
              <PlatformBadge platform="desktop" />
            </div>
            <CardDescription>Hover on the Status badge in table to see fill history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Desktop Table Preview */}
              <div className="overflow-x-auto rounded-lg border border-border bg-background">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Contracts</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Side</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Order Type</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Price</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Qty</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Value</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Status</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Time</th>
                      <th className="px-3 py-2 text-xs text-muted-foreground font-normal text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30 hover:bg-muted/30">
                      <td className="px-3 py-2 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">Spain</span>
                          <span className="text-xs text-muted-foreground">FIFA World Cup 2026 Winner?</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-trading-green/20 text-trading-green">
                          Yes
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">Limit</td>
                      <td className="px-3 py-2 text-sm font-mono">$0.1800</td>
                      <td className="px-3 py-2 text-sm font-mono">{partialFillTotal.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm font-mono">${(partialFillTotal * 0.18).toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm">
                        {/* Hoverable Status Badge */}
                        <HoverCard openDelay={100} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <button className="cursor-pointer">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                                Partial Filled
                              </span>
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            side="bottom" 
                            align="start" 
                            className="w-80 p-0 bg-popover border-border"
                          >
                            {/* Fill Progress Header */}
                            <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium">Fill Progress</span>
                                <span className="text-xs font-mono text-cyan-400">
                                  {partialFillAmount.toLocaleString()}/{partialFillTotal.toLocaleString()} ({filledPercent}%)
                                </span>
                              </div>
                              <Progress 
                                value={filledPercent} 
                                className="h-1.5 [&>div]:bg-cyan-400"
                              />
                            </div>
                            
                            {/* Fill History */}
                            <div className="px-3 py-2">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                                Fill History
                              </div>
                              <div className="space-y-1">
                                {mockFillHistory.map((fill, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Check className="w-3 h-3 text-trading-green" />
                                      <span className="font-mono text-muted-foreground">{fill.time}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono">{fill.amount.toLocaleString()} @ {fill.price}</span>
                                      <span className="font-mono text-trading-green">{fill.total}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Summary */}
                            <div className="px-3 py-2 border-t border-border bg-muted/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Avg Fill Price</span>
                                <span className="font-mono font-medium">$0.1795</span>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-muted-foreground">Total Filled Value</span>
                                <span className="font-mono font-medium text-trading-green">${(partialFillAmount * 0.18).toFixed(2)}</span>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">Just now</td>
                      <td className="px-3 py-2 text-sm">
                        <button className="px-2 py-1 text-xs border border-trading-red text-trading-red rounded hover:bg-trading-red/10">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                👆 Hover on "Partial Filled" status badge to see fill details
              </p>

              {/* Controls */}
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Filled Amount</Label>
                    <span className="text-xs font-mono text-cyan-400">{partialFillAmount.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[partialFillAmount]} 
                    onValueChange={([v]) => setPartialFillAmount(v)} 
                    min={1} 
                    max={partialFillTotal - 1} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Total Order Qty</Label>
                    <span className="text-xs font-mono">{partialFillTotal.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[partialFillTotal]} 
                    onValueChange={([v]) => {
                      setPartialFillTotal(v);
                      if (partialFillAmount >= v) setPartialFillAmount(v - 1);
                    }} 
                    min={100} 
                    max={100000} 
                    step={100}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { setPartialFillAmount(25000); setPartialFillTotal(100000); }}>
                  25% Filled
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { setPartialFillAmount(50000); setPartialFillTotal(100000); }}>
                  50% Filled
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { setPartialFillAmount(97717); setPartialFillTotal(100000); }}>
                  97.7% Filled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile: Card Style Partial Fill Hover */}
        <Card className="trading-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Mobile: Card Style Hover</CardTitle>
              <PlatformBadge platform="mobile" />
            </div>
            <CardDescription>Hover on the status badge in order card to see fill history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {/* Preview */}
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border max-w-sm">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-trading-green/20 text-trading-green">
                        Yes
                      </span>
                      <span className="text-sm text-muted-foreground">Limit</span>
                    </div>
                    
                    {/* Hoverable Partial Fill Badge */}
                    <HoverCard openDelay={100} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <button className="cursor-pointer">
                          <Badge className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              Partial Filled
                            </span>
                          </Badge>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent 
                        side="bottom" 
                        align="end" 
                        className="w-72 p-0 bg-popover border-border"
                      >
                        {/* Fill Progress Header */}
                        <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium">Fill Progress</span>
                            <span className="text-xs font-mono text-cyan-400">
                              {partialFillAmount}/{partialFillTotal} ({filledPercent}%)
                            </span>
                          </div>
                          <Progress 
                            value={filledPercent} 
                            className="h-1.5 [&>div]:bg-cyan-400"
                          />
                        </div>
                        
                        {/* Fill History */}
                        <div className="px-3 py-2">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                            Fill History
                          </div>
                          <div className="space-y-2">
                            {mockFillHistory.map((fill, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0"
                              >
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-trading-green" />
                                  <span className="font-mono text-muted-foreground">{fill.time}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono">{fill.amount} @ {fill.price}</span>
                                  <span className="font-mono text-trading-green">{fill.total}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="px-3 py-2 border-t border-border bg-muted/30">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Avg Fill Price</span>
                            <span className="font-mono font-medium">$0.649</span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Total Filled</span>
                            <span className="font-mono font-medium text-trading-green">$38.97</span>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  {/* Order Info */}
                  <div className="mb-3">
                    <h3 className="font-medium text-foreground text-sm">BTC to reach $100k</h3>
                    <p className="text-xs text-muted-foreground">Yes · 65%</p>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Price</span>
                      <span className="font-mono text-xs">$0.65</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Amount</span>
                      <span className="font-mono text-xs">100</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Filled</span>
                      <span className="font-mono text-xs text-cyan-400">60/100</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  👆 Hover on "Partial Filled" badge to see fill details
                </p>
              </div>

              {/* Code Example */}
              <div>
                <CodePreview 
                  code={`// HoverCard for Status Badge
<HoverCard openDelay={100} closeDelay={100}>
  <HoverCardTrigger asChild>
    <button className="cursor-pointer">
      <Badge className="bg-cyan-500/20 text-cyan-400">
        <Clock className="w-3 h-3 mr-1.5" />
        Partial Filled
      </Badge>
    </button>
  </HoverCardTrigger>
  <HoverCardContent side="bottom" align="end" className="w-72 p-0">
    {/* Fill Progress */}
    <div className="px-3 py-2.5 border-b bg-muted/30">
      <Progress value={filledPercent} />
    </div>
    
    {/* Fill History List */}
    <div className="px-3 py-2">
      {fills.map((fill) => (
        <div className="flex justify-between text-xs">
          <span>{fill.time}</span>
          <span>{fill.amount} @ {fill.price}</span>
        </div>
      ))}
    </div>
    
    {/* Summary */}
    <div className="px-3 py-2 border-t bg-muted/30">
      <div className="flex justify-between text-xs">
        <span>Avg Fill Price</span>
        <span>$0.649</span>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Trading Card Style */}
      <SectionWrapper
        id="trading-cards"
        title="Trading Card Style"
        platform="shared"
        description="Card styling for trading interfaces"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Trading Card</CardTitle>
            <CardDescription>Use the .trading-card class for trading UI cards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The trading-card class applies subtle gradient background, proper borders, and hover states.
            </p>
            <CodePreview 
              code={`<Card className="trading-card">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>`}
            />
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Event Category Labels */}
      <SectionWrapper
        id="category-labels"
        title="Event Category Labels"
        platform="shared"
        description="Color-coded labels for different event categories"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Category Color System</CardTitle>
            <CardDescription>
              Each event category has a unique color. Never duplicate colors between categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* All Categories Display */}
            <div>
              <h4 className="text-sm font-medium mb-3">All Categories</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(CATEGORY_STYLES) as Array<keyof typeof CATEGORY_STYLES>).map((category) => {
                  const style = CATEGORY_STYLES[category];
                  return (
                    <div key={category} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Badge variant={style.variant}>
                        {category}
                      </Badge>
                      <code className="text-[10px] text-muted-foreground font-mono">
                        variant="{style.variant}"
                      </code>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Color Reference Table */}
            <div>
              <h4 className="text-sm font-medium mb-3">Color Reference</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Variant</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">HSL Color</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Use Case</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-primary">Social</span></td>
                      <td className="py-2 px-2">social</td>
                      <td className="py-2 px-2 text-muted-foreground">260 60% 55%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">Twitter, influencers</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-trading-yellow">Crypto</span></td>
                      <td className="py-2 px-2">crypto</td>
                      <td className="py-2 px-2 text-muted-foreground">48 100% 55%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">Bitcoin, Ethereum</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-trading-green">Finance</span></td>
                      <td className="py-2 px-2">finance</td>
                      <td className="py-2 px-2 text-muted-foreground">145 80% 42%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">Fed, stocks, GDP</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-trading-red">Politics</span></td>
                      <td className="py-2 px-2">politics</td>
                      <td className="py-2 px-2 text-muted-foreground">0 85% 60%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">Elections, government</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-cyan-400">Tech</span></td>
                      <td className="py-2 px-2">tech</td>
                      <td className="py-2 px-2 text-muted-foreground">190 90% 50%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">SpaceX, AI, Apple</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-orange-400">Entertainment</span></td>
                      <td className="py-2 px-2">entertainment</td>
                      <td className="py-2 px-2 text-muted-foreground">25 95% 55%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">Movies, Oscars</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-2"><span className="text-blue-400">Sports</span></td>
                      <td className="py-2 px-2">sports</td>
                      <td className="py-2 px-2 text-muted-foreground">210 90% 55%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">NBA, NFL, World Cup</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2"><span className="text-muted-foreground">General</span></td>
                      <td className="py-2 px-2">general</td>
                      <td className="py-2 px-2 text-muted-foreground">222 25% 55%</td>
                      <td className="py-2 px-2 font-sans text-muted-foreground">Fallback</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to Add New Category */}
            <div className="p-4 rounded-lg bg-trading-yellow/10 border border-trading-yellow/30">
              <h4 className="text-sm font-semibold text-trading-yellow mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Adding New Categories
              </h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li><strong>Choose a unique color</strong> - Never duplicate an existing category's color</li>
                <li><strong>Add to CATEGORY_STYLES</strong> in <code className="text-primary">src/lib/categoryUtils.ts</code></li>
                <li><strong>Add keywords</strong> to <code className="text-primary">getCategoryFromName()</code> function</li>
                <li><strong>Update this StyleGuide</strong> with the new category</li>
              </ol>
            </div>

            {/* Code Example */}
            <div>
              <h4 className="text-sm font-medium mb-2">Usage Example</h4>
              <CodePreview 
                code={`import { CATEGORY_STYLES, CategoryType, getCategoryInfo } from "@/lib/categoryUtils";

// Get category from event
const categoryInfo = getCategoryInfo(event.category);

// Use the variant system
<Badge 
  variant={CATEGORY_STYLES[categoryInfo.label as CategoryType]?.variant || "secondary"}
  className={\`\${
    ["Tech", "Entertainment", "Sports"].includes(categoryInfo.label) 
      ? CATEGORY_STYLES[categoryInfo.label as CategoryType]?.class 
      : ""
  }\`}
>
  {categoryInfo.label}
</Badge>`}
              />
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper
        id="binary-trade-toggle"
        title="Single-Market Binary Trade Toggle"
        description="Yes/No 切换器：高度由内容驱动，短标签紧凑，长队名换行才撑高。两侧 grid-cols-2 自动等高。"
      >
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* PresetRail */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {binaryPresets.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setBinaryPresetIdx(idx)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                    idx === binaryPresetIdx
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Live demo */}
            <div className="max-w-sm">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg">
                {(["yes", "no"] as const).map((side) => {
                  const active = binaryActive === side;
                  const label = side === "yes" ? binaryPreset.yes : binaryPreset.no;
                  const price = side === "yes" ? binaryPreset.yesPrice : binaryPreset.noPrice;
                  const activeBg = side === "yes" ? "bg-trading-green text-trading-green-foreground" : "bg-trading-red text-foreground";
                  const activePriceBg = side === "yes"
                    ? "bg-trading-green/85 text-trading-green-foreground border-black/20"
                    : "bg-trading-red/85 text-foreground border-black/20";
                  return (
                    <button
                      key={side}
                      onClick={() => setBinaryActive(side)}
                      className="relative flex flex-col h-full rounded-md overflow-hidden transition-all duration-200"
                    >
                      <div
                        className={cn(
                          "relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2",
                          active ? activeBg : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <span className="text-[11px] font-semibold leading-tight line-clamp-2 text-center">{label}</span>
                        {active && (
                          <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "h-[22px] flex items-center justify-center border-t text-[11px] font-mono",
                          active ? activePriceBg : "bg-muted-foreground/15 text-foreground/80 border-border/40"
                        )}
                      >
                        {price.toFixed(4)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>· 容器 <code className="font-mono">bg-muted/30 grid-cols-2 gap-2 p-1</code>（grid 默认 <code className="font-mono">items-stretch</code> 同步两侧高度）</p>
              <p>· 按钮 <code className="font-mono">flex flex-col h-full</code>；上层 <code className="font-mono">flex-1 min-h-[24px] py-1.5</code> + <code className="font-mono">line-clamp-2</code>，自动撑满到对侧高度</p>
              <p>· 价格条固定 <code className="font-mono">h-[22px]</code>，与上层用 <code className="font-mono">border-t</code> 分隔，选中态同色系 /85</p>
              <p>· 一侧换行升高时，另一侧通过 <code className="font-mono">h-full + flex-1</code> 自动等高；严禁硬编码 <code className="font-mono">h-14</code></p>
              <p>· <strong>单 market binary 事件不要</strong>在事件 header 下追加 <code className="font-mono">Market: X or Y</code> 行或 <code className="font-mono">Select Option:</code> chip——对阵信息已由标题 + Yes/No 切换器承担</p>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>
    </div>
  );
};
