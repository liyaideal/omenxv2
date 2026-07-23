import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Rocket } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import treasureDropSuccess from "@/assets/treasure-drop-success.gif";
import "./TreasureClaimDialog.css";

interface TreasureClaimDialogProps {
  open: boolean;
  onClose: () => void;
  pointsDropped: number;
  tier: string;
  newBalance: number;
}

// Confetti Portal Component - renders directly to body
const ConfettiPortal = ({ show }: { show: boolean }) => {
  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF69B4', '#00CED1', '#FF4500'];
  
  const confettiParticles = useMemo(() => {
    if (!show) return [];
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1500,
      left: Math.random() * 100,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: 8 + Math.random() * 12,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
    }));
  }, [show]);

  if (!show) return null;

  return createPortal(
    <div className="treasure-confetti-container">
      {confettiParticles.map((particle) => (
        <div
          key={particle.id}
          className="treasure-confetti-particle"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}ms`,
          }}
        />
      ))}
    </div>,
    document.body
  );
};

// Sparkle component with CSS animation
const SparkleParticle = ({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) => (
  <Sparkles
    className="treasure-sparkle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}ms`,
    }}
  />
);

// Content component shared between Dialog and Drawer
const TreasureContent = ({
  showContent,
  sparkleParticles,
  tier,
  animatedPoints,
  onClose,
}: {
  showContent: boolean;
  sparkleParticles: Array<{ id: number; delay: number; x: number; y: number; size: number; duration: number }>;
  tier: string;
  animatedPoints: number;
  onClose: () => void;
}) => {
  const getTierMessage = () => {
    switch (tier) {
      case 'high':
        return '🎉 JACKPOT! You hit the legendary tier!';
      case 'low':
        return '🎁 Nice! You found some bonus points!';
      default:
        return '✨ Amazing! You discovered a treasure!';
    }
  };

  if (!showContent) return null;

  return (
    <>
      {/* Sparkles within content area */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {sparkleParticles.map((particle) => (
          <SparkleParticle
            key={particle.id}
            x={particle.x}
            y={particle.y}
            size={particle.size}
            delay={particle.delay}
            duration={particle.duration}
          />
        ))}
      </div>

      <div className="relative z-20 flex flex-col items-center py-4 animate-scale-in">
        {/* Success image with enhanced glow */}
        <div className="relative mb-4">
          <div className="absolute -inset-6 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute -inset-8 rounded-full bg-primary/10 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <img 
            src={treasureDropSuccess} 
            alt="Treasure Claimed"
            className="w-36 h-36 object-contain relative z-10 drop-shadow-2xl"
          />
        </div>

        {/* Tier message */}
        <p className="text-sm text-muted-foreground mb-2 text-center font-medium">
          {getTierMessage()}
        </p>

        {/* Points display with glow effect */}
        <div className="flex items-center gap-2 mb-2 relative">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
          <Star className="w-8 h-8 text-primary fill-primary animate-pulse relative z-10" />
          <span className="text-5xl font-bold text-primary font-mono tracking-tight relative z-10 tabular-nums">
            +{animatedPoints.toLocaleString()}
          </span>
        </div>
        
        <p className="text-lg font-semibold text-foreground mb-4">
          Points Received!
        </p>

        {/* Close button */}
        <Button 
          onClick={onClose}
          className="w-full btn-primary text-base"
          size="lg"
        >
          <Rocket className="w-5 h-5 mr-2" />
          Awesome!
        </Button>
      </div>
    </>
  );
};

export const TreasureClaimDialog = ({
  open,
  onClose,
  pointsDropped,
  tier,
  newBalance,
}: TreasureClaimDialogProps) => {
  const [showContent, setShowContent] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const isMobile = useIsMobile();

  // Generate sparkle particles
  const sparkleParticles = useMemo(() => {
    if (!open) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: Math.random() * 800,
      x: 10 + Math.random() * 80,
      y: 5 + Math.random() * 55,
      size: 16 + Math.random() * 12,
      duration: 1 + Math.random() * 0.5,
    }));
  }, [open]);

  // Animate points counting up
  useEffect(() => {
    if (open) {
      setShowContent(false);
      setAnimatedPoints(0);
      setShowConfetti(false);
      
      // Show content after a brief delay
      const showTimer = setTimeout(() => {
        setShowContent(true);
        setShowConfetti(true);
      }, 100);
      
      // Animate points with easing - start after content shows
      const startDelay = 400;
      const duration = 2000;
      const startTime = Date.now() + startDelay;
      
      const countTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) return;
        
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * pointsDropped);
        
        setAnimatedPoints(current);
        
        if (progress >= 1) {
          setAnimatedPoints(pointsDropped);
          clearInterval(countTimer);
        }
      }, 16);

      return () => {
        clearTimeout(showTimer);
        clearInterval(countTimer);
      };
    } else {
      setShowContent(false);
      setAnimatedPoints(0);
      setShowConfetti(false);
    }
  }, [open, pointsDropped]);

  return (
    <>
      {/* Confetti rendered via portal to body */}
      <ConfettiPortal show={showConfetti} />
      
      {isMobile ? (
        <MobileDrawer
          open={open}
          onOpenChange={(isOpen) => !isOpen && onClose()}
          showHandle={true}
          hideCloseButton={true}
          className="bg-gradient-to-b from-background to-background/95"
        >
          <TreasureContent
            showContent={showContent}
            sparkleParticles={sparkleParticles}
            tier={tier}
            animatedPoints={animatedPoints}
            onClose={onClose}
          />
        </MobileDrawer>
      ) : (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
          <DialogContent 
            className="sm:max-w-md border-primary/30 bg-gradient-to-b from-background to-background/95"
            style={{ overflow: 'visible' }}
          >
            <DialogTitle className="sr-only">Treasure Claimed</DialogTitle>
            <TreasureContent
              showContent={showContent}
              sparkleParticles={sparkleParticles}
              tier={tier}
              animatedPoints={animatedPoints}
              onClose={onClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
