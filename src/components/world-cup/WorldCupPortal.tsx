import { WorldCupPanel } from "./WorldCupPanel";
import { WorldCupTeaserPanel } from "./WorldCupTeaserPanel";
import { getWorldCupPhase } from "@/lib/worldCup";

/**
 * Phase-aware portal — **desktop only** (≥md breakpoint).
 * Mobile Sports entry is owned by BottomNav and lives separately;
 * the floating bottom-right panel must never appear on mobile.
 *
 * - teaser (before kickoff): countdown + opening match preview
 * - live (during tournament): scoreboard + upcoming
 * - off: render nothing
 */
export const WorldCupPortal = () => {
  const phase = getWorldCupPhase();
  if (phase === "off") return null;
  return (
    <div className="hidden md:block">
      {phase === "teaser" ? <WorldCupTeaserPanel /> : <WorldCupPanel />}
    </div>
  );
};

export default WorldCupPortal;
