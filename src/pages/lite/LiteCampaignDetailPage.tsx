import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import { softBindPublicEntry } from "@/components/campaigns/CampaignAttribution";
import { useAuth } from "@/hooks/useAuth";
import { formatDateRange, useCampaignViews } from "@/hooks/useCampaigns";

export default function LiteCampaignDetailPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { views, isLoading, refresh } = useCampaignViews();
  const [claiming, setClaiming] = useState<string | null>(null);

  const view = views.find((v) => v.campaign.id === campaignId) ?? null;
  const entry = view?.entry ?? null;
  const isSpecial = entry?.kind === "special";
  const frozen = view?.phase === "ended";

  // Public first-visit soft binding.
  useEffect(() => {
    if (!user || !view || view.participation || !view.entry) return;
    if (view.entry.kind !== "public") return;
    softBindPublicEntry(user.id, view.campaign.id, view.entry.id).then((created) => {
      if (created) refresh();
    });
  }, [user, view, refresh]);

  const handleClaim = async (taskKey: string) => {
    if (!entry) return;
    setClaiming(taskKey);
    const { data, error } = await supabase.functions.invoke("claim-campaign-grant", {
      body: { entryId: entry.id, taskKey },
    });
    setClaiming(null);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? "Could not claim this reward");
      return;
    }
    toast.success("Voucher sent to Position Vouchers", {
      description: "Open vouchers to reveal it.",
      action: { label: "Open", onClick: () => navigate("/vouchers") },
    });
    refresh();
  };

  const statusFor = (taskKey: string) =>
    view?.grants.find((g) => g.taskKey === taskKey)?.status ?? "not_started";
  const progressFor = (taskKey: string) => {
    const raw = view?.grants.find((g) => g.taskKey === taskKey)?.progress as
      | { value?: number }
      | undefined;
    return typeof raw?.value === "number" ? raw.value : undefined;
  };

  const hero = view && (
    <CampaignKeyVisual
      src={entry?.branding.key_visual_url}
      accent={view.accent}
      ratio={isMobile ? "16 / 9" : "1232 / 300"}
      className="rounded-[14px]"
    >
      <div />
      <div className="space-y-2">
        {isSpecial && (
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-full text-[12px] text-[#FF8A3D]"
              style={{ border: "1px solid #FF8A3D", background: "#2A2016" }}
            >
              {entry?.branding.avatar_url ? (
                <img src={entry.branding.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (entry?.branding.display_name ?? "P").slice(0, 1)
              )}
            </span>
            <div className="min-w-0">
              <div className="font-display text-[14px] font-bold text-[#FF8A3D]">
                {entry?.branding.display_name} × OmenX — Exclusive entry
              </div>
              <div className="text-[11px] text-[#9AA1AC]">
                You joined through {entry?.branding.display_name}'s link — their terms apply
              </div>
            </div>
          </div>
        )}

        <h1 className="font-display text-[19px] font-bold leading-tight text-[#F2F3F5] md:text-[26px]">
          {view.campaign.name}
        </h1>
        <div className="text-[11.5px] text-[#C9CED6]">
          {formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
          {view.daysLeft !== null && ` · Ends in ${view.daysLeft}d`} · {view.joined.toLocaleString()} joined
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {view.rewardVoucherUpTo > 0 && (
            <span
              className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ background: "rgba(207,255,74,.12)", color: "#CFFF4A" }}
            >
              ${view.rewardVoucherUpTo} Trial Position Voucher
            </span>
          )}
          {view.rewardUsdcUpTo > 0 && (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ background: "rgba(51,214,255,.12)", color: "#33D6FF" }}
            >
              +${view.rewardUsdcUpTo} USDC
              <span className="text-[10px] font-normal text-[#6B7280]">not guaranteed</span>
            </span>
          )}
          {isSpecial && entry?.branding.blurb && (
            <span
              className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ background: "rgba(255,138,61,.12)", color: "#FF8A3D" }}
            >
              {entry.branding.blurb}
            </span>
          )}
          {frozen && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: "#242830", color: "#C9CED6" }}
            >
              Ended
            </span>
          )}
        </div>
      </div>
    </CampaignKeyVisual>
  );

  const rewardsCard = view && (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-[#1D2026] bg-[#131519] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Your rewards here</div>
        <div className="mt-3 space-y-2 text-[12.5px]">
          <div className="flex items-center justify-between">
            <span className="text-[#9AA1AC]">Vouchers claimed</span>
            <span className="font-display font-bold text-[#CFFF4A]">${view.voucherClaimed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9AA1AC]">USDC credited</span>
            <span className="font-display font-bold text-[#33D6FF]">${view.usdcClaimed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9AA1AC]">Still available</span>
            <span className="font-display font-bold text-[#F2F3F5]">
              ${Math.max(0, view.rewardVoucherUpTo + view.rewardUsdcUpTo - view.voucherClaimed - view.usdcClaimed)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/vouchers")}
          className="mt-4 h-[44px] w-full rounded-[10px] bg-white text-[13px] font-semibold text-[#06080A]"
        >
          Open Position Vouchers →
        </button>
      </div>

      <div className="rounded-[16px] border border-[#1D2026] bg-[#131519] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Entry</div>
        <div className="mt-2 text-[12.5px] font-semibold" style={{ color: isSpecial ? "#FF8A3D" : "#F2F3F5" }}>
          {isSpecial ? `Joined via ${entry?.branding.display_name}` : "Joined via public entry"}
        </div>
        {view.participation && (
          <div className="mt-1 text-[11.5px] text-[#6B7280]">
            {new Date(view.participation.joinedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );

  const tasksPanel = view && (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[16px] border border-[#1D2026] bg-[#131519]">
        <div className="px-4 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          Grant tasks
        </div>
        <div className="mt-2">
          {(entry?.tasks ?? []).map((task) => (
            <GrantTaskRow
              key={task.task_key}
              task={task}
              status={statusFor(task.task_key)}
              progressValue={progressFor(task.task_key)}
              isClaiming={claiming === task.task_key}
              frozen={frozen}
              onClaim={() => handleClaim(task.task_key)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[12px] border border-[#1D2026] bg-[#0F1114] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">The fine print</div>
        <p className="mt-2 text-[11.5px] leading-5 text-[#9AA1AC]">
          Voucher rewards are Trial Position Vouchers — redeem within 7 days of claiming, profits accrue to your
          voucher earnings. USDC rewards are credited to your Standard balance after review. Reward amounts are not
          guaranteed and subject to the campaign budget.
        </p>
      </div>
    </div>
  );

  const body = isLoading ? (
    <div className="h-[420px] animate-pulse rounded-[16px] bg-[#0F1114]" />
  ) : !view ? (
    <div className="py-16 text-center text-[13px] text-[#9AA1AC]">This campaign is no longer available.</div>
  ) : (
    <div className="space-y-5">
      {hero}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 lg:order-1">{tasksPanel}</div>
        <div className="order-1 lg:order-2">{rewardsCard}</div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Campaign" showLogo={false} showBack />
        <AuthGateOverlay
          title="Campaign"
          description="Sign in to take part and collect vouchers."
          maxPreviewHeight="400px"
        >
          <main className="px-4 py-4">{body}</main>
        </AuthGateOverlay>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <AuthGateOverlay title="Campaign" description="Sign in to take part and collect vouchers.">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">{body}</main>
      </AuthGateOverlay>
    </div>
  );
}