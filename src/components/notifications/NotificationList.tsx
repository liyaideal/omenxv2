/**
 * NotificationList — day-grouped rows + the four async states (mock v1 §03–§05).
 *
 * States (every one a style-guide case):
 *   loading → 5 skeleton rows
 *   error   → ErrorState "Couldn't load notifications" + Retry
 *   empty   → EmptyState with the lynx (mark in the popover, figure on pages)
 *   rows    → TODAY / YESTERDAY / OCT 3 groups
 * `state` / `rows` are display-only fixtures for /style-guide; production
 * passes the query result.
 */
import { EmptyState, ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { groupByDay, type NotificationRow as Row, type NotificationTab } from "@/lib/notifications";
import { NotificationRow } from "./NotificationRow";

export type NotificationListState = "loading" | "error" | "ready";

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

export const NotificationEmpty = ({ tab, mascot }: { tab: NotificationTab; mascot: "mark" | "figure" }) => {
  const { t } = useT();
  return (
    <EmptyState
      variant="section"
      mascot={mascot}
      bordered={false}
      title={t(`notifications.empty.${tab}.title`)}
      description={t(`notifications.empty.${tab}.description`)}
      className={mascot === "mark" ? "py-7" : undefined}
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
  mascot = "mark",
  now,
  footer,
}: {
  rows: Row[];
  tab: NotificationTab;
  state?: NotificationListState;
  onRetry?: () => void;
  onOpen?: (row: Row) => void;
  dense?: boolean;
  mascot?: "mark" | "figure";
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
  if (!rows.length) return <NotificationEmpty tab={tab} mascot={mascot} />;
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
