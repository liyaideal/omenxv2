import { useState, useEffect } from "react";

const DISCORD_URL = "https://discord.gg/qXssm2crf9";
const TOOLTIP_DISMISSED_KEY = "discord-tooltip-dismissed";

export const FloatingDiscordButton = ({ className = "" }: { className?: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setShowTooltip(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClick = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "1");
    window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
  };

  const dismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "1");
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed z-50 group ${className}`}
      aria-label="Join our Discord community"
    >
      {/* Discord icon button */}
      <div className="relative w-9 h-9 rounded-full bg-[#5865F2]/80 shadow-md flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#5865F2] group-active:scale-95">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.8733.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
        </svg>
      </div>

      {/* First-visit tooltip */}
      {showTooltip && (
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 animate-fade-in">
          <div className="relative px-3 py-2 rounded-lg bg-[#5865F2] text-white shadow-lg whitespace-nowrap">
            <p className="text-xs font-medium">Join our community 💬</p>
            <button
              onClick={dismissTooltip}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-background text-foreground flex items-center justify-center text-[10px] shadow"
            >
              ✕
            </button>
            {/* Arrow */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-[#5865F2] rotate-45" />
          </div>
        </div>
      )}
    </button>
  );
};
