import { useState } from "react";
import { Home, BarChart3, TrendingUp, User, LogOut, Settings, HelpCircle, Wallet, ChevronRight, Gift, Users, Lightbulb, Award, Ticket, KeyRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { toast } from "sonner";
import { MobileDrawer, MobileDrawerList, MobileDrawerListItem } from "@/components/ui/mobile-drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SPORTS_LINK } from "@/lib/worldCup";
import soccerBallAsset from "@/assets/soccer-ball.png.asset.json";


const navItems = [
  { icon: Home, label: "Home", path: "/", disabled: false },
  { icon: BarChart3, label: "Events", path: "/events", disabled: false },
  { icon: User, label: "Sports", path: "__sports__", disabled: false, featured: true, external: true },
  { icon: TrendingUp, label: "Trade", path: "/trade", disabled: false },
];

// Haptic feedback utility
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
};

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { balance, spotBalance, user, username, avatarUrl, profile } = useUserProfile();
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      setProfileSheetOpen(false);
      navigate("/");
    }
  };

  const isActive = (path: string) => {
    if (path === "/trade") {
      return location.pathname.startsWith("/trade") || location.pathname === "/order-preview";
    }
    if (path === "/events") {
      // Events dropdown controls both active and resolved, so highlight Events for both
      return location.pathname === "/events" || location.pathname.startsWith("/resolved");
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 pb-6 z-[200]">
      <div className="flex justify-around items-end max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const isFeatured = item.featured;
          
          if (isFeatured) {
            return (
              <button
                key={item.path}
                onClick={() => {
                  triggerHaptic('medium');
                  window.open(SPORTS_LINK, "_blank", "noopener,noreferrer");
                }}
                className="relative flex flex-col items-center gap-1 w-20 -mt-2"
                aria-label="Open Sports"
              >
                <div className="animate-ball-bounce">
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                    <img
                      src={soccerBallAsset.url}
                      alt=""
                      className="animate-ball-spin w-7 h-7 object-contain"
                      draggable={false}
                    />
                    <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                  </div>
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase text-amber-500">
                  {item.label}
                </span>
              </button>
            );
          }
          
          return (
            <button
              key={item.path}
              onClick={() => {
                if (!item.disabled) {
                  triggerHaptic('light');
                  navigate(item.path, { replace: true });
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                active 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground scale-100 hover:scale-105"
              }`}
            >
              <item.icon className={`w-5 h-5 transition-all duration-300 ${
                active ? "text-primary" : ""
              }`} />
              <span className={`text-xs transition-all duration-300 ${
                active ? "font-semibold" : "font-medium"
              }`}>{item.label}</span>
            </button>
          );
        })}

        {/* Profile/Login button - rightmost */}
        {user ? (
          <button
            onClick={() => {
              triggerHaptic('light');
              setProfileSheetOpen(true);
            }}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              location.pathname === "/portfolio"
                ? "text-primary scale-110" 
                : "text-muted-foreground scale-100 hover:scale-105"
            }`}
          >
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={avatarUrl || undefined} alt="User" />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <span className={`text-xs transition-all duration-300 ${
              location.pathname === "/portfolio" ? "font-semibold" : "font-medium"
            }`}>Me</span>
          </button>
        ) : (
          <button
            onClick={() => {
              triggerHaptic('light');
              setAuthSheetOpen(true);
            }}
            className="flex flex-col items-center gap-1 transition-all duration-300 text-muted-foreground hover:text-foreground hover:scale-105"
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Me</span>
          </button>
        )}
      </div>

      {/* Auth Sheet for mobile */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} />

      {/* Profile Drawer for logged in users - updated */}
      <MobileDrawer open={profileSheetOpen} onOpenChange={setProfileSheetOpen} hideCloseButton>
        {/* User Info Section */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-xl">
          <Avatar className="w-12 h-12 border-2 border-primary/50">
            <AvatarImage src={avatarUrl || undefined} alt="User" />
            <AvatarFallback className="bg-primary/20 text-primary">
              {username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {username || "Trader"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || profile?.email || "Account"}</p>
          </div>
        </div>

        {/* Equity Card - Tappable to go to Wallet page */}
        <div 
          onClick={() => {
            setProfileSheetOpen(false);
            navigate("/wallet");
          }}
          role="button"
          tabIndex={0}
          className="w-full mb-4 p-4 bg-trading-green/10 border border-trading-green/30 rounded-xl hover:bg-trading-green/20 transition-colors active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-trading-green" />
              <span className="text-sm text-muted-foreground">Equity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-trading-green font-mono">
                ${(spotBalance + balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <MobileDrawerList>
          <MobileDrawerListItem
            icon={User}
            label="Portfolio"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/portfolio");
            }}
          />
          <MobileDrawerListItem
            icon={Award}
            label="Leaderboard"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/leaderboard");
            }}
          />
          <MobileDrawerListItem
            icon={Gift}
            label="Rewards"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/rewards");
            }}
          />
          <MobileDrawerListItem
            icon={Users}
            label="Referral"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/referral");
            }}
          />
          <MobileDrawerListItem
            icon={Ticket}
            label="Position Vouchers"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/vouchers");
            }}
          />
          <MobileDrawerListItem
            icon={KeyRound}
            label="API"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/developers");
            }}
          />

          <MobileDrawerListItem
            icon={Settings}
            label="Settings"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/settings");
            }}
          />

          <MobileDrawerListItem
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => {
              setProfileSheetOpen(false);
              window.open("https://discord.gg/qXssm2crf9", "_blank", "noopener,noreferrer");
            }}
          />
          <MobileDrawerListItem
            icon={Lightbulb}
            label="Insights"
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/insights");
            }}
          />
        </MobileDrawerList>

        <div className="h-px bg-border/50 my-2" />

        <MobileDrawerList>
          <MobileDrawerListItem
            icon={LogOut}
            label="Sign Out"
            onClick={handleSignOut}
            className="text-trading-red hover:bg-trading-red/10"
          />
        </MobileDrawerList>
      </MobileDrawer>
    </nav>
  );
};
