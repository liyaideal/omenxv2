import { ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEquity7D } from "@/hooks/useEquity7D";
import { useHomeStats } from "@/hooks/useHomeStats";
import { cn } from "@/lib/utils";

const formatCompactUSD = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

interface HomeGreetingProps {
  onSignIn: () => void;
  /** Deprecated — kept for backward compatibility, no longer rendered. */
  todayPnLPercent?: string;
}

const formatBalance = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Build a normalized SVG path (line + area) for a 7D equity series.
 * Returns empty paths when there isn't enough variation to draw.
 */
const buildSparkPaths = (points: number[]) => {
  if (points.length < 2) return { line: "", area: "" };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 100;
  const H = 40;
  const stepX = W / (points.length - 1);

  const coords = points.map((v, i) => {
    const x = i * stepX;
    // Invert: higher value → smaller y (top). Pad 4px top/bottom.
    const y = 4 + (1 - (v - min) / range) * (H - 8);
    return [x, y] as const;
  });

  // Smooth path via Catmull-Rom → cubic Bézier (tension 0.5).
  const t = 0.5;
  let line = `M${coords[0][0].toFixed(2)} ${coords[0][1].toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1[0] + ((p2[0] - p0[0]) / 6) * t * 2;
    const cp1y = p1[1] + ((p2[1] - p0[1]) / 6) * t * 2;
    const cp2x = p2[0] - ((p3[0] - p1[0]) / 6) * t * 2;
    const cp2y = p2[1] - ((p3[1] - p1[1]) / 6) * t * 2;
    line += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  return { line, area };
};

/**
 * Home identity + asset hero — data card variant.
 *
 * 7D PnL + 7D sparkline derived from closed trades (mark-to-market on realized PnL).
 */
export const HomeGreeting = ({ onSignIn }: HomeGreetingProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { username, profile } = useUserProfile();
  const { pnlPercent, points, hasData } = useEquity7D();

  const isAuthed = !!user;
  const displayName = isAuthed
    ? (username || user?.email?.split("@")[0] || "trader").replace(/_/g, " ")
    : "there";

  const handleDeposit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    navigate("/deposit");
  };

  const handleBlockClick = () => {
    if (isAuthed) navigate("/wallet");
    else onSignIn();
  };

  const isProfit = pnlPercent >= 0;
  const pnlDisplay = `${isProfit ? "+" : "-"}${Math.abs(pnlPercent).toFixed(1)}%`;
  const { line, area } = buildSparkPaths(points);

  // Guest-only platform stats
  const { volume24h, activeMarkets, sparkPoints, isLoading: statsLoading } = useHomeStats();
  const guestSpark = buildSparkPaths(sparkPoints);

  return (
    <button
      onClick={handleBlockClick}
      className="group relative block w-full overflow-hidden rounded-2xl border border-border/40 bg-card p-5 text-left transition-all duration-300 hover:border-border active:scale-[0.99]"
    >
      {isAuthed ? (
        <>
          {/* Top row: greeting + Deposit chip */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Welcome back
              </p>
              <h1 className="mt-1 break-words text-[17px] font-bold leading-tight text-foreground line-clamp-2">
                {displayName}
              </h1>
            </div>

            <span
              onClick={handleDeposit}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleDeposit(e);
                }
              }}
              aria-label="Deposit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1.5 transition-all hover:border-border hover:bg-muted/60"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">
                Deposit
              </span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
            </span>
          </div>

          {/* Body: balance + sparkline */}
          <div className="mt-6 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Total equity
              </p>
              <div className="mt-1.5 font-mono text-[34px] font-bold leading-none tracking-tight text-foreground">
                {formatBalance(profile?.balance)}
              </div>
              {hasData ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums",
                      isProfit ? "text-trading-green" : "text-trading-red",
                    )}
                  >
                    {pnlDisplay}
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    7D
                  </span>
                </div>
              ) : (
                <p className="mt-2.5 whitespace-nowrap">
                  <span className="font-sans text-[12px] font-medium text-muted-foreground">
                    No 7D activity ·{" "}
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                    Tap Deposit to start
                  </span>
                </p>
              )}
            </div>

            {/* Sparkline (7D) — only when we actually have data */}
            {hasData && line && (
              <div className="relative h-12 w-24 shrink-0 opacity-70 transition-opacity group-hover:opacity-100">
                <svg
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                  className="h-full w-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="hgSparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={
                          isProfit ? "hsl(var(--trading-green))" : "hsl(var(--trading-red))"
                        }
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="100%"
                        stopColor={
                          isProfit ? "hsl(var(--trading-green))" : "hsl(var(--trading-red))"
                        }
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#hgSparkFill)" />
                  <path
                    d={line}
                    fill="none"
                    stroke={isProfit ? "hsl(var(--trading-green))" : "hsl(var(--trading-red))"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Guest hero: Slogan + live platform stats + sparkline */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trading-green opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-trading-green" />
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-trading-green">
                  Live on OmenX
                </span>
              </div>
              <h1 className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                Hey Caller. Ready to make your next call?
              </h1>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              {statsLoading ? (
                <div className="h-8 w-32 animate-pulse rounded bg-muted/30" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
                    {formatCompactUSD(volume24h)}
                  </span>
                  <span className="font-sans text-[12px] font-medium text-muted-foreground">
                    traded · 24h
                  </span>
                </div>
              )}
              <div className="mt-2 font-sans text-[12px] text-muted-foreground">
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {statsLoading ? "—" : activeMarkets}
                </span>{" "}
                active markets
              </div>
            </div>

            {/* Decorative sparkline (top markets by volume) */}
            <div className="relative h-12 w-24 shrink-0 opacity-70 transition-opacity group-hover:opacity-100">
              <svg
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
              >
                {guestSpark.line ? (
                  <>
                    <defs>
                      <linearGradient id="hgGuestSparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={guestSpark.area} fill="url(#hgGuestSparkFill)" />
                    <path
                      d={guestSpark.line}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : (
                  <line
                    x1="0"
                    y1="20"
                    x2="100"
                    y2="20"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* CTA divider */}
          <div className="mt-5 border-t border-border/40 pt-4">
            <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary">
              <span>Sign in to start trading</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </div>
          </div>
        </>
      )}

      {/* Soft accent glow */}
      {isAuthed && hasData && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full blur-3xl",
            isProfit ? "bg-trading-green/10" : "bg-trading-red/10",
          )}
        />
      )}
    </button>
  );
};
