import { useState } from "react";
import { Bell, Globe } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { AirdropHomepageModal } from "@/components/AirdropHomepageModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { usePositions } from "@/hooks/usePositions";
import { HomeGreeting } from "@/components/home/HomeGreeting";

import { HomeCampaignRail } from "@/components/home/HomeCampaignRail";
import { HomeTopEvents } from "@/components/home/HomeTopEvents";

import { PersonalSlot } from "@/components/home/PersonalSlot";


const MobileHome = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();
  const { positions } = usePositions();

  const isAuthed = !!user;
  const hasPosition = positions.length > 0;

  const headerActions = (
    <div className="flex items-center gap-1">
      <a
        href="https://discord.gg/qXssm2crf9"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full hover:bg-[#5865F2]/15 transition-colors"
        aria-label="Discord"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-muted-foreground">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.8733.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
        </svg>
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          <DropdownMenuItem onClick={() => toast("Language switched to English")}>English</DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast("语言已切换为中文")}>中文</DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast("日本語に切り替えました")}>日本語</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        className="p-2 rounded-full hover:bg-muted/50 transition-colors relative"
        onClick={() => toast("Notifications coming soon!")}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-trading-red rounded-full" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader showLogo showBack={false} rightContent={headerActions} />

      <main className="px-4 pt-3 pb-2">
        {/* === Greeting + plus === */}
        <HomeGreeting onSignIn={() => setAuthOpen(true)} />


        {/* === Personal slot: onboarding OR position alert (single card) === */}
        <div className="mt-3 empty:hidden">
          <PersonalSlot />
        </div>

        {/* === Campaign banners (compact rail) === */}
        <div className="mt-5">
          <HomeCampaignRail />
        </div>

        {/* === Top Events === */}
        <div className="mt-5">
          <HomeTopEvents
            title={isAuthed && !hasPosition ? "Pick your first prediction" : "Top Events"}
          />

        </div>
      </main>

      <BottomNav />

      
      <BottomNav />


      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      <AirdropHomepageModal />
    </div>
  );
};

export default MobileHome;
