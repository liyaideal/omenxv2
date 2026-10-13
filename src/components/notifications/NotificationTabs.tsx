/**
 * NotificationTabs — the two v1 tabs (Trading / Account), two treatments:
 *   opening → Rewards/Portfolio opening-tab spec (19/26 mobile · 24/30 desktop,
 *             font-display, 2.5px white underline) — the /notifications page.
 *   local   → 13.5px underline tabs for the desktop popover.
 * Tabs never carry an "All" (two-level tab rule: a set that could have All is
 * chips, not tabs). A tab with unread shows a 4px primary dot top-right; the
 * dot follows the same counting rule as the bell (`trade.*` never lights it).
 */
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TABS, type NotificationTab } from "@/lib/notifications";

export const NotificationTabs = ({
  value,
  onChange,
  unread,
  variant,
  sticky,
  className,
}: {
  value: NotificationTab;
  onChange: (v: NotificationTab) => void;
  unread: Record<NotificationTab, number>;
  variant: "opening" | "local";
  sticky?: boolean;
  className?: string;
}) => {
  const { t } = useT();
  const opening = variant === "opening";
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-end border-b border-[#1D2026]",
        opening ? "gap-7 md:gap-9" : "gap-5 px-4",
        sticky && "sticky top-[var(--mobile-header-h)] z-30 -mx-4 bg-background px-4",
        className,
      )}
    >
      {NOTIFICATION_TABS.map((tab) => {
        const active = value === tab.id;
        const dot = unread[tab.id] > 0;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative transition-colors",
              opening
                ? "min-h-[48px] pb-2 font-display text-[19px] leading-[26px] tracking-[-0.01em] md:min-h-[56px] md:pb-3 md:text-[24px] md:leading-[30px]"
                : "pb-[9px] pt-1.5 text-[13.5px] leading-5",
            )}
            style={{ color: active ? "#F2F3F5" : "#6B7280", fontWeight: active ? (opening ? 700 : 600) : 500 }}
          >
            {t(tab.labelKey)}
            {dot && (
              <span
                aria-label={t("notifications.tab.unread")}
                className={cn(
                  "absolute rounded-full bg-primary",
                  opening ? "-right-2.5 top-4 h-[5px] w-[5px] md:top-[18px]" : "-right-[7px] top-[7px] h-1 w-1",
                )}
              />
            )}
            {active && (
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px rounded-full bg-[#F2F3F5]",
                  opening ? "h-[2.5px]" : "h-0.5",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
