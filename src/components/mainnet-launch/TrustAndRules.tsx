import { BadgeDollarSign, Clock3, Network, ShieldCheck } from "lucide-react";
import { SectionShell, SectionTitle } from "./SectionShell";

const trust = [
  { icon: Network, title: "Mainnet live", body: "Real production environment. No testnet, no play tokens." },
  { icon: ShieldCheck, title: "Built on Base", body: "Low gas, fast execution, on-chain verifiable." },
  { icon: BadgeDollarSign, title: "Settles in USDC", body: "Real money in, real money out. Withdraw anytime." },
  { icon: Clock3, title: "Daily payouts", body: "Rewards land within 24h, not weeks later." },
];

const rules = [
  ["Volume", "Open + close amounts on contract markets. Spot and fiat deposits don't count."],
  ["Payout time", "Every day by 18:00 UTC+8 for yesterday's volume."],
  ["Highest tier", "Rebates pay the top tier reached, not the sum of every tier."],
  ["Fair play", "We screen out self-matching and bot-like patterns. Trade normally and you're fine."],
];

export const TrustAndRules = () => (
  <SectionShell>
    <SectionTitle
      eyebrow="Why you can trust this"
      title="Real money. Clear terms."
      desc="Real USDC, paid from our marketing budget. Here's exactly how it works."
    />

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border/50 bg-border/40 sm:grid-cols-2">
        {trust.map((item) => (
          <div key={item.title} className="bg-background/40 p-5">
            <item.icon className="mb-4 h-5 w-5 text-mainnet-gold" />
            <h3 className="mb-1 text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-border/50 bg-background/30">
        {rules.map(([label, body]) => (
          <div key={label} className="grid grid-cols-1 gap-1 border-b border-border/40 px-5 py-4 last:border-b-0 md:grid-cols-[120px_1fr] md:gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mainnet-gold">{label}</p>
            <p className="text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  </SectionShell>
);
