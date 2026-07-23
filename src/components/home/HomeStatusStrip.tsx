import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

interface HomeStatusStripProps {
  onLogin: () => void;
  /** Today PnL, e.g. "+1.9%" or "-0.4%". Mock-friendly. */
  todayPnLPercent?: string;
}

const formatBalance = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Thin top status bar above the Home feed.
 *  - Authed: equity capsule + today PnL capsule (tap → /wallet)
 *  - Guest:  single "Sign in to trade" CTA capsule
 *
 * NOT a hero. Single line. No big number, no decorations.
 */
export const HomeStatusStrip = ({ onLogin, todayPnLPercent = "+1.9%" }: HomeStatusStripProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  if (!user) {
    return (
      <button
        onClick={onLogin}
        className="flex w-full items-center justify-between rounded-full border border-border/40 bg-card px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
      >
        <span className="text-sm font-medium text-foreground">Sign in to trade</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
      </button>
    );
  }

  const isProfit = todayPnLPercent.startsWith("+");

  return (
    <button
      onClick={() => navigate("/wallet")}
      className="flex w-full items-center justify-between gap-2 rounded-full border border-border/40 bg-card px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Equity
        </span>
        <span className="font-mono text-sm font-semibold text-foreground">
          {formatBalance(profile?.balance)}
        </span>
      </div>
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
          isProfit ? "text-trading-green" : "text-trading-red",
        )}
      >
        Today {todayPnLPercent}
      </span>
    </button>
  );
};
