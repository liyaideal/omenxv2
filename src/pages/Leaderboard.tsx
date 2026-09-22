import React, { useEffect, useMemo, useRef, useState } from "react";
import { Share2, Crown, Sparkles, Zap, Download, Send, Copy, Check, X, User, Palette, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
// Mobile Header System v1: no page draws its own top bar (DESIGN.md §10).
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useReferral } from "@/hooks/useReferral";
import * as htmlToImage from "html-to-image";
import { omenxLogo } from "@/components/Logo";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { QRCodeSVG } from "qrcode.react";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { SeoFooter } from "@/components/seo/SeoFooter";
import heroDesktop from "@/assets/leaderboard-hero-desktop.webp";
import heroMobile from "@/assets/leaderboard-hero-mobile.webp";
import { formatMetric } from "@/components/leaderboard/leaderboardKit";
import { LeaderboardFiltersDesktop, LeaderboardFiltersMobile } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardPodium } from "@/components/leaderboard/LeaderboardPodium";
import { CURRENT_USER_ROW_ID, LeaderboardListMobile, LeaderboardTableDesktop } from "@/components/leaderboard/LeaderboardTable";
import { YourRankingBarDesktop, YourRankingCardMobile, type YourRankingData } from "@/components/leaderboard/YourRankingBar";
import { RankLocator } from "@/components/leaderboard/RankLocator";

type SortType = "pnl" | "roi" | "volume";
type PeriodType = "daily" | "7d" | "30d" | "180d";


interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  pnl: number;
  roi: number;
  volume: number;
  trades: number;
  rankChange: number; // positive = up, negative = down, 0 = no change
}

// Mock data for leaderboard (30 users max)
const mockLeaderboardData: LeaderboardUser[] = [
  { rank: 1, username: "CryptoWhale", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=whale&backgroundColor=b6e3f4", pnl: 125430, roi: 342.5, volume: 2450000, trades: 156, rankChange: 0 },
  { rank: 2, username: "TradingMaster", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=master&backgroundColor=c0aede", pnl: 89250, roi: 287.3, volume: 1890000, trades: 234, rankChange: 2 },
  { rank: 3, username: "ProfitHunter", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=hunter&backgroundColor=d1d4f9", pnl: 67890, roi: 198.7, volume: 1560000, trades: 189, rankChange: -1 },
  { rank: 4, username: "AlphaTrader", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=alpha&backgroundColor=ffd5dc", pnl: 45670, roi: 156.2, volume: 980000, trades: 145, rankChange: 3 },
  { rank: 5, username: "MarketMaker", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=maker&backgroundColor=ffdfbf", pnl: 34560, roi: 134.8, volume: 890000, trades: 178, rankChange: -2 },
  { rank: 6, username: "DiamondHands", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=diamond&backgroundColor=b6e3f4", pnl: 28900, roi: 112.4, volume: 750000, trades: 98, rankChange: 1 },
  { rank: 7, username: "MoonShot", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=moon&backgroundColor=c0aede", pnl: 23450, roi: 98.6, volume: 680000, trades: 167, rankChange: 0 },
  { rank: 8, username: "BullRunner", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=bull&backgroundColor=d1d4f9", pnl: 19870, roi: 87.3, volume: 590000, trades: 134, rankChange: -3 },
  { rank: 9, username: "SmartMoney", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=smart&backgroundColor=ffd5dc", pnl: 15690, roi: 76.5, volume: 480000, trades: 112, rankChange: 2 },
  { rank: 10, username: "TrendSurfer", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=trend&backgroundColor=ffdfbf", pnl: 12340, roi: 65.2, volume: 390000, trades: 89, rankChange: -1 },
  { rank: 11, username: "Hodler", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=hodler&backgroundColor=b6e3f4", pnl: 10200, roi: 58.3, volume: 320000, trades: 76, rankChange: 4 },
  { rank: 12, username: "BlockBuster", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=block&backgroundColor=c0aede", pnl: 8900, roi: 52.1, volume: 280000, trades: 68, rankChange: -2 },
  { rank: 13, username: "CryptoNinja", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=currentuser&backgroundColor=d1d4f9", pnl: 7650, roi: 45.8, volume: 245000, trades: 52, rankChange: 5 },
  { rank: 14, username: "SatoshiFan", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=satoshi&backgroundColor=ffd5dc", pnl: 6890, roi: 42.3, volume: 218000, trades: 45, rankChange: 1 },
  { rank: 15, username: "ChartWizard", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=wizard&backgroundColor=ffdfbf", pnl: 6120, roi: 38.7, volume: 195000, trades: 39, rankChange: -1 },
  { rank: 16, username: "RiskTaker", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=risk&backgroundColor=b6e3f4", pnl: 5450, roi: 35.2, volume: 178000, trades: 67, rankChange: 3 },
  { rank: 17, username: "TokenKing", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=token&backgroundColor=c0aede", pnl: 4890, roi: 32.1, volume: 156000, trades: 41, rankChange: 0 },
  { rank: 18, username: "WhaleWatcher", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=watcher&backgroundColor=d1d4f9", pnl: 4320, roi: 28.9, volume: 142000, trades: 33, rankChange: -2 },
  { rank: 19, username: "GainsGuru", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=gains&backgroundColor=ffd5dc", pnl: 3780, roi: 25.6, volume: 128000, trades: 29, rankChange: 2 },
  { rank: 20, username: "PumpPatrol", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=pump&backgroundColor=ffdfbf", pnl: 3250, roi: 22.4, volume: 115000, trades: 38, rankChange: -1 },
  { rank: 21, username: "DipBuyer", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=dip&backgroundColor=b6e3f4", pnl: 2890, roi: 19.8, volume: 98000, trades: 24, rankChange: 1 },
  { rank: 22, username: "MomentumX", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=momentum&backgroundColor=c0aede", pnl: 2540, roi: 17.3, volume: 87000, trades: 31, rankChange: 0 },
  { rank: 23, username: "ScalpKing", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=scalp&backgroundColor=d1d4f9", pnl: 2180, roi: 14.9, volume: 156000, trades: 89, rankChange: -3 },
  { rank: 24, username: "SwingTrader", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=swing&backgroundColor=ffd5dc", pnl: 1920, roi: 12.6, volume: 72000, trades: 18, rankChange: 2 },
  { rank: 25, username: "CoinCollector", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=coin&backgroundColor=ffdfbf", pnl: 1650, roi: 10.4, volume: 65000, trades: 22, rankChange: 1 },
  { rank: 26, username: "AltSeason", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=alt&backgroundColor=b6e3f4", pnl: 1380, roi: 8.2, volume: 54000, trades: 16, rankChange: -1 },
  { rank: 27, username: "FuturesFreak", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=futures&backgroundColor=c0aede", pnl: 1120, roi: 6.1, volume: 48000, trades: 27, rankChange: 0 },
  { rank: 28, username: "LeverageL", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=leverage&backgroundColor=d1d4f9", pnl: 890, roi: 4.3, volume: 42000, trades: 35, rankChange: -2 },
  { rank: 29, username: "PerpsPlayer", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=perps&backgroundColor=ffd5dc", pnl: 650, roi: 2.8, volume: 35000, trades: 14, rankChange: 1 },
  { rank: 30, username: "NewbieTrader", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=newbie&backgroundColor=ffdfbf", pnl: 420, roi: 1.5, volume: 28000, trades: 8, rankChange: 0 },
];

// Current user mock ID - will be replaced with actual user data
const MOCK_CURRENT_USER_USERNAME = "CryptoNinja";



// 分享卡沿用的名次配色（轮 C 随分享卡改版一并处理）
const getRankColors = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        gradient: "from-yellow-400 via-yellow-500 to-amber-600",
        glow: "shadow-[0_0_40px_rgba(255,215,0,0.4)]",
        border: "border-yellow-500/50",
        text: "text-yellow-400",
        leaf: "#FFD700",
        bg: "bg-gradient-to-b from-yellow-500/20 to-transparent",
      };
    case 2:
      return {
        gradient: "from-slate-300 via-slate-400 to-slate-500",
        glow: "shadow-[0_0_30px_rgba(192,192,192,0.3)]",
        border: "border-slate-400/50",
        text: "text-slate-300",
        leaf: "#C0C0C0",
        bg: "bg-gradient-to-b from-slate-400/20 to-transparent",
      };
    case 3:
      return {
        gradient: "from-amber-600 via-amber-700 to-orange-800",
        glow: "shadow-[0_0_30px_rgba(205,127,50,0.3)]",
        border: "border-amber-600/50",
        text: "text-amber-500",
        leaf: "#CD7F32",
        bg: "bg-gradient-to-b from-amber-600/20 to-transparent",
      };
    default:
      return {
        gradient: "from-slate-500 to-slate-600",
        glow: "",
        border: "border-border/50",
        text: "text-muted-foreground",
        leaf: "#666",
        bg: "",
      };
  }
};

type CardTheme = "default" | "neon" | "brutal" | "gold";
type StatKey = "pnl" | "roi" | "volume";

interface CardThemeConfig {
  name: string;
  bgStyle: string;
  borderStyle: string;
  glowEffects: boolean;
  sparkles: boolean;
  // Color scheme for stats and badges
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  pnlColor: string;
  roiColor: string;
  volumeColor: string;
  sparkleColors: [string, string, string];
  rankBadgeBg: string;
  ctaColor: string;
}

const cardThemes: Record<CardTheme, CardThemeConfig> = {
  default: {
    name: "Default",
    bgStyle: "from-card via-background to-primary/5",
    borderStyle: "border-primary/30",
    glowEffects: true,
    sparkles: true,
    badgeBg: "bg-trading-green/20",
    badgeBorder: "border-trading-green/30",
    badgeText: "text-trading-green",
    pnlColor: "text-trading-green",
    roiColor: "text-primary",
    volumeColor: "text-foreground",
    sparkleColors: ["text-yellow-400/60", "text-trading-green/50", "text-primary/40"],
    rankBadgeBg: "from-slate-500 to-slate-600",
    ctaColor: "text-primary",
  },
  neon: {
    name: "Neon",
    bgStyle: "from-purple-950/90 via-background to-cyan-950/50",
    borderStyle: "border-cyan-400/50",
    glowEffects: true,
    sparkles: true,
    badgeBg: "bg-cyan-400/20",
    badgeBorder: "border-cyan-400/40",
    badgeText: "text-cyan-400",
    pnlColor: "text-cyan-400",
    roiColor: "text-purple-400",
    volumeColor: "text-pink-300",
    sparkleColors: ["text-cyan-400/60", "text-purple-400/50", "text-pink-400/40"],
    rankBadgeBg: "from-cyan-500 to-purple-500",
    ctaColor: "text-cyan-400",
  },
  brutal: {
    name: "Brutal",
    bgStyle: "from-black via-zinc-950 to-black",
    borderStyle: "border-white border-4",
    glowEffects: true,
    sparkles: false,
    badgeBg: "bg-white",
    badgeBorder: "border-white",
    badgeText: "text-black",
    pnlColor: "text-lime-400",
    roiColor: "text-white",
    volumeColor: "text-white",
    sparkleColors: ["text-white/60", "text-white/40", "text-white/20"],
    rankBadgeBg: "from-white to-zinc-200",
    ctaColor: "text-lime-400",
  },
  gold: {
    name: "Gold",
    bgStyle: "from-yellow-950/40 via-background to-amber-950/30",
    borderStyle: "border-yellow-500/40",
    glowEffects: true,
    sparkles: true,
    badgeBg: "bg-yellow-500/20",
    badgeBorder: "border-yellow-500/40",
    badgeText: "text-yellow-400",
    pnlColor: "text-yellow-400",
    roiColor: "text-amber-400",
    volumeColor: "text-orange-300",
    sparkleColors: ["text-yellow-400/60", "text-amber-400/50", "text-orange-400/40"],
    rankBadgeBg: "from-yellow-500 to-amber-600",
    ctaColor: "text-yellow-400",
  },
};

const themeGlowColors: Record<CardTheme, { primary: string; secondary: string; tertiary: string }> = {
  default: { primary: "from-yellow-500/20", secondary: "from-trading-green/20", tertiary: "bg-primary/5" },
  neon: { primary: "from-cyan-500/30", secondary: "from-purple-500/30", tertiary: "bg-pink-500/10" },
  brutal: { primary: "from-white/10", secondary: "from-lime-400/20", tertiary: "bg-white/5" },
  gold: { primary: "from-yellow-400/30", secondary: "from-amber-500/20", tertiary: "bg-orange-500/10" },
};

interface ShareableCardProps {
  user: LeaderboardUser;
  cardRef?: React.RefObject<HTMLDivElement>;
  onShare?: () => void;
  isGenerating?: boolean;
  theme?: CardTheme;
  visibleStats?: StatKey[];
  hideShareHint?: boolean;
  referralCode?: string; // External referral code from useReferral
}

const ShareableCard = ({ 
  user, 
  cardRef, 
  onShare, 
  isGenerating, 
  theme = "default",
  visibleStats = ["pnl", "roi", "volume"],
  hideShareHint = false,
  referralCode = "OMENX2025"
}: ShareableCardProps) => {
  const colors = getRankColors(user.rank);
  const themeConfig = cardThemes[theme];
  const glowColors = themeGlowColors[theme];
  
  const stats = [
    { key: "pnl" as StatKey, label: "PnL", value: `$${user.pnl.toLocaleString()}`, color: themeConfig.pnlColor, icon: true },
    { key: "roi" as StatKey, label: "ROI", value: `${user.roi.toFixed(1)}%`, color: themeConfig.roiColor, icon: false },
    { key: "volume" as StatKey, label: "Volume", value: `$${user.volume.toLocaleString()}`, color: themeConfig.volumeColor, icon: false },
  ];
  
  const displayedStats = stats.filter(s => visibleStats.includes(s.key));
  const gridCols = displayedStats.length === 1 ? "grid-cols-1" : displayedStats.length === 2 ? "grid-cols-2" : "grid-cols-3";
  
  // Use theme-specific rank badge for non-top-3 users
  const rankBadgeGradient = user.rank <= 3 ? colors.gradient : themeConfig.rankBadgeBg;
  
  return (
    <div 
      ref={cardRef}
      onClick={onShare}
      className={`relative overflow-hidden rounded-2xl border ${themeConfig.borderStyle} bg-gradient-to-br ${themeConfig.bgStyle} p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${isGenerating ? 'pointer-events-none' : ''}`}
      style={{ backgroundColor: 'hsl(222 47% 6%)' }}
    >
      {/* Background effects */}
      {themeConfig.glowEffects && (
        <>
          <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${glowColors.primary} to-transparent rounded-full blur-3xl`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr ${glowColors.secondary} to-transparent rounded-full blur-2xl`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${glowColors.tertiary} rounded-full blur-3xl`} />
        </>
      )}
      
      {/* Sparkle decorations */}
      {themeConfig.sparkles && (
        <>
          <Sparkles className={`absolute top-4 right-4 w-5 h-5 ${themeConfig.sparkleColors[0]} animate-pulse`} />
          <Sparkles className={`absolute bottom-8 right-12 w-4 h-4 ${themeConfig.sparkleColors[1]}`} />
          <Sparkles className={`absolute top-12 left-8 w-3 h-3 ${themeConfig.sparkleColors[2]}`} />
        </>
      )}
      
      {/* Loading overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-6">
          <img src={omenxLogo} alt="OMENX" className="h-6" />
          <div className={`px-3 py-1 rounded-full ${themeConfig.badgeBg} border ${themeConfig.badgeBorder}`}>
            <span className={`text-xs font-semibold ${themeConfig.badgeText}`}>Top Ranking</span>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {/* Glow */}
            <div className={`absolute -inset-2 bg-gradient-to-br ${colors.gradient} rounded-full blur-md opacity-50`} />
            <Avatar className={`relative h-20 w-20 border-3 ${colors.border}`}>
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {/* Crown for #1 */}
            {user.rank === 1 && (
              <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground mb-1 break-words leading-tight">{user.username}</h3>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-br ${rankBadgeGradient}`}>
                <span className="font-bold text-background text-sm">#{user.rank}</span>
              </div>
              <span className="text-sm text-muted-foreground">Global Ranking</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {displayedStats.length > 0 && (
          <div className={`grid ${gridCols} gap-3`}>
            {displayedStats.map((stat) => (
              <div key={stat.key} className="text-center p-4 rounded-xl bg-muted/50 border border-border/30">
                <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                <div className={`flex items-center justify-center gap-1 font-mono font-bold ${stat.color}`}>
                  {stat.icon && <Zap className="w-3 h-3" />}
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with Referral & QR Code */}
        <div className="mt-5 rounded-xl bg-background/60 border border-border/30 p-3">
          <div className="flex items-center gap-3">
            {/* Left: Referral Text */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium mb-1 ${themeConfig.ctaColor}`}>
                Predict. Trade. Profit.
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Referral code:</span>
                <span className="font-mono text-sm font-bold text-foreground tracking-wider">
                  {referralCode}
                </span>
              </div>
            </div>
            
            {/* Right: QR Code */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className="p-1.5 bg-white rounded-md">
                <QRCodeSVG 
                  value={`https://omenx.lovable.app?ref=${referralCode}`} 
                  size={48}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">omenx.lovable.app</span>
            </div>
          </div>
        </div>
        
        {/* Tap to share hint - hidden in modal preview */}
        {!hideShareHint && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Share2 className="w-3 h-3" />
            <span>Tap to share</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Card Customization Panel
interface CardCustomizationProps {
  theme: CardTheme;
  onThemeChange: (theme: CardTheme) => void;
  visibleStats: StatKey[];
  onStatsChange: (stats: StatKey[]) => void;
}

const CardCustomization = ({ theme, onThemeChange, visibleStats, onStatsChange }: CardCustomizationProps) => {
  const themes: CardTheme[] = ["default", "neon", "brutal", "gold"];
  const allStats: { key: StatKey; label: string }[] = [
    { key: "pnl", label: "PnL" },
    { key: "roi", label: "ROI" },
    { key: "volume", label: "Volume" },
  ];
  
  const toggleStat = (stat: StatKey) => {
    if (visibleStats.includes(stat)) {
      // Don't allow removing all stats
      if (visibleStats.length > 1) {
        onStatsChange(visibleStats.filter(s => s !== stat));
      }
    } else {
      onStatsChange([...visibleStats, stat]);
    }
  };
  
  return (
    <div className="space-y-4 mb-4">
      {/* Theme Selection */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Palette className="w-4 h-4 text-primary" />
          <span>Card Style</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => onThemeChange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30"
              }`}
            >
              {cardThemes[t].name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Toggle */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Eye className="w-4 h-4 text-primary" />
          <span>Show Stats</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allStats.map((stat) => {
            const isVisible = visibleStats.includes(stat.key);
            return (
              <button
                key={stat.key}
                onClick={() => toggleStat(stat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isVisible
                    ? "bg-trading-green/20 text-trading-green border border-trading-green/30"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
                }`}
              >
                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {stat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Share Modal Component
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: LeaderboardUser;
  cardRef: React.RefObject<HTMLDivElement>;
  theme: CardTheme;
  onThemeChange: (theme: CardTheme) => void;
  visibleStats: StatKey[];
  onStatsChange: (stats: StatKey[]) => void;
  referralCode?: string; // External referral code from useReferral
}

const ShareModal = ({ 
  isOpen, 
  onClose, 
  user, 
  cardRef,
  theme,
  onThemeChange,
  visibleStats,
  onStatsChange,
  referralCode = "OMENX2025"
}: ShareModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Generate image when modal opens or customization changes
  const generateImage = async () => {
    if (!modalCardRef.current) return;
    
    setIsGenerating(true);
    try {
      const blob = await htmlToImage.toBlob(modalCardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0c14',
        skipFonts: true, // Skip external fonts to avoid CORS errors
        cacheBust: true,
      });
      if (blob) {
        setImageBlob(blob);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate image when theme or stats change
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the card is rendered
      const timer = setTimeout(generateImage, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, theme, visibleStats]);

  if (!isOpen) return null;

  const shareText = `🏆 Check out my ranking on OMENX Leaderboard! #${user.rank} with $${user.pnl.toLocaleString()} PnL and ${user.roi.toFixed(1)}% ROI! 🚀`;
  const shareUrl = window.location.href;

  const handleDownload = () => {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omenx-rank-${user.rank}-${user.username}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Image saved!", description: "Ranking card saved to your device" });
  };

  const handleCopyImage = async () => {
    if (!imageBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imageBlob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Image copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please download the image instead", variant: "destructive" });
    }
  };

  const handleShareX = () => {
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, '_blank');
  };

  const handleShareTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast({ title: "Sharing not supported", description: "Use the social media buttons instead" });
      return;
    }

    try {
      const shareData: ShareData = {
        title: 'OMENX Leaderboard',
        text: shareText,
        url: shareUrl,
      };

      // Try to share with image if supported
      if (imageBlob && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'ranking.png', { type: 'image/png' })] })) {
        shareData.files = [new File([imageBlob], `omenx-rank-${user.rank}.png`, { type: 'image/png' })];
      }

      await navigator.share(shareData);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast({ title: "Share failed", description: "Please try another method" });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl p-5 w-full max-w-sm max-h-[calc(100vh-6rem)] md:max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <h3 className="text-lg font-bold text-foreground mb-2">Share Your Rank</h3>
        <p className="text-sm text-muted-foreground mb-4">Customize and share your achievement</p>

        {/* Customization Options */}
        <CardCustomization 
          theme={theme}
          onThemeChange={onThemeChange}
          visibleStats={visibleStats}
          onStatsChange={onStatsChange}
        />

        {/* Card Preview with Loading */}
        <div className="relative mb-4">
          <div ref={modalCardRef}>
            <ShareableCard 
              user={user}
              theme={theme}
              visibleStats={visibleStats}
              isGenerating={isGenerating}
              hideShareHint={true}
              referralCode={referralCode}
            />
          </div>
        </div>

        {/* Share Options - Unified Style */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleDownload}
            disabled={!imageBlob || isGenerating}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">Save</span>
          </button>
          <button
            onClick={() => {
              const referralLink = `https://omenx.com/signup?ref=${referralCode}`;
              navigator.clipboard.writeText(referralLink);
              toast({
                title: "Link Copied!",
                description: "Referral link copied to clipboard",
              });
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <Copy className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">Copy Link</span>
          </button>
          <button
            onClick={handleShareX}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-medium">X</span>
          </button>
          <button
            onClick={handleShareTelegram}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <Send className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">Telegram</span>
          </button>
        </div>

        {/* Native Share (Mobile) */}
        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">More Options</span>
        </button>
      </div>
    </div>
  );
};


export default function Leaderboard() {
  const isMobile = useIsMobile();
  const { username, avatarUrl, user } = useUserProfile();
  const { referralCode } = useReferral();
  const [sortType, setSortType] = useState<SortType>("pnl");
  const [period, setPeriod] = useState<PeriodType>("7d");
  const [page, setPage] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [cardTheme, setCardTheme] = useState<CardTheme>("default");
  const [visibleStats, setVisibleStats] = useState<StatKey[]>(["pnl", "roi", "volume"]);
  const [authOpen, setAuthOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user;
  const currentUserUsername = user ? username || "You" : MOCK_CURRENT_USER_USERNAME;
  const currentUserAvatar = user ? avatarUrl || "" : "";

  /** 用真实用户信息替换 mock 里的占位用户 */
  const baseData = useMemo(
    () =>
      mockLeaderboardData.map((u) =>
        u.username === MOCK_CURRENT_USER_USERNAME
          ? { ...u, username: currentUserUsername, avatar: currentUserAvatar || u.avatar }
          : u
      ),
    [currentUserUsername, currentUserAvatar]
  );

  const sortedData = useMemo(
    () =>
      [...baseData]
        .sort((a, b) => b[sortType] - a[sortType])
        .map((u, idx) => ({ ...u, rank: idx + 1 })),
    [baseData, sortType]
  );

  const topThree = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(restOfList.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = restOfList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = 4 + (safePage - 1) * PAGE_SIZE;
  const rangeLabel = `${rangeStart}–${rangeStart + pageRows.length - 1} of ${sortedData.length}`;

  /** 切指标或时间范围 → 回第 1 页（CPO 批的行为规则） */
  useEffect(() => {
    setPage(1);
  }, [sortType, period]);

  const currentUser = isLoggedIn
    ? sortedData.find((u) => u.username === currentUserUsername)
    : undefined;
  const isCurrentUserInTopThree = !!currentUser && currentUser.rank <= 3;

  /** 三个指标各自的名次（Your Ranking 三格用），未登录一律 null */
  const myRanks = useMemo(() => {
    const rankIn = (key: SortType) => {
      if (!isLoggedIn) return null;
      const idx = [...baseData]
        .sort((a, b) => b[key] - a[key])
        .findIndex((u) => u.username === currentUserUsername);
      return idx >= 0 ? idx + 1 : null;
    };
    return { pnl: rankIn("pnl"), roi: rankIn("roi"), volume: rankIn("volume") };
  }, [baseData, currentUserUsername, isLoggedIn]);

  const yourRanking: YourRankingData = {
    username: isLoggedIn ? currentUserUsername : "Not signed in",
    avatar: isLoggedIn ? currentUserAvatar : undefined,
    trades: currentUser?.trades ?? 0,
    ranks: myRanks,
    pnl: currentUser ? formatMetric(currentUser, "pnl") : "$0.00",
    roi: currentUser ? formatMetric(currentUser, "roi") : "0.00%",
    volume: currentUser ? formatMetric(currentUser, "volume") : "$0.00",
  };

  const YOUR_RANKING_ID = "your-ranking";

  /** 唯一分享入口：未登录先拉 Auth，否则开弹窗 */
  const openShare = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    setIsShareModalOpen(true);
  };

  const highlightRow = () => {
    const el = document.getElementById(CURRENT_USER_ROW_ID);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#33D6FF]");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-[#33D6FF]"), 1500);
  };

  /** ① 定位器点击：已排名 → 翻到我所在页再滚到我那行；未排名 → 滚到 ② */
  const jumpToMe = () => {
    if (!currentUser || isCurrentUserInTopThree) {
      document.getElementById(YOUR_RANKING_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const idx = restOfList.findIndex((u) => u.username === currentUserUsername);
    if (idx < 0) {
      document.getElementById(YOUR_RANKING_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
    if (targetPage !== safePage) {
      setPage(targetPage);
      window.setTimeout(highlightRow, 80);
    } else {
      highlightRow();
    }
  };

  const shareModal = (
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      user={currentUser || topThree[0]}
      cardRef={cardRef}
      theme={cardTheme}
      onThemeChange={setCardTheme}
      visibleStats={visibleStats}
      onStatsChange={setVisibleStats}
      referralCode={referralCode || "OMENX2025"}
    />
  );

  const locator = (
    <RankLocator
      user={currentUser}
      sortType={sortType}
      isLoggedIn={isLoggedIn}
      variant={isMobile ? "mobile" : "desktop"}
      anchorId={YOUR_RANKING_ID}
      onJump={jumpToMe}
      onSignIn={() => setAuthOpen(true)}
    />
  );

  /* ----------------------------- mobile ----------------------------- */
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <MobileHeader
            title="Leaderboard"
            showBack
            showLogo={false}
            rightContent={
              <div className="-mr-2 flex items-center gap-1">
                <MobileHeaderIconButton aria-label="Share" onClick={openShare}>
                  <Share2 className="h-5 w-5" strokeWidth={1.5} />
                </MobileHeaderIconButton>
              </div>
            }
          />

          {/* 头图：移动端是独立构图变体，不是桌面裁切；压暗层已烘进像素 */}
          <img
            src={heroMobile}
            alt=""
            aria-hidden="true"
            className="pointer-events-none block w-full select-none"
            style={{ aspectRatio: "390 / 113", objectFit: "cover" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <h1 className="sr-only">Leaderboard</h1>

          <div
            className="px-4"
            style={{ paddingTop: 16, paddingBottom: "calc(var(--bottom-nav-h, 76px) + 92px)" }}
          >
            <LeaderboardFiltersMobile
              sortType={sortType}
              onSortChange={setSortType}
              period={period}
              onPeriodChange={setPeriod}
            />

            <h2
              className="font-display"
              style={{ marginTop: 16, fontSize: 14, fontWeight: 700, lineHeight: "20px", color: "#F2F3F5" }}
            >
              Overall Ranking
            </h2>

            <div className="relative" style={{ marginTop: 16 }}>
              <LeaderboardPodium topThree={topThree} sortType={sortType} variant="mobile" />
            </div>

            <div style={{ marginTop: 16 }}>
              <LeaderboardListMobile
                rows={pageRows}
                sortType={sortType}
                currentUsername={isLoggedIn ? currentUserUsername : undefined}
                rangeLabel={rangeLabel}
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <YourRankingCardMobile id={YOUR_RANKING_ID} data={yourRanking} onShare={openShare} />
            </div>
          </div>
        </div>

        <div className="bg-card/50" style={{ paddingBottom: "var(--bottom-nav-h, 76px)" }}>
          <SeoFooter />
        </div>

        {locator}
        <BottomNav />
        {shareModal}
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  /* ----------------------------- desktop ---------------------------- */
  return (
    <>
      <EventsDesktopHeader />

      {/* 头图（全宽，走 §5 已登记的 Leaderboard 营销 hero 豁免） */}
      <div className="relative bg-background">
        <img
          src={heroDesktop}
          alt=""
          aria-hidden="true"
          className="pointer-events-none block w-full select-none"
          style={{ aspectRatio: "1440 / 384", objectFit: "cover" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: 120, background: "linear-gradient(180deg, rgba(9,10,11,0) 0%, #090A0B 100%)" }}
        />
      </div>
      <h1 className="sr-only">Leaderboard</h1>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 lg:px-6" style={{ paddingTop: 46 }}>
        <LeaderboardFiltersDesktop
          sortType={sortType}
          onSortChange={setSortType}
          period={period}
          onPeriodChange={setPeriod}
          onShare={openShare}
        />

        <div className="relative" style={{ marginTop: 48 }}>
          <LeaderboardPodium topThree={topThree} sortType={sortType} variant="desktop" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: 236,
              background: "linear-gradient(180deg, rgba(9,10,11,0) 6.568%, #090A0B 70.551%)",
            }}
          />
        </div>

        <LeaderboardTableDesktop
          rows={pageRows}
          sortType={sortType}
          currentUsername={isLoggedIn ? currentUserUsername : undefined}
          rangeLabel={rangeLabel}
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
        />

        <YourRankingBarDesktop
          id={YOUR_RANKING_ID}
          data={yourRanking}
          isLoggedIn={isLoggedIn}
          onShare={openShare}
        />
      </main>

      <SeoFooter />
      {locator}
      {shareModal}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
