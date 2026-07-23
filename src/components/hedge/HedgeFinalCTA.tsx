import { HedgeCTAButton } from "./HedgeCTAButton";
import { HedgePosterFrame } from "./HedgePosterFrame";

const CAMPAIGN_END = "Jul 19, 2026";

export const HedgeFinalCTA = () => {
  return (
    <section className="bg-[#FDFCF0] py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <HedgePosterFrame shadow="red">
          <div className="relative p-8 text-center md:p-14">
            <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
              <div className="absolute -right-10 -top-10 h-48 w-48 rotate-12 bg-[#1D4ED8]" />
              <div className="absolute -bottom-10 -left-10 h-48 w-48 -rotate-12 bg-[#FACC15]" />
            </div>

            <span className="relative z-10 mb-4 inline-block -rotate-2 border-2 border-[#0E0E0E] bg-[#E11D48] px-3 py-1 font-poster text-xs uppercase tracking-wider text-white">
              Open Now
            </span>

            <h2 className="relative z-10 mx-auto max-w-3xl font-poster text-3xl uppercase leading-tight tracking-tight text-[#0E0E0E] md:text-5xl">
              Give your pick a hedge —{" "}
              <span className="text-[#1D4ED8]">redeem up to 500U</span>.
            </h2>

            <div className="relative z-10 mt-8 flex justify-center">
              <HedgeCTAButton size="lg" />
            </div>

            <p className="relative z-10 mt-6 font-mono text-xs uppercase tracking-widest text-[#0E0E0E]/60">
              Campaign runs through the World Cup · Ends {CAMPAIGN_END}
            </p>
          </div>
        </HedgePosterFrame>

        {/* Disclaimer */}
        <div className="mt-6 border-2 border-[#0E0E0E]/20 bg-white/40 p-4 md:p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0E0E0E]/60">
            Disclaimer
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#0E0E0E]/70 md:text-[13px]">
            A Trial Position Voucher is not cash and is not withdrawable. It can
            only be used to open a trial hedge position. Rewards are not
            guaranteed and depend on your hedge position's performance and the
            campaign rules. Trial positions may be automatically closed due to
            liquidation, max holding time, settlement cutoff, market status
            changes, or risk controls. Trading outcomes involves risk.
          </p>
        </div>
      </div>
    </section>
  );
};
