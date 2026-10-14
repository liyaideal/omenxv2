/**
 * NotificationRow — one row of the Notifications list (mock v1 §06, 1:1).
 *
 *   [6px dot][lucide 20][title 14/500 · body 13 muted ≤2 lines][time mono 11]
 *
 * Title: one line with ellipsis where there is width (desktop page, popover);
 * on the mobile page it wraps to ≤2 lines instead — a 375 column can't afford
 * to eat the event name (designer pass, CPO 2026-10-14). `wrapTitle` is set by
 * the mobile page; the popover keeps the one-liner (See all is its overflow).
 *
 * Unread: dot + title `text-foreground` + icon in its semantic tone.
 * Read: dot hidden, title + icon muted (#9AA1AC / #5C636D).
 * Whole row is the click target → marks read + follows `deep_link`
 * (rows without a deep link only mark read).
 */
import { cn } from "@/lib/utils";
import { notificationMeta, notificationText, notifTime, TONE_CLASS, type NotificationRow as Row } from "@/lib/notifications";

export const NotificationRow = ({
  row,
  onOpen,
  dense = true,
  wrapTitle = false,
  now,
}: {
  row: Row;
  onOpen?: (row: Row) => void;
  /** Popover / mobile = px-4 py-2.5; desktop page = px-6 py-3. */
  dense?: boolean;
  /** Mobile page: title wraps to ≤2 lines instead of truncating. */
  wrapTitle?: boolean;
  /** Style-guide only: freeze "now" so day labels are stable. */
  now?: Date;
}) => {
  const read = !!row.read_at;
  const { icon: Icon, tone } = notificationMeta(row);
  const { title, body } = notificationText(row);
  return (
    <button
      type="button"
      onClick={() => onOpen?.(row)}
      data-notification-type={row.type}
      data-read={read ? "1" : "0"}
      className={cn(
        "flex w-full items-start gap-3 text-left transition-colors hover:bg-muted/50",
        dense ? "px-4 py-2.5 pl-3" : "px-6 py-3 pl-5",
      )}
    >
      <span className={cn("mt-[7px] h-1.5 w-1.5 flex-none rounded-full", read ? "bg-transparent" : "bg-primary")} />
      <Icon className={cn("h-5 w-5 flex-none", read ? "text-[#5C636D]" : TONE_CLASS[tone])} strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-medium leading-5", wrapTitle ? "line-clamp-2" : "truncate", read ? "text-muted-foreground" : "text-foreground")}>
          {title}
        </span>
        {body && (
          <span className="mt-px line-clamp-2 block text-[13px] leading-[18px] text-muted-foreground">{body}</span>
        )}
      </span>
      <span className="flex-none whitespace-nowrap font-mono text-[11px] leading-5 text-muted-foreground tabular-nums">
        {notifTime(row.created_at, now)}
      </span>
    </button>
  );
};
