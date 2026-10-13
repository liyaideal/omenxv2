/**
 * /announcements — public list (guests included). CPO 2026-10-13 A1 / A2:
 * entry = SeoFooter Resources + the detail page's "See all"; no header / Me-menu
 * entry (signed-in users come through the bell's Updates tab).
 *
 * Desktop: EventsDesktopHeader → `max-w-7xl px-4 lg:px-6 py-10` → title 24/30 +
 * subtitle → rows → Load more → SeoFooter. Mobile: inner header "Announcements"
 * → px-4 → same rows (compact dates) → full-width Load more → SeoFooter. No
 * BottomNav (content page, like /glossary).
 */
import { useEffect } from "react";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAnnouncementPages } from "@/hooks/useAnnouncements";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/i18n";
import { AnnouncementEmpty, AnnouncementListSkeleton, AnnouncementRow } from "@/components/announcements/AnnouncementParts";

export default function AnnouncementsPage() {
  const { t } = useT();
  const isMobile = useIsMobile();
  const q = useAnnouncementPages();
  const rows = q.data?.pages.flat() ?? [];

  useEffect(() => {
    document.title = `${t("announcements.title")} · OmenX`;
  }, [t]);

  const list = q.isLoading ? (
    <AnnouncementListSkeleton />
  ) : q.isError ? (
    <ErrorState title={t("announcements.error.title")} retryLabel={t("announcements.error.retry")} onRetry={() => void q.refetch()} />
  ) : rows.length === 0 ? (
    <AnnouncementEmpty />
  ) : (
    <>
      {rows.map((r) => (
        <AnnouncementRow key={r.id} row={r} />
      ))}
      <div className="mt-[18px] text-center">
        {q.hasNextPage ? (
          <Button variant="outline" className={isMobile ? "h-11 w-full rounded-[10px]" : "rounded-[10px]"} disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
            {t("announcements.loadMore")}
          </Button>
        ) : (
          rows.length >= 5 && <p className="py-2 text-xs text-muted-foreground/70">{t("announcements.endOfList")}</p>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader variant="inner" title={t("announcements.title")} showBack showLogo={false} />
        <main className="flex-1 px-4 pb-6 pt-3">
          <p className="mb-1 text-sm leading-5 text-muted-foreground">{t("announcements.subtitle")}</p>
          {list}
        </main>
        <SeoFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 lg:px-6">
        <h1 className="font-display text-2xl font-bold leading-[30px] tracking-[-0.01em] text-foreground">{t("announcements.title")}</h1>
        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{t("announcements.subtitle")}</p>
        <div className="mt-[18px] border-t border-border">{list}</div>
      </main>
      <SeoFooter />
    </div>
  );
}
