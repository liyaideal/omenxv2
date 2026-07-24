import { useState } from "react";
import { SectionWrapper } from "../components/SectionWrapper";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { LiteStockChart } from "@/components/lite/trade/LiteStockChart";
import { cn } from "@/lib/utils";

/**
 * Lite spot-trade playground. Enumerates every visual state the order card
 * and chart can reach so regressions land here first.
 */

type Preset = {
  id: string;
  label: string;
  yesPrice: number;
  noPrice: number;
  blocked: boolean;
  blockedReason?: string;
};

const PRESETS: Preset[] = [
  { id: "coinflip", label: "Coin flip 50/50", yesPrice: 0.5, noPrice: 0.5, blocked: false },
  { id: "yes-fav", label: "Up favoured 72¢", yesPrice: 0.72, noPrice: 0.28, blocked: false },
  { id: "no-fav", label: "Down favoured 68¢", yesPrice: 0.32, noPrice: 0.68, blocked: false },
  { id: "edge", label: "Edge 5¢ / 95¢", yesPrice: 0.05, noPrice: 0.95, blocked: false },
  {
    id: "closed",
    label: "Market closed",
    yesPrice: 0.54,
    noPrice: 0.46,
    blocked: true,
    blockedReason: "Market frozen",
  },
];

export const LiteSpotSection = ({ isMobile }: { isMobile: boolean }) => {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");

  const shared = {
    eventName: "Preview event",
    eventId: "preview-event",
    countdownText: "01:23:45",
    yesLabel: "Up",
    noLabel: "Down",
    yesPrice: preset.yesPrice,
    noPrice: preset.noPrice,
    yesOptionId: "preview-yes",
    noOptionId: "preview-no",
    yesOptionLabel: "Up",
    noOptionLabel: "Down",
    blocked: preset.blocked,
    blockedReason: preset.blockedReason,
    side,
    onSideChange: setSide,
    amount,
    onAmountChange: setAmount,
    onRequestAuth: () => undefined,
  } as const;

  return (
    <div className="space-y-8">
      <SectionWrapper
        id="lite-spot-order"
        title="Lite spot · Order card (states)"
        description="P0 #1 price snapshot at submit; P0 #2 cash leg via balanceDelta. Sides labels from event.side_labels (Up/Down aliases), never children[0]."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                p.id === presetId
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <LiteOrderPanel {...shared} variant="desktop" />
          <div className="rounded-2xl border border-dashed border-border/70 p-5">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Mobile drawer body (same component, variant=mobile)
            </div>
            <LiteOrderPanel {...shared} variant="mobile" />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="lite-spot-chart"
        title="Lite spot · Chart toggle"
        description="Default = stock price with dashed price-to-beat baseline; toggle to Up odds ¢ (yes-blue). Series come from price_history when available, else deterministic front-end synth (DEMO-STATE)."
      >
        <LiteStockChart
          ticker="NVDA"
          basePrice={171.08}
          currentPrice={173.42}
          upOdds={preset.yesPrice}
        />
      </SectionWrapper>
    </div>
  );
};

export default LiteSpotSection;