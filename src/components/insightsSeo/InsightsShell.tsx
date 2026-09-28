import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { t } from "@/i18n";

/** Page chrome for every /insights* route: top nav parent = Insights → no DSH (DESIGN §10 rule). */
export const InsightsShell = ({ children, mobileTitle }: { children: React.ReactNode; mobileTitle?: string }) => {
  const isMobile = useIsMobile();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isMobile ? <MobileHeader title={mobileTitle ?? t("nav.insights")} showLogo={false} showBack /> : <EventsDesktopHeader />}
      <main className={isMobile ? "mx-auto w-full max-w-7xl px-4 pb-24 pt-5" : "mx-auto w-full max-w-7xl px-4 py-10 lg:px-6"}>{children}</main>
      <SeoFooter />
      {isMobile && <BottomNav />}
    </div>
  );
};
