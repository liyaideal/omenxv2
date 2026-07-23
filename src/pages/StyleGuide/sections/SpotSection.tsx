import { Badge } from "@/components/ui/badge";
import {
  LIFECYCLE_BADGE,
  LP_QUOTE_MODE_BADGE,
  SESSION_PROFILES,
  type SessionProfile,
} from "@/lib/usStockSessions";
import { SpotStatsHeader } from "@/components/SpotStatsHeader";
import { SectionWrapper } from "../components/SectionWrapper";
import { PositionDetailContent } from "@/components/positions/PositionDetailContent";
import type { UnifiedPosition } from "@/hooks/usePositions";
import { ArrowLeft, Star, Info } from "lucide-react";


interface Props { isMobile: boolean }

/**
 * Style-guide gallery for /spot. Mirrors the terminal skeleton so any
 * regression (site nav creeping back, wrong CTA color, perp fields leaking
 * in) is visible here first.
 */
export const SpotSection = ({ isMobile }: Props) => {
  return (
    <div className="space-y-8">
      {/* Terminal chrome — the whole point: NO site nav on trading pages */}
      <SectionWrapper
        id="spot-terminal-chrome"
        title="Spot terminal chrome"
        description="LOCKED per DESIGN.md §7: Left = identity + status badges + single countdown row (Trading ends in X · until HH:MM ET · ⓘ schedule). Right = Volume · Base ({priorDate} close) · {TICKER} price %. NO second time row, NO Yes-price stat, NO 中文 characters in the header — local time only inside the ⓘ tooltip and auto-detected."
      >
        <div className="rounded-lg border border-border/50 overflow-hidden bg-background">
          <header className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
            <button className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 border border-border/60 font-mono text-[11px] font-semibold">AAP</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">Will AAPL close higher today? (Jul 15)</span>
                  <Badge variant="outline" className="text-[10px]">SPOT</Badge>
                  <Badge variant="outline" className={`text-[10px] border ${LIFECYCLE_BADGE.TRADING.className}`}>Trading</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <span>Trading ends in</span>
                  <span className="font-mono font-medium text-foreground">09:23:56</span>
                  <span>·</span>
                  <span className="font-mono">until 15:55 ET</span>
                  <Info className="w-3 h-3 opacity-70" />
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-6 text-xs">
              <Stat label="Volume" value="$802K" />
              <Stat label="Base (Jul 14 close)" value="$231.10" />
              <Stat label="AAPL" value="$231.08" valueClass="text-trading-red" hint="−0.01% · after-hrs" />
            </div>
            <Star className="w-5 h-5 text-trading-yellow fill-trading-yellow ml-2" />
          </header>
        </div>
      </SectionWrapper>

      {/* Spot stats header (mobile / embedded variant) */}
      <SectionWrapper
        id="spot-stats-header"
        title="SpotStatsHeader — 3 lifecycle states"
        description="Standalone header used when embedding spot metadata outside the terminal (fallback / mobile)."
      >
        <div className="space-y-3">
          <SpotStatsHeader eventId="us-tsla-updown-20260715" eventName="Will TSLA close higher today?" basePrice={268.30} yesPrice={0.44} lifecycle="TRADING" />
          <SpotStatsHeader eventId="us-nvda-updown-20260715" eventName="Will NVDA close higher today?" basePrice={182.45} yesPrice={0.57} lifecycle="SUSPENDED" />
          <SpotStatsHeader eventId="us-aapl-updown-20260715" eventName="Will AAPL close higher today?" basePrice={231.10} yesPrice={0.54} lifecycle="FROZEN" />
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="spot-lifecycle"
        title="Lifecycle badges (9 states)"
        description="events.event_status enum per 技术对接 v1.0 §2: CREATED / EXTENDED_TRADING / TRADING / FROZEN / SETTLING / SETTLED + SUSPENDED / REVIEW / CANCELED. OPEN_COOLDOWN and CLOSE_MODE were removed (QA-16: open protection lives in the LP quote profile). Only TRADING / EXTENDED_TRADING accept new orders; SUSPENDED is cancel-only."

      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(LIFECYCLE_BADGE).map(([k, v]) => (
            <Badge key={k} variant="outline" className={`text-[10px] border ${v.className}`}>{v.label}</Badge>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="spot-quote-mode"
        title="LP quote-mode badge"
        description="Rendered in the order-book header. Enum mirrors lp_quote_mode. Default on demo is NORMAL."
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(LP_QUOTE_MODE_BADGE).map(([k, v]) => (
            <span
              key={k}
              className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded border ${v.className}`}
              title={v.tooltip}
            >
              {v.label}
            </span>
          ))}
        </div>
      </SectionWrapper>

      {/* CTA colour semantics — regression pin */}
      <SectionWrapper
        id="spot-cta"
        title="Trade CTA — semantic colour only"
        description="Buy Up → trading-green. Buy Not Up → trading-red. NEVER primary/purple. Text follows selected outcome + Buy/Sell."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <button className="h-11 rounded-lg font-semibold text-sm bg-trading-green hover:bg-trading-green/90 text-trading-green-foreground">
            Buy Up · To win $126 →
          </button>
          <button className="h-11 rounded-lg font-semibold text-sm bg-trading-red hover:bg-trading-red/90 text-foreground">
            Buy Not Up · To win $180 →
          </button>
          <button className="h-11 rounded-lg font-semibold text-sm bg-trading-green hover:bg-trading-green/90 text-trading-green-foreground">
            Sell Up
          </button>
          <button className="h-11 rounded-lg font-semibold text-sm bg-trading-red hover:bg-trading-red/90 text-foreground">
            Sell Not Up
          </button>
        </div>
      </SectionWrapper>

      {/* Session-aware order-book profiles */}
      <SectionWrapper
        id="spot-session-profiles"
        title="Session-aware LP profiles"
        description="getCurrentSession() picks the profile from wall-clock ET. Depth/spread/size + quote-mode badge follow the session (LP PRD §4.2/§6.1). DEMO-STATE."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {Object.values(SESSION_PROFILES).map((p) => (
            <SessionProfileCard key={p.session} profile={p} />
          ))}
        </div>
      </SectionWrapper>

      {/* Countdown urgency + price-step precision groups */}
      <SectionWrapper
        id="spot-countdown-precision"
        title="Countdown urgency + price-step precision"
        description="Terminal countdown targets events.freeze_time (trading window ends there). Three urgency tiers (>1h muted / ≤1h yellow / ≤15m red + per-second pulse). Spot order book uses $0.01 tick with precision groups 0.01 / 0.02 / 0.05 — never the futures 0.0001 group."
      >
        <div className="grid gap-3 md:grid-cols-3 text-xs">
          <div className="rounded-lg border border-border/50 p-3 space-y-1">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Muted &gt; 1h</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span className="text-foreground font-mono">05:42:11</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 p-3 space-y-1">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Yellow ≤ 1h</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-trading-yellow" />
              <span className="text-trading-yellow font-mono">00:37:22</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 p-3 space-y-1">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Red ≤ 15m (pulse)</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-trading-red animate-pulse" />
              <span className="text-trading-red font-mono animate-pulse">00:04:09</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Precision groups:</span>
          {["0.01", "0.02", "0.05"].map((s) => (
            <span key={s} className="px-2 py-0.5 rounded bg-muted font-mono text-[11px]">{s}</span>
          ))}
        </div>
      </SectionWrapper>

      {/* Net-position auto-reduce (SIGNED_YES_SHARE) */}
      <SectionWrapper
        id="spot-net-position"
        title="Net position (SIGNED_YES_SHARE) — auto reduce"
        description="技术对接 §7: one-way net position per event. Buying the opposite outcome reduces the existing leg first (settled at implied 1 − price), then any surplus opens the new side. Only one leg exists per event at a time."
      >
        <div className="grid gap-3 md:grid-cols-3 text-xs">
          <NetPosStep n={1} title="Start" body="Hold +10 sh Up @ $0.42" tone="green" />
          <NetPosStep n={2} title="Buy 6 Not Up @ $0.55" body="Reduces Up by 6 sh at implied $0.45. Realized PnL = (0.45 − 0.42) × 6 = +$0.18." tone="yellow" />
          <NetPosStep n={3} title="Result" body="Net +4 sh Up · no Not Up leg." tone="green" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs">
          <NetPosStep n={1} title="Start" body="Hold +10 sh Up @ $0.42" tone="green" />
          <NetPosStep n={2} title="Buy 15 Not Up @ $0.55" body="Closes Up fully (+$0.30 realized), opens +5 sh Not Up @ $0.55." tone="yellow" />
          <NetPosStep n={3} title="Result" body="Net +5 sh Not Up · no Up leg." tone="red" />
        </div>
      </SectionWrapper>


      {/* Pending limit orders (Cancel / Reserved) */}
      <SectionWrapper
        id="spot-pending-orders"
        title="Current Orders — Pending / Cancel"
        description="Buy limit < best ask → Pending (cash reserved). Sell limit > best bid → Pending. Cancel refunds reserved cash for buys. Touch-fill is front-end simulated; DEMO-STATE."
      >
        <div className="rounded-lg border border-border/50 overflow-hidden text-xs">
          <div className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.7fr_0.8fr_0.7fr_0.7fr_0.5fr] gap-2 px-4 py-2 text-muted-foreground border-b border-border/30 bg-muted/30">
            <span>Market</span>
            <span>Side</span>
            <span>Type</span>
            <span className="text-right">Limit</span>
            <span className="text-right">Qty (sh)</span>
            <span className="text-right">Reserved</span>
            <span className="text-right">Status</span>
            <span />
          </div>
          {SAMPLE_ORDERS.map((o, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.7fr_0.8fr_0.7fr_0.7fr_0.5fr] gap-2 px-4 py-2 items-center border-b border-border/20"
            >
              <span className="truncate">{o.market}</span>
              <span className={`uppercase ${o.side === "buy" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</span>
              <span>{o.type}</span>
              <span className="text-right font-mono">{o.limit}</span>
              <span className="text-right font-mono">{o.qty}</span>
              <span className="text-right font-mono text-muted-foreground">{o.reserved}</span>
              <span className={`text-right ${o.status === "Pending" ? "text-trading-yellow" : "text-muted-foreground"}`}>
                {o.status}
              </span>
              <button
                disabled={o.status !== "Pending"}
                className="text-[10px] text-trading-red hover:underline text-right disabled:opacity-40 disabled:no-underline"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      </SectionWrapper>
      {/* Position detail — spot vs futures side-by-side */}
      <SectionWrapper
        id="spot-position-detail"
        title="Position detail — spot vs futures"
        description="Both dialog (desktop) and drawer (mobile) render PositionDetailContent. Spot branch MUST hide leverage / liquidation / funding / est. close fee and switch to Shares / Avg cost / Current value / Cost basis + settlement footnote. Regression check: a spot row that still shows a Liq. price is a data-line bug — see docs/changelog/2026-07-21-spot-dataline-hardening.md."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/60 p-4 bg-background">
            <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Spot</div>
            <PositionDetailContent position={MOCK_SPOT_POSITION} />
          </div>
          <div className="rounded-lg border border-border/60 p-4 bg-background">
            <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Futures (reference)</div>
            <PositionDetailContent position={MOCK_FUTURES_POSITION} />
          </div>
        </div>
      </SectionWrapper>

      
      {/* Removed fields — anti-pattern reference */}
      <SectionWrapper
        id="spot-removed-fields"
        title="Removed on spot (anti-pattern reference)"
        description="Fields that MUST NOT appear anywhere on /spot. Kept here so regressions are obvious."
      >
        <div className="rounded-lg border border-trading-red/30 bg-trading-red/5 p-4 text-xs font-mono space-y-1 text-muted-foreground">
          <div>❌ Margin Mode / Cross</div>
          <div>❌ Leverage slider + multiplier chips</div>
          <div>❌ TP / SL block</div>
          <div>❌ Funding Rate / Next Funding / Open Interest / Index Price</div>
          <div>❌ Liq. price / Margin req.</div>
          <div>❌ BTCUSDT / USDT Perpetual defaults from `DesktopHeader`</div>
          <div>❌ Site-wide nav header (`EventsDesktopHeader`, `MobileHeader` w/ Logo)</div>
          <div>❌ Second time row under the countdown ("Settles at HH:MM ET · credits by ...")</div>
          <div>❌ Yes Price stat in the header (duplicates the Trade panel + chart)</div>
          <div>❌ Non-English characters anywhere in the header (中文/北京 chip, Beijing timezone label)</div>
          <div>❌ "24h Volume" — event lifecycle is intraday, drop the "24h" prefix, just "Volume"</div>
        </div>
      </SectionWrapper>
    </div>
  );
};

const MOCK_SPOT_POSITION: UnifiedPosition = {
  id: "mock-spot",
  _source: "local",
  event: "TSLA · Up (Jul 15)",
  option: "Up",
  optionId: "mock-opt-spot",
  displayOption: "Up",
  side: "Yes",
  type: "long",
  size: "500",
  sizeDisplay: "500",
  sizeNum: 500,
  entryPrice: "$0.42",
  entryPriceNum: 0.42,
  markPrice: "$0.47",
  markPriceNum: 0.47,
  margin: "$210.00",
  marginNum: 210,
  leverage: "1x",
  pnl: "+$25.00",
  pnlPercent: "+11.9%",
  pnlNum: 25,
  fundingAccrued: 0,
  lastFundingAt: null,
  createdAt: new Date().toISOString(),
  productLine: "spot",
} as unknown as UnifiedPosition;

const MOCK_FUTURES_POSITION: UnifiedPosition = {
  id: "mock-fut",
  _source: "local",
  event: "BTC ≥ $150k · Yes",
  option: "Yes",
  optionId: "mock-opt-fut",
  displayOption: "Yes",
  side: "Yes",
  type: "long",
  size: "1000",
  sizeDisplay: "1,000",
  sizeNum: 1000,
  entryPrice: "$0.50",
  entryPriceNum: 0.5,
  markPrice: "$0.58",
  markPriceNum: 0.58,
  margin: "$50.00",
  marginNum: 50,
  leverage: "10x",
  pnl: "+$80.00",
  pnlPercent: "+160%",
  pnlNum: 80,
  fundingAccrued: 1.2,
  lastFundingAt: new Date(Date.now() - 3 * 60_000).toISOString(),
  createdAt: new Date().toISOString(),
  productLine: "futures",
} as unknown as UnifiedPosition;

const SAMPLE_ORDERS = [
  { market: "TSLA · Up (Jul 15)", side: "buy", type: "Limit", limit: "$0.42", qty: "500", reserved: "$210.00", status: "Pending" },
  { market: "NVDA · Not Up (Jul 15)", side: "sell", type: "Limit", limit: "$0.61", qty: "300", reserved: "—", status: "Pending" },
  { market: "AAPL · Up (Jul 15)", side: "buy", type: "Limit", limit: "$0.55", qty: "200", reserved: "$110.00", status: "Filled" },
];

const SessionProfileCard = ({ profile }: { profile: SessionProfile }) => {
  const badge = LP_QUOTE_MODE_BADGE[profile.quoteMode];
  return (
    <div className="rounded-lg border border-border/50 p-3 bg-background space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{profile.label}</span>
        <span
          className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded border ${badge.className}`}
          title={badge.tooltip}
        >
          {badge.label}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground">{profile.tooltip}</div>
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div>
          <div className="text-muted-foreground text-[10px]">Levels</div>
          <div>
            {profile.levelsMin}
            {profile.levelsMin === profile.levelsMax ? "" : `–${profile.levelsMax}`}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-[10px]">Spread ×</div>
          <div>{profile.spreadMult}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-[10px]">Size ×</div>
          <div>{profile.sizeMult}</div>
        </div>
      </div>
    </div>
  );
};

const NetPosStep = ({
  n,
  title,
  body,
  tone,
}: {
  n: number;
  title: string;
  body: string;
  tone: "green" | "red" | "yellow";
}) => {
  const toneClass =
    tone === "green"
      ? "border-trading-green/40 bg-trading-green/5"
      : tone === "red"
        ? "border-trading-red/40 bg-trading-red/5"
        : "border-trading-yellow/40 bg-trading-yellow/5";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-[10px] text-muted-foreground font-mono">STEP {n}</div>
      <div className="mt-1 font-semibold text-sm">{title}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{body}</div>
    </div>
  );
};



const Stat = ({ label, value, valueClass, hint }: { label: string; value: string; valueClass?: string; hint?: string }) => (
  <div className="text-xs">
    <div className="text-muted-foreground">{label}</div>
    <div className={`font-mono font-medium ${valueClass ?? ""}`}>
      {value}
      {hint && <span className={`ml-1 text-[10px] ${valueClass ?? ""}`}>{hint}</span>}
    </div>
  </div>
);
