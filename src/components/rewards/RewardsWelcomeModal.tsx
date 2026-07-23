import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { Gift, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTreasureDrop } from "@/hooks/useTreasureDrop";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";
import rewardsGiftBox from "@/assets/rewards-gift-box.gif";

/**
 * Welcome modal shown on Home page for logged-in users who haven't yet
 * claimed their treasure drop. The modal is dismissible — users can close
 * it via the X button, the overlay, the Esc key, or the "Maybe later"
 * action. Dismissing only suppresses the modal for the current session;
 * on the next visit (if the treasure is still unclaimed) it will appear
 * again. Once the treasure is claimed, the FloatingRewardsButton takes over.
 */
export const RewardsWelcomeModal = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useUserProfile();
  const { hasClaimed, isLoading } = useTreasureDrop();
  const isAuthFlowOpen = useAuthFlowStore((state) => state.isOpen);
  const [dismissed, setDismissed] = useState(false);

  // Only show for logged-in users who haven't claimed treasure and haven't dismissed
  const shouldShow = !!user && !hasClaimed && !isLoading && !isAuthFlowOpen && !dismissed;

  const handleGoToRewards = () => {
    navigate("/rewards");
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const content = (
    <div className="flex flex-col items-center text-center py-0">
      {/* Gift box illustration with glow */}
      <div className="relative -mb-2 -mt-4">
        <div className="absolute -inset-6 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -inset-3 rounded-full bg-primary/10 blur-xl animate-pulse" style={{ animationDelay: '0.7s' }} />
        <img
          src={rewardsGiftBox}
          alt="Rewards"
          className="w-44 h-44 md:w-52 md:h-52 object-contain relative z-10 drop-shadow-xl animate-[float_3s_ease-in-out_infinite]"
        />
      </div>

      {/* Headline */}
      <h2 className="text-xl font-bold text-foreground mb-0.5">
        Claim Free Trial Funds
      </h2>
      <p className="text-sm text-muted-foreground mb-2 max-w-[260px]">
        Do tasks, earn points, trade for free!
      </p>

      {/* Steps preview */}
      <div className="w-full space-y-1.5 mb-3">
        {[
          { step: "1", label: "Complete Tasks", desc: "Easy one-time missions", icon: "🎯" },
          { step: "2", label: "Earn Points", desc: "Instant point rewards", icon: "⭐" },
          { step: "3", label: "Get Trial Funds", desc: "Convert points to capital", icon: "💰" },
        ].map((item) => (
          <div
            key={item.step}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 text-lg">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button
        onClick={handleGoToRewards}
        className="w-full btn-primary text-base h-12 gap-2"
        size="lg"
      >
        <Gift className="w-5 h-5" />
        Go to Rewards Center
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Dismiss option */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="mt-2 text-muted-foreground hover:text-foreground"
      >
        Maybe later
      </Button>
    </div>
  );

  if (!shouldShow) return null;

  if (isMobile) {
    return (
      <MobileDrawer
        open={true}
        onOpenChange={(open) => !open && handleDismiss()}
        showHandle={true}
        hideCloseButton={false}
        className="bg-gradient-to-b from-background to-background/95"
      >
        {content}
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent
        className="sm:max-w-md border-primary/30 bg-gradient-to-b from-background to-background/95"
      >
        <DialogTitle className="sr-only">Welcome to Rewards</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
};
