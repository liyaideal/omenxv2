import { useState, useEffect, type CSSProperties } from "react";
import { User, LogOut, Settings, HelpCircle, Wallet, ChevronRight, Gift, Lightbulb, Award, KeyRound, Compass, PieChart, ArrowLeftRight, Handshake, Globe } from "lucide-react";
import { LanguageDrawer, useLanguagePick } from "@/components/language/LanguagePicker";
import { useT } from "@/i18n";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { toast } from "sonner";
import { TransferDrawer } from "@/components/wallet/TransferDrawer";
import { MobileDrawer, MobileDrawerList, MobileDrawerListItem } from "@/components/ui/mobile-drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";


// Lite surface: Events / Portfolio / Wallet (+ shared Me button)
const liteNavItems = [
  { icon: Compass, key: "nav.events", path: "/events" },
  { icon: PieChart, key: "nav.portfolio", path: "/portfolio" },
  { icon: Wallet, key: "nav.wallet", path: "/wallet" },
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
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { t } = useT();
  const { code: languageCode, current: language, pick: pickLanguage } = useLanguagePick();
  const [transferOpen, setTransferOpen] = useState(false);

  // Deliver the user to the tab they originally tapped, once signed in
  useEffect(() => {
    if (user && pendingPath) {
      navigate(pendingPath, { replace: true });
      setPendingPath(null);
    }
  }, [user, pendingPath, navigate]);

  const handleAuthSheetOpenChange = (open: boolean) => {
    setAuthSheetOpen(open);
    if (!open) {
      // Only forget the pending destination if the user really abandoned sign-in.
      // (Local `user` state can lag right after a successful login closes the sheet.)
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setPendingPath(null);
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t("auth.signOutFailed"));
    } else {
      toast.success(t("common.signed_out_successfully"));
      setProfileSheetOpen(false);
      navigate("/");
    }
  };




  const isLiteActive = (path: string) => {
    const p = location.pathname;
    if (path === "/events") {
      return (
        p === "/events" ||
        p.startsWith("/resolved") ||
        p.startsWith("/trade") ||
        p.startsWith("/spot")
      );
    }
    return p === path;
  };

  return (
    <nav
      style={{ "--bottom-nav-h": "76px" } as CSSProperties}
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 pb-6 z-[200]"
    >
      <div className="flex justify-around items-end max-w-md mx-auto">
        {liteNavItems.map((item) => {
          const active = isLiteActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                triggerHaptic('light');
                if (!user && (item.path === "/portfolio" || item.path === "/wallet")) {
                  setPendingPath(item.path);
                  setAuthSheetOpen(true);
                  return;
                }
                navigate(item.path, { replace: true });
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                active
                  ? "text-primary scale-110"
                  : "text-muted-foreground scale-100 hover:scale-105"
              }`}
            >
              <item.icon strokeWidth={1.75} className={`w-5 h-5 transition-all duration-300 ${active ? "text-primary" : ""}`} />
              <span className={`text-xs transition-all duration-300 ${active ? "font-semibold" : "font-medium"}`}>
                {t(item.key)}
              </span>
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
            }`}>{t("common.nav_me")}</span>
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
            <span className="text-xs font-medium">{t("common.nav_me")}</span>
          </button>
        )}
      </div>

      {/* Auth Sheet for mobile */}
      <AuthSheet open={authSheetOpen} onOpenChange={handleAuthSheetOpenChange} />

      {/* Language sheet opened from the Me drawer row (language-entry-v1 R4) */}
      <LanguageDrawer
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        current={languageCode}
        onPick={(c) => {
          setLanguageOpen(false);
          void pickLanguage(c);
        }}
      />

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
              {username || t("common.trader")}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || profile?.email || t("header.account")}</p>
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
              <span className="text-sm text-muted-foreground">{t("common.equity")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-trading-green font-mono">
                ${(spotBalance + balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-trading-green/20 pt-3 text-xs">
            <span className="text-muted-foreground">
              {t("header.accountsLine", { standard: spotBalance.toFixed(2), boost: balance.toFixed(2) })}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileSheetOpen(false);
                setTransferOpen(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-md px-2 py-1 text-primary hover:bg-primary/10"
            >
              <ArrowLeftRight className="h-3 w-3" />
              {t("nav.screen.navigation.bottom_navigation.transfer")}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <MobileDrawerList>
          <MobileDrawerListItem
            icon={User}
            label={t("nav.portfolio")}
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/portfolio");
            }}
          />
          <MobileDrawerListItem
            icon={Award}
            label={t("nav.leaderboard")}
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/leaderboard");
            }}
          />
          <MobileDrawerListItem
            icon={Gift}
            label={t("nav.rewards")}
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/rewards");
            }}
          />
          {/* Affiliate Program entry (CPO 2026-09-19): mobile has no top-nav slot for it, so it lives here after Rewards. */}
          <MobileDrawerListItem
            icon={Handshake}
            label={t("nav.affiliateProgram")}
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/affiliate");
            }}
          />
          {/* Referral entry hidden until the /referral route exists (R3b-2 round 12) */}
          {/* Vouchers live inside /rewards as a tab — no separate menu entry (2026-08-12) */}
          <MobileDrawerListItem
            icon={KeyRound}
            label={t("nav.api")}
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/developers");
            }}
          />

          {/* Language row (CPO 2026-09-28, language-entry-v1 R4): sits above
              Settings, shows the current language's own name, opens the same
              LanguageDrawer the brand bar uses. */}
          <MobileDrawerListItem
            icon={Globe}
            label={t("nav.language")}
            right={<span className="text-sm text-muted-foreground">{language.label}</span>}
            onClick={() => {
              setProfileSheetOpen(false);
              setLanguageOpen(true);
            }}
          />

          <MobileDrawerListItem
            icon={Settings}
            label={t("nav.settings")}
            onClick={() => {
              setProfileSheetOpen(false);
              navigate("/settings");
            }}
          />




          <MobileDrawerListItem
            icon={HelpCircle}
            label={t("nav.screen.navigation.bottom_navigation.help_and_support")}
            onClick={() => {
              setProfileSheetOpen(false);
              window.open("https://discord.gg/qXssm2crf9", "_blank", "noopener,noreferrer");
            }}
          />

          <MobileDrawerListItem
            icon={Lightbulb}
            label={t("nav.insights")}
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
            label={t("nav.screen.navigation.bottom_navigation.sign_out")}
            onClick={handleSignOut}
            className="text-trading-red hover:bg-trading-red/10"
          />
        </MobileDrawerList>
      </MobileDrawer>

      <TransferDrawer open={transferOpen} onOpenChange={setTransferOpen} />
    </nav>
  );
};
