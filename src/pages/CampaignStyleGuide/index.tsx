import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  LayoutTemplate,
  Network,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Trophy,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CampaignPlayground } from "./Playground";

const principles = [
  {
    icon: GitBranch,
    title: "Different campaign, different concept",
    body: "The style guide defines guardrails and reusable primitives, not one universal landing template. Each campaign needs its own metaphor, rhythm, and hero composition.",
  },
  {
    icon: LayoutTemplate,
    title: "Reusable structure, flexible expression",
    body: "Reuse safe width, CTA hierarchy, section headers, reward clarity, and QA rules. Change the visual archetype, layout density, art direction, and narrative pacing.",
  },
  {
    icon: ShieldCheck,
    title: "No product-page autopilot",
    body: "Campaign pages should not look like settings pages, event lists, or trading dashboards with bigger text. They are conversion microsites with campaign-specific art direction.",
  },
  {
    icon: ClipboardList,
    title: "Document before building",
    body: "Before a new campaign page is coded, define its archetype, audience emotion, reward framing, hero treatment, and mobile behavior.",
  },
];

const archetypes = [
  {
    id: "launch-console",
    icon: BarChart3,
    title: "Launch Console",
    fit: "Mainnet launch, feature launch, production migration",
    mood: "Controlled, technical, institutional",
    layout: "Split hero with system diagram, status rail, ledger modules",
    avoid: "Rockets, fake mission-control clutter, oversized glowing gradients",
    accent: "text-campaign-accent border-campaign-accent/30 bg-campaign-accent/10",
    preview: "console",
  },
  {
    id: "competition-scoreboard",
    icon: Trophy,
    title: "Competition Scoreboard",
    fit: "Trading contest, leaderboard season, rank-based campaign",
    mood: "Competitive, sharp, high-energy",
    layout: "Scoreboard hero, ranking bands, prize table, progress race",
    avoid: "Casino visuals, confetti overload, generic trophy wallpaper",
    accent: "text-primary border-primary/30 bg-primary/10",
    preview: "scoreboard",
  },
  {
    id: "referral-network",
    icon: Network,
    title: "Referral Network",
    fit: "Invite campaign, ambassador program, social growth loop",
    mood: "Social, networked, compounding",
    layout: "Node graph hero, invite chain, payout tree, proof steps",
    avoid: "Random people photos, childish share graphics, emoji chains",
    accent: "text-trading-green border-trading-green/30 bg-trading-green/10",
    preview: "network",
  },
  {
    id: "reward-vault",
    icon: WalletCards,
    title: "Reward Vault",
    fit: "Points, rebate, cashback, claim, account-credit campaign",
    mood: "Premium, precise, payout-focused",
    layout: "Vault/ledger hero, claim states, payout queue, eligibility panels",
    avoid: "Cartoon gifts, fake 3D coins, coupon-card grids",
    accent: "text-trading-yellow border-trading-yellow/30 bg-trading-yellow/10",
    preview: "vault",
  },
  {
    id: "retro-poster",
    icon: Newspaper,
    title: "Retro Poster",
    fit: "World Cup / sports / seasonal hedge / cultural-moment campaign",
    mood: "Retro print, decisive, human, anti-AI-template",
    layout: "Poster frame with ink border + offset hard shadow, display type, stickers/stamps, dual-card outcomes, scoreboard-style stats strip",
    avoid: "Web3 purple gradients, dark stacked cards, emoji, AI-rendered illustrations, glassmorphism",
    accent: "text-[#E11D48] border-[#E11D48]/40 bg-[#E11D48]/10",
    preview: "retroPoster",
  },
];

const componentRules = [
  ["Page shell", "Full-width campaign root with overflow protection and campaign-specific art direction."],
  ["Section header", "Vertical eyebrow → title → description. Do not split title and description into two columns."],
  ["Hero", "Campaign-specific composition. May be split, editorial, dense console, scoreboard, or graph-based."],
  ["Reward module", "Ledger/table/status framing. Must clarify threshold, payout timing, and cumulative rules."],
  ["CTA", "One primary conversion action per viewport. Secondary actions must not compete."],
  ["Homepage banner", "Compact entry point matching the campaign archetype, not a separate poster style."],
];

const qaRules = [
  "1024px and above: no horizontal overflow, header and content safe areas align.",
  "Mobile: hero headline wraps cleanly; CTA remains reachable; no clipped badge text.",
  "Each campaign has a declared archetype before code starts.",
  "No rockets, emoji labels, random glowing orbs, or generic crypto template visuals.",
  "Reward rules are understandable without reading source code or asking support.",
];

const PreviewCanvas = ({ type }: { type: string }) => {
  if (type === "scoreboard") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border/60 pb-3 font-mono text-xs">
          <span className="text-muted-foreground">Rank Window</span>
          <span className="text-primary">Season 01</span>
        </div>
        {["Top 10", "Top 50", "Top 100"].map((rank, index) => (
          <div key={rank} className="grid grid-cols-[64px_1fr_56px] items-center gap-3 border border-border/50 bg-background/35 p-2 font-mono text-xs">
            <span className="text-muted-foreground">0{index + 1}</span>
            <div className="h-2 bg-primary/20"><div className="h-full bg-primary" style={{ width: `${82 - index * 18}%` }} /></div>
            <span className="text-right text-foreground">{rank}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "network") {
    return (
      <div className="relative h-44 overflow-hidden border border-border/50 bg-background/30">
        <svg viewBox="0 0 360 176" className="absolute inset-0 h-full w-full">
          <path d="M58 88 L142 44 L220 88 L302 54" stroke="hsl(var(--trading-green) / 0.45)" strokeWidth="1.5" fill="none" />
          <path d="M58 88 L142 132 L220 88 L302 122" stroke="hsl(var(--trading-green) / 0.28)" strokeWidth="1.5" fill="none" />
          {[ [58,88], [142,44], [142,132], [220,88], [302,54], [302,122] ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="hsl(var(--background))" stroke="hsl(var(--trading-green))" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-trading-green">Invite Chain</div>
      </div>
    );
  }

  if (type === "vault") {
    return (
      <div className="space-y-3">
        <div className="border border-trading-yellow/30 bg-trading-yellow/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Available Credit</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-trading-yellow">$2,400</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Claim", "Pending", "Paid"].map((item) => (
            <div key={item} className="border border-border/50 bg-background/30 p-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item}</div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "retroPoster") {
    return (
      <div
        className="relative border-[4px] border-[#0E0E0E] bg-[#FDFCF0] p-4 text-[#0E0E0E]"
        style={{ boxShadow: "8px 8px 0 0 #E11D48" }}
      >
        <span
          className="inline-block -rotate-2 border-2 border-[#0E0E0E] bg-[#E11D48] px-2 py-0.5 font-poster text-[10px] uppercase tracking-wider text-white"
          style={{ fontFamily: '"Archivo Black", Impact, sans-serif' }}
        >
          World Cup 2026
        </span>
        <div
          className="mt-2 font-poster text-2xl uppercase leading-none"
          style={{ fontFamily: '"Archivo Black", Impact, sans-serif' }}
        >
          Hedge your <span className="text-[#1D4ED8]">pick</span>
        </div>
        <div className="mt-3 inline-block border-2 border-[#0E0E0E] bg-[#1D4ED8] px-3 py-1 font-poster text-[10px] uppercase tracking-wider text-white">
          Open Your Hedge →
        </div>
        <div className="mt-3 flex gap-2 border-t-2 border-[#0E0E0E] pt-2 font-mono text-[9px] uppercase tracking-widest text-[#0E0E0E]/60">
          <span><span className="font-poster text-[#E11D48]">$47K</span> dist</span>
          <span><span className="font-poster">1,284</span> claimed</span>
          <span><span className="font-poster text-[#1D4ED8]">213</span> left</span>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {['Live', '14D', '$5K'].map((item) => (
          <div key={item} className="border border-campaign-accent/25 bg-campaign-accent/10 p-3 text-center font-mono text-xs text-campaign-accent">{item}</div>
        ))}
      </div>
      <div className="relative h-32 border border-border/50 bg-background/30 p-4">
        <div className="absolute inset-x-4 top-1/2 h-px bg-border" />
        <svg viewBox="0 0 300 100" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]">
          <polyline points="0,76 42,68 78,72 112,44 148,52 184,28 224,40 260,20 300,28" fill="none" stroke="hsl(var(--campaign-accent))" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

const CampaignStyleGuide = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("principles");

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-8 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 hover:bg-muted/40">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold md:text-2xl">Campaign Style Guide</h1>
              <p className="text-sm text-muted-foreground">Design system documentation for campaign landing pages</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden border-campaign-accent/30 bg-campaign-accent/10 font-mono text-campaign-accent md:inline-flex">
            CAMPAIGN_DESIGN.md
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <Card className="mb-6 border-border/60 bg-card/60">
          <CardHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-campaign-accent/30 bg-campaign-accent/10 font-mono text-campaign-accent">Separate System</Badge>
              <Badge variant="outline" className="border-border/60 bg-background/40 font-mono text-muted-foreground">Not A Template</Badge>
            </div>
            <CardTitle className="max-w-4xl text-3xl leading-tight tracking-[-0.03em] md:text-5xl">
              Campaign pages share standards, not the same layout.
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 md:text-lg">
              This guide defines reusable rules and creative ranges. New campaigns should pick an archetype, then create a distinct landing experience within the OmenX brand.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex w-full justify-start overflow-x-auto bg-muted/40 p-1">
            <TabsTrigger value="principles" className="gap-2 whitespace-nowrap"><ShieldCheck className="h-4 w-4" />Principles</TabsTrigger>
            <TabsTrigger value="archetypes" className="gap-2 whitespace-nowrap"><Award className="h-4 w-4" />Archetypes</TabsTrigger>
            <TabsTrigger value="components" className="gap-2 whitespace-nowrap"><LayoutTemplate className="h-4 w-4" />Components</TabsTrigger>
            <TabsTrigger value="playground" className="gap-2 whitespace-nowrap"><Sparkles className="h-4 w-4" />Playground</TabsTrigger>
            <TabsTrigger value="qa" className="gap-2 whitespace-nowrap"><CheckCircle2 className="h-4 w-4" />QA</TabsTrigger>
          </TabsList>

          <TabsContent value="principles" className="mt-0 space-y-6">
            <section>
              <div className="mb-4 border-b border-border pb-2">
                <h2 className="text-xl font-semibold text-foreground">Creative Guardrails</h2>
                <p className="mt-1 text-sm text-muted-foreground">The system should prevent bad taste without forcing every campaign to look identical.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {principles.map((item) => (
                  <Card key={item.title} className="border-border/60 bg-card/60">
                    <CardHeader>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-campaign-accent/25 bg-campaign-accent/10">
                        <item.icon className="h-5 w-5 text-campaign-accent" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="archetypes" className="mt-0 space-y-6">
            <section>
              <div className="mb-4 border-b border-border pb-2">
                <h2 className="text-xl font-semibold text-foreground">Campaign Archetypes</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a direction per campaign. Do not reuse the same hero skeleton by default.</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {archetypes.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-border/60 bg-card/60">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="outline" className={cn("mb-3 font-mono", item.accent)}>{item.fit}</Badge>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <item.icon className="h-5 w-5 text-campaign-accent" />
                            {item.title}
                          </CardTitle>
                          <CardDescription className="mt-2">{item.mood}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div className="space-y-3 text-sm leading-6">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Layout Range</p>
                          <p className="mt-1 text-foreground/90">{item.layout}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Avoid</p>
                          <p className="mt-1 text-muted-foreground">{item.avoid}</p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/35 p-4">
                        <PreviewCanvas type={item.preview} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="components" className="mt-0 space-y-6">
            <section>
              <div className="mb-4 border-b border-border pb-2">
                <h2 className="text-xl font-semibold text-foreground">Reusable Primitives</h2>
                <p className="mt-1 text-sm text-muted-foreground">These are shared building blocks. They should support variation, not dictate a single page design.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {componentRules.map(([title, body]) => (
                  <Card key={title} className="border-border/60 bg-card/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-border/60 bg-card/60">
                <CardHeader>
                  <CardTitle>Section Header Standard</CardTitle>
                  <CardDescription>This one rule is strict because it avoids the awkward split-column issue.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-3xl border-l border-campaign-accent/40 pl-5">
                    <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-campaign-accent">Eyebrow</p>
                    <h3 className="max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">Title and explanation stay in one vertical reading flow.</h3>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">Description supports the title underneath it. If a campaign needs a more editorial layout, it must be intentionally mocked, not generated by default.</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="playground" className="mt-0">
            <CampaignPlayground />
          </TabsContent>

          <TabsContent value="qa" className="mt-0 space-y-6">
            <section>
              <div className="mb-4 border-b border-border pb-2">
                <h2 className="text-xl font-semibold text-foreground">Shipping Checklist</h2>
                <p className="mt-1 text-sm text-muted-foreground">A campaign is not ready until layout, creative direction, and clarity pass these checks.</p>
              </div>
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-0">
                  {qaRules.map((rule, index) => (
                    <div key={rule} className="grid gap-4 border-b border-border/50 p-4 last:border-b-0 md:grid-cols-[80px_1fr] md:items-center">
                      <span className="font-mono text-xs text-campaign-accent">{String(index + 1).padStart(2, "0")}</span>
                      <p className="text-sm leading-6 text-muted-foreground md:text-base">{rule}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CampaignStyleGuide;
