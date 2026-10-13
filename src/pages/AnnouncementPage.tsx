/**
 * /announcements/:id — public reading page (CPO 2026-10-13 A1–A7).
 *
 * Desktop: EventsDesktopHeader → `max-w-7xl px-4 lg:px-6 py-10` → 12-col grid,
 * article spans 8, "More announcements" rail spans 4 (hidden when empty; the
 * article never widens) → SeoFooter. No breadcrumb / back link (DESIGN
 * desktop detail-page rule, PD-6).
 * Mobile: inner header titled by kind (Announcement / Maintenance), px-4 py-5
 * single column, More announcements under the CTA. No BottomNav.
 * Withdrawn / unknown id → AnnouncementUnavailable (A7).
 */
import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAnnouncement, useRecentAnnouncements } from "@/hooks/useAnnouncements";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/i18n";
import { ANNOUNCEMENT_KIND } from "@/lib/announcements";
import { AnnouncementArticle, MoreAnnouncements } from "@/components/announcements/AnnouncementArticle";
import { AnnouncementUnavailable } from "@/components/announcements/AnnouncementParts";

const ArticleSkeleton = () => (
  <div aria-hidden className="space-y-3">
    <Skeleton className="h-5 w-40" />
    <Skeleton className="h-7 w-3/4" />
    <Skeleton className="h-4 w-2/3" />
    <div className="pt-4 space-y-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-11/12" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  </div>
);

export default function AnnouncementPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const location = useLocation();
  const fromNotifications = !!user && (location.state as { from?: string } | null)?.from === "notifications";
  const q = useAnnouncement(id);
  const recent = useRecentAnnouncements(id);
  const a = q.data ?? null;

  useEffect(() => {
    document.title = `${a?.title ?? t("announcements.title")} · OmenX`;
  }, [a?.title, t]);

  const body = q.isLoading ? (
    <ArticleSkeleton />
  ) : q.isError ? (
    <ErrorState title={t("announcements.error.title")} retryLabel={t("announcements.error.retry")} onRetry={() => void q.refetch()} />
  ) : !a ? (
    <AnnouncementUnavailable />
  ) : (
    <AnnouncementArticle a={a} fromNotifications={fromNotifications} mobile={!!isMobile} />
  );

  const rail = <MoreAnnouncements rows={recent.data ?? []} />;

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader variant="inner" title={a ? t(ANNOUNCEMENT_KIND[a.kind].labelKey) : t("announcements.title")} showBack showLogo={false} />
        <main className="flex-1 px-4 py-5">
          {body}
          {a && <div className="mt-[26px]">{rail}</div>}
        </main>
        <SeoFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 lg:px-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">{body}</div>
          {a && <div className="col-span-12 lg:col-span-4">{rail}</div>}
        </div>
      </main>
      <SeoFooter />
    </div>
  );
}
