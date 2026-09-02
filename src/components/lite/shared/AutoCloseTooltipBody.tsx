// ============================================================
// Single source of the auto-close explainer (AC-TT1, CPO-approved copy).
// Referenced by: LiteContractOrderPanel, LitePositionCard, LiveCards
// (desktop row). Static copy — NEVER interpolate live values into it;
// the "≈ 62¢" token is an illustrative sample, part of the frozen copy.
// ============================================================
export const AutoCloseTooltipBody = () => (
  <div className="max-w-72 space-y-2 text-left text-xs leading-relaxed">
    <div>
      <div className="font-semibold text-foreground">Auto-close</div>
      <p className="mt-0.5 text-muted-foreground">
        If your account runs low, Boost calls are closed automatically at this
        price to protect your remaining balance.
      </p>
    </div>
    <div className="flex items-start gap-2">
      <span className="shrink-0 rounded-md border border-border bg-muted/40 px-1.5 font-mono text-[11px] font-bold text-foreground">
        ≈ 62¢
      </span>
      <p className="text-muted-foreground">
        The estimated auto-close price for this call. It's worked out across
        your whole account, so it shifts as your other positions move.
      </p>
    </div>
    <div className="flex items-start gap-2">
      <span className="shrink-0 rounded-md border border-border bg-muted/40 px-1.5 font-mono text-[11px] font-bold text-muted-foreground">
        None
      </span>
      <p className="text-muted-foreground">
        This call can't be auto-closed — it's 1× (nothing borrowed), or prices
        only move between 0¢ and 100¢ and the line can't be reached. The most
        you can lose is what you put in.
      </p>
    </div>
  </div>
);
