// ============================================================
// /spot — Pro Spot trading terminal (US-stock daily up/down), DESKTOP ONLY.
// Structural rule: this page IS a terminal like /trade, with the
// futures-only surfaces stripped out. It MUST NOT render the
// site-wide navigation header (see DESIGN.md §14 anti-patterns).
//
// SP-2 · B4/B5 — the mobile branch moved to `SpotTradingCharts` /
// `SpotTradeOrder`; all state and engine logic lives in
// `useSpotTerminal`, all render blocks in `pro/ProSpotShared`.
// ============================================================
import { Loader2 } from "lucide-react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { DesktopOrderBook } from "@/components/DesktopOrderBook";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { ProSpotHeader } from "@/components/pro/ProSpotHeader";
import { money2 } from "@/components/pro/ProSpotPanel";
import { ProTerminalLayout } from "@/components/pro/ProTerminalLayout";
import {
  SpotTradePanel,
  SpotOrderPreviewDialog,
  SpotAccountPanel,
  SpotEventInfoPanel,
  SpotBottomTabs,
} from "@/components/pro/ProSpotShared";
import { useSpotTerminal, mock24hVolume } from "@/hooks/useSpotTerminal";
import { cn } from "@/lib/utils";

export default function SpotTrading() {
  const t = useSpotTerminal();

  // ---- Render guards ----
  if (t.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (t.notFound || !t.event) return <ExpiredEventFallback eventId={t.eventId} />;

  const event = t.event;
  const outcomeChangePct =
    t.sessionOpenMark != null && t.sessionOpenMark > 0
      ? ((t.outcomePrice - t.sessionOpenMark) / t.sessionOpenMark) * 100
      : null;

  // -----------------------------------------------------------------
  // Terminal header — desktop
  // NO site-wide navigation. This chrome is deliberately borrowed
  // from DesktopTrading so /spot feels like a trading terminal.
  // -----------------------------------------------------------------
  const DesktopChrome = (
    <ProSpotHeader
      ticker={t.ticker}
      eventName={event.name}
      lifecycleBadge={{ label: t.badge.label, className: t.badge.className }}
      countdown={{ text: t.countdown.text, urgency: t.countdown.urgency as "red" | "yellow" | "muted" }}
      freezeEtOnly={t.freezeEtOnly}
      closeEtOnly={t.closeEtOnly}
      settleEtOnly={t.settleEtOnly}
      closingSoon={t.closingSoon && t.lifecycle === "TRADING"}
      volumeText={mock24hVolume(event.id)}
      lastLabel={t.ticker || "Last"}
      lastPriceText={t.indicative != null ? `${t.cur}${money2(t.indicative)}` : "—"}
      lastIsUp={t.indicativePct >= 0}
      lastHint={
        t.indicative != null
          ? `${t.indicativePct >= 0 ? "+" : ""}${t.indicativePct.toFixed(2)}%${t.sessionTag ? ` · ${t.sessionTag}` : ""}`
          : undefined
      }
      watched={t.isWatched(event.id)}
      onToggleWatch={() => t.toggleWatch(event.id)}
      onBack={t.goBack}
    />
  );

  // ---- Desktop ----
  return (
    <ProTerminalLayout
      chartMinHeightClass="min-h-[600px]"
      header={DesktopChrome}
      chart={
        <>
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
            {(["Chart", "Event Info"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => t.setChartTab(tab)}
                className={cn(
                  "text-sm font-medium transition-all",
                  t.chartTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {t.chartTab === "Chart" ? (
            <>
              <div className="px-4 py-2 border-b border-border/30">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold font-mono">{t.outcomePrice.toFixed(4)}</span>
                  {outcomeChangePct != null ? (
                    <span className={cn("text-sm font-mono", outcomeChangePct >= 0 ? "text-trading-green" : "text-trading-red")}>
                      {outcomeChangePct >= 0 ? "+" : ""}{outcomeChangePct.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground">--</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Base {t.basePrice != null ? `${t.cur}${t.basePrice.toFixed(2)}` : "—"} · {t.priorCloseDateLabel} close · flat = {t.noLabel}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <CandlestickChart
                  remainingDays={1}
                  basePrice={t.outcomePrice || 0.5}
                  side={t.side}
                  onSeriesReady={t.seedSessionOpenMark}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto">
              <SpotEventInfoPanel t={t} />
            </div>
          )}
        </>
      }
      orderBook={
        <DesktopOrderBook
          asks={t.book.asks}
          bids={t.book.bids}
          currentPrice={t.outcomePrice.toFixed(4)}
          markPrice={t.outcomePrice.toFixed(4)}
          isPositive={outcomeChangePct != null && outcomeChangePct >= 0}
          side={t.side}
          variant="spot"
          quoteMode={t.sessionProfile.quoteMode}
          onPriceClick={(price) => {
            t.setLimitPrice(price);
            t.setOrderType("Limit");
          }}
        />
      }
      bottomTabs={<SpotBottomTabs t={t} />}
      panel={<SpotTradePanel t={t} />}
      account={<SpotAccountPanel t={t} />}
    >
      <SpotOrderPreviewDialog t={t} />
      <AuthDialog open={t.authOpen} onOpenChange={t.setAuthOpen} defaultTab="signup" />
    </ProTerminalLayout>
  );
}
