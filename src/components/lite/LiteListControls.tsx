// ============================================================
// Lite events list — header controls (LOCKED spec, list header v3).
// Watchlist chip, trait toggle chips (Boost / Intraday) and the
// mobile Topics bottom sheet. Lucide icons only, no emoji.
// ============================================================
import { Check, ChevronDown, Star, Timer, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ---------------- Watchlist chip ---------------- */
export const WatchlistChip = ({
  active,
  count,
  showLabel = false,
  onClick,
}: {
  active: boolean;
  count: number;
  showLabel?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex shrink-0 items-center gap-[5px] rounded-full border-[1.5px] transition-colors"
    style={{
      padding: "6px 11px",
      borderColor: active ? "#FFD23E" : "#2B2F38",
      background: active ? "#FFD23E" : "transparent",
    }}
  >
    <Star
      className="h-3.5 w-3.5"
      style={{ color: active ? "#241B00" : "#FFD23E", fill: active ? "#241B00" : "#FFD23E" }}
      strokeWidth={1.5}
    />
    {showLabel && (
      <span
        className="font-display font-semibold"
        style={{ fontSize: 12, color: active ? "#241B00" : "#C9CED6" }}
      >
        Watchlist
      </span>
    )}
    {count > 0 && (
      <span
        className="font-display font-semibold"
        style={{ fontSize: 12, color: active ? "#241B00" : "#C9CED6" }}
      >
        {showLabel ? `· ${count}` : count}
      </span>
    )}
  </button>
);

/* ---------------- Trait chips ---------------- */
const TRAIT = {
  boost: { on: "#CFFF4A", ink: "#1a2408", icon: "#CFFF4A", label: "Boost" },
  intraday: {
    on: "hsl(var(--badge-intraday))",
    ink: "#2A1200",
    icon: "hsl(var(--badge-intraday))",
    label: "Intraday",
  },
} as const;

export const TraitChip = ({
  kind,
  active,
  onClick,
}: {
  kind: "boost" | "intraday";
  active: boolean;
  onClick: () => void;
}) => {
  const t = TRAIT[kind];
  const Icon = kind === "boost" ? Zap : Timer;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-[5px] rounded-full border-[1.5px] font-display font-semibold transition-colors"
      style={{
        padding: "7px 13px",
        fontSize: 12.5,
        borderColor: active ? t.on : "#2B2F38",
        background: active ? t.on : "transparent",
        color: active ? t.ink : "#C9CED6",
      }}
    >
      <Icon
        className="h-3 w-3"
        style={{ color: active ? t.ink : t.icon, fill: active ? t.ink : t.icon }}
        strokeWidth={1.5}
      />
      {t.label}
    </button>
  );
};

/* ---------------- Mobile topic selector button ---------------- */
export const TopicSelectorButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex shrink-0 items-center gap-[6px] rounded-full border-[1.5px] font-display font-semibold transition-colors"
    style={{
      padding: "7px 14px",
      fontSize: 12.5,
      borderColor: active ? "#FFFFFF" : "#2B2F38",
      background: active ? "#FFFFFF" : "transparent",
      color: active ? "#0A0B0D" : "#C9CED6",
    }}
  >
    {label}
    <ChevronDown className="h-3 w-3" style={{ color: active ? "#0A0B0D" : "#6B7280" }} />
  </button>
);

/* ---------------- Topics bottom sheet ---------------- */
export interface TopicOption {
  id: string;
  label: string;
  count: number;
}

export const TopicSheet = ({
  open,
  onOpenChange,
  options,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  options: TopicOption[];
  value: string;
  onSelect: (id: string) => void;
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      className="border-0 p-0 pb-8 [&>button]:hidden"
      style={{
        background: "#14171C",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTop: "1px solid #2B2F38",
      }}
    >
      <div style={{ paddingTop: 10 }}>
        <div
          className="mx-auto rounded-full"
          style={{ width: 36, height: 4, background: "#3A3F49" }}
        />
        <SheetTitle
          className="font-display"
          style={{ marginTop: 12, fontSize: 16, fontWeight: 700, paddingLeft: 20, paddingRight: 20 }}
        >
          Topics
        </SheetTitle>
        <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 4 }}>
          {options.map((o, i) => {
            const selected = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onSelect(o.id);
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-[10px]"
                style={{
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderBottom: i === options.length - 1 ? "none" : "1px solid #1D2026",
                }}
              >
                <span
                  className="font-display"
                  style={{ fontSize: 14, fontWeight: 600, color: selected ? "#FFFFFF" : "#C9CED6" }}
                >
                  {o.label}
                </span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{o.count}</span>
                <span className="flex-1" />
                <span
                  className={cn("flex items-center justify-center rounded-full")}
                  style={{
                    width: 18,
                    height: 18,
                    border: `1.5px solid ${selected ? "#FFFFFF" : "#2B2F38"}`,
                    background: selected ? "#FFFFFF" : "transparent",
                  }}
                >
                  {selected && <Check className="h-3 w-3" style={{ color: "#0A0B0D" }} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SheetContent>
  </Sheet>
);
