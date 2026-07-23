import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Clock, ArrowRight, X, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAirdropPositions, AirdropPosition } from "@/hooks/useAirdropPositions";
import { useUserProfile } from "@/hooks/useUserProfile";

const DAILY_MAX = 3;
const STORAGE_PREFIX = "omenx-airdrop-modal-count:";
const SESSION_PREFIX = "omenx-airdrop-modal-shown-ids:";

const getTodayKey = (userId: string) => `${STORAGE_PREFIX}${userId}:${new Date().toISOString().slice(0, 10)}`;
const getSessionKey = (userId: string) => `${SESSION_PREFIX}${userId}`;

const getDailyCount = (userId: string): number => {
  try {
    return parseInt(localStorage.getItem(getTodayKey(userId)) || "0", 10);
  } catch {
    return 0;
  }
};

const incrementDailyCount = (userId: string) => {
  try {
    const key = getTodayKey(userId);
    const current = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, String(current + 1));
  } catch {}
};

const getShownIds = (userId: string): Set<string> => {
  try {
    const raw = sessionStorage.getItem(getSessionKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const markIdShown = (userId: string, id: string) => {
  try {
    const shown = getShownIds(userId);
    shown.add(id);
    sessionStorage.setItem(getSessionKey(userId), JSON.stringify([...shown]));
  } catch {}
};

// Countdown hook
const useCountdown = (expiresAt: string) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return timeLeft;
};

// Modal body content
const AirdropModalBody = ({
  airdrop,
  onActivate,
  onDismiss,
  showDismiss = true,
  isActivating,
}: {
  airdrop: AirdropPosition;
  onActivate: () => void;
  onDismiss: () => void;
  showDismiss?: boolean;
  isActivating: boolean;
}) => {
  const countdown = useCountdown(airdrop.expiresAt);
  const isWelcomeGift = airdrop.source === "welcome_gift";

  return (
    <div className="space-y-4 py-1">
      {/* Header - centered */}
      <div className="text-center space-y-1">
        <div className="w-14 h-14 rounded-2xl bg-trading-green/15 flex items-center justify-center mx-auto mb-3">
          <Gift className="w-7 h-7 text-trading-green" />
        </div>
        <h3 className="text-xl font-bold text-foreground">
          {isWelcomeGift ? "Welcome gift unlocked" : "New Airdrop Detected!"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isWelcomeGift
            ? "Thanks for connecting your Polymarket wallet — here's a free $10 position on us."
            : "We found a hedge opportunity from your Polymarket position"}
        </p>
      </div>

      {/* Combined card */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        {/* Polymarket position — only for matched airdrops */}
        {!isWelcomeGift && airdrop.externalEventName && (
          <>
            <div className="p-3.5 bg-muted/30">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                <Zap className="w-3 h-3 text-trading-yellow" />
                Your Polymarket Position
              </div>
              <p className="text-sm font-medium text-foreground leading-snug mb-2">{airdrop.externalEventName}</p>
              <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary">
                {airdrop.externalSide} @ ${airdrop.externalPrice?.toFixed(2)}
              </Badge>
            </div>

            {/* Divider with arrow */}
            <div className="relative h-0 flex items-center justify-center z-10">
              <div className="w-7 h-7 rounded-full bg-trading-green border-2 border-background flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-white rotate-90" />
              </div>
            </div>
          </>
        )}

        {/* Free hedge / gift */}
        <div className="p-3.5 bg-trading-green/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-trading-green uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              {isWelcomeGift ? "Your Free OmenX Position" : "Free OmenX Hedge"}
            </div>
            <span className="text-lg font-bold text-trading-green font-mono">${airdrop.airdropValue}</span>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug mb-2">{airdrop.counterEventName}</p>
          <Badge className="text-[11px] font-mono bg-trading-green/15 text-trading-green border-trading-green/25">
            {airdrop.counterOptionLabel} · {airdrop.counterSide.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Optional hedge prompt for welcome gift */}
      {isWelcomeGift && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Want to hedge it? You can open the opposite side on Polymarket anytime — totally optional.
          </p>
        </div>
      )}

      {/* Countdown */}
      <div className="flex items-center justify-center gap-2 text-sm py-2">
        <Clock className="w-3.5 h-3.5 text-trading-yellow" />
        <span className="text-muted-foreground text-xs">Expires in</span>
        <span className="font-mono font-bold text-sm text-foreground">{countdown}</span>
        <span className="text-muted-foreground text-xs">— tap Activate to claim</span>
      </div>

      {/* Earnings cap notice */}
      <p className="text-center text-[10px] text-muted-foreground/70">Max $500 earnings per account</p>

      {/* Actions */}
      <div className="flex gap-3">
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        )}
        <Button
          size="sm"
          className={`${showDismiss ? 'flex-[2]' : 'w-full'} bg-trading-green hover:bg-trading-green/90 text-white gap-1.5`}
          onClick={onActivate}
          disabled={isActivating}
        >
          <Zap className="w-3.5 h-3.5" />
          {isActivating ? "Activating..." : "Activate Now"}
        </Button>
      </div>
    </div>
  );
};

export const AirdropHomepageModal = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { pendingAirdrops, activateAirdrop, isActivating } = useAirdropPositions();
  const { user } = useUserProfile();
  const [currentAirdrop, setCurrentAirdrop] = useState<AirdropPosition | null>(null);
  const [open, setOpen] = useState(false);
  const processedRef = useRef(false);

  const userId = user?.id ?? "guest";

  // Find the first unshown pending airdrop to display
  useEffect(() => {
    if (processedRef.current || pendingAirdrops.length === 0) return;

    const dailyCount = getDailyCount(userId);
    if (dailyCount >= DAILY_MAX) return;

    const shownIds = getShownIds(userId);
    const unshown = pendingAirdrops.find((a) => !shownIds.has(a.id));
    if (!unshown) return;

    processedRef.current = true;
    setCurrentAirdrop(unshown);
    setOpen(true);
    markIdShown(userId, unshown.id);
    incrementDailyCount(userId);
  }, [pendingAirdrops, userId]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    setCurrentAirdrop(null);
  }, []);

  const handleActivate = useCallback(async () => {
    if (!currentAirdrop) return;
    await activateAirdrop(currentAirdrop.id);
    setOpen(false);
    navigate(`/trade?event=${currentAirdrop.counterEventId}`);
  }, [currentAirdrop, activateAirdrop, navigate]);

  if (!currentAirdrop) return null;

  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
        <AirdropModalBody
          airdrop={currentAirdrop}
          onActivate={handleActivate}
          onDismiss={handleDismiss}
          isActivating={isActivating}
        />
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-6 gap-0">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <AirdropModalBody
          airdrop={currentAirdrop}
          onActivate={handleActivate}
          onDismiss={handleDismiss}
          showDismiss={false}
          isActivating={isActivating}
        />
      </DialogContent>
    </Dialog>
  );
};
