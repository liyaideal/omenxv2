import { useT } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import lynxCloseConfirm from "@/assets/settings/lynx-close-confirm.png";

/**
 * Lovable-only backstop for Settings › Close account (CPO 2026-10-12: no
 * grace period, closed is closed). Lovable cannot delete auth users from the
 * client, so a closed profile keeps its row with `closed_at` set; if that
 * account signs in again (or a still-open session loads), this gate covers
 * every page with one notice and a single exit, Sign out. The live platform
 * deletes the account, so sign-in simply fails there and this screen does
 * not exist. Shell = Connect modal (DESIGN §Addendum 2026-09-23); not
 * dismissable. Mounted once in App.tsx.
 */
export const ClosedAccountGate = ({ previewOpen }: { previewOpen?: boolean } = {}) => {
  const { t } = useT();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const closedAt = previewOpen ? new Date().toISOString() : profile?.closed_at ?? null;
  if (!closedAt) return null;

  const date = new Date(closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const signOut = async () => {
    if (previewOpen) return;
    await supabase.auth.signOut();
    navigate("/");
  };

  const body = (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-col items-center gap-2.5">
          <img
            src={lynxCloseConfirm}
            alt=""
            aria-hidden
            draggable={false}
            className="w-[130px] h-[130px] opacity-80 object-cover pointer-events-none select-none"
          />
          <h2 className="font-display text-[17px] font-bold leading-[25.5px] tracking-[-0.34px] text-white">
            {t("settings.account.closedGate.title")}
          </h2>
        </div>
        <p className="max-w-[330px] text-[12px] leading-[18px] text-[#9CA2AB]">{t("settings.account.closedGate.body", { date })}</p>
      </div>
      <div className="w-full pt-2.5">
        <Button className="w-full h-[44px] btn-primary text-[14px] font-semibold" onClick={signOut}>
          {t("settings.account.closedGate.signOut")}
        </Button>
      </div>
    </div>
  );

  const DESKTOP_SHELL =
    "sm:max-w-md p-0 gap-0 rounded-[16px] sm:rounded-[16px] border border-[#23262D] bg-gradient-to-b from-[#012A35] from-[12.85%] via-[#0A0B0D] via-[21%] to-[#0A0B0D] overflow-hidden";
  const MOBILE_SHELL =
    "border-t border-[#23262D] [background-image:linear-gradient(180deg,#012A35_0px,#012A35_48px,#0A0B0D_136px)] pb-[calc(16px_+_env(safe-area-inset-bottom))]";

  const title = t("settings.account.closedGate.title");

  return isMobile ? (
    <MobileDrawer open onOpenChange={() => undefined} showHandle={false} hideCloseButton className={MOBILE_SHELL}>
      <VisuallyHidden>
        <SheetTitle>{title}</SheetTitle>
      </VisuallyHidden>
      {body}
    </MobileDrawer>
  ) : (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className={DESKTOP_SHELL} hideCloseButton onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="p-6">{body}</div>
      </DialogContent>
    </Dialog>
  );
};
