// Two-layer infographic — ticker = "what happened", ledger = "how bad".
// Numbers & match data pending business verification.

const UPSETS_TICKER = [
  { fav: "Spain", score: "0–0", under: "Cape Verde", tag: "Draw" },
  { fav: "Brazil", score: "1–1", under: "Morocco", tag: "Stopped" },
  { fav: "Belgium", score: "1–1", under: "Egypt", tag: "Tied" },
  { fav: "Netherlands", score: "2–2", under: "Japan", tag: "Held" },
] as const;

const LEDGER_STATS = [
  { label: "Value wiped", value: "$8.2M", note: "in losing Yes shares" },
  { label: "Holders underwater", value: "4,382", note: "wallets in losing Yes positions" },
  { label: "Price crash", value: "$0.92 → $0.04", note: "Brazil Yes, in 90 minutes" },
] as const;


const UpsetsTicker = () => {
  const items = [...UPSETS_TICKER, ...UPSETS_TICKER];
  return (
    <div
      className="relative h-10 overflow-hidden border-y-2 border-[#0E0E0E] bg-[#0E0E0E]"
      role="marquee"
      aria-label="Recent World Cup upsets"
    >
      <div className="flex h-full w-max animate-[hedge-ticker_40s_linear_infinite] items-center gap-10 pr-10">
        {items.map((u, i) => (
          <span
            key={`${u.fav}-${i}`}
            className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#FACC15] whitespace-nowrap"
          >
            <span className="mr-3 text-[#FACC15]/70">✱</span>
            <span className="mr-3">{u.tag}</span>
            <span className="text-white/90">{u.fav}</span>
            <span className="mx-2 text-[#FACC15]">{u.score}</span>
            <span className="text-white/90">{u.under}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const ConsequenceLedger = () => (
  <div className="border-y-2 border-[#0E0E0E]">
    {LEDGER_STATS.map((row, i) => (
      <div
        key={row.label}
        className={`grid grid-cols-1 gap-1 py-4 md:grid-cols-[200px_1fr_1fr] md:items-baseline md:gap-6 md:py-5 ${
          i < LEDGER_STATS.length - 1 ? "border-b border-[#0E0E0E]/15" : ""
        }`}
      >
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#E11D48]">
          <span className="mr-2 text-[#E11D48]/60">──</span>
          {row.label}
        </div>
        <div className="font-poster text-3xl leading-none tracking-tight text-[#1D4ED8] md:text-5xl">
          {row.value}
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-[#0E0E0E]/60 md:text-right">
          {row.note}
        </div>
      </div>
    ))}
  </div>
);

export const HedgeUpsetsStrip = () => {
  return (
    <section className="bg-[#FDFCF0] py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#E11D48]">
            This World Cup is an upset machine
          </p>
          <h2 className="mt-2 max-w-3xl font-poster text-3xl uppercase leading-tight tracking-tight text-[#0E0E0E] md:text-5xl">
            Every upset wipes out another wave of Polymarket positions.
          </h2>
        </div>

        <UpsetsTicker />
        <div className="h-6 md:h-8" />
        <ConsequenceLedger />

        <p className="mt-8 max-w-2xl text-base font-semibold text-[#0E0E0E]/80 md:text-lg">
          One wrong call and your whole position can go to zero.{" "}
          <span className="bg-[#FACC15] px-1 font-poster uppercase">
            This time, give your pick a hedge.
          </span>
        </p>
        <p className="mt-2 text-[11px] italic text-[#0E0E0E]/50">
          Stats &amp; match data pending business verification.
        </p>
      </div>
    </section>
  );
};
