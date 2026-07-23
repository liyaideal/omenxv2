import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { RedeemVoucherContent } from "./RedeemVoucherContent";
import type { PositionVoucher } from "@/hooks/usePositionVouchers";

interface RedeemVoucherSheetProps {
  voucher: PositionVoucher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RedeemVoucherSheet = ({ voucher, open, onOpenChange }: RedeemVoucherSheetProps) => {
  const isMobile = useIsMobile();
  if (!voucher) return null;

  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={onOpenChange} title="Redeem voucher" height="h-[92vh]">
        <RedeemVoucherContent voucher={voucher} onClose={() => onOpenChange(false)} variant="drawer" />
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redeem voucher</DialogTitle>
        </DialogHeader>
        <RedeemVoucherContent voucher={voucher} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
