import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

export type TransferDirection = "to_spot" | "to_futures";

interface TransferFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  initialDirection?: TransferDirection;
  /**
   * Style-guide only. Forces balances + initial amount for state coverage
   * (normal / insufficient / zero). Never pass in production —
   * production always reads from useUserProfile.
   */
  demoOverride?: {
    balance?: number;
    spotBalance?: number;
    initialAmount?: string;
  };
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Shared Transfer form used by both TransferDialog (desktop) and TransferDrawer (mobile).
 * Follows the ClosePosition 三件套 pattern (§5 Overlay 对等表).
 */
export const TransferForm = ({
  onCancel,
  onSuccess,
  initialDirection = "to_spot",
  demoOverride,
}: TransferFormProps) => {
  const profile = useUserProfile();
  const balance = demoOverride?.balance ?? profile.balance;
  const spotBalance = demoOverride?.spotBalance ?? profile.spotBalance;
  const { transferBetweenAccounts } = profile;
  const [direction, setDirection] = useState<TransferDirection>(initialDirection);
  const [amountStr, setAmountStr] = useState(demoOverride?.initialAmount ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Skip the mount pass so demoOverride.initialAmount (used by the style-guide
  // 4-state preview) survives the first render. Also skip when demoOverride is
  // present so preview snapshots don't get clobbered.
  const isFirstDirectionEffect = useRef(true);
  useEffect(() => {
    if (isFirstDirectionEffect.current) {
      isFirstDirectionEffect.current = false;
      return;
    }
    if (demoOverride) return;
    setAmountStr("");
  }, [direction, demoOverride]);

  // From = Futures 时 Available 直接读 balance（Trial Bonus 已下线，无需拆分）
  const fromAvailable = direction === "to_spot" ? balance : spotBalance;
  const fromLabel = direction === "to_spot" ? "Futures Account" : "Spot Account";
  const toLabel = direction === "to_spot" ? "Spot Account" : "Futures Account";
  const toCurrent = direction === "to_spot" ? spotBalance : balance;

  const amount = useMemo(() => {
    const n = Number(amountStr);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amountStr]);

  const insufficient = amount > fromAvailable;
  const canSubmit = amount > 0 && !insufficient && !submitting;

  const handleMax = () => setAmountStr(fromAvailable > 0 ? fromAvailable.toFixed(2) : "");

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await transferBetweenAccounts(direction, amount);
    setSubmitting(false);
    if (res.success) {
      toast.success(
        `Transferred $${fmt(amount)} to ${direction === "to_spot" ? "Spot" : "Futures"}`,
      );
      setAmountStr("");
      onSuccess?.();
    } else {
      toast.error(res.error || "Transfer failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Direction segmented */}
      <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-0.5">
        {(
          [
            { key: "to_spot", label: "Futures → Spot" },
            { key: "to_futures", label: "Spot → Futures" },
          ] as const
        ).map((opt) => {
          const active = direction === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDirection(opt.key)}
              className={cn(
                "h-9 rounded-md text-xs font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* From / To cards */}
      <div className="relative space-y-2">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            From
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium">{fromLabel}</span>
            <span className="text-xs font-mono text-muted-foreground">
              ${fmt(fromAvailable)}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            To
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium">{toLabel}</span>
            <span className="text-xs font-mono text-muted-foreground">
              ${fmt(toCurrent)}
            </span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">Available ${fmt(fromAvailable)}</span>
            <button
              type="button"
              onClick={handleMax}
              disabled={fromAvailable <= 0}
              className="rounded px-1.5 py-0.5 text-primary hover:bg-primary/10 disabled:opacity-40"
            >
              MAX
            </button>
          </div>
        </div>
        <Input
          inputMode="decimal"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className={cn(
            "h-11 rounded-lg border-0 bg-muted font-mono text-2xl",
            insufficient && "ring-1 ring-trading-red",
          )}
        />
        {insufficient && (
          <p className="text-[11px] text-trading-red">Insufficient balance in {fromLabel}.</p>
        )}
      </div>

      <MobileDrawerActions>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 h-11"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {submitting ? "Transferring…" : `Transfer${amount > 0 ? ` $${fmt(amount)}` : ""}`}
          </Button>
        </div>
      </MobileDrawerActions>
    </div>
  );
};
