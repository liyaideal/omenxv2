// DEMO-STATE: 静态装饰订单簿，不接实时数据流；仅用于 /developers hero 视觉层
import { cn } from "@/lib/utils";

interface Row {
  price: string;
  size: string;
  depth: number; // 0..1
  flash?: boolean;
}

const ASKS: Row[] = [
  { price: "0.5183", size: "1,240", depth: 0.42 },
  { price: "0.5142", size: "2,180", depth: 0.68, flash: true },
  { price: "0.5108", size: "3,415", depth: 0.92, flash: true },
];

const BIDS: Row[] = [
  { price: "0.4972", size: "2,860", depth: 0.84, flash: true },
  { price: "0.4941", size: "1,905", depth: 0.58, flash: true },
  { price: "0.4918", size: "1,140", depth: 0.36 },
];

// Stagger periodic flashes across the flashing rows to fake a live tape.
const FLASH_DELAYS_MS = [0, 900, 1800, 2700];
const FLASH_PERIOD_MS = 3600;

export const MiniOrderBook = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-xl overflow-hidden w-[260px] font-mono text-[10px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/40">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-trading-green animate-pulse" />
          <span className="text-foreground/90 font-semibold">BTC ≥ $150k · Yes</span>
        </div>
        <span className="text-muted-foreground">seq 48,516</span>
      </div>
      <div className="grid grid-cols-3 px-3 py-1 text-muted-foreground text-[9px]">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Depth</span>
      </div>

      {/* Asks */}
      <div>
        {ASKS.map((r, i) => (
          <Row key={`a${i}`} row={r} side="ask" flashSlot={r.flash ? i : undefined} />
        ))}
      </div>

      {/* Mid */}
      <div className="px-3 py-1.5 border-y border-border/50 bg-background/40 flex items-center justify-between">
        <span className="text-foreground font-semibold">0.5040</span>
        <span className="text-muted-foreground text-[9px]">mid</span>
      </div>

      {/* Bids */}
      <div>
        {BIDS.map((r, i) => (
          <Row key={`b${i}`} row={r} side="bid" flashSlot={r.flash ? i + ASKS.length : undefined} />
        ))}
      </div>
    </div>
  );
};

const Row = ({
  row,
  side,
  flashSlot,
}: {
  row: Row;
  side: "ask" | "bid";
  flashSlot?: number;
}) => {
  const isAsk = side === "ask";
  const delay =
    flashSlot != null ? FLASH_DELAYS_MS[flashSlot % FLASH_DELAYS_MS.length] : 0;
  return (
    <div className="relative grid grid-cols-3 px-3 py-1">
      {/* Depth bar */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 transition-all",
          isAsk ? "bg-trading-red/10" : "bg-trading-green/10",
        )}
        style={{ width: `${row.depth * 100}%` }}
      />
      {/* Flash overlay — static tint fallback + motion-safe infinite pulse */}
      {row.flash && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 pointer-events-none",
            isAsk ? "bg-trading-red/10" : "bg-trading-green/10",
            isAsk
              ? "motion-safe:[animation:flash-red_3600ms_ease-out_infinite]"
              : "motion-safe:[animation:flash-green_3600ms_ease-out_infinite]",
          )}
          style={{ animationDelay: `${delay}ms` }}
        />
      )}
      <span className={cn("relative z-10", isAsk ? "text-trading-red" : "text-trading-green")}>
        {row.price}
      </span>
      <span className="relative z-10 text-center text-foreground/70">{row.size}</span>
      <span className="relative z-10 text-right text-muted-foreground">
        {Math.round(row.depth * 100)}%
      </span>
    </div>
  );
};
