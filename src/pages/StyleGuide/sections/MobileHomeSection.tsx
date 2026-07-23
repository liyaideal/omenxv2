import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bell, Globe, Plus, ChevronRight } from "lucide-react";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { Logo } from "@/components/Logo";

interface MobileHomeSectionProps {
  isMobile: boolean;
}

/* -----------------------------------------------------------------------
 * Visual replicas
 *
 * We render *static markup* replicas of each module instead of mounting the
 * live components. The live components depend on auth / supabase / hooks,
 * which would either fail or only show a single state. Replicas let us
 * show every state side-by-side with zero data setup.
 * ----------------------------------------------------------------------- */

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-[360px] rounded-2xl border border-border/50 bg-background p-4">
    {children}
  </div>
);

/* ---------- A. Header replica ---------- */

const HeaderReplica = () => (
  <div className="flex items-center justify-between border-b border-border/40 pb-2">
    <Logo size="md" />
    <div className="flex items-center gap-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-full">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-muted-foreground">
          <path d="M20.317 4.3698a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25-1.844-.277-3.68-.277-5.486 0-.164-.394-.406-.875-.618-1.25a.077.077 0 00-.079-.037 19.736 19.736 0 00-4.885 1.515.07.07 0 00-.032.028C.533 9.046-.319 13.58.099 18.058a.082.082 0 00.031.056c2.053 1.508 4.04 2.423 5.993 3.03a.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.13 13.13 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.078-.011c3.928 1.794 8.18 1.794 12.061 0a.074.074 0 01.079.01c.12.099.246.198.373.292a.077.077 0 01-.007.128 12.3 12.3 0 01-1.873.891.077.077 0 00-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 00.084.029c1.961-.607 3.95-1.522 6.002-3.03a.077.077 0 00.031-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 00-.031-.029z" />
        </svg>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full">
        <Globe className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-trading-red" />
      </div>
    </div>
  </div>
);

/* ---------- B. HomeGreeting replicas ---------- */

const sparkPathDemo =
  "M0 28 C12 22, 18 30, 28 24 C38 18, 46 26, 58 14 C70 4, 80 18, 92 8 L100 6";
const sparkAreaDemo = `${sparkPathDemo} L100 40 L0 40 Z`;

const HomeGreetingGuest = () => (
  <button className="group relative block w-full overflow-hidden rounded-2xl border border-border/40 bg-card p-5 text-left">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trading-green opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-trading-green" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-trading-green">
            Live on OmenX
          </span>
        </div>
        <h1 className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
          Hey Caller. Ready to make your next call?
        </h1>
      </div>
    </div>

    <div className="mt-5 flex items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
            $4.2M
          </span>
          <span className="font-sans text-[12px] font-medium text-muted-foreground">
            traded · 24h
          </span>
        </div>
        <div className="mt-2 font-sans text-[12px] text-muted-foreground">
          <span className="font-mono font-semibold text-foreground tabular-nums">128</span>{" "}
          active markets
        </div>
      </div>
      <div className="relative h-12 w-24 shrink-0 opacity-70">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="sgGuestSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={sparkAreaDemo} fill="url(#sgGuestSparkFill)" />
          <path
            d={sparkPathDemo}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>

    <div className="mt-5 border-t border-border/40 pt-4">
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-foreground">
        <span>Sign in to start trading</span>
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </div>
    </div>
  </button>
);

const HomeGreetingAuthed = ({ hasData }: { hasData: boolean }) => (
  <div className="relative block w-full overflow-hidden rounded-2xl border border-border/40 bg-card p-5 text-left">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Welcome back
        </p>
        <h1 className="mt-1 text-[17px] font-bold leading-tight text-foreground">
          alex
        </h1>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">
          Deposit
        </span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="h-2.5 w-2.5" strokeWidth={3.5} />
        </span>
      </span>
    </div>

    <div className="mt-6 flex items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Total equity
        </p>
        <div className="mt-1.5 font-mono text-[34px] font-bold leading-none tracking-tight text-foreground">
          $13,530.00
        </div>
        {hasData ? (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-trading-green tabular-nums">
              +1.9%
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              7D
            </span>
          </div>
        ) : (
          <p className="mt-2.5 whitespace-nowrap">
            <span className="font-sans text-[12px] font-medium text-muted-foreground">
              No 7D activity ·{" "}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              Tap Deposit to start
            </span>
          </p>
        )}
      </div>
      {hasData && (
        <div className="relative h-12 w-24 shrink-0 opacity-70">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="sgAuthSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--trading-green))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--trading-green))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkAreaDemo} fill="url(#sgAuthSparkFill)" />
            <path
              d={sparkPathDemo}
              fill="none"
              stroke="hsl(var(--trading-green))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  </div>
);

/* ---------- C. PersonalSlot replicas ---------- */

const OnboardingCardReplica = ({ step = 2 }: { step?: 2 | 3 }) => {
  const completed = step - 1; // step 2 → 1/3 done, step 3 → 2/3 done
  const label = step === 2 ? "Deposit USDC on Base" : "Place your first trade";
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
            Step {step} of 3
          </p>
          <p className="mt-1 text-[14px] font-semibold text-foreground">{label}</p>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-primary" />
      </div>
      <div className="mt-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < completed ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
};


const PositionAlertReplica = () => (
  <div className="rounded-2xl border border-trading-green/30 bg-trading-green/5 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-trading-green">
          Position update
        </p>
        <p className="mt-1 text-[13px] font-semibold text-foreground">
          BTC &gt; $100k · Yes
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          +$24.30 <span className="text-trading-green">+12.4%</span>
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  </div>
);

/* ---------- D. CampaignRail replica ---------- */

const CampaignBannerReplica = ({ theme }: { theme: "gold" | "primary" | "green" | "violet" }) => {
  const themes = {
    gold: { bg: "bg-mainnet-surface", metric: "text-mainnet-gold", chip: "border-mainnet-gold/30 bg-mainnet-gold/10 text-mainnet-gold" },
    primary: { bg: "bg-card", metric: "text-primary", chip: "border-primary/30 bg-primary/10 text-primary" },
    green: { bg: "bg-card", metric: "text-trading-green", chip: "border-trading-green/30 bg-trading-green/10 text-trading-green" },
    violet: { bg: "bg-card", metric: "text-purple-400", chip: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  };
  const t = themes[theme];
  return (
    <div className={`min-w-[200px] rounded-2xl border border-border/50 ${t.bg} p-4`}>
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.chip}`}>
        Campaign
      </span>
      <p className="mt-2 text-[13px] font-semibold text-foreground">Win $10k airdrop</p>
      <p className={`mt-1 font-mono text-[18px] font-bold ${t.metric}`}>$2,400</p>
    </div>
  );
};

/* ---------- E. TopEvents header replica ---------- */

const TopEventsReplica = ({ title, withInterlude }: { title: string; withInterlude: boolean }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
        See all →
      </span>
    </div>
    <div className="space-y-2">
      <div className="rounded-xl border border-border/40 bg-card p-3">
        <p className="text-[13px] font-medium text-foreground">Will BTC hit $100k by Mar 31?</p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          $1.2M · 24h
        </p>
      </div>
      {withInterlude && (
        <div className="rounded-xl border border-mainnet-gold/30 bg-mainnet-gold/5 p-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-mainnet-gold">
            Mainnet Launch Callout
          </p>
          <p className="mt-1 text-[12px] font-semibold text-foreground">Trade once. Earn up to $200.</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground"><span className="font-mono">$5K</span> weekly pool · Mainnet Launch is live.</p>
        </div>
      )}
      <div className="rounded-xl border border-border/40 bg-card p-3">
        <p className="text-[13px] font-medium text-foreground">ETH ETF approved this quarter?</p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          $890K · 24h
        </p>
      </div>
    </div>
  </div>
);

/* =======================================================================
 * MAIN SECTION
 * ===================================================================== */

type GreetingState = "guest" | "authedActive" | "authedEmpty";
type SlotState = "guestOrEmpty" | "onboarding" | "positionAlert";
type EventsState = "guest" | "authedNoPosition" | "authedWithPosition";
type ComposedState = "guest" | "s0New" | "s1Deposited" | "s2Traded" | "s3Active";

const composedMatrix: Record<ComposedState, {
  label: string;
  greeting: "guest" | "authedActive" | "authedEmpty";
  slot: "null" | "onboarding" | "positionAlert";
  onboardingStep: 2 | 3 | null;
  eventsTitle: string;
  interlude: boolean;
  note: string;
}> = {
  guest:       { label: "Guest",        greeting: "guest",        slot: "null",          onboardingStep: null, eventsTitle: "Top Events",                 interlude: true,  note: "未登录：PersonalSlot 收起（empty:hidden），TopEvents 中插入 MainnetLaunchCallout（引流到 /mainnet-launch）。" },
  s0New:       { label: "S0_NEW",       greeting: "authedEmpty",  slot: "onboarding",    onboardingStep: 2,    eventsTitle: "Pick your first prediction", interlude: false, note: "已登录、未充值：OnboardingCard 当前 step = Deposit USDC on Base（Step 2 of 3，进度 1/3）。Greeting 无 7D 数据。" },
  s1Deposited: { label: "S1_DEPOSITED", greeting: "authedEmpty",  slot: "onboarding",    onboardingStep: 3,    eventsTitle: "Pick your first prediction", interlude: false, note: "已充值、未交易：OnboardingCard 当前 step = Place your first trade（Step 3 of 3，进度 2/3）。Greeting 仍无 7D 数据。" },
  s2Traded:    { label: "S2_TRADED",    greeting: "authedActive", slot: "positionAlert", onboardingStep: null, eventsTitle: "Top Events",                 interlude: false, note: "已交易、volume < $5k：Greeting 含 7D sparkline，PersonalSlot 切到 PositionAlertCard。" },
  s3Active:    { label: "S3_ACTIVE",    greeting: "authedActive", slot: "positionAlert", onboardingStep: null, eventsTitle: "Top Events",                 interlude: false, note: "volume ≥ $5k：home 屏视觉与 S2 完全一致 —— 差异仅出现在 Wallet hero 和 Mainnet Launch 进度页。" },
};


export const MobileHomeSection = (_: MobileHomeSectionProps) => {
  const [greetingState, setGreetingState] = useState<GreetingState>("guest");
  const [slotState, setSlotState] = useState<SlotState>("onboarding");
  const [eventsState, setEventsState] = useState<EventsState>("guest");
  const [composedState, setComposedState] = useState<ComposedState>("s0New");

  const eventsConfig: Record<EventsState, { title: string; withInterlude: boolean; note: string }> = {
    guest: { title: "Top Events", withInterlude: true, note: "Guest user — MainnetLaunchCallout interlude inserted between cards" },
    authedNoPosition: { title: "Pick your first prediction", withInterlude: false, note: "Authenticated, no positions yet — title swaps to onboarding copy" },
    authedWithPosition: { title: "Top Events", withInterlude: false, note: "Authenticated with positions — default title, no interlude" },
  };

  const composed = composedMatrix[composedState];


  return (
    <div className="space-y-12">
      {/* ============================== */}
      {/* OVERVIEW · PAGE SKELETON       */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-skeleton"
        title="Page Skeleton"
        platform="mobile"
        description="MobileHome (`/`) renders 5 module slots top-to-bottom inside `px-4 pt-3 pb-2`, with `pb-24` reserved on the outer wrapper for the BottomNav."
      >
        <Card className="trading-card">
          <CardContent className="pt-6">
            <Frame>
              <div className="space-y-3">
                <HeaderReplica />
                <div className="text-[10px] font-mono text-muted-foreground">— main · px-4 pt-3 pb-2 —</div>
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-center text-[11px] font-mono text-primary">
                  HomeGreeting
                </div>
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-center text-[10px] font-mono text-muted-foreground">
                  PersonalSlot · mt-3 · empty:hidden
                </div>
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-center text-[10px] font-mono text-muted-foreground">
                  HomeCampaignRail · mt-5
                </div>
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-center text-[10px] font-mono text-muted-foreground">
                  HomeTopEvents · mt-5
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">— BottomNav (pb-24) —</div>
              </div>
            </Frame>

            <div className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
              <p><span className="text-foreground font-semibold">Outer wrapper:</span> <code className="font-mono">min-h-screen bg-background pb-24</code></p>
              <p><span className="text-foreground font-semibold">Main padding:</span> <code className="font-mono">px-4 pt-3 pb-2</code></p>
              <p><span className="text-foreground font-semibold">Module spacing:</span> <code className="font-mono">PersonalSlot mt-3 · CampaignRail mt-5 · TopEvents mt-5</code></p>
              <p><span className="text-foreground font-semibold">Empty handling:</span> <code className="font-mono">{`<div className="mt-3 empty:hidden"><PersonalSlot/></div>`}</code> — collapses spacing when null</p>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* ============================== */}
      {/* COMPOSED PREVIEW · 5 STATES    */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-composed"
        title="Composed Preview"
        platform="mobile"
        description="整页按用户激活状态拼出来长什么样。切换 chip 看 Greeting / PersonalSlot / TopEvents 三个模块在每个 state 下的实际显隐与文案。"
      >
        <Card className="trading-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">State:</span>
              {(Object.keys(composedMatrix) as ComposedState[]).map((id) => (
                <Badge
                  key={id}
                  variant={composedState === id ? "default" : "outline"}
                  className="cursor-pointer font-mono"
                  onClick={() => setComposedState(id)}
                >
                  {composedMatrix[id].label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Frame>
              <div className="space-y-3">
                <HeaderReplica />
                <div className="pt-1">
                  {composed.greeting === "guest" && <HomeGreetingGuest />}
                  {composed.greeting === "authedActive" && <HomeGreetingAuthed hasData />}
                  {composed.greeting === "authedEmpty" && <HomeGreetingAuthed hasData={false} />}
                </div>
                {composed.slot !== "null" && (
                  <div className="mt-3">
                    {composed.slot === "onboarding" && <OnboardingCardReplica step={composed.onboardingStep ?? 2} />}
                    {composed.slot === "positionAlert" && <PositionAlertReplica />}
                  </div>
                )}
                {composed.slot === "null" && (
                  <div className="text-[10px] font-mono text-muted-foreground/70 italic">
                    — PersonalSlot collapsed (empty:hidden) —
                  </div>
                )}
                <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto pb-1">
                  <CampaignBannerReplica theme="gold" />
                  <CampaignBannerReplica theme="primary" />
                  <CampaignBannerReplica theme="green" />
                </div>
                <div className="mt-5">
                  <TopEventsReplica title={composed.eventsTitle} withInterlude={composed.interlude} />
                </div>
              </div>
            </Frame>

            <p className="mt-4 text-xs text-muted-foreground">{composed.note}</p>

            <SubSection title="State matrix" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">State</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Greeting</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">PersonalSlot</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Onboarding step</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">TopEvents title</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Interlude</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(Object.keys(composedMatrix) as ComposedState[]).map((id) => {
                      const row = composedMatrix[id];
                      return (
                        <tr key={id} className={composedState === id ? "bg-primary/5" : ""}>
                          <td className="py-1.5 font-mono font-medium">{row.label}</td>
                          <td className="py-1.5 font-mono text-muted-foreground">{row.greeting}</td>
                          <td className="py-1.5 font-mono text-muted-foreground">{row.slot === "null" ? "— hidden —" : row.slot}</td>
                          <td className="py-1.5 font-mono text-muted-foreground">{row.onboardingStep ? `${row.onboardingStep} of 3` : "—"}</td>
                          <td className="py-1.5">{row.eventsTitle}</td>
                          <td className="py-1.5 text-muted-foreground">{row.interlude ? <code className="font-mono text-mainnet-gold">&lt;MainnetLaunchCallout/&gt;</code> : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                State 来源：<code className="font-mono">useActivationState</code>（GUEST · S0_NEW · S1_DEPOSITED · S2_TRADED · S3_ACTIVE）。下面的各模块 playground 只展示单卡视觉，整页拼装请以此为准。
              </p>
            </SubSection>
          </CardContent>
        </Card>
      </SectionWrapper>



      {/* ============================== */}
      {/* HEADER (HOME PRESET)           */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-header"
        title="Header (Home preset)"
        platform="mobile"
        description="`<MobileHeader showLogo showBack={false} rightContent={...} />` with three actions: Discord · Language · Notifications."
      >
        <Card className="trading-card">
          <CardContent className="pt-6">
            <Frame>
              <HeaderReplica />
            </Frame>
            <div className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
              <p><span className="text-foreground font-semibold">Discord:</span> external link, <code className="font-mono">hover:bg-[#5865F2]/15</code></p>
              <p><span className="text-foreground font-semibold">Language:</span> dropdown with English / 中文 / 日本語</p>
              <p><span className="text-foreground font-semibold">Notifications:</span> red dot indicator (2px) for unread, currently triggers a toast placeholder</p>
              <p><span className="text-foreground font-semibold">Touch targets:</span> all buttons <code className="font-mono">p-2</code> wrapped in <code className="font-mono">rounded-full</code> hover surface</p>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* ============================== */}
      {/* HOMEGREETING · 3 STATES        */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-greeting"
        title="HomeGreeting"
        platform="mobile"
        description="Single card with two top-level branches (guest vs authed); authed splits again on `useEquity7D().hasData`."
      >
        <Card className="trading-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">State:</span>
              {[
                { id: "guest" as const, label: "Guest" },
                { id: "authedActive" as const, label: "Authed · has 7D data" },
                { id: "authedEmpty" as const, label: "Authed · no 7D data" },
              ].map((s) => (
                <Badge
                  key={s.id}
                  variant={greetingState === s.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setGreetingState(s.id)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Frame>
              {greetingState === "guest" && <HomeGreetingGuest />}
              {greetingState === "authedActive" && <HomeGreetingAuthed hasData />}
              {greetingState === "authedEmpty" && <HomeGreetingAuthed hasData={false} />}
            </Frame>

            <SubSection title="State spec" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">State</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Top label</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Hero</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Right slot</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">CTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="py-2 font-medium">Guest</td>
                      <td className="py-2 text-trading-green font-mono">● Live on OmenX</td>
                      <td className="py-2">$X traded · 24h<br />N active markets</td>
                      <td className="py-2">Top markets sparkline (primary)</td>
                      <td className="py-2">Sign in to start trading →</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Authed · has data</td>
                      <td className="py-2 font-mono">Welcome back</td>
                      <td className="py-2">Total equity (34px)<br />+/-X% 7D</td>
                      <td className="py-2">7D PnL sparkline (green/red)</td>
                      <td className="py-2">Whole card → /wallet · Deposit chip</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Authed · no data</td>
                      <td className="py-2 font-mono">Welcome back</td>
                      <td className="py-2">Total equity<br />"No 7D activity — Tap deposit to start"</td>
                      <td className="py-2">Dashed placeholder line</td>
                      <td className="py-2">Same as above</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Source: <code className="font-mono">src/components/home/HomeGreeting.tsx</code> · Stats hook: <code className="font-mono">useHomeStats</code> · Equity hook: <code className="font-mono">useEquity7D</code>
              </p>
            </SubSection>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* ============================== */}
      {/* PERSONAL SLOT · 3 STATES       */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-personal-slot"
        title="PersonalSlot"
        platform="mobile"
        description="Single slot picks one card based on user state. Priority: Onboarding (S0/S1) > PositionAlert (activated + has positions). Guests and activated-but-empty users render nothing."
      >
        <Card className="trading-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">State:</span>
              {[
                { id: "guestOrEmpty" as const, label: "Guest / activated empty (null)" },
                { id: "onboarding" as const, label: "S0_NEW / S1_DEPOSITED" },
                { id: "positionAlert" as const, label: "Activated + position" },
              ].map((s) => (
                <Badge
                  key={s.id}
                  variant={slotState === s.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSlotState(s.id)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Frame>
              {slotState === "guestOrEmpty" && (
                <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center text-[11px] font-mono text-muted-foreground">
                  renders null (slot wrapper has empty:hidden)
                </div>
              )}
              {slotState === "onboarding" && <OnboardingCardReplica />}
              {slotState === "positionAlert" && <PositionAlertReplica />}
            </Frame>

            <div className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
              <p><span className="text-foreground font-semibold">Resolution order:</span> 1) <code className="font-mono">!user || isLoading</code> → null · 2) <code className="font-mono">state ∈ S0_NEW / S1_DEPOSITED</code> → OnboardingCard · 3) top non-airdrop position by |pnl%| → PositionAlertCard · 4) fallthrough → null</p>
              <p><span className="text-foreground font-semibold">Source:</span> <code className="font-mono">src/components/home/PersonalSlot.tsx</code></p>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* ============================== */}
      {/* CAMPAIGN RAIL                  */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-campaign-rail"
        title="HomeCampaignRail"
        platform="mobile"
        description="Horizontal-scrolling banner rail. 4 theme keys map to surface + metric + chip color sets."
      >
        <Card className="trading-card">
          <CardContent className="pt-6">
            <Frame>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                <CampaignBannerReplica theme="gold" />
                <CampaignBannerReplica theme="primary" />
                <CampaignBannerReplica theme="green" />
                <CampaignBannerReplica theme="violet" />
              </div>
            </Frame>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Theme</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Metric color</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Use case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr><td className="py-1.5 font-mono">gold</td><td className="py-1.5 text-mainnet-gold">mainnet-gold</td><td className="py-1.5 text-muted-foreground">Mainnet rewards / token launches</td></tr>
                  <tr><td className="py-1.5 font-mono">primary</td><td className="py-1.5 text-primary">primary</td><td className="py-1.5 text-muted-foreground">General campaigns, new features</td></tr>
                  <tr><td className="py-1.5 font-mono">green</td><td className="py-1.5 text-trading-green">trading-green</td><td className="py-1.5 text-muted-foreground">Earnings / trading incentives</td></tr>
                  <tr><td className="py-1.5 font-mono">violet</td><td className="py-1.5 text-purple-400">purple-400</td><td className="py-1.5 text-muted-foreground">Community / partnership events</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Source: <code className="font-mono">src/components/home/HomeCampaignRail.tsx</code> · Banner data: <code className="font-mono">@/components/campaign/banners</code>
            </p>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* ============================== */}
      {/* TOP EVENTS                     */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-top-events"
        title="HomeTopEvents"
        platform="mobile"
        description="Title + interlude vary by user state. List sorted by 24h volume desc (`useHotMarkets`)."
      >
        <Card className="trading-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">User:</span>
              {[
                { id: "guest" as const, label: "Guest" },
                { id: "authedNoPosition" as const, label: "Authed · no position" },
                { id: "authedWithPosition" as const, label: "Authed · has position" },
              ].map((s) => (
                <Badge
                  key={s.id}
                  variant={eventsState === s.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEventsState(s.id)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Frame>
              <TopEventsReplica
                title={eventsConfig[eventsState].title}
                withInterlude={eventsConfig[eventsState].withInterlude}
              />
            </Frame>
            <p className="mt-3 text-xs text-muted-foreground">{eventsConfig[eventsState].note}</p>

            <SubSection title="Title & interlude rules" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">User</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Title</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Interlude</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr><td className="py-1.5">Guest</td><td className="py-1.5 font-mono">Top Events</td><td className="py-1.5"><code className="font-mono text-mainnet-gold">&lt;MainnetLaunchCallout/&gt;</code></td></tr>
                    <tr><td className="py-1.5">Authed · no position</td><td className="py-1.5 font-mono">Pick your first prediction</td><td className="py-1.5 text-muted-foreground">none</td></tr>
                    <tr><td className="py-1.5">Authed · with position</td><td className="py-1.5 font-mono">Top Events</td><td className="py-1.5 text-muted-foreground">none</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Sort: <code className="font-mono">b.volume24h - a.volume24h</code> across the `all` bucket. Source: <code className="font-mono">src/hooks/useHotMarkets.ts</code> + <code className="font-mono">src/components/home/HomeTopEvents.tsx</code>.
              </p>
            </SubSection>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* ============================== */}
      {/* GLOBAL INTERACTIONS            */}
      {/* ============================== */}
      <SectionWrapper
        id="mobile-home-interactions"
        title="Global interactions & spec"
        platform="mobile"
        description="Conventions shared across all home modules."
      >
        <Card className="trading-card">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Behavior</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Spec</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-2 font-medium">Guest taps any auth-gated card</td>
                    <td className="py-2 text-muted-foreground">Opens <code className="font-mono">AuthSheet</code> via shared <code className="font-mono">onSignIn</code> handler.</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Authed taps HomeGreeting card</td>
                    <td className="py-2 text-muted-foreground">Navigates to <code className="font-mono">/wallet</code>; Deposit chip stops propagation and goes to <code className="font-mono">/deposit</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">PersonalSlot empty</td>
                    <td className="py-2 text-muted-foreground">Wrapper uses <code className="font-mono">empty:hidden</code> so the <code className="font-mono">mt-3</code> gap collapses.</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Card radius</td>
                    <td className="py-2 text-muted-foreground"><code className="font-mono">rounded-2xl</code> for hero/personal cards, <code className="font-mono">rounded-xl</code> for child rows.</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Border tone</td>
                    <td className="py-2 text-muted-foreground"><code className="font-mono">border-border/40</code> default, hover/active strengthens to <code className="font-mono">border-border</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Numbers</td>
                    <td className="py-2 text-muted-foreground"><code className="font-mono">font-mono</code> + <code className="font-mono">tabular-nums</code> on all financial figures.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodePreview
              code={`// MobileHome render order
<MobileHeader showLogo showBack={false} rightContent={headerActions} />
<main className="px-4 pt-3 pb-2">
  <HomeGreeting onSignIn={() => setAuthOpen(true)} />
  <div className="mt-3 empty:hidden">
    <PersonalSlot />
  </div>
  <div className="mt-5">
    <HomeCampaignRail />
  </div>
  <div className="mt-5">
    <HomeTopEvents
      title={isAuthed && !hasPosition ? "Pick your first prediction" : "Top Events"}
      interlude={!isAuthed ? <TrialCallout onSignIn={...} /> : undefined}
    />
  </div>
</main>`}
              collapsible
              defaultExpanded={false}
            />
          </CardContent>
        </Card>
      </SectionWrapper>
    </div>
  );
};
