import { t } from "@/i18n";
// ============================================================
// Single source of the "what you win" explainer (RT-1, CPO-approved copy).
// Referenced by: LiteContractOrderPanel. Static copy — NEVER interpolate
// live values into it.
// ============================================================
/** `body` — the Lite contract card's own wording (its win is after the
 *  entry fee too, CTO 2026-11-16); every other surface keeps the default. */
export const WinTooltipBody = ({ body }: { body?: string } = {}) => (
  <div className="max-w-72 space-y-2 text-left text-xs leading-relaxed">
    <div>
      <div className="font-semibold text-foreground">{t("common.what_you_win")}</div>
      <p className="mt-0.5 text-muted-foreground">
        {body ?? (
          <>
            Shown after the 5% winning commission on profit. Trading fee (0.15%)
            is charged when you buy. Nothing is taken if you lose.
          </>
        )}
      </p>
    </div>
  </div>
);
