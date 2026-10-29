// The small lime QUICK PLAY tag that sits to the right of a title — on the
// Settled › Standard session row and on the session detail page (CPO
// 2026-10-29: tag after the title so every title's left edge lines up).
export const QuickPlayTag = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-[5px] px-1.5 py-[2px] text-[10px] font-bold leading-[1.2] ${className}`}
    style={{
      background: "rgba(207,255,74,.12)",
      border: "1px solid rgba(207,255,74,.4)",
      color: "#CFFF4A",
      letterSpacing: "1px",
    }}
  >
    QUICK PLAY
  </span>
);
