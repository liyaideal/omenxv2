import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";

/**
 * Signed-out replacement for personalised panels (rewards rail, referral tab).
 * Keeps the frozen card chrome; only the body swaps to a sign-in invite.
 */
export const SignInPromptCard = ({
  cap = "YOUR REWARDS HERE",
  description = "Sign in to track progress and claim rewards.",
}: {
  cap?: string;
  description?: string;
}) => {
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <aside
      className="flex flex-col gap-[14px] rounded-[16px] border border-[#1D2026] bg-[#131519]"
      style={{ padding: 18 }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{cap}</div>
      <p className="text-[12.5px] leading-5 text-[#9AA1AC]">{description}</p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setAuthOpen(true)} className="border-border/50">
          <LogIn className="mr-1.5 h-4 w-4" />
          Log In
        </Button>
        <Button onClick={() => setAuthOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Sign Up
        </Button>
      </div>
      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </aside>
  );
};
