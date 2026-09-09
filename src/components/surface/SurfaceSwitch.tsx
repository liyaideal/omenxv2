/**
 * SurfaceSwitch — trade-page-only Lite / Pro control (D6'-1, FIX3).
 *
 * There is no site-wide mode any more: every non-trade page is always Lite.
 * The only place a reader may switch is the trade page chrome (/trade,
 * /trade/order, /spot), and only when signed in — guests get null.
 *
 * Two anatomies:
 * - `header` / `compact` — one segmented control in the desktop page header.
 * - `dock` — a square ghost button living in the mobile sticky buy bar,
 *   labelled with the DESTINATION view.
 */
import { ArrowLeftRight } from "lucide-react";
import { useSurface, type Surface } from "@/contexts/SurfaceContext";
import { useAuth } from "@/hooks/useAuth";

type Size = "header" | "compact" | "dock";

const SEG: Record<"header" | "compact", string> = {
  header: "h-[22px] px-2.5 text-[11px]",
  compact: "h-[20px] px-2 text-[10.5px]",
};

const SHELL: Record<"header" | "compact", string> = {
  header: "h-7",
  compact: "h-[26px]",
};

export const SurfaceSwitch = ({
  size = "header",
  previewSignedIn,
  previewActive,
}: {
  size?: Size;
  /** style-guide only — force the signed-in branch. */
  previewSignedIn?: boolean;
  /** style-guide only — force which segment reads as active. */
  previewActive?: Surface;
}) => {
  const { surface, setSurface } = useSurface();
  const { user } = useAuth();
  const signedIn = previewSignedIn ?? !!user;
  const current = previewActive ?? surface;

  // Guests never see the switch — they always read the Lite trade page.
  if (!signedIn) return null;

  if (size === "dock") {
    const other: Surface = current === "lite" ? "pro" : "lite";
    const label = other === "pro" ? "Pro" : "Lite";
    return (
      <button
        type="button"
        aria-label={`Switch to ${label} view`}
        onClick={() => setSurface(other)}
        className="flex w-[46px] shrink-0 flex-col items-center justify-center gap-0.5 self-stretch rounded-[10px] border border-border bg-muted/50 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="text-[10px] font-bold leading-none">{label}</span>
      </button>
    );
  }

  const items = [
    { id: "lite" as const, label: "Lite" },
    { id: "pro" as const, label: "Pro" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Trading view"
      className={`inline-flex items-center ${SHELL[size]} rounded-lg border border-border bg-muted/50 p-0.5`}
    >
      {items.map((it) => {
        const active = current === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setSurface(it.id)}
            className={`${SEG[size]} rounded-md font-semibold leading-none transition-colors duration-150 ${
              active
                ? "bg-white text-[#0a0b0d]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
};
