import { t } from "@/i18n";
import { CircleSlash, Repeat, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import type { CampaignGrant, CampaignTaskDef } from "@/hooks/useCampaigns";
import { deriveRepeatable } from "@/hooks/useCampaigns";
import { useIsMobile } from "@/hooks/use-mobile";
import { metricIcon, fallbackCta } from "./GrantTaskRow";
import { TaskRowShell } from "./TaskRowShell";

/**
 * RepeatableTaskRow — the `type: "repeatable"` renderer (approved on the mock canvas 2026-11-12).
 *
 * A repeatable task pays its reward every time the metric grows by `target` and is never "done",
 * so the row has no progress bar and the action stays the task's CTA until the campaign ends.
 * Same TaskRowShell chrome and the same two-line reward slot as TieredTaskRow:
 *   line 1 — amount + unit word in the reward colour (USDC cyan / voucher lime / ticket gold)
 *   line 2 — how many times it has paid: `12 earned`
 * What a ticket is for is campaign copy: operators write it in the task subtitle.
 */

/** Reward colours: USDC cyan, voucher lime, ticket gold (`--mainnet-gold`). */
export const REWARD_COLOUR = { usdc: "#33D6FF", voucher: "#CFFF4A", ticket: "#FBBA23" } as const;

/** `1 ticket` / `$5 USDC` / `$5 voucher` — amount + unit word, the recipe every task row uses. */
export const rewardLabel = (unit: "ticket" | "usdc" | "voucher", amount: number) =>
  unit === "ticket"
    ? t("rewards.screen.campaign_repeatable.ticket_reward", { count: amount })
    : unit === "usdc"
      ? `$${amount} USDC`
      : `$${amount} voucher`;

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

export const RepeatableTaskRow = ({
  task,
  grants,
  frozen,
  signedOut,
  notEligible,
  notEligibleReason,
}: {
  task: CampaignTaskDef;
  grants: CampaignGrant[];
  /** Campaign ended. */
  frozen?: boolean;
  signedOut?: boolean;
  /** The entry is limited (e.g. new users only) and this account is outside it. */
  notEligible?: boolean;
  /** Subtitle shown in the not-eligible state. */
  notEligibleReason?: string;
}) => {
  const isMobile = useIsMobile();
  const d = deriveRepeatable(task, grants);
  const blocked = !!notEligible || d.notEligible;
  const Icon = blocked
    ? CircleSlash
    : (metricIcon(task) ?? (task.metric === "winning_trades" ? Trophy : Repeat));
  const cta = { ...fallbackCta(task), ...(task.cta ?? {}) } as { label: string; href: string };
  const showCount = !signedOut && !blocked;

  const reward = (
    <div className={isMobile ? "" : "w-[92px] shrink-0 text-right"}>
      <div
        className="whitespace-nowrap font-display text-[13.5px] font-bold leading-4"
        style={{ color: blocked || frozen ? "#9AA1AC" : REWARD_COLOUR[d.unit] }}
        data-reward-unit={d.unit}
      >
        {rewardLabel(d.unit, d.per)}
      </div>
      {showCount && (
        <div className="mt-0.5 whitespace-nowrap font-display text-[11.5px] tabular-nums text-[#9AA1AC]" data-repeat-earned>
          {t("rewards.screen.campaign_repeatable.earned_count", { count: d.unit === "ticket" ? d.earned : d.times })}
        </div>
      )}
    </div>
  );

  let action: JSX.Element;
  if (signedOut && !frozen) {
    action = <span className="whitespace-nowrap text-[12.5px] text-[#6B7280]">{t("rewards.screen.campaign_detail_page.sign_in_to_start")}</span>;
  } else if (blocked) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">{t("rewards.screen.campaign_detail_page.not_eligible")}</span>;
  } else if (frozen) {
    action = (
      <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">
        {t("rewards.screen.campaign_detail_page.ended")}
      </span>
    );
  } else if (d.maxed) {
    // `max_times` reached: the only way a repeatable task finishes.
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]" data-repeat-maxed>{t("common.claimed")}</span>;
  } else {
    action = <TaskActionButton label={cta.label} href={cta.href} />;
  }

  return (
    <TaskRowShell
      icon={Icon}
      title={task.name}
      muted={blocked}
      dashed={blocked}
      subtitle={blocked ? (notEligibleReason ?? task.subtitle) : task.subtitle}
      reward={reward}
      action={<div className={`flex items-center justify-end ${isMobile ? "" : "w-[132px] shrink-0"}`}>{action}</div>}
    />
  );
};
