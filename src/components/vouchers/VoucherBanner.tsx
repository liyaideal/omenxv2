import { Link } from "react-router-dom";
import { Ticket, ChevronRight, Gift } from "lucide-react";
import { usePositionVouchers } from "@/hooks/usePositionVouchers";

export const VoucherBanner = () => {
  const { grantedVouchers, claimedVouchers, isLoading } = usePositionVouchers();
  if (isLoading) return null;

  const grantedCount = grantedVouchers.length;
  const claimedCount = claimedVouchers.length;
  const total = grantedCount + claimedCount;
  if (total === 0) return null;

  // Prefer the granted CTA when any unclaimed vouchers exist — they expire first
  // and require the explicit "Tap to claim" step.
  const showGranted = grantedCount > 0;
  const Icon = showGranted ? Gift : Ticket;
  const headline = showGranted
    ? `You have ${grantedCount} unclaimed voucher${grantedCount === 1 ? "" : "s"}`
    : `You have ${claimedCount} voucher${claimedCount === 1 ? "" : "s"} ready to redeem`;
  const subline = showGranted
    ? "Tap to claim — then redeem within 7 days."
    : "Redeem to open a free position on any eligible event.";

  return (
    <Link
      to="/vouchers"
      className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3 hover:border-primary/50 transition"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{headline}</div>
          <div className="text-xs text-muted-foreground">{subline}</div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
};
