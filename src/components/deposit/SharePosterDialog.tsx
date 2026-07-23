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
      title="Share Deposit Address"
      subtitle="Share your deposit address with others"
      shareText={shareText}
      shareUrl={shareUrl}
      fileName={`omenx-deposit-${token.symbol.toLowerCase()}`}
    >
      <SharePosterContent address={address} token={token} />
    </ShareModal>
  );
};
