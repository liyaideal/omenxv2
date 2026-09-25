import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import H2eCampaignDetailPage from "./H2eCampaignDetailPage";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import { TieredTaskRow, deriveTiered } from "@/components/campaigns/TieredTaskRow";
import { RecurringTaskRow } from "@/components/campaigns/RecurringTaskRow";
import { showCreditedToast, showStreakBonusToast } from "@/components/campaigns/CreditedToastBody";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import { CampaignDetailSkeleton } from "@/components/campaigns/CampaignDetailSkeleton";
import { CampaignUnavailable } from "@/components/campaigns/CampaignUnavailable";
import { CampaignRewardsCard } from "@/components/campaigns/CampaignRewardsCard";
import { showClaimSuccessToast } from "@/components/campaigns/ClaimSuccessToastBody";
import { KolBandDesktop, KolBandMobile } from "@/components/campaigns/KolBand";
import { RewardsFinePrint } from "@/components/campaigns/RewardsFinePrint";
import { CampaignRulesDisclosure } from "@/components/campaigns/CampaignRulesDisclosure";
import { softBindPublicEntry } from "@/components/campaigns/CampaignAttribution";
import { useAuth } from "@/hooks/useAuth";

import { formatDateRange, isRecurringTask, isTieredTask, useCampaignViews } from "@/hooks/useCampaigns";

const CREDITED_SEEN_KEY = (userId: string) => `omenx_campaign_credited_seen:${userId}`;

export default function LiteCampaignDetailPage() {
  const { campaignId } = useParams();
  // H2E is a platform program, not a campaigns-table row — it owns its own page.
  if (campaignId === "h2e") return <H2eCampaignDetailPage />;
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

  /** Claims one grant (plain task key, or `<task_key>#t<n>` for a tier). Throws on failure so a
   *  tiered "Claim all" chain stops at the first error. */
  const handleClaim = async (taskKey: string) => {
    if (!entry) return;
    setClaiming(taskKey);
    const { data, error } = await supabase.functions.invoke("claim-campaign-grant", {
      body: { entryId: entry.id, taskKey },
    });
    setClaiming(null);
    if (error || (data as { error?: string })?.error) {
      const msg = (data as { error?: string })?.error ?? "Could not claim this reward";
      toast.error(msg);
      throw new Error(msg);
    }
    showClaimSuccessToast(() => navigate("/vouchers"));
    refresh();
  };
  const claimSafely = (taskKey: string) => handleClaim(taskKey).catch(() => undefined);

  // Tiered USDC tiers are credited server-side the moment they are reached;
  // surface each newly credited tier once (per browser) with a toast.
  useEffect(() => {
    if (!user || !view || !entry) return;
    const credited: { key: string; usdc: number; tierIndex: number; taskName: string; streak?: string }[] = [];
    entry.tasks.filter(isTieredTask).forEach((task) => {
      deriveTiered(task, view.grants).tiers.forEach((t) => {
        const usdc = t.tier.reward?.usdc ?? 0;
        if (t.claimed && usdc > 0) credited.push({ key: t.key, usdc, tierIndex: t.index + 1, taskName: task.name });
      });
    });
    // Recurring: only the streak bonuses toast (a daily $1 would nag); "n-day streak" label.
    entry.tasks.filter(isRecurringTask).forEach((task) => {
      const every = task.streak_bonus?.every ?? 0;
      const usdc = task.streak_bonus?.reward?.usdc ?? 0;
      if (!every || !usdc) return;
      view.grants
        .filter((g) => g.taskKey.startsWith(`${task.task_key}#s`) && g.status === "claimed")
        .forEach((g) => {
          const n = Number(g.taskKey.split("#s")[1] ?? 0);
          credited.push({
            key: g.taskKey,
            usdc,
            tierIndex: n,
            taskName: task.name,
            streak: `${n * every}-${task.period === "weekly" ? "week" : "day"} streak`,
          });
        });
    });
    if (!credited.length) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(CREDITED_SEEN_KEY(user.id)) ?? "[]");
    } catch {
      seen = [];
    }
    const fresh = credited.filter((c) => !seen.includes(c.key));
    // First visit after the feature ships: mark everything seen silently so an
    // old account does not get seven toasts at once.
    const firstVisit = seen.length === 0 && fresh.length === credited.length && credited.length > 1;
    if (!firstVisit)
      fresh.forEach((c) =>
        c.streak
          ? showStreakBonusToast(c.usdc, c.streak, c.taskName, () => navigate("/wallet"))
          : showCreditedToast(c.usdc, c.tierIndex, c.taskName, () => navigate("/wallet")),
      );
    try {
      localStorage.setItem(CREDITED_SEEN_KEY(user.id), JSON.stringify(credited.map((c) => c.key)));
    } catch {
      /* storage unavailable — toast may repeat next visit, harmless */
    }
  }, [user, view, entry, navigate]);

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

  const mobileHero = view && (
    <div className="flex flex-col">
      <CampaignKeyVisual
        src={entry?.branding.key_visual_url}
        accent={view.accent}
        ratio="16 / 9.5"
        className="rounded-[14px]"
        scrim="linear-gradient(180deg, rgba(10,11,13,0.0) 0%, rgba(10,11,13,0.45) 20%, rgba(10,11,13,0.85) 55%, rgba(10,11,13,0.98) 100%)"
      >
        <div /> {/* top slot intentionally empty */}
        <div className="flex flex-col gap-[10px]">
          {isSpecial && (
<KolBandMobile kolName={kolName} avatar={avatar} />
          )}

          <h1 className="font-display text-[22px] font-bold leading-[28px] text-[#F2F3F5]">{view.campaign.name}</h1>

          <div className="font-display text-[12px] leading-[16px] tabular-nums text-[#9AA1AC]">
            {view.phase === "always-on"
              ? "Always valid"
              : formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
            {view.daysLeft !== null && ` · ${view.daysLeft}d left`} · {view.joined.toLocaleString()} joined
            {frozen && " · Ended"}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {view.rewardVoucherUpTo > 0 && (
              <span
                className="rounded-full font-display text-[12px] font-bold"
                style={{ background: "#131519", border: "1px solid #1D2026", color: "#CFFF4A", padding: "6px 12px" }}
              >
                ${view.rewardVoucherUpTo} Trial Position Voucher
              </span>
            )}
            {view.rewardUsdcUpTo > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full font-display text-[12px] font-bold"
                style={{ background: "#131519", border: "1px solid #1D2026", color: "#33D6FF", padding: "6px 12px" }}
              >
                ${view.rewardUsdcUpTo} USDC
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
    </div>
  );

  const desktopHero = view && (
    <CampaignKeyVisual
      src={entry?.branding.key_visual_url}
      accent={view.accent}
      ratio="1232 / 300"
      className="rounded-[14px]"
      scrim="linear-gradient(180deg,rgba(10,11,13,0) 0%,rgba(10,11,13,.72) 46%,rgba(10,11,13,.94) 100%)"
      scrimHeight="190px"
    >
      <div />
      <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-[12px]">
        {isSpecial && (
<KolBandDesktop kolName={kolName} avatar={avatar} />
        )}

        <h1 className="font-display text-[36px] font-bold leading-tight text-[#F2F3F5]">
          {view.campaign.name}
        </h1>
        <div className="font-display text-[12.5px] tabular-nums text-[#C9CED6]">
            {view.phase === "always-on" ? "Always valid" : formatDateRange(view.campaign.startsAt, view.campaign.endsAt)}
            {view.daysLeft !== null && ` · ${view.daysLeft} days left`} · {view.joined.toLocaleString()} joined
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              ${view.rewardUsdcUpTo} USDC
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
    <CampaignRewardsCard
      view={view}
      isMobile={isMobile}
      isSpecial={isSpecial}
      kolName={kolName}
      avatar={avatar}
      frozen={frozen}
    />
  ));

  const finePrint = <RewardsFinePrint />;

  const tasksPanel = view && (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Grant tasks</span>
        <span className="text-[11.5px] text-[#6B7280]">
          {view.tasksDone} of {view.tasksTotal} done
        </span>
      </div>

      {(entry?.tasks ?? []).map((task) =>
        isRecurringTask(task) ? (
          <RecurringTaskRow
            key={task.task_key}
            task={task}
            grants={view.grants}
            joinedAt={view.participation?.joinedAt}
            claimingKey={claiming}
            frozen={frozen}
            signedOut={signedOut}
            onClaim={handleClaim}
          />
        ) : isTieredTask(task) ? (
          <TieredTaskRow
            key={task.task_key}
            task={task}
            grants={view.grants}
            claimingKey={claiming}
            frozen={frozen}
            signedOut={signedOut}
            onClaim={handleClaim}
          />
        ) : (
          <GrantTaskRow
            key={task.task_key}
            task={task}
            status={statusFor(task.task_key)}
            progressValue={progressFor(task.task_key)}
            isClaiming={claiming === task.task_key}
            frozen={frozen}
            signedOut={signedOut}
            onClaim={() => claimSafely(task.task_key)}
          />
        ),
      )}

    </div>
  );

  const rulesModule = entry?.details ? (
    <CampaignRulesDisclosure paragraphs={entry.details.paragraphs} heading={entry.details.heading} />
  ) : null;

  const body = isLoading ? (
    <CampaignDetailSkeleton />
  ) : !view ? (
    <CampaignUnavailable />
  ) : isMobile ? (
    <div className="space-y-5">
      {mobileHero}
      {tasksPanel}
      {rulesModule}
      {rewardsCard}
      {finePrint}
    </div>
  ) : (
    <div className="space-y-5">
      {desktopHero}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="order-2 space-y-5 lg:order-1">
          {tasksPanel}
          {rulesModule}
          {finePrint}
        </div>
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