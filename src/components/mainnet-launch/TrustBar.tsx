import { BadgeDollarSign, Clock3, Network, ShieldCheck } from "lucide-react";
import { SectionShell, SectionTitle } from "./SectionShell";

const items = [
  { icon: Network, title: "Mainnet Live", body: "No more testnet. This is real. Full production environment." },
  { icon: ShieldCheck, title: "Built on Base", body: "Low gas, fast execution, verifiable on-chain." },
  { icon: BadgeDollarSign, title: "Settle in USDC", body: "Real money in, real money out. No play tokens." },
  { icon: Clock3, title: "Rewards in 24h", body: "Daily reward distribution. No waiting weeks." },
];

export const TrustBar = () => (
  <SectionShell>
    <SectionTitle
      eyebrow="Production Proof"
      title="Mainnet conditions, not campaign theater."
      desc="The launch reward is tied to real settlement rails, verifiable execution, and daily distribution timing."
    />
    <div className="grid border-l border-t border-border/50 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="border-b border-r border-border/50 bg-background/30 p-5">
          <item.icon className="mb-5 h-5 w-5 text-mainnet-gold" />
          <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </div>
  </SectionShell>
);
