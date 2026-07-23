import { Trophy, TrendingDown, Sparkles, Skull, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import omenxLogo from "@/assets/omenx-logo.svg";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { QRCodeSVG } from "qrcode.react";

interface SettlementShareCardProps {
  event: string;
  option: string;
  side: "long" | "short";
  result: "win" | "lose";
  pnl: number;
  pnlPercent: number;
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  settledAt: string;
  // User info
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
  /** Single-market binary 别名（如体育队名）。其它事件请留空。 */
  sideLabels?: { yes: string; no: string };
}

export const SettlementShareCard = ({
  event,
  option,
  side,
  result,
  pnl,
  pnlPercent,
  entryPrice,
  exitPrice,
  leverage,
  settledAt,
  username = "Trader",
  avatarUrl,
  referralCode = "OMENX2024",
  sideLabels,
}: SettlementShareCardProps) => {
  const isWin = result === "win";
  const isLong = side === "long";
  const isBinaryOption = option.trim().toLowerCase() === "yes" || option.trim().toLowerCase() === "no";
  const binaryAlias = sideLabels ? (isLong ? sideLabels.yes : sideLabels.no) : null;
  const directionText = isLong ? "Yes" : "No";
  const settledDate = format(new Date(settledAt), "MMM d, yyyy");

  // Theme colors based on result
  const themeColors = isWin 
    ? {
        gradient: "from-trading-green/20 via-yellow-500/10 to-trading-green/5",
        glowColor: "bg-trading-green/30",
        accentColor: "text-trading-green",
        borderColor: "border-trading-green/40",
        bgColor: "bg-trading-green/15",
        badgeGradient: "from-trading-green to-emerald-400",
      }
    : {
        gradient: "from-trading-red/20 via-orange-500/10 to-trading-red/5",
        glowColor: "bg-trading-red/30",
        accentColor: "text-trading-red",
        borderColor: "border-trading-red/40",
        bgColor: "bg-trading-red/15",
        badgeGradient: "from-trading-red to-orange-500",
      };

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-border/50 p-5"
      style={{ 
        backgroundColor: 'hsl(222 47% 6%)',
        background: `linear-gradient(155deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 100%)`
      }}
    >
      {/* Background glow effects */}
      <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl ${themeColors.glowColor} opacity-60`} />
      <div className={`absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl ${themeColors.glowColor} opacity-40`} />
      
      {/* Decorative elements */}
      {isWin ? (
        <>
          <Sparkles className="absolute top-5 right-5 w-5 h-5 text-yellow-400/70 animate-pulse" />
          <Sparkles className="absolute top-16 right-12 w-3 h-3 text-trading-green/60" />
          <Sparkles className="absolute bottom-32 right-6 w-4 h-4 text-yellow-400/50" />
        </>
      ) : (
        <>
          <Skull className="absolute top-5 right-5 w-5 h-5 text-trading-red/40" />
          <div className="absolute top-16 right-10 text-lg opacity-30">💀</div>
        </>
      )}

      {/* Header with Logo */}
      <div className="relative flex items-center justify-between mb-5">
        <img src={omenxLogo} alt="OMENX" className="h-5" />
        <Badge 
          variant="outline"
          className="text-[9px] uppercase tracking-wide bg-muted/50 text-muted-foreground border-border/50"
        >
          {settledDate}
        </Badge>
      </div>

      {/* User Info + Result Badge */}
      <div className="relative flex items-center gap-4 mb-5">
        {/* Avatar with glow */}
        <div className="relative">
          <div className={`absolute -inset-1.5 rounded-full blur-md ${themeColors.glowColor} opacity-70`} />
          <Avatar className={`relative h-14 w-14 border-2 ${themeColors.borderColor}`}>
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-muted text-foreground font-bold">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Result icon overlay */}
          <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${isWin ? "bg-trading-green" : "bg-trading-red"}`}>
            {isWin ? (
              <Trophy className="w-3 h-3 text-background" />
            ) : (
              <TrendingDown className="w-3 h-3 text-background" />
            )}
          </div>
        </div>
        
        {/* Username + Result Label */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground truncate mb-1">{username}</h3>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${themeColors.badgeGradient} text-background`}>
            {isWin ? (
              <>
                <Zap className="w-3 h-3" />
                Winner!
              </>
            ) : (
              <>
                <Skull className="w-3 h-3" />
                RIP 💀
              </>
            )}
          </div>
        </div>
      </div>

      {/* Big PnL Display */}
      <div className={`relative p-5 rounded-2xl mb-4 ${themeColors.bgColor} border ${themeColors.borderColor}`}>
        <div className="text-center">
          <div className={`text-[10px] uppercase tracking-widest mb-1 ${themeColors.accentColor} opacity-80`}>
            {isWin ? "Profit" : "Lost"}
          </div>
          <div className={`font-mono font-black text-4xl ${themeColors.accentColor} mb-1`}>
            {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(2)}
          </div>
          <div className={`flex items-center justify-center gap-2 ${themeColors.accentColor}`}>
            <span className="font-mono font-bold text-lg">
              {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
            </span>
            <span className="text-xs opacity-70">ROI</span>
          </div>
        </div>
        
        {/* Fun message based on result */}
        <div className="mt-3 text-center">
          <span className="text-[10px] text-muted-foreground italic">
            {isWin 
              ? pnlPercent >= 100 ? "🔥 Absolute legend!" : pnlPercent >= 50 ? "💰 Nice gains!" : "✨ Well played!"
              : pnlPercent <= -50 ? "😭 That's rough buddy..." : "📉 We go again!"}
          </span>
        </div>
      </div>

      {/* Event Info */}
      <div className="relative mb-4">
        <h2 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-2">
          {event}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {isBinaryOption ? (
            // Binary: 队名/Yes/No 作为合约名展示，颜色按 long/short outcome
            <span className={`text-sm font-semibold ${isLong ? "text-trading-green" : "text-trading-red"}`}>
              {binaryAlias ?? directionText} {leverage}x
            </span>
          ) : (
            <>
              <Badge
                variant="outline"
                className={`text-[10px] ${isLong
                  ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                  : "border-trading-red/50 text-trading-red bg-trading-red/10"
                }`}
              >
                {directionText} {leverage}x
              </Badge>
              <span className="text-xs text-muted-foreground">{option}</span>
            </>
          )}
        </div>

      </div>

      {/* Trade Details - Compact */}
      <div className="relative grid grid-cols-2 gap-2 mb-4">
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <span className="text-[9px] text-muted-foreground block mb-0.5">{TRADING_TERMS.ENTRY_PRICE}</span>
          <span className="font-mono text-sm font-semibold">${entryPrice.toFixed(4)}</span>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <span className="text-[9px] text-muted-foreground block mb-0.5">{TRADING_TERMS.EXIT_PRICE}</span>
          <span className={`font-mono text-sm font-semibold ${themeColors.accentColor}`}>
            ${exitPrice.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Footer with Referral & QR Code */}
      <div className="relative rounded-xl bg-background/60 border border-border/30 p-3">
        <div className="flex items-center gap-3">
          {/* Left: Referral Text */}
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-medium mb-1 ${isWin ? "text-trading-green" : "text-primary"}`}>
              {isWin ? "Join & trade like a pro!" : "Join & do better than me 😅"}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Referral:</span>
              <span className="font-mono text-xs font-bold text-foreground tracking-wider">
                {referralCode}
              </span>
            </div>
          </div>
          
          {/* Right: QR Code */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="p-1.5 bg-white rounded-md">
              <QRCodeSVG 
                value={`https://omenx.lovable.app?ref=${referralCode}`} 
                size={44}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-[8px] text-muted-foreground">omenx.lovable.app</span>
          </div>
        </div>
      </div>
    </div>
  );
};