/**
 * /announcements — public list (guests included). CPO 2026-10-13 A1 / A2:
 * entry = SeoFooter Resources + the detail page's "See all"; no header / Me-menu
 * entry (signed-in users come through the bell's Updates tab).
 *
 * Desktop: EventsDesktopHeader → `max-w-7xl px-4 lg:px-6 py-10` → list view →
 * SeoFooter. Mobile: inner header "Announcements" → list view → SeoFooter.
 * No BottomNav (content page, like /glossary). Body = AnnouncementListView
 * (shared with the style-guide).
 */
import { useEffect } from "react";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { AnnouncementListView } from "@/components/announcements/AnnouncementViews";
import { useAnnouncementPages } from "@/hooks/useAnnouncements";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/i18n";

export default function AnnouncementsPage() {
  const { t } = useT();
  const isMobile = useIsMobile();
  const q = useAnnouncementPages();
  const rows = q.data?.pages.flat() ?? [];

  useEffect(() => {
    document.title = `${t("announcements.title")} · OmenX`;
  }, [t]);

  const view = (
    <AnnouncementListView
      rows={rows}
      state={q.isLoading ? "loading" : q.isError ? "error" : "ready"}
      hasMore={q.hasNextPage}
      loadingMore={q.isFetchingNextPage}
      mobile={!!isMobile}
      onLoadMore={() => void q.fetchNextPage()}
      onRetry={() => void q.refetch()}
    />
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader variant="inner" title={t("announcements.title")} showBack showLogo={false} />
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
