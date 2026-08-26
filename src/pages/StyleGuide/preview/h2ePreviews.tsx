// ============================================================
// H2E campaign previews — PRODUCTION components + optional fixture props.
//
// Every state below is a REAL render of the shipped component; the fixture
// prop is presentation-only (absent = production behaviour, unchanged).
// Dates are always relative helpers, never frozen literals.
// ============================================================
import { H2eCampaignCard } from "@/components/h2e/H2eCampaignCard";
import { ConnectedAccountsCard } from "@/components/h2e/ConnectedAccountsCard";
import { AirdroppedPositionsCard } from "@/components/h2e/AirdroppedPositionsCard";
import { H2eRewardsCard } from "@/components/h2e/H2eRewardsCard";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import type { H2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";
import type { AirdropPosition } from "@/hooks/useAirdropPositions";

/** Fixture dates stay relative — never a frozen literal. */
const hour = 3_600_000;
const day = 24 * hour;
const inHours = (h: number, m = 0) => new Date(Date.now() + h * hour + m * 60_000 + 30_000).toISOString();
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
  volumeCompleted: 5_653,
  isUnlocked: false,
  isFullyUnlocked: false,
  unlockedPercent: 0,
  unlockedAmount: 0,
  lockedAmount: 11,
  nextTierVolume: 10_000,
  nextTierPercent: 10,
  volumeToNextTier: 4_347,
  unlockTiers: TIERS,
  starterUnlock: 5,
  totalEarned: 11,
  earningsCap: 100,
  volumeRequired: 400_000,
  volumePercent: 1.4,
  earningsPercent: 11,
  settlements: [],
  ...over,
});

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-background p-4">{children}</div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <Frame>
    <div className="max-w-[420px]">{children}</div>
  </Frame>
);

/* ------------------------- 01–07 · grid card ------------------------- */

export const H2eCardS0Preview = () => (
  <Card>
    <H2eCampaignCard fixture={{ stage: "S0" }} />
  </Card>
);

export const H2eCardS1Preview = () => (
  <Card>
    <H2eCampaignCard fixture={{ stage: "S1" }} />
  </Card>
);

export const H2eCardS2ScanningPreview = () => (
  <Card>
    <H2eCampaignCard fixture={{ stage: "S2", scanning: true, positionsDetected: 3 }} />
  </Card>
);

export const H2eCardS2PluralPreview = () => (
  <Card>
    <H2eCampaignCard fixture={{ stage: "S2", positionsDetected: 3, liveAirdropCount: 2 }} />
  </Card>
);

export const H2eCardS2SingularPreview = () => (
  <Card>
    <H2eCampaignCard fixture={{ stage: "S2", positionsDetected: 3, liveAirdropCount: 1 }} />
  </Card>
);

export const H2eCardS2NonePreview = () => (
  <Card>
    <H2eCampaignCard fixture={{ stage: "S2", positionsDetected: 0, liveAirdropCount: 0 }} />
  </Card>
);

export const H2eCardS3Preview = () => (
  <Card>
    <H2eCampaignCard
      fixture={{
        stage: "S3",
        totalEarned: 11,
        earningsCap: 100,
        unlockedPercent: 0,
        nextTierPercent: 10,
        nextTierVolume: 10_000,
        isFullyUnlocked: false,
      }}
    />
  </Card>
);

/* --------------------- 08–09 · connected accounts -------------------- */

export const H2eConnectedDisconnectedPreview = () => (
  <Frame>
    <ConnectedAccountsCard fixture={{ connected: false }} />
  </Frame>
);

export const H2eConnectedLinkedPreview = () => (
  <Frame>
    <ConnectedAccountsCard
      fixture={{ connected: true, address: "0x742d...bD18", positionsDetected: 3, liveAirdropCount: 2 }}
    />
  </Frame>
);

/* -------------------- 10–12 · airdropped positions ------------------- */

const matched = (
  over: Partial<AirdropPosition> & Pick<AirdropPosition, "id" | "counterEventName">,
): AirdropPosition => ({
  source: "matched",
  externalEventName: null,
  externalSide: null,
  externalPrice: null,
  counterEventId: "fixture-event",
  counterOptionLabel: "Yes",
  counterSide: "long",
  counterPrice: 0.5,
  airdropValue: 10,
  status: "pending",
  expiresAt: inHours(47, 12),
  activatedAt: null,
  createdAt: inDays(-1),
  ...over,
});

const AIRDROP_ROWS: AirdropPosition[] = [
  matched({
    id: "fx-fed",
    counterEventName: "Fed Interest Rate Decision June 2026",
    counterOptionLabel: "Hold Steady",
    counterSide: "long",
    counterPrice: 0.55,
    externalEventName: "Fed rate cut in June 2026?",
    externalSide: "Yes",
    externalPrice: 0.45,
    status: "pending",
    expiresAt: inHours(47, 12),
  }),
  matched({
    id: "fx-btc",
    counterEventName: "BTC End of Q1 2026 Price",
    counterOptionLabel: "Below $120,000",
    counterSide: "short",
    counterPrice: 0.38,
    externalEventName: "Will Bitcoin reach $120k by March 2026?",
    externalSide: "Yes",
    externalPrice: 0.62,
    status: "activated",
    activatedAt: inHours(-6),
  }),
  matched({
    id: "fx-eth",
    counterEventName: "ETH Price Prediction April 2026",
    counterOptionLabel: "Above $5,000",
    counterSide: "long",
    counterPrice: 0.28,
    externalEventName: "ETH above $5,000 by April 2026?",
    externalSide: "No",
    externalPrice: 0.72,
    status: "expired",
    expiresAt: inHours(-3),
  }),
  matched({
    id: "fx-fed-sep",
    counterEventName: "Will the Fed cut rates in September?",
    counterOptionLabel: "No",
    counterSide: "long",
    counterPrice: 0.32,
    externalEventName: "Will the Fed cut rates in September?",
    externalSide: "Yes",
    externalPrice: 0.68,
    status: "expired",
    expiresAt: inHours(-20),
  }),
];

const WELCOME_ROW: AirdropPosition = matched({
  id: "fx-welcome",
  source: "welcome_gift",
  counterEventName: "ETH Price Prediction April 2026",
  counterOptionLabel: "Above $5,000",
  counterSide: "long",
  counterPrice: 0.42,
  externalEventName: null,
  externalSide: null,
  externalPrice: null,
  status: "pending",
  expiresAt: inHours(35, 40),
});

export const H2eAirdropsAllStatesPreview = () => (
  <Frame>
    <AirdroppedPositionsCard fixture={{ rows: AIRDROP_ROWS }} />
  </Frame>
);

export const H2eAirdropsWelcomePreview = () => (
  <Frame>
    <AirdroppedPositionsCard fixture={{ rows: [WELCOME_ROW] }} />
  </Frame>
);

export const H2eAirdropsMobilePreview = () => (
  <Frame>
    <AirdroppedPositionsCard fixture={{ rows: [AIRDROP_ROWS[0], AIRDROP_ROWS[1], AIRDROP_ROWS[2]] }} />
  </Frame>
);

/* ----------------------- 13–18 · progress card ----------------------- */

const SETTLEMENTS = [
  { name: "ETH above $5,000 by April", trigger: "Event Resolved" as const, amount: 6.2 },
  { name: "Fed rate decision — hold steady", trigger: "Source Closed" as const, amount: 4.8 },
];

export const H2eRewardsS1Preview = () => (
  <Frame>
    <H2eRewardsCard h2e={h2eFixture()} fixture={{ stage: "S1" }} />
  </Frame>
);

export const H2eRewardsS2Preview = () => (
  <Frame>
    <H2eRewardsCard
      h2e={h2eFixture()}
      fixture={{ stage: "S2", connected: true, positionsDetected: 3, liveAirdropCount: 2 }}
    />
  </Frame>
);

export const H2eRewardsS2ScanningPreview = () => (
  <Frame>
    <H2eRewardsCard
      h2e={h2eFixture()}
      fixture={{ stage: "S2", connected: true, scanning: true, positionsDetected: 3 }}
    />
  </Frame>
);

export const H2eRewardsS2NonePreview = () => (
  <Frame>
    <H2eRewardsCard
      h2e={h2eFixture()}
      fixture={{ stage: "S2", connected: true, positionsDetected: 0, liveAirdropCount: 0 }}
    />
  </Frame>
);

export const H2eRewardsS3Preview = () => (
  <Frame>
    <H2eRewardsCard
      h2e={h2eFixture()}
      fixture={{
        stage: "S3",
        connected: true,
        liveAirdropCount: 2,
        totalEarned: 11,
        earningsCap: 100,
        totalVolume: 5_653,
        unlockedPercent: 0,
        nextTierPercent: 10,
        nextTierVolume: 10_000,
        settlements: SETTLEMENTS,
      }}
    />
  </Frame>
);

export const H2eRewardsS3DisconnectedPreview = () => (
  <Frame>
    <H2eRewardsCard
      h2e={h2eFixture()}
      fixture={{
        stage: "S3",
        connected: false,
        liveAirdropCount: 0,
        totalEarned: 11,
        earningsCap: 100,
        totalVolume: 5_653,
        unlockedPercent: 0,
        nextTierPercent: 10,
        nextTierVolume: 10_000,
        settlements: SETTLEMENTS,
      }}
    />
  </Frame>
);

/* --------------------------- aside (guest) --------------------------- */

export const H2eAsideSignedOutPreview = () => (
  <Frame>
    <div className="max-w-[340px]">
      <SignInPromptCard />
    </div>
  </Frame>
);
