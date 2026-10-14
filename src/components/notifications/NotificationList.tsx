/**
 * NotificationList — day-grouped rows + the four async states (mock v1 §03–§05).
 *
 * States (every one a style-guide case):
 *   loading → 5 skeleton rows
 *   error   → ErrorState "Couldn't load notifications" + Retry
 *   empty   → EmptyState with the painted lynx (celebrate / no-boost)
 *   rows    → TODAY / YESTERDAY / OCT 3 groups
 * `state` / `rows` are display-only fixtures for /style-guide; production
 * passes the query result.
 */
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { groupByDay, type NotificationRow as Row, type NotificationTab } from "@/lib/notifications";
import { NotificationRow } from "./NotificationRow";

export type NotificationListState = "loading" | "error" | "ready";

/** Desktop page footer while there is a next page (CPO 2026-10-14 N2): explicit, no auto-load. */
export const NotificationLoadMore = ({ loading, onClick }: { loading?: boolean; onClick?: () => void }) => {
  const { t } = useT();
  return (
    <div className="pb-2 pt-4 text-center">
      <Button variant="outline" className="rounded-[10px]" disabled={loading} onClick={onClick}>
        {loading ? t("notifications.loadingMore") : t("notifications.loadMore")}
      </Button>
    </div>
  );
};

/** End-of-list note: Trading spells out the 7-day keep for Buy / Cash out (N1). */
export const NotificationEndNote = ({ tab }: { tab: NotificationTab }) => {
  const { t } = useT();
  return (
    <div className="py-3 text-center font-mono text-[11px] text-muted-foreground">
      {t(tab === "trading" ? "notifications.endOfList.trading" : "notifications.endOfList")}
    </div>
  );
};

export const NotificationSkeleton = ({ rows = 5, dense = true }: { rows?: number; dense?: boolean }) => (
  <div aria-busy="true" className="py-1">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={cn("flex items-center gap-3", dense ? "px-4 py-3 pl-[30px]" : "px-6 py-3 pl-[42px]")}>
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-[62%]" />
          <Skeleton className="h-2.5 w-[40%]" />
        </div>
        <Skeleton className="h-2.5 w-[34px]" />
      </div>
    ))}
  </div>
);

/**
 * Designed lynx illustrations (CPO 2026-10-13: the line-art mascot is retired
 * for empty states — always the painted lynx from the brand ledger):
 *   Trading → empty-celebrate ("all clear"), Account → empty-no-boost (generic nothing),
 *   Updates → empty-no-starred-event (the lynx waiting for news).
 * Same file for desktop / mobile (the ledger keeps both paths; pick by viewport
 * like every other Lite surface).
 */
export const NOTIFICATION_EMPTY_ART: Record<NotificationTab, string> = {
  trading: "empty-celebrate.png",
  account: "empty-no-boost.png",
  updates: "empty-no-starred-event.png",
};

export const NotificationEmpty = ({ tab, compact }: { tab: NotificationTab; compact?: boolean }) => {
  const { t } = useT();
  const isMobile = useIsMobile();
  return (
    <EmptyState
      variant="section"
      illustrationSrc={`/assets/${isMobile ? "mobile" : "desktop"}/${NOTIFICATION_EMPTY_ART[tab]}`}
      bordered={false}
      title={t(`notifications.empty.${tab}.title`)}
      description={t(`notifications.empty.${tab}.description`)}
      className={compact ? "py-7" : undefined}
    />
  );
};

export const NotificationList = ({
  rows,
  tab,
  state = "ready",
  onRetry,
  onOpen,
  dense = true,
  compactEmpty = false,
  now,
  footer,
}: {
  rows: Row[];
  tab: NotificationTab;
  state?: NotificationListState;
  onRetry?: () => void;
  onOpen?: (row: Row) => void;
  dense?: boolean;
  /** Popover: tighter vertical padding around the empty illustration. */
  compactEmpty?: boolean;
  now?: Date;
  /** Infinite-scroll sentinel / "Loading more…" slot on the page. */
  footer?: React.ReactNode;
}) => {
  const { t } = useT();
  if (state === "loading") return <NotificationSkeleton dense={dense} />;
  if (state === "error")
    return (
      <div className="px-4 py-6">
        <ErrorState
          title={t("notifications.error.title")}
          description={t("notifications.error.description")}
          retryLabel={t("notifications.error.retry")}
          onRetry={onRetry ?? (() => undefined)}
        />
      </div>
    );
  if (!rows.length) return <NotificationEmpty tab={tab} compact={compactEmpty} />;
  const groups = groupByDay(rows, now);
  return (
    <div>
      {groups.map((g) => (
        <div key={g.label}>
          <div
            className={cn(
              "pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
              dense ? "px-4" : "px-6 pt-4",
            )}
          >
            {g.label}
          </div>
          {g.rows.map((r) => (
            <NotificationRow key={r.id} row={r} onOpen={onOpen} dense={dense} now={now} />
          ))}
        </div>
      ))}
      {footer}
    </div>
  );
};
