/**
 * AnnouncementArticle — the reading column of /announcements/:id, shared by
 * the page and the style-guide preview (fixed data in, no fetching).
 *
 * Desktop (CPO A3): no breadcrumb / back link (DESIGN desktop detail-page rule,
 * PD-6) — chip + published stamp → title 24/30 → lead 15/24 → window card
 * (maintenance) → prose → CTA row. Mobile: 19/26 title, 14/22 lead, stacked
 * full-width buttons. "More announcements" rail is rendered by the page
 * (right column on desktop, under the CTA on mobile).
 */
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { annPublished, type Announcement, type AnnouncementListRow } from "@/lib/announcements";
import { MarkdownBody } from "./MarkdownBody";
import { AnnouncementRow, KindChip, WindowCard } from "./AnnouncementParts";

export interface AnnouncementArticleProps {
  a: Announcement;
  /** Signed in and arrived from a notification row → show "Back to Notifications". */
  fromNotifications?: boolean;
  mobile?: boolean;
  now?: Date;
  /** Style-guide: intercept navigation. */
  onNavigate?: (to: string) => void;
}

export const AnnouncementArticle = ({ a, fromNotifications, mobile, now, onNavigate }: AnnouncementArticleProps) => {
  const { t } = useT();
  const navigate = useNavigate();
  const go = (to: string) => (onNavigate ? onNavigate(to) : navigate(to));
  const hasCta = !!(a.cta_label && a.cta_href);
  const external = !!a.cta_href && /^https?:\/\//i.test(a.cta_href);
  return (
    <article data-announcement-kind={a.kind}>
      <div className="flex items-center gap-2.5">
        <KindChip kind={a.kind} />
        <span className="font-mono text-xs text-muted-foreground">{annPublished(a.published_at)}</span>
      </div>
      <h1 className={cn("mt-3 font-display font-bold tracking-[-0.01em] text-foreground", mobile ? "text-[19px] leading-[26px]" : "text-2xl leading-[30px]")}>
        {a.title}
      </h1>
      <p className={cn("mt-2 text-muted-foreground", mobile ? "text-sm leading-[22px]" : "text-[15px] leading-6")}>{a.summary}</p>
      {a.kind === "maintenance" && <WindowCard a={a} className={mobile ? "mt-4" : "mt-5"} />}
      <MarkdownBody source={a.body_md} className={cn("border-t border-border", mobile ? "mt-[18px] pt-[18px]" : "mt-[22px] pt-[22px]")} />
      {(hasCta || fromNotifications) && (
        <div className={cn("flex gap-2.5 border-t border-border", mobile ? "mt-6 flex-col pt-5" : "mt-[26px] pt-[22px]")}>
          {hasCta &&
            (external ? (
              <Button asChild className={cn("btn-primary gap-2", mobile && "h-11 w-full")}>
                <a href={a.cta_href!} target="_blank" rel="noopener noreferrer">
                  {a.cta_label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button className={cn("btn-primary gap-2", mobile && "h-11 w-full")} onClick={() => go(a.cta_href!)}>
                {a.cta_label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          {fromNotifications && (
            <Button variant="outline" className={cn("rounded-[10px]", mobile && "h-11 w-full")} onClick={() => go("/notifications")}>
              {t("announcements.backToNotifications")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

/** "More announcements" — 3 recent rows + See all. Hidden when there is nothing else. */
export const MoreAnnouncements = ({
  rows,
  now,
  className,
  onOpen,
  onSeeAll,
}: {
  rows: AnnouncementListRow[];
  now?: Date;
  className?: string;
  onOpen?: (row: AnnouncementListRow) => void;
  onSeeAll?: () => void;
}) => {
  const { t } = useT();
  const navigate = useNavigate();
  if (!rows.length) return null;
  return (
    <aside className={className} aria-label={t("announcements.more")}>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("announcements.more")}</p>
      {rows.map((r) => (
        <AnnouncementRow key={r.id} row={r} size="sm" now={now} onOpen={onOpen} />
      ))}
      <button
        type="button"
        onClick={() => (onSeeAll ? onSeeAll() : navigate("/announcements"))}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
      >
        {t("announcements.seeAll")}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
};
