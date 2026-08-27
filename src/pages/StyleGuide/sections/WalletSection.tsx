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

    </div>
  );
};
