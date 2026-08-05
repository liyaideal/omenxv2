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
}: {
  active: boolean;
  tone: "yes" | "no";
  label: string;
  price: number;
  onClick: () => void;
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
        "flex items-center justify-center rounded-xl px-3 py-4 text-sm font-semibold transition-all",
        cls,
      )}
    >
      <span className="text-base font-bold">
        {label} {pct}¢
      </span>
    </button>
  );
};

export default SideButton;
