import { useNavigate } from "react-router-dom";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";

import { SeoFooter } from "@/components/seo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiTerminal, type TerminalTab } from "@/components/developers/ApiTerminal";
import { EndpointMarquee } from "@/components/developers/EndpointMarquee";
import { MiniOrderBook } from "@/components/developers/MiniOrderBook";
import { DevelopersPageMobile } from "./DevelopersPageMobile";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Radio,
  KeyRound,
  FileCode,
  Cpu,
  ChevronRight,
  Check,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// DEMO-STATE: 展示性指标，上线前以真实 SLA 口径替换
const HERO_STATS = [
  { value: "47 ms", label: "p50 latency" },
  { value: "99.95%", label: "Uptime" },
  { value: "31", label: "REST endpoints" },
  { value: "9", label: "WS topics" },
];

const heroTabs: TerminalTab[] = [
  {
    label: "cURL",
    lang: "bash",
    code: `# POST /v1/orders/preview — dry run, no state change
curl -X POST https://api.omenx.io/v1/orders/preview \\
  -H "X-OMENX-API-KEY: $OMENX_KEY" \\
  -H "X-OMENX-TS: 1721059431" \\
  -H "X-OMENX-SIGN: $SIG" \\
  -d '{
    "market_id": "BTC_ABOVE:150000:2026-12-31",
    "outcome_side": "YES",
    "order_type": "LIMIT",
    "limit_price": "0.5142",
    "size": 240,
    "client_order_id": "a1b2c3d4"
  }'

# 200 OK
{
  "pricing_snapshot_id": "ps_01J2ZKQ4T9",
  "estimated_fill_price": "0.5142",
  "estimated_margin_u": "4.2183",
  "fee_preview_u": "0.1872",
  "expires_in_ms": 3000
}`,
  },
  {
    label: "Python",
    lang: "python",
    code: `from omenx import Client

client = Client(key=OMENX_KEY, secret=OMENX_SECRET)

preview = client.orders.preview(
    market_id="BTC_ABOVE:150000:2026-12-31",
    outcome_side="YES",
    order_type="LIMIT",
    limit_price="0.5142",
    size=240,
    client_order_id="a1b2c3d4",
)

# preview.pricing_snapshot_id -> "ps_01J2ZKQ4T9"
# preview.estimated_margin_u  -> "4.2183"
# preview.fee_preview_u       -> "0.1872"`,
  },
  {
    label: "TypeScript",
    lang: "ts",
    code: `import { OmenX } from "@omenx/sdk";

const client = new OmenX({ key: process.env.OMENX_KEY });

const preview = await client.orders.preview({
  market_id: "BTC_ABOVE:150000:2026-12-31",
  outcome_side: "YES",
  order_type: "LIMIT",
  limit_price: "0.5142",
  size: 240,
  client_order_id: "a1b2c3d4",
});

// preview.pricing_snapshot_id === "ps_01J2ZKQ4T9"
// preview.estimated_margin_u  === "4.2183"`,
  },
];

const signTabs: TerminalTab[] = [
  {
    label: "sign.sh",
    lang: "bash",
    code: `# HMAC-SHA256 over: {timestamp}{method}{path}{body}
TS=$(date +%s)
BODY='{"market_id":"BTC_ABOVE:150000:2026-12-31","outcome_side":"YES"}'
SIG=$(printf '%s' "$TS POST /v1/orders/preview $BODY" \\
  | openssl dgst -sha256 -hmac "$OMENX_SECRET" -hex \\
  | awk '{print $2}')

curl -X POST https://api.omenx.io/v1/orders/preview \\
  -H "X-OMENX-API-KEY: $OMENX_KEY" \\
  -H "X-OMENX-TS: $TS" \\
  -H "X-OMENX-SIGN: $SIG" \\
  -d "$BODY"`,
  },
];

const tiers = [
  {
    name: "Read-only",
    tag: "Free · instant",
    body: "Query markets, account and history. No deposit required.",
    chips: ["read_public", "read_private", "ws_public"],
    accent: "muted",
  },
  {
    name: "Trading",
    tag: "Self-serve",
    body: "Full order lifecycle plus private streams. Unlocks at one deposit, $100 equity, one filled trade.",
    chips: ["trade_order", "trade_cancel", "trade_conditional", "ws_private"],
    accent: "primary",
  },
  {
    name: "Pro / Market Maker",
    tag: "Manual review",
    body: "Raised limits and dedicated capacity. Reviewed case by case.",
    chips: ["elevated_rate_limits", "dedicated_ws", "mm_program"],
    accent: "amber",
  },
] as const;

const resources = [
  { icon: FileCode, title: "REST Reference", body: "Every endpoint, every field, every error code." },
  { icon: Radio, title: "WebSocket Guide", body: "Public & private streams, heartbeats, reconnection." },
  { icon: Cpu, title: "Agent Integration", body: "Preview → submit patterns for autonomous agents." },
];

const dotBg =
  "bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.15)_1px,transparent_0)] [background-size:22px_22px]";

/**
 * Section header — engineering-schematic style.
 * Ghost oversized number + small h2 + subtitle, with a right-aligned mono meta note.
 * Bottom hairline is rendered by the caller so it spans the intended width (tracks-only).
 */
const SectionHeader = ({
  n,
  title,
  subtitle,
  meta,
}: {
  n: string;
  title: string;
  subtitle: string;
  meta: string;
}) => (
  <div className="flex items-end justify-between gap-6 pb-4 border-b border-border/30 mb-8">
    <div className="flex items-end gap-3 md:gap-4 min-w-0">
      <span
        aria-hidden
        className="font-mono font-bold text-3xl md:text-5xl leading-none text-muted-foreground/[0.12] select-none shrink-0"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="font-display font-medium tracking-[-0.01em] text-lg md:text-xl text-foreground leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
    <span className="hidden md:block text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 shrink-0 pb-0.5">
      {meta}
    </span>
  </div>
);

/** Full-width bleed band with content pinned to the max-w-7xl tracks. */
const Band = ({
  children,
  alt = false,
  className,
}: {
  children: React.ReactNode;
  alt?: boolean;
  className?: string;
}) => (
  <section
    className={cn(
      "relative w-full border-t border-border/30",
      alt ? "bg-background-elevated" : "bg-background",
      className,
    )}
  >
    <div className="w-full max-w-7xl mx-auto md:border-x border-border/40 px-5 md:px-8 py-14 md:py-20">
      {children}
    </div>
  </section>
);

const DevelopersPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const comingSoon = () => toast.info("Full documentation launching soon.");

  if (isMobile) {
    return <DevelopersPageMobile />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-safe">
      <EventsDesktopHeader />

      <main className="flex-1 w-full">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className={cn("absolute inset-0 opacity-40", dotBg)} />
          <div className="absolute -top-24 -right-24 w-[320px] h-[320px] md:w-[520px] md:h-[520px] rounded-full bg-primary/[0.06] blur-[60px] md:blur-[120px] pointer-events-none" />

          <div className="relative w-full max-w-7xl mx-auto md:border-x border-border/40 px-5 md:px-8 pt-10 md:pt-20 pb-14 md:pb-24">
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
              {/* Left copy */}
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-5">
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]"
                  >
                    v1
                  </Badge>
                  <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-primary">
                    OMENX OPEN API
                  </span>
                </div>
                <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
                  Trade outcome markets from code.
                </h1>
                <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                  Every surface of the exchange — order book, orders, positions, settlement — over REST
                  and WebSocket. One schema. Signed requests. Orders preview before they commit.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
                  <Button size="lg" onClick={() => navigate("/settings/api")} className="gap-2 w-full sm:w-auto h-12 sm:h-11">
                    <KeyRound className="w-4 h-4" /> Manage API Keys
                  </Button>
                  <Button size="lg" variant="outline" onClick={comingSoon} className="gap-2 w-full sm:w-auto h-12 sm:h-11">
                    <BookOpen className="w-4 h-4" /> Read the Docs
                  </Button>
                </div>

                {/* Stat bar — desktop only (mobile version rendered below terminal/book) */}
                <div className="mt-10 relative pl-4 pt-6 border-t border-border/40 hidden lg:block">
                  <div className="absolute left-0 top-6 bottom-0 w-px bg-trading-purple/40" />
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    {HERO_STATS.map((s, i) => (
                      <div key={s.label} className="flex items-start gap-6">
                        {i > 0 && <span className="hidden md:block h-8 w-px bg-border/60 mt-1" />}
                        <div className="flex flex-col">
                          <div className="font-mono text-lg font-bold text-foreground leading-none">
                            {s.value}
                          </div>
                          <div className="mt-1.5 flex gap-[2px] h-[2px]">
                            <span className="w-3 bg-primary/60" />
                            <span className="w-1.5 bg-primary/30" />
                            <span className="w-1 bg-primary/20" />
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">
                            {s.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — terminal + mini order book */}
              <div className="relative animate-fade-in" style={{ animationDelay: "75ms" }}>
                <div className="relative">
                  <ApiTerminal
                    tabs={heroTabs}
                    caption="POST /v1/orders/preview · 200 OK"
                    className="relative z-10 -mx-2 md:mx-0"
                    showCursor={false}
                  />
                  <div className="hidden md:flex absolute -top-3 -right-3 z-20 rotate-2 items-center gap-1.5 rounded-md border border-border bg-card/90 backdrop-blur px-2 py-1 shadow-lg">
                    <span className="text-primary font-mono text-[10px] font-semibold">ws</span>
                    <span className="font-mono text-[10px] text-foreground/80">market.book · seq 48,516</span>
                  </div>
                  <div className="hidden md:flex absolute -top-3 left-8 z-20 -rotate-1 items-center gap-1.5 rounded-md border border-border bg-card/90 backdrop-blur px-2 py-1 shadow-lg">
                    <span className="text-trading-green font-mono text-[10px] font-semibold">GET</span>
                    <span className="font-mono text-[10px] text-foreground/80">/v1/markets/{"{id}"}</span>
                  </div>
                  <MiniOrderBook className="hidden lg:block absolute -bottom-6 -right-6 z-30 rotate-1" />
                  <div className="lg:hidden mt-6 flex justify-center">
                    <MiniOrderBook />
                  </div>
                </div>

                {/* Stat bar — mobile only, 2×2 grid, purple left rail */}
                <div className="lg:hidden mt-8 relative pl-4 pt-6 border-t border-border/40">
                  <div className="absolute left-0 top-6 bottom-0 w-px bg-trading-purple/40" />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {HERO_STATS.map((s) => (
                      <div key={s.label} className="flex flex-col">
                        <div className="font-mono text-lg font-bold text-foreground leading-none">
                          {s.value}
                        </div>
                        <div className="mt-1.5 flex gap-[2px] h-[2px]">
                          <span className="w-3 bg-primary/60" />
                          <span className="w-1.5 bg-primary/30" />
                          <span className="w-1 bg-primary/20" />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint marquee */}
          <div className="relative border-t border-border/40 bg-muted/10">
            <EndpointMarquee />
          </div>
        </section>

        {/* 01 — CAPABILITIES (Stripe-style shared-border table) */}
        <Band>
          <SectionHeader
            n="01"
            title="Built for automation"
            subtitle="Three surfaces, one typed schema, zero surprise state changes."
            meta="3 surfaces"
          />

          <div className="border-y border-border/40">
            {/* Top row — Agent-Ready full-width */}
            <div className="grid md:grid-cols-[0.4fr_0.6fr] gap-6 md:gap-10 px-5 md:px-6 py-6 border-b border-border/40">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">Agent-Ready</h3>
                  <Badge
                    variant="outline"
                    className="bg-trading-purple/10 text-trading-purple border-trading-purple/30 font-mono text-[10px]"
                  >
                    Agent-safe
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  Typed schemas and deterministic errors. An agent can't fat-finger what it must first
                  preview.
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Strict typed schema · No natural-language execution path
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 text-xs font-mono self-center">
                {[
                  { step: "preview", field: "pricing_snapshot_id" },
                  { step: "confirm", field: "client_order_id" },
                  { step: "submit", field: "idempotent" },
                ].map((s, i) => (
                  <div key={s.step} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-trading-green/15 border border-trading-green/40 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-trading-green" />
                      </div>
                      <span className="text-foreground">{s.step}</span>
                      {i < 2 && (
                        <ChevronRight className="hidden md:block w-3.5 h-3.5 text-muted-foreground ml-auto" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-8">{s.field}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row — Market Data | Trading (shared border) */}
            <div className="grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-border/40">
              {/* Market Data */}
              <div className="px-5 md:px-6 py-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Market Data</h3>
                  <span className="text-[10px] font-mono text-muted-foreground">REST · WS</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Depth, tape, mark and funding. Snapshots over REST, sequence-numbered deltas over
                  WebSocket.
                </p>
                <div className="mt-1 rounded-md border border-border/50 bg-background/40 font-mono text-[10px] divide-y divide-border/40">
                  {[
                    { t: "14:32:08", p: "0.5142", side: "buy" },
                    { t: "14:32:05", p: "0.5108", side: "sell" },
                    { t: "14:32:01", p: "0.5140", side: "buy" },
                    { t: "14:31:58", p: "0.5133", side: "sell" },
                  ].map((r, i) => (
                    <div key={i} className="grid grid-cols-3 px-2.5 py-1">
                      <span className="text-muted-foreground">{r.t}</span>
                      <span
                        className={cn(
                          "text-center",
                          r.side === "buy" ? "text-trading-green" : "text-trading-red",
                        )}
                      >
                        {r.p}
                      </span>
                      <span className="text-right text-muted-foreground">
                        {r.side === "buy" ? "↑" : "↓"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground/80">
                  GET /v1/markets/{"{id}"}/trades
                </div>
              </div>

              {/* Trading */}
              <div className="px-5 md:px-6 py-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Trading</h3>
                  <span className="text-[10px] font-mono text-muted-foreground">Idempotent</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Place, cancel, stage conditionals. Every write is idempotent by client_order_id.
                  Fees are known before you commit.
                </p>
                <pre className="mt-1 rounded-md border border-border/50 bg-background/40 p-2.5 font-mono text-[10px] leading-relaxed overflow-hidden">
{`{
  "status": "FILLED",
  "fill_price": "0.5142",
  "fee_u": "0.1872"
}`}
                </pre>
                <div className="text-[10px] font-mono text-muted-foreground/80">POST /v1/orders</div>
              </div>
            </div>
          </div>
        </Band>

        {/* 02 — TIERS (single container, divide-x, top progress line) */}
        <Band alt>
          <SectionHeader
            n="02"
            title="Access tiers"
            subtitle="Three progressive tiers. Everyone starts read-only."
            meta="3 tiers · self-serve to manual"
          />

          {/* Desktop — single container */}
          <div className="hidden md:block relative border-y border-border/40">
            {/* Progress line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-border via-border to-primary" />
            <div className="absolute -top-1 inset-x-0 flex justify-between px-[16.66%]">
              {tiers.map((t, i) => (
                <span
                  key={t.name}
                  className={cn(
                    "w-2 h-2 rounded-full border bg-background",
                    i === 0 && "border-border",
                    i === 1 && "border-primary/60",
                    i === 2 && "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
                  )}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 divide-x divide-border/40">
              {tiers.map((t, i) => (
                <div
                  key={t.name}
                  className={cn(
                    "px-6 py-6 flex flex-col gap-3",
                    t.accent === "amber" && "bg-primary/[0.03]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Tier {i + 1}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[10px]",
                        t.accent === "amber" &&
                          "bg-amber-400/10 text-amber-400 border-amber-400/25",
                        t.accent === "primary" && "bg-primary/10 text-primary border-primary/20",
                        t.accent === "muted" && "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {t.tag}
                    </Badge>
                  </div>
                  <div>
                    <div
                      className={cn(
                        "font-display font-medium tracking-[-0.01em] text-lg",
                        t.accent === "primary"
                          ? "text-primary"
                          : t.accent === "amber"
                          ? "text-amber-400"
                          : "text-foreground",
                      )}
                    >
                      {t.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t.body}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1 pt-2">
                    {t.chips.map((c) => (
                      <span
                        key={c}
                        className="rounded border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="md:hidden relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-border via-primary/40 to-primary" />
            <div className="border-y border-border/40 divide-y divide-border/40">
              {tiers.map((t) => (
                <div key={t.name} className="relative py-4">
                  <div
                    className={cn(
                      "absolute -left-4 top-6 w-3 h-3 rounded-full border-2 bg-background",
                      t.accent === "primary" && "border-primary",
                      t.accent === "amber" && "border-amber-400",
                      t.accent === "muted" && "border-border",
                    )}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={cn(
                        "font-display font-medium tracking-[-0.01em] text-base",
                        t.accent === "primary"
                          ? "text-primary"
                          : t.accent === "amber"
                          ? "text-amber-400"
                          : "text-foreground",
                      )}
                    >
                      {t.name}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{t.tag}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.chips.map((c) => (
                      <span
                        key={c}
                        className="rounded border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Band>

        {/* 03 — QUICKSTART */}
        <Band>
          <SectionHeader
            n="03"
            title="Quickstart"
            subtitle="From zero to first signed request in three steps."
            meta="3 steps"
          />

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-10 items-start">
            <ol className="relative">
              {/* Continuous vertical timeline */}
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border/40" />
              {[
                {
                  t: "Create your key",
                  b: "Settings → API Management. Verify 2FA, pick your scopes. The secret prints once.",
                },
                {
                  t: "Sign the request",
                  b: "HMAC-SHA256 over timestamp + method + path + body. Three headers on every call.",
                },
                {
                  t: "Preview, then submit",
                  b: "POST the order to /orders/preview. Same body, same signature — /orders to commit.",
                },
              ].map((s, i) => (
                <li key={s.t} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary font-mono text-sm font-bold flex items-center justify-center shrink-0 z-10 border border-primary/30 bg-background">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{s.t}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.b}</p>
                  </div>
                </li>
              ))}
            </ol>

            <ApiTerminal tabs={signTabs} caption="hmac-sha256 · timestamp + method + path + body" />
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> State-changing endpoints take an{" "}
            <code className="font-mono text-foreground/80">Idempotency-Key</code> and require an IP
            whitelist on the key.
          </p>
        </Band>

        {/* 04 — REFERENCE (full-width rows, hairlines) */}
        <Band alt>
          <SectionHeader
            n="04"
            title="Reference"
            subtitle="Full documentation surface rolling out with v1 launch."
            meta="3 guides"
          />
          <div className="border-y border-border/40 divide-y divide-border/40">
            {resources.map((r) => (
              <button
                key={r.title}
                onClick={comingSoon}
                className="w-full min-h-14 flex items-center gap-4 px-2 md:px-4 py-4 text-left hover:bg-muted/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.body}</div>
                </div>
                <Badge
                  variant="outline"
                  className="hidden md:inline-flex bg-muted text-muted-foreground border-border font-mono text-[10px]"
                >
                  Coming soon
                </Badge>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </Band>

        {/* CTA — full-width bleed band */}
        <section className="relative w-full border-y border-border/40 bg-background-elevated">
          <div className="w-full max-w-7xl mx-auto md:border-x border-border/40 px-5 md:px-8 py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-2">
                  Ready to build
                </div>
                <h3 className="font-display font-medium tracking-[-0.01em] text-2xl md:text-3xl text-foreground">
                  Start with three requests.
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Preview. Confirm. Submit.
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/settings/api")} className="gap-2 shrink-0 w-full md:w-auto h-12 md:h-11">
                Manage API Keys <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SeoFooter />
    </div>
  );
};

export default DevelopersPage;
