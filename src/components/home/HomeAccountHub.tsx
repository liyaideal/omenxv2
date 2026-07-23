import { TrendingUp, LineChart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const GuestWelcomeCard = ({ onLogin }: { onLogin: () => void }) => {
  const features = [
    { icon: TrendingUp, label: "Up to 10x leverage", desc: "Amplify your positions", color: "text-trading-green", bgColor: "bg-trading-green/15" },
    { icon: LineChart, label: "Pro trading tools", desc: "Charts, orderbook & more", color: "text-primary", bgColor: "bg-primary/15" },
    { icon: Sparkles, label: "Trending events", desc: "Crypto, sports, politics & pop culture", color: "text-trading-yellow", bgColor: "bg-trading-yellow/15" },
  ];
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Trade the future</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Predict outcomes. Maximize returns.</p>
      </div>
      <div className="space-y-1.5">
        {features.map((f, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-lg p-2">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${f.bgColor}`}>
              <f.icon className={`h-4 w-4 ${f.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground">{f.label}</div>
              <div className="text-[11px] text-muted-foreground truncate">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <Button className="w-full bg-trading-green hover:bg-trading-green/90 text-white font-medium h-10" onClick={onLogin}>
        Start trading
      </Button>
    </div>
  );
};

interface HomeAccountHubProps {
  onLogin: () => void;
}

/**
 * Post-Preset-D refactor: account balance lives in HomeEquityHero,
 * activation/airdrop/campaign live in their own three-layer stack
 * (HomeOnboardingStrip + HomeAirdropStrip + CampaignBannerCarousel).
 * This component now only renders the guest welcome card. Returns null for authenticated users.
 */
export const HomeAccountHub = ({ onLogin }: HomeAccountHubProps) => {
  const { user } = useAuth();
  if (user) return null;
  return <GuestWelcomeCard onLogin={onLogin} />;
};
