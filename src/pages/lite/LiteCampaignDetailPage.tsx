import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
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
  const signedOut = !user;

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
      | { value?: number; current?: number }
      | undefined;
    if (typeof raw?.value === "number") return raw.value;
    return typeof raw?.current === "number" ? raw.current : undefined;
  };

  const kolName = entry?.branding.display_name ?? "Partner";
  const avatar = entry?.branding.avatar_url;

  const hero = view && (
    <CampaignKeyVisual
      src={entry?.branding.key_visual_url}
      accent={view.accent}
      ratio={isMobile ? "16 / 9" : "1232 / 300"}
      className="rounded-[14px]"
      scrim="linear-gradient(180deg,rgba(10,11,13,0) 0%,rgba(10,11,13,.72) 46%,rgba(10,11,13,.94) 100%)"
      scrimHeight="190px"
    >
      <div />
      <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-[12px]">
        {isSpecial && (
          <div
            className="inline-flex self-start items-center gap-[11px] rounded-full"
            style={{ background: "#FF8A3D", color: "#2A1200", padding: "5px 15px 5px 5px" }}
          >
            <span
              className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-full text-[13px] font-bold"
              style={{ background: "#2A1200", color: "#FF8A3D" }}
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                kolName.slice(0, 1)
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-[1px]">
              <span className="font-display text-[13.5px] font-bold">{kolName} × OmenX · Exclusive entry</span>
              <span className="truncate text-[11.5px] font-semibold">
                You joined through {kolName}'s link — his terms apply.
              </span>
            </div>
          </div>
        )}

        <h1 className="font-display text-[22px] font-bold leading-tight text-[#F2F3F5] md:text-[36px]">
          {view.campaign.name}
        </h1>
        {isMobile ? (
          <div className="font-display text-[12.5px] leading-[18px] tabular-nums text-[#C9CED6]">
            <div>
              {view.phase === "always-on"
                ? "Always valid"
                : formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
            </div>
            <div className="text-[#9AA1AC]">
              {view.joined.toLocaleString()} joined
              {view.daysLeft !== null && ` · ${view.daysLeft}d left`}
            </div>
          </div>
        ) : (
          <div className="font-display text-[12.5px] tabular-nums text-[#C9CED6]">
            {view.phase === "always-on" ? "Always valid" : formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
            {view.daysLeft !== null && ` · ${view.daysLeft} days left`} · {view.joined.toLocaleString()} joined
          </div>
        )}

        <div
          className={
            isMobile
              ? "-mx-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "flex flex-wrap items-center gap-2"
          }
        >
          {view.rewardVoucherUpTo > 0 && (
            <span
              className="shrink-0 whitespace-nowrap rounded-full font-display text-[12.5px] font-bold"
              style={{
                background: "#131519",
                border: "1px solid #1D2026",
                color: "#CFFF4A",
                padding: "7px 13px",
              }}
            >
              ${view.rewardVoucherUpTo} Trial Position Voucher
            </span>
          )}
          {view.rewardUsdcUpTo > 0 && (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-display text-[12.5px] font-bold"
              style={{
                background: "#131519",
                border: "1px solid #1D2026",
                color: "#33D6FF",
                padding: "7px 13px",
              }}
            >
              +${view.rewardUsdcUpTo} USDC
              <span className="font-sans font-medium text-[#6B7280]">not guaranteed</span>
            </span>
          )}
          {frozen && (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: "#242830", color: "#C9CED6" }}
            >
              Ended
            </span>
          )}
        </div>
      </div>
    </CampaignKeyVisual>
  );

  const rewardsCard = view && (signedOut ? (
    <SignInPromptCard />
  ) : (
    <aside
      className="flex flex-col gap-[14px] rounded-[16px] border border-[#1D2026] bg-[#131519]"
      style={{ padding: isMobile ? 16 : 18 }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Your rewards here</div>

      {isMobile ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Vouchers", value: `$${view.voucherClaimed}`, color: "#CFFF4A" },
            { label: "USDC", value: `$${view.usdcClaimed}`, color: "#33D6FF" },
            {
              label: "Available",
              value: `$${Math.max(
                0,
                view.rewardVoucherUpTo + view.rewardUsdcUpTo - view.voucherClaimed - view.usdcClaimed,
              )}`,
              color: "#FFFFFF",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-[12px] bg-[#0F1114] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280]">{s.label}</div>
              <div className="mt-1 font-display text-[16px] font-bold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-[#9AA1AC]">Vouchers claimed</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-[#CFFF4A]">${view.voucherClaimed}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-[#9AA1AC]">USDC credited</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-[#33D6FF]">${view.usdcClaimed}</span>
      </div>
      <div
        className="flex items-baseline justify-between"
        style={{ borderTop: "1px solid #1D2026", paddingTop: 11 }}
      >
        <span className="text-[12.5px] text-[#9AA1AC]">Still available</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-white">
          ${Math.max(0, view.rewardVoucherUpTo + view.rewardUsdcUpTo - view.voucherClaimed - view.usdcClaimed)}
        </span>
      </div>
        </>
      )}

      <button
        type="button"
        onClick={() => navigate("/vouchers")}
        className="w-full rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE]"
        style={{ minHeight: 44 }}
      >
        Open Position Vouchers →
      </button>

      <div
        className="flex items-center gap-2.5 rounded-[12px]"
        style={{ background: "#0F1115", border: "1px solid #1D2026", padding: "11px 12px" }}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold"
          style={{ background: "#2A1200", color: isSpecial ? "#FF8A3D" : "#9AA1AC" }}
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : kolName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B7280]">Entry</div>
          <div className="text-[12.5px] font-semibold" style={{ color: isSpecial ? "#FF8A3D" : "#F2F3F5" }}>
            {isSpecial ? `Joined via ${kolName}` : "Joined via public entry"}
          </div>
        </div>
      </div>
    </aside>
  ));

  const finePrint = (
    <p className="pt-1 text-[11.5px] leading-5 text-[#6B7280]">
      USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is
      yours, the voucher itself is not withdrawable.
    </p>
  );

  const tasksPanel = view && (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Grant tasks</span>
        <span className="text-[11.5px] text-[#6B7280]">
          {view.tasksDone} of {view.tasksTotal} done
        </span>
      </div>

      {(entry?.tasks ?? []).map((task) => (
        <GrantTaskRow
          key={task.task_key}
          task={task}
          status={statusFor(task.task_key)}
          progressValue={progressFor(task.task_key)}
          isClaiming={claiming === task.task_key}
          frozen={frozen}
          signedOut={signedOut}
          onClaim={() => handleClaim(task.task_key)}
        />
      ))}

      {!isMobile && finePrint}
    </div>
  );

  const body = isLoading ? (
    <div className="h-[420px] animate-pulse rounded-[16px] bg-[#0F1114]" />
  ) : !view ? (
    <div className="py-16 text-center text-[13px] text-[#9AA1AC]">This campaign is no longer available.</div>
  ) : isMobile ? (
    <div className="space-y-5">
      {hero}
      {tasksPanel}
      {rewardsCard}
      {finePrint}
    </div>
  ) : (
    <div className="space-y-5">
      {hero}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">{tasksPanel}</div>
        <div className="order-1 lg:order-2">{rewardsCard}</div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Campaign" showLogo={false} showBack />
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