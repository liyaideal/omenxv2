import { MAINNET_REBATE_TIERS, formatUsd } from "@/lib/mainnetLaunch";

const signalRows = [62, 48, 72, 36, 58, 44, 66, 52, 80, 41, 60, 50];

export const LaunchVisual = () => {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-md border border-mainnet-gold/20 bg-mainnet-surface shadow-[0_32px_80px_hsl(var(--background)/0.35)] md:min-h-[560px]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.28)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.22)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_26%,hsl(var(--mainnet-gold)/0.14),transparent_34%),linear-gradient(180deg,hsl(var(--mainnet-surface-elevated)/0.65),hsl(var(--mainnet-surface)/0.94))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-mainnet-gold/50 to-transparent" />

      <div className="relative z-10 flex min-h-[360px] flex-col justify-between p-5 md:min-h-[560px] md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mainnet-gold/80">Launch Console</p>
            <h2 className="mt-2 font-mono text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">OX / MAINNET</h2>
          </div>
          <div className="rounded-sm border border-trading-green/30 bg-trading-green/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-trading-green">
            Live
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[0.78fr_1fr] md:items-end">
          <div className="space-y-3">
            {[
              ["campaign", "14D WINDOW"],
              ["threshold", "5K VOLUME"],
              ["reward", "$2-$50 USDC"],
            ].map(([label, value]) => (
              <div key={label} className="border-l border-mainnet-gold/30 pl-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="relative h-40 rounded-sm border border-border/50 bg-background/30 p-4 backdrop-blur md:h-56">
            <div className="absolute inset-x-4 top-1/2 h-px bg-border/70" />
            <div className="absolute bottom-4 top-4 left-[18%] w-px bg-mainnet-gold/40" />
            <div className="absolute bottom-4 top-4 left-[62%] w-px bg-mainnet-orange/30" />
            <div className="absolute left-[18%] top-5 rounded-sm border border-mainnet-gold/40 bg-mainnet-gold/10 px-2 py-1 font-mono text-[10px] text-mainnet-gold">
              5K
            </div>
            <div className="absolute left-[62%] bottom-5 rounded-sm border border-mainnet-orange/30 bg-mainnet-orange/10 px-2 py-1 font-mono text-[10px] text-mainnet-orange">
              rebate
            </div>
            <svg viewBox="0 0 420 180" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]" aria-label="Trading volume signal">
              <polyline
                points="0,132 36,118 70,126 108,82 144,92 182,54 220,74 260,40 304,58 346,28 390,44 420,30"
                fill="none"
                stroke="hsl(var(--mainnet-gold))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.92"
              />
              <polyline
                points="0,152 36,142 70,148 108,116 144,124 182,98 220,110 260,86 304,96 346,70 390,82 420,72"
                fill="none"
                stroke="hsl(var(--mainnet-orange))"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.46"
              />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 border-t border-border/50 pt-5">
          {MAINNET_REBATE_TIERS.map((tier, index) => (
            <div key={tier.volume} className="group min-w-0">
              <div className="mb-2 h-16 rounded-[2px] border border-border/50 bg-background/40 p-1.5 md:h-24">
                <div
                  className="mt-auto rounded-[1px] bg-mainnet-gold/70 transition-colors group-hover:bg-mainnet-gold"
                  style={{ height: `${signalRows[index] ?? 50}%` }}
                />
              </div>
              <p className="truncate font-mono text-[9px] text-muted-foreground md:text-[10px]">{formatUsd(tier.volume, true)}</p>
              <p className="font-mono text-[10px] font-semibold text-mainnet-gold md:text-xs">${tier.rebate}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
