import { useState } from "react";
import { SectionWrapper, LegacyNotice } from "../components/SectionWrapper";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { LiteStockChart } from "@/components/lite/trade/LiteStockChart";
import { InReviewCard } from "@/components/lite/trade/InReviewCard";
import { SideButton } from "@/components/lite/shared/SideButton";
import {
  SpotSentimentBar,
  SpotSettlementRail,
  SpotYourPosition,
} from "@/components/lite/trade/SpotBlocks";
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
  {
    id: "in-review",
    label: "In review",
    yesPrice: 0.54,
    noPrice: 0.46,
    blocked: true,
    blockedReason: "In review · result pending",
  },
];

export const LiteSpotSection = ({ isMobile }: { isMobile: boolean }) => {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");
  const [pickSide, setPickSide] = useState<"yes" | "no">("yes");

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
        description="P0 #1 price snapshot at submit; P0 #2 cash leg via balanceDelta. Sides labels from event.side_labels (Up/Down aliases), never children[0]. The Yes/No pair is the shared SideButton — priced buttons are label-left / price-right (justify-between, mono price); the COMPACT Yes/No capsule variant is the py-[9px] one used by LiteMarketBoard."
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
        title="Lite spot · Chart toggle (odds follow the selected side)"
        description="Default = stock price with dashed price-to-beat baseline; toggle to odds ¢. The odds series, label and stroke follow the side selected in the order card — Up uses --yes, Down uses --no (100 − Up per point). Series come from price_history when available, else deterministic front-end synth (DEMO-STATE)."
      >
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          {(["yes", "no"] as const).map((s) => (
            <div key={s}>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                side = {s} ({s === "yes" ? "Up" : "Down"})
              </div>
              <LiteStockChart
                ticker="NVDA"
                basePrice={171.08}
                currentPrice={173.42}
                upOdds={preset.yesPrice}
                side={s}
                upLabel="Up"
                downLabel="Down"
              />
            </div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="lite-spot-parity"
        title="Lite spot · Shared modules"
        description="Market activity uses the same LiteMarketActivity component (and useMarketActivityRows hook) as the contract page — 4 rows mobile / 8 desktop, spot rows are always 1×. The position card carries a Cash out footer that opens LiteCashOutFlow; see the Lite contract section for its full state matrix. Spot cash-out routes through the existing spot sell path so proceeds credit the cash balance."
      >
        <div className="rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
          No duplicate demos here on purpose — both modules are rendered in the Lite
          contract section and are byte-identical on this page.
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Quick-round trade page (LiteQuickTrade) — no page-level preset.
          </span>{" "}
          Its round switcher, round tape and rule card are private to the page
          component and the page itself resolves live rounds through
          useQuickRounds (database) plus useSecondTick (real clock), so it cannot
          render deterministically here without being refactored into exported
          modules. Its shared parts are covered elsewhere: the order card above,
          RoundPlot and Last8Strip in the All-stage section, LiteMarketActivity in
          the Lite contract section, and the SpotBlocks trio demoed below.
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="lite-spot-blocks"
        title="Lite spot · SpotBlocks (crowd bar · settlement rail · your position)"
        description="The three shared trunk modules of /spot (also reused by the quick-round page). Real components from src/components/lite/trade/SpotBlocks.tsx with mock props — desktop and mobile mount the same markup, only the column width changes."
      >
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotSentimentBar · Up favoured
            </div>
            <SpotSentimentBar yesLabel="Up" noLabel="Down" yesPct={preset.yesPrice * 100} volText="$184.2K" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotSentimentBar · edge 99/1 clamp
            </div>
            <SpotSentimentBar yesLabel="Up" noLabel="Down" yesPct={0.4} volText="$12.0K" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotSettlementRail · trading now
            </div>
            <SpotSettlementRail
              blocked={false}
              tradingNow
              nodes={[
                { key: "open", label: "Market opens", time: "09:30" },
                { key: "now", label: "Trading", time: "now", now: true },
                { key: "close", label: "Cash close", time: "16:00" },
                { key: "settle", label: "Settles", time: "16:05" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotSettlementRail · settled (all nodes complete)
            </div>
            <SpotSettlementRail
              blocked
              settled
              tradingNow={false}
              nodes={[
                { key: "open", label: "Market opens", time: "09:30" },
                { key: "mid", label: "Trading", time: "closed" },
                { key: "close", label: "Cash close", time: "16:00" },
                { key: "settle", label: "Settled", time: "16:05" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotSettlementRail · in review (terminal node pending)
            </div>
            <SpotSettlementRail
              blocked
              tradingNow={false}
              nodes={[
                { key: "open", label: "Market opens", time: "09:30" },
                { key: "mid", label: "Trading", time: "closed" },
                { key: "close", label: "Cash close", time: "16:00" },
                { key: "settle", label: "In review", time: "16:05" },
              ]}
            />
            <InReviewCard sourceName="Nasdaq official close" holding />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotYourPosition · Up in profit
            </div>
            <SpotYourPosition
              sideLabel="Up"
              isYesSide
              sizeDisplay="92.59"
              pnl="+$12.40"
              pnlPercent="+24.8%"
              currentValue={62.4}
              avgCost="54¢"
              ifWinsLabel="If Up wins"
              ifWinsValue="$92.59"
              onCashOut={() => undefined}
            />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              SpotYourPosition · Down under water
            </div>
            <SpotYourPosition
              sideLabel="Down"
              isYesSide={false}
              sizeDisplay="108.70"
              pnl="-$8.10"
              pnlPercent="-16.2%"
              currentValue={41.9}
              avgCost="46¢"
              ifWinsLabel="If Down wins"
              ifWinsValue="$108.70"
              onCashOut={() => undefined}
            />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="lite-quick-pickcard"
        title="Lite quick round · YOUR PICK card + buy-drawer header"
        description="Parity ruling 2026-08-06: the quick-round page is the only spot page with side selection outside the order panel (desktop hideSideSelector) — rounds roll every few minutes with a fresh threshold and deadline, so the per-round question stays at the top. Its chips are the shared SideButton at size='compact' (no bespoke styling), single-line 'Up 49¢' — the old '% say' sublabels are banned as duplicates of the crowd bar."
      >
        <LegacyNotice />
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <div
            style={{
              background: "#131519",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 15,
              padding: 14,
            }}
          >
            <div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Your pick · 5M round
            </div>
            <div className="font-display mt-1.5 text-[14.5px] font-bold">
              BTC higher than $63,240 at 15:10?
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SideButton
                active={pickSide === "yes"}
                tone="yes"
                label="Up"
                price={0.49}
                size="compact"
                onClick={() => setPickSide("yes")}
              />
              <SideButton
                active={pickSide === "no"}
                tone="no"
                label="Down"
                price={0.51}
                size="compact"
                onClick={() => setPickSide("no")}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border/70 p-5">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Mobile buy-drawer header (same grammar as the daily-stock drawer)
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  pickSide === "yes" ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
                )}
              >
                {pickSide === "yes" ? "Up" : "Down"}
              </span>
              <span className="text-sm font-semibold">Buy BTC 5M</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Settles in <span className="font-mono">02:41</span> ·{" "}
              {pickSide === "yes" ? 49 : 51}% chance
            </div>
            <div className="mt-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Sticky buy bar · settling (remaining ≤ 0)
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled
                className="flex-1 rounded-xl bg-yes py-3 font-display text-sm font-bold text-[#04222c] disabled:opacity-50"
              >
                Settling
              </button>
              <button
                type="button"
                disabled
                className="flex-1 rounded-xl border border-no/25 bg-no/14 py-3 font-display text-sm font-bold text-no disabled:opacity-50"
              >
                Settling
              </button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
};

export default LiteSpotSection;