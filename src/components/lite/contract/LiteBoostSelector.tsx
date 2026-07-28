// ============================================================
// Boost tier chips + in-place Custom tray. Tiers are derived from
// category_boost_configs.max_leverage — never hardcoded. The tray
// expands INSIDE the card (no secondary dialog / drawer).
// ============================================================
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SELECTED_STYLE: React.CSSProperties = {
  background: "linear-gradient(120deg, rgba(207,255,74,.18), rgba(51,214,255,.20))",
  boxShadow: "inset 0 0 0 1.5px rgba(51,214,255,.5)",
};

interface Props {
  categoryLabel: string;
  maxBoost: number;
  tiers: number[];
  value: number;
  onChange: (v: number) => void;
  variant: "desktop" | "mobile";
}

export const LiteBoostSelector = ({
  categoryLabel,
  maxBoost,
  tiers,
  value,
  onChange,
  variant,
}: Props) => {
  const [trayOpen, setTrayOpen] = useState(false);
  const isCustom = !tiers.includes(value);
  const customWidth = variant === "desktop" ? 84 : 78;
  const gridValues = Array.from({ length: maxBoost }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Boost — multiply your call
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {categoryLabel} · up to {maxBoost}×
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {tiers.map((t) => {
          const active = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setTrayOpen(false);
              }}
              style={active ? SELECTED_STYLE : undefined}
              className={cn(
                "h-10 flex-1 rounded-xl font-mono text-sm font-semibold transition-all",
                active
                  ? "text-yes"
                  : "border-[1.5px] border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t}×
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setTrayOpen((o) => !o)}
          className={cn(
            "flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl text-sm font-semibold transition-all",
            isCustom
              ? "font-mono text-yes"
              : "border-[1.5px] border-border text-muted-foreground hover:text-foreground",
          )}
          aria-label="Choose a custom boost"
          style={{ ...(isCustom ? SELECTED_STYLE : {}), width: customWidth }}
        >
          {isCustom ? `${value}×` : "Custom"}
          {trayOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {trayOpen && (
        <div className="grid grid-cols-5 gap-1.5 rounded-xl border border-border bg-muted/20 p-2">
          {gridValues.map((v) => {
            const active = value === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onChange(v);
                  setTrayOpen(false);
                }}
                style={active ? SELECTED_STYLE : undefined}
                className={cn(
                  "flex h-11 flex-col items-center justify-center rounded-lg transition-all",
                  active
                    ? "text-yes"
                    : "border-[1.5px] border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="font-mono text-sm font-semibold">{v}×</span>
                {v === 1 && <span className="text-[9px] opacity-70">none</span>}
                {v === maxBoost && <span className="text-[9px] opacity-70">max</span>}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Bigger Boost, bigger win if you're right — and an earlier auto-close if the
        price moves against you.
      </p>
    </div>
  );
};

export default LiteBoostSelector;
