// ============================================================
// MOBILE CATEGORY ROW (390) — scrolling category pills with a right
// fade mask, a divider, then a single 44px controls entry (SlidersHorizontal)
// that opens a bottom sheet holding Boost / Watchlist / Calendar.
// Contract: list-final-touches-11.html 11B (right cluster collapsed).
// ============================================================
import { useState } from "react";
import { Calendar, SlidersHorizontal, Star, Zap } from "lucide-react";
import { LivePulse } from "@/components/lite/shared/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface MobileCategory {
  id: string;
  label: string;
  /** Sector dot colour (Intraday orange, Sports red). */
  dot?: string;
  /** Sports dot pulses only while a match is in play. */
  pulse?: boolean;
}

const PILL: React.CSSProperties = {
  flex: "none",
  display: "flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  minHeight: 44,
  fontSize: 12,
};

const SheetRow = ({
  icon: Icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: typeof Star;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className="flex w-full items-center rounded-lg border p-3 text-left"
    style={{
      gap: 12,
      minHeight: 56,
      background: active ? "rgba(255,255,255,.06)" : "transparent",
      borderColor: active ? "#F2F3F5" : "#23262D",
    }}
  >
    <Icon
      style={{ width: 18, height: 18, flex: "none" }}
      strokeWidth={2}
      color={active ? "#F2F3F5" : "#9AA1AC"}
    />
    <span className="min-w-0 flex-1">
      <span
        className="block"
        style={{ fontSize: 14, fontWeight: 600, color: active ? "#F2F3F5" : "#C7CCD4" }}
      >
        {label}
      </span>
      <span className="block" style={{ fontSize: 12, color: "#6B7280" }}>
        {hint}
      </span>
    </span>
    <span
      aria-hidden
      style={{
        flex: "none",
        width: 16,
        height: 16,
        borderRadius: 999,
        border: `1px solid ${active ? "#F2F3F5" : "#3A3F49"}`,
        background: active ? "#F2F3F5" : "transparent",
      }}
    />
  </button>
);

export const MobileCategoryRow = ({
  categories,
  value,
  onSelect,
  watchlistActive,
  watchlistCount,
  onWatchlist,
  calendarActive,
  onCalendar,
  boostActive,
  onBoost,
}: {
  categories: MobileCategory[];
  value: string;
  onSelect: (id: string) => void;
  watchlistActive: boolean;
  watchlistCount: number;
  onWatchlist: () => void;
  calendarActive: boolean;
  onCalendar: () => void;
  /** Boost trait — composes in place with whatever view is open. */
  boostActive?: boolean;
  onBoost?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const anyActive = watchlistActive || calendarActive || !!boostActive;

  return (
  <div
    className="flex items-center"
    style={{ gap: 8, paddingBottom: 12, borderBottom: "1px solid #1D2026" }}
  >
    <div
      className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        gap: 8,
        maskImage:
          "linear-gradient(to right,#000 0,#000 calc(100% - 18px),transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right,#000 0,#000 calc(100% - 18px),transparent 100%)",
      }}
    >
      {categories.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            style={{
              ...PILL,
              padding: active ? "0 15px" : "0 14px",
              background: active ? "#fff" : "transparent",
              color: active ? "#0A0B0D" : "#9AA1AC",
              border: `1px solid ${active ? "#fff" : "#23262D"}`,
              fontWeight: active ? 700 : 600,
            }}
          >
            {c.dot &&
              (c.pulse ? (
                <LivePulse size={6} color={c.dot} />
              ) : (
                <span
                  style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }}
                />
              ))}
            {c.label}
          </button>
        );
      })}
    </div>

    <span
      aria-hidden
      style={{ flex: "none", width: 1, height: 28, background: "#23262D" }}
    />

    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Filters and views"
      aria-pressed={anyActive}
      className="relative flex items-center justify-center"
      style={{
        flex: "none",
        width: 44,
        minHeight: 44,
        borderRadius: 999,
        border: `1px solid ${anyActive ? "#F2F3F5" : "#23262D"}`,
        color: anyActive ? "#fff" : "#9AA1AC",
      }}
    >
      <SlidersHorizontal style={{ width: 15, height: 15 }} strokeWidth={2} />
      {anyActive && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#33D6FF",
          }}
        />
      )}
    </button>

    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t"
        style={{
          paddingLeft: 18,
          paddingRight: 18,
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle style={{ fontSize: 14 }}>Filters & views</SheetTitle>
        </SheetHeader>
        <div className="mt-3 flex flex-col" style={{ gap: 8 }}>
          {onBoost && (
            <SheetRow
              icon={Zap}
              label="Boost"
              hint="Only events you can boost"
              active={!!boostActive}
              onClick={() => {
                onBoost();
                setOpen(false);
              }}
            />
          )}
          <SheetRow
            icon={Star}
            label={watchlistCount > 0 ? `Watchlist (${watchlistCount})` : "Watchlist"}
            hint="Events you saved"
            active={watchlistActive}
            onClick={() => {
              onWatchlist();
              setOpen(false);
            }}
          />
          <SheetRow
            icon={Calendar}
            label="Calendar"
            hint="See everything by day"
            active={calendarActive}
            onClick={() => {
              onCalendar();
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  </div>
  );
};

export default MobileCategoryRow;