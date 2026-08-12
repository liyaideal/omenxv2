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

  const headerActions = <HomeHeaderActions />;

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


      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      <AirdropHomepageModal />
    </div>
  );
};

export default MobileHome;
