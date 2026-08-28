// ============================================================
// Thin wrapper: existing ShareModal + LitePnlPoster. Signed-in only —
// guest demo positions never get a share card (red line).
// ============================================================
import { ShareModal } from "@/components/ShareModal";
import { LitePnlPoster, LitePnlPosterState } from "./LitePnlPoster";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { useUserProfile } from "@/hooks/useUserProfile";
import { liteTradePath, LiteTradeSegment } from "@/lib/liteTradePath";

const ORIGIN = "https://omenxv2.lovable.app";

export interface LiteShareFlowProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  state: LitePnlPosterState;
  eventId: string;
  eventName: string;
  sideLine: string;
  pnl: number;
  pnlPercent: number;
  leftAmount: number;
  rightAmount: number;
  segment: LiteTradeSegment;
  dateISO?: string;
  settlementId?: string | null;
}

export const LiteShareFlow = ({
  open,
  onOpenChange,
  state,
  eventId,
  eventName,
  sideLine,
  pnl,
  pnlPercent,
  leftAmount,
  rightAmount,
  segment,
  dateISO,
  settlementId,
}: LiteShareFlowProps) => {
  const { user } = useAuth();
  const { referralCode } = useReferral();
  const { username, avatarUrl } = useUserProfile();

  // Guests never share.
  if (!user) return null;

  const isWin = pnl >= 0;
  const signedPct = `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}`;
  const shareText = `I just ${isWin ? "won" : "lost"} ${signedPct}% on OMENX! ${isWin ? "🚀" : "💀"}`;
  const shareUrl =
    state === "settled" && settlementId
      ? `${ORIGIN}/portfolio/settlement/${settlementId}`
      : `${ORIGIN}${liteTradePath(eventId, segment)}`;

  return (
    <ShareModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={isWin ? "Share Your Win 🏆" : "Share Your Trade"}
      subtitle={isWin ? "Show off your trading success" : "We go again next time!"}
      shareText={shareText}
      shareUrl={shareUrl}
      fileName="omenx-share"
    >
      <LitePnlPoster
        state={state}
        eventName={eventName}
        sideLine={sideLine}
        pnl={pnl}
        pnlPercent={pnlPercent}
        leftAmount={leftAmount}
        rightAmount={rightAmount}
        dateISO={dateISO}
        username={username ?? undefined}
        avatarUrl={avatarUrl ?? undefined}
        referralCode={referralCode || undefined}
      />
    </ShareModal>
  );
};

export default LiteShareFlow;

/**
 * Page-level host for a cash-out snapshot handed up by LiteCashOutFlow
 * (a full close unmounts that flow, so the card must live on the page).
 */
export const LiteCashOutShareCard = ({
  snap,
  onClose,
}: {
  snap: import("@/components/lite/contract/LiteCashOutFlow").CashOutShareSnapshot | null;
  onClose: () => void;
}) => {
  if (!snap) return null;
  return (
    <LiteShareFlow
      open
      onOpenChange={(o) => !o && onClose()}
      state="cashed"
      eventId={snap.context.eventId}
      eventName={snap.context.eventName}
      sideLine={snap.context.sideLine}
      pnl={snap.pnl}
      pnlPercent={snap.pnlPercent}
      leftAmount={snap.leftAmount}
      rightAmount={snap.rightAmount}
      segment={snap.context.productLine === "spot" ? "standard" : "boost"}
      dateISO={new Date().toISOString()}
    />
  );
};
