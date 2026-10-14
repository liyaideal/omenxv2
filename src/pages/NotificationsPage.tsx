/**
 * /notifications — the full Notifications page (mock v1 §04 desktop / §05 mobile).
 *
 * Desktop: EventsDesktopHeader → content-page title row ("Notifications"
 *   24/30 + "Mark all read" at the right; no DSH / back control — the parent is
 *   the top-bar bell, CPO 2026-10-14 ①) → opening tabs 24/30 → day-grouped list,
 *   explicit "Load more" 30 / click (CPO 2026-10-14 N2). Server keeps 90 days,
 *   trade.* confirmations 7 days (N1) — the Trading tab's end note says so.
 * Mobile: MobileHeader inner ("Notifications", right slot CheckCheck = Mark all
 *   read, hidden at 0 unread) → opening tabs 19/26 sticky under the header →
 *   list (auto-loads on scroll) → BottomNav. No popover on mobile.
 * Guests: LiteAuthGate (same gate as Portfolio / Wallet / Settings).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/i18n";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { tabOf, type NotificationRow, type NotificationTab } from "@/lib/notifications";
import { useMarkNotificationsRead, useNotificationCounts, useNotificationPages } from "@/hooks/useNotifications";
import { NotificationEndNote, NotificationList, NotificationLoadMore, type NotificationListState } from "@/components/notifications/NotificationList";
import { NotificationTabs } from "@/components/notifications/NotificationTabs";
import { defaultTab } from "@/components/notifications/NotificationBell";

export const NOTIFICATIONS_GATE_COPY = {
  title: "notifications.gate.title",
  description: "notifications.gate.description",
};

const isTab = (v: string | null): v is NotificationTab => v === "trading" || v === "account" || v === "updates";

export default function NotificationsPage() {
  const { t } = useT();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const counts = useNotificationCounts();
  const { markRead, markAllRead } = useMarkNotificationsRead();

  // Tab: ?tab= wins; otherwise the first tab with unread, else Trading (D11).
  const [tab, setTabState] = useState<NotificationTab>(() => (isTab(params.get("tab")) ? (params.get("tab") as NotificationTab) : "trading"));
  const settled = useRef(isTab(params.get("tab")));
  useEffect(() => {
    if (settled.current || counts.isLoading) return;
    settled.current = true;
    setTabState(defaultTab(counts.byTab));
  }, [counts.isLoading, counts.byTab]);
  const pages = useNotificationPages(tab);
  const setTab = (v: NotificationTab) => {
    settled.current = true;
    setTabState(v);
    setParams((p) => {
      p.set("tab", v);
      return p;
    }, { replace: true });
  };

  const rows = useMemo(() => (pages.data?.pages ?? []).flat(), [pages.data]);
  const visible = useMemo(() => rows.filter((r) => tabOf(r) === tab), [rows, tab]);
  const state: NotificationListState = pages.isError ? "error" : pages.isLoading ? "loading" : "ready";

  // Mobile: fetch the next page when the sentinel enters the viewport.
  // Desktop: explicit "Load more" (N2) — no sentinel.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !pages.hasNextPage || !isMobile) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !pages.isFetchingNextPage) void pages.fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [pages.hasNextPage, pages.isFetchingNextPage, pages, isMobile]);

  const openRow = (row: NotificationRow) => {
    if (!row.read_at) void markRead([row.id]);
    if (row.deep_link) navigate(row.deep_link, { state: { from: "notifications" } });
  };

  const footer = isMobile ? (
    <div ref={sentinel} className="py-3 text-center font-mono text-[11px] text-muted-foreground">
      {pages.isFetchingNextPage ? t("notifications.loadingMore") : pages.hasNextPage ? "" : t(tab === "trading" ? "notifications.endOfList.trading" : "notifications.endOfList")}
    </div>
  ) : pages.hasNextPage ? (
    <NotificationLoadMore loading={pages.isFetchingNextPage} onClick={() => void pages.fetchNextPage()} />
  ) : (
    <NotificationEndNote tab={tab} />
  );

  const list = (
    <NotificationList
      rows={visible}
      tab={tab}
      state={state}
      onOpen={openRow}
      onRetry={() => void pages.refetch()}
      dense={isMobile}
      footer={visible.length ? footer : undefined}
    />
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader
          variant="inner"
          title={t("notifications.title")}
          showBack
          showLogo={false}
          flushBottom
          rightContent={
            counts.hasAnyUnread ? (
              <div className="-mr-2 flex items-center gap-1">
                <MobileHeaderIconButton aria-label={t("notifications.markAllRead")} onClick={() => void markAllRead()}>
                  <CheckCheck className="h-5 w-5" strokeWidth={1.5} />
                </MobileHeaderIconButton>
              </div>
            ) : undefined
          }
        />
        <LiteAuthGate title={t(NOTIFICATIONS_GATE_COPY.title)} description={t(NOTIFICATIONS_GATE_COPY.description)}>
          {/* Tabs + list share one padded container so the sticky tab bar has the
              whole list as its containing block (a tabs-only wrapper would unstick
              it after 49px). The list bleeds back out with -mx-4; rows carry px-4. */}
          <div className="px-4">
            <NotificationTabs value={tab} onChange={setTab} unread={counts.byTab} variant="opening" sticky />
            <div className="-mx-4 pb-safe">{list}</div>
          </div>
        </LiteAuthGate>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 lg:px-6">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-2xl font-bold leading-[30px] tracking-[-0.01em] text-foreground">{t("notifications.title")}</h1>
          {counts.hasAnyUnread && (
            <button type="button" onClick={() => void markAllRead()} className="pb-1 text-[13px] font-medium text-primary hover:underline">
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>
        <LiteAuthGate title={t(NOTIFICATIONS_GATE_COPY.title)} description={t(NOTIFICATIONS_GATE_COPY.description)}>
          <div className="mt-[18px]">
            <NotificationTabs value={tab} onChange={setTab} unread={counts.byTab} variant="opening" />
          </div>
          <div className="-mx-2">{list}</div>
        </LiteAuthGate>
      </main>
      <SeoFooter />
    </div>
  );
}
