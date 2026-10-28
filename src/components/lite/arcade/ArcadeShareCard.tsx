// ============================================================
// Quick Play · "Share your run" — the cabinet's 04 / YOUR RESULT Share key
// hands a frozen run snapshot up to the page, which hosts the site's
// ShareModal (Save / Copy link / X / Telegram / More Options → system share
// sheet on phones) around the run poster. Signed-in only, like every other
// share card on the site; nothing opens by itself (CPO 2026-10-28: no
// streak prompts — don't break the moment).
// ============================================================
import { ShareModal } from "@/components/ShareModal";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SITE_URL } from "@/lib/site";
import type { ArcadeRunShare } from "@/pages/arcade/arcadeEngine";
import { ArcadeRunPoster } from "./ArcadeRunPoster";

export const ArcadeShareCard = ({ run, onClose }: { run: ArcadeRunShare | null; onClose: () => void }) => {
  const { user } = useAuth();
  const { referralCode } = useReferral();
  const { username, avatarUrl, isLoading } = useUserProfile();
  if (!run || !user) return null;
  const isWin = run.pnl >= 0;
  const amount = `$${Math.abs(run.pnl).toFixed(2)}`;
  const shareText = isWin
    ? `Called Bitcoin up or down for ${run.minutes} min on OmenX Quick Play — ${run.won} of ${run.won + run.lost} right, +${amount} ⚡`
    : `Called Bitcoin up or down for ${run.minutes} min on OmenX Quick Play — ${run.won} of ${run.won + run.lost} right, −${amount}. We go again 😅`;
  return (
    <ShareModal
      isOpen
      onClose={onClose}
      title="Share your run"
      subtitle={isWin ? "Save the card or post it straight to X / Telegram" : "Rough one — share it anyway, we go again"}
      shareText={shareText}
      shareUrl={`${SITE_URL}/arcade${referralCode ? `?ref=${referralCode}` : ""}`}
      fileName="omenx-quick-play"
      isDataReady={!isLoading && !!referralCode}
    >
      <ArcadeRunPoster run={run} username={username ?? undefined} avatarUrl={avatarUrl ?? undefined} referralCode={referralCode || undefined} />
    </ShareModal>
  );
};

export default ArcadeShareCard;
