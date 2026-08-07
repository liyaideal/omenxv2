import { CirclePlus, CircleSlash, Loader2, TrendingUp } from "lucide-react";
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
  const pct = showBar ? Math.min(100, (progressValue! / task.target!) * 100) : 0;
  const Icon = iconFor(task, notEligible);

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
        <div className="text-right">
          {voucher > 0 && (
            <div className="font-display text-[13.5px] font-bold text-[#CFFF4A]">${voucher} voucher</div>
          )}
          {usdc > 0 && <div className="font-display text-[13.5px] font-bold text-[#33D6FF]">${usdc} USDC</div>}
        </div>

        {signedOut ? (
          <span className="whitespace-nowrap text-[12.5px] text-[#6B7280]">Sign in to start</span>
        ) : status === "claimable" && voucher > 0 && !frozen ? (
          <ClaimButton onClick={onClaim} disabled={isClaiming}>
            {isClaiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Claim voucher
          </ClaimButton>
        ) : (
          <span className="whitespace-nowrap text-[12.5px] font-semibold text-[#9AA1AC]">
            {status === "claimable" && usdc > 0
              ? "Credited to Standard after review"
              : STATUS_LABEL[status]}
          </span>
        )}
        </>
      }
    />
  );
};