// ============================================================
// SP-2 · B2 — sticky bottom bar for the mobile Pro charts views (/spot and,
// since DK-1, /trade). Two-stage tap: first tap selects the outcome, second
// tap opens the order page. The Lite/Pro switch is the first child of the row
// (DESIGN §14: dock placement, never in the header).
// DK-1: while ordering is blocked the two buttons collapse into ONE inert bar
// that prints the reason once; the "tap again to trade" hint is hidden.
// ============================================================
import { ArrowRight } from "lucide-react";
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";
import { cn } from "@/lib/utils";

export interface ProSpotMobileDockProps {
  available: number;
  yesLabel: string;
  noLabel: string;
  yesPrice?: number;
  noPrice?: number;
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
      {!blocked && <span className="opacity-70">Tap to switch view · tap again to trade</span>}
    </div>
    <div className="flex gap-1.5">
      {showSurfaceSwitch && (
        <SurfaceSwitch
          size="dock"
          previewSignedIn={surfaceSwitchPreview?.signedIn}
          previewActive={surfaceSwitchPreview?.active}
        />
      )}
      {blocked ? (
        <div
          role="status"
          aria-live="polite"
          className="flex-1 flex items-center justify-center rounded-lg border border-border/60 bg-muted/40 py-2.5 text-sm font-medium text-muted-foreground"
        >
          {blockedReason || "Market unavailable"}
        </div>
      ) : (
      <>
      <button
        onClick={() => onTap("yes")}
                aria-pressed={selected === "yes"}
        className={cn(
          "flex-1 font-semibold rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:active:scale-100",
          selected === "yes"
            ? "bg-yes text-yes-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_3px_hsl(var(--yes)/0.4)]"
            : "bg-yes/15 text-yes border border-yes/30",
        )}
      >
        <span>{yesLabel}</span>
        {selected === "yes" && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={() => onTap("no")}
                aria-pressed={selected === "no"}
        className={cn(
          "flex-1 font-semibold rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:active:scale-100",
          selected === "no"
            ? "bg-no text-no-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_3px_hsl(var(--no)/0.4)]"
            : "bg-no/15 text-no border border-no/30",
        )}
      >
        <span>{noLabel}</span>
        {selected === "no" && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
      </>
      )}
    </div>
  </div>
);
