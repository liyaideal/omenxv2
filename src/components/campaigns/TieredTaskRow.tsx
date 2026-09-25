import { useState } from "react";
import { CircleSlash, Loader2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import type { CampaignGrant, CampaignTaskDef, CampaignTaskTier, GrantStatus } from "@/hooks/useCampaigns";
import { metricUnit, tierGrantKey } from "@/hooks/useCampaigns";
import { metricIcon } from "./GrantTaskRow";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClaimButton, TaskRowShell, type TaskRowTick } from "./TaskRowShell";

/**
 * TieredTaskRow — the `type: "tiered"` renderer (design: t2-tiered-real v2,
 * 2026-09-23). Same TaskRowShell chrome as GrantTaskRow; the only additions
 * are tier ticks on the bar, a two-line reward slot and a tier drawer on
 * mobile / tick tooltips on desktop. Copy never grows with the tier count:
 * title / subtitle / `$value / $nextTarget` is the whole text budget.
 *
 * Rules (approved 2026-09-23):
 *  - one shared progress value, one bar, ordinal fill (equal segment per tier)
 *  - every tier is its own grant `<task_key>#t<n>`; USDC tiers are credited by
 *    the server the moment they are reached (status jumps to `claimed`),
 *    voucher tiers become `claimable` and need a Claim
 *  - reward slot: `$X ready` (lime, voucher claimable) → `next $R …` (grey) →
 *    `$T … credited/claimed` (grey); line 2 is always `reached / total tiers`
 *  - action: Claim $X · Claim all $X · CTA · All credited / All claimed
 */

const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;
const fmtTarget = (n: number, unit: string) => (unit === "$" ? fmtUsd(n) : `${n} ${unit}`);
/** Rail label: no `$` (the count next to the bar carries the unit), K-abbreviated — `2K`, `2.5K`, `100K`, `3`. */
const fmtShort = (n: number) =>
  n >= 1000 ? `${Number.isInteger(n / 1000) ? n / 1000 : (n / 1000).toFixed(1)}K` : `${n}`;

type TierUnit = "usdc" | "voucher";
const tierUnit = (t: CampaignTaskTier): TierUnit => ((t.reward?.usdc ?? 0) > 0 ? "usdc" : "voucher");
const tierAmount = (t: CampaignTaskTier) => (t.reward?.usdc ?? 0) > 0 ? t.reward.usdc! : (t.reward?.voucher ?? 0);
const unitLabel = (u: TierUnit) => (u === "usdc" ? "USDC" : "voucher");

/** Fallback action when a task carries no explicit `cta` (mirrors GrantTaskRow). */
const fallbackCta = (task: CampaignTaskDef): { label: string; href: string } => {
  if (task.metric === "referrals_qualified") return { label: "Invite", href: "/rewards?tab=referral" };
  const sector = task.scope?.categories?.[0];
  return { label: "Trade", href: sector ? `/events?sector=${sector}` : "/events" };
};

const TaskActionButton = ({ label, href }: { label: string; href: string }) => {
  const className =
    "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-[10px] border border-[#2B2F38] bg-transparent px-5 font-display text-[12.5px] font-semibold text-[#F2F3F5] transition-colors hover:border-[#3A3F47] md:min-h-[40px] md:px-4";
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
};

export interface TierRowState {
  index: number; // 0-based
  key: string;
  tier: CampaignTaskTier;
  status: GrantStatus;
  reached: boolean;
  claimed: boolean;
  claimable: boolean;
}

export interface TieredDerived {
  value: number;
  tiers: TierRowState[];
  reachedCount: number;
  nextIdx: number; // -1 when every tier is reached
  denom: number;
  pct: number;
  allClaimed: boolean;
  notEligible: boolean;
  claimableSum: number; // voucher $ sitting in claimable tiers
  claimableCount: number;
  claimedSum: number;
  unit: TierUnit; // dominant unit (first tier) — one task should carry one unit
  unitLabel: string; // progress unit word ($ / friends / …)
}

/** Pure derivation shared by the row, the style-guide and the credited toast. */
export const deriveTiered = (task: CampaignTaskDef, grants: CampaignGrant[]): TieredDerived => {
  const tiersDef = task.tiers ?? [];
  const byKey = new Map(grants.map((g) => [g.taskKey, g]));
  let value = 0;
  tiersDef.forEach((_, i) => {
    const g = byKey.get(tierGrantKey(task.task_key, i + 1));
    const raw = g?.progress as { value?: number; current?: number } | undefined;
    const v = typeof raw?.value === "number" ? raw.value : typeof raw?.current === "number" ? raw.current : 0;
    value = Math.max(value, v);
  });
  const tiers: TierRowState[] = tiersDef.map((tier, i) => {
    const key = tierGrantKey(task.task_key, i + 1);
    const status = byKey.get(key)?.status ?? "not_started";
    const claimed = status === "claimed";
    const claimable = status === "claimable";
    const reached = claimed || claimable || value >= tier.target;
    return { index: i, key, tier, status, reached, claimed, claimable };
  });
  const reachedCount = tiers.filter((t) => t.reached).length;
  const nextIdx = tiers.findIndex((t) => !t.reached);
  const M = Math.max(1, tiers.length);
  const denom = nextIdx < 0 ? tiersDef[M - 1]?.target ?? 0 : tiersDef[nextIdx].target;
  let pct = 100;
  if (nextIdx >= 0) {
    const lo = nextIdx === 0 ? 0 : tiersDef[nextIdx - 1].target;
    const seg = (value - lo) / Math.max(1, tiersDef[nextIdx].target - lo);
    pct = ((nextIdx + Math.max(0, Math.min(1, seg))) / M) * 100;
  }
  return {
    value,
    tiers,
    reachedCount,
    nextIdx,
    denom,
    pct,
    allClaimed: tiers.length > 0 && tiers.every((t) => t.claimed),
    notEligible: tiers.some((t) => t.status === "not_eligible"),
    claimableSum: tiers.reduce((a, t) => a + (t.claimable ? tierAmount(t.tier) : 0), 0),
    claimableCount: tiers.filter((t) => t.claimable).length,
    claimedSum: tiers.reduce((a, t) => a + (t.claimed ? tierAmount(t.tier) : 0), 0),
    unit: tiersDef[0] ? tierUnit(tiersDef[0]) : "usdc",
    unitLabel: metricUnit(task.metric),
  };
};

const tierStatusWord = (t: TierRowState, unit: TierUnit) =>
  t.claimed ? (unit === "usdc" ? "Credited" : "Claimed") : t.claimable ? "Ready" : "Locked";

const TierList = ({
  d,
  onClaim,
  claimingKey,
  frozen,
}: {
  d: TieredDerived;
  onClaim?: (key: string) => void;
  claimingKey?: string | null;
  frozen?: boolean;
}) => (
  <div>
    {d.tiers.map((t) => {
      const u = tierUnit(t.tier);
      const amt = tierAmount(t.tier);
      const rewardColor = t.claimed ? "#6B7280" : t.claimable ? "#CFFF4A" : u === "usdc" ? "#33D6FF" : "#9AA1AC";
      return (
        <div
          key={t.key}
          className="flex items-center gap-3 border-t border-[#1D2026] py-[10px] font-display text-[13px]"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: t.reached ? "#33D6FF" : "#2B2F38", opacity: t.claimed ? 0.55 : 1 }}
          />
          <span className="flex-1 font-semibold text-[#F2F3F5]">
            {fmtTarget(t.tier.target, d.unitLabel)}
            <span className="block font-sans text-[11.5px] font-normal text-[#6B7280]">Tier {t.index + 1}</span>
          </span>
          <span
            className="font-bold"
            style={{ color: rewardColor, textDecoration: t.claimed ? "line-through" : undefined }}
          >
            ${amt} {unitLabel(u)}
          </span>
          {t.claimable && u === "voucher" && !frozen && onClaim ? (
            <ClaimButton
              onClick={() => {
                void Promise.resolve(onClaim(t.key)).catch(() => undefined);
              }}
              disabled={claimingKey === t.key}
            >
              {claimingKey === t.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Claim
            </ClaimButton>
          ) : (
            <span
              className="w-16 text-right text-[11.5px]"
              style={{ color: t.claimable ? "#CFFF4A" : "#6B7280" }}
            >
              {tierStatusWord(t, u)}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

export const TieredTaskRow = ({
  task,
  grants,
  onClaim,
  claimingKey,
  frozen,
  signedOut,
  defaultDrawerOpen = false,
}: {
  task: CampaignTaskDef;
  grants: CampaignGrant[];
  /** Style-guide fixture only — mounts the mobile tier drawer open. Never set in production. */
  defaultDrawerOpen?: boolean;
  /** Claim one voucher tier by its grant key (`<task_key>#t<n>`); awaited when claiming several. */
  onClaim: (tierKey: string) => void | Promise<void>;
  claimingKey?: string | null;
  frozen?: boolean;
  signedOut?: boolean;
}) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(defaultDrawerOpen);
  const d = deriveTiered(task, grants);
  const M = d.tiers.length;
  const notEligible = d.notEligible;
  const Icon = notEligible ? CircleSlash : (metricIcon(task) ?? TrendingUp);
  const cta = { ...fallbackCta(task), ...(task.cta ?? {}) } as { label: string; href: string };
  const unit = unitLabel(d.unit);

  const ticks: TaskRowTick[] = d.tiers.map((t) => ({
    pct: ((t.index + 1) / M) * 100,
    state: t.claimed ? "credited" : t.reached ? "reached" : "pending",
    short: fmtShort(t.tier.target),
    next: !d.allClaimed && !frozen && t.index === d.nextIdx,
    label: (
      <span>
        Tier {t.index + 1} · {fmtTarget(t.tier.target, metricUnit(task.metric))} →{" "}
        <b style={{ color: tierUnit(t.tier) === "usdc" ? "#33D6FF" : "#CFFF4A" }}>
          ${tierAmount(t.tier)} {unitLabel(tierUnit(t.tier))}
        </b>{" "}
        · {tierStatusWord(t, tierUnit(t.tier))}
      </span>
    ),
  }));

  /* ---- reward slot: line 1 = amount + unit word in the reward colour (same recipe as
     GrantTaskRow: USDC cyan / voucher lime); the state lives in the action column ---- */
  const l1 = "whitespace-nowrap font-display text-[13.5px] font-bold leading-4";
  const colour = (u: TierUnit) => (u === "usdc" ? "text-[#33D6FF]" : "text-[#CFFF4A]");
  let line1: JSX.Element;
  if (d.claimableCount > 0) {
    line1 = <div className={`${l1} text-[#CFFF4A]`}>${d.claimableSum} voucher</div>;
  } else if (d.allClaimed || frozen) {
    line1 = <div className={`${l1} ${colour(d.unit)}`}>${d.claimedSum} {unit}</div>;
  } else {
    const nx = d.tiers[d.nextIdx]?.tier;
    const u = nx ? tierUnit(nx) : d.unit;
    line1 = <div className={`${l1} ${colour(u)}`}>${nx ? tierAmount(nx) : 0} {unitLabel(u)}</div>;
  }
  const line2Text = `${d.reachedCount} / ${M} tiers`;
  const line2 = isMobile ? (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="mt-0.5 font-display text-[11.5px] text-[#6B7280]"
      data-tier-drawer-trigger
    >
      {line2Text} ›
    </button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="mt-0.5 cursor-default font-display text-[11.5px] text-[#6B7280]">{line2Text}</div>
      </TooltipTrigger>
      <TooltipContent side="left" className="w-[300px] border-[#2B2F38] bg-[#1B1E24] p-3 text-[#F2F3F5]">
        <div className="mb-1 font-display text-[12px] font-bold">Tiers</div>
        <TierList d={d} />
      </TooltipContent>
    </Tooltip>
  );

  /* ---- action slot ---- */
  let action: JSX.Element;
  const doneWord = d.unit === "usdc" ? "All credited" : "All claimed";
  if (signedOut && !frozen) {
    action = <span className="whitespace-nowrap text-[12.5px] text-[#6B7280]">Sign in to start</span>;
  } else if (notEligible) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">Not eligible</span>;
  } else if (frozen) {
    action = (
      <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">{d.allClaimed ? doneWord : "Ended"}</span>
    );
  } else if (d.claimableCount > 0) {
    // Sequential, one call per tier — a failure stops the chain, earlier tiers stay claimed.
    const claimAll = async () => {
      try {
        for (const t of d.tiers.filter((x) => x.claimable)) await onClaim(t.key);
      } catch {
        /* the page already toasted the error; stop the chain */
      }
    };
    action = (
      <ClaimButton onClick={claimAll} disabled={!!claimingKey}>
        {claimingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {d.claimableCount > 1 ? `Claim all $${d.claimableSum}` : `Claim $${d.claimableSum}`}
      </ClaimButton>
    );
  } else if (d.allClaimed) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">{doneWord}</span>;
  } else {
    action = <TaskActionButton label={cta.label} href={cta.href} />;
  }

  return (
    <>
      <TaskRowShell
        icon={Icon}
        title={task.name}
        muted={notEligible}
        dashed={notEligible}
        subtitle={notEligible ? "Covered by your friend's invite — this one goes to them." : task.subtitle}
        progress={
          notEligible ? undefined : { value: d.value, target: d.denom, pct: d.pct, ticks, unit: metricUnit(task.metric) }
        }
        reward={
          notEligible ? undefined : (
            <div className={isMobile ? "" : "w-[92px] shrink-0 text-right"}>
              {line1}
              {line2}
            </div>
          )
        }
        action={<div className={`flex items-center justify-end ${isMobile ? "" : "w-[132px] shrink-0"}`}>{action}</div>}
      />
      {isMobile && (
        <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Tiers">
          <div className="pb-5">
            <div className="mb-3 text-[12px] text-[#9AA1AC]">
              {task.name} · <b className="text-white">{fmtTarget(d.value, d.unitLabel)}</b>{d.unitLabel === "$" ? " traded" : ""}
            </div>
            <TierList d={d} onClaim={onClaim} claimingKey={claimingKey} frozen={frozen} />
          </div>
        </MobileDrawer>
      )}
    </>
  );
};
