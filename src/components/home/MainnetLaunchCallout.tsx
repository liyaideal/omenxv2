import { ArrowRight, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Guest-only conversion strip inserted between the first and second
 * Top Events sections on mobile home.
 *
 * Replaces the (not-yet-launched) $10 trial callout while the Mainnet
 * Launch campaign is the active acquisition hook. Visually distinct from
 * the large CampaignRail banner above so the duplicated CTA does not
 * feel redundant: compact icon + two-line copy + arrow-only CTA.
 */
export const MainnetLaunchCallout = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/mainnet-launch")}
      className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-mainnet-gold/30 bg-card px-4 py-3.5 text-left transition-colors hover:border-mainnet-gold/60 hover:bg-card-hover"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, hsl(var(--mainnet-gold) / 0.18) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-mainnet-gold/15 text-mainnet-gold">
          <Trophy className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Trade once. Earn up to $200.
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono">$5K</span> weekly pool · Mainnet Launch is live.
          </p>
        </div>
      </div>
      <span className="relative flex flex-shrink-0 items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-mainnet-gold">
        Join
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
      </span>
    </button>
  );
};
