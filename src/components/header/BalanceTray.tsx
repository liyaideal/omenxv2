import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { t } from "@/i18n";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { computeTotalEquity, formatEquityUsd } from "@/lib/equity";

/**
 * Desktop header balance tray (CPO 2026-11-13, deposit-ux ①, canvas A1 + tone ②).
 * One muted tray: wallet icon + balance (Standard + Boost, white, → /wallet,
 * hover card = `hoverCard`) and an always-on Deposit (brand gradient, opens the
 * Deposit dialog in place, no account pre-select). No label at any width.
 * Below xl the paddings tighten (the header also drops the username there) so
 * the nav never wraps or slides under the tray.
 * Pure props → the style guide mounts this same component signed-in.
 */
export const BalanceTray = ({
  spotBalance,
  balance,
  hoverCard,
  compact = false,
}: {
  spotBalance: number;
  balance: number;
  hoverCard?: React.ReactNode;
  /** Trade pages (header also carries the Lite/Pro switch): icon only from xl up. */
  compact?: boolean;
}) => {
  const navigate = useNavigate();
  const [depositOpen, setDepositOpen] = useState(false);
  const amount = `$${formatEquityUsd(computeTotalEquity({ spotBalance, balance }))}`;
  const balanceButton = (
    <button
      type="button"
      onClick={() => navigate("/wallet")}
      aria-label={`${t("common.equity")} ${amount}`}
      className="flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg px-2 transition-colors hover:bg-muted xl:px-2.5"
    >
      <Wallet className={`hidden h-4 w-4 shrink-0 text-muted-foreground ${compact ? "xl:block" : "lg:block"}`} strokeWidth={1.75} aria-hidden />
      <span className="font-mono text-sm font-bold text-foreground">{amount}</span>
    </button>
  );
  return (
    <div className="flex h-10 flex-shrink-0 items-center gap-0.5 rounded-[10px] bg-muted/70 p-[3px]">
      {hoverCard ? (
        <HoverCard openDelay={120} closeDelay={100}>
          <HoverCardTrigger asChild>{balanceButton}</HoverCardTrigger>
          <HoverCardContent align="end" className="w-[260px] p-3">
            {hoverCard}
          </HoverCardContent>
        </HoverCard>
      ) : (
        balanceButton
      )}
      <button
        type="button"
        onClick={() => setDepositOpen(true)}
        className="h-[34px] whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 xl:px-3.5"
        style={{ background: "var(--gradient-button-primary)" }}
      >
        {t("common.deposit")}
      </button>
      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
};
