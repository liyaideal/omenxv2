/**
 * AnnouncementListView / AnnouncementDetailView — the page bodies of
 * /announcements and /announcements/:id without page chrome, so the live
 * pages and the style-guide mount the exact same tree (Truth Rule §16.1.1).
 *
 * Desktop list: title 24/30 + subtitle → bordered list → Load more / end note.
 * Mobile list: subtitle only (the inner header carries the title).
 * Desktop detail: 12-col grid, article spans 8, rail spans 4 (rail hidden
 * when empty; the article never widens). Mobile detail: single column, rail
 * under the CTA.
 */
import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type { Announcement, AnnouncementListRow } from "@/lib/announcements";
import { AnnouncementArticle, MoreAnnouncements } from "./AnnouncementArticle";
import { AnnouncementEmpty, AnnouncementListSkeleton, AnnouncementRow, AnnouncementUnavailable } from "./AnnouncementParts";

export type ViewState = "loading" | "error" | "ready";

export interface AnnouncementListViewProps {
  rows: AnnouncementListRow[];
  state?: ViewState;
  hasMore?: boolean;
  loadingMore?: boolean;
  mobile?: boolean;
  now?: Date;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onOpen?: (row: AnnouncementListRow) => void;
}

export const AnnouncementListView = ({ rows, state = "ready", hasMore, loadingMore, mobile, now, onLoadMore, onRetry, onOpen }: AnnouncementListViewProps) => {
  const { t } = useT();
  const list =
    state === "loading" ? (
      <AnnouncementListSkeleton />
    ) : state === "error" ? (
      <ErrorState title={t("announcements.error.title")} retryLabel={t("announcements.error.retry")} onRetry={onRetry} />
    ) : rows.length === 0 ? (
      <AnnouncementEmpty />
    ) : (
      <>
        {rows.map((r) => (
          <AnnouncementRow key={r.id} row={r} now={now} onOpen={onOpen} />
        ))}
        <div className="mt-[18px] text-center">
          {hasMore ? (
            <Button variant="outline" className={cn("rounded-[10px]", mobile && "h-11 w-full")} disabled={loadingMore} onClick={onLoadMore}>
              {t("announcements.loadMore")}
            </Button>
          ) : (
            rows.length >= 5 && <p className="py-2 text-xs text-muted-foreground/70">{t("announcements.endOfList")}</p>
          )}
        </div>
      </>
    );

  if (mobile) {
    return (
      <div className="px-4 pb-6 pt-3">
        <p className="mb-1 text-sm leading-5 text-muted-foreground">{t("announcements.subtitle")}</p>
        {list}
      </div>
    );
  }
  return (
    <div>
      <h1 className="font-display text-2xl font-bold leading-[30px] tracking-[-0.01em] text-foreground">{t("announcements.title")}</h1>
      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{t("announcements.subtitle")}</p>
      <div className="mt-[18px] border-t border-border">{list}</div>
    </div>
  );
};

const ArticleSkeleton = () => (
  <div aria-hidden className="space-y-3">
    <Skeleton className="h-5 w-40" />
    <Skeleton className="h-7 w-3/4" />
    <Skeleton className="h-4 w-2/3" />
    <div className="space-y-2 pt-4">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-11/12" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  </div>
);

export interface AnnouncementDetailViewProps {
  a: Announcement | null;
  state?: ViewState;
  recent?: AnnouncementListRow[];
  fromNotifications?: boolean;
  mobile?: boolean;
  now?: Date;
  onRetry?: () => void;
  onNavigate?: (to: string) => void;
  onOpen?: (row: AnnouncementListRow) => void;
  onSeeAll?: () => void;
}

export const AnnouncementDetailView = ({ a, state = "ready", recent = [], fromNotifications, mobile, now, onRetry, onNavigate, onOpen, onSeeAll }: AnnouncementDetailViewProps) => {
  const { t } = useT();
  const body =
    state === "loading" ? (
      <ArticleSkeleton />
    ) : state === "error" ? (
      <ErrorState title={t("announcements.error.title")} retryLabel={t("announcements.error.retry")} onRetry={onRetry} />
    ) : !a ? (
      <AnnouncementUnavailable />
    ) : (
      <AnnouncementArticle a={a} fromNotifications={fromNotifications} mobile={mobile} now={now} onNavigate={onNavigate} />
    );
  const rail = a ? <MoreAnnouncements rows={recent} now={now} onOpen={onOpen} onSeeAll={onSeeAll} /> : null;

  if (mobile) {
    return (
      <div className="px-4 py-5">
        {body}
        {rail && <div className="mt-[26px]">{rail}</div>}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">{body}</div>
      {rail && <div className="col-span-12 lg:col-span-4">{rail}</div>}
    </div>
  );
};
