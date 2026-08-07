import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell, SectionTitle } from "./SectionShell";

interface Props { onCta: (section: string) => void; }

const rules = [
  ["Event 1", "First trade at or above $5K volume unlocks a random $2-$50 USDC reward."],
  ["Event 2", "Volume rebates pay the highest tier reached, up to $200 USDC."],
  ["Settlement", "Rewards are distributed daily by 18:00 UTC+8 for the previous day."],
  ["Window", "Campaign runs from May 14 to May 28, 2026."],
  ["Quality", "Only real contract trading volume counts; wash trading is excluded."],
  ["Access", "Open to invited users in eligible regions."],
];

export const KeyRules = ({ onCta }: Props) => (
  <SectionShell className="bg-mainnet-surface/30">
    <SectionTitle eyebrow="Rules" title="Compact terms for a trading campaign." desc="The important constraints are visible up front. Details remain in the FAQ for users who want the full calculation logic." />
    <div className="grid border-l border-t border-border/50 md:grid-cols-2">
      {rules.map(([label, rule]) => (
        <div key={label} className="border-b border-r border-border/50 p-4 md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mainnet-gold">{label}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">{rule}</p>
        </div>
      ))}
    </div>
    <div className="mt-8 flex justify-start">
      <Button onClick={() => onCta("rules")} className="w-full gap-2 rounded-sm bg-mainnet-gold font-mono text-background hover:bg-mainnet-gold/90 md:w-auto">
        Start Trading <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </SectionShell>
);
