import { t } from "@/i18n";
import { TokenConfig } from '@/types/deposit';
import { ShareModal } from '@/components/ShareModal';
import { SharePosterContent } from './SharePosterContent';

interface SharePosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  token: TokenConfig;
}

export const SharePosterDialog = ({
  open,
  onOpenChange,
  address,
  token,
}: SharePosterDialogProps) => {
  const shareUrl = `${window.location.origin}/deposit?token=${token.symbol}`;
  const shareText = `Deposit ${token.symbol} to my OMENX account on ${token.network}!`;

  return (
    <ShareModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t("wallet.screen.share_poster_dialog.share_deposit_address")}
      subtitle={t("wallet.screen.share_poster_dialog.share_your_deposit_address_with_others")}
      shareText={shareText}
      shareUrl={shareUrl}
      fileName={`omenx-deposit-${token.symbol.toLowerCase()}`}
    >
      <SharePosterContent address={address} token={token} />
    </ShareModal>
  );
};
