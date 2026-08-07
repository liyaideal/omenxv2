import { ArrowRight, UserPlus, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell, SectionTitle } from "./SectionShell";

interface Props { onCta: (section: string) => void; }

const steps = [
  { n: "01", icon: UserPlus, title: "Sign up & deposit", body: "30-second signup. Email is enough — no KYC for the bonus." },
  { n: "02", icon: TrendingUp, title: "Trade $5K volume", body: "Any market, any leverage. Open and close adds to your volume." },
  { n: "03", icon: Wallet, title: "Get paid daily", body: "USDC shows up in your account by 18:00 UTC+8 the next day." },
];

export const HowItWorks = ({ onCta }: Props) => (
  <SectionShell id="how-it-works">
    <SectionTitle
      eyebrow="How it works"
      title="Three steps. That's it."
      desc="Sign up. Trade. Get paid in USDC."
    />

    {/* Mobile: compact numbered list */}
    <div className="overflow-hidden rounded-md border border-border/50 bg-background/30 md:hidden">
      {steps.map((step, idx) => (
        <div
          key={step.n}
          className={`grid grid-cols-[auto_1fr] gap-x-4 px-4 py-4 ${idx > 0 ? "border-t border-border/40" : ""}`}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mainnet-gold">{step.n}</span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">{step.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop: 3-column cards */}
    <div className="hidden gap-4 md:grid md:grid-cols-3">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div key={step.n} className="rounded-md border border-border/50 bg-background/30 p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mainnet-gold">{step.n}</span>
              <Icon className="h-5 w-5 text-mainnet-gold/80" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.01em] text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
          </div>
        );
      })}
    </div>

    <div className="mt-6 flex justify-start md:mt-8">
      <Button onClick={() => onCta("how_it_works")} className="w-full gap-2 rounded-sm bg-mainnet-gold font-mono text-background hover:bg-mainnet-gold/90 md:w-auto">
        Start my first trade <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </SectionShell>
);
