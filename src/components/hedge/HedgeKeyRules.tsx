import { Check } from "lucide-react";
import { HedgePosterFrame } from "./HedgePosterFrame";

const ELIGIBILITY = [
  <>have a position size of at least <span className="font-poster">20U</span></>,
  <>have been held for at least <span className="font-poster">1 day</span>.</>,
];

const CAPS = [
  <>Up to <span className="font-poster">3 hedge positions</span> per user during the campaign.</>,
  <>
    After all hedge positions settle, up to{" "}
    <span className="font-poster text-[#E11D48]">500U in total rewards</span> per account.{" "}
    <span className="italic text-[#0E0E0E]/60">
      *Not guaranteed — depends on hedge performance and the campaign rules.
    </span>
  </>,
];

export const HedgeKeyRules = () => {
  return (
    <section className="bg-[#FDFCF0] py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mb-8 md:mb-10">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1D4ED8]">
            Eligibility & Campaign Rules
          </p>
          <h2 className="mt-2 font-poster text-3xl uppercase leading-tight tracking-tight text-[#0E0E0E] md:text-5xl">
            How to qualify.
          </h2>
        </div>

        <HedgePosterFrame shadow="blue">
          <div className="p-6 md:p-10">
            <h3 className="font-poster text-lg uppercase tracking-tight text-[#0E0E0E] md:text-xl">
              How you get a hedge position
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#0E0E0E]/80 md:text-base">
              Visit the campaign page, connect your Polymarket wallet, and
              complete signature verification to receive your first hedge
              position — a <span className="font-poster">10U Trial Position Voucher</span>.
            </p>

            <div className="mt-8 border-t-2 border-dashed border-[#0E0E0E]/20 pt-6">
              <h3 className="font-poster text-lg uppercase tracking-tight text-[#0E0E0E] md:text-xl">
                To qualify for a hedge position, a Polymarket position must:
              </h3>
              <ul className="mt-3 space-y-2.5">
                {ELIGIBILITY.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-[#0E0E0E] bg-[#FACC15]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-[#0E0E0E] md:text-base">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border-t-2 border-dashed border-[#0E0E0E]/20 pt-6">
              <h3 className="font-poster text-lg uppercase tracking-tight text-[#0E0E0E] md:text-xl">
                How we match it
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#0E0E0E]/80 md:text-base">
                If your eligible Polymarket event has a matching event on OmenX
                with at least <span className="font-poster">24 hours</span> remaining,
                we issue a hedge position for that event. If there's no matching
                event, we issue <span className="font-poster">1 default hedge position</span>.
              </p>
            </div>

            <div className="mt-8 border-t-2 border-dashed border-[#0E0E0E]/20 pt-6">
              <h3 className="font-poster text-lg uppercase tracking-tight text-[#0E0E0E] md:text-xl">
                Campaign caps
              </h3>
              <ul className="mt-3 space-y-2.5">
                {CAPS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-[#0E0E0E] bg-[#E11D48] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-[#0E0E0E] md:text-base">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </HedgePosterFrame>
      </div>
    </section>
  );
};
