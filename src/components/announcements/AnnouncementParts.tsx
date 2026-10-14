/**
 * Announcement building blocks (DESIGN §Addendum 2026-10-13 · Announcements):
 *   KindChip        22px pill, 11/600 uppercase, kind icon 12 — primary / yellow
 *   AnnouncementRow list row (`size="lg"`: 15/22 title + 2-line summary) and
 *                   rail row (`size="sm"`: 14/20 title + 1-line summary)
 *   WindowCard      maintenance window (yellow, same recipe as the Wallet
 *                   MaintenanceNoticeBanner): UTC range (+ viewer's clock),
 *                   affects / not affected
 *   AnnouncementListSkeleton / AnnouncementEmpty / AnnouncementUnavailable
 */
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  ANNOUNCEMENT_KIND,
  annListDate,
  annWindowLocal,
  annWindowUtc,
  viewerIsUtc,
  type Announcement,
  type AnnouncementKind,
  type AnnouncementListRow,
} from "@/lib/announcements";

export const KindChip = ({ kind, className }: { kind: AnnouncementKind; className?: string }) => {
  const { t } = useT();
  const meta = ANNOUNCEMENT_KIND[kind];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold uppercase tracking-[0.04em]",
        meta.chip,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {t(meta.labelKey)}
    </span>
  );
};

export const KindIcon = ({ kind, className }: { kind: AnnouncementKind; className?: string }) => {
  const meta = ANNOUNCEMENT_KIND[kind];
  const Icon = meta.icon;
  return <Icon className={cn("h-5 w-5 shrink-0", meta.tone, className)} strokeWidth={1.5} aria-hidden />;
};

export const AnnouncementRow = ({
  row,
  size = "lg",
  now,
  onOpen,
}: {
  row: AnnouncementListRow;
  size?: "lg" | "sm";
  now?: Date;
  onOpen?: (row: AnnouncementListRow) => void;
}) => {
  const isMobile = useIsMobile();
  const lg = size === "lg";
  return (
    <Link
      to={`/announcements/${row.id}`}
      onClick={onOpen ? (e) => { e.preventDefault(); onOpen(row); } : undefined}
      data-announcement-kind={row.kind}
      className={cn(
        "flex items-start gap-3 border-b border-border/60 transition-colors hover:bg-muted/50",
        lg ? "-mx-2 px-2 py-3.5" : "py-3",
      )}
    >
      <KindIcon kind={row.kind} className="mt-px" />
      <span className="min-w-0 flex-1">
        {/* Mobile wraps the title (≤2 lines) — a 375 column can't afford to eat it; desktop keeps the one-liner. */}
        <span className={cn("block font-medium text-foreground", isMobile ? "line-clamp-2" : "truncate", lg ? "text-[15px] leading-[22px]" : "text-sm leading-5")}>{row.title}</span>
        <span className={cn("mt-px block text-[13px] leading-[18px] text-muted-foreground", lg ? "line-clamp-2" : "truncate")}>{row.summary}</span>
      </span>
      <span className="shrink-0 font-mono text-[11px] leading-5 text-muted-foreground">{annListDate(row.published_at, !lg || !!isMobile, now)}</span>
    </Link>
  );
};

export const WindowCard = ({ a, className }: { a: Pick<Announcement, "window_starts_at" | "window_ends_at" | "affects" | "not_affected">; className?: string }) => {
  const { t } = useT();
  if (!a.window_starts_at) return null;
  const utc = annWindowUtc(a.window_starts_at, a.window_ends_at);
  const local = viewerIsUtc() ? "" : annWindowLocal(a.window_starts_at, a.window_ends_at);
  const second = [a.affects && t("announcements.window.affects", { list: a.affects }), a.not_affected && t("announcements.window.notAffected", { list: a.not_affected })]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[10px] border border-trading-yellow/30 bg-trading-yellow/10 px-3.5 py-3", className)}>
      <TriangleAlert className="mt-px h-5 w-5 shrink-0 text-trading-yellow" strokeWidth={1.5} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-5 text-foreground">
          {t("announcements.window.label")} · <span className="font-mono">{utc}</span>
          {local && (
            <>
              {" "}
              <span className="text-muted-foreground">({t("announcements.window.yourTime", { range: local })})</span>
            </>
          )}
        </p>
        {second && <p className="mt-0.5 text-xs leading-[18px] text-muted-foreground">{second}</p>}
      </div>
    </div>
  );
};

export const AnnouncementListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div aria-hidden>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 border-b border-border/60 py-3.5">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-3 w-14" />
      </div>
    ))}
  </div>
);

const art = (file: string, mobile: boolean | undefined) => `/assets/${mobile ? "mobile" : "desktop"}/${file}`;

export const AnnouncementEmpty = () => {
  const { t } = useT();
  const isMobile = useIsMobile();
  return (
    <EmptyState
      variant="section"
      bordered={false}
      illustrationSrc={art("empty-no-starred-event.png", isMobile)}
      title={t("announcements.empty.title")}
      description={t("announcements.empty.description")}
    />
  );
};

/** Withdrawn or unknown id (A7) — same page, lynx error art, one way out. */
export const AnnouncementUnavailable = () => {
  const { t } = useT();
  const isMobile = useIsMobile();
  return (
    <EmptyState
      variant="section"
      bordered={false}
      illustrationSrc={art("empty-error.png", isMobile)}
      title={t("announcements.unavailable.title")}
      description={t("announcements.unavailable.description")}
      actionLabel={t("announcements.unavailable.action")}
      href="/announcements"
    />
  );
};
