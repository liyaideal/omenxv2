/**
 * Rewards / Campaign previews — REAL production components only.
 * Every case imports the shipped component and feeds it mock props; nothing
 * here is a lookalike. Mobile cases resolve their own breakpoint because the
 * preview route is mounted inside a 375px iframe (see DeviceFrame).
 */
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import { EndedCampaignsArchive } from "@/components/campaigns/EndedCampaignsArchive";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import { ReferralPanel } from "@/components/campaigns/ReferralPanel";
import { KolBandDesktop, KolBandMobile } from "@/components/campaigns/KolBand";
import { PointsRetiredNoticeCard } from "@/components/campaigns/PointsRetiredNotice";
import { RewardsFinePrint } from "@/components/campaigns/RewardsFinePrint";
import { IneligibleEntryToastBody } from "@/components/campaigns/IneligibleEntryToast";
import type { Campaign, CampaignEntry, CampaignTaskDef, CampaignView } from "@/hooks/useCampaigns";
import kvWorldCup from "@/assets/campaigns/kv-worldcup.jpg.asset.json";
import kvLaowang from "@/assets/campaigns/kv-laowang.jpg.asset.json";
import kvStarter from "@/assets/campaigns/kv-starter.jpg.asset.json";
import laowangAvatar from "@/assets/campaigns/laowang-avatar.jpg.asset.json";

const day = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();

const TASKS: CampaignTaskDef[] = [
  {
    task_key: "trade_volume_macro",
    name: "Trade $500 on Macro markets",
    subtitle: "Any Macro market counts.",
    target: 500,
    metric: "usd_volume",
    reward: { voucher: 10 },
    scope: { categories: ["macro"] },
  },
  {
    task_key: "join_discord",
    name: "Join the Discord",
    reward: { usdc: 2 },
  },
];

const makeEntry = (over: Partial<CampaignEntry> = {}): CampaignEntry => ({
  id: "entry-public",
  campaignId: "camp-1",
  kind: "public",
  channelId: null,
  linkCode: null,
  tasks: TASKS,
  reward: { voucher: 10, usdc: 2 },
  branding: { key_visual_url: kvWorldCup.url, accent: "#F2F3F5" },
  seedBase: 12840,
  cap: null,
  ...over,
});

const makeView = (over: Partial<CampaignView> = {}, campaign: Partial<Campaign> = {}): CampaignView => {
  const entry = over.entry ?? makeEntry();
  return {
    campaign: {
      id: "camp-1",
      name: "World Cup — Group stage run",
      startsAt: iso(-6),
      endsAt: iso(9),
      status: "live",
      entries: [entry],
      ...campaign,
    },
    entry,
    participation: null,
    phase: "live",
    tasksTotal: 2,
    tasksDone: 1,
    claimableCount: 1,
    rewardVoucherUpTo: 10,
    rewardUsdcUpTo: 2,
    voucherClaimed: 10,
    usdcClaimed: 0,
    joined: 12840,
    daysLeft: 9,
    accent: "#F2F3F5",
    grants: [],
    ...over,
  };
};

const LIVE_PUBLIC = makeView();

const KOL_SPECIAL = makeView(
  {
    entry: makeEntry({
      id: "entry-kol",
      kind: "special",
      linkCode: "LAOWANG",
      branding: {
        display_name: "Lao Wang",
        avatar_url: laowangAvatar.url,
        key_visual_url: kvLaowang.url,
        accent: "#FF8A3D",
      },
    }),
    accent: "#FF8A3D",
    joined: 3120,
    voucherClaimed: 0,
    tasksDone: 0,
    claimableCount: 0,
  },
  { id: "camp-2", name: "Lao Wang × OmenX — Rookie run" },
);

const EVERGREEN = makeView(
  {
    entry: makeEntry({
      id: "entry-starter",
      branding: { key_visual_url: kvStarter.url, accent: "#CFFF4A" },
    }),
    phase: "always-on",
    accent: "#CFFF4A",
    daysLeft: null,
    joined: 48210,
    tasksDone: 2,
    claimableCount: 0,
    voucherClaimed: 15,
  },
  { id: "camp-3", name: "Starter Rewards", endsAt: null },
);

const UPCOMING = makeView(
  {
    entry: makeEntry({
      id: "entry-cpi",
      branding: { key_visual_url: null, accent: "#33D6FF" },
    }),
    phase: "upcoming",
    accent: "#33D6FF",
    daysLeft: null,
    joined: 0,
    tasksDone: 0,
    claimableCount: 0,
    voucherClaimed: 0,
    usdcClaimed: 0,
  },
  { id: "camp-4", name: "CPI print — August", startsAt: iso(5), endsAt: iso(20) },
);

const NO_ART = makeView(
  {
    entry: makeEntry({ id: "entry-noart", branding: { key_visual_url: null, accent: "#33D6FF" } }),
    accent: "#33D6FF",
  },
  { id: "camp-5", name: "Fallback — no key visual" },
);

/** Seeded ended campaigns (July Warm-up / Finals Week) — real ids so rows link somewhere real. */
const JULY_WARMUP_ID = "a1111111-1111-4111-8111-aaaaaaaaaaa1";
const FINALS_WEEK_ID = "a2222222-2222-4222-8222-aaaaaaaaaaa2";

const ENDED = [
  makeView(
    {
      phase: "ended",
      daysLeft: null,
      voucherClaimed: 18,
      usdcClaimed: 0,
      tasksDone: 3,
      tasksTotal: 4,
    },
    { id: JULY_WARMUP_ID, name: "July Warm-up", startsAt: iso(-40), endsAt: iso(-8) },
  ),
  makeView(
    {
      entry: makeEntry({ id: "entry-e2", branding: { key_visual_url: null, accent: "#CFFF4A" } }),
      phase: "ended",
      daysLeft: null,
      voucherClaimed: 16,
      usdcClaimed: 0,
      tasksDone: 3,
      tasksTotal: 3,
      accent: "#CFFF4A",
    },
    { id: FINALS_WEEK_ID, name: "Finals Week", startsAt: iso(-90), endsAt: iso(-55) },
  ),
];

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 md:grid-cols-2">{children}</div>
);

/* ---------------- Campaign cards ---------------- */
export const CampaignCardStatesPreview = () => (
  <Grid>
    <CampaignCard view={LIVE_PUBLIC} />
    <CampaignCard view={KOL_SPECIAL} />
    <CampaignCard view={EVERGREEN} />
    <CampaignCard view={UPCOMING} />
    <CampaignCard view={NO_ART} />
    <CampaignCard view={LIVE_PUBLIC} signedOut />
  </Grid>
);

/* ---------------- Grant task rows ---------------- */
const ROW_TASK = TASKS[0];
const USDC_TASK: CampaignTaskDef = {
  task_key: "referral_qualified",
  name: "Invite a friend who trades",
  reward: { usdc: 5 },
};

export const GrantTaskRowStatesPreview = () => (
  <div className="space-y-2.5">
    <GrantTaskRow task={ROW_TASK} status="not_started" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="in_progress" progressValue={180} onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="claimable" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="claimed" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="not_eligible" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="not_started" signedOut onClaim={() => {}} />
    <GrantTaskRow task={USDC_TASK} status="claimable" onClaim={() => {}} />
  </div>
);

/* ---------------- KOL brand band (desktop + mobile hero, as shipped) ---------------- */
export const KolBandPreview = () => (
  <div className="space-y-4">
    {/* Desktop band — lives inside the hero scrim on /rewards/campaign/:id */}
    <div className="hidden md:block">
      <KolBandDesktop kolName="Lao Wang" avatar={laowangAvatar.url} />
    </div>

    {/* Mobile capsule — single line, 22px avatar, no explainer sentence */}
    <div className="md:hidden">
      <CampaignKeyVisual src={kvLaowang.url} accent="#FF8A3D" ratio="16 / 9.5" className="rounded-[14px]"
        scrim="linear-gradient(180deg, rgba(10,11,13,0.0) 0%, rgba(10,11,13,0.45) 20%, rgba(10,11,13,0.85) 55%, rgba(10,11,13,0.98) 100%)">
        <div />
        <div className="flex flex-col gap-[10px]">
          <KolBandMobile kolName="Lao Wang" avatar={laowangAvatar.url} />
          <h1 className="font-display text-[22px] font-bold leading-[28px] text-[#F2F3F5]">
            Lao Wang × OmenX — Rookie run
          </h1>
        </div>
      </CampaignKeyVisual>
    </div>
  </div>
);

/* ---------------- Ended archive ---------------- */
export const EndedArchivePreview = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <p className="text-[11px] text-[#6B7280]">Collapsed</p>
      <EndedCampaignsArchive views={ENDED} />
    </div>
    <div className="space-y-2">
      <p className="text-[11px] text-[#6B7280]">Expanded — rows differ desktop vs mobile</p>
      <EndedCampaignsArchive views={ENDED} defaultOpen />
    </div>
  </div>
);

/* ---------------- Ended campaign detail — frozen settled view ---------------- */
/** Nested iframe: the production route itself, so the frozen settled view is the real page. */
export const EndedCampaignDetailPreview = () => (
  <iframe
    title="ended-campaign-detail"
    src={`/rewards/campaign/${JULY_WARMUP_ID}`}
    className="h-[860px] w-full rounded-[12px] border border-[#1D2026] bg-background"
  />
);

/* ---------------- Points retirement notice (as shipped on /rewards) ---------------- */
export const PointsRetiredNoticePreview = () => (
  <PointsRetiredNoticeCard onOpenVouchers={() => {}} onDismiss={() => {}} />
);

export const SignInPromptPreview = () => (
  <div className="space-y-4">
    <SignInPromptCard />
    <SignInPromptCard cap="REFERRAL" description="Sign in to track progress and claim rewards." />
  </div>
);

export const ReferralPanelPreview = () => <ReferralPanel />;

/* ---------------- Exclusive link — ineligible redirect (live toast body) ---------------- */
export const CampaignIneligibleRedirectPreview = () => (
  <div className="relative min-h-[200px] bg-transparent">
    <div className="w-full md:absolute md:top-4 md:left-1/2 md:w-auto md:max-w-[420px] md:-translate-x-1/2">
      <IneligibleEntryToastBody />
    </div>
    <p className="absolute bottom-0 left-0 right-0 text-center text-[11px] leading-4 text-muted-foreground">
      Triggered on <code className="text-[11px] text-foreground">?entry=LAOWANG</code> when binding is refused · redirects to{" "}
      <code className="text-[11px] text-foreground">/</code>
    </p>
  </div>
);

/* ---------------- Fine print (one per page carrying USDC amounts) ---------------- */
export const RewardsFinePrintPreview = () => <RewardsFinePrint />;

/* ---------------- Task row · state playground (rail lives inside the frame) ----------------
 * Mounted through DualDevicePreview so the Mobile · 375 tab is a real iframe
 * viewport — GrantTaskRow branches on useIsMobile (<768px), which a narrow
 * container in the parent viewport can never trigger. */
type RowPresetId =
  | "not_started"
  | "in_progress"
  | "claimable"
  | "claimed"
  | "not_eligible"
  | "signed_out"
  | "usdc_review";

const ROW_PRESETS: {
  id: RowPresetId;
  label: string;
  status: GrantStatus;
  progressValue?: number;
  signedOut?: boolean;
  task?: CampaignTaskDef;
}[] = [
  { id: "not_started", label: "Not started", status: "not_started" },
  { id: "in_progress", label: "In progress", status: "in_progress", progressValue: 180 },
  { id: "claimable", label: "Claimable", status: "claimable" },
  { id: "claimed", label: "Claimed", status: "claimed" },
  { id: "not_eligible", label: "Not eligible", status: "not_eligible" },
  { id: "signed_out", label: "Signed out", status: "not_started", signedOut: true },
  { id: "usdc_review", label: "USDC · under review", status: "claimable", task: USDC_TASK },
];

export const GrantTaskRowPlaygroundPreview = () => {
  const [active, setActive] = useState<RowPresetId>("in_progress");
  const preset = ROW_PRESETS.find((p) => p.id === active)!;
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ROW_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
              (active === p.id
                ? "border-transparent bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-[#0A0B0D] p-4">
        <GrantTaskRow
          task={preset.task ?? ROW_TASK}
          status={preset.status}
          progressValue={preset.progressValue}
          signedOut={preset.signedOut}
          onClaim={() => {}}
        />
      </div>
    </div>
  );
};

export const GrantTaskRowBoardPreview = () => (
  <div className="space-y-2.5 rounded-2xl bg-[#0A0B0D] p-4">
    {ROW_PRESETS.map((p) => (
      <GrantTaskRow
        key={p.id}
        task={p.task ?? ROW_TASK}
        status={p.status}
        progressValue={p.progressValue}
        signedOut={p.signedOut}
        onClaim={() => {}}
      />
    ))}
  </div>
);
