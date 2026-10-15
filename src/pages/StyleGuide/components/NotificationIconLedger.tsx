/**
 * NotificationIconLedger — style-guide NT-23.
 *
 * "Which type gets which icon and colour" used to live only in
 * src/lib/notifications.ts (NOTIFICATION_TYPES) and one sentence of DESIGN
 * item 7; NT-18 / 19 / 22 render the rows but never label the type key, so
 * engineers were guessing from the picture (CPO 2026-10-15). This table reads
 * the production map directly — add a type there and this follows.
 *
 * Dictionary artifact, not a product surface: it lives in StyleGuide/components
 * (outside the sg:audit preview gate) on purpose.
 */
import { cn } from "@/lib/utils";
import {
  DEFAULT_META,
  NOTIFICATION_TYPES,
  TAB_OF_CATEGORY,
  TONE_CLASS,
  type NotificationCategory,
  type NotificationTab,
  type NotificationTone,
} from "@/lib/notifications";

/** DESIGN §Addendum 2026-10-13 item 7 — what each tone means. The swatch is the real TONE_CLASS. */
const TONE_MEANING: Record<NotificationTone, string> = {
  volt: "盈 / 入账（trading-green）",
  muted: "亏 / 出账 / 中性",
  red: "失败 / auto-close done / 安全类（trading-red）",
  yellow: "tight / 要注意时间（trading-yellow）",
  primary: "Rewards / 信息类 Updates（primary）",
};
const TONE_ORDER: NotificationTone[] = ["volt", "muted", "red", "yellow", "primary"];
const CATEGORY_OF_PREFIX: Record<string, NotificationCategory> = {
  settled: "settled",
  autoclose: "autoclose",
  trade: "trades",
  funds: "funds",
  reward: "rewards",
  account: "account",
  system: "system",
};
const TAB_LABEL: Record<NotificationTab, string> = { trading: "Trading", account: "Account", updates: "Updates" };
const iconName = (icon: unknown) => ((icon as { displayName?: string }).displayName ?? "?").replace(/Icon$/, "");

const LedgerRow = ({ type, meta }: { type: string; meta: (typeof NOTIFICATION_TYPES)[string] }) => {
  const Icon = meta.icon;
  const fixed = typeof meta.tone === "function" ? null : meta.tone;
  return (
    <tr className="border-t border-border/60">
      <td className="py-1.5 pr-3 font-mono text-[12px] text-foreground">{type}</td>
      <td className="py-1.5 pr-3">
        <span className="inline-flex items-center gap-2">
          <Icon className={cn("h-5 w-5", fixed ? TONE_CLASS[fixed] : "text-muted-foreground")} strokeWidth={1.5} />
          <span className="font-mono text-[12px] text-muted-foreground">{iconName(Icon)}</span>
        </span>
      </td>
      <td className="py-1.5 pr-3 font-mono text-[12px]">
        {fixed ? (
          <span className={TONE_CLASS[fixed]}>{fixed}</span>
        ) : (
          <span className="text-foreground">{meta.toneRule ?? "conditional"}</span>
        )}
      </td>
    </tr>
  );
};

/** NT-23 — type → lucide icon → tone, rendered straight from NOTIFICATION_TYPES (zero hand-copy). */
export const NotificationIconLedger = () => {
  const byTab: Record<NotificationTab, string[]> = { trading: [], account: [], updates: [] };
  for (const type of Object.keys(NOTIFICATION_TYPES)) {
    const cat = CATEGORY_OF_PREFIX[type.split(".")[0]];
    byTab[cat ? TAB_OF_CATEGORY[cat] : "account"].push(type);
  }
  const Unknown = DEFAULT_META.icon;
  return (
    <div className="space-y-5 px-4 py-3 text-[13px]">
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {TONE_ORDER.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-block h-3 w-3 rounded-full bg-current", TONE_CLASS[t])} />
            <span className="font-mono text-[12px]">{t}</span>
            <span className="text-[12px] text-muted-foreground">{TONE_MEANING[t]}</span>
          </span>
        ))}
      </div>
      {(Object.keys(byTab) as NotificationTab[]).map((tab) => (
        <table key={tab} className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="pb-1 pr-3 font-semibold">
                {TAB_LABEL[tab]} · {byTab[tab].length}
              </th>
              <th className="pb-1 pr-3 font-semibold">icon（lucide）</th>
              <th className="pb-1 pr-3 font-semibold">tone</th>
            </tr>
          </thead>
          <tbody>
            {byTab[tab].map((type) => (
              <LedgerRow key={type} type={type} meta={NOTIFICATION_TYPES[type]} />
            ))}
          </tbody>
        </table>
      ))}
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <th className="pb-1 pr-3 font-semibold">default（type ∉ 表）</th>
            <th className="pb-1 pr-3 font-semibold">icon（lucide）</th>
            <th className="pb-1 pr-3 font-semibold">tone</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border/60">
            <td className="py-1.5 pr-3 font-mono text-[12px] text-foreground">*</td>
            <td className="py-1.5 pr-3">
              <span className="inline-flex items-center gap-2">
                <Unknown className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                <span className="font-mono text-[12px] text-muted-foreground">{iconName(Unknown)}</span>
              </span>
            </td>
            <td className="py-1.5 pr-3 font-mono text-[12px] text-muted-foreground">muted · 禁止落入任何语义色</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
