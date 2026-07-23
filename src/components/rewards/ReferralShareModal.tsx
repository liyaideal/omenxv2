import { ShareModal } from '@/components/ShareModal';
import { ReferralSharePoster } from './ReferralSharePoster';

interface ReferralShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
  referralLink: string;
  username?: string;
  avatarUrl?: string;
}

/**
 * ReferralShareModal - Modal for sharing referral invitation
 * 
 * Uses the KOL-friendly ReferralSharePoster design with prominent
 * user avatar and name for better recognition and conversion.
 */
export const ReferralShareModal = ({
  open,
  onOpenChange,
  referralCode,
  referralLink,
  username,
  avatarUrl,
}: ReferralShareModalProps) => {
  const shareText = `Join me on OMENX and earn rewards! Use my code: ${referralCode}`;

  return (
    <ShareModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Share Invitation"
      subtitle="Invite friends and earn rewards together"
      shareText={shareText}
      shareUrl={referralLink}
      fileName={`omenx-invite-${referralCode.toLowerCase()}`}
      isDataReady={true}
    >
      <ReferralSharePoster
        referralCode={referralCode}
        inviterName={username}
        avatarUrl={avatarUrl}
      />
    </ShareModal>
  );
};
