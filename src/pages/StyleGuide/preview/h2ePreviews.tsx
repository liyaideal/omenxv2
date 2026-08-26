// ============================================================
// H2E campaign previews — PRODUCTION components only.
//
// Honest limitation (recorded, not worked around): every H2E module reads its
// stage from hooks (useAuth / useConnectedAccounts / useAirdropPositions) and
// exposes no props for them. The preview iframe has no session, so the LIVE
// render below is always the guest (S0) branch. Injecting S1/S2/S3 would mean
// adding fixture props to shipped components — out of scope for an archive
// round. Every non-S0 state is therefore documented in the case spec tables in
// sections/pages/LiteH2ePage.tsx, which are the normative source.
// ============================================================
import { H2eCampaignCard } from "@/components/h2e/H2eCampaignCard";
import { ConnectedAccountsCard } from "@/components/h2e/ConnectedAccountsCard";
import { AirdroppedPositionsCard } from "@/components/h2e/AirdroppedPositionsCard";
import { H2eRewardsCard } from "@/components/h2e/H2eRewardsCard";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import type { H2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";

/** Fixture dates stay relative — never a frozen literal. */
const day = 86_400_000;
const inDays = (d: number) => new Date(Date.now() + d * day).toISOString();

const TIERS = [
  { volume: 0, percent: 0 },
  { volume: 10_000, percent: 10 },
  { volume: 50_000, percent: 25 },
  { volume: 100_000, percent: 50 },
  { volume: 200_000, percent: 75 },
  { volume: 400_000, percent: 100 },
];

/** Fake summary — no real account numbers ever land in the style guide. */
export const h2eFixture = (over: Partial<H2eRewardsSummary> = {}): H2eRewardsSummary => ({
  frozenBalance: 11,
  volumeCompleted: 12_400,
  isUnlocked: true,
  isFullyUnlocked: false,
  unlockedPercent: 10,
  unlockedAmount: 1.1,
  lockedAmount: 9.9,
  nextTierVolume: 50_000,
  nextTierPercent: 25,
  volumeToNextTier: 37_600,
  unlockTiers: TIERS,
  starterUnlock: 5,
  totalEarned: 11,
  earningsCap: 100,
  volumeRequired: 400_000,
  volumePercent: 3.1,
  earningsPercent: 11,
  settlements: [
    { id: "fx-1", eventName: "Fed cuts rates in June", pnl: 6.5, trigger: "EVENT_RESOLVED", settledAt: inDays(-2) },
    { id: "fx-2", eventName: "Bitcoin above $70,000", pnl: 4.5, trigger: "AUTO_CLOSE", settledAt: inDays(-5) },
  ],
  ...over,
});

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-background p-4">{children}</div>
);

const Nothing = ({ what }: { what: string }) => (
  <div className="rounded-[12px] border border-dashed border-[#1D2026] p-4 text-[11px] text-[#6B7280]">
    {what}
  </div>
);

/* ------------------------- grid card ------------------------- */

export const H2eCampaignCardPreview = () => (
  <Frame>
    <div className="max-w-[420px]">
      <H2eCampaignCard />
    </div>
  </Frame>
);

/* ---------------------- detail modules ----------------------- */

export const H2eConnectedAccountsPreview = () => (
  <Frame>
    <ConnectedAccountsCard />
  </Frame>
);

export const H2eAirdroppedPositionsPreview = () => (
  <Frame>
    <AirdroppedPositionsCard />
    <Nothing what="↑ 生产组件已挂载。游客 / 未连接 / 扫描中 / 零行 时组件 return null —— 上方什么都不画，这就是渲染条件表的第一行。" />
  </Frame>
);

export const H2eRewardsCardPreview = () => (
  <Frame>
    <H2eRewardsCard h2e={h2eFixture()} />
  </Frame>
);

export const H2eAsideSignedOutPreview = () => (
  <Frame>
    <div className="max-w-[340px]">
      <SignInPromptCard />
    </div>
  </Frame>
);
