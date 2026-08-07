import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "./Countdown";
import coinImage from "@/assets/mainnet-coin.png";

interface HeroProps {
  onCta: (section: string) => void;
}

export const Hero = ({ onCta }: HeroProps) => {
  return (
    <section className="relative w-full max-w-full overflow-hidden px-5 pb-8 pt-6 md:px-8 md:pb-20 md:pt-14">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.12)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_74%_12%,hsl(var(--mainnet-gold)/0.16),transparent_38%)]" />

      <div className="relative mx-auto grid w-full max-w-7xl min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div className="min-w-0 space-y-5 lg:space-y-7">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="border border-mainnet-gold/30 bg-mainnet-gold/10 px-2.5 py-1 text-mainnet-gold">
              Mainnet Launch · May 14 – 28
            </span>
          </div>

          <div className="space-y-4 lg:space-y-5">
            <h1 className="max-w-3xl text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground md:text-[4.25rem] md:leading-[1] xl:text-[5rem]">
              Your first trade <span className="text-mainnet-gold">pays you back.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Hit $5K in trading volume and we'll send you USDC. Keep going and we'll send you more — up to $250 over the launch window.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={() => onCta("hero")}
              className="h-12 w-full rounded-sm border border-mainnet-gold bg-mainnet-gold px-6 font-mono text-sm font-semibold uppercase tracking-[0.08em] text-background hover:bg-mainnet-gold/90 sm:w-auto"
            >
              Claim My Bonus
              <ArrowRight className="h-4 w-4" />
            </Button>
            {/* Mobile: lightweight countdown line; Desktop: bordered pill */}
            <div className="hidden h-12 items-center gap-3 rounded-sm border border-border/60 bg-mainnet-surface/70 px-4 font-mono text-xs text-muted-foreground backdrop-blur sm:flex">
              <span className="uppercase tracking-[0.16em] text-foreground">Ends in</span>
              <Countdown compact className="text-mainnet-gold" />
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:hidden">
              <span>Ends in</span>
              <Countdown compact className="text-mainnet-gold" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 font-mono text-[11px] text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:text-xs">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-trading-green animate-pulse" />
              Live on mainnet · withdraw anytime
            </span>
            <span>Paid out every day at 18:00 UTC+8</span>
          </div>
        </div>

        {/* Desktop-only large coin in the right column */}
        <div className="relative hidden min-w-0 items-center justify-center lg:flex">
          <div
            className="relative mx-auto w-full max-w-[520px]"
            style={{ animation: "mainnet-coin-float 6s ease-in-out infinite" }}
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--mainnet-gold) / 0.35), transparent 65%)",
              }}
            />
            <img
              src={coinImage}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-[1.025] select-none opacity-90"
              style={{
                filter:
                  "blur(6px) saturate(1.1) drop-shadow(0 0 24px hsl(var(--mainnet-gold) / 0.45))",
              }}
              draggable={false}
            />
            <img
              src={coinImage}
              alt="OmenX Mainnet 2026 commemorative gold coin"
              className="pointer-events-none relative h-auto w-full select-none"
              style={{
                filter:
                  "drop-shadow(0 30px 60px hsl(var(--mainnet-gold) / 0.28)) blur(0.4px)",
              }}
              loading="eager"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mainnet-coin-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
};
