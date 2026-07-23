import {
  Zap,
  Bot,
  LineChart,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionWrapper, SubSection, DualDevicePreview } from "../components";
import { ApiTerminal } from "@/components/developers/ApiTerminal";
import { EndpointMarquee } from "@/components/developers/EndpointMarquee";
import { cn } from "@/lib/utils";

/* -------------------- Portal (/developers) — trimmed marketing shell -------------------- */
const PortalGroup = ({ isMobile }: { isMobile: boolean }) => (
  <div className="space-y-6">
    <SubSection title="Hero terminal (multi-tab, macOS chrome)" platform="shared">
      <ApiTerminal
        caption="terminal · preview → submit"
        tabs={[
          {
            label: "cURL",
            lang: "bash",
            code: `curl -X POST https://api.omenx.io/v1/orders/preview \\\n  -H "X-OMENX-API-KEY: $KEY" \\\n  -d '{"symbol":"AAPL-DAILY","side":"buy","price":0.42,"size":100}'`,
          },
          {
            label: "Python",
            lang: "python",
            code: `from omenx import Client\nclient = Client(key=KEY)\npreview = client.orders.preview(symbol="AAPL-DAILY", side="buy", price=0.42, size=100)`,
          },
        ]}
      />
    </SubSection>

    <SubSection title="Endpoint marquee (auto-scroll)" platform="shared">
      <div className="rounded-xl border border-border/40 bg-muted/10">
        <EndpointMarquee />
      </div>
    </SubSection>

    <SubSection title="Capabilities row" platform="shared">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: LineChart, title: "Market Data", body: "Real-time order book, trades, mark & funding.", tag: "REST · WS" },
          { icon: Zap, title: "Trading", body: "Place, cancel, and stage conditional orders.", tag: "Idempotent" },
          { icon: Bot, title: "Agent-Ready", body: "Typed schemas, preview→submit safety.", tag: "Agent-safe" },
        ].map((c) => (
          <div key={c.title} className="trading-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{c.tag}</span>
            </div>
            <div>
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </SubSection>

    <SubSection title="Access-tier stepped ladder (marketing)" platform="desktop">
      <div className={isMobile ? "hidden" : "flex items-stretch gap-0"}>
        {[
          { name: "Read-only", tag: "Free", accent: "muted" as const, offset: 16 },
          { name: "Trading", tag: "Self-serve", accent: "primary" as const, offset: 8 },
          { name: "Pro / MM", tag: "Manual approval", accent: "amber" as const, offset: 0 },
        ].map((t, i, arr) => (
          <div key={t.name} className="flex-1 flex items-stretch">
            <div
              style={{ marginTop: t.offset }}
              className={cn(
                "flex-1 rounded-xl p-4 flex flex-col gap-2",
                t.accent === "muted" && "border border-border/40 bg-card/60",
                t.accent === "primary" && "border border-primary/40 bg-gradient-to-br from-primary/[0.06] via-card to-card",
                t.accent === "amber" && "border border-amber-400/25 bg-gradient-to-br from-amber-400/[0.04] via-card to-card",
              )}
            >
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Tier {i + 1}</div>
              <div className={cn("text-base font-bold", t.accent === "primary" && "text-primary", t.accent === "amber" && "text-amber-400")}>
                {t.name}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">{t.tag}</div>
            </div>
            {i < arr.length - 1 && (
              <div className="flex items-center px-1 shrink-0">
                <div className="w-4 border-t border-dashed border-border" />
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </SubSection>

    <SubSection
      title="Access tiers · mobile stepper (/developers)"
      description="移动端专属版本：01/02/03 分层徽章 + rail。桌面走上面的三卡片阶梯。切到 Mobile 看 375px 真态。"
      platform="mobile"
    >
      <DualDevicePreview
        previewKey="developers-mobile-tiers"
        label="mobile tier stepper · muted / primary / amber"
        minHeight={520}
      />
    </SubSection>
  </div>
);

/* -------------------- Management (/settings/api) — real components via DeviceFrame -------------------- */
const ManagementGroup = () => (
  <div className="space-y-8">
    <SubSection
      title="TierTrack · Available / Manual / Not-met + you-pill"
      description="Real TierTrack. Toggle Mobile to see the true stacked layout — the iframe uses a 375px viewport so `md:` breakpoints resolve to mobile (rail hides, columns stack)."
      platform="shared"
    >
      <div className="space-y-4">
        <DualDevicePreview
          previewKey="tier-track-ok"
          label="highestEligible = trading (you-pill on Trading segment)"
          minHeight={360}
        />
        <DualDevicePreview
          previewKey="tier-track-partial"
          label="highestEligible = read_only (Trading = not met)"
          minHeight={360}
        />
        <DualDevicePreview
          previewKey="tier-track-locked"
          label="all locked (no you-pill)"
          minHeight={360}
        />
      </div>
    </SubSection>

    <SubSection
      title="TierQuickAnswer · you-can-create chip row"
      description="ok / partial / locked chip states."
      platform="shared"
    >
      <div className="space-y-3">
        <DualDevicePreview previewKey="tier-quick-ok" label="ok · Trading eligible" minHeight={100} />
        <DualDevicePreview previewKey="tier-quick-partial" label="partial · only Read-only eligible" minHeight={100} />
        <DualDevicePreview previewKey="tier-quick-locked" label="locked · nothing available" minHeight={100} />
      </div>
    </SubSection>

    <SubSection
      title="Keys section · four states"
      description="Real EmptyState / LoadingState / ErrorState / KeysTable — same components mounted by ApiManagement.tsx."
      platform="shared"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DualDevicePreview previewKey="keys-empty" label="empty" minHeight={220} />
        <DualDevicePreview previewKey="keys-loading" label="loading" minHeight={220} />
        <DualDevicePreview previewKey="keys-error" label="error + retry" minHeight={220} />
        <DualDevicePreview previewKey="keys-table" label="loaded (3 rows · 1 revoked)" minHeight={340} />
      </div>
    </SubSection>

    <SubSection
      title="KeysTable · desktop 9-col vs mobile stacked"
      description="Same rows, viewport-driven layout switch. Toggle Mobile to see the stacked card layout that `md:` hides on desktop."
      platform="shared"
    >
      <DualDevicePreview previewKey="keys-table" label="3 rows: active Trading (with IPs), active Read-only, revoked Pro/MM" minHeight={420} />
    </SubSection>

    <SubSection title="StepIndicator · 4 node states (done · current · todo)" platform="shared">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DualDevicePreview previewKey="step-indicator-1" label="current = 1" minHeight={120} />
        <DualDevicePreview previewKey="step-indicator-2" label="current = 2" minHeight={120} />
        <DualDevicePreview previewKey="step-indicator-3" label="current = 3" minHeight={120} />
        <DualDevicePreview previewKey="step-indicator-4" label="current = 4" minHeight={120} />
      </div>
    </SubSection>

    <SubSection
      title="CreateKeyFlow · each step, controlled inline"
      description="Real Step1/Step2/Step3/Step4Secret rendered directly — bypasses the shell so every branch is inspectable at both breakpoints."
      platform="shared"
    >
      <div className="space-y-4">
        <DualDevicePreview previewKey="step1" label="Step 1 · label + tier (Trading disabled — reqs not met)" minHeight={340} />
        <DualDevicePreview previewKey="step2" label="Step 2 · scopes + valid IP" minHeight={420} />
        <DualDevicePreview previewKey="step2-invalid" label="Step 2 · IP invalid validation error" minHeight={420} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DualDevicePreview previewKey="step3" label="Step 3 · empty / typing" minHeight={220} />
          <DualDevicePreview previewKey="step3-error" label="Step 3 · error (Invalid code)" minHeight={220} />
          <DualDevicePreview previewKey="step4" label="Step 4 · secret (pre-copy)" minHeight={260} />
          <DualDevicePreview previewKey="step4-copied" label="Step 4 · secret (copied)" minHeight={260} />
        </div>
      </div>
    </SubSection>

    <SubSection
      title="CreateKeyFlow shell · Dialog (desktop) vs Drawer (mobile) — REAL breakpoint"
      description="Same CreateKeyFlow component. Because the iframe drives useIsMobile off its own viewport, toggling Mobile actually renders MobileDrawer chrome — not a shrunk Dialog. This is the whole reason DeviceFrame exists."
      platform="shared"
    >
      <DualDevicePreview previewKey="wizard-shell" label="Toggle Mobile → Drawer; Desktop → Dialog" minHeight={520} />
    </SubSection>

    <SubSection
      title="RevokeDialog · confirmation state"
      description="Real RevokeDialog with a mock target key — destructive trading-red primary button."
      platform="shared"
    >
      <DualDevicePreview previewKey="revoke-dialog" label="Auto-opened; re-open button restores the dialog" minHeight={340} />
    </SubSection>
  </div>
);

/* -------------------- Section -------------------- */
interface Props {
  isMobile: boolean;
}

export const ApiSection = ({ isMobile }: Props) => {
  return (
    <SectionWrapper
      id="api-management"
      title="API"
      description="Two production surfaces: /developers marketing portal (A) and /settings/api key management (B). Group B mounts real production components inside DeviceFrame iframes — the only way `md:` breakpoints resolve to true mobile at 375px."
    >
      <div className="space-y-12">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <h2 className="text-base font-semibold">A · Open API Portal <span className="text-muted-foreground font-normal">(/developers)</span></h2>
            <Badge variant="outline" className="text-[10px]">marketing shell</Badge>
          </div>
          <PortalGroup isMobile={isMobile} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <h2 className="text-base font-semibold">B · API Management <span className="text-muted-foreground font-normal">(/settings/api)</span></h2>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">real components · real breakpoints</Badge>
          </div>
          <ManagementGroup />
        </div>
      </div>
    </SectionWrapper>
  );
};
