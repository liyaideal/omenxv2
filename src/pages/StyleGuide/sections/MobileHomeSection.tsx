import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { MobileHeader } from "@/components/MobileHeader";
import { HomeHeaderActions } from "@/pages/MobileHome";
import { HomeGreeting } from "@/components/home/HomeGreeting";
import { OnboardingCard } from "@/components/home/feed/cards/OnboardingCard";
import { PositionAlertCard } from "@/components/home/feed/cards/PositionAlertCard";
import { HomeCampaignRail } from "@/components/home/HomeCampaignRail";
import { HomeTopEvents } from "@/components/home/HomeTopEvents";

interface MobileHomeSectionProps {
  isMobile: boolean;
}

/* -----------------------------------------------------------------------
 * Live component demos
 *
 * Every module below mounts the REAL production component. State variety
 * comes from `demoOverride` props (style-guide only) which bypass the auth /
 * supabase hooks and disable navigation — never from hand-copied markup.
 * ----------------------------------------------------------------------- */

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-[360px] rounded-2xl border border-border/50 bg-background p-4">
    {children}
  </div>
);

/* ---------- A. Header (live MobileHeader + real action cluster) ---------- */

const HeaderReplica = () => (
  <MobileHeader showLogo showBack={false} rightContent={<HomeHeaderActions />} />
);

/* ---------- B. HomeGreeting (live, demoOverride-driven) ---------- */

const DEMO_SPARK = [100, 101.2, 100.4, 102.1, 101.6, 103.4, 104.2];

const HomeGreetingGuest = () => (
  <HomeGreeting
    onSignIn={() => {}}
    demoOverride={{
      isAuthed: false,
      volume24h: 4_200_000,
      activeMarkets: 128,
      sparkPoints: DEMO_SPARK,
    }}
  />
);

const HomeGreetingAuthed = ({ hasData }: { hasData: boolean }) => (
  <HomeGreeting
    onSignIn={() => {}}
    demoOverride={{
      isAuthed: true,
      displayName: "alex",
      balance: 13530,
      hasData,
      pnlPercent: hasData ? 1.9 : 0,
      points: hasData ? DEMO_SPARK : [],
    }}
  />
);

/* ---------- C. PersonalSlot cards (live) ---------- */

const OnboardingCardReplica = ({ step = 2 }: { step?: 2 | 3 }) => (
  <OnboardingCard demoOverride={{ hasDeposited: step === 3, hasTraded: false }} />
);

const PositionAlertReplica = () => (
  <PositionAlertCard
    positionId="style-guide-demo"
    demoOverride={{
      event: "BTC > $100k",
      option: "Yes",
      pnl: "+$24.30",
      pnlPercent: "+12.4%",
    }}
  />
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
  guest:       { label: "Guest",        greeting: "guest",        slot: "null",          onboardingStep: null, eventsTitle: "Top Events",                 interlude: false, note: "未登录：PersonalSlot 收起（empty:hidden），TopEvents 直接铺卡，无插播模块。" },
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
    guest: { title: "Top Events", withInterlude: false, note: "Guest user — no interlude module" },
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
                          <td className="py-1.5 text-muted-foreground">{"—"}</td>
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
                    <tr><td className="py-1.5">Guest</td><td className="py-1.5 font-mono">Top Events</td><td className="py-1.5">—</td></tr>
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
