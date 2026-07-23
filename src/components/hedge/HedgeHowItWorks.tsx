import { HedgeOutcomeSplit } from "./HedgeOutcomeSplit";
import { HedgeCTAButton } from "./HedgeCTAButton";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Link your Polymarket wallet so we can read your on-chain World Cup positions.",
  },
  {
    n: "02",
    title: "Open your hedge",
    body: "Use your Trial Position Voucher to open a hedge position on OmenX, opposite to your pick.",
  },
  {
    n: "03",
    title: "Redeem",
    body: "If your hedge closes in profit, redeem rewards up to 500U under the campaign rules.",
  },
];

export const HedgeHowItWorks = () => {
  return (
    <section className="bg-[#FDFCF0] py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Title */}
        <div className="mb-8 md:mb-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1D4ED8]">
            How it works
          </p>
          <h2 className="mt-2 font-poster text-3xl uppercase leading-tight tracking-tight text-[#0E0E0E] md:text-5xl">
            A hedge for every pick.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[#0E0E0E]/80 md:text-lg">
            OmenX is running a{" "}
            <span className="font-poster uppercase">World Cup Hedge-to-Earn Campaign</span>.
            Connect your Polymarket wallet and we'll give you a{" "}
            <span className="font-poster uppercase">Trial Position Voucher</span> to open
            a hedge position on OmenX — a position that moves the opposite way
            to your Polymarket pick.
          </p>
        </div>

        {/* Unified outcome comparison */}
        <HedgeOutcomeSplit />

        {/* Reassurance */}
        <div className="mt-6 border-l-4 border-[#FACC15] bg-white/40 p-4 md:mt-8">
          <p className="text-sm font-semibold text-[#0E0E0E] md:text-base">
            Losses on the trial position won't be deducted from your main
            account balance.
          </p>
          <p className="mt-1 text-xs italic text-[#0E0E0E]/60">
            *Not guaranteed. Rewards depend on your hedge position's performance
            and the campaign reward cap.
          </p>
        </div>

        {/* 3 steps */}
        <div className="mt-12 md:mt-16">
          <h3 className="font-poster text-2xl uppercase tracking-tight text-[#0E0E0E] md:text-3xl">
            Hedge in 3 steps.
          </h3>
          <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-3 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div
                  className="inline-block -rotate-3 border-4 border-[#0E0E0E] bg-[#FACC15] px-4 py-1 font-poster text-3xl text-[#0E0E0E] md:text-4xl"
                  style={{ boxShadow: "4px 4px 0 0 #0E0E0E" }}
                >
                  {s.n}
                </div>
                <h4 className="mt-4 font-poster text-xl uppercase tracking-tight text-[#0E0E0E] md:text-2xl">
                  {s.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[#0E0E0E]/75 md:text-base">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center md:mt-10">
            <HedgeCTAButton size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
};
