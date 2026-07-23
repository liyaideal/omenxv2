import { ArrowDown, Coins, Trophy } from "lucide-react";
import { SectionShell, SectionTitle } from "./SectionShell";

const cards = [
  {
    eyebrow: "Guaranteed bonus",
    icon: Coins,
    accent: "mainnet-gold",
    actionLabel: "Step 1",
    action: "Trade your first $5K",
    actionDetail: "any market, any leverage",
    arrow: "→",
    rewardLabel: "we send you",
    reward: "$2 – $50 USDC",
    rewardDetail: "in your account by tomorrow 18:00 UTC+8",
  },
  {
    eyebrow: "Volume rebate",
    icon: Trophy,
    accent: "mainnet-orange",
    actionLabel: "Step 2",
    action: "Keep trading after that",
    actionDetail: "until May 28",
    arrow: "→",
    rewardLabel: "we send you",
    reward: "up to $200 USDC",
    rewardDetail: "the higher you go, the bigger the payout",
  },
] as const;

export const RewardSnapshot = () => (
  <SectionShell className="bg-mainnet-surface/40">
    <SectionTitle
      eyebrow="What you can earn"
      title="Two ways to get paid. Same trade."
      desc="Cross $5K in volume and we'll send you a guaranteed bonus. Keep trading and we'll keep sending more."
    />

    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const accentText = card.accent === "mainnet-gold" ? "text-mainnet-gold" : "text-mainnet-orange";
        const accentBorder = card.accent === "mainnet-gold" ? "border-mainnet-gold/30" : "border-mainnet-orange/30";
        const accentBg = card.accent === "mainnet-gold" ? "bg-mainnet-gold/10" : "bg-mainnet-orange/10";
        return (
          <div
            key={card.eyebrow}
            className={`group relative overflow-hidden rounded-md border ${accentBorder} bg-background/40 p-5 transition-colors hover:bg-background/60 md:p-8`}
          >
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border ${accentBorder} ${accentBg} px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${accentText} md:mb-6`}>
              <Icon className="h-3.5 w-3.5" />
              {card.eyebrow}
            </div>

            <div className="space-y-3.5 md:space-y-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{card.actionLabel}</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">{card.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">{card.actionDetail}</p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5" />
                {card.rewardLabel}
              </div>

              <div>
                <p className={`font-mono text-[26px] font-semibold tracking-[-0.02em] md:text-4xl ${accentText}`}>{card.reward}</p>
                <p className="mt-1 text-sm text-muted-foreground">{card.rewardDetail}</p>
              </div>
            </div>

            <a
              href="#how-it-works"
              className="mt-5 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground md:mt-7"
            >
              See the 3 steps
              <ArrowDown className="h-3 w-3" />
            </a>
          </div>
        );
      })}
    </div>
  </SectionShell>
);
