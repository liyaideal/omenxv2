import { Check, Circle, Loader2, Sparkles } from "lucide-react";
import type { CampaignTaskDef, GrantStatus } from "@/hooks/useCampaigns";

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

  return (
    <div className="border-b border-[#1D2026] px-4 py-3.5 last:border-b-0" style={{ opacity: notEligible ? 0.5 : 1 }}>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#1B2027]">
          {status === "claimed" ? (
            <Check className="h-4 w-4 text-[#CFFF4A]" />
          ) : status === "claimable" ? (
            <Sparkles className="h-4 w-4 text-[#CFFF4A]" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-[#6B7280]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-[#F2F3F5]">{task.name}</div>
          {task.subtitle && <div className="mt-0.5 text-[11.5px] text-[#9AA1AC]">{task.subtitle}</div>}
          {showBar && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-[4px] w-full max-w-[180px] overflow-hidden rounded-full bg-[#1A1D22]">
                <div className="h-full rounded-full bg-[#33D6FF]" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-display text-[11px] text-[#9AA1AC]">
                ${progressValue} / ${task.target}
              </span>
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          {voucher > 0 && <div className="font-display text-[13px] font-bold text-[#CFFF4A]">${voucher}</div>}
          {usdc > 0 && <div className="font-display text-[13px] font-bold text-[#33D6FF]">+${usdc}</div>}

          <div className="mt-1.5">
            {status === "claimable" && voucher > 0 && !frozen && (
              <button
                type="button"
                onClick={onClaim}
                disabled={isClaiming}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] bg-white px-3 text-[12.5px] font-semibold text-[#06080A] disabled:opacity-60"
              >
                {isClaiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Claim voucher
              </button>
            )}
            {status === "claimable" && voucher === 0 && usdc > 0 && (
              <span className="text-[11px] text-[#9AA1AC]">Credited to Standard after review</span>
            )}
            {status === "claimed" && <span className="text-[11px] text-[#6B7280]">Claimed</span>}
            {status === "in_progress" && <span className="text-[11px] text-[#9AA1AC]">In progress</span>}
            {status === "not_started" && <span className="text-[11px] text-[#6B7280]">Not started</span>}
          </div>
        </div>
      </div>

      {notEligible && (
        <div className="mt-2.5 rounded-[8px] bg-[#16191E] px-3 py-2 text-[11.5px] text-[#9AA1AC]">
          Covered by your friend's invite — this one goes to them
        </div>
      )}
    </div>
  );
};