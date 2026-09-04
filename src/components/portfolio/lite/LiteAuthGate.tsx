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


export const LiteAuthGate = ({
  children,
  title = "Sign in to view your portfolio",
  description = "Track your live calls and settled results by signing in to your account.",
  /** Docs-only: force the signed-out overlay in /style-guide. Never set in product. */
  forceSignedOut = false,
  /** Docs-only: force children through in /style-guide. Never set in product. */
  forceSignedIn = false,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  forceSignedOut?: boolean;
  forceSignedIn?: boolean;
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  if (forceSignedIn || (user && !forceSignedOut)) return <>{children}</>;


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
            <img
              src={isMobile ? "/assets/mobile/auth-gate-lynx.png" : "/assets/desktop/auth-gate-lynx.png"}
              alt=""
              aria-hidden
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="pointer-events-none select-none w-[120px] h-[120px] object-contain"
            />
          </div>
          <h2 className="font-display font-semibold text-[19px] tracking-[-0.475px] text-white text-center mt-[18px]">
            {title}
          </h2>
          <p className="text-[13.5px] leading-[1.625] text-[#9CA2AB] text-center max-w-[320px] mx-auto pt-[8px]">
            {description}
          </p>
          <div className="pt-[22px] flex items-center justify-center gap-[12px]">
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              style={{ backgroundImage: "linear-gradient(147deg, #D5FF4D 7.7%, #33D6FF 92.3%)" }}
              className="inline-flex items-center gap-2 rounded-[12px] px-[24px] py-[12px] font-semibold text-[14px] text-[#090A0B] drop-shadow-[0_4px_7.5px_rgba(51,214,255,0.3)]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center justify-center h-[44px] rounded-[12px] px-[18px] border-[1.5px] border-[#1C1F26] bg-transparent text-[13px] text-white/80 transition-colors hover:text-white"
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
