import { SectionWrapper, SubSection, DualDevicePreview } from "../components";

/**
 * Rewards / Campaigns — real production components only (imported in
 * src/pages/StyleGuide/preview/rewardsPreviews.tsx and fed mock props).
 * Every case toggles Desktop / Mobile·375 through a same-origin iframe, so the
 * mobile column renders the shipped mobile implementation, not a lookalike.
 */
export const RewardsSection = ({ isMobile: _isMobile }: { isMobile: boolean }) => (
  <SectionWrapper
    id="rewards"
    title="Rewards / Campaigns"
    platform="shared"
    description="Campaign grid, campaign detail and referral surfaces. Reward colours: vouchers #CFFF4A, USDC #33D6FF (rewards context only). Compliance rule: no inline 'not guaranteed' next to amounts — one fine print per page that shows USDC."
  >
    <div className="space-y-10">
      <SubSection
        title="1. CampaignCard — four phases + fallback"
        description="live public · KOL special (orange partner badge) · evergreen (Always on / Always valid) · upcoming (0.65 opacity, Starts {date}) · no key visual (flat #101216 panel + 3px accent rail) · signed-out (progress block hidden)."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-campaign-cards" label="Art slot 16/6.4 desktop · 16/7 mobile" minHeight={720} />
      </SubSection>

      <SubSection
        title="2. GrantTaskRow — every state"
        description="not_started + CTA · in_progress + CTA + 5px bar · claimable (white Claim voucher, voucher tasks only) · claimed · not_eligible (dashed, muted) · signed out ('Sign in to start') · USDC claimable ('Credited to Standard after review', no button)."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-grant-rows" label="Desktop 3-column · mobile two-layer stack" minHeight={620} />
      </SubSection>

      <SubSection
        title="3. KOL brand band"
        description="Desktop: solid #FF8A3D capsule, 34px avatar, two-line lockup inside the hero scrim. Mobile: slim single-line capsule, 22px avatar, no explainer sentence — it lives inside the integrated hero card (16/9.5 + bottom scrim)."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-kol-band" label={"Toggle Mobile·375 for the shipped mobile hero. 手抄镜像 — 生产文件为 CPO 冻结画布，转活体待 CPO 批准。"} minHeight={420} />
      </SubSection>

      <SubSection
        title="4. Ended campaigns archive"
        description="Collapsed summary bar (count + vouchers earned) and the expanded rows. Desktop: 96×54 thumb + right-aligned totals. Mobile: 72×40 thumb + stacked meta."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-ended-archive" label="Collapsed + expanded" minHeight={320} />
      </SubSection>

      <SubSection
        title="4b. Ended campaign detail — frozen settled view"
        description="Real detail page for a seeded ended campaign (July Warm-up): ENDED badge, read-only task rows at their final state (no buttons), YOUR REWARDS HERE showing what was actually received, fine print kept."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-ended-detail" label="Live data — signed out inside the frame" minHeight={720} />
      </SubSection>

      <SubSection
        title="5. Points retirement notice"
        description="Dismissible once per device (localStorage). Desktop sits above the grid; mobile below the cards."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-points-notice" label={"Static render (dismiss button omitted). 手抄镜像 — 生产文件为 CPO 冻结画布，转活体待 CPO 批准。"} minHeight={140} />
      </SubSection>

      <SubSection
        title="6. SignInPromptCard"
        description="Signed-out replacement for personalised panels — keeps the frozen rail chrome, swaps the body for Log In / Sign Up."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-signin-prompt" label="Rewards rail cap + Referral cap" minHeight={360} />
      </SubSection>

      <SubSection
        title="7. Referral — three panels"
        description="Invite a friend (link + copy + 3 steps), Your invites (same TaskRowShell recipe as grants), The fine print. Desktop adds the overview rail; mobile replaces it with a three-column strip above the invites."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-referral-panels" label="Live hook data — signed out renders the empty state" minHeight={620} />
      </SubSection>

      <SubSection
        title="8. Compliance fine print"
        description="One per page that shows a USDC amount: /rewards Campaigns tab (below the archive bar) and the campaign detail page. Never inline next to an amount."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-fine-print" label={"11.5px / #6B7280. 手抄镜像 — 生产文件为 CPO 冻结画布，转活体待 CPO 批准。"} minHeight={110} />
      </SubSection>

      <SubSection
        title="9. Exclusive link — ineligible redirect"
        description="User lands via ?entry=LAOWANG but the entry cannot be bound (cap reached, already locked to another entry, account not eligible, link expired, etc.). UX: a single formal sonner toast + immediate redirect to /; the detail page never renders. Copy intentionally generic so new refusal reasons don't require new strings."
        platform="shared"
      >
        <DualDevicePreview previewKey="rewards-ineligible-redirect" label={"Frozen toast frame · desktop top-center · mobile full-width. 手抄镜像 — 生产文件为 CPO 冻结画布，转活体待 CPO 批准。"} minHeight={220} />
      </SubSection>
    </div>
  </SectionWrapper>
);
