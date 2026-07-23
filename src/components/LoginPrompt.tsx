import { useState } from "react";
import { LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";

interface LoginPromptProps {
  title?: string;
  description?: string;
}

export function LoginPrompt({ 
  title = "Sign in to continue",
  description = "Please sign in to access this feature."
}: LoginPromptProps) {
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div 
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile 
          ? "hsl(222 47% 6%)" 
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)"
      }}
    >
      {isMobile ? (
        <MobileHeader showLogo />
      ) : (
        <EventsDesktopHeader />
      )}
      
      <main className={`${isMobile ? "px-4" : "px-8 max-w-7xl mx-auto"} flex items-center justify-center`} style={{ minHeight: "calc(100vh - 200px)" }}>
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => setAuthOpen(true)}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* Auth Modal - use Sheet for mobile, Dialog for desktop */}
      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </div>
  );
}
