import { cn } from "@/lib/utils";

const ENDPOINTS: Array<{ method: "GET" | "POST" | "DELETE" | "ws"; path: string }> = [
  { method: "GET", path: "/v1/markets" },
  { method: "GET", path: "/v1/markets/{symbol}/book" },
  { method: "POST", path: "/v1/orders/preview" },
  { method: "POST", path: "/v1/orders" },
  { method: "DELETE", path: "/v1/orders/{id}" },
  { method: "GET", path: "/v1/positions" },
  { method: "GET", path: "/v1/account/funding" },
  { method: "ws", path: "market.snapshot" },
  { method: "ws", path: "market.book" },
  { method: "ws", path: "orders" },
  { method: "ws", path: "positions" },
];

const methodCls = (m: string) =>
  m === "GET"
    ? "text-trading-green"
    : m === "POST"
    ? "text-trading-purple"
    : m === "DELETE"
    ? "text-trading-red"
    : "text-primary";

export const EndpointMarquee = () => {
  const row = [...ENDPOINTS, ...ENDPOINTS];
  return (
    <div
      className="relative overflow-hidden py-3"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="flex gap-2 w-max motion-safe:animate-[marquee_57s_linear_infinite] hover:[animation-play-state:paused]"
        style={{ animationPlayState: undefined }}
      >
        {row.map((e, i) => (
          <div
            key={i}
            className="shrink-0 rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-xs font-mono text-muted-foreground flex items-center gap-2"
          >
            <span className={cn("font-semibold", methodCls(e.method))}>{e.method}</span>
            <span>{e.path}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
