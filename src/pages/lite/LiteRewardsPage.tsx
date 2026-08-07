import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
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
import { EmptyState } from "@/components/states";

const NOTICE_KEY = "omenx_points_retired_notice_dismissed";

const PointsRetiredNotice = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(NOTICE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[#23262D] bg-[#0F1114] px-4 py-3">
      <p className="flex-1 text-[12.5px] leading-5 text-[#C9CED6]">
        Points have retired. Rewards now come as Trial Position Vouchers.{" "}
        <button type="button" onClick={() => navigate("/vouchers")} className="text-[#33D6FF]">
          Open vouchers →
        </button>
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(NOTICE_KEY, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="-m-2 grid h-11 w-11 place-items-center text-[#6B7280]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

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
    className={`flex items-center gap-[22px] border-b border-[#1D2026] ${
      sticky ? "sticky top-[44px] z-30 -mx-4 bg-background px-4" : ""
    }`}
  >
    {[
      { id: "campaigns", label: "Campaigns" },
      { id: "referral", label: "Referral" },
    ].map((t) => {
      const active = value === t.id;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="relative min-h-[44px] text-[13.5px]"
          style={{ color: active ? "#F2F3F5" : "#9AA1AC", fontWeight: active ? 600 : 400 }}
        >
          {t.label}
          {active && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-white" />}
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
  const [tab, setTab] = useState(tabParam === "referral" ? "referral" : "campaigns");
  const { views, isLoading } = useCampaignViews();

  useEffect(() => {
    if (tabParam === "referral" || tabParam === "campaigns") setTab(tabParam);
  }, [tabParam]);

  const active = views.filter((v) => v.phase !== "ended");
  const ended = views.filter((v) => v.phase === "ended");

  const body = (
    <div className="space-y-5">
      <Tabs
        value={tab}
        sticky={isMobile}
        onChange={(v) => {
          setTab(v);
          setSearchParams({ tab: v }, { replace: true });
        }}
      />

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
          ) : active.length === 0 ? (
            <EmptyState
              variant="module"
              bordered={false}
              title="No campaigns running"
              description="New campaigns show up here as they go live."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map((v) => (
                <CampaignCard key={v.campaign.id} view={v} signedOut={signedOut} />
              ))}
            </div>
          )}

          <EndedCampaignsArchive views={ended} />

          {/* One fine print per page carrying USDC amounts (no inline "not guaranteed"). */}
          <p className="pt-1 text-[11.5px] leading-5 text-[#6B7280]">
            USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the
            profit is yours, the voucher itself is not withdrawable.
          </p>

          {isMobile && <PointsRetiredNotice />}
        </div>
      ) : signedOut ? (
        <SignInPromptCard cap="REFERRAL" description="Sign in to track progress and claim rewards." />
      ) : (
        <ReferralPanel />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Rewards" showLogo={false} showBack />
        <main className="px-4 py-4">{body}</main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">{body}</main>
    </div>
  );
}