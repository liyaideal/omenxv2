/**
 * /notifications — the full Notifications page (mock v1 §04 desktop / §05 mobile).
 *
 * Desktop: EventsDesktopHeader → DSH v1 sub-page header ("Notifications" +
 *   right slot "Mark all read") → opening tabs 24/30 → day-grouped list,
 *   infinite scroll 30 / page (server keeps 90 days).
 * Mobile: MobileHeader inner ("Notifications", right slot CheckCheck = Mark all
 *   read, hidden at 0 unread) → opening tabs 19/26 sticky under the header →
 *   list → BottomNav. No popover on mobile.
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
import { DesktopSubpageHeader } from "@/components/layout/DesktopSubpageHeader";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { tabOf, type NotificationRow, type NotificationTab } from "@/lib/notifications";
import { useMarkNotificationsRead, useNotificationCounts, useNotificationPages } from "@/hooks/useNotifications";
import { NotificationList, type NotificationListState } from "@/components/notifications/NotificationList";
import { NotificationTabs } from "@/components/notifications/NotificationTabs";
import { defaultTab } from "@/components/notifications/NotificationBell";

export const NOTIFICATIONS_GATE_COPY = {
  title: "notifications.gate.title",
  description: "notifications.gate.description",
};

const isTab = (v: string | null): v is NotificationTab => v === "trading" || v === "account";

export default function NotificationsPage() {
  const { t } = useT();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const counts = useNotificationCounts();
  const pages = useNotificationPages();
  const { markRead, markAllRead } = useMarkNotificationsRead();

  // Tab: ?tab= wins; otherwise the first tab with unread, else Trading (D11).
  const [tab, setTabState] = useState<NotificationTab>(() => (isTab(params.get("tab")) ? (params.get("tab") as NotificationTab) : "trading"));
  const settled = useRef(isTab(params.get("tab")));
  useEffect(() => {
    if (settled.current || counts.isLoading) return;
    settled.current = true;
    setTabState(defaultTab(counts.byTab));
  }, [counts.isLoading, counts.byTab]);
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

  // Infinite scroll: fetch the next page when the sentinel enters the viewport.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !pages.hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !pages.isFetchingNextPage) void pages.fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [pages.hasNextPage, pages.isFetchingNextPage, pages]);

  const openRow = (row: NotificationRow) => {
    if (!row.read_at) void markRead([row.id]);
    if (row.deep_link) navigate(row.deep_link);
  };

  const footer = (
    <div ref={sentinel} className="py-3 text-center font-mono text-[11px] text-muted-foreground">
      {pages.isFetchingNextPage ? t("notifications.loadingMore") : pages.hasNextPage ? "" : t("notifications.endOfList")}
    </div>
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
          <div className="px-4">
            <NotificationTabs value={tab} onChange={setTab} unread={counts.byTab} variant="opening" sticky />
          </div>
          <div className="pb-safe">{list}</div>
        </LiteAuthGate>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
        <DesktopSubpageHeader title={t("notifications.title")} onBack={() => navigate(-1)}>
          {counts.hasAnyUnread && (
            <button type="button" onClick={() => void markAllRead()} className="text-[13px] font-medium text-primary hover:underline">
              {t("notifications.markAllRead")}
            </button>
          )}
        </DesktopSubpageHeader>
        <LiteAuthGate title={t(NOTIFICATIONS_GATE_COPY.title)} description={t(NOTIFICATIONS_GATE_COPY.description)}>
          <div className="mt-[22px]">
            <NotificationTabs value={tab} onChange={setTab} unread={counts.byTab} variant="opening" />
          </div>
          <div className="-mx-2">{list}</div>
        </LiteAuthGate>
      </div>
      <SeoFooter />
    </div>
  );
}
