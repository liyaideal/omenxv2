import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Globe,
  ChevronDown,
  User,
  LogOut,
  LogIn,
  Gift,
  Users,
  Settings,
  HelpCircle,
  Shield,
  MessageCircle,
  ExternalLink,
  Check,
  Ticket,
  KeyRound,
  ArrowLeftRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useUserProfile } from "@/hooks/useUserProfile";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { computeTotalEquity, formatEquityUsd } from "@/lib/equity";
import { TransferDialog } from "@/components/wallet/TransferDialog";


// Main nav (4 items). Resolved is now an Events page tab; Leaderboard is a
// regular nav entry without trophy/purple-border decoration.
const navItems = [
  { label: "Events", path: "/events" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Leaderboard", path: "/leaderboard" },
  { label: "Insights", path: "/insights" },
];

const languages = [
  { code: "EN", label: "English" },
  { code: "CN", label: "中文" },
  { code: "JP", label: "日本語" },
];

interface EventsDesktopHeaderProps {
  rightContent?: React.ReactNode;
}

export const EventsDesktopHeader = ({ rightContent }: EventsDesktopHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState("EN");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { balance, spotBalance, user, username, avatarUrl } = useUserProfile();
  const [transferOpen, setTransferOpen] = useState(false);
  const totalEquity = computeTotalEquity({ spotBalance, balance });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const currentPath = location.pathname;

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-md"
      style={{
        background:
          "linear-gradient(180deg, hsl(222 47% 8% / 0.98) 0%, hsl(222 47% 6% / 0.95) 100%)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-6 px-4 py-3 lg:px-6">
        {/* Left: Logo + Navigation */}
        <div className="flex min-w-0 items-center gap-4 xl:gap-8">
          <button
            onClick={() => navigate("/style-guide")}
            className="flex flex-shrink-0 items-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:opacity-80"
          >
            <Logo size="xl" />
          </button>

          <nav className="flex min-w-0 items-center gap-1">
            {navItems.map((item) => {
              // Resolved (now an Events page tab) keeps Events highlighted.
              const isActive =
                currentPath === item.path ||
                (item.path === "/events" && currentPath.startsWith("/resolved"));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 xl:px-4 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(260_60%_55%/0.3)]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Custom Content + Equity + Profile */}
        <div className="flex min-w-0 items-center gap-2 xl:gap-4">
          {rightContent}

          {user ? (
            <>
              <HoverCard openDelay={120} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => navigate("/wallet")}
                    className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 transition-all duration-200 hover:border-trading-green/30 hover:bg-trading-green/5 xl:px-4"
                  >
                    <span className="hidden text-sm text-muted-foreground xl:inline">
                      Equity:
                    </span>
                    <span className="font-mono text-sm font-bold text-trading-green">
                      ${formatEquityUsd(totalEquity)}
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="w-[260px] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    Total Equity
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Spot Account</span>
                      <span className="font-mono">${formatEquityUsd(spotBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Futures Account</span>
                      <span className="font-mono">${formatEquityUsd(balance)}</span>
                    </div>
                  </div>
                  <div className="my-2 border-t border-border/50" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Total Equity</span>
                    <span className="font-mono font-bold">${formatEquityUsd(totalEquity)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransferOpen(true);
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors"
                  >
                    <ArrowLeftRight className="w-3 h-3" /> Transfer ›
                  </button>
                </HoverCardContent>
              </HoverCard>
              <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 xl:gap-2.5 xl:px-3">
                    <Avatar className="h-9 w-9 border-2 border-primary/50">
                      <AvatarImage src={avatarUrl || undefined} alt="User" />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {username?.charAt(0).toUpperCase() ||
                          user.email?.charAt(0).toUpperCase() || (
                            <User className="h-4 w-4" />
                          )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[64px] truncate text-sm font-medium text-foreground xl:max-w-[100px]">
                      {username || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {/* Account & activity */}
                  <DropdownMenuItem onClick={() => navigate("/rewards")}>
                    <Gift className="mr-2 h-4 w-4 text-primary" />
                    Rewards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/referral")}>
                    <Users className="mr-2 h-4 w-4 text-primary" />
                    Referral
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/vouchers")}>
                    <Ticket className="mr-2 h-4 w-4 text-primary" />
                    Position Vouchers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/developers")}>
                    <KeyRound className="mr-2 h-4 w-4 text-primary" />
                    API
                  </DropdownMenuItem>


                  <DropdownMenuSeparator />


                  {/* Preferences */}
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">Language</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {language}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {languages.map((lang) => (
                          <DropdownMenuItem
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                language === lang.code
                                  ? "text-primary"
                                  : "opacity-0"
                              }`}
                            />
                            {lang.code} — {lang.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Product & support */}
                  <DropdownMenuItem
                    onClick={() => navigate("/settings/transparency")}
                  >
                    <Shield className="mr-2 h-4 w-4 text-emerald-400" />
                    Transparency Audit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://omenx-helpcenter.lovable.app",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">Help & Support</span>
                    <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://discord.gg/qXssm2crf9",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    <MessageCircle className="mr-2 h-4 w-4 text-[#5865F2]" />
                    <span className="flex-1">Join Discord</span>
                    <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Session */}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-trading-red"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Compact language selector for guests (no avatar menu available) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground xl:flex"
                    aria-label="Language"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">{language}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={language === lang.code ? "bg-muted" : ""}
                    >
                      {lang.code} — {lang.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setAuthDialogOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </header>
  );
};
