import { useState } from "react";
import { Gift, Ticket, Clock, Zap, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import { useEventSideLabelsLookup } from "@/hooks/useEventSideLabelsLookup";
import { ActivateAirdropButton } from "@/components/ActivateAirdropButton";
import type { AirdropPosition } from "@/hooks/useAirdropPositions";


interface AirdropPositionCardProps {
  airdrop: AirdropPosition;
  onActivate?: (id: string) => Promise<void>;
  isActivating?: boolean;
  onClose?: (id: string) => Promise<void>;
}

export const AirdropPositionCard = ({ airdrop, onActivate, isActivating, onClose }: AirdropPositionCardProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const { timeLeft, isExpired, urgent } = useCountdown(airdrop.expiresAt);
  const sideLabelsLookup = useEventSideLabelsLookup();
  const { isBinary: counterIsBinary, labels: counterSideLabels } = sideLabelsLookup(airdrop.counterEventName ?? "");


  const isPending = airdrop.status === "pending";
  const isActivated = airdrop.status === "activated";
  const isExpiredStatus = airdrop.status === "expired";
  const isSettled = airdrop.status === "settled";

  const statusConfig = {
    pending: {
      bg: "bg-trading-yellow/10",
      border: "border-trading-yellow/30",
      badgeBg: "bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30",
      label: "Pending Activation",
    },
    activated: {
      bg: "bg-trading-green/10",
      border: "border-trading-green/30",
      badgeBg: "bg-trading-green/20 text-trading-green border-trading-green/30",
      label: "Activated",
    },
    expired: {
      bg: "bg-muted/30",
      border: "border-border",
      badgeBg: "bg-muted text-muted-foreground border-border",
      label: "Expired",
    },
    settled: {
      bg: "bg-primary/5",
      border: "border-primary/30",
      badgeBg: "bg-primary/20 text-primary border-primary/30",
      label: "Settled",
    },
  };

  const config = statusConfig[airdrop.status as keyof typeof statusConfig] || statusConfig.expired;

  const settlementLabel = airdrop.settlementTrigger === "event_resolved" 
    ? "Resolved" 
    : airdrop.settlementTrigger === "source_closed" 
    ? "Closed" 
    : null;

  const isWelcomeGift = airdrop.source === "welcome_gift";
  const isVoucher = airdrop.source === "voucher";

  return (
    <div className={`rounded-xl p-3 border ${config.bg} ${config.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isVoucher ? (
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 gap-1">
              <Ticket className="w-3 h-3" />
              VOUCHER
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 gap-1">
              <Gift className="w-3 h-3" />
              AIRDROP
            </Badge>
          )}
          {isWelcomeGift && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-trading-green/10 text-trading-green border-trading-green/30">
              WELCOME GIFT
            </Badge>
          )}
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.badgeBg}`}>
            {config.label}
          </Badge>
          {isSettled && settlementLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50 text-muted-foreground border-border whitespace-nowrap">
              {settlementLabel}
            </Badge>
          )}
        </div>
        {isPending && !isExpired && (
          <div className={`flex items-center gap-1 text-xs ${urgent ? "text-trading-red font-medium" : "text-trading-yellow"}`}>
            <Clock className="w-3 h-3" />
            <span className="font-mono">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* Counter Position Info */}
      <div className="mb-2">
        <h3 className="font-medium text-foreground text-sm">{airdrop.counterEventName}</h3>
        <p className="text-xs">
          {(() => {
            const rawLabel = airdrop.counterOptionLabel ?? "";
            const trimmed = rawLabel.trim().toLowerCase();
            const isBinaryOutcome = counterIsBinary || /^(yes|no)$/i.test(trimmed);
            if (isBinaryOutcome) {
              const aliased = counterSideLabels
                ? trimmed === "yes"
                  ? counterSideLabels.yes
                  : trimmed === "no"
                  ? counterSideLabels.no
                  : rawLabel
                : rawLabel;
              const colorClass = trimmed === "yes" ? "text-trading-green" : "text-trading-red";
              return <span className={colorClass}>{aliased}</span>;
            }
            const sideText = airdrop.counterSide === "long" ? "Yes" : "No";
            return (
              <span className="text-muted-foreground">
                {rawLabel} · {sideText}
              </span>
            );
          })()}
        </p>
      </div>



      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <span className="text-[10px] text-muted-foreground block">Value</span>
          <span className="font-mono text-xs text-trading-green">${airdrop.airdropValue.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Price</span>
          <span className="font-mono text-xs">${airdrop.counterPrice.toFixed(4)}</span>
        </div>
        {isSettled && airdrop.settledPnl != null ? (
          <div>
            <span className="text-[10px] text-muted-foreground block">P&L</span>
            <span className={`font-mono text-xs ${airdrop.settledPnl >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
              {airdrop.settledPnl >= 0 ? '+' : ''}${airdrop.settledPnl.toFixed(2)}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-[10px] text-muted-foreground block">Source</span>
            <span className="text-xs text-muted-foreground truncate block">
              {isVoucher
                ? `Voucher · cap $${airdrop.redeemableCap?.toFixed(2) ?? "—"}`
                : isWelcomeGift
                ? "Welcome gift"
                : `${airdrop.externalSide} @ $${airdrop.externalPrice?.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      {/* External position reference — only when matched */}
      {!isWelcomeGift && !isVoucher && airdrop.externalEventName && (
        <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
          <span>Hedging:</span>
          <span className="truncate">{airdrop.externalEventName}</span>
        </div>
      )}

      {/* $500 cap notice for pending */}
      {isPending && (
        <p className="text-[10px] text-muted-foreground/70 mb-2">Max $500 earnings per account</p>
      )}

      {/* Action */}
      {isPending && !isExpired && (
        <ActivateAirdropButton
          expiresAt={airdrop.expiresAt}
          onClick={() => onActivate?.(airdrop.id)}
          isActivating={isActivating}
          variant="table"
          className="w-full h-8"
        />
      )}

      {isExpiredStatus && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <AlertTriangle className="w-3 h-3" />
          <span>This airdrop expired without activation</span>
        </div>
      )}

      {isActivated && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-trading-green py-1">
            <Zap className="w-3 h-3" />
            <span>Activated — Position is now live</span>
          </div>
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              disabled={isClosing}
              onClick={async () => {
                setIsClosing(true);
                try {
                  await onClose(airdrop.id);
                } finally {
                  setIsClosing(false);
                }
              }}
            >
              <X className="w-3 h-3" />
              {isClosing ? "Closing…" : "Close position"}
            </Button>
          )}
        </div>
      )}

      {isSettled && (
        <div className="flex items-center gap-2 text-xs text-primary py-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Settled — {airdrop.settledPnl != null && airdrop.settledPnl >= 0 ? `+$${airdrop.settledPnl.toFixed(2)} credited` : `$${Math.abs(airdrop.settledPnl ?? 0).toFixed(2)} loss`}</span>
        </div>
      )}
    </div>
  );
};
