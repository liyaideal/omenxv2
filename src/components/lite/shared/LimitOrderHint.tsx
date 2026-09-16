// ============================================================
// SW-2 · LimitOrderHint — the one Lite → Pro doorway inside an order panel.
//
// One muted footnote under the CTA: `Want to place a limit order? Pro ›`.
// "limit order" is an APPROVED exception to the Lite banned-word rule (same
// reasoning as the events-page escape hatch: the doorway to Pro may name
// what Pro has). Shows only to signed-in readers on a device that has never
// rendered Pro; clicking switches the surface, keeps the event, and asks the
// Pro panel to open on `Limit`.
// ============================================================
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSurface } from "@/contexts/SurfaceContext";
import { hasVisitedPro, requestOpenLimit } from "@/lib/proHandoff";
import { cn } from "@/lib/utils";

export const LIMIT_ORDER_HINT_COPY = "Want to place a limit order?";

export const LimitOrderHint = ({
  line,
  className,
  previewForce,
}: {
  /** Which Pro terminal the click lands on. */
  line: "futures" | "spot";
  className?: string;
  /** Style-guide only: render regardless of session / visited state, inert. */
  previewForce?: boolean;
}) => {
  const { user } = useAuth();
  const { setSurface } = useSurface();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [params] = useSearchParams();

  if (!previewForce && (!user || hasVisitedPro())) return null;

  const onClick = () => {
    if (previewForce) return;
    requestOpenLimit();
    setSurface("pro");
    if (isMobile) {
      const eventId = params.get("event");
      const base = line === "spot" ? "/spot" : "/trade";
      navigate(`${base}/order${eventId ? `?event=${encodeURIComponent(eventId)}` : ""}`);
    }
  };

  return (
    <p className={cn("text-center text-[10px] text-muted-foreground/70", className)}>
      {LIMIT_ORDER_HINT_COPY}{" "}
      <button
        type="button"
        onClick={onClick}
        className="font-semibold text-primary hover:underline"
        aria-label="Switch to Pro to place a limit order"
      >
        Pro ›
      </button>
    </p>
  );
};
