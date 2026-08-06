// ============================================================
// SHARED ORDER-PANEL SIDE BUTTON — the Yes/No (or aliased) pair at the
// top of both Lite order panels. Canonical look = the spot panel's.
// ============================================================
import { cn } from "@/lib/utils";

export const SideButton = ({
  active,
  tone,
  label,
  price,
  onClick,
  size = "default",
}: {
  active: boolean;
  tone: "yes" | "no";
  label: string;
  price: number;
  onClick: () => void;
  /** `compact` = card/rail density (quick-round PickCard). Same states. */
  size?: "default" | "compact";
}) => {
  const pct = Math.round(price * 100);
  const yesActive = "bg-yes text-[#04222c] border-transparent";
  const noActive = "bg-no text-[#1a2408] border-transparent";
  const yesGhost = "bg-yes/12 text-yes border-[1.5px] border-yes/25";
  const noGhost = "bg-no/12 text-no border-[1.5px] border-no/25";
  const cls = active
    ? tone === "yes"
      ? yesActive
      : noActive
    : tone === "yes"
      ? yesGhost
      : noGhost;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-xl font-semibold transition-all",
        size === "compact" ? "px-3 py-2.5 text-sm" : "px-3 py-4 text-sm",
        cls,
      )}
    >
      <span className={cn("font-bold", size === "compact" ? "text-sm" : "text-base")}>
        {label} {pct}¢
      </span>
    </button>
  );
};

export default SideButton;
