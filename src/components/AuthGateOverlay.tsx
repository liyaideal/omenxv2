import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";

interface AuthGateOverlayProps {
  /** Content to render underneath the overlay */
  children: React.ReactNode;
  /** Title shown in the overlay CTA */
  title?: string;
  /** Description shown below the title */
  description?: string;
  /** Whether to blur the background content */
  blur?: boolean;
  /** Compact mode for smaller panels */
  compact?: boolean;
  /** Max height for the blurred preview area (e.g. "320px"). Prevents large empty blurred areas on full-page gates. */
  maxPreviewHeight?: string;
}

/**
 * AuthGateOverlay – a reusable overlay that appears on top of
 * content that requires authentication. If the user is logged in,
 * the children render normally with no overlay.
 *
 * Usage:
 * ```tsx
 * <AuthGateOverlay title="Sign in to view positions">
 *   <PositionsTable />
 * </AuthGateOverlay>
 * ```
 */
export const AuthGateOverlay = ({
  children,
  title = "Sign in to continue",
  description = "Create an account or log in to access this feature.",
  blur = true,
  compact = false,
  maxPreviewHeight,
}: AuthGateOverlayProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);

  // Authenticated – render children directly
  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative isolate overflow-hidden" style={maxPreviewHeight ? { maxHeight: maxPreviewHeight } : undefined}>
      {/* Blurred / dimmed content underneath */}
      <div
        className={`select-none pointer-events-none ${blur ? "blur-[3px]" : ""} opacity-70`}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
        <div className={`text-center space-y-3 ${compact ? "max-w-[240px]" : "max-w-xs"} px-4`}>
          <div className={`mx-auto rounded-full bg-muted/80 flex items-center justify-center ${compact ? "w-10 h-10" : "w-14 h-14"}`}>
            <LogIn className={`text-muted-foreground ${compact ? "w-5 h-5" : "w-7 h-7"}`} />
          </div>
          <div className="space-y-1">
            <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
              {title}
            </h3>
            <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
              {description}
            </p>
          </div>
          <div className={`flex items-center justify-center ${compact ? "gap-2" : "gap-3"}`}>
            <Button
              size={compact ? "sm" : "default"}
              variant="outline"
              onClick={() => setAuthOpen(true)}
              className="border-border/50"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Log In
            </Button>
            <Button
              size={compact ? "sm" : "default"}
              onClick={() => setAuthOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Sign Up
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </div>
  );
};
