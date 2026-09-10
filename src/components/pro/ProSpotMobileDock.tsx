// ============================================================
// SP-2 · B2 — sticky bottom bar for the mobile Pro SPOT charts view.
// Two-stage tap: first tap selects the outcome, second tap opens
// `/spot/order`. The Lite/Pro switch is the first child of the row
// (DESIGN §14: dock placement, never in the header).
// ============================================================
import { ArrowRight } from "lucide-react";
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";
import { cn } from "@/lib/utils";

export interface ProSpotMobileDockProps {
  available: number;
  yesLabel: string;
  noLabel: string;
  yesPrice: number;
  noPrice: number;
  /** Currently selected outcome. Mobile Charts always starts with one active side. */
  selected: "yes" | "no";
  onTap: (which: "yes" | "no") => void;
  blocked?: boolean;
  blockedReason?: string | null;
  /** Style Guide fixture switch — hides the Lite/Pro control in previews. */
  showSurfaceSwitch?: boolean;
  /** Style Guide only: render the Lite/Pro control inert (same pattern as the foundations key). */
  surfaceSwitchPreview?: { signedIn: boolean; active: "lite" | "pro" };
  className?: string;
}

export const ProSpotMobileDock = ({
  available,
  yesLabel,
  noLabel,
  selected,
  onTap,
  blocked = false,
  blockedReason,
  showSurfaceSwitch = true,
  surfaceSwitchPreview,
  className,
}: ProSpotMobileDockProps) => (
  <div
    className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/30 px-4 py-3",
      className,
    )}
    style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
  >
    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
      <span>
        Available{" "}
        {available.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
        USDC
      </span>
      <span className="opacity-70">Tap to switch view · tap again to trade</span>
    </div>
    <div className="flex gap-1.5">
      {showSurfaceSwitch && (
        <SurfaceSwitch
          size="dock"
          previewSignedIn={surfaceSwitchPreview?.signedIn}
          previewActive={surfaceSwitchPreview?.active}
        />
      )}
      <button
        onClick={() => onTap("yes")}
        disabled={blocked}
        aria-pressed={selected === "yes"}
        className={cn(
          "flex-1 font-semibold rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:active:scale-100",
          selected === "yes"
            ? "bg-yes text-yes-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_3px_hsl(var(--yes)/0.4)]"
            : "bg-yes/15 text-yes border border-yes/30",
        )}
      >
        <span>
          {blocked ? blockedReason || "Market frozen" : yesLabel}
        </span>
        {!blocked && selected === "yes" && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={() => onTap("no")}
        disabled={blocked}
        aria-pressed={selected === "no"}
        className={cn(
          "flex-1 font-semibold rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:active:scale-100",
          selected === "no"
            ? "bg-no text-no-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_3px_hsl(var(--no)/0.4)]"
            : "bg-no/15 text-no border border-no/30",
        )}
      >
        <span>
          {blocked ? blockedReason || "Market frozen" : noLabel}
        </span>
        {!blocked && selected === "no" && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  </div>
);
