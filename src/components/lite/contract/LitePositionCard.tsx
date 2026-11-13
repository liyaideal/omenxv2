// ============================================================
// "Your call" card on the Lite contract page. Pure presentational — every
// figure is passed in, so the style-guide playground can drive all states.
// MONEY axis (trading-green/red) is used for profit only; MARKET axis
// (yes/no) only for the side identity in the header.
// ============================================================
import { t } from "@/i18n";
import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareIconButton } from "@/components/lite/share/ShareIconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoCloseTooltipBody } from "@/components/lite/shared/AutoCloseTooltipBody";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

interface Props {
  sideLabel: string;
  isYes: boolean;
  boost: number;
  putIn: number;
  nowWorth: number;
  profit: number;
  /** Explainer behind the Profit ⓘ (why it starts below $0 right after buying). */
  profitNote?: string;
  /** Style-guide fixture only: render the Profit ⓘ explainer already open.
   *  Production never passes this. */
  profitNoteOpen?: boolean;
  autoCloseText: string;
  /** Optional sub-line under the auto-close value. */
  autoCloseSub?: string;
  /** Price is within 10% of the auto-close level — render the value in red. */
  autoCloseHot?: boolean;
  compact?: boolean;
  /** When set, the Cash out button is disabled and shows this note instead. */
  cashOutDisabledText?: string;
  /** Style-guide fixture only (TR-12): mark the leg as voucher-funded.
   *  Production never passes this — pure display, no logic attached. */
  voucherTag?: boolean;
  onCashOut: () => void;
  /** Pure-display share entry (SH-b §1). Omitted = zero DOM change. */
  onShare?: () => void;

}

export const LitePositionCard = ({
  sideLabel,
  isYes,
  boost,
  putIn,
  nowWorth,
  profit,
  profitNote,
  profitNoteOpen,
  autoCloseText,
  autoCloseSub,
  autoCloseHot = false,
  compact = false,
  cashOutDisabledText,
  voucherTag = false,
  onCashOut,
  onShare,
}: Props) => {
  const heading = (
    <>
      <span className={isYes ? "text-yes" : "text-no"}>{sideLabel}</span>
      {boost > 1 && (
        <span className="text-foreground">
          {" · "}
          <span className="font-mono">{boost}×</span> {t("trade.screen.lite.lite_contract_account_sections.boost")}
        </span>
      )}
      {voucherTag && (
        <span className="text-foreground">
          {" · "}
          <span style={{ color: "#CFFF4A" }}>{t("portfolio.lite.live.voucher")}</span>
        </span>
      )}
    </>
  );

  return (
  <div className="rounded-2xl border border-border bg-card p-4">
    {onShare ? (
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{heading}</div>
        <ShareIconButton onClick={onShare} />
      </div>
    ) : (
      <div className="mb-3 text-sm font-semibold">{heading}</div>
    )}

    <div
      className={cn(
        "grid gap-2 border-t border-border pt-3 text-xs",
        compact ? "grid-cols-2" : "grid-cols-4",
      )}
    >
      <PosCell label={t("common.put_in")} value={`$${putIn.toFixed(2)}`} />
      <PosCell label={t("common.now_worth")} value={`$${nowWorth.toFixed(2)}`} />
      <PosCell
        label={t("trade.screen.lite.lite_contract_sections.profit")}
        value={`${profit >= 0 ? "+" : "−"}$${Math.abs(profit).toFixed(2)}`}
        tone={profit >= 0 ? "up" : "down"}
        labelExtra={
          profitNote ? (
            <InfoTip
              label={t("trade.screen.lite.winloss.about_profit")}
              title={t("trade.screen.lite.lite_contract_sections.profit")}
              mobile={compact}
              forceOpen={profitNoteOpen}
              contentClassName="max-w-72 p-3 text-xs normal-case tracking-normal leading-relaxed text-muted-foreground"
            >
              {profitNote}
            </InfoTip>
          ) : undefined
        }
      />
      <PosCell
        label={compact ? "Auto-close" : "Est. auto-close"}
        value={autoCloseText}
        sub={autoCloseSub}
        tone={autoCloseHot ? "down" : undefined}
        labelExtra={
          <InfoTip
            label={t("trade.screen.lite.lite_contract_order_panel.about_auto_close")}
            title={compact ? "Auto-close" : "Est. auto-close"}
            mobile={compact}
            contentClassName="p-3"
          >
            <AutoCloseTooltipBody />
          </InfoTip>
        }
      />
    </div>
    <div className="mt-3 border-t border-border pt-3">
      {cashOutDisabledText ? (
        <>
          <button
            type="button"
            disabled
            className="h-9 w-full rounded-lg bg-muted text-xs font-semibold opacity-50"
          >
            Cash out · <span className="font-mono">${nowWorth.toFixed(2)}</span>
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">{cashOutDisabledText}</p>
        </>
      ) : (
        <button
          type="button"
          onClick={onCashOut}
          className="h-9 w-full rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80"
        >
          Cash out · <span className="font-mono">${nowWorth.toFixed(2)}</span>
        </button>
      )}
    </div>

  </div>
  );
};


/**
 * ⓘ explainer: hover tooltip on desktop; on mobile a tap opens a bottom sheet
 * (tooltips never open on touch — 2026-11-13 cross-review).
 */
const InfoTip = ({
  label,
  title,
  mobile,
  forceOpen,
  contentClassName,
  children,
}: {
  label: string;
  title: string;
  mobile: boolean;
  /** Style-guide fixture only. */
  forceOpen?: boolean;
  contentClassName?: string;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const trigger = (
    <button
      type="button"
      aria-label={label}
      onClick={mobile ? () => setOpen(true) : undefined}
      className={mobile ? "-m-2 p-2" : undefined}
    >
      <Info className="w-3 h-3 cursor-help" />
    </button>
  );
  if (mobile) {
    return (
      <>
        {trigger}
        <MobileDrawer open={open || !!forceOpen} onOpenChange={setOpen} title={title}>
          <div className="pb-6 text-[13px] normal-case tracking-normal leading-relaxed text-muted-foreground">
            {children}
          </div>
        </MobileDrawer>
      </>
    );
  }
  return (
    <Tooltip {...(forceOpen ? { open: true } : {})}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent className={contentClassName}>{children}</TooltipContent>
    </Tooltip>
  );
};

const PosCell = ({
  label,
  value,
  tone,
  sub,
  labelExtra,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  sub?: string;
  /** Optional node rendered right after the label (e.g. explainer tooltip). */
  labelExtra?: ReactNode;
}) => (
  <div>
    <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
      {labelExtra}
    </div>
    <div
      className={cn(
        "font-mono text-sm font-semibold",
        tone === "up"
          ? "text-trading-green"
          : tone === "down"
            ? "text-trading-red"
            : "text-foreground",
      )}
    >
      {value}
    </div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

export default LitePositionCard;