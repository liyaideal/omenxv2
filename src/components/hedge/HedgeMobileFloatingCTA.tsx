import { useEffect, useState, RefObject } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { HedgeCTAButton } from "./HedgeCTAButton";

interface Props {
  triggerRef: RefObject<HTMLElement>;
}

/**
 * Mobile-only floating CTA bar — slides in once the hero leaves the viewport.
 * Styled to match the retro poster theme (ink border + paper background).
 */
export const HedgeMobileFloatingCTA = ({ triggerRef }: Props) => {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, triggerRef]);

  if (!isMobile) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t-4 border-[#0E0E0E] bg-[#FDFCF0] px-4 pt-3 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <HedgeCTAButton fullWidth />
    </div>
  );
};
