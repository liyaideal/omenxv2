import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer, MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { APPLY_URL, PORTAL } from "./affiliateContent";

/**
 * One behaviour for every Apply CTA on /affiliate (CPO ruling 2026-09-19):
 *   guest      → open the site sign-in gate (AuthDialog / AuthSheet), stay on the page,
 *                no auto-continue after sign-in (the label re-resolves from the new state)
 *   member     → the application form (APPLY_URL, new tab)
 *   affiliate  → label becomes PORTAL.cta; click opens the portal notice
 *                (the portal lives on the live platform, not in this blueprint)
 * Truth: `!user` / `profile.is_affiliate` from useUserProfile (profiles.is_affiliate).
 * While a signed-in user's profile is still loading the Apply label is kept and the
 * click waits, so the label never flips twice.
 * `forceState` / `forceOpen` are docs-only (style-guide fixtures); never pass them in product.
 */
export type AffiliateCtaState = "guest" | "member" | "affiliate";

export const useAffiliateCta = (forceState?: AffiliateCtaState, forceOpen?: "portal" | "auth") => {
  const { user } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(forceOpen === "auth");
  const [portalOpen, setPortalOpen] = useState(forceOpen === "portal");

  const state: AffiliateCtaState = forceState ?? (!user ? "guest" : profile?.is_affiliate ? "affiliate" : "member");
  const resolving = !forceState && !!user && isLoading && !profile;

  const label = (applyLabel: string) => (state === "affiliate" ? PORTAL.cta : applyLabel);

  const onApply = () => {
    if (state === "guest") setAuthOpen(true);
    else if (state === "affiliate") setPortalOpen(true);
  };

  /** Member state renders a real link so the form is crawlable / middle-clickable. */
  const href = state === "member" && !resolving ? APPLY_URL : undefined;

  const body = PORTAL.body.replace("{path}", PORTAL.path);
  const overlays: ReactNode = (
    <>
      {isMobile ? <AuthSheet open={authOpen} onOpenChange={setAuthOpen} /> : <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />}
      {isMobile ? (
        <MobileDrawer open={portalOpen} onOpenChange={setPortalOpen} title={PORTAL.title} description={body}>
          <MobileDrawerActions>
            <Button className="w-full" onClick={() => setPortalOpen(false)}>
              {PORTAL.close}
            </Button>
          </MobileDrawerActions>
        </MobileDrawer>
      ) : (
        <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{PORTAL.title}</DialogTitle>
              <DialogDescription>{body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setPortalOpen(false)}>{PORTAL.close}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return { state, resolving, label, href, onApply, overlays };
};

export type AffiliateCta = ReturnType<typeof useAffiliateCta>;
