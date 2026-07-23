import { HedgePosterFrame } from "./HedgePosterFrame";

interface OutcomeColProps {
  accent: "blue" | "red";
  stamp: string;
  headline: string;
  body: string;
  metrics: { label: string; value: string }[];
}

const OutcomeCol = ({ accent, stamp, headline, body, metrics }: OutcomeColProps) => {
  const accentColor = accent === "blue" ? "#1D4ED8" : "#E11D48";
  return (
    <div className="relative flex h-full flex-col p-6 md:p-8">
      {/* Top color bar */}
      <div
        className="absolute left-0 right-0 top-0 h-1.5"
        style={{ background: accentColor }}
      />
      <div
        className="mb-4 inline-block self-start border-2 border-[#0E0E0E] px-3 py-1 font-poster text-xs uppercase tracking-wider text-white"
        style={{ background: accentColor }}
      >
        {stamp}
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="font-poster text-xl uppercase leading-tight tracking-tight text-[#0E0E0E] md:text-2xl">
          {headline}
        </h3>
        <p className="mt-3 text-sm leading-snug text-[#0E0E0E]/80 md:text-base">
          {body}
        </p>
      </div>

      {/* Metric chips */}
      <dl className="mt-6 space-y-2 border-t-2 border-dashed border-[#0E0E0E]/30 pt-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-baseline justify-between gap-3 font-mono text-[11px] uppercase tracking-wider md:text-xs"
          >
            <dt className="text-[#0E0E0E]/55">{m.label}</dt>
            <dd
              className="text-right font-bold text-[#0E0E0E]"
              style={{ color: accentColor }}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export const HedgeOutcomeSplit = () => {
  return (
    <div className="relative">
      {/* Shared eyebrow */}
      <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#0E0E0E]/60 md:text-xs">
        Two outcomes · one hedge
      </p>

      <HedgePosterFrame shadow="yellow" size="lg" noise>
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          {/* Vertical divider (desktop) / horizontal (mobile) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-1 -translate-y-1/2 bg-[#0E0E0E] md:left-1/2 md:right-auto md:top-0 md:block md:h-full md:w-1 md:-translate-x-1/2 md:translate-y-0"
          />
          {/* Mobile divider */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-1/2 block h-1 -translate-y-1/2 bg-[#0E0E0E] md:hidden"
          />

          {/* VS stamp at center */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#0E0E0E] bg-[#FACC15] font-poster text-sm uppercase tracking-tight text-[#0E0E0E] md:h-14 md:w-14 md:text-base"
            style={{ boxShadow: "3px 3px 0 0 #0E0E0E" }}
          >
            VS
          </div>

          <OutcomeCol
            accent="blue"
            stamp="Your pick wins"
            headline="Polymarket upside stays 100% yours."
            body="The OmenX hedge position simply closes — your main Polymarket pick is untouched."
            metrics={[
              { label: "Polymarket P&L", value: "Keep 100%" },
              { label: "OmenX hedge", value: "Closes flat" },
              { label: "From main balance", value: "0 U" },
            ]}
          />
          <OutcomeCol
            accent="red"
            stamp="Your pick misses"
            headline="The OmenX hedge cushions the miss."
            body="Your hedge moved opposite to your pick — if it closes in profit, redeem rewards under the campaign rules."
            metrics={[
              { label: "Polymarket P&L", value: "Your pick lost" },
              { label: "OmenX hedge", value: "May close in +PnL" },
              { label: "Reward cap", value: "Up to 500 U" },
            ]}
          />
        </div>
      </HedgePosterFrame>
    </div>
  );
};
