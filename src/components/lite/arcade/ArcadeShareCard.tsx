// ============================================================
// Quick Play · "Share your run" — the cabinet's 04 / YOUR RESULT Share key
// hands a frozen run snapshot up to the page, which hosts the site's
// ShareModal (Save / Copy link / X / Telegram / More Options → system share
// sheet on phones) around the run poster. Signed-in only, like every other
// share card on the site; nothing opens by itself (CPO 2026-10-28: no
// streak prompts — don't break the moment).
// 2026-11-02: the designer's share sheet (ShareModal variant "arcade": pixel
// title, dark keys, bottom sheet on phones) + handheld poster, pixel font
// embedded in the saved PNG. Figma omenx_lite 1283:1437 / 1283:1841 / 1283:2110.
// ============================================================
import { useEffect } from "react";
import { ShareModal } from "@/components/ShareModal";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import { arcadePosterFontCSS } from "@/lib/arcade/posterFonts";
import { SITE_URL } from "@/lib/site";
import type { ArcadeComboShare, ArcadeRunShare } from "@/pages/arcade/arcadeEngine";
import { ArcadeComboPoster } from "./ArcadeComboPoster";
import { ArcadeRunPoster } from "./ArcadeRunPoster";

const shareUrlFor = (referralCode?: string | null) => `${SITE_URL}/arcade${referralCode ? `?ref=${referralCode}` : ""}`;

/** presentational: the sheet + poster for one run (production wraps it with the signed-in user; the style guide mounts it directly) */
export const ArcadeRunShareSheet = ({
  run,
  username,
  avatarUrl,
  referralCode,
  isDataReady = true,
  onClose,
}: {
  run: ArcadeRunShare;
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
  isDataReady?: boolean;
  onClose: () => void;
}) => {
  // the Portfolio session page opens this too, where the cabinet's pixel font isn't loaded yet
  useEffect(() => ensureArcadeFonts(), []);
  const isWin = run.pnl >= 0;
  const amount = `$${Math.abs(run.pnl).toFixed(2)}`;
  const shareText = isWin
    ? `Called Bitcoin up or down for ${run.minutes} min on OmenX Quick Play — ${run.won} of ${run.won + run.lost} right, +${amount} ⚡`
    : `Called Bitcoin up or down for ${run.minutes} min on OmenX Quick Play — ${run.won} of ${run.won + run.lost} right, −${amount}. We go again 😅`;
  return (
    <ShareModal
      isOpen
      variant="arcade"
      fontEmbedCSS={arcadePosterFontCSS}
      onClose={onClose}
      title="Share your run"
      subtitle={isWin ? "Save the card or post it straight to X / Telegram" : "Rough one — share it anyway, we go again"}
      shareText={shareText}
      shareUrl={shareUrlFor(referralCode)}
      fileName="omenx-quick-play"
      isDataReady={isDataReady}
    >
      <ArcadeRunPoster run={run} username={username} avatarUrl={avatarUrl} referralCode={referralCode} />
    </ShareModal>
  );
};

export const ArcadeShareCard = ({ run, onClose }: { run: ArcadeRunShare | null; onClose: () => void }) => {
  const { user } = useAuth();
  const { referralCode } = useReferral();
  const { username, avatarUrl, isLoading } = useUserProfile();
  if (!run || !user) return null;
  return (
    <ArcadeRunShareSheet
      run={run}
      username={username ?? undefined}
      avatarUrl={avatarUrl ?? undefined}
      referralCode={referralCode || undefined}
      isDataReady={!isLoading && !!referralCode}
      onClose={onClose}
    />
  );
};

/** the combo HUD's ⇪ SHARE (CPO 2026-11-02): same share sheet, the combo poster inside (interim poster until the designer's) */
export const ArcadeComboShareCard = ({ combo, onClose }: { combo: ArcadeComboShare | null; onClose: () => void }) => {
  const { user } = useAuth();
  const { referralCode } = useReferral();
  const { username, avatarUrl, isLoading } = useUserProfile();
  if (!combo || !user) return null;
  const shareText = `${combo.n} Bitcoin calls right in a row on OmenX Quick Play — COMBO ×${combo.n}, +$${Math.abs(combo.pnl).toFixed(2)} 🔥`;
  return (
    <ShareModal
      isOpen
      variant="arcade"
      onClose={onClose}
      title="Share your combo"
      subtitle="Save the card or post it straight to X / Telegram"
      shareText={shareText}
      shareUrl={shareUrlFor(referralCode)}
      fileName="omenx-quick-play-combo"
      isDataReady={!isLoading && !!referralCode}
    >
      <ArcadeComboPoster combo={combo} username={username ?? undefined} avatarUrl={avatarUrl ?? undefined} referralCode={referralCode || undefined} />
    </ShareModal>
  );
};

export default ArcadeShareCard;
