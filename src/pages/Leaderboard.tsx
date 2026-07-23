import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Share2, Crown, ChevronLeft, ChevronDown, Sparkles, Zap, Download, Send, Copy, Check, X, ChevronUp, User, Palette, Eye, EyeOff } from "lucide-react";
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
// MobileHeader is NOT used here - Leaderboard is a marketing page with custom hero header
import { LaurelWreath, SmallLaurelBadge } from "@/components/LaurelWreath";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useReferral } from "@/hooks/useReferral";
import * as htmlToImage from "html-to-image";
import omenxLogo from "@/assets/omenx-logo.svg";
import { QRCodeSVG } from "qrcode.react";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { AuthDialog } from "@/components/auth/AuthDialog";

type SortType = "pnl" | "roi" | "volume";
type PeriodType = "daily" | "7d" | "30d" | "180d";

const periodTabs: { key: PeriodType; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "180d", label: "180 Days" },
];

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

const sortTabs: { key: SortType; label: string; icon: React.ElementType }[] = [
  { key: "pnl", label: "PnL", icon: DollarSign },
  { key: "roi", label: "ROI %", icon: TrendingUp },
  { key: "volume", label: "Volume", icon: BarChart3 },
];

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

const TopThreeCard = ({ user, sortType, position }: { user: LeaderboardUser; sortType: SortType; position: "left" | "center" | "right" }) => {
  const isFirst = user.rank === 1;
  
  // Modern web3 style - clean with gradient borders and glows
  const rankStyles = {
    1: {
      gradient: "from-yellow-400 via-amber-400 to-orange-500",
      glowColor: "shadow-[0_0_40px_rgba(251,191,36,0.4)]",
      ringColor: "ring-yellow-400/60",
      avatarSize: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
      marginTop: "mt-0",
      scale: "scale-100 md:scale-105",
    },
    2: {
      gradient: "from-slate-300 via-slate-400 to-slate-500",
      glowColor: "shadow-[0_0_30px_rgba(148,163,184,0.3)]",
      ringColor: "ring-slate-400/60",
      avatarSize: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
      marginTop: "mt-3 sm:mt-4 md:mt-6",
      scale: "scale-100",
    },
    3: {
      gradient: "from-amber-600 via-orange-500 to-amber-700",
      glowColor: "shadow-[0_0_30px_rgba(217,119,6,0.3)]",
      ringColor: "ring-amber-500/60",
      avatarSize: "w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22",
      marginTop: "mt-6 sm:mt-8 md:mt-10",
      scale: "scale-100",
    },
  };
  
  const style = rankStyles[user.rank as 1 | 2 | 3];
  
  const getValue = () => {
    switch (sortType) {
      case "pnl":
        return `$${user.pnl.toLocaleString()}`;
      case "roi":
        return `${user.roi.toFixed(0)}%`;
      case "volume":
        return `$${user.volume.toLocaleString()}`;
    }
  };

  const orderClass = position === "left" ? "order-1" : position === "center" ? "order-2" : "order-3";
  const rankSuffix = user.rank === 1 ? "st" : user.rank === 2 ? "nd" : "rd";

  return (
    <div className={`flex flex-col items-center ${orderClass} ${style.marginTop} ${style.scale}`}>
      {/* Avatar with gradient ring and glow */}
      <div className="relative">
        {/* Glow effect behind avatar */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${style.gradient} blur-xl opacity-40 animate-pulse`} />
        
        {/* Gradient border ring */}
        <div className={`relative p-1 rounded-full bg-gradient-to-br ${style.gradient} ${style.glowColor}`}>
          <div className="rounded-full bg-background p-0.5">
            <Avatar className={`${style.avatarSize} rounded-full ring-2 ${style.ringColor}`}>
              <AvatarImage 
                src={user.avatar} 
                alt={user.username}
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">
                {user.username.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Rank badge */}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-gradient-to-r ${style.gradient} shadow-lg`}>
          <span className="text-white font-bold text-sm drop-shadow-md">
            {user.rank}<sup className="text-[10px] ml-0.5">{rankSuffix}</sup>
          </span>
        </div>

        {/* Crown for 1st place */}
        {isFirst && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
          </div>
        )}
      </div>

      {/* Username */}
      <h3 className={`font-semibold text-foreground ${isFirst ? "text-sm md:text-base" : "text-xs md:text-sm"} mt-2 md:mt-3 truncate max-w-[90px] md:max-w-[120px] text-center`}>
        {user.username}
      </h3>

      {/* Value */}
      <div className={`font-mono font-bold text-trading-green ${isFirst ? "text-base md:text-lg" : "text-sm md:text-base"} mt-0.5`}>
        {getValue()}
      </div>
    </div>
  );
};

const LeaderboardRow = ({ user, sortType, index, isCurrentUser, onScrollToUser }: { 
  user: LeaderboardUser; 
  sortType: SortType; 
  index: number;
  isCurrentUser?: boolean;
  onScrollToUser?: () => void;
}) => {
  const getValue = () => {
    switch (sortType) {
      case "pnl":
        return `$${user.pnl.toLocaleString()}`;
      case "roi":
        return `${user.roi.toFixed(1)}%`;
      case "volume":
        return `$${user.volume.toLocaleString()}`;
    }
  };

  // All ranks use same style for consistency
  const rankAccent = { border: "border-border/30", bg: "bg-card/40" };

  return (
    <div 
      id={isCurrentUser ? "current-user-row" : undefined}
      className={`web3-card flex items-center gap-3 p-3 transition-all duration-300 group animate-fade-in ${
        isCurrentUser 
          ? "web3-card-intense" 
          : "hover:web3-card-intense"
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Rank Badge */}
      <div className="flex-shrink-0">
        <SmallLaurelBadge rank={user.rank} />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Avatar className={`h-9 w-9 border transition-all duration-300 ${
          isCurrentUser 
            ? "border-primary/60" 
            : "border-border/40 group-hover:border-primary/40"
        }`}>
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
            {user.username.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm truncate transition-colors ${
              isCurrentUser ? "text-primary" : "text-foreground group-hover:text-primary"
            }`}>
              {user.username}
            </h4>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full">
                YOU
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/80">{user.trades} trades</p>
        </div>
      </div>

      {/* Value + Rank Change */}
      <div className="text-right flex-shrink-0">
        <div className={`font-mono font-bold text-sm ${
          isCurrentUser ? "text-primary" : "text-trading-green"
        }`}>
          {getValue()}
        </div>
        {/* Rank Change Indicator */}
        <div className="flex items-center justify-end">
          {user.rankChange > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-trading-green/15 text-trading-green font-medium">
              ↑{user.rankChange} <span className="opacity-70">ranks</span>
            </span>
          ) : user.rankChange < 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-trading-red/15 text-trading-red font-medium">
              ↓{Math.abs(user.rankChange)} <span className="opacity-70">ranks</span>
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/50 font-medium">
              —
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Fixed bottom "My Rank" component
const MyRankBar = ({ user, sortType, onClick }: { user: LeaderboardUser; sortType: SortType; onClick: () => void }) => {
  const getValue = () => {
    switch (sortType) {
      case "pnl":
        return `$${user.pnl.toLocaleString()}`;
      case "roi":
        return `${user.roi.toFixed(1)}%`;
      case "volume":
        return `$${user.volume.toLocaleString()}`;
    }
  };

  return (
    <div 
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 cursor-pointer"
    >
      <div className="bg-card/95 backdrop-blur-md border border-primary/40 rounded-2xl p-4 shadow-[0_0_30px_hsl(260_60%_55%/0.3)] transition-all duration-300 hover:scale-[1.02] hover:border-primary/60">
        <div className="flex items-center gap-3">
          {/* User icon */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-primary/50 rounded-full blur-sm opacity-50" />
            <Avatar className="relative h-12 w-12 border-2 border-primary/50">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">My Ranking</span>
              <ChevronUp className="w-4 h-4 text-primary animate-bounce" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 border border-primary/30">
                  <span className="text-sm font-bold text-primary">#{user.rank}</span>
                </div>
              </div>
              <span className="font-semibold text-foreground truncate">{user.username}</span>
            </div>
          </div>

          {/* Value */}
          <div className="text-right">
            <div className="flex items-center gap-1 font-mono font-bold text-primary text-lg">
              <Zap className="w-4 h-4" />
              {getValue()}
            </div>
            <div className="text-xs text-muted-foreground">
              {user.roi.toFixed(1)}% ROI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card theme types
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { username, avatarUrl, user } = useUserProfile();
  const { referralCode } = useReferral();
  const [sortType, setSortType] = useState<SortType>("pnl");
  const [period, setPeriod] = useState<PeriodType>("7d");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardTheme, setCardTheme] = useState<CardTheme>("default");
  const [visibleStats, setVisibleStats] = useState<StatKey[]>(["pnl", "roi", "volume"]);
  const [authOpen, setAuthOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isLoggedIn = !!user;

  // Use actual user info if logged in, otherwise use mock data
  const currentUserUsername = user ? (username || "You") : MOCK_CURRENT_USER_USERNAME;
  const currentUserAvatar = user ? (avatarUrl || "") : "";

  const sortedData = [...mockLeaderboardData].sort((a, b) => {
    switch (sortType) {
      case "pnl":
        return b.pnl - a.pnl;
      case "roi":
        return b.roi - a.roi;
      case "volume":
        return b.volume - a.volume;
    }
  }).map((user, idx) => {
    // Replace mock current user with actual user data
    if (user.username === MOCK_CURRENT_USER_USERNAME) {
      return { 
        ...user, 
        rank: idx + 1,
        username: currentUserUsername,
        avatar: currentUserAvatar || user.avatar
      };
    }
    return { ...user, rank: idx + 1 };
  });

  const topThree = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);
  
  // Find current user - only when logged in
  const currentUser = isLoggedIn ? sortedData.find(u => u.username === currentUserUsername) : undefined;
  const isCurrentUserInTopThree = currentUser && currentUser.rank <= 3;

  const scrollToCurrentUser = () => {
    const element = document.getElementById('current-user-row');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a flash effect
      element.classList.add('ring-4', 'ring-primary');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-primary');
      }, 1500);
    }
  };

  const handleShareCard = async () => {
    // If not logged in, show auth dialog/sheet
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }

    if (!cardRef.current || isGenerating) return;

    setIsGenerating(true);
    try {
      // Generate image from the card
      const blob = await htmlToImage.toBlob(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0c14',
        skipFonts: true, // Skip external fonts to avoid CORS errors
        cacheBust: true,
      });

      if (blob) {
        setShareImageBlob(blob);
        setIsShareModalOpen(true);
      } else {
        toast({ title: "Failed to generate image", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: "Failed to generate image", description: "Please try again", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const content = (
    <div className="min-h-screen bg-background">
      {/* Unified background with seamless gradient */}
      <div className="relative">
        {/* Single unified background - extends through entire page */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Content wrapper */}
        <div className="relative z-10 px-4 pt-4">
          {/* Custom Marketing Header - NOT using MobileHeader */}
          {isMobile && (
            <div className="flex items-center justify-between mb-4">
              <img src={omenxLogo} alt="OMENX" className="h-6" />
              <button 
                onClick={handleShareCard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Share</span>
              </button>
            </div>
          )}

          {/* Logo + Title with Neon Effect */}
          <div className="text-center mb-4">
            {/* Logo - only show on desktop since mobile has it above */}
            {!isMobile && (
              <div className="flex justify-center mb-2">
                <img src={omenxLogo} alt="OMENX" className="h-6" />
              </div>
            )}
            
            {/* Neon Leaderboard Title */}
            <div className="relative inline-block">
              {/* Outer glow - soft spread with pulse */}
              <div className="absolute inset-0 blur-2xl opacity-40 animate-[pulse_3s_ease-in-out_infinite]">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-[#a855f7]">
                  LEADERBOARD
                </h1>
              </div>
              {/* Mid glow with delayed pulse */}
              <div className="absolute inset-0 blur-lg opacity-60 animate-[pulse_3s_ease-in-out_0.5s_infinite]">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-[#c084fc]">
                  LEADERBOARD
                </h1>
              </div>
              {/* Inner glow */}
              <div className="absolute inset-0 blur-sm opacity-90">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-[#d8b4fe]">
                  LEADERBOARD
                </h1>
              </div>
              {/* Main text - hollow stroke effect with subtle glow pulse */}
              <h1 
                className="relative text-2xl md:text-4xl font-black tracking-tight text-transparent animate-[neon-pulse_3s_ease-in-out_infinite]"
                style={{
                  WebkitTextStroke: '1.5px #c084fc',
                  textShadow: '0 0 10px #a855f7, 0 0 20px #a855f7, 0 0 40px #7c3aed'
                }}
              >
                LEADERBOARD
              </h1>
            </div>
          </div>

          {/* Sort Tabs with Period Dropdown on mobile */}
          <div className="flex justify-center items-center gap-2 mb-4">
            {/* Period Dropdown - Mobile only, inline with sort tabs */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/20 transition-all duration-200">
                    {periodTabs.find(t => t.key === period)?.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-card border-border">
                  {periodTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.key}
                      onClick={() => setPeriod(tab.key)}
                      className={`text-sm cursor-pointer ${period === tab.key ? "text-primary" : ""}`}
                    >
                      {tab.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortType(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  sortType === tab.key
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(260_60%_55%/0.3)]"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/20"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Top 3 Podium - integrated with page flow */}
          <div className="relative pb-4">
            {/* Glow effects and star particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Central glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 bg-yellow-500/10 rounded-full blur-[80px]" />
              
              {/* Star particles - distributed across the podium area */}
              {/* Center (1st place) stars */}
              <Sparkles className="star-particle text-yellow-400/70 w-3 h-3 absolute top-[15%] left-[50%]" style={{ animationDelay: '0s' }} />
              <Sparkles className="star-particle-burst text-yellow-300/60 w-2.5 h-2.5 absolute top-[5%] left-[48%]" style={{ animationDelay: '0.3s' }} />
              <Sparkles className="star-particle text-amber-400/50 w-2 h-2 absolute top-[25%] left-[53%]" style={{ animationDelay: '0.6s' }} />
              <Sparkles className="star-particle-float text-yellow-200/40 w-2 h-2 absolute top-[35%] left-[46%]" style={{ animationDelay: '1.2s' }} />
              
              {/* Left (2nd place) stars */}
              <Sparkles className="star-particle text-slate-300/50 w-2 h-2 absolute top-[30%] left-[25%]" style={{ animationDelay: '0.4s' }} />
              <Sparkles className="star-particle-burst text-slate-400/40 w-2.5 h-2.5 absolute top-[20%] left-[28%]" style={{ animationDelay: '0.9s' }} />
              <Sparkles className="star-particle text-gray-300/30 w-1.5 h-1.5 absolute top-[40%] left-[22%]" style={{ animationDelay: '1.5s' }} />
              
              {/* Right (3rd place) stars */}
              <Sparkles className="star-particle text-amber-500/50 w-2 h-2 absolute top-[35%] left-[75%]" style={{ animationDelay: '0.2s' }} />
              <Sparkles className="star-particle-burst text-orange-400/40 w-2 h-2 absolute top-[25%] left-[72%]" style={{ animationDelay: '0.7s' }} />
              <Sparkles className="star-particle text-amber-600/30 w-1.5 h-1.5 absolute top-[45%] left-[78%]" style={{ animationDelay: '1.1s' }} />
              
              {/* Extra floating particles */}
              <Sparkles className="star-particle-float text-yellow-400/30 w-1.5 h-1.5 absolute top-[50%] left-[40%]" style={{ animationDelay: '1.8s' }} />
              <Sparkles className="star-particle-float text-yellow-300/25 w-1.5 h-1.5 absolute top-[55%] left-[60%]" style={{ animationDelay: '2.1s' }} />
            </div>
            
            {/* Podium cards */}
            <div className="relative flex justify-center items-start gap-4 md:gap-8">
              <TopThreeCard user={topThree[1]} sortType={sortType} position="left" />
              <TopThreeCard user={topThree[0]} sortType={sortType} position="center" />
              <TopThreeCard user={topThree[2]} sortType={sortType} position="right" />
            </div>
          </div>
        </div>
      </div>

      {/* Rest of Leaderboard - seamless continuation */}
      <div className="px-4 pb-24 md:pb-8 max-w-2xl mx-auto">
        {/* Subtle divider */}
        <div className="flex items-center justify-center gap-3 mb-3 pt-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Top Ranking</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        </div>

        <div className="space-y-1.5">
          {restOfList.map((user, index) => (
            <LeaderboardRow 
              key={user.rank} 
              user={user} 
              sortType={sortType} 
              index={index}
              isCurrentUser={isLoggedIn && user.username === currentUserUsername}
            />
          ))}
        </div>

        {/* Shareable Card Section */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Rank
          </h3>
          
          <ShareableCard 
            user={currentUser || topThree[0]} 
            cardRef={cardRef}
            onShare={handleShareCard}
            isGenerating={isGenerating}
            theme={cardTheme}
            visibleStats={visibleStats}
            referralCode={referralCode || "OMENX2025"}
          />
          <p className="text-center text-sm text-muted-foreground mt-4">
            Tap to customize and share your ranking card
          </p>
        </div>
        {/* Spacer for fixed MyRankBar */}
        <div className="h-28 md:h-24" />
      </div>

      {/* Share Modal */}
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
    </div>
  );

  if (isMobile) {
    return (
      <>
        {content}
        {currentUser && !isCurrentUserInTopThree && (
          <MyRankBar user={currentUser} sortType={sortType} onClick={scrollToCurrentUser} />
        )}
        <BottomNav />
        
        {/* Auth Sheet for non-logged in users */}
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  return (
    <>
      <EventsDesktopHeader />
      <div className="max-w-7xl mx-auto relative">
        {/* Page-specific controls - absolute positioned with higher z-index */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
          {/* Period Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30 transition-all duration-200">
                {periodTabs.find(t => t.key === period)?.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {periodTabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.key}
                  onClick={() => setPeriod(tab.key)}
                  className={`text-sm cursor-pointer ${period === tab.key ? "text-primary" : ""}`}
                >
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share button */}
          <button 
            onClick={handleShareCard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
        {content}
        {isLoggedIn && currentUser && !isCurrentUserInTopThree && (
          <MyRankBar user={currentUser} sortType={sortType} onClick={scrollToCurrentUser} />
        )}
      </div>

      {/* Auth Dialog/Sheet for non-logged in users */}
      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </>
  );
}
