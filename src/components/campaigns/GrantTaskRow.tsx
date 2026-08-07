import { CirclePlus, CircleSlash, Loader2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import type { CampaignTaskDef, GrantStatus } from "@/hooks/useCampaigns";
import { ClaimButton, TaskRowShell } from "./TaskRowShell";

const iconFor = (task: CampaignTaskDef, notEligible: boolean) => {
  if (notEligible) return CircleSlash;
  const key = `${task.task_key} ${task.metric ?? ""}`.toLowerCase();
  if (key.includes("volume") || key.includes("trade")) return TrendingUp;
  return CirclePlus;
};

const STATUS_LABEL: Record<GrantStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  claimable: "Ready",
  claimed: "Claimed",
  not_eligible: "Not eligible",
};

/** Fallback action when a task carries no explicit `cta`. */
const fallbackCta = (task: CampaignTaskDef): { label: string; href: string } => {
  const key = task.task_key.toLowerCase();
  if (key.includes("discord")) return { label: "Join", href: "https://discord.gg/qXssm2crf9" };
  if (key.includes("connect")) return { label: "Connect", href: "/settings" };
  const sector = task.scope?.categories?.[0];
  const href = sector ? `/events?sector=${sector}` : "/events";
  if (key.includes("share")) return { label: "Share", href };
  return { label: "Trade", href };
};

/** Secondary action button — deliberately quieter than the white Claim button. */
const TaskActionButton = ({ label, href }: { label: string; href: string }) => {
  const className =
    "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-[10px] border border-[#2B2F38] bg-transparent px-4 font-display text-[12.5px] font-semibold text-[#F2F3F5] transition-colors hover:border-[#3A3F47] md:min-h-[40px]";
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

export const GrantTaskRow = ({
  task,
  status,
  progressValue,
  onClaim,
  isClaiming,
  frozen,
  signedOut,
}: {
  task: CampaignTaskDef;
  status: GrantStatus;
  progressValue?: number;
  onClaim: () => void;
  isClaiming?: boolean;
  frozen?: boolean;
  signedOut?: boolean;
}) => {
  const voucher = task.reward?.voucher ?? 0;
  const usdc = task.reward?.usdc ?? 0;
  const notEligible = status === "not_eligible";
  const showBar =
    status === "in_progress" && typeof progressValue === "number" && typeof task.target === "number";
  const Icon = iconFor(task, notEligible);
  const cta = { ...fallbackCta(task), ...(task.cta ?? {}) } as { label: string; href: string };
  const showAction =
    !signedOut && !frozen && !notEligible && (status === "not_started" || status === "in_progress");

  return (
    <TaskRowShell
      icon={Icon}
      title={task.name}
      muted={notEligible}
      dashed={notEligible}
      subtitle={
        notEligible
          ? "Covered by your friend's invite — this one goes to them."
          : task.subtitle
      }
      progress={showBar ? { value: progressValue!, target: task.target! } : undefined}
      right={
        <>
        <div className="w-[92px] shrink-0 text-right">
          {voucher > 0 && (
            <div className="font-display text-[13.5px] font-bold text-[#CFFF4A]">${voucher} voucher</div>
          )}
          {usdc > 0 && <div className="font-display text-[13.5px] font-bold text-[#33D6FF]">${usdc} USDC</div>}
        </div>

        <div className="flex w-[132px] shrink-0 items-center justify-end">
        {signedOut ? (
          <span className="whitespace-nowrap text-[12.5px] text-[#6B7280]">Sign in to start</span>
        ) : showAction ? (
          <TaskActionButton label={cta.label} href={cta.href} />
        ) : status === "claimable" && voucher > 0 && !frozen ? (
          <ClaimButton onClick={onClaim} disabled={isClaiming}>
            {isClaiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Claim voucher
          </ClaimButton>
        ) : (
          <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">
            {status === "claimable" && usdc > 0
              ? "Credited to Standard after review"
              : STATUS_LABEL[status]}
          </span>
        )}
        </div>
        </>
      }
    />
  );
};