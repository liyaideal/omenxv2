import { Check, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategoryInfo, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { format } from "date-fns";
import omenxLogo from "@/assets/omenx-logo.svg";

interface EventOption {
  id: string;
  label: string;
  price: number;
  final_price: number | null;
  is_winner: boolean | null;
}

interface EventShareCardProps {
  eventName: string;
  category: string;
  settledAt: string | null;
  options: EventOption[];
  userPnl?: number | null;
  userParticipated?: boolean;
}

export const EventShareCard = ({
  eventName,
  category,
  settledAt,
  options,
  userPnl,
  userParticipated
}: EventShareCardProps) => {
  const categoryInfo = getCategoryInfo(category);
  const winningOption = options.find(o => o.is_winner);
  const settledDate = settledAt ? format(new Date(settledAt), "MMM d, yyyy") : "N/A";

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-background to-primary/5 p-5"
      style={{ backgroundColor: 'hsl(222 47% 6%)' }}
    >
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-trading-green/20 to-transparent rounded-full blur-2xl" />
      
      {/* Sparkle decorations */}
      <Sparkles className="absolute top-4 right-4 w-4 h-4 text-yellow-400/60 animate-pulse" />
      <Sparkles className="absolute bottom-12 right-8 w-3 h-3 text-trading-green/50" />

      {/* Logo */}
      <div className="relative flex items-center justify-between mb-4">
        <img src={omenxLogo} alt="OMENX" className="h-5" />
        <Badge 
          variant="outline"
          className="text-[9px] uppercase tracking-wide bg-muted/50 text-muted-foreground border-border/50"
        >
          Settled {settledDate}
        </Badge>
      </div>

      {/* Category & Event Name */}
      <div className="relative mb-4">
        <Badge 
          variant={CATEGORY_STYLES[categoryInfo.label as CategoryType]?.variant || "general"}
          className="text-[9px] uppercase tracking-wide mb-2"
        >
          {categoryInfo.label}
        </Badge>
        <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">
          {eventName}
        </h2>
      </div>

      {/* Winning Result */}
      {winningOption && (
        <div className="relative mb-4 p-3 rounded-xl bg-trading-green/15 border border-trading-green/30">
          <div className="text-[10px] text-trading-green/80 uppercase tracking-wide mb-1">
            Final Result
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-trading-green" />
              <span className="text-sm font-semibold text-trading-green">
                {winningOption.label}
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-trading-green">
              ${(winningOption.final_price ?? winningOption.price).toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* All Options */}
      <div className="relative space-y-1.5 mb-4">
        {options.map((option) => (
          <div
            key={option.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
              option.is_winner
                ? "bg-trading-green/10 border border-trading-green/20"
                : "bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {option.is_winner ? (
                <Check className="h-3 w-3 text-trading-green" />
              ) : (
                <X className="h-3 w-3 text-trading-red/60" />
              )}
              <span className={option.is_winner ? "text-trading-green font-medium" : "text-muted-foreground"}>
                {option.label}
              </span>
            </div>
            <span className={`font-mono font-semibold ${option.is_winner ? "text-trading-green" : "text-muted-foreground"}`}>
              ${(option.final_price ?? option.price).toFixed(4)}
            </span>
          </div>
        ))}
      </div>

      {/* User PnL if participated */}
      {userParticipated && userPnl !== null && userPnl !== undefined && (
        <div className={`relative p-3 rounded-xl border ${
          userPnl >= 0 
            ? "bg-trading-green/10 border-trading-green/30" 
            : "bg-trading-red/10 border-trading-red/30"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">My Result</span>
            <span className={`font-mono font-bold ${userPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
              {userPnl >= 0 ? "+" : ""}${userPnl.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="relative mt-4 pt-3 border-t border-border/30 text-center">
        <p className="text-[10px] text-primary font-medium">
          Trade on OMENX • omenx.com
        </p>
      </div>
    </div>
  );
};
