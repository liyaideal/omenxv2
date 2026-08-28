import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReferralPanel } from "@/components/campaigns/ReferralPanel";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import { EndedCampaignsArchive } from "@/components/campaigns/EndedCampaignsArchive";
import { useCampaignViews } from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { VouchersBody } from "@/components/vouchers/VouchersBody";
import { PointsRetiredNotice } from "@/components/campaigns/PointsRetiredNotice";
import { RewardsFinePrint } from "@/components/campaigns/RewardsFinePrint";
import { H2eCampaignCard } from "@/components/h2e/H2eCampaignCard";
import { useNavigate } from "react-router-dom";
import { SeoFooter } from "@/components/seo/SeoFooter";

const Tabs = ({
  value,
  onChange,
  sticky,
}: {
  value: string;
  onChange: (v: string) => void;
  sticky?: boolean;
}) => (
  <div
    className={`flex items-end gap-7 border-b border-[#1D2026] md:gap-9 ${
      sticky ? "sticky top-[var(--mobile-header-h)] z-30 -mx-4 bg-background px-4" : ""
    }`}
  >
    {[
      { id: "campaigns", label: "Campaigns" },
      { id: "vouchers", label: "Vouchers" },
      { id: "referral", label: "Referral" },
    ].map((t) => {
      const active = value === t.id;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="relative min-h-[48px] pb-2 font-display text-[19px] leading-[26px] tracking-[-0.01em] transition-colors md:min-h-[56px] md:pb-3 md:text-[24px] md:leading-[30px]"
          style={{ color: active ? "#F2F3F5" : "#6B7280", fontWeight: active ? 700 : 500 }}
        >
          {t.label}
          {active && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-[#F2F3F5]" />}
        </button>
      );
    })}
  </div>
);

export default function LiteRewardsPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const signedOut = !user;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(
    tabParam === "referral" || tabParam === "vouchers" ? tabParam : "campaigns",
  );
  const { views, isLoading } = useCampaignViews();
  const navigate = useNavigate();
  // Mobile redeem is a full screen owned by the shell: single header, no tabs.
  const redeemParam = searchParams.get("redeem");
  const mobileRedeeming = isMobile && tab === "vouchers" && !!redeemParam;

  useEffect(() => {
    if (tabParam === "referral" || tabParam === "campaigns" || tabParam === "vouchers") setTab(tabParam);
  }, [tabParam]);

  const active = views.filter((v) => v.phase !== "ended");
  const ended = views.filter((v) => v.phase === "ended");

  const body = (
    <div className="space-y-5">
      {!mobileRedeeming && (
      <Tabs
        value={tab}
        sticky={isMobile}
        onChange={(v) => {
          setTab(v);
          setSearchParams({ tab: v }, { replace: true });
        }}
      />
      )}

      {tab === "campaigns" ? (
        <div className="space-y-5">
          {/* Desktop keeps the notice above the grid; mobile pushes it below the cards. */}
          {!isMobile && <PointsRetiredNotice />}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-[300px] animate-pulse rounded-[14px] bg-[#0F1114]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <H2eCampaignCard />
              {active.map((v) => (
                <CampaignCard key={v.campaign.id} view={v} signedOut={signedOut} />
              ))}
            </div>
          )}

          <EndedCampaignsArchive views={ended} />

          <RewardsFinePrint />

          {isMobile && <PointsRetiredNotice />}
        </div>
      ) : tab === "vouchers" ? (
        signedOut ? (
          <SignInPromptCard cap="VOUCHERS" description="Sign in to view and redeem your vouchers." />
        ) : (
          <VouchersBody />
        )
      ) : signedOut ? (
        <SignInPromptCard cap="REFERRAL" description="Sign in to track progress and claim rewards." />
      ) : (
        <ReferralPanel />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className={`flex min-h-screen flex-col bg-background ${mobileRedeeming ? "pb-0" : ""}`}>
        {mobileRedeeming ? (
          <MobileHeader
            title="Redeem voucher"
            showBack
            showLogo={false}
            backTo="/rewards?tab=vouchers"
          />
        ) : (
          <MobileHeader title="Rewards" showLogo={false} showBack flushBottom />
        )}
        <main className={mobileRedeeming ? "flex-1" : "flex-1 px-4 py-4"}>{body}</main>
        {!mobileRedeeming && (
          <div style={{ marginBottom: "var(--bottom-nav-h, 76px)" }}>
            <SeoFooter />
          </div>
        )}
        {/* Redeem is a focused full-screen task: nav retires, the header ‹ owns the exit. */}
        {!mobileRedeeming && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-6">{body}</main>
      <SeoFooter />
    </div>
  );
}