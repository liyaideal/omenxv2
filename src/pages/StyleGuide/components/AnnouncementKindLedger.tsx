/**
 * AnnouncementKindLedger — style-guide AN-14.
 *
 * Same gap NT-23 closed for notifications (CPO 2026-10-15): AN-11 renders the
 * two chips but never labels the kind key, icon name or tone. This table reads
 * ANNOUNCEMENT_KIND directly and shows every surface the kind drives — list-row
 * icon, detail-page chip, and the `system.*` notification it broadcasts as.
 *
 * Dictionary artifact, not a product surface: lives in StyleGuide/components
 * (outside the sg:audit preview gate) on purpose.
 */
import { KindChip } from "@/components/announcements/AnnouncementParts";
import { ANNOUNCEMENT_KIND, type AnnouncementKind } from "@/lib/announcements";
import { NOTIFICATION_TYPES, TONE_CLASS } from "@/lib/notifications";

const KINDS = Object.keys(ANNOUNCEMENT_KIND) as AnnouncementKind[];
const MEANING: Record<AnnouncementKind, string> = {
  announcement: "信息类（新功能 / 活动 / 公告即活动）",
  maintenance: "要注意时间（维护窗口 · 影响范围）",
};
const iconName = (icon: unknown) => ((icon as { displayName?: string }).displayName ?? "?").replace(/Icon$/, "");
const TH = "pb-1 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const TD = "py-2 pr-3 align-top";

export const AnnouncementKindLedger = () => (
  <div className="px-4 py-3 text-[13px]">
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-[16%]" />
        <col className="w-[22%]" />
        <col className="w-[18%]" />
        <col className="w-[22%]" />
        <col className="w-[22%]" />
      </colgroup>
      <thead>
        <tr>
          <th className={TH}>kind</th>
          <th className={TH}>列表行 icon（lucide）</th>
          <th className={TH}>详情页 chip</th>
          <th className={TH}>广播成的通知 type</th>
          <th className={TH}>语义</th>
        </tr>
      </thead>
      <tbody>
        {KINDS.map((kind) => {
          const meta = ANNOUNCEMENT_KIND[kind];
          const Icon = meta.icon;
          const notifType = `system.${kind}`;
          const notif = NOTIFICATION_TYPES[notifType];
          const NotifIcon = notif?.icon;
          const notifTone = notif && typeof notif.tone !== "function" ? notif.tone : null;
          return (
            <tr key={kind} className="border-t border-border/60">
              <td className={`${TD} font-mono text-[12px] text-foreground`}>{kind}</td>
              <td className={TD}>
                <span className="inline-flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${meta.tone}`} strokeWidth={1.5} />
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {iconName(Icon)} · {meta.tone.replace("text-", "")}
                  </span>
                </span>
              </td>
              <td className={TD}>
                <KindChip kind={kind} />
              </td>
              <td className={TD}>
                <span className="inline-flex items-center gap-2">
                  {NotifIcon && <NotifIcon className={`h-5 w-5 ${notifTone ? TONE_CLASS[notifTone] : "text-muted-foreground"}`} strokeWidth={1.5} />}
                  <span className="font-mono text-[12px] text-foreground">{notifType}</span>
                </span>
              </td>
              <td className={`${TD} text-[12px] text-muted-foreground`}>{MEANING[kind]}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <p className="mt-3 text-[12px] text-muted-foreground">
      只有这两种 kind；两边 icon 同一枚 lucide 组件、同一色轴（Announcement = primary，Maintenance = trading-yellow，不碰 green / red）。chip 只在详情页，列表行只用 icon。新增 kind 改 <code className="font-mono">ANNOUNCEMENT_KIND</code> + <code className="font-mono">NOTIFICATION_TYPES</code> 各一处，本表自动跟上。
    </p>
  </div>
);
