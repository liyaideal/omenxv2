import { useState } from "react";
import { ArrowRight, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { computeTotalEquity, formatEquityUsd } from "@/lib/equity";
import { cn } from "@/lib/utils";

interface HomeEquityHeroProps {
  onLogin: () => void;
  todayPnLPercent?: string;
}

/**
 * Preset D · Home KPI Hero card — minimalist variant.
 * Layout: large equity number (with hide/show eye) + right-top "Today +X%" capsule
 * + single "Deposit" CTA. No meta row.
 * Used ONLY by `/` (MobileHome). See DESIGN.md §10.
 */
export const HomeEquityHero = ({ onLogin, todayPnLPercent = "+1.9%" }: HomeEquityHeroProps) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

  const isProfit = todayPnLPercent.startsWith("+");

  if (!user) {
    return (
      <button
        onClick={onLogin}
        className="block w-full rounded-2xl border border-trading-green/30 bg-gradient-to-br from-trading-green/[0.08] via-card/40 to-card/20 px-5 pt-5 pb-5 text-left transition-colors hover:from-trading-green/[0.12]"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-trading-green">
          Welcome
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-foreground">Sign in to start trading</p>
          <ChevronRight className="h-5 w-5 text-trading-green" strokeWidth={2.5} />
        </div>
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-border/40 bg-gradient-to-br from-trading-green/[0.04] via-card/40 to-card/20 px-5 pt-5 pb-5">
      {/* Top row: label + Today % capsule */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Total equity
        </p>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold",
            isProfit
              ? "bg-trading-green/10 text-trading-green"
              : "bg-trading-red/10 text-trading-red",
          )}
        >
          Today {todayPnLPercent}
        </span>
      </div>

      {/* Number + eye toggle */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="font-mono text-[40px] font-bold tracking-tight leading-none text-foreground">
          {hidden ? "••••••" : `$${formatEquityUsd(computeTotalEquity({ spotBalance: profile?.spot_balance, balance: profile?.balance }))}`}
        </div>
        <button
          type="button"
          onClick={() => setHidden((v) => !v)}
          className="mb-1 rounded-md p-1.5 text-muted-foreground/70 transition-colors hover:bg-muted/40 hover:text-foreground"
          aria-label={hidden ? "Show balance" : "Hide balance"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Single CTA */}
      <button
        type="button"
        onClick={() => navigate("/deposit")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.99]"
      >
        Deposit
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </section>
  );
};
