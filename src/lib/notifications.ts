/**
 * Notifications (消息中心) — type registry, tab mapping, badge rules, time label.
 *
 * CPO 2026-10-13 (方案 v0 D1–D12 + mock v1 M1–M8):
 *  - 34 types in 6 categories; v1 tabs = Trading (settled + autoclose + trades)
 *    and Account (funds + rewards + account). v2 adds `Updates` (system) — the
 *    DB keeps `category` fine-grained, this file is the only place a tab is
 *    derived, so adding a tab never touches stored rows.
 *  - Bell badge = unread in Trading + Account EXCEPT `trade.*` (D4b): a Buy /
 *    Cash out is the user's own action, it never lights the bell or the tab dot.
 *  - The server stores `type` + `params` only; title / body are i18n keys
 *    `notifications.<type>.title` / `.body` rendered on the client.
 *  - Unknown type → `Bell` icon, muted colour, title = the raw type (never a
 *    semantic colour: the default branch must not render as a result).
 */
import {
  ArrowLeftRight,
  Bell,
  CircleCheck,
  Gift,
  ShieldCheck,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { t, type TVars } from "@/i18n";
import { legTitle, resolveLegSide } from "@/lib/liteSideName";

export type NotificationCategory =
  | "settled"
  | "autoclose"
  | "trades"
  | "funds"
  | "rewards"
  | "account"
  | "system";

export type NotificationTab = "trading" | "account";

export interface NotificationRow {
  id: string;
  user_id: string;
  category: NotificationCategory | string;
  type: string;
  params: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  deep_link: string | null;
  read_at: string | null;
  created_at: string;
}

/** Tab ← category. v2: `system` → "updates". */
export const TAB_OF_CATEGORY: Record<NotificationCategory, NotificationTab> = {
  settled: "trading",
  autoclose: "trading",
  trades: "trading",
  funds: "account",
  rewards: "account",
  account: "account",
  system: "account", // placeholder until the Updates tab ships (v2)
};

export const NOTIFICATION_TABS: { id: NotificationTab; labelKey: string }[] = [
  { id: "trading", labelKey: "notifications.tab.trading" },
  { id: "account", labelKey: "notifications.tab.account" },
];

export const tabOf = (n: Pick<NotificationRow, "category">): NotificationTab =>
  TAB_OF_CATEGORY[n.category as NotificationCategory] ?? "account";

/** D4b — `trade.*` rows show the unread style but count nowhere. */
export const countsAsUnread = (n: Pick<NotificationRow, "type" | "read_at">) =>
  !n.read_at && !n.type.startsWith("trade.");

/** Semantic colour axes (DESIGN §7 money axis, §Addendum 2026-10-13 scope → notification icon). */
export type NotificationTone = "muted" | "volt" | "red" | "yellow" | "primary";

export const TONE_CLASS: Record<NotificationTone, string> = {
  muted: "text-muted-foreground",
  volt: "text-trading-green",
  red: "text-trading-red",
  yellow: "text-trading-yellow",
  primary: "text-primary",
};

interface TypeMeta {
  icon: LucideIcon;
  tone: NotificationTone | ((p: Record<string, unknown>) => NotificationTone);
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;

const pnlTone = (p: Record<string, unknown>): NotificationTone => (num(p.pnl) > 0 ? "volt" : "muted");

/** The 34 v1 types. Keep in sync with docs/copy-dictionary.md「Notifications」. */
export const NOTIFICATION_TYPES: Record<string, TypeMeta> = {
  // Trading · Settled
  "settled.win": { icon: CircleCheck, tone: "volt" },
  "settled.loss": { icon: CircleCheck, tone: "muted" },
  "settled.flat": { icon: CircleCheck, tone: "muted" },
  "settled.round_batch": { icon: CircleCheck, tone: (p) => (num(p.net) > 0 ? "volt" : "muted") },
  // Trading · Auto-close (Boost check)
  "autoclose.tight": { icon: TriangleAlert, tone: "yellow" },
  "autoclose.soon": { icon: TriangleAlert, tone: "red" },
  "autoclose.done": { icon: TriangleAlert, tone: "red" },
  // Trading · Trades
  "trade.bought": { icon: ArrowLeftRight, tone: "muted" },
  "trade.cashed_out": { icon: ArrowLeftRight, tone: pnlTone },
  // Account · Funds
  "funds.deposit_done": { icon: Wallet, tone: "volt" },
  "funds.deposit_failed": { icon: Wallet, tone: "red" },
  "funds.withdraw_submitted": { icon: Wallet, tone: "muted" },
  "funds.withdraw_done": { icon: Wallet, tone: "muted" },
  "funds.withdraw_failed": { icon: Wallet, tone: "red" },
  "funds.recovery_update": { icon: Wallet, tone: (p) => (p.status === "rejected" ? "red" : "muted") },
  "funds.credit": { icon: Wallet, tone: "volt" },
  // Account · Rewards
  "reward.voucher_issued": { icon: Gift, tone: "primary" },
  "reward.voucher_expiring": { icon: Gift, tone: "yellow" },
  "reward.voucher_expired": { icon: Gift, tone: "muted" },
  "reward.voucher_earnings_unlocked": { icon: Gift, tone: "primary" },
  "reward.grant_claimable": { icon: Gift, tone: "primary" },
  "reward.grant_expiring": { icon: Gift, tone: "yellow" },
  "reward.task_claimable": { icon: Gift, tone: "primary" },
  "reward.referral_joined": { icon: Gift, tone: "primary" },
  "reward.airdrop_credited": { icon: Gift, tone: "primary" },
  "reward.airdrop_expiring": { icon: Gift, tone: "yellow" },
  "reward.treasure_opened": { icon: Gift, tone: "primary" },
  // Account · Account & security
  "account.new_session": { icon: ShieldCheck, tone: "red" },
  "account.password_changed": { icon: ShieldCheck, tone: "red" },
  "account.email_changed": { icon: ShieldCheck, tone: "muted" },
  "account.2fa_on": { icon: ShieldCheck, tone: "muted" },
  "account.2fa_off": { icon: ShieldCheck, tone: "red" },
  "account.api_key_created": { icon: ShieldCheck, tone: "muted" },
  "account.api_key_revoked": { icon: ShieldCheck, tone: "muted" },
  "account.wallet_linked": { icon: ShieldCheck, tone: "muted" },
};

export const NOTIFICATION_TYPE_KEYS = Object.keys(NOTIFICATION_TYPES);

const DEFAULT_META: TypeMeta = { icon: Bell, tone: "muted" };

export const notificationMeta = (n: Pick<NotificationRow, "type" | "params">) => {
  const meta = NOTIFICATION_TYPES[n.type] ?? DEFAULT_META;
  const tone = typeof meta.tone === "function" ? meta.tone(n.params ?? {}) : meta.tone;
  return { icon: meta.icon, tone, known: n.type in NOTIFICATION_TYPES };
};

/* ------------------------------ formatting ------------------------------ */

const usd = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Signed money with the typographic minus the mock uses: +$38.20 / −$25.00. */
export const signedUsd = (n: number) => (Math.abs(n) < 0.005 ? "$0.00" : `${n > 0 ? "+" : "−"}${usd(n)}`);

/** Whole dollars drop the cents ($25), otherwise two decimals ($12.50). */
export const faceUsd = (n: number) => (Number.isInteger(n) ? `$${n.toLocaleString("en-US")}` : usd(n));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const clock = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const sameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

/**
 * notifTime() — the row's time column (D12). Sibling of settleLabel():
 *   today      → "14:05"
 *   yesterday  → "Yesterday 14:05"
 *   this year  → "Oct 3"
 *   other year → "Oct 3, 2025"
 * 24h user-local, no timezone suffix.
 */
export const notifTime = (iso: string | Date, now: Date = new Date()): string => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  if (sameDay(d, now)) return clock(d);
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return `${t("notifications.time.yesterday")} ${clock(d)}`;
  if (d.getFullYear() !== now.getFullYear()) return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** Day-group heading: TODAY / YESTERDAY / OCT 3 (uppercase by CSS). */
export const notifDayLabel = (iso: string, now: Date = new Date()): string => {
  const d = new Date(iso);
  if (sameDay(d, now)) return t("notifications.time.today");
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return t("notifications.time.yesterday");
  if (d.getFullYear() !== now.getFullYear()) return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** "Oct 14, 09:00" — deadline wording inside bodies (expires / claim before). */
export const notifDeadline = (iso: unknown): string => {
  if (typeof iso !== "string") return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${clock(d)}`;
};

const sideWord = (p: Record<string, unknown>) => {
  const option = typeof p.option_label === "string" ? p.option_label : "Yes";
  const type = p.side === "short" ? "short" : "long";
  const sideLabels = p.side_labels && typeof p.side_labels === "object" ? (p.side_labels as object) : undefined;
  return legTitle(resolveLegSide({ option, type }, sideLabels ? { side_labels: sideLabels } : null));
};

const boost = (p: Record<string, unknown>) => {
  const lv = num(p.leverage);
  if (lv <= 1) return "";
  const shown = Math.round(lv * 10) / 10;
  return ` · ${Number.isInteger(shown) ? shown : shown.toFixed(1)}× Boost`;
};

const shortAddress = (a: unknown) =>
  typeof a === "string" && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : String(a ?? "");

/**
 * Interpolation vars per type. Every value is already a display string, so
 * the i18n templates stay pure text (translators never see numbers' formats).
 */
export const notificationVars = (n: Pick<NotificationRow, "type" | "params">): TVars => {
  const p = n.params ?? {};
  const base: TVars = {};
  switch (n.type) {
    case "settled.win":
    case "settled.loss":
    case "settled.flat":
    case "autoclose.done":
    case "trade.cashed_out":
      return { event: String(p.event_name ?? ""), side: sideWord(p), pnl: signedUsd(num(p.pnl)), cost: usd(num(p.margin)), boost: boost(p) };
    case "settled.round_batch":
      return { series: String(p.series ?? ""), n: num(p.n), net: signedUsd(num(p.net)) };
    case "autoclose.tight":
    case "autoclose.soon":
      return { ratio: `${num(p.ratio).toFixed(0)}%` };
    case "trade.bought":
      return { event: String(p.event_name ?? ""), side: sideWord(p), cost: usd(num(p.margin)), boost: boost(p) };
    case "funds.deposit_done":
    case "funds.deposit_failed":
    case "funds.withdraw_submitted":
    case "funds.withdraw_done":
    case "funds.withdraw_failed":
      return { amount: usd(num(p.amount)), account: p.account === "spot" ? "Standard Account" : "Boost Account" };
    case "funds.credit":
      return { amount: usd(num(p.amount)), reason: String(p.description ?? "") };
    case "funds.recovery_update":
      return { amount: usd(num(p.amount)), token: String(p.token ?? ""), network: String(p.network ?? ""), status: String(p.status ?? "") };
    case "reward.voucher_issued":
    case "reward.voucher_expiring":
    case "reward.voucher_expired":
      return {
        face: faceUsd(num(p.face_value)),
        source: p.source === "campaign" ? t("notifications.source.campaign") : t("notifications.source.referral"),
        deadline: notifDeadline(p.expires_at),
      };
    case "reward.voucher_earnings_unlocked":
      return { amount: usd(num(p.amount)), tier: String(p.description ?? "") };
    case "reward.grant_claimable":
    case "reward.grant_expiring":
      return {
        amount: faceUsd(num(p.amount)),
        kind: p.reward_kind === "usdc" ? "USDC" : "Voucher",
        campaign: String(p.campaign ?? ""),
        task: String(p.task ?? ""),
        deadline: notifDeadline(p.ends_at),
      };
    case "reward.task_claimable":
      return { task: String(p.task ?? ""), points: num(p.points).toLocaleString("en-US") };
    case "reward.referral_joined":
      return { username: String(p.username ?? "") };
    case "reward.airdrop_credited":
    case "reward.airdrop_expiring":
      return { event: String(p.event_name ?? ""), side: sideWord(p), amount: usd(num(p.amount)), deadline: notifDeadline(p.expires_at) };
    case "reward.treasure_opened":
      return { points: num(p.points).toLocaleString("en-US") };
    case "account.new_session":
      return {
        where: [p.device, p.location].filter((v) => typeof v === "string" && v.trim()).join(" · ") || t("notifications.unknownDevice"),
        time: notifDeadline(p.at),
      };
    case "account.email_changed":
      return { email: String(p.email ?? "") };
    case "account.api_key_created":
    case "account.api_key_revoked":
      return { label: String(p.label ?? ""), prefix: String(p.key_prefix ?? "") };
    case "account.wallet_linked":
      return { address: shortAddress(p.address) };
    default:
      return base;
  }
};

/** Title / body text for a row. Unknown type → raw type as the title, no body. */
export const notificationText = (n: Pick<NotificationRow, "type" | "params">) => {
  if (!(n.type in NOTIFICATION_TYPES)) return { title: n.type, body: "" };
  const vars = notificationVars(n);
  const title = t(`notifications.${n.type}.title`, vars);
  const bodyKey = `notifications.${n.type}.body`;
  const body = t(bodyKey, vars);
  return { title, body: body === bodyKey ? "" : body };
};

/** Sort newest first, group by calendar day. */
export const groupByDay = <T extends { created_at: string }>(rows: T[], now = new Date()) => {
  const groups: { label: string; rows: T[] }[] = [];
  for (const r of rows) {
    const label = notifDayLabel(r.created_at, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(r);
    else groups.push({ label, rows: [r] });
  }
  return groups;
};

export const badgeText = (count: number) => (count <= 0 ? "" : count > 99 ? "99+" : String(count));
