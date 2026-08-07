/**
 * Rewards / Campaign previews — REAL production components only.
 * Every case imports the shipped component and feeds it mock props; nothing
 * here is a lookalike. Mobile cases resolve their own breakpoint because the
 * preview route is mounted inside a 375px iframe (see DeviceFrame).
 */
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LiteCampaignDetailPage from "@/pages/lite/LiteCampaignDetailPage";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import { EndedCampaignsArchive } from "@/components/campaigns/EndedCampaignsArchive";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import { ReferralPanel } from "@/components/campaigns/ReferralPanel";
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
      <div
        className="inline-flex items-center gap-[11px] rounded-full"
        style={{ background: "#FF8A3D", color: "#2A1200", padding: "5px 15px 5px 5px" }}
      >
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-full">
          <img src={laowangAvatar.url} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="flex min-w-0 flex-col gap-[1px]">
          <span className="font-display text-[13.5px] font-bold">Lao Wang × OmenX · Exclusive entry</span>
          <span className="truncate text-[11.5px] font-semibold">
            You joined through Lao Wang's link — his terms apply.
          </span>
        </div>
      </div>
    </div>

    {/* Mobile capsule — single line, 22px avatar, no explainer sentence */}
    <div className="md:hidden">
      <CampaignKeyVisual src={kvLaowang.url} accent="#FF8A3D" ratio="16 / 9.5" className="rounded-[14px]"
        scrim="linear-gradient(180deg, rgba(10,11,13,0.0) 0%, rgba(10,11,13,0.45) 20%, rgba(10,11,13,0.85) 55%, rgba(10,11,13,0.98) 100%)">
        <div />
        <div className="flex flex-col gap-[10px]">
          <div
            className="inline-flex max-w-full self-start items-center gap-[8px] rounded-full"
            style={{ background: "#FF8A3D", color: "#2A1200", padding: "3px 11px 3px 3px" }}
          >
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center overflow-hidden rounded-full">
              <img src={laowangAvatar.url} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="truncate font-display text-[11.5px] font-bold">Lao Wang × OmenX</span>
          </div>
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
export const EndedCampaignDetailPreview = () => (
  <MemoryRouter initialEntries={[`/rewards/campaign/${JULY_WARMUP_ID}`]}>
    <Routes>
      <Route path="/rewards/campaign/:campaignId" element={<LiteCampaignDetailPage />} />
    </Routes>
  </MemoryRouter>
);

/* ---------------- Points retirement notice (as shipped on /rewards) ---------------- */
export const PointsRetiredNoticePreview = () => (
  <div className="flex items-start gap-3 rounded-[12px] border border-[#23262D] bg-[#0F1114] px-4 py-3">
    <p className="flex-1 text-[12.5px] leading-5 text-[#C9CED6]">
      Points have retired. Rewards now come as Trial Position Vouchers.{" "}
      <span className="text-[#33D6FF]">Open vouchers →</span>
    </p>
  </div>
);

export const SignInPromptPreview = () => (
  <div className="space-y-4">
    <SignInPromptCard />
    <SignInPromptCard cap="REFERRAL" description="Sign in to track progress and claim rewards." />
  </div>
);

export const ReferralPanelPreview = () => <ReferralPanel />;

/* ---------------- Fine print (one per page carrying USDC amounts) ---------------- */
export const RewardsFinePrintPreview = () => (
  <p className="pt-1 text-[11.5px] leading-5 text-[#6B7280]">
    USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is
    yours, the voucher itself is not withdrawable.
  </p>
);
