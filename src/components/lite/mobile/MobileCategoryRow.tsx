// ============================================================
// MOBILE CATEGORY ROW (390) — scrolling category pills with a right
// fade mask, a divider, then the fixed Watchlist count chip (52px) and
// Calendar icon chip (44px). Contract: list-final-touches-11.html 11B.
// ============================================================
import { Calendar } from "lucide-react";

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

export const MobileCategoryRow = ({
  categories,
  value,
  onSelect,
  watchlistActive,
  watchlistCount,
  onWatchlist,
  calendarActive,
  onCalendar,
}: {
  categories: MobileCategory[];
  value: string;
  onSelect: (id: string) => void;
  watchlistActive: boolean;
  watchlistCount: number;
  onWatchlist: () => void;
  calendarActive: boolean;
  onCalendar: () => void;
}) => (
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
            {c.dot && (
              <span
                className={c.pulse ? "animate-pulse" : undefined}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: c.dot,
                }}
              />
            )}
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
      onClick={onWatchlist}
      aria-label="Watchlist"
      aria-pressed={watchlistActive}
      className="flex items-center justify-center"
      style={{
        flex: "none",
        gap: 5,
        width: 52,
        minHeight: 44,
        borderRadius: 999,
        border: `1px solid ${watchlistActive ? "#F2F3F5" : "#23262D"}`,
        color: watchlistActive ? "#fff" : "#9AA1AC",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: 2, background: "#33D6FF" }}
      />
      {watchlistCount}
    </button>

    <button
      type="button"
      onClick={onCalendar}
      aria-label="Calendar"
      aria-pressed={calendarActive}
      className="flex items-center justify-center"
      style={{
        flex: "none",
        width: 44,
        minHeight: 44,
        borderRadius: 999,
        border: `1px solid ${calendarActive ? "#F2F3F5" : "#23262D"}`,
        color: calendarActive ? "#fff" : "#9AA1AC",
      }}
    >
      <Calendar style={{ width: 15, height: 15 }} strokeWidth={2} />
    </button>
  </div>
);

export default MobileCategoryRow;