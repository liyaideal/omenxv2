/**
 * SurfaceSwitch — trade-page-only Simple / Pro control (D6'-1).
 *
 * There is no site-wide mode any more: every non-trade page is always Lite.
 * The only place a reader may switch is the trade page chrome (/trade,
 * /trade/order, /spot), and only when signed in — guests get null.
 *
 * Visual language is the portfolio SegmentChips pill pair (parts.tsx),
 * so the control reads as an in-page segment, not as a global setting.
 */
import { useSurface } from "@/contexts/SurfaceContext";
import { useAuth } from "@/hooks/useAuth";

type Size = "header" | "compact";

const PAD: Record<Size, string> = {
  header: "px-3.5 py-[7px] text-[12.5px]",
  compact: "px-3 py-[5px] text-[11.5px]",
};

export const SurfaceSwitch = ({ size = "header" }: { size?: Size }) => {
  const { surface, setSurface } = useSurface();
  const { user } = useAuth();

  // Guests never see the switch — they always read the Lite trade page.
  if (!user) return null;

  const items = [
    { id: "lite" as const, label: "Simple" },
    { id: "pro" as const, label: "Pro" },
  ];

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Trading view">
      {items.map((it) => {
        const active = surface === it.id;
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={active}
            onClick={() => setSurface(it.id)}
            className={`rounded-full ${PAD[size]}`}
            style={
              active
                ? { background: "#FFFFFF", color: "#0B0D10", fontWeight: 700 }
                : {
                    background: "#14171C",
                    border: "1px solid #262B33",
                    color: "#C7CCD4",
                    fontWeight: 600,
                  }
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
};
