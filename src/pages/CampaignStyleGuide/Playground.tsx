import { useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Countdown } from "@/components/mainnet-launch/Countdown";
import { RewardSnapshot } from "@/components/mainnet-launch/RewardSnapshot";
import { RewardLadder } from "@/components/mainnet-launch/RewardLadder";
import { ProgressDashboard } from "@/components/mainnet-launch/ProgressDashboard";
import { MobileFloatingCTA } from "@/components/mainnet-launch/MobileFloatingCTA";
import { TrustBar } from "@/components/mainnet-launch/TrustBar";
import { SectionShell, SectionTitle } from "@/components/mainnet-launch/SectionShell";
import { Slider } from "@/components/ui/slider";
import { MAINNET_REBATE_TIERS, FIRST_TRADE_VOLUME, getCurrentTier, getNextTier, getTierProgress } from "@/lib/mainnetLaunch";
import { HedgeCTAButton, type HedgeCTAState } from "@/components/hedge/HedgeCTAButton";
import { HedgePosterFrame, type PosterShadow } from "@/components/hedge/HedgePosterFrame";

import { HedgeHero } from "@/components/hedge/HedgeHero";
import { HedgeUpsetsStrip } from "@/components/hedge/HedgeUpsetsStrip";


const REUSED_IN: Record<string, string[]> = {
  countdown: ["Mainnet Launch"],
  snapshot: ["Mainnet Launch"],
  ladder: ["Mainnet Launch"],
  dashboard: ["Mainnet Launch"],
  floating: ["Mainnet Launch"],
  trust: ["Mainnet Launch"],
  shell: ["Mainnet Launch"],
  "retro-cta": ["World Cup H2E"],
  "retro-frame": ["World Cup H2E"],
  "retro-tier": ["World Cup H2E"],
  "retro-tokens": ["World Cup H2E"],
  "retro-hero": ["World Cup H2E"],
};

const PlaygroundCard = ({
  id,
  title,
  description,
  whenToUse,
  whenNotTo,
  propsHint,
  children,
}: {
  id: string;
  title: string;
  description: string;
  whenToUse: string;
  whenNotTo: string;
  propsHint?: string;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded-md border border-border/60 bg-card/40">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 bg-background/30 px-5 py-4">
      <div className="min-w-0">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-foreground">{title}</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(REUSED_IN[id] ?? []).map((tag) => (
          <Badge key={tag} variant="outline" className="border-campaign-accent/30 bg-campaign-accent/10 font-mono text-[10px] uppercase tracking-[0.16em] text-campaign-accent">
            Reused in: {tag}
          </Badge>
        ))}
      </div>
    </header>

    <div className="bg-background/15 p-5 md:p-6">{children}</div>

    <footer className="grid gap-4 border-t border-border/40 bg-background/30 p-5 md:grid-cols-2 md:p-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-trading-green">When to use</p>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{whenToUse}</p>
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-trading-red">When not to</p>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{whenNotTo}</p>
      </div>
      {propsHint && (
        <div className="md:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Shape</p>
          <pre className="mt-1.5 overflow-x-auto rounded-sm border border-border/40 bg-background/40 p-3 font-mono text-[11px] leading-5 text-foreground/80">{propsHint}</pre>
        </div>
      )}
    </footer>
  </section>
);

// — Countdown demo: pick from preset endsAt
const COUNTDOWN_PRESETS = [
  { id: "far", label: "> 7 days", offsetMs: 1000 * 60 * 60 * 24 * 9 },
  { id: "future", label: "> 1 day", offsetMs: 1000 * 60 * 60 * 36 },
  { id: "today", label: "< 12 hours", offsetMs: 1000 * 60 * 60 * 6 },
  { id: "soon", label: "< 1 hour", offsetMs: 1000 * 60 * 12 },
  { id: "lastmin", label: "< 1 minute", offsetMs: 1000 * 30 },
  { id: "ended", label: "Ended", offsetMs: -1 },
];

// Horizontal scrollable preset rail — keeps every state visible without wrap.
const PresetRail = <T extends { id: string; label: string }>({
  presets,
  activeId,
  onSelect,
}: {
  presets: readonly T[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="-mx-1 overflow-x-auto pb-1">
    <div className="flex gap-2 px-1 whitespace-nowrap">
      {presets.map((p) => (
        <Button
          key={p.id}
          size="sm"
          variant={p.id === activeId ? "default" : "outline"}
          onClick={() => onSelect(p.id)}
          className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em]"
        >
          {p.label}
        </Button>
      ))}
    </div>
  </div>
);

const CountdownDemo = () => {
  const [presetId, setPresetId] = useState("future");
  const preset = COUNTDOWN_PRESETS.find((p) => p.id === presetId)!;
  const endsAt = new Date(Date.now() + preset.offsetMs);
  return (
    <div className="space-y-4">
      <PresetRail presets={COUNTDOWN_PRESETS} activeId={presetId} onSelect={setPresetId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-border/40 bg-background/30 p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Compact</p>
          <Countdown compact endsAt={endsAt} className="text-mainnet-gold text-base" />
        </div>
        <div className="rounded-sm border border-border/40 bg-background/30 p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Yes</p>
          <Countdown endsAt={endsAt} className="text-mainnet-gold text-base" />
        </div>
      </div>
    </div>
  );
};

// — Volume slider: drag any volume across [$0, $1.5M] and read the derived state live.
//   Slider value is an INDEX into a 3001-step grid (=$500 increments) so the thumb
//   can land on every meaningful boundary ($4,999.5 vs $5,000 etc).
const VOLUME_MAX = 1_500_000;
const VOLUME_STEP = 500;
const VOLUME_STEPS = VOLUME_MAX / VOLUME_STEP; // 3000

const VOLUME_TICKS: ReadonlyArray<{ volume: number; label: string; sub?: string }> = [
  { volume: 0, label: "$0", sub: "start" },
  { volume: 5_000, label: "$5K", sub: "bonus" },
  { volume: 10_000, label: "$10K", sub: "t1" },
  { volume: 50_000, label: "$50K", sub: "t2" },
  { volume: 100_000, label: "$100K", sub: "t3" },
  { volume: 300_000, label: "$300K", sub: "t4" },
  { volume: 500_000, label: "$500K", sub: "t5" },
  { volume: 750_000, label: "$750K", sub: "t6" },
  { volume: 1_000_000, label: "$1M", sub: "top" },
  { volume: VOLUME_MAX, label: "$1.5M", sub: "past" },
];

type DerivedVolumeState = {
  state:
    | "GUEST"
    | "PRE_BONUS"
    | "BONUS_UNLOCKED"
    | "NO_TIER"
    | "TIER_1"
    | "TIER_2"
    | "TIER_3"
    | "TIER_4"
    | "TIER_5"
    | "TIER_6"
    | "TOP_TIER"
    | "PAST_TOP";
  label: string;
  description: string;
  currentTier: ReturnType<typeof getCurrentTier>;
  nextTier: ReturnType<typeof getNextTier>;
  progressToNext: number;
  volumeToNext: number;
  event1Qualified: boolean;
  dashboardRenders: "component" | "null";
};

const deriveVolumeState = (volume: number): DerivedVolumeState => {
  const currentTier = getCurrentTier(volume);
  const nextTier = getNextTier(volume);
  const progressToNext = getTierProgress(volume);
  const volumeToNext = nextTier ? Math.max(0, nextTier.volume - volume) : 0;
  const event1Qualified = volume >= FIRST_TRADE_VOLUME;

  let state: DerivedVolumeState["state"] = "GUEST";
  let label = "Guest · no trade";
  let description = "Signed up but no trade volume yet. Treat as guest in activation funnel.";

  if (volume === 0) {
    state = "GUEST";
  } else if (volume < FIRST_TRADE_VOLUME) {
    state = "PRE_BONUS";
    label = "Pre-bonus";
    description = `Trading, $${(FIRST_TRADE_VOLUME - volume).toLocaleString()} short of the $5K first-trade bonus.`;
  } else if (!currentTier) {
    state = volume === FIRST_TRADE_VOLUME ? "BONUS_UNLOCKED" : "NO_TIER";
    label = state === "BONUS_UNLOCKED" ? "Bonus unlocked" : "Bonus unlocked · no tier";
    description = "First-trade bonus cleared. currentTier === null until $10K (tier 1).";
  } else if (!nextTier) {
    state = currentTier.volume === MAINNET_REBATE_TIERS[MAINNET_REBATE_TIERS.length - 1].volume
      ? volume > currentTier.volume
        ? "PAST_TOP"
        : "TOP_TIER"
      : "TOP_TIER";
    label = state === "PAST_TOP" ? "Past top tier" : "Top tier";
    description = state === "PAST_TOP"
      ? "Beyond the final ladder rung — nextTier === null."
      : "On the final ladder rung — nextTier === null.";
  } else {
    const tierIdx = MAINNET_REBATE_TIERS.findIndex((t) => t.volume === currentTier.volume);
    state = (`TIER_${tierIdx + 1}` as DerivedVolumeState["state"]);
    label = `Tier ${tierIdx + 1} · $${currentTier.rebate} rebate`;
    description = `On tier ${tierIdx + 1}. $${volumeToNext.toLocaleString()} to tier ${tierIdx + 2} ($${nextTier.rebate}).`;
  }

  return {
    state,
    label,
    description,
    currentTier,
    nextTier,
    progressToNext,
    volumeToNext,
    event1Qualified,
    dashboardRenders: event1Qualified ? "component" : "null",
  };
};

const fmt = (n: number) => `$${n.toLocaleString()}`;

const VolumeSlider = ({
  volume,
  onChange,
}: {
  volume: number;
  onChange: (v: number) => void;
}) => {
  const idx = Math.round(volume / VOLUME_STEP);
  const derived = deriveVolumeState(volume);
  return (
    <div className="space-y-4 rounded-sm border border-border/40 bg-background/30 p-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Trade volume
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground tabular-nums">
            {fmt(volume)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            State
          </p>
          <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-mainnet-gold">
            {derived.state}
          </p>
          <p className="mt-0.5 text-xs text-foreground">{derived.label}</p>
        </div>
      </div>

      <Slider
        value={[idx]}
        min={0}
        max={VOLUME_STEPS}
        step={1}
        onValueChange={(v) => onChange(v[0] * VOLUME_STEP)}
        aria-label="Trade volume"
      />

      <div className="relative h-10">
        {VOLUME_TICKS.map((t) => {
          const left = (t.volume / VOLUME_MAX) * 100;
          const active = Math.abs(t.volume - volume) < VOLUME_STEP / 2;
          return (
            <button
              key={t.volume}
              type="button"
              onClick={() => onChange(t.volume)}
              className="absolute top-0 -translate-x-1/2 cursor-pointer text-center transition-colors"
              style={{ left: `${left}%` }}
              aria-label={`Jump to ${t.label}`}
            >
              <span
                className={`block h-2 w-px ${active ? "bg-mainnet-gold" : "bg-border"}`}
              />
              <span
                className={`mt-1 block font-mono text-[10px] tabular-nums ${
                  active ? "text-mainnet-gold" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </span>
              {t.sub && (
                <span
                  className={`block font-mono text-[9px] uppercase tracking-[0.12em] ${
                    active ? "text-mainnet-gold/80" : "text-muted-foreground/60"
                  }`}
                >
                  {t.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 font-mono text-[11px] tabular-nums md:grid-cols-4">
        <DerivedRow label="event1Qualified" value={String(derived.event1Qualified)} tone={derived.event1Qualified ? "good" : "muted"} />
        <DerivedRow
          label="currentTier"
          value={derived.currentTier ? `${fmt(derived.currentTier.volume)} · $${derived.currentTier.rebate}` : "null"}
          tone={derived.currentTier ? "good" : "muted"}
        />
        <DerivedRow
          label="nextTier"
          value={derived.nextTier ? `${fmt(derived.nextTier.volume)} · $${derived.nextTier.rebate}` : "null"}
          tone={derived.nextTier ? "default" : "muted"}
        />
        <DerivedRow label="progressToNext" value={`${derived.progressToNext.toFixed(1)}%`} tone="default" />
        <DerivedRow label="volumeToNext" value={derived.nextTier ? fmt(derived.volumeToNext) : "—"} tone="default" />
        <DerivedRow
          label="Dashboard"
          value={derived.dashboardRenders === "component" ? "renders" : "null"}
          tone={derived.dashboardRenders === "component" ? "good" : "bad"}
        />
        <p className="col-span-2 text-[11px] leading-5 text-muted-foreground md:col-span-4">
          {derived.description}
        </p>
      </div>
    </div>
  );
};

const DerivedRow = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "good" | "bad" | "muted";
}) => (
  <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-1 last:border-0">
    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    <span
      className={
        tone === "good"
          ? "text-trading-green"
          : tone === "bad"
            ? "text-trading-red"
            : tone === "muted"
              ? "text-muted-foreground"
              : "text-foreground"
      }
    >
      {value}
    </span>
  </div>
);

const RewardLadderDemo = () => {
  const [volume, setVolume] = useState(120_000);
  const currentTier = getCurrentTier(volume);
  return (
    <div className="space-y-4">
      <VolumeSlider volume={volume} onChange={setVolume} />
      <RewardLadder
        onCta={() => {}}
        progressOverride={{ user: { id: "demo" }, volume, currentTier }}
      />
    </div>
  );
};

const ProgressDashboardDemo = () => {
  const [volume, setVolume] = useState(120_000);
  const currentTier = getCurrentTier(volume);
  const nextTier = getNextTier(volume);
  const progressToNext = getTierProgress(volume);
  const volumeToNextTier = nextTier ? Math.max(0, nextTier.volume - volume) : 0;
  const qualified = volume >= FIRST_TRADE_VOLUME;
  return (
    <div className="space-y-4">
      <VolumeSlider volume={volume} onChange={setVolume} />
      {!qualified ? (
        <div className="rounded-sm border border-dashed border-border/60 bg-background/20 p-6 text-center text-sm text-muted-foreground">
          Volume {fmt(volume)} is below the ${FIRST_TRADE_VOLUME.toLocaleString()} qualifying threshold —
          component renders <span className="font-mono text-foreground">null</span>. Surface a CTA / empty
          state in its place.
        </div>
      ) : (
        <ProgressDashboard
          onCta={() => {}}
          progressOverride={{
            user: { id: "demo" } as unknown as ReturnType<typeof useState>,
            event1Qualified: true,
            volume,
            currentTier,
            nextTier,
            progressToNext,
            volumeToFirstTrade: 0,
            volumeToNextTier,
            tradeCount: 24,
            isLoading: false,
            refetch: (() => {}) as never,
          } as never}
        />
      )}
    </div>
  );
};

// — MobileFloatingCTA demo: simulated trigger inside a 390px frame
const FloatingCTADemo = () => {
  const [hidden, setHidden] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setHidden((v) => !v)} className="font-mono text-[11px] uppercase tracking-[0.14em]">
          {hidden ? "Scroll back to top" : "Simulate scroll past hero"}
        </Button>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Trigger: hero leaves viewport
        </span>
      </div>
      <div className="relative mx-auto w-full max-w-[390px] overflow-hidden rounded-md border border-border/50 bg-background">
        <div className="h-12 border-b border-border/40 bg-background/80 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          390 × 540 mobile preview
        </div>
        <div className="h-[420px] overflow-hidden">
          {!hidden && (
            <div ref={triggerRef} className="grid h-full place-items-center bg-mainnet-surface/40 p-6 text-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mainnet-gold">Hero (visible)</p>
                <p className="mt-2 font-semibold text-foreground">Mock hero content</p>
                <p className="mt-1 text-xs text-muted-foreground">Floating CTA stays hidden while this is on screen.</p>
              </div>
            </div>
          )}
          {hidden && (
            <div className="grid h-full place-items-center p-6 text-center text-xs text-muted-foreground">
              Scrolled past hero — floating CTA pinned below.
            </div>
          )}
          {hidden && (
            <div className="absolute inset-x-0 bottom-0 z-40 border-t border-mainnet-gold/20 bg-background/95 p-3 backdrop-blur">
              <Button onClick={() => {}} className="h-12 w-full justify-between rounded-sm bg-mainnet-gold font-mono text-background hover:bg-mainnet-gold/90">
                <span>Claim My Bonus</span>
                <span className="font-mono text-xs">Demo</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShellDemo = () => (
  <div className="-m-5 md:-m-6">
    <SectionShell className="bg-mainnet-surface/30">
      <SectionTitle eyebrow="Section eyebrow" title="A campaign section uses this shell." desc="Shell handles padding, max-width, vertical rhythm. Title block enforces eyebrow → title → description." />
      <div className="rounded-sm border border-dashed border-border/60 bg-background/30 p-6 text-center text-sm text-muted-foreground">
        Your section content goes here.
      </div>
    </SectionShell>
  </div>
);

const TrustBarDemo = () => (
  <div className="-m-5 md:-m-6">
    <TrustBar />
  </div>
);

const SnapshotDemo = () => (
  <div className="-m-5 md:-m-6">
    <RewardSnapshot />
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// Retro Poster — World Cup H2E archetype
// ─────────────────────────────────────────────────────────────────────

const RETRO_CTA_PRESETS: ReadonlyArray<{ id: HedgeCTAState; label: string }> = [
  { id: "connect", label: "Guest · Connect" },
  { id: "open-hedge", label: "Auth'd · Open hedge" },
  { id: "view-hedges", label: "Has hedges · View" },
  { id: "loading", label: "Loading" },
  { id: "ended", label: "Campaign ended" },
];

const RetroCTADemo = () => {
  const [stateId, setStateId] = useState<HedgeCTAState>("connect");
  return (
    <div className="space-y-4">
      <PresetRail presets={RETRO_CTA_PRESETS} activeId={stateId} onSelect={(id) => setStateId(id as HedgeCTAState)} />
      <div className="grid gap-4 rounded-sm border-2 border-[#0E0E0E] bg-[#FDFCF0] p-6 md:grid-cols-2">
        <div className="flex flex-col items-start gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0E0E0E]/60">Desktop · inline</p>
          <HedgeCTAButton stateOverride={stateId} />
        </div>
        <div className="flex flex-col items-stretch gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0E0E0E]/60">Mobile · full-width</p>
          <HedgeCTAButton stateOverride={stateId} fullWidth size="default" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Pressed state flattens the hard shadow ( <code className="font-mono">border-b-[10px]→3</code> + translate ). Hover the button to feel it.
      </p>
    </div>
  );
};

const FRAME_SHADOW_PRESETS: ReadonlyArray<{ id: PosterShadow; label: string }> = [
  { id: "red", label: "Red shadow" },
  { id: "yellow", label: "Yellow shadow" },
  { id: "blue", label: "Blue shadow" },
  { id: "ink", label: "Ink shadow" },
];

const RetroFrameDemo = () => {
  const [shadow, setShadow] = useState<PosterShadow>("red");
  const [size, setSize] = useState<"lg" | "sm">("lg");
  const [noise, setNoise] = useState(true);
  return (
    <div className="space-y-4">
      <PresetRail presets={FRAME_SHADOW_PRESETS} activeId={shadow} onSelect={(id) => setShadow(id as PosterShadow)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={size === "lg" ? "default" : "outline"} onClick={() => setSize("lg")} className="font-mono text-[11px] uppercase tracking-[0.14em]">
          Desktop · 8px border / 12px offset
        </Button>
        <Button size="sm" variant={size === "sm" ? "default" : "outline"} onClick={() => setSize("sm")} className="font-mono text-[11px] uppercase tracking-[0.14em]">
          Mobile · 4px border / 6px offset
        </Button>
        <Button size="sm" variant={noise ? "default" : "outline"} onClick={() => setNoise((v) => !v)} className="font-mono text-[11px] uppercase tracking-[0.14em]">
          Noise: {noise ? "ON" : "OFF"}
        </Button>
      </div>
      <div className="rounded-sm bg-[#FDFCF0] p-10">
        <HedgePosterFrame shadow={shadow} size={size} noise={noise}>
          <div className="p-6">
            <span className="-rotate-2 inline-block border-2 border-[#0E0E0E] bg-[#E11D48] px-3 py-1 font-poster text-xs uppercase tracking-wider text-white">
              Sample sticker
            </span>
            <div className="mt-3 font-poster text-3xl uppercase leading-none text-[#0E0E0E]">
              Poster <span className="text-[#1D4ED8]">frame</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-[#0E0E0E]/80">
              Reusable container for hero, rules, tiers, final CTA. Shadow color
              encodes section identity (red = urgency, blue = trust, yellow = reward).
            </p>
          </div>
        </HedgePosterFrame>
      </div>
    </div>
  );
};


const HERO_VIEWPORT_PRESETS: ReadonlyArray<{ id: string; label: string; width: number }> = [
  { id: "desktop", label: "Desktop · 1280px", width: 1280 },
  { id: "tablet", label: "Tablet · 900px", width: 900 },
  { id: "mobile", label: "Mobile · 390px", width: 390 },
];

const RetroHeroDemo = () => {
  const [viewportId, setViewportId] = useState("desktop");
  const preset = HERO_VIEWPORT_PRESETS.find((p) => p.id === viewportId)!;
  return (
    <div className="space-y-4">
      <PresetRail presets={HERO_VIEWPORT_PRESETS} activeId={viewportId} onSelect={setViewportId} />
      <div className="overflow-x-auto rounded-sm border border-border/40 bg-[#FDFCF0]">
        <div style={{ width: preset.width }} className="mx-auto">
          <HedgeHero />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Desktop &amp; tablet: 65% copy / 35% dotted graphic column, stats strip spans full width.
        Mobile (&lt; lg): graphic column hides; copy + CTA + stats stack vertically.
      </p>
    </div>
  );
};

const UPSETS_VIEWPORT_PRESETS: ReadonlyArray<{ id: string; label: string; width: number }> = [
  { id: "desktop", label: "Desktop · 1280px", width: 1280 },
  { id: "mobile", label: "Mobile · 390px", width: 390 },
];

const RetroUpsetsDemo = () => {
  const [viewportId, setViewportId] = useState("desktop");
  const preset = UPSETS_VIEWPORT_PRESETS.find((p) => p.id === viewportId)!;
  return (
    <div className="space-y-4">
      <PresetRail presets={UPSETS_VIEWPORT_PRESETS} activeId={viewportId} onSelect={setViewportId} />
      <div className="overflow-x-auto rounded-sm border border-border/40 bg-[#FDFCF0]">
        <div style={{ width: preset.width }} className="mx-auto">
          <HedgeUpsetsStrip />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Ticker = "what happened" (4 upset scores, auto-scroll). Ledger = "how bad"
        (4 different consequence stats). Data dimensions must NOT overlap. No card frame,
        no click target — this is editorial evidence, not an entry point.
      </p>
    </div>
  );
};


const RETRO_PALETTE: ReadonlyArray<{ name: string; hex: string; use: string; fg: "dark" | "light" }> = [
  { name: "Paper", hex: "#FDFCF0", use: "Page + frame background", fg: "dark" },
  { name: "Ink", hex: "#0E0E0E", use: "Borders, body type, scoreboards", fg: "light" },
  { name: "Sticker red", hex: "#E11D48", use: "Urgency, primary stickers, top-tier accent", fg: "light" },
  { name: "Field blue", hex: "#1D4ED8", use: "CTA fill, trust accents, headlines", fg: "light" },
  { name: "Flag yellow", hex: "#FACC15", use: "Highlights, step badges, secondary shadow", fg: "dark" },
];

const RetroTokensDemo = () => (
  <div className="space-y-6">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Palette · page-scoped, not in tailwind tokens</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        {RETRO_PALETTE.map((c) => (
          <div
            key={c.hex}
            className="flex flex-col gap-2 rounded-sm border border-border/50 p-3"
            style={{ background: c.hex, color: c.fg === "light" ? "#fff" : "#0E0E0E" }}
          >
            <span className="font-poster text-base uppercase tracking-tight">{c.name}</span>
            <span className="font-mono text-[10px] uppercase opacity-80">{c.hex}</span>
            <span className="text-[11px] leading-snug opacity-80">{c.use}</span>
          </div>
        ))}
      </div>
    </div>

    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Typography</p>
      <div className="mt-2 space-y-3 rounded-sm border border-border/50 bg-[#FDFCF0] p-5 text-[#0E0E0E]">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#0E0E0E]/60">Poster · Archivo Black</p>
          <p className="font-poster text-5xl uppercase leading-none">World Cup Chaos?</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#0E0E0E]/60">Body · Inter</p>
          <p className="text-base">Connect your wallet, open a hedge that moves opposite your pick.</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#0E0E0E]/60">Mono caps · JetBrains Mono</p>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em]">Spots left today · 213</p>
        </div>
      </div>
    </div>

    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Hard-shadow & border spec</p>
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border/50 text-left font-mono uppercase tracking-widest text-muted-foreground">
            <th className="py-2 pr-3">Surface</th>
            <th className="py-2 pr-3">Border</th>
            <th className="py-2 pr-3">Shadow offset</th>
            <th className="py-2">Shadow color rule</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          <tr className="border-b border-border/30">
            <td className="py-2 pr-3">Hero / FinalCTA (desktop)</td>
            <td className="py-2 pr-3">8px ink</td>
            <td className="py-2 pr-3">12px / 12px</td>
            <td className="py-2">red</td>
          </tr>
          <tr className="border-b border-border/30">
            <td className="py-2 pr-3">Outcome / Tier cards (desktop)</td>
            <td className="py-2 pr-3">8px ink</td>
            <td className="py-2 pr-3">12px / 12px</td>
            <td className="py-2">blue or yellow (alternate)</td>
          </tr>
          <tr>
            <td className="py-2 pr-3">All frames (mobile)</td>
            <td className="py-2 pr-3">4px ink</td>
            <td className="py-2 pr-3">6px / 6px</td>
            <td className="py-2">same as desktop counterpart</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);



export const CampaignPlayground = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h2 className="text-xl font-semibold text-foreground">Interactive Playground</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live demos of campaign-level reusable components. Each card shows real component behavior with switchable mock data — wire your campaign's data shape into the same props.
        </p>
      </div>

      <Tabs defaultValue="data">
        <TabsList className="mb-4 bg-muted/40">
          <TabsTrigger value="data" className="font-mono text-[11px] uppercase tracking-[0.14em]">Data-driven</TabsTrigger>
          <TabsTrigger value="layout" className="font-mono text-[11px] uppercase tracking-[0.14em]">Layout primitives</TabsTrigger>
          <TabsTrigger value="retro" className="font-mono text-[11px] uppercase tracking-[0.14em]">Retro Poster · WC H2E</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-0 space-y-6">
          <PlaygroundCard
            id="countdown"
            title="Countdown"
            description="Live countdown to a target date. Auto-handles days / hours / minutes / seconds and ended state."
            whenToUse="Campaign deadline, claim window, settlement window. Anywhere a user needs to see urgency."
            whenNotTo="Static dates that don't tick. Use a plain formatted date string instead."
            propsHint={`<Countdown
  endsAt={new Date("2026-05-28T02:00:00Z")}
  compact // optional
/>`}
          >
            <CountdownDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="ladder"
            title="Reward Ladder"
            description="Tier table with progress fill. Highlights current tier, marks reached tiers, calls out top tier."
            whenToUse="Volume rebate, points tier, rank-based reward, anything where user climbs through tiers."
            whenNotTo="Single flat reward (no tiers). Use RewardSnapshot instead."
            propsHint={`<RewardLadder
  onCta={(section) => navigate("/trade")}
  progressOverride={{ // optional, falls back to useMainnetLaunchProgress
    user: currentUser,
    volume: 120_000,
    currentTier: { volume: 100_000, rebate: 20 },
  }}
/>`}
          >
            <RewardLadderDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="dashboard"
            title="Progress Dashboard"
            description="Hero progress block with total volume, qualification badge, fill bar, and 4-cell metric grid."
            whenToUse="Authenticated, qualified users. Shows them where they stand and what's next."
            whenNotTo="Guests or unqualified users — component returns null by design. Show a different empty/CTA state instead."
            propsHint={`<ProgressDashboard
  onCta={(section) => navigate("/trade")}
  progressOverride={{ /* full progress shape, or omit to use live hook */ }}
/>`}
          >
            <ProgressDashboardDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="floating"
            title="Mobile Floating CTA"
            description="Pinned bottom CTA that appears once a target element scrolls out of view."
            whenToUse="Mobile-only conversion campaigns. Re-surfaces the primary CTA after the hero scrolls away."
            whenNotTo="Desktop pages, or pages with multiple competing CTAs. Only one floating CTA per page."
            propsHint={`const heroRef = useRef<HTMLDivElement>(null);
<MobileFloatingCTA triggerRef={heroRef} onCta={handleCta} />`}
          >
            <FloatingCTADemo />
          </PlaygroundCard>
        </TabsContent>

        <TabsContent value="layout" className="mt-0 space-y-6">
          <PlaygroundCard
            id="shell"
            title="Section Shell + Title"
            description="Standard campaign section: padding, max-width, eyebrow → title → description vertical block."
            whenToUse="Every campaign section. Enforces consistent padding and the vertical title rule from CAMPAIGN_DESIGN §4."
            whenNotTo="Hero blocks (use a campaign-specific hero composition) and full-bleed visual sections."
            propsHint={`<SectionShell id="rules">
  <SectionTitle eyebrow="Eyebrow" title="Section title" desc="Description" />
  {/* your content */}
</SectionShell>`}
          >
            <ShellDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="trust"
            title="Trust / Proof Bar"
            description="4-up icon grid for proof points. Uses bordered cells, mono labels, single accent color icons."
            whenToUse="Right after the hero — quick credibility before deeper sections."
            whenNotTo="As decoration. Each item must be a verifiable factual claim."
            propsHint={`// Items are currently inline — copy the component pattern\n// for a different campaign's proof points.`}
          >
            <TrustBarDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="snapshot"
            title="Reward Snapshot"
            description="Two side-by-side reward cards with eyebrow, action, arrow, reward amount and detail."
            whenToUse="Two clear reward paths (e.g. guaranteed bonus + variable rebate). Sets expectations near the top."
            whenNotTo="Single-reward campaigns or 4+ reward types. Use RewardLadder or a custom layout."
            propsHint={`// Currently uses a hardcoded cards array.\n// Lift to props when reused in a second campaign.`}
          >
            <SnapshotDemo />
          </PlaygroundCard>
        </TabsContent>

        <TabsContent value="retro" className="mt-0 space-y-6">
          <PlaygroundCard
            id="retro-hero"
            title="Hero Layout · Asymmetric Split Poster"
            description="65% copy / 35% dotted graphic column inside the poster frame, with a full-width stats strip pinned to the bottom. Switch viewport presets to see how the right column collapses on mobile."
            whenToUse="Any cultural-moment hero that needs a single decisive composition — headline + sticker + subhead + CTA + supporting graphic + stats."
            whenNotTo="Pure text heroes or full-bleed photo heroes. Don't fork the split ratio per campaign — keep 65/35 to preserve rhythm."
            propsHint={`<HedgeHero /> // copy + stats are inline constants; swap LIVE_STATS to update.`}
          >
            <RetroHeroDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="retro-tokens"
            title="Retro Poster · Tokens"
            description="Page-scoped palette, typography, and hard-shadow specs for the World Cup Hedge-to-Earn landing. These tokens are intentionally NOT in tailwind/index.css — they only live on /hedge and its playground."
            whenToUse="World Cup or any cultural-moment campaign that needs to escape the dark-app default."
            whenNotTo="Anywhere else. Do not bleed paper/red/blue tokens into the product shell."
          >
            <RetroTokensDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="retro-frame"
            title="Poster Frame"
            description="Reusable container: ink border + offset hard shadow + optional paper noise. Shadow color encodes section identity (red = urgency, blue = trust, yellow = reward)."
            whenToUse="Hero, outcome cards, eligibility panel, reward tiers, final CTA, footer disclaimer."
            whenNotTo="Don't nest frames more than one level deep. Don't combine with shadcn `Card` — replace it."
            propsHint={`<HedgePosterFrame shadow="red" size="lg" noise>
  {/* content */}
</HedgePosterFrame>`}
          >
            <RetroFrameDemo />
          </PlaygroundCard>

          <PlaygroundCard
            id="retro-cta"
            title="Hedge CTA Button"
            description="5 states wired through `stateOverride` in playground; production derives from auth + Polymarket account. Hard-shadow flattens on press."
            whenToUse="Every primary CTA on /hedge. Floating mobile CTA reuses it with fullWidth."
            whenNotTo="Anywhere outside the World Cup campaign — palette is page-scoped."
            propsHint={`<HedgeCTAButton size="lg" />
// playground only:
<HedgeCTAButton stateOverride="loading" />`}
          >
            <RetroCTADemo />
          </PlaygroundCard>


          <PlaygroundCard
            id="retro-upsets"
            title="Upsets Infographic · Ticker + Ledger"
            description="Two-layer narrative evidence strip. Ticker shows the upset scores (what happened); ledger shows separate consequence stats (how bad). Same data must never appear in both layers."
            whenToUse="Right after the hero on cultural-moment campaigns where users need a visceral 'why hedge' argument before the funnel."
            whenNotTo="As a market list or entry point. No `HedgePosterFrame`, no `onClick`, no link — if it's tappable, it's the wrong component."
            propsHint={`<HedgeUpsetsStrip /> // UPSETS_TICKER + LEDGER_STATS are inline constants — pending business verification.`}
          >
            <RetroUpsetsDemo />
          </PlaygroundCard>
        </TabsContent>

      </Tabs>
    </div>
  );
};
