import { HedgeCTAButton } from "./HedgeCTAButton";
import heroPop from "@/assets/hedge-hero-v3.png.asset.json";

// Operations can edit these constants directly.
const LIVE_STATS = {
  distributed: "$47,320",
  claimed: "1,284",
  remaining: "213",
};

/**
 * Retro Football Poster hero. World Cup Hedge-to-Earn campaign.
 * Asymmetric Split Poster layout: 65% copy / 35% graphic, full-width stats strip.
 * Copy locked to OmenX_WorldCup_H2E_LandingCopy.md.
 */
export const HedgeHero = () => {
  return (
    <section className="relative bg-[#FDFCF0] py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div
          className="relative border-[4px] border-[#0E0E0E] bg-[#FDFCF0] md:border-[6px]"
          style={{ boxShadow: "12px 12px 0 0 #E11D48" }}
        >
          {/* Upper band: copy (55%) + graphic (45%) */}
          <div className="relative flex flex-col border-b-[4px] border-[#0E0E0E] md:border-b-[6px] lg:flex-row">
            {/* Left: copy column */}
            <div className="relative z-10 flex min-w-0 flex-col gap-5 p-6 md:p-10 lg:w-[55%]">
              {/* Rotated red sticker */}
              <span className="inline-flex w-fit -rotate-2 items-center gap-2 border-2 border-[#0E0E0E] bg-[#E11D48] px-4 py-1 font-poster text-xs uppercase tracking-wider text-white shadow-[4px_4px_0_0_#0E0E0E] md:text-sm">
                Special Campaign · World Cup 2026
              </span>

              <h1 className="font-poster text-4xl uppercase leading-[0.9] tracking-tight text-[#0E0E0E] md:text-6xl lg:text-7xl">
                WORLD CUP <span className="text-[#1D4ED8]">CHAOS?</span>{" "}&nbsp;
                <br />
                HEDGE IT — REDEEM UP TO <span className="text-[#E11D48]">500U</span>.
              </h1>

              <p className="max-w-xl border-l-4 border-[#FACC15] pl-4 text-lg font-semibold leading-snug text-[#0E0E0E]/80 md:text-xl">
                Connect your Polymarket wallet, claim a hedge that moves opposite your pick,
                and redeem rewards if it closes in profit.
                <sup className="ml-0.5 text-xs text-[#E11D48]">*</sup>
              </p>

              <p className="-mt-3 text-[11px] italic text-[#0E0E0E]/60">
                *Rewards not guaranteed — see campaign rules.
              </p>

              <div className="mt-2">
                <HedgeCTAButton size="lg" />
              </div>
            </div>

            {/* Right: retro football graphic */}
            <div
              className="relative hidden items-center justify-center bg-[#FDFCF0] lg:flex lg:w-[45%]"
              aria-label="OMENX World Cup Hedge-to-Earn campaign — hedge your Polymarket prediction position"
            >
              <img
                src={heroPop.url}
                alt="Soccer ball with red, yellow, and blue arrows — World Cup hedge motion"
                className="relative z-10 h-full w-full object-contain object-center"
                style={{
                  filter:
                    "drop-shadow(0 0 0.5px #FDFCF0) drop-shadow(0 0 0.5px #FDFCF0) drop-shadow(0 1px 2px rgba(14,14,14,0.08))",
                }}
                loading="eager"
              />
            </div>
          </div>

          {/* Lower band: full-width stats strip */}
          <div className="grid grid-cols-3 divide-x-2 divide-white/10 bg-[#0E0E0E] text-white">
            <Stat value={LIVE_STATS.distributed} label="Distributed" tone="yellow" />
            <Stat value={LIVE_STATS.claimed} label="Users claimed" tone="red" />
            <Stat value={LIVE_STATS.remaining} label="Spots left today" tone="white" />
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "yellow" | "red" | "white";
}) => {
  const color =
    tone === "yellow" ? "text-[#FACC15]" : tone === "red" ? "text-[#E11D48]" : "text-white";
  return (
    <div className="px-3 py-4 text-center md:px-6 md:py-5 md:text-left">
      <div className={`font-poster text-xl md:text-3xl ${color}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-400 md:text-[10px]">
        {label}
      </div>
    </div>
  );
};
