// ============================================================
// Single source of the "what you win" explainer (RT-1, CPO-approved copy).
// Referenced by: LiteContractOrderPanel. Static copy — NEVER interpolate
// live values into it.
// ============================================================
export const WinTooltipBody = () => (
  <div className="max-w-72 space-y-2 text-left text-xs leading-relaxed">
    <div>
      <div className="font-semibold text-foreground">What you win</div>
      <p className="mt-0.5 text-muted-foreground">
        Shown after the 5% winning commission on profit. Trading fee (0.15%)
        is charged when you buy. Nothing is taken if you lose.
      </p>
    </div>
  </div>
);
