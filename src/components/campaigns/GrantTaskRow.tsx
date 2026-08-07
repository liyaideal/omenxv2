import { CirclePlus, CircleSlash, Loader2, TrendingUp } from "lucide-react";
import type { CampaignTaskDef, GrantStatus } from "@/hooks/useCampaigns";

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
}: {
  task: CampaignTaskDef;
  status: GrantStatus;
  progressValue?: number;
  onClaim: () => void;
  isClaiming?: boolean;
  frozen?: boolean;
}) => {
  const voucher = task.reward?.voucher ?? 0;
  const usdc = task.reward?.usdc ?? 0;
  const notEligible = status === "not_eligible";
  const showBar =
    status === "in_progress" && typeof progressValue === "number" && typeof task.target === "number";
  const pct = showBar ? Math.min(100, (progressValue! / task.target!) * 100) : 0;
  const Icon = iconFor(task, notEligible);

  return (
    <div
      className="flex items-center gap-[14px] rounded-[14px] border p-[15px_16px]"
      style={{
        background: notEligible ? "#101216" : "#131519",
        borderColor: "#1D2026",
        borderStyle: notEligible ? "dashed" : "solid",
        borderWidth: 1,
        padding: "15px 16px",
      }}
    >
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
        style={{ background: notEligible ? "#15181D" : "#1B1E24", color: notEligible ? "#6B7280" : "#C9CED6" }}
      >
        <Icon size={17} strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="font-display text-[14px] font-bold"
          style={{ color: notEligible ? "#9AA1AC" : "#ffffff" }}
        >
          {task.name}
        </div>
        {(task.subtitle || notEligible) && (
          <div className="mt-0.5 text-[12px] text-[#9AA1AC]">
            {notEligible ? "Covered by your friend's invite — this one goes to them." : task.subtitle}
          </div>
        )}
        {showBar && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-[5px] w-full max-w-[280px] overflow-hidden rounded-full bg-[#1D2026]">
              <div className="h-full rounded-full bg-[#33D6FF]" style={{ width: `${pct}%` }} />
            </div>
            <span className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-[#9AA1AC]">
              <strong className="font-bold text-white">${progressValue}</strong> / ${task.target}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          {voucher > 0 && (
            <div className="font-display text-[13.5px] font-bold text-[#CFFF4A]">${voucher} voucher</div>
          )}
          {usdc > 0 && <div className="font-display text-[13.5px] font-bold text-[#33D6FF]">${usdc} USDC</div>}
        </div>

        {status === "claimable" && voucher > 0 && !frozen ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={isClaiming}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE] disabled:opacity-60"
          >
            {isClaiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Claim voucher
          </button>
        ) : (
          <span className="whitespace-nowrap text-[12.5px] font-semibold text-[#9AA1AC]">
            {status === "claimable" && usdc > 0
              ? "Credited to Standard after review"
              : STATUS_LABEL[status]}
          </span>
        )}
      </div>
    </div>
  );
};