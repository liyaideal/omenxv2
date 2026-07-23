import { useMemo } from "react";
import { Check, Wallet, Landmark } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatEquityUsd } from "@/lib/equity";
import { cn } from "@/lib/utils";

export type AccountKind = "spot" | "futures";

interface AccountPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: AccountKind | null;
  onSelect: (account: AccountKind) => void;
  title?: string;
  showBalances?: boolean;
}

const ROWS: Array<{ key: AccountKind; label: string; hint: string; icon: React.ElementType }> = [
  {
    key: "spot",
    label: "Spot Account",
    hint: "Funds US-stock spot trading",
    icon: Wallet,
  },
  {
    key: "futures",
    label: "Futures Account",
    hint: "Funds prediction market futures",
    icon: Landmark,
  },
];

/** Inline-usable rows body (no Dialog/Sheet shell). Safe to render inside another overlay. */
export const AccountPickerRows = ({
  selected,
  onSelect,
  showBalances = true,
}: {
  selected: AccountKind | null;
  onSelect: (a: AccountKind) => void;
  showBalances?: boolean;
}) => {
  const { balance, spotBalance } = useUserProfile();
  const balancesByKey = useMemo(
    () => ({ spot: spotBalance, futures: balance }),
    [balance, spotBalance],
  );

  return (
    <div className="space-y-2">
      {ROWS.map((row) => {
        const Icon = row.icon;
        const active = selected === row.key;
        return (
          <button
            key={row.key}
            type="button"
            onClick={() => onSelect(row.key)}
            className={cn(
              "w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
              active ? "border-primary bg-primary/10" : "border-border/50 hover:bg-muted/50",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-muted-foreground truncate">{row.hint}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showBalances && (
                <span className="font-mono text-xs text-muted-foreground">
                  ${formatEquityUsd(balancesByKey[row.key])}
                </span>
              )}
              {active && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};


/**
 * Shared account picker — Dialog on desktop, bottom Sheet on mobile.
 * Mirrors the WithdrawAddressSelect two-mount pattern (§5 Overlay 对等表).
 */
export const AccountPicker = ({
  open,
  onOpenChange,
  selected,
  onSelect,
  title = "Select account",
  showBalances = true,
}: AccountPickerProps) => {
  const isMobile = useIsMobile();
  const rows = <AccountPickerRows selected={selected} onSelect={onSelect} showBalances={showBalances} />;


  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {rows}
          <div className="h-4" />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {rows}
      </DialogContent>
    </Dialog>
  );
};
