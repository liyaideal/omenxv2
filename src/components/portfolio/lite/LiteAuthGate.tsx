// ============================================================
// Lite portfolio auth gate (CPO v1.18).
// Signed-in → children pass through untouched. Signed-out → blurred
// under-layer + EmptyState-grammar overlay (lynx + btn-primary + pill).
// Never reuse AuthGateOverlay styling here.
// ============================================================
import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { LynxFigure } from "@/components/brand/LynxFigure";

export const LiteAuthGate = ({
  children,
  /** Docs-only: force the signed-out overlay in /style-guide. Never set in product. */
  forceSignedOut = false,
}: {
  children: React.ReactNode;
  forceSignedOut?: boolean;
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  if (user && !forceSignedOut) return <>{children}</>;


  return (
    <div
      className="relative isolate overflow-hidden"
      style={{
        minHeight: isMobile ? "420px" : "400px",
        maxHeight: isMobile ? "420px" : "400px",
      }}
    >
      <div className="select-none pointer-events-none blur-[3px] opacity-70" aria-hidden="true">
        {children}
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
        <div className="text-center max-w-[340px] px-4">
          <div className="flex justify-center">
            <LynxFigure size={100} />
          </div>
          <h2
            className={`font-display font-semibold tracking-tight text-foreground mt-[18px] ${
              isMobile ? "text-[18px]" : "text-[19px]"
            }`}
          >
            Sign in to view your portfolio
          </h2>
          <p
            className={`font-sans text-muted-foreground leading-relaxed mt-2 max-w-[320px] mx-auto ${
              isMobile ? "text-[13px]" : "text-[13.5px]"
            }`}
          >
            Track your live calls and settled results by signing in to your account.
          </p>
          <div className="mt-[22px] flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center rounded-full border-[1.5px] border-border bg-transparent text-foreground/80 transition-colors hover:text-foreground px-[18px] py-2 text-[13px]"
            >
              Create account
            </button>
          </div>
        </div>
      </div>

      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </div>
  );
};

export default LiteAuthGate;
