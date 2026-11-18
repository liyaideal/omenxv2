// ============================================================
// Voucher call cash-out on Lite: the confirm panel and the after-close
// layer. Desktop = centred Dialog, mobile = bottom sheet (MobileDrawer).
// Spec: mock "用券之后" ⑤ (CPO 2026-11-18).
//
//  - A voucher call closes in full — no 25 / 50 / 100 chips, no slider,
//    no percentage in the copy.
//  - The panel has two states off ONE condition: closing now credits a
//    profit (credit > 0) or it does not (credit = 0, flat or down).
//  - After closing, the layer never mentions how the profit is paid out
//    (instant vs tiered) — that lives on the Voucher earnings card.
//  - The auto share poster does not open for voucher calls.
// ============================================================
import { hasVoucherProfit } from "@/lib/voucherMath";
import { t } from "@/i18n";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositionVouchers } from "@/hooks/usePositionVouchers";
import { CashOutKeepLabel, VoucherMark } from "./LiteVoucherCard";

const usd = (n: number) => `$${n.toFixed(2)}`;

/** Renders a translated sentence with the leg name highlighted on the MARKET axis. */
const LegSentence = ({
  i18nKey,
  leg,
  isYes,
}: {
  i18nKey: string;
  leg: string;
  isYes: boolean;
}) => {
  const [before, after] = t(i18nKey, { leg: "\u0000" }).split("\u0000");
  return (
    <>
      {before}
      <span className={isYes ? "font-bold text-yes" : "font-bold text-no"}>{leg}</span>
      {after}
    </>
  );
};

// ---------------------------------------------------------------
// Confirm panel body
// ---------------------------------------------------------------
export interface VoucherCashOutBodyProps {
  leg: string;
  isYes: boolean;
  credit: number;
  cap: number;
  busy?: boolean;
  onConfirm: () => void;
  onKeepOpen: () => void;
}

export const VoucherCashOutBody = ({
  leg,
  isYes,
  credit,
  cap,
  busy = false,
  onConfirm,
  onKeepOpen,
}: VoucherCashOutBodyProps) => {
  if (hasVoucherProfit(credit)) {
    return (
      <div>
        <div className="flex flex-col items-center pb-[18px] pt-1.5 text-center">
          <div className="text-[13px] text-muted-foreground">
            <LegSentence i18nKey="vouchers.lite.panel.profit_on" leg={leg} isYes={isYes} />
          </div>
          <div
            className="mt-3 font-mono text-[52px] font-bold leading-none tracking-[-0.02em] tabular-nums"
            style={{ color: "#CFFF4A" }}
          >
            +{usd(credit)}
          </div>
          <div className="mt-3 text-sm text-foreground">{t("vouchers.lite.panel.yours")}</div>
        </div>
        <div className="mb-1.5 flex items-center justify-between gap-3 border-t border-border py-3 text-[12.5px]">
          <span className="text-muted-foreground">{t("vouchers.lite.panel.keep_open_up_to")}</span>
          <span className="font-mono font-bold text-foreground">{usd(cap)}</span>
        </div>
        <Button className="h-11 w-full" disabled={busy} onClick={onConfirm}>
          <CashOutKeepLabel amount={`+${usd(credit)}`} />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center pb-4 pt-1.5 text-center">
        <div className="font-mono text-[26px] font-bold leading-[1.1] text-foreground [text-wrap:balance]">
          {t("vouchers.lite.panel.no_profit")}
        </div>
        <div className="mt-2.5 text-[13px] text-muted-foreground">
          <LegSentence i18nKey="vouchers.lite.panel.on_call" leg={leg} isYes={isYes} />
        </div>
      </div>
      <p className="mb-4 border-t border-border pt-3.5 text-center text-[12.5px] leading-normal text-muted-foreground">
        {t("vouchers.lite.panel.no_profit_body")}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="h-11 flex-1" disabled={busy} onClick={onKeepOpen}>
          {t("vouchers.lite.panel.keep_open")}
        </Button>
        <Button variant="secondary" className="h-11 flex-1" disabled={busy} onClick={onConfirm}>
          {t("vouchers.lite.panel.close_anyway")}
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// After-close body
// ---------------------------------------------------------------
export interface VoucherDoneBodyProps {
  /** What the close credited. > 0 = the profit layer, otherwise the no-profit layer. */
  credited: number;
  /** Either account can place the minimum order (floor(balance) ≥ $1). */
  funded: boolean;
  /** The user still holds a voucher to claim or redeem. */
  hasOtherVoucher: boolean;
  isMobile?: boolean;
  onDeposit: () => void;
  onBrowse: () => void;
  onVouchers: () => void;
}

export const VoucherDoneBody = ({
  credited,
  funded,
  hasOtherVoucher,
  isMobile = false,
  onDeposit,
  onBrowse,
  onVouchers,
}: VoucherDoneBodyProps) => {
  const won = hasVoucherProfit(credited);
  const art = `/assets/${isMobile ? "mobile" : "desktop"}/${won ? "empty-celebrate" : "empty-no-boost"}.png`;

  // Primary follows the account; the nudge line follows the primary.
  const primary = funded
    ? { label: t("vouchers.lite.done.browse"), onClick: onBrowse }
    : { label: t("common.deposit"), onClick: onDeposit };

  let secondary: { label: string; onClick: () => void } | null;
  if (won) secondary = { label: t("vouchers.lite.done.go_to_vouchers"), onClick: onVouchers };
  else if (hasOtherVoucher) secondary = { label: t("vouchers.lite.done.use_another"), onClick: onVouchers };
  else secondary = funded ? null : { label: t("vouchers.lite.done.browse"), onClick: onBrowse };

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        {won ? (
          <>
            <img src={art} alt="" width={120} height={124} className="h-[124px] w-[120px]" />
            <div
              className="mt-2.5 font-mono text-[46px] font-bold leading-none tracking-[-0.02em] tabular-nums"
              style={{ color: "#CFFF4A" }}
            >
              +{usd(credited)}
            </div>
            <div className="mt-2.5 text-base font-bold text-foreground">
              {t("vouchers.lite.done.profit_from")}
            </div>
            <div className="mt-1.5 text-[13px] text-muted-foreground">
              {t("vouchers.lite.done.find_it")}
            </div>
          </>
        ) : (
          <>
            <img src={art} alt="" width={150} height={95} className="h-[95px] w-[150px]" />
            <div className="mt-3.5 font-mono text-xl font-bold text-foreground [text-wrap:balance]">
              {t("vouchers.lite.done.closed")}
            </div>
            <div className="mt-1.5 text-[13px] text-muted-foreground">
              {t("vouchers.lite.done.no_profit")}
            </div>
          </>
        )}
      </div>
      <div className="mt-[18px] border-t border-border pt-3.5 text-center text-sm font-semibold leading-normal text-foreground [text-wrap:balance]">
        {funded ? t("vouchers.lite.done.nudge_funded") : t("vouchers.lite.done.nudge_deposit")}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button className="h-[46px] w-full" onClick={primary.onClick}>
          {primary.label}
        </Button>
        {secondary && (
          <Button variant="outline" className="h-[46px] w-full" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Chrome shared by both layers
// ---------------------------------------------------------------
const PanelTitle = () => (
  <span className="inline-flex items-center gap-2">
    {t("common.cash_out")}
    <VoucherMark />
  </span>
);

export const VoucherLayer = ({
  open,
  onOpenChange,
  isMobile,
  titled,
  inline,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isMobile: boolean;
  /** Confirm panel carries the "Cash out + VOUCHER" title; the after-close layer has none. */
  titled: boolean;
  /** Style-guide fixture only: draw the same chrome in the page flow instead of
   *  a portal, so several open layers can sit in one dictionary frame.
   *  Production never passes this. */
  inline?: boolean;
  children: ReactNode;
}) => {
  if (inline) {
    return isMobile ? (
      <div className="rounded-t-3xl border-t border-border bg-background px-5 pb-6 pt-4 shadow-lg">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
        {titled && (
          <div className="mb-4 text-left text-lg font-semibold text-foreground">
            <PanelTitle />
          </div>
        )}
        <div className="pb-2">{children}</div>
      </div>
    ) : (
      <div className="mx-auto grid w-full max-w-[400px] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
        {titled && (
          <div className="text-lg font-semibold leading-none tracking-tight">
            <PanelTitle />
          </div>
        )}
        {children}
      </div>
    );
  }
  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={onOpenChange} title={titled ? <PanelTitle /> : undefined}>
        <div className="pb-2">{children}</div>
      </MobileDrawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className={titled ? undefined : "sr-only"}>
          <DialogTitle>{titled ? <PanelTitle /> : t("vouchers.lite.done.closed")}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------
// Flow: confirm → close (full) → after-close layer
// Mounted = open. The host keeps it mounted until `onExit` fires, because
// the position disappears from the list as soon as it is closed while the
// after-close layer still has to show.
// ---------------------------------------------------------------
export interface LiteVoucherCashOutFlowProps {
  isMobile: boolean;
  /** airdrop_positions.id of the voucher call. */
  airdropId: string;
  leg: string;
  isYes: boolean;
  /** Live figures at the mark price. */
  credit: number;
  cap: number;
  /** The position was closed (lists should refetch). */
  onClosed?: () => void;
  /** The user left the flow — either layer was dismissed. */
  onExit: () => void;
}

export const LiteVoucherCashOutFlow = ({
  isMobile,
  airdropId,
  leg,
  isYes,
  credit,
  cap,
  onClosed,
  onExit,
}: LiteVoucherCashOutFlowProps) => {
  const navigate = useNavigate();
  const { closePosition } = useAirdropPositions();
  const { balance, spotBalance } = useUserProfile();
  const { grantedVouchers, claimedVouchers } = usePositionVouchers();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ credited: number } | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);

  const funded = Math.floor(balance ?? 0) >= 1 || Math.floor(spotBalance ?? 0) >= 1;
  const hasOtherVoucher = grantedVouchers.length + claimedVouchers.length > 0;

  const confirm = async () => {
    setBusy(true);
    try {
      const res = await closePosition(airdropId, { silent: true });
      if (!res?.ok) {
        toast.error(t("vouchers.lite.close_failed"));
        return;
      }
      setDone({ credited: res.credited });
      onClosed?.();
    } finally {
      setBusy(false);
    }
  };

  const go = (path: string) => {
    onExit();
    navigate(path);
  };

  if (depositOpen) {
    return (
      <DepositDialog
        open
        onOpenChange={(o) => {
          if (!o) onExit();
        }}
      />
    );
  }

  if (!done) {
    return (
      <VoucherLayer open onOpenChange={(o) => !o && !busy && onExit()} isMobile={isMobile} titled>
        <VoucherCashOutBody
          leg={leg}
          isYes={isYes}
          credit={credit}
          cap={cap}
          busy={busy}
          onConfirm={confirm}
          onKeepOpen={onExit}
        />
      </VoucherLayer>
    );
  }

  return (
    <VoucherLayer open onOpenChange={(o) => !o && onExit()} isMobile={isMobile} titled={false}>
      <VoucherDoneBody
        credited={done.credited}
        funded={funded}
        hasOtherVoucher={hasOtherVoucher}
        isMobile={isMobile}
        onDeposit={() => {
          if (isMobile) go("/deposit");
          else setDepositOpen(true);
        }}
        onBrowse={() => go("/events")}
        onVouchers={() => go("/vouchers")}
      />
    </VoucherLayer>
  );
};
