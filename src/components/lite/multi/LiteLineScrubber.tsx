// ============================================================
// Discrete line switch for sports game lines (handicap / total).
// Not a slider: the values are a fixed ladder, so the control pages
// through a window of them and marks the active one with a triangle.
// Pure presentational — the trade page swaps the active event.
// ============================================================
import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSignedLine } from "@/components/lite/sports/sportsData";

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  /** Defaults to the signed handicap format. Totals pass a plain formatter. */
  format?: (n: number) => string;
  compact?: boolean;
  windowSize?: number;
}

export const LiteLineScrubber = ({
  values,
  value,
  onChange,
  format = formatSignedLine,
  compact = false,
  windowSize,
}: Props) => {
  const size = windowSize ?? (compact ? 4 : 6);
  const idx = Math.max(0, values.indexOf(value));
  const rootRef = useRef<HTMLDivElement>(null);

  // Window centred on the active value, clamped to the ends.
  const start = useMemo(() => {
    if (values.length <= size) return 0;
    return Math.max(0, Math.min(values.length - size, idx - Math.floor(size / 2)));
  }, [values.length, size, idx]);
  const shown = values.slice(start, start + size);

  const step = (delta: number) => {
    const next = values[Math.max(0, Math.min(values.length - 1, idx + delta))];
    if (next !== undefined && next !== value) onChange(next);
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  });

  if (values.length <= 1) return null;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="group"
      aria-label="Line"
      className={cn(
        "flex h-10 items-center border-t border-border/90 px-1 outline-none",
        compact ? "-mx-3 -mb-2.5 mt-2.5" : "-mx-4 -mb-2.5 mt-2.5",
      )}
    >
      <button
        type="button"
        aria-label="Previous lines"
        disabled={start === 0}
        onClick={() => onChange(values[Math.max(0, start - size)])}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <div className="flex flex-1 justify-center">
        {shown.map((v) => {
          const active = v === value;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(v)}
              className={cn(
                "relative flex h-9 w-11 items-center justify-center font-mono text-[13px] text-muted-foreground",
                active && "text-[15px] font-bold text-foreground",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-[2px] -translate-x-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-yes"
                />
              )}
              {format(v)}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="More lines"
        disabled={start + size >= values.length}
        onClick={() =>
          onChange(values[Math.min(values.length - 1, start + size)])
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default LiteLineScrubber;
