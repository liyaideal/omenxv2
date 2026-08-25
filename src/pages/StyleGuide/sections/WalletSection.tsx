import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Clock, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { DualDevicePreview } from "../components/DeviceFrame";
import { CodePreview } from "../components/CodePreview";
import {
  MaintenanceNoticeBannerView,
  MAINTENANCE_NOTICE_DEMO_SETS,
} from "@/components/wallet/MaintenanceNoticeBanner";
import { cn } from "@/lib/utils";
import { H2eRewardsCard } from "@/components/h2e/H2eRewardsCard";
import type { H2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";

type MaintenancePreset = "single" | "multiple" | "withNote" | "empty";
const MAINTENANCE_PRESETS: { id: MaintenancePreset; label: string }[] = [
  { id: "single", label: "Single network" },
  { id: "multiple", label: "Multiple networks" },
  { id: "withNote", label: "With note" },
  { id: "empty", label: "Empty (hidden)" },
];

interface WalletSectionProps {
  isMobile: boolean;
}

// Status configuration
const STATUS_CONFIG: Record<string, {
  icon: typeof Clock;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  animate?: boolean;
}> = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-trading-yellow",
    bgColor: "bg-trading-yellow/10",
    borderColor: "border-trading-yellow/20",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    color: "text-trading-yellow",
    bgColor: "bg-trading-yellow/10",
    borderColor: "border-trading-yellow/20",
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-trading-green",
    bgColor: "bg-trading-green/10",
    borderColor: "border-trading-green/20",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "text-trading-red",
    bgColor: "bg-trading-red/10",
    borderColor: "border-trading-red/20",
  },
  cancelled: {
    icon: AlertCircle,
    label: "Cancelled",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
  },
};

// Explorer URLs
const EXPLORER_URLS: Record<string, string> = {
  'Ethereum': 'https://etherscan.io/tx/',
  'BNB Smart Chain (BEP20)': 'https://bscscan.com/tx/',
  'Polygon': 'https://polygonscan.com/tx/',
  'Arbitrum One': 'https://arbiscan.io/tx/',
  'Solana': 'https://solscan.io/tx/',
};

const H2E_STARTER_UNLOCK = 5;
const H2E_UNLOCK_TIERS = [
  { volume: 0, percent: 0 },
  { volume: 10000, percent: 10 },
  { volume: 50000, percent: 25 },
  { volume: 100000, percent: 50 },
  { volume: 200000, percent: 75 },
  { volume: 400000, percent: 100 },
];

const H2E_FULL_VOLUME_UNLOCK = H2E_UNLOCK_TIERS[H2E_UNLOCK_TIERS.length - 1].volume;

export const WalletSection = ({ isMobile }: WalletSectionProps) => {
  const [demoConfirmations, setDemoConfirmations] = useState(8);
  const [mockVolume, setMockVolume] = useState(12500);
  const [maintenancePreset, setMaintenancePreset] = useState<MaintenancePreset>("single");
  const maintenanceNotices = MAINTENANCE_NOTICE_DEMO_SETS[maintenancePreset];
  const currentTier = [...H2E_UNLOCK_TIERS].reverse().find((tier) => mockVolume >= tier.volume);
  const nextTier = H2E_UNLOCK_TIERS.find((tier) => mockVolume < tier.volume) ?? null;
  const unlockedPercent = currentTier?.percent ?? 0;
  const volumeToNextTier = nextTier ? Math.max(0, nextTier.volume - mockVolume) : 0;
  // Mock H2eRewardsSummary so the demo can mount the production card.
  const mockH2eSummary: H2eRewardsSummary = {
    frozenBalance: 128.4,
    volumeCompleted: mockVolume,
    isUnlocked: unlockedPercent > 0,
    isFullyUnlocked: !nextTier,
    unlockedPercent,
    unlockedAmount: (128.4 * unlockedPercent) / 100,
    lockedAmount: 128.4 - (128.4 * unlockedPercent) / 100,
    nextTierVolume: nextTier?.volume ?? null,
    nextTierPercent: nextTier?.percent ?? null,
    volumeToNextTier,
    unlockTiers: H2E_UNLOCK_TIERS,
    starterUnlock: H2E_STARTER_UNLOCK,
    totalEarned: 128.4,
    earningsCap: 500,
    volumeRequired: H2E_FULL_VOLUME_UNLOCK,
    volumePercent: nextTier ? Math.min((mockVolume / nextTier.volume) * 100, 100) : 100,
    earningsPercent: Math.min((128.4 / 500) * 100, 100),
    settlements: [
      {
        id: "s1",
        eventName: "BTC ≥ $150k by Dec 31",
        pnl: 42.18,
        trigger: "Auto-close",
        settledAt: new Date().toISOString(),
      },
      {
        id: "s2",
        eventName: "Fed cuts in September?",
        pnl: -8.4,
        trigger: "Settlement",
        settledAt: new Date().toISOString(),
      },
    ],
  };

  return (
    <div className="space-y-12">
      {/* Maintenance Notice */}
      <SectionWrapper
        id="maintenance-notice"
        title="Maintenance Notice"
        platform="shared"
        description="Custody provider (Cobo) maintenance banner shown at the top of /wallet. Switch presets to preview every state."
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">States</CardTitle>
            <CardDescription>
              Notices read from <code className="font-mono text-[11px]">src/config/maintenanceNotices.ts</code>. Empty array hides the banner entirely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {MAINTENANCE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setMaintenancePreset(preset.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    maintenancePreset === preset.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-border/50 bg-background p-4">
              {maintenanceNotices.length > 0 ? (
                <MaintenanceNoticeBannerView notices={maintenanceNotices} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  No active notices → banner hidden. /wallet renders nothing in this slot.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Dual-Account 2b — real components rendered inside DeviceFrame iframes.
          Truth Rule §16.1.1: every preview key resolves to the same production
          component tree used at /wallet, EventsDesktopHeader, and TransactionHistory. */}
      <SectionWrapper
        id="dual-account-2b"
        title="Dual-Account · 2b"
        platform="shared"
        description="Total Equity band, dual account cards (Standard = spot, Boost = futures), TransferForm state coverage, Deposit-to picker, header HoverCard, and transaction row account badges. Desktop + mobile via iframe DeviceFrame."
      >
        <SubSection title="Band 1 Total Equity + Band 2 dual account cards" platform="shared">
          <DualDevicePreview
            previewKey="wallet-equity-bands"
            label="Total Equity hero band + Standard / Boost cards (unified body: Available (USDC) cap + tooltip, big number, one-line footnote)"
            minHeight={340}
          />
        </SubSection>

        <SubSection title="TransferForm — 3 states (real component, props-driven)" platform="shared">
          <div className="grid grid-cols-1 gap-4">
            <DualDevicePreview
              previewKey="wallet-transfer-normal"
              label="Normal · Boost $8,720 → Standard, amount $250"
              minHeight={460}
            />
            <DualDevicePreview
              previewKey="wallet-transfer-insufficient"
              label="Insufficient · Available $10, amount $500 (red ring + error line)"
              minHeight={460}
            />
            <DualDevicePreview
              previewKey="wallet-transfer-zero"
              label="Amount 0 · submit disabled"
              minHeight={440}
            />
          </div>
        </SubSection>

        <SubSection title="Deposit 'Deposit to' pre-screen" platform="shared">
          <DualDevicePreview
            previewKey="wallet-deposit-to"
            label="AccountPickerRows — real component used by DepositDialog / /deposit"
            minHeight={220}
          />
        </SubSection>

        <SubSection title="Header Equity HoverCard content" platform="shared">
          <DualDevicePreview
            previewKey="wallet-equity-hovercard"
            label="Mirrors EventsDesktopHeader HoverCard: 3 account rows + Total + Transfer link"
            minHeight={220}
          />
        </SubSection>

        <SubSection title="Transaction history — account badges + transfer icon" platform="shared">
          <DualDevicePreview
            previewKey="wallet-tx-history"
            label="Real TransactionHistory · desktop single line (flex items-center justify-between: icon + description + type badge + status icon left, amount + chevron right); mobile two-layer (row 1 icon + truncate description + amount; row 2 pl-[52px] date · type badge · status icon · chevron). Chevron only when the row has details. See DESIGN.md §8."
            minHeight={520}
          />
          <div className="mt-3">
            <DualDevicePreview
              previewKey="wallet-account-badge-legend"
              label="Badge legend"
              minHeight={120}
            />
          </div>
        </SubSection>
      </SectionWrapper>

      {/* Settlements · Round 4B spot display alignment — real components mounted here
          so /style-guide actually shows the 3-way kind classifier and the SPOT badge
          appearances registered under settlement-row-* / product-line-badge-legend /
          resolved-market-card-spot / market-search-row-spot. */}
      <SectionWrapper
        id="settlements-4b"
        title="Settlements · 4B spot display"
        platform="shared"
        description="3 settlement rows (futures win, spot settled, spot intraday close) desktop+mobile, ResolvedMarketCard SPOT variant, search results row with SPOT badge, and the product-line badge legend."
      >
        <SubSection title="Settlement rows — desktop (real SettlementRowDesktop)" platform="shared">
          <div className="grid grid-cols-1 gap-3">
            <DualDevicePreview
              previewKey="settlement-row-futures-win-desktop"
              label="Futures · settled · Win — leverage chip + Win badge"
              minHeight={140}
            />
            <DualDevicePreview
              previewKey="settlement-row-spot-settled-desktop"
              label="Spot · settled — SPOT badge + $1/$0 exit + Win badge"
              minHeight={140}
            />
            <DualDevicePreview
              previewKey="settlement-row-spot-closed-desktop"
              label="Spot · intraday close — no Win/Loss chip, PnL is the only signal"
              minHeight={140}
            />
          </div>
        </SubSection>

        <SubSection title="Settlement rows — mobile (real SettlementRowMobile)" platform="shared">
          <div className="grid grid-cols-1 gap-3">
            <DualDevicePreview
              previewKey="settlement-row-futures-win-mobile"
              label="Futures · settled · Win"
              minHeight={220}
            />
            <DualDevicePreview
              previewKey="settlement-row-spot-settled-mobile"
              label="Spot · settled"
              minHeight={220}
            />
            <DualDevicePreview
              previewKey="settlement-row-spot-closed-mobile"
              label="Spot · intraday close"
              minHeight={220}
            />
          </div>
        </SubSection>

        <SubSection title="SPOT badge on cross-surface cards" platform="shared">
          <DualDevicePreview
            previewKey="resolved-market-card-spot"
            label="ResolvedMarketCard · spot variant (real component)"
            minHeight={220}
          />
          <div className="mt-3">
            <DualDevicePreview
              previewKey="market-search-row-spot"
              label="Search / Watchlist result row · spot variant (real MarketCardB)"
              minHeight={220}
            />
          </div>
          <div className="mt-3">
            <DualDevicePreview
              previewKey="product-line-badge-legend"
              label="Product-line badge legend"
              minHeight={140}
            />
          </div>
        </SubSection>
      </SectionWrapper>

      {/* H2E Unlock Playground */}
      <SectionWrapper
        id="h2e-unlock-playground"
        title="H2E Unlock Playground"
        platform="shared"
        description="Switch mock volume to preview the mobile ladder and desktop progress rail states"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Mock Volume Controls</CardTitle>
            <CardDescription>Use the Style Guide viewport switcher to review mobile and desktop layouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border border-border/40 bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Mock volume</span>
                <span className="font-mono text-sm font-semibold text-foreground">${mockVolume.toLocaleString()}</span>
              </div>
              <Slider
                value={[mockVolume]}
                min={0}
                max={H2E_FULL_VOLUME_UNLOCK}
                step={2500}
                onValueChange={([value]) => setMockVolume(value)}
                aria-label="Mock volume"
              />
              <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>$0</span>
                <span>$400K</span>
              </div>
            </div>

            {/* LIVE: production H2eRewardsCard (src/pages/Wallet.tsx) driven by
                the mock volume above — same card /wallet renders. */}
            <H2eRewardsCard h2e={mockH2eSummary} showUnlockToast={unlockedPercent > 0} />

          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Transaction Status Badges */}
      <SectionWrapper
        id="transaction-status"
        title="Transaction Status Badges"
        platform="shared"
        description="Consistent status indicators for deposits, withdrawals, and trades"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Status Badge Variants</CardTitle>
            <CardDescription>Use these consistent status styles across all transaction types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* All Status Examples */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex flex-col items-center gap-2 p-4 bg-muted/20 rounded-lg">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", config.color, config.animate && "animate-spin")} />
                    </div>
                    <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
                      {config.label}
                    </Badge>
                    <code className="text-[10px] text-muted-foreground">{key}</code>
                  </div>
                );
              })}
            </div>

            {/* Usage Examples */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Usage in Transaction Cards</h4>
              <div className="grid gap-3">
                {/* Deposit Example */}
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-trading-green/20 flex items-center justify-center">
                      <ArrowDownLeft className="h-4 w-4 text-trading-green" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">+$500.00</p>
                      <p className="text-xs text-muted-foreground">Deposit • Ethereum</p>
                    </div>
                  </div>
                  <Badge className="bg-trading-green/10 text-trading-green border-trading-green/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </div>

                {/* Withdraw Example */}
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-trading-yellow/20 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-trading-yellow" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">-$200.00</p>
                      <p className="text-xs text-muted-foreground">Withdrawal • Polygon</p>
                    </div>
                  </div>
                  <Badge className="bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                </div>
              </div>
            </div>

            <CodePreview 
              code={`const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-trading-yellow", bgColor: "bg-trading-yellow/10" },
  processing: { icon: Loader2, color: "text-trading-yellow", animate: true },
  completed: { icon: CheckCircle2, color: "text-trading-green" },
  failed: { icon: XCircle, color: "text-trading-red" },
};

<Badge className={cn(config.bgColor, config.color, config.borderColor)}>
  <Icon className={cn("h-3 w-3 mr-1", config.animate && "animate-spin")} />
  {config.label}
</Badge>`}
            />
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Stepper / Progress Timeline */}

      <SectionWrapper
        id="stepper-timeline"
        title="Stepper / Progress Timeline"
        platform="shared"
        description="Visual progress indicators for multi-step processes"
      >
        <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          {/* Vertical Stepper */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg">Vertical Stepper</CardTitle>
              <CardDescription>Used in withdrawal flow and deposit tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {[
                  { label: "Initiated", status: "completed" },
                  { label: "Processing", status: "completed" },
                  { label: "Confirming", status: "current" },
                  { label: "Complete", status: "pending" },
                ].map((step, index, arr) => (
                  <div key={step.label} className="flex gap-3">
                    {/* Step Indicator */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2",
                        step.status === "completed" && "bg-trading-green border-trading-green",
                        step.status === "current" && "bg-trading-yellow/20 border-trading-yellow",
                        step.status === "pending" && "bg-muted border-border"
                      )}>
                        {step.status === "completed" && <CheckCircle2 className="h-4 w-4 text-white" />}
                        {step.status === "current" && <Loader2 className="h-4 w-4 text-trading-yellow animate-spin" />}
                        {step.status === "pending" && <span className="text-xs text-muted-foreground">{index + 1}</span>}
                      </div>
                      {index < arr.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-8 my-1",
                          step.status === "completed" ? "bg-trading-green" : "bg-border"
                        )} />
                      )}
                    </div>
                    {/* Step Content */}
                    <div className="pt-1.5 pb-4">
                      <p className={cn(
                        "text-sm font-medium",
                        step.status === "pending" && "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Block Confirmations */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg">Block Confirmations</CardTitle>
              <CardDescription>Progress bar for blockchain confirmations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-trading-yellow/5 border border-trading-yellow/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-trading-yellow animate-spin" />
                    <span className="text-sm font-medium">Confirming deposit</span>
                  </div>
                  <span className="text-xs text-muted-foreground">~2 min</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Block confirmations</span>
                    <span className="font-mono text-trading-yellow">{demoConfirmations}/15</span>
                  </div>
                  <Progress 
                    value={(demoConfirmations / 15) * 100} 
                    className="h-2 [&>div]:bg-trading-yellow [&>div]:animate-pulse"
                  />
                </div>
              </div>

              {/* Completed State */}
              <div className="p-4 bg-trading-green/5 border border-trading-green/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-trading-green" />
                    <span className="text-sm font-medium">Deposit confirmed</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Block confirmations</span>
                    <span className="font-mono text-trading-green">15/15</span>
                  </div>
                  <Progress value={100} className="h-2 [&>div]:bg-trading-green" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      {/* Blockchain Explorer Links */}
      <SectionWrapper
        id="explorer-links"
        title="Blockchain Explorer Links"
        platform="shared"
        description="Consistent styling for transaction hashes and addresses"
      >
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Explorer Link Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Truncated Hash */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Truncated Transaction Hash</h4>
              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg w-fit">
                <a 
                  href="https://etherscan.io/tx/0x8f3a2b1c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline font-mono"
                >
                  0x8f3a2b...9abcd
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <CodePreview 
                code={`const truncateTxHash = (hash: string) => \`\${hash.slice(0, 6)}...\${hash.slice(-6)}\`;

<a href={\`\${EXPLORER_URL}\${txHash}\`} target="_blank" className="text-primary font-mono">
  {truncateTxHash(txHash)}
  <ExternalLink className="h-3 w-3" />
</a>`}
              />
            </div>

            {/* Security: Color-Coded Address Display */}
            <div className="space-y-4 p-4 border border-primary/20 rounded-xl bg-primary/5">
              <div>
                <h4 className="text-sm font-semibold text-primary mb-1">🔐 Security: Color-Coded Address Display</h4>
                <p className="text-xs text-muted-foreground">
                  Alphanumeric differentiation to prevent character confusion (e.g., '6' vs 'b', '0' vs 'O')
                </p>
              </div>

              {/* Visual Example */}
              <div className="p-5 bg-card/80 border border-border/50 rounded-xl">
                <div className="font-mono text-lg leading-relaxed text-center flex flex-wrap justify-center gap-x-3 gap-y-2">
                  <span className="tracking-wide">
                    <span className="text-primary">0</span>
                    <span className="text-foreground">x</span>
                  </span>
                  {/* 742d */}
                  <span className="tracking-wide">
                    <span className="text-primary">7</span>
                    <span className="text-primary">4</span>
                    <span className="text-primary">2</span>
                    <span className="text-foreground">d</span>
                  </span>
                  {/* 35Cc */}
                  <span className="tracking-wide">
                    <span className="text-primary">3</span>
                    <span className="text-primary">5</span>
                    <span className="text-foreground">C</span>
                    <span className="text-foreground">c</span>
                  </span>
                  {/* 6634 */}
                  <span className="tracking-wide">
                    <span className="text-primary">6</span>
                    <span className="text-primary">6</span>
                    <span className="text-primary">3</span>
                    <span className="text-primary">4</span>
                  </span>
                  {/* C053 */}
                  <span className="tracking-wide">
                    <span className="text-foreground">C</span>
                    <span className="text-primary">0</span>
                    <span className="text-primary">5</span>
                    <span className="text-primary">3</span>
                  </span>
                </div>
              </div>

              {/* Color Legend */}
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Digits (0-9)</span>
                  <code className="text-muted-foreground">text-primary</code>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-foreground" />
                  <span>Letters (a-f)</span>
                  <code className="text-muted-foreground">text-foreground</code>
                </div>
              </div>

              {/* Why This Matters */}
              <div className="p-3 bg-trading-yellow/5 border border-trading-yellow/20 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-trading-yellow">⚠️ When to use:</span>{' '}
                  Always apply this pattern in <code>FullAddressSheet</code> and any full deposit address display. 
                  Helps users verify addresses without confusing similar characters.
                </p>
              </div>

              <CodePreview 
                code={`// src/components/deposit/FullAddressSheet.tsx
{chunks.map((chunk, i) => (
  <span key={i}>
    {chunk.map((item, j) => (
      <span 
        key={j}
        className={item.isDigit ? 'text-primary' : 'text-foreground'}
      >
        {item.char}
      </span>
    ))}
  </span>
))}`}
              />
            </div>

            {/* Truncated Address */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Truncated Address (Non-Security Context)</h4>
              <p className="text-xs text-muted-foreground">For transaction history lists, truncated mono addresses are acceptable.</p>
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  0x8f3a2b...9abcd
                </p>
              </div>
            </div>

            {/* Network Explorer URLs */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Supported Network Explorers</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Network</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Explorer URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {Object.entries(EXPLORER_URLS).map(([network, url]) => (
                      <tr key={network}>
                        <td className="py-2">{network}</td>
                        <td className="py-2 font-mono text-muted-foreground">{url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>
    </div>
  );
};
