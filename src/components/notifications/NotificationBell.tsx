/**
 * NotificationBell — the ONE bell entry (mock v1 §01 / §03 / §05).
 *
 * Desktop (header right cluster, signed-in only): `Equity → 🔔 → avatar`.
 *   Click → Popover 400 × ≤560 (pure information, no confirm button → Popover
 *   not Dialog, DESIGN §5): header "Notifications" + "Mark all read" (hidden at
 *   0 unread), local tabs Trading / Account, day-grouped last 20, "See all" →
 *   /notifications. Opening never marks read; a row click marks that row and
 *   follows its deep link.
 * Mobile (brand bar right slot, next to the 🌐): tap → /notifications page.
 *
 * Badge = unread in both tabs minus `trade.*` (D4b); 1–99, then "99+"; none at 0.
 * Opening tab = first tab with unread, else Trading (D11).
 * Guests render nothing (callers gate on `user`).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MobileHeaderIconButton } from "@/components/MobileHeader";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { badgeText, tabOf, type NotificationRow, type NotificationTab } from "@/lib/notifications";
import {
  useMarkNotificationsRead,
  useNotificationCounts,
  useRecentNotifications,
} from "@/hooks/useNotifications";
import { NotificationList, type NotificationListState } from "./NotificationList";
import { NotificationTabs } from "./NotificationTabs";

export const defaultTab = (byTab: Record<NotificationTab, number>): NotificationTab =>
  byTab.trading > 0 ? "trading" : byTab.account > 0 ? "account" : "trading";

/* ------------------------------ badge ------------------------------ */

export const BellBadge = ({ count, size }: { count: number; size: "desktop" | "mobile" }) => {
  const text = badgeText(count);
  if (!text) return null;
  return (
    <span
      data-testid="bell-badge"
      className={cn(
        "absolute flex items-center justify-center rounded-full bg-primary font-mono font-semibold leading-none text-primary-foreground",
        size === "desktop"
          ? "-right-0.5 -top-0.5 h-4 min-w-[16px] px-1 text-[10px]"
          : "right-[3px] top-[3px] h-[14px] min-w-[14px] px-1 text-[9px]",
      )}
    >
      {text}
    </span>
  );
};

/* ------------------------------ popover body ------------------------------ */

export interface NotificationsPanelProps {
  rows: NotificationRow[];
  byTab: Record<NotificationTab, number>;
  hasAnyUnread: boolean;
  state?: NotificationListState;
  tab: NotificationTab;
  onTab: (t: NotificationTab) => void;
  onOpen: (row: NotificationRow) => void;
  onMarkAll: () => void;
  onSeeAll: () => void;
  onRetry?: () => void;
  /** Style-guide only: freeze "now". */
  now?: Date;
}

/** Pure panel (also mounted in /style-guide with fixtures). */
export const NotificationsPanel = ({
  rows,
  byTab,
  hasAnyUnread,
  state = "ready",
  tab,
  onTab,
  onOpen,
  onMarkAll,
  onSeeAll,
  onRetry,
  now,
}: NotificationsPanelProps) => {
  const { t } = useT();
  const visible = useMemo(() => rows.filter((r) => tabOf(r) === tab), [rows, tab]);
  const showFooter = state === "ready" && visible.length > 0;
  return (
    <div className="w-[400px] max-w-[calc(100vw-24px)]" data-testid="notifications-panel">
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="text-sm font-semibold text-foreground">{t("notifications.title")}</span>
        {hasAnyUnread && state === "ready" && (
          <button type="button" onClick={onMarkAll} className="text-xs font-medium text-primary hover:underline">
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>
      <NotificationTabs value={tab} onChange={onTab} unread={byTab} variant="local" />
      <div className="max-h-[460px] overflow-y-auto">
        <NotificationList rows={visible} tab={tab} state={state} onOpen={onOpen} onRetry={onRetry} dense mascot="mark" now={now} />
      </div>
      {showFooter && (
        <button
          type="button"
          onClick={onSeeAll}
          className="block w-full border-t border-[#1D2026] py-[11px] text-center text-[13px] font-medium text-primary hover:bg-muted/40"
        >
          {t("notifications.seeAll")}
        </button>
      )}
    </div>
  );
};

/* ------------------------------ bell ------------------------------ */

export const NotificationBell = ({
  variant,
  className,
  previewCount,
  previewOpen,
}: {
  variant: "desktop" | "mobile";
  className?: string;
  /** Style-guide only: fixed badge count (no query). */
  previewCount?: number;
  /** Style-guide only: render the popover open (desktop). */
  previewOpen?: boolean;
}) => {
  const { t } = useT();
  const navigate = useNavigate();
  const preview = previewCount !== undefined;
  const counts = useNotificationCounts();
  const badge = preview ? previewCount : counts.badge;
  const [open, setOpen] = useState(!!previewOpen);
  const [tab, setTab] = useState<NotificationTab>("trading");
  const recent = useRecentNotifications(20, !preview && open);
  const { markRead, markAllRead } = useMarkNotificationsRead();

  const onOpenChange = (next: boolean) => {
    if (next) setTab(defaultTab(counts.byTab));
    setOpen(next);
  };

  const openRow = (row: NotificationRow) => {
    if (!row.read_at) void markRead([row.id]);
    setOpen(false);
    if (row.deep_link) navigate(row.deep_link);
  };

  if (variant === "mobile") {
    return (
      <MobileHeaderIconButton aria-label={t("notifications.title")} onClick={() => navigate("/notifications")} className={className}>
        <span className="relative flex h-full w-full items-center justify-center">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <BellBadge count={badge} size="mobile" />
        </span>
      </MobileHeaderIconButton>
    );
  }

  const state: NotificationListState = recent.isError ? "error" : recent.isLoading ? "loading" : "ready";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("notifications.title")}
          data-testid="notification-bell"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
            open && "bg-muted/50 text-foreground",
            className,
          )}
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <BellBadge count={badge} size="desktop" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-auto p-0">
        <NotificationsPanel
          rows={recent.data ?? []}
          byTab={counts.byTab}
          hasAnyUnread={counts.hasAnyUnread}
          state={state}
          tab={tab}
          onTab={setTab}
          onOpen={openRow}
          onMarkAll={() => void markAllRead()}
          onSeeAll={() => {
            setOpen(false);
            navigate("/notifications");
          }}
          onRetry={() => void recent.refetch()}
        />
      </PopoverContent>
    </Popover>
  );
};
