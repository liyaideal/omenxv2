import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  KeyRound,
  Radio,
  FileCode,
  Cpu,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const HERO_STATS = [
  { value: "47 ms", label: "p50 latency" },
  { value: "99.95%", label: "Uptime" },
  { value: "31", label: "REST endpoints" },
  { value: "9", label: "WS topics" },
];

const CAPABILITIES = [
  {
    icon: Cpu,
    title: "Agent-Ready",
    body: "Typed schemas, deterministic errors. Preview before submit.",
    tag: "Agent-safe",
  },
  {
    icon: Radio,
    title: "Market Data",
    body: "Depth, tape, mark and funding over REST and WebSocket.",
    tag: "REST · WS",
  },
  {
    icon: FileCode,
    title: "Trading",
    body: "Idempotent writes by client_order_id. Fees known before commit.",
    tag: "Idempotent",
  },
];

import { TiersStepperMobile, type TierStep } from "@/components/developers/TiersStepperMobile";

export const DEVELOPERS_MOBILE_TIERS: readonly TierStep[] = [
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
    body: "Full order lifecycle plus private streams. Unlocks after one deposit, $100 equity, one filled trade.",
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
];

const QUICKSTART = [
  {
    t: "Create your key",
    b: "Settings → API. Verify 2FA, pick scopes. Secret prints once.",
    code: "Settings → API → New Key",
  },
  {
    t: "Sign the request",
    b: "HMAC-SHA256 over timestamp + method + path + body.",
    code: 'HMAC_SHA256($ts+"POST"+$path+$body)',
  },
  {
    t: "Preview, then submit",
    b: "POST /orders/preview first, same body to /orders to commit.",
    code: "POST /v1/orders/preview → /v1/orders",
  },
];

const ENDPOINTS = [
  { method: "GET", path: "/v1/markets", body: "List every market with mark, funding and status." },
  { method: "GET", path: "/v1/markets/{id}/trades", body: "Recent tape for a single market." },
  { method: "POST", path: "/v1/orders/preview", body: "Dry-run an order. Returns snapshot id and fee preview." },
  { method: "POST", path: "/v1/orders", body: "Commit a previewed order. Idempotent by client_order_id." },
  { method: "DELETE", path: "/v1/orders/{id}", body: "Cancel a resting order." },
  { method: "GET", path: "/v1/positions", body: "Open positions, margin and unrealised PnL." },
];

const RESOURCES = [
  { icon: FileCode, title: "REST Reference", body: "Every endpoint, every field, every error code." },
  { icon: Radio, title: "WebSocket Guide", body: "Public & private streams, heartbeats, reconnection." },
  { icon: Cpu, title: "Agent Integration", body: "Preview → submit patterns for autonomous agents." },
];

const methodClass = (m: string) =>
  m === "GET"
    ? "text-trading-green border-trading-green/30 bg-trading-green/10"
    : m === "POST"
    ? "text-primary border-primary/30 bg-primary/10"
    : m === "DELETE"
    ? "text-trading-red border-trading-red/30 bg-trading-red/10"
    : "text-amber-400 border-amber-400/30 bg-amber-400/10";

const SectionHead = ({ n, title, subtitle }: { n: string; title: string; subtitle: string }) => (
  <div className="flex items-end gap-3 pb-3 border-b border-border/30 mb-5">
    <span
      aria-hidden
      className="font-mono font-bold text-3xl leading-none text-muted-foreground/[0.12] select-none shrink-0"
    >
      {n}
    </span>
    <div className="min-w-0">
      <h2 className="font-display font-medium tracking-[-0.01em] text-base text-foreground leading-tight">
        {title}
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const MobileBand = ({
  children,
  alt = false,
}: {
  children: React.ReactNode;
  alt?: boolean;
}) => (
  <section
    className={cn(
      "relative w-full border-t border-border/30 px-5 py-10",
      alt ? "bg-background-elevated" : "bg-background",
    )}
  >
    {children}
  </section>
);

export const DevelopersPageMobile = () => {
  const navigate = useNavigate();
  const comingSoon = () => toast.info("Full documentation launching soon.");

  return (
    <div className="min-h-screen bg-background flex flex-col pb-safe">
      <MobileHeader title="Open API" showLogo={false} showBack={true} />

      <main className="flex-1 w-full">
        {/* HERO */}
        <section className="relative border-b border-border/40 px-5 pt-8 pb-10">
          <div className="absolute -top-16 -right-16 w-[260px] h-[260px] rounded-full bg-primary/[0.06] blur-[60px] pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]"
              >
                v1
              </Badge>
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary">
                OMENX OPEN API
              </span>
            </div>

            <h1 className="font-display font-bold text-[28px] leading-[1.08] tracking-[-0.02em] text-foreground">
              Trade outcome markets from code.
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Order book, orders, positions and settlement — over REST and WebSocket. Signed
              requests, previewed before they commit.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/settings/api")}
                className="gap-2 w-full h-12"
              >
                <KeyRound className="w-4 h-4" /> Manage API Keys
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={comingSoon}
                className="gap-2 w-full h-12"
              >
                <BookOpen className="w-4 h-4" /> Read the Docs
              </Button>
            </div>

            {/* Compact request preview card */}
            <div className="mt-8 rounded-xl border border-border/50 bg-card/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold shrink-0",
                      methodClass("POST"),
                    )}
                  >
                    POST
                  </span>
                  <span className="font-mono text-[11px] text-foreground/80 truncate">
                    /v1/orders/preview
                  </span>
                </div>
                <span className="font-mono text-[10px] text-trading-green shrink-0">200 OK</span>
              </div>
              <pre className="px-3 py-3 font-mono text-[11px] leading-relaxed text-foreground/85 whitespace-pre-wrap break-words">
{`{
  "market_id": "BTC_ABOVE:150000:2026-12-31",
  "outcome_side": "YES",
  "limit_price": "0.5142",
  "size": 240
}

// 200 OK
{
  "pricing_snapshot_id": "ps_01J2ZKQ4T9",
  "estimated_margin_u": "4.2183",
  "fee_preview_u": "0.1872"
}`}
              </pre>
            </div>

            {/* Stat bar — 2×2 */}
            <div className="mt-8 relative pl-4 pt-5 border-t border-border/40">
              <div className="absolute left-0 top-5 bottom-0 w-px bg-trading-purple/40" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {HERO_STATS.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <div className="font-mono text-base font-bold text-foreground leading-none">
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
        </section>

        {/* 01 — CAPABILITIES */}
        <MobileBand>
          <SectionHead n="01" title="Built for automation" subtitle="Three surfaces, one typed schema." />
          <ul className="border-y border-border/40 divide-y divide-border/40">
            {CAPABILITIES.map((c) => (
              <li key={c.title} className="flex items-start gap-3 py-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{c.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{c.tag}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </MobileBand>

        {/* 02 — TIERS (vertical stepper) */}
        <MobileBand alt>
          <SectionHead n="02" title="Access tiers" subtitle="Everyone starts read-only." />
          <TiersStepperMobile tiers={DEVELOPERS_MOBILE_TIERS} />
        </MobileBand>

        {/* 03 — QUICKSTART */}
        <MobileBand>
          <SectionHead n="03" title="Quickstart" subtitle="Three steps to your first signed request." />
          <ol className="relative">
            <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border/40" />
            {QUICKSTART.map((s, i) => (
              <li key={s.t} className="relative flex gap-4 pb-5 last:pb-0">
                <div className="w-7 h-7 rounded-full text-primary font-mono text-sm font-bold flex items-center justify-center shrink-0 z-10 border border-primary/30 bg-background">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{s.t}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.b}</p>
                  <div className="mt-2 rounded-md border border-border/50 bg-background/60 px-2 py-1.5 font-mono text-[11px] text-foreground/80 break-all">
                    {s.code}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
            <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              State-changing endpoints take an{" "}
              <code className="font-mono text-foreground/80">Idempotency-Key</code> and require an IP
              whitelist on the key.
            </span>
          </p>
        </MobileBand>

        {/* 04 — REFERENCE (endpoint cards) */}
        <MobileBand alt>
          <SectionHead n="04" title="Reference" subtitle="Endpoints shipping with v1." />
          <ul className="space-y-2">
            {ENDPOINTS.map((e) => (
              <li key={e.path}>
                <button
                  onClick={comingSoon}
                  className="w-full text-left rounded-lg border border-border/50 bg-card/60 p-3 hover:bg-muted/30 active:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold shrink-0",
                        methodClass(e.method),
                      )}
                    >
                      {e.method}
                    </span>
                    <span className="font-mono text-[12px] text-foreground truncate flex-1">
                      {e.path}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{e.body}</p>
                </button>
              </li>
            ))}
          </ul>

          {/* Accordion — secondary detail */}
          <Accordion type="single" collapsible className="mt-6 border-t border-border/30">
            <AccordionItem value="signing" className="border-b border-border/30">
              <AccordionTrigger className="text-sm font-semibold">Request signing</AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  HMAC-SHA256 over{" "}
                  <code className="font-mono text-foreground/80">
                    {"{timestamp}{method}{path}{body}"}
                  </code>
                  . Three headers on every call.
                </p>
                <pre className="rounded-md border border-border/50 bg-background/60 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words">
{`X-OMENX-API-KEY: $KEY
X-OMENX-TS:      1721059431
X-OMENX-SIGN:    $SIG`}
                </pre>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="agent" className="border-b border-border/30">
              <AccordionTrigger className="text-sm font-semibold">Agent-safe pattern</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2 text-xs">
                  {["preview → pricing_snapshot_id", "confirm → client_order_id", "submit → idempotent"].map(
                    (l) => (
                      <div key={l} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-trading-green/15 border border-trading-green/40 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-trading-green" />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">{l}</span>
                      </div>
                    ),
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="guides" className="border-b border-border/30">
              <AccordionTrigger className="text-sm font-semibold">Full guides</AccordionTrigger>
              <AccordionContent>
                <ul className="divide-y divide-border/30">
                  {RESOURCES.map((r) => (
                    <li key={r.title}>
                      <button
                        onClick={comingSoon}
                        className="w-full flex items-center gap-3 py-3 text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <r.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground">{r.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.body}</div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </MobileBand>

        {/* CTA */}
        <section className="relative w-full border-y border-border/40 bg-background-elevated px-5 py-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-2">
            Ready to build
          </div>
          <h3 className="font-display font-medium tracking-[-0.01em] text-2xl text-foreground">
            Start with three requests.
          </h3>
          <p className="text-sm text-muted-foreground mt-2">Preview. Confirm. Submit.</p>
          <Button
            size="lg"
            onClick={() => navigate("/settings/api")}
            className="gap-2 w-full h-12 mt-5"
          >
            Manage API Keys <ArrowRight className="w-4 h-4" />
          </Button>
        </section>
      </main>
      <SeoFooter />
    </div>
  );
};

export default DevelopersPageMobile;
