import { useState } from "react";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { GrantTaskRow } from "@/components/campaigns/GrantTaskRow";
import type { CampaignTaskDef, GrantStatus } from "@/hooks/useCampaigns";
import { cn } from "@/lib/utils";

/**
 * Rewards mobile task rows — playground.
 * Enumerates every visual state of the shared TaskRowShell recipe used by
 * campaign grants and referral invites. Mobile (<768px) renders the two-layer
 * stack; desktop keeps the three-column row.
 */

const baseTask: CampaignTaskDef = {
  task_key: "trade_volume_macro",
  name: "Trade $500 on Macro markets",
  subtitle: "Any Macro market counts.",
  target: 500,
  metric: "usd_volume",
  reward: { voucher: 10 },
  scope: { categories: ["macro"] },
};

type PresetId =
  | "not_started"
  | "in_progress"
  | "claimable"
  | "claimed"
  | "not_eligible"
  | "signed_out"
  | "usdc_review";

const PRESETS: {
  id: PresetId;
  label: string;
  status: GrantStatus;
  progressValue?: number;
  signedOut?: boolean;
  task?: Partial<CampaignTaskDef>;
}[] = [
  { id: "not_started", label: "Not started", status: "not_started" },
  { id: "in_progress", label: "In progress", status: "in_progress", progressValue: 180 },
  { id: "claimable", label: "Claimable", status: "claimable" },
  { id: "claimed", label: "Claimed", status: "claimed" },
  { id: "not_eligible", label: "Not eligible", status: "not_eligible" },
  { id: "signed_out", label: "Signed out", status: "not_started", signedOut: true },
  {
    id: "usdc_review",
    label: "USDC · under review",
    status: "claimable",
    task: { name: "Invite a friend who trades", reward: { usdc: 5 }, task_key: "referral_qualified" },
  },
];

export const RewardsMobileSection = ({ isMobile }: { isMobile: boolean }) => {
  const [active, setActive] = useState<PresetId>("in_progress");
  const preset = PRESETS.find((p) => p.id === active)!;
  const task = { ...baseTask, ...(preset.task ?? {}) };

  return (
    <SectionWrapper
      id="rewards-mobile"
      title="Rewards · mobile task rows"
      platform="lite"
      description="One row recipe (TaskRowShell) for campaign grants and referral invites. Mobile stacks it into two layers: icon + copy + full-width progress, hairline divider, then reward left / 44px action right."
    >
      <div className="space-y-8">
        <SubSection
          title="State playground"
          description="Every state a task row can render. Switch the preset and resize to compare mobile vs desktop."
        >
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active === p.id
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-[420px] rounded-2xl bg-[#0A0B0D] p-4">
            <GrantTaskRow
              task={task}
              status={preset.status}
              progressValue={preset.progressValue}
              signedOut={preset.signedOut}
              onClaim={() => {}}
            />
          </div>
        </SubSection>

        <SubSection title="All states at once" description="Regression board — every row must keep reward and action columns aligned.">
          <div className="mx-auto w-full max-w-[560px] space-y-2.5 rounded-2xl bg-[#0A0B0D] p-4">
            {PRESETS.map((p) => (
              <GrantTaskRow
                key={p.id}
                task={{ ...baseTask, ...(p.task ?? {}) }}
                status={p.status}
                progressValue={p.progressValue}
                signedOut={p.signedOut}
                onClaim={() => {}}
              />
            ))}
          </div>
        </SubSection>

        <SubSection title="Rules" description="">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Mobile: no fixed reward/action widths — the divider row handles alignment.</li>
            <li>Desktop: reward column w-[92px] right-aligned, action column w-[132px] justified end.</li>
            <li>Action buttons keep a 44px minimum touch target on mobile (40px desktop).</li>
            <li>Status words only appear when there is no action to take; otherwise the CTA wins.</li>
            <li>{isMobile ? "Currently rendering the mobile stack." : "Currently rendering the desktop row."}</li>
          </ul>
        </SubSection>
      </div>
    </SectionWrapper>
  );
};
