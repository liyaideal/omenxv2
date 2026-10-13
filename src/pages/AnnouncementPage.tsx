/**
 * /announcements/:id — public reading page (CPO 2026-10-13 A1–A7).
 *
 * Desktop: EventsDesktopHeader → `max-w-7xl px-4 lg:px-6 py-10` → detail view
 * (article 8 cols + "More announcements" rail 4 cols) → SeoFooter. No
 * breadcrumb / back link (DESIGN desktop detail-page rule, PD-6).
 * Mobile: inner header titled by kind (Announcement / Maintenance) → detail
 * view (single column, rail under the CTA) → SeoFooter. No BottomNav.
 * Withdrawn / unknown id → "no longer available" (A7). Body =
 * AnnouncementDetailView (shared with the style-guide).
 */
import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { AnnouncementDetailView } from "@/components/announcements/AnnouncementViews";
import { useAuth } from "@/hooks/useAuth";
import { useAnnouncement, useRecentAnnouncements } from "@/hooks/useAnnouncements";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/i18n";
import { ANNOUNCEMENT_KIND } from "@/lib/announcements";

export default function AnnouncementPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const location = useLocation();
  // Notification rows navigate with state.from so the article can offer "Back to Notifications" (A5).
  const fromNotifications = !!user && (location.state as { from?: string } | null)?.from === "notifications";
  const q = useAnnouncement(id);
  const recent = useRecentAnnouncements(id);
  const a = q.data ?? null;

  useEffect(() => {
    document.title = `${a?.title ?? t("announcements.title")} · OmenX`;
  }, [a?.title, t]);

  const view = (
    <AnnouncementDetailView
      a={a}
      state={q.isLoading ? "loading" : q.isError ? "error" : "ready"}
      recent={recent.data ?? []}
      fromNotifications={fromNotifications}
      mobile={!!isMobile}
      onRetry={() => void q.refetch()}
    />
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader variant="inner" title={a ? t(ANNOUNCEMENT_KIND[a.kind].labelKey) : t("announcements.title")} showBack showLogo={false} />
        <main className="flex-1">{view}</main>
        <SeoFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 lg:px-6">{view}</main>
      <SeoFooter />
    </div>
  );
}
