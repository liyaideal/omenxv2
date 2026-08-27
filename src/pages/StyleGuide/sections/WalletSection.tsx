import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { DualDevicePreview } from "../components/DeviceFrame";
import {
  MaintenanceNoticeBannerView,
  MAINTENANCE_NOTICE_DEMO_SETS,
} from "@/components/wallet/MaintenanceNoticeBanner";
import { cn } from "@/lib/utils";

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

export const WalletSection = ({ isMobile: _isMobile }: WalletSectionProps) => {
  const [maintenancePreset, setMaintenancePreset] = useState<MaintenancePreset>("single");
  const maintenanceNotices = MAINTENANCE_NOTICE_DEMO_SETS[maintenancePreset];

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
