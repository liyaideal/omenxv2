import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "./Countdown";

interface Props {
  triggerRef: RefObject<HTMLElement>;
  onCta: (section: string) => void;
}

export const MobileFloatingCTA = ({ triggerRef, onCta }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [triggerRef]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-mainnet-gold/20 bg-background/95 p-3 backdrop-blur md:hidden">
      <Button onClick={() => onCta("floating") } className="h-12 w-full justify-between rounded-sm bg-mainnet-gold font-mono text-background hover:bg-mainnet-gold/90">
        <span>Claim My Bonus</span>
        <span className="flex items-center gap-3 text-xs font-mono"><Countdown compact /><ArrowRight className="h-4 w-4" /></span>
      </Button>
    </div>
  );
};
