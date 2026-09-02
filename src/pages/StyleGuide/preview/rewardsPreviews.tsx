/**
 * Rewards / Campaign previews — REAL production components only.
 * Every case imports the shipped component and feeds it mock props; nothing
 * here is a lookalike. Mobile cases resolve their own breakpoint because the
 * preview route is mounted inside a 375px iframe (see DeviceFrame).
 */
import { useState } from "react";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import { EndedCampaignsArchive } from "@/components/campaigns/EndedCampaignsArchive";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import { ReferralPanel } from "@/components/campaigns/ReferralPanel";
import { KolBandDesktop, KolBandMobile } from "@/components/campaigns/KolBand";
import { PointsRetiredNoticeCard } from "@/components/campaigns/PointsRetiredNotice";
import { RewardsFinePrint } from "@/components/campaigns/RewardsFinePrint";
import { CampaignRulesDisclosure } from "@/components/campaigns/CampaignRulesDisclosure";
import { IneligibleEntryToastBody } from "@/components/campaigns/IneligibleEntryToast";
import { CampaignGridSkeleton } from "@/components/campaigns/CampaignGridSkeleton";
import { CampaignDetailSkeleton } from "@/components/campaigns/CampaignDetailSkeleton";
import { CampaignUnavailable } from "@/components/campaigns/CampaignUnavailable";
import { CampaignRewardsCard } from "@/components/campaigns/CampaignRewardsCard";
import { ClaimSuccessToastBody } from "@/components/campaigns/ClaimSuccessToastBody";
import { formatDateRange } from "@/hooks/useCampaigns";
import type { Referral } from "@/hooks/useReferral";
import { MobileHeader } from "@/components/MobileHeader";
import { Tabs } from "@/pages/lite/LiteRewardsPage";
import type { Campaign, CampaignEntry, CampaignTaskDef, CampaignView, GrantStatus } from "@/hooks/useCampaigns";
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

const ENDED_CARD = makeView(
  {
    entry: makeEntry({ id: "entry-ended-card", branding: { key_visual_url: kvStarter.url, accent: "#C9CED6" } }),
    phase: "ended",
    daysLeft: null,
    tasksDone: 3,
    tasksTotal: 3,
    claimableCount: 0,
    voucherClaimed: 18,
    accent: "#C9CED6",
  },
  { id: "camp-6", name: "July Warm-up", startsAt: iso(-40), endsAt: iso(-8) },
);

const TWO_CLAIMABLE = makeView(
  { claimableCount: 2, tasksDone: 2, tasksTotal: 3, voucherClaimed: 0 },
  { id: "camp-7", name: "Two rewards waiting" },
);

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
    <CampaignCard view={ENDED_CARD} />
    <CampaignCard view={NO_ART} />
    <CampaignCard view={TWO_CLAIMABLE} />
    <CampaignCard view={LIVE_PUBLIC} signedOut />
  </Grid>
);

/* ---------------- RW-1 · Tabs 三分页（production Tabs, pure export） ---------------- */
export const RewardsTabsPreview = () => (
  <div className="space-y-5 p-4">
    {(["campaigns", "vouchers", "referral"] as const).map((t) => (
      <div key={t} className="space-y-1.5">
        <p className="text-[11px] text-[#6B7280]">tab === "{t}"</p>
        <Tabs value={t} onChange={() => {}} />
      </div>
    ))}
    <div className="space-y-1.5">
      <p className="text-[11px] text-[#6B7280]">sticky（移动 · top-[var(--mobile-header-h)]）</p>
      <Tabs value="campaigns" sticky onChange={() => {}} />
    </div>
  </div>
);

/* ---------------- RW-2 · 移动 redeem 全屏壳（mobile only） ---------------- */
export const RewardsRedeemShellPreview = () => (
  <div className="min-h-[220px] bg-background">
    <MobileHeader title="Redeem voucher" showBack showLogo={false} backTo="/rewards?tab=vouchers" />
    <div className="px-4 py-4 text-[11.5px] leading-5 text-[#6B7280]">
      载壳态：无 tabs 条、无 BottomNav，MobileHeader 的 ‹ 是唯一出口。
      券内体与兑换流程属于 Vouchers 字典（M4），本 case 只锁壳。
    </div>
  </div>
);

/* ---------------- RW-5 · Campaigns 网格 loading 骨架 ---------------- */
export const CampaignGridLoadingPreview = () => (
  <div className="space-y-5 p-4">
    <Tabs value="campaigns" onChange={() => {}} />
    <CampaignGridSkeleton />
  </div>
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
/**
 * RW-3 — position fork is CSS-only (order utilities), never useIsMobile:
 * desktop renders the notice ABOVE the grid, mobile BELOW the cards.
 */
export const PointsRetiredNoticePreview = () => (
  <div className="flex flex-col gap-4 p-4">
    <div className="order-2 md:order-1">
      <PointsRetiredNoticeCard onOpenVouchers={() => {}} onDismiss={() => {}} />
    </div>
    <div className="order-1 grid gap-4 md:order-2 md:grid-cols-2">
      <CampaignCard view={LIVE_PUBLIC} />
      <CampaignCard view={EVERGREEN} />
    </div>
  </div>
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

const RULE_PARAGRAPHS = [
  "This campaign runs from Aug 1 to Aug 31. Only markets listed under the campaign scope count toward task progress; trades placed outside the window or outside the scope are ignored.",
  "A Trial Position Voucher opens one trial position. The profit is yours; the voucher itself stays with OmenX and is never withdrawable.",
  "One account per person. Accounts sharing a device, payment route or coordinated trading pattern may be removed from the campaign and have unclaimed rewards voided.",
];

export const CampaignRulesDisclosurePreview = () => (
  <div className="space-y-3 p-3">
    <CampaignRulesDisclosure paragraphs={RULE_PARAGRAPHS.slice(0, 1)} />
    <CampaignRulesDisclosure paragraphs={RULE_PARAGRAPHS} heading="Campaign rules" />
    <p className="text-[11px] text-[#6B7280]">Tap a bar to expand — collapsed is the default state on both surfaces.</p>
  </div>
);

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

/* ================= M3b · Ⓒ 详情 / Ⓓ Referral / Ⓔ 合规 ================= */

/* ---------------- RW-7 · Hero（CampaignKeyVisual + KolBand） ----------------
 * 详情页 hero 仍是 LiteCampaignDetailPage 内联组合（M3a-① 未提取），这里按生产
 * 同一组合挂真组件：CampaignKeyVisual + KolBandDesktop/Mobile + 同一批 pill。
 * 两端 ratio / scrim / 字号不同 → Desktop / Mobile 双导出，禁运行时 useIsMobile。 */

const HERO_SCRIM_MOBILE =
  "linear-gradient(180deg, rgba(10,11,13,0.0) 0%, rgba(10,11,13,0.45) 20%, rgba(10,11,13,0.85) 55%, rgba(10,11,13,0.98) 100%)";
const HERO_SCRIM_DESKTOP =
  "linear-gradient(180deg,rgba(10,11,13,0) 0%,rgba(10,11,13,.72) 46%,rgba(10,11,13,.94) 100%)";

const EndedPill = () => (
  <span
    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
    style={{ background: "#242830", color: "#C9CED6" }}
  >
    Ended
  </span>
);

const RewardPills = ({ voucher, usdc, desktop }: { voucher: number; usdc: number; desktop?: boolean }) => (
  <>
    {voucher > 0 && (
      <span
        className={`shrink-0 whitespace-nowrap rounded-full font-display font-bold ${desktop ? "text-[12.5px]" : "text-[12px]"}`}
        style={{
          background: "#131519",
          border: "1px solid #1D2026",
          color: "#CFFF4A",
          padding: desktop ? "7px 13px" : "6px 12px",
        }}
      >
        ${voucher} Trial Position Voucher
      </span>
    )}
    {usdc > 0 && (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-display font-bold ${desktop ? "text-[12.5px]" : "text-[12px]"}`}
        style={{
          background: "#131519",
          border: "1px solid #1D2026",
          color: "#33D6FF",
          padding: desktop ? "7px 13px" : "6px 12px",
        }}
      >
        ${usdc} USDC
      </span>
    )}
  </>
);

const HeroDesktop = ({ view, special, frozen }: { view: CampaignView; special?: boolean; frozen?: boolean }) => (
  <CampaignKeyVisual
    src={view.entry.branding.key_visual_url}
    accent={view.accent}
    ratio="1232 / 300"
    className="rounded-[14px]"
    scrim={HERO_SCRIM_DESKTOP}
    scrimHeight="190px"
  >
    <div />
    <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-[12px]">
      {special && <KolBandDesktop kolName="Lao Wang" avatar={laowangAvatar.url} />}
      <h1 className="font-display text-[36px] font-bold leading-tight text-[#F2F3F5]">{view.campaign.name}</h1>
      <div className="font-display text-[12.5px] tabular-nums text-[#C9CED6]">
        {view.phase === "always-on" ? "Always valid" : formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
        {view.daysLeft !== null && ` · ${view.daysLeft} days left`} ·{" "}
        {view.joined.toLocaleString()} joined{frozen && " · Ended"}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RewardPills voucher={view.rewardVoucherUpTo} usdc={view.rewardUsdcUpTo} desktop />
        {frozen && <EndedPill />}
      </div>
    </div>
  </CampaignKeyVisual>
);

const HeroMobile = ({ view, special, frozen }: { view: CampaignView; special?: boolean; frozen?: boolean }) => (
  <CampaignKeyVisual
    src={view.entry.branding.key_visual_url}
    accent={view.accent}
    ratio="16 / 9.5"
    className="rounded-[14px]"
    scrim={HERO_SCRIM_MOBILE}
  >
    <div />
    <div className="flex flex-col gap-[10px]">
      {special && <KolBandMobile kolName="Lao Wang" avatar={laowangAvatar.url} />}
      <h1 className="font-display text-[22px] font-bold leading-[28px] text-[#F2F3F5]">{view.campaign.name}</h1>
      <div className="font-display text-[12px] leading-[16px] tabular-nums text-[#9AA1AC]">
        {view.phase === "always-on" ? "Always valid" : formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
        {view.daysLeft !== null && ` · ${view.daysLeft}d left`} · {view.joined.toLocaleString()} joined
        {frozen && " · Ended"}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RewardPills voucher={view.rewardVoucherUpTo} usdc={view.rewardUsdcUpTo} />
        {frozen && <EndedPill />}
      </div>
    </div>
  </CampaignKeyVisual>
);

const FROZEN_HERO = makeView(
  { phase: "ended", daysLeft: null, tasksDone: 3, tasksTotal: 3, claimableCount: 0, voucherClaimed: 18 },
  { id: "camp-frozen", name: "July Warm-up", startsAt: iso(-40), endsAt: iso(-8) },
);

export const CampaignHeroDesktopPreview = () => (
  <div className="space-y-4 p-3">
    <HeroDesktop view={LIVE_PUBLIC} />
    <HeroDesktop view={KOL_SPECIAL} special />
    <HeroDesktop view={FROZEN_HERO} frozen />
  </div>
);

export const CampaignHeroMobilePreview = () => (
  <div className="space-y-4 p-3">
    <HeroMobile view={LIVE_PUBLIC} />
    <HeroMobile view={KOL_SPECIAL} special />
    <HeroMobile view={FROZEN_HERO} frozen />
  </div>
);

/* ---------------- RW-8 · GrantTaskRow 九分支（全量板） ---------------- */
const CONNECT_TASK: CampaignTaskDef = {
  task_key: "connect_polymarket",
  name: "Connect a Polymarket wallet",
  reward: { voucher: 5 },
};

export const GrantTaskRowNineStatesPreview = () => (
  <div className="space-y-2.5 rounded-2xl bg-[#0A0B0D] p-4">
    <GrantTaskRow task={ROW_TASK} status="not_started" signedOut onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="not_started" onClaim={() => {}} />
    <GrantTaskRow task={CONNECT_TASK} status="not_started" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="in_progress" progressValue={180} onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="claimable" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="claimable" isClaiming onClaim={() => {}} />
    <GrantTaskRow task={USDC_TASK} status="claimable" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="claimed" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="not_eligible" onClaim={() => {}} />
    <GrantTaskRow task={ROW_TASK} status="claimable" frozen onClaim={() => {}} />
  </div>
);

/* ---------------- RW-9 · CampaignRulesDisclosure（受控展开） ---------------- */
export const CampaignRulesStatesPreview = () => (
  <div className="space-y-3 p-3">
    <p className="text-[11px] text-[#6B7280]">收起（默认）</p>
    <CampaignRulesDisclosure paragraphs={RULE_PARAGRAPHS} />
    <p className="text-[11px] text-[#6B7280]">展开（点条头即为此态）</p>
    <CampaignRulesDisclosure paragraphs={RULE_PARAGRAPHS} defaultOpen />
    <p className="text-[11px] text-[#6B7280]">rules.details 无内容 → 整块不渲染（下方为空）</p>
    <CampaignRulesDisclosure paragraphs={[]} />
  </div>
);

/* ---------------- RW-10 · Your rewards here（CampaignRewardsCard 真件） ---------------- */
const CARD_BOTH = makeView({ voucherClaimed: 10, usdcClaimed: 2 });
const CARD_VOUCHER_ONLY = makeView(
  { entry: makeEntry({ id: "entry-v" }), rewardUsdcUpTo: 0, usdcClaimed: 0, voucherClaimed: 10 },
  { id: "camp-v", name: "Voucher-only campaign" },
);
const CARD_USDC_ONLY = makeView(
  { entry: makeEntry({ id: "entry-u" }), rewardVoucherUpTo: 0, voucherClaimed: 0, rewardUsdcUpTo: 8, usdcClaimed: 3 },
  { id: "camp-u", name: "USDC-only campaign" },
);
const CARD_FROZEN = makeView(
  { phase: "ended", voucherClaimed: 18, usdcClaimed: 2, daysLeft: null },
  { id: "camp-fz", name: "July Warm-up" },
);

const RewardsCardSet = ({ isMobile }: { isMobile: boolean }) => (
  <div className={isMobile ? "space-y-4 p-3" : "grid gap-4 p-3 md:grid-cols-2"}>
    <CampaignRewardsCard view={CARD_BOTH} isMobile={isMobile} isSpecial={false} kolName="Partner" avatar={undefined} frozen={false} />
    <CampaignRewardsCard view={KOL_SPECIAL} isMobile={isMobile} isSpecial kolName="Lao Wang" avatar={laowangAvatar.url} frozen={false} />
    <CampaignRewardsCard view={CARD_VOUCHER_ONLY} isMobile={isMobile} isSpecial={false} kolName="Partner" avatar={undefined} frozen={false} />
    <CampaignRewardsCard view={CARD_USDC_ONLY} isMobile={isMobile} isSpecial={false} kolName="Partner" avatar={undefined} frozen={false} />
    <CampaignRewardsCard view={CARD_FROZEN} isMobile={isMobile} isSpecial={false} kolName="Partner" avatar={undefined} frozen />
  </div>
);

export const CampaignRewardsCardDesktopPreview = () => <RewardsCardSet isMobile={false} />;
export const CampaignRewardsCardMobilePreview = () => <RewardsCardSet isMobile />;

/* ---------------- RW-11 · 详情异步二态 ---------------- */
export const CampaignDetailLoadingPreview = () => (
  <div className="p-3">
    <CampaignDetailSkeleton />
  </div>
);

export const CampaignDetailUnavailablePreview = () => (
  <div className="p-3">
    <CampaignUnavailable />
  </div>
);

/* ---------------- RW-12 · claim 成功反馈（静态挂真件 body，不真弹 toast） ---------------- */
export const ClaimSuccessToastPreview = () => (
  <div className="space-y-2 p-4">
    <div className="mx-auto w-full max-w-[420px] rounded-[12px] border border-[#1D2026] bg-[#131519] p-4">
      <ClaimSuccessToastBody onOpen={() => {}} />
    </div>
    <p className="text-center text-[11px] leading-4 text-muted-foreground">
      静态渲染 <code className="text-[11px] text-foreground">ClaimSuccessToastBody</code>（与{" "}
      <code className="text-[11px] text-foreground">showClaimSuccessToast()</code> 共用同一 copy 常量），campaign
      claim 与 referral claim 共用同一调用。
    </p>
  </div>
);

/* ---------------- Ⓓ Referral · fixture 驱动（禁 live hook 数据） ---------------- */
const ref = (
  id: string,
  status: Referral["status"],
  volume: number,
  email: string,
  offset: number,
): Referral => ({
  id,
  referrer_id: "u-self",
  referee_id: `u-${id}`,
  referral_code: "OMX7K2",
  level: 1,
  status,
  qualified_at: status === "pending" ? null : iso(offset + 1),
  rewarded_at: status === "rewarded" ? iso(offset + 2) : null,
  points_awarded: null,
  created_at: iso(offset),
  metadata: { masked_email: email, volume },
});

const REF_ROWS: Referral[] = [
  ref("r1", "pending", 42, "a***n@omenx.io", -9),
  ref("r2", "qualified", 100, "b***t@omenx.io", -7),
  ref("r3", "rewarded", 240, "c***m@omenx.io", -5),
];

const REF_FIXTURE = { referralCode: "OMX7K2", referrals: REF_ROWS };
const REF_EMPTY = { referralCode: "OMX7K2", referrals: [] as Referral[] };

/** RW-14/15/16 都挂同一件生产 ReferralPanel，只换 fixture；面板自身的端分叉由 iframe 宽度解析。 */
export const ReferralInvitePreview = () => <ReferralPanel fixture={REF_EMPTY} />;
export const ReferralRowsPreview = () => <ReferralPanel fixture={REF_FIXTURE} />;
export const ReferralOverviewPreview = () => <ReferralPanel fixture={REF_FIXTURE} />;
