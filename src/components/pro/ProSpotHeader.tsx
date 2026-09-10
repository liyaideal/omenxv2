// ============================================================
// Pro /spot desktop terminal header (LOCKED per DESIGN.md §7).
//
// Extracted verbatim from SpotTrading so the style guide can mount the REAL
// header instead of hand-copying it (CHK-9). Zero visual change: every class
// below is the one that shipped; the page now passes its values as props.
// ============================================================
import { ArrowLeft, Info, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SurfaceSwitch } from "@/components/surface/SurfaceSwitch";

export interface ProSpotHeaderProps {
  ticker: string;
  eventName: string;
  lifecycleBadge: { label: string; className: string };
  countdown: { text: string; urgency: "red" | "yellow" | "muted" };
  freezeEtOnly?: string | null;
  closeEtOnly?: string | null;
  settleEtOnly?: string | null;
  closingSoon: boolean;
  volumeText: string;
  lastLabel: string;
  lastPriceText: string;
  lastIsUp: boolean;
  lastHint?: string;
  watched: boolean;
  onToggleWatch: () => void;
  onBack: () => void;
  /** Style-guide only: render the switch as if the visitor were signed in. */
  previewSignedIn?: boolean;
  /** Style-guide only: force the switch state and make it inert. */
  previewActiveSurface?: "lite" | "pro";
}

const Stat = ({
  label,
  value,
  valueClass,
  hint,
}: {
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
}) => (
  <div className="text-xs">
    <div className="text-muted-foreground">{label}</div>
    <div className={cn("font-mono font-medium", valueClass)}>
      {value}
      {hint && <span className={cn("ml-1 text-[10px]", valueClass)}>{hint}</span>}
    </div>
  </div>
);

export const ProSpotHeader = (p: ProSpotHeaderProps) => (
  <header className="flex items-center gap-4 px-4 py-2 bg-background border-b border-border/30">
    <button
      onClick={p.onBack}
      className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted flex-shrink-0"
      aria-label="Back"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>

    <div className="flex items-center gap-3 min-w-0">
      <div
        className={cn(
          "flex h-9 items-center justify-center rounded-full bg-foreground/5 border border-border/60 font-mono font-semibold flex-shrink-0 px-2",
          p.ticker.length <= 3 ? "text-[11px] w-9" : p.ticker.length <= 4 ? "text-[10px] min-w-9" : "text-[9px] min-w-9",
        )}
      >
        {p.ticker}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{p.eventName}</span>
          <Badge variant="outline" className={cn("text-[10px] border", p.lifecycleBadge.className)}>
            {p.lifecycleBadge.label}
          </Badge>
        </div>
        <div className="mt-0.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                p.countdown.urgency === "red" && "bg-trading-red animate-pulse",
                p.countdown.urgency === "yellow" && "bg-trading-yellow",
                p.countdown.urgency === "muted" && "bg-muted-foreground",
              )}
            />
            <span>Trading ends in</span>
            <span
              className={cn(
                "font-mono font-medium",
                p.countdown.urgency === "red" && "text-trading-red animate-pulse",
                p.countdown.urgency === "yellow" && "text-trading-yellow",
                p.countdown.urgency === "muted" && "text-foreground",
              )}
            >
              {p.countdown.text}
            </span>
            {p.freezeEtOnly && (
              <>
                <span>·</span>
                <span className="font-mono">until {p.freezeEtOnly}</span>
              </>
            )}
            {p.closingSoon && (
              <span
                className="px-1.5 py-0.5 rounded bg-trading-yellow/15 text-trading-yellow text-[10px] font-medium"
                title="Trading remains open until 5 minutes before close."
              >
                Closing soon
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Schedule details"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="text-xs max-w-[280px]">
                  <div className="space-y-1">
                    <div><span className="text-muted-foreground">Opens:</span> after prior close (extended trading)</div>
                    <div><span className="text-muted-foreground">Trading ends:</span> {p.freezeEtOnly ?? "—"}</div>
                    <div><span className="text-muted-foreground">Official close:</span> {p.closeEtOnly ?? "—"} (settlement price)</div>
                    <div><span className="text-muted-foreground">Credits by:</span> ~{p.settleEtOnly ?? "—"}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>

    {/* Right stats — spot-specific. NO index / funding / OI / Yes price. */}
    <div className="ml-auto flex items-center gap-6 text-xs">
      <Stat label="Volume" value={p.volumeText} />
      <Stat
        label={p.lastLabel}
        value={p.lastPriceText}
        valueClass={p.lastIsUp ? "text-trading-green" : "text-trading-red"}
        hint={p.lastHint}
      />
    </div>

    <SurfaceSwitch
      size="compact"
      previewSignedIn={p.previewSignedIn}
      previewActive={p.previewActiveSurface}
    />

    <button
      onClick={p.onToggleWatch}
      className="p-2 rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
      aria-label="Toggle watchlist"
    >
      <Star
        className={cn(
          "w-5 h-5 transition-colors",
          p.watched
            ? "text-trading-yellow fill-trading-yellow"
            : "text-muted-foreground hover:text-trading-yellow",
        )}
      />
    </button>
  </header>
);
