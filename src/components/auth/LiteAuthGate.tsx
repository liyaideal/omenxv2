// ============================================================
// Global Lite guest auth gate.
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
  /**
   * "page" (default) = full-height blurred overlay.
   * "panel" = compact inline card for short Pro terminal panels (≤220px, no blur).
   */
  variant = "page",
  /** Docs-only: force the signed-out overlay in /style-guide. Never set in product. */
  forceSignedOut = false,
  /** Docs-only: force children through in /style-guide. Never set in product. */
  forceSignedIn = false,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  variant?: "page" | "panel";
  forceSignedOut?: boolean;
  forceSignedIn?: boolean;
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  // The auth wizard lives OUTSIDE the signed-out branch (CPO 2026-09-21).
  // Before, the dialog was a child of the overlay, so the moment a sign-up
  // produced a session the gate flipped to `children` and unmounted the
  // wizard mid-flow — new accounts never saw createWallet / completeProfile.
  // Now the gate lets the page through and the wizard stays open until the
  // user finishes ("Start trading") or closes it. Existing accounts still
  // close the dialog on sign-in (AuthContent handles that).
  const authUi = isMobile ? (
    <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
  ) : (
    <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
  );

  if (forceSignedIn || (user && !forceSignedOut)) {
    return (
      <>
        {children}
        {authOpen && authUi}
      </>
    );
  }

  if (variant === "panel") {
    return (
      <div className="bg-card flex flex-col items-center justify-center text-center px-4 py-4">
        <img
          src={isMobile ? "/assets/mobile/auth-gate-lynx.png" : "/assets/desktop/auth-gate-lynx.png"}
          alt=""
          aria-hidden
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          className="pointer-events-none select-none w-16 h-16 object-contain"
        />
        <h2 className="font-display font-semibold text-[15px] tracking-[-0.3px] text-white mt-2 whitespace-nowrap">
          {title}
        </h2>
        <p className="text-[12px] leading-[1.5] text-[#9CA2AB] max-w-[320px] mx-auto pt-1 line-clamp-1">
          {description}
        </p>
        <div className="pt-2.5 flex items-center justify-center gap-[10px]">
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            style={{ backgroundImage: "linear-gradient(147deg, #D5FF4D 7.7%, #33D6FF 92.3%)" }}
            className="inline-flex items-center gap-2 rounded-[10px] px-[18px] h-9 font-semibold text-[13px] text-[#090A0B]"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="inline-flex items-center justify-center h-9 rounded-[10px] px-[14px] border-[1.5px] border-[#1C1F26] bg-transparent text-[12.5px] text-white/80 transition-colors hover:text-white"
          >
            Create account
          </button>
        </div>

        {authUi}
      </div>
    );
  }



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

      {authUi}
    </div>
  );
};

export default LiteAuthGate;
