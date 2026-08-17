/**
 * StickyWithdrawBar — the primary CTA for the full-screen /withdraw flow
 * (DESIGN.md §5). Reads its state from WithdrawSubmitContext so WalletWithdraw
 * keeps owning validation and submission.
 *
 * Mounted by: src/pages/Withdraw.tsx (and the style-guide funding preview).
 */
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWithdrawSubmit } from "@/components/withdraw/WithdrawSubmitContext";

interface StickyWithdrawBarProps {
  /** Style-guide previews render inside a frame without BottomNav. */
  offsetBottomNav?: boolean;
}

export const StickyWithdrawBar = ({ offsetBottomNav = true }: StickyWithdrawBarProps) => {
  const ctx = useWithdrawSubmit();
  if (!ctx?.state.visible) return null;
  const { disabled, loading, onSubmit } = ctx.state;

  return (
    <div
      className="sticky z-30 bg-background border-t border-border px-4 pt-3"
      style={
        offsetBottomNav
          ? {
              bottom: "var(--bottom-nav-h, 76px)",
              marginBottom: "var(--bottom-nav-h, 76px)",
              paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            }
          : { bottom: 0, paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }
      }
    >
      <Button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover font-semibold text-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        ) : (
          "Withdraw"
        )}
      </Button>
    </div>
  );
};
