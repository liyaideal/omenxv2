interface LaurelWreathProps {
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  showTrophy?: boolean;
}

// Complete circular laurel wreath
export const LaurelWreath = ({ className = "", color = "#FFD700", size = "md", showTrophy = false }: LaurelWreathProps) => {
  const sizeMap = {
    sm: { width: 70, height: 70 },
    md: { width: 90, height: 90 },
    lg: { width: 110, height: 110 },
  };

  const { width, height } = sizeMap[size];

  return (
    <svg
      viewBox="0 0 100 100"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left branch - bottom to top */}
      <g fill={color}>
        <ellipse cx="18" cy="75" rx="5" ry="10" transform="rotate(-60 18 75)" />
        <ellipse cx="12" cy="62" rx="5" ry="10" transform="rotate(-45 12 62)" />
        <ellipse cx="10" cy="48" rx="5" ry="10" transform="rotate(-30 10 48)" />
        <ellipse cx="12" cy="35" rx="5" ry="10" transform="rotate(-15 12 35)" />
        <ellipse cx="18" cy="23" rx="5" ry="10" transform="rotate(5 18 23)" />
        <ellipse cx="28" cy="14" rx="5" ry="10" transform="rotate(25 28 14)" />
        <ellipse cx="40" cy="8" rx="4" ry="8" transform="rotate(45 40 8)" />
      </g>

      {/* Right branch - bottom to top (mirrored) */}
      <g fill={color}>
        <ellipse cx="82" cy="75" rx="5" ry="10" transform="rotate(60 82 75)" />
        <ellipse cx="88" cy="62" rx="5" ry="10" transform="rotate(45 88 62)" />
        <ellipse cx="90" cy="48" rx="5" ry="10" transform="rotate(30 90 48)" />
        <ellipse cx="88" cy="35" rx="5" ry="10" transform="rotate(15 88 35)" />
        <ellipse cx="82" cy="23" rx="5" ry="10" transform="rotate(-5 82 23)" />
        <ellipse cx="72" cy="14" rx="5" ry="10" transform="rotate(-25 72 14)" />
        <ellipse cx="60" cy="8" rx="4" ry="8" transform="rotate(-45 60 8)" />
      </g>

      {/* Trophy icon at top center for 1st place */}
      {showTrophy && (
        <g fill={color} transform="translate(42, -2) scale(0.16)">
          <path d="M50 20h-8v-8c0-2.2-1.8-4-4-4H26c-2.2 0-4 1.8-4 4v8h-8c-2.2 0-4 1.8-4 4v12c0 8.8 7.2 16 16 16h4c1.1 4.5 4.2 8.3 8.5 10.5V72H26c-2.2 0-4 1.8-4 4v4h40v-4c0-2.2-1.8-4-4-4H45.5V62.5c4.3-2.2 7.4-6 8.5-10.5h4c8.8 0 16-7.2 16-16V24c0-2.2-1.8-4-4-4zM18 36V28h4v12c0 1.4.1 2.7.3 4-2.5-1.8-4.3-4.6-4.3-8zm32-16v20c0 5.5-4.5 10-10 10h-4c-5.5 0-10-4.5-10-10V20h24zm16 16c0 3.4-1.8 6.2-4.3 8 .2-1.3.3-2.6.3-4V28h4v8z"/>
        </g>
      )}
    </svg>
  );
};

export const LaurelBadge = ({ rank, className = "" }: { rank: number; className?: string }) => {
  const getColors = () => {
    switch (rank) {
      case 1:
        return { leaf: "#FFD700", badge: "from-yellow-400 via-yellow-500 to-amber-600", text: "#1a1a2e" };
      case 2:
        return { leaf: "#C0C0C0", badge: "from-slate-300 via-slate-400 to-slate-500", text: "#1a1a2e" };
      case 3:
        return { leaf: "#CD7F32", badge: "from-amber-600 via-amber-700 to-orange-800", text: "#fff" };
      default:
        return { leaf: "#8B8B8B", badge: "from-slate-500 to-slate-600", text: "#fff" };
    }
  };

  const { leaf, text } = getColors();
  const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <LaurelWreath color={leaf} size="md" showTrophy={rank === 1} />
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-baseline gap-0.5 font-bold`}
        style={{ color: text }}
      >
        <span className="text-lg">{rank}</span>
        <span className="text-xs">{suffix}</span>
      </div>
    </div>
  );
};

export const SmallLaurelBadge = ({ rank }: { rank: number }) => {
  const getColors = () => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-slate-400";
      case 3:
        return "text-amber-600";
      case 4:
      case 5:
        return "text-primary/60";
      default:
        return "text-muted-foreground/40";
    }
  };

  return (
    <div className={`flex items-center justify-center w-10 font-bold text-sm ${getColors()}`}>
      #{rank}
    </div>
  );
};