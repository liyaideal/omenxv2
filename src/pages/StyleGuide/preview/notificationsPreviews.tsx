/**
 * Notifications previews (CPO 2026-10-13, mock v1 M1–M8).
 *
 * Truth Rule (§16.1.1): every case mounts the PRODUCTION component with
 * display-only fixtures. The only hand-written elements are spacing / height
 * wrappers (the desktop popover needs a measurable box for Radix's portal).
 * "now" is frozen at 2026-10-13 14:30 local so day labels stay stable.
 */
import { CheckCheck } from "lucide-react";
import { NotificationBell, NotificationsPanel, UnreadCountPill } from "@/components/notifications/NotificationBell";
import { NotificationEndNote, NotificationList, NotificationLoadMore } from "@/components/notifications/NotificationList";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { NotificationTabs } from "@/components/notifications/NotificationTabs";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { MobileDrawerListItem } from "@/components/ui/mobile-drawer";
import { LanguageIconButton } from "@/components/language/LanguagePicker";
import { Bell } from "lucide-react";
import { tabOf, type NotificationRow as Row, type NotificationTab } from "@/lib/notifications";

const noop = () => undefined;
export const NOW = new Date(2026, 9, 13, 14, 30);
const USER = "968a2b3a-3913-4acb-948b-c78cc828a125";

const ago = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

const mk = (
  type: string,
  params: Record<string, unknown>,
  hoursAgo: number,
  read: boolean,
  deep_link: string | null = null,
): Row => ({
  id: `${type}:${hoursAgo}`,
  user_id: USER,
  category:
    type.startsWith("settled") ? "settled"
    : type.startsWith("autoclose") ? "autoclose"
    : type.startsWith("trade") ? "trades"
    : type.startsWith("funds") ? "funds"
    : type.startsWith("reward") ? "rewards"
    : type.startsWith("system") ? "system"
    : "account",
  type,
  params,
  entity_type: null,
  entity_id: null,
  deep_link,
  read_at: read ? ago(hoursAgo - 0.5) : null,
  created_at: ago(hoursAgo),
});

const UPDOWN = { yes: "Up", no: "Down" };
const BTC = "Will Bitcoin close above $44,000 on Oct 13?";

/* ------------------------------ fixtures ------------------------------ */

/** Trading feed used by the popover / page frames (mock P1 / §04 / M3). */
export const TRADING_FEED: Row[] = [
  mk("settled.win", { event_name: BTC, option_label: "Yes", side: "long", pnl: 38.2, margin: 25, leverage: 1 }, 0.4, false, "/portfolio/settlement/x"),
  mk("autoclose.tight", { ratio: 83.4 }, 2.8, false, "/portfolio"),
  mk("trade.bought", { event_name: BTC, option_label: "Yes", side: "long", margin: 25, leverage: 2 }, 5.2, true, "/trade"),
  mk("settled.round_batch", { series: "ETH 5m rounds", n: 4, net: 12.4 }, 17.5, true, "/portfolio/settlements"),
  mk("trade.cashed_out", { event_name: "Will the Fed cut rates in October?", option_label: "Yes", side: "long", pnl: 4.1, margin: 50, leverage: 1 }, 22.1, true, "/portfolio/settlement/y"),
  mk("autoclose.done", { event_name: "Will Tesla close above $300 on Oct 13?", option_label: "No", side: "long", pnl: -60, margin: 20, leverage: 3 }, 70, true, "/portfolio/settlement/z"),
  mk("settled.loss", { event_name: "Will the Fed cut rates in October?", option_label: "No", side: "long", pnl: -25, margin: 25, leverage: 1 }, 72, true, "/portfolio/settlement/w"),
];

/** Account feed (mock P2 / M4). */
export const ACCOUNT_FEED: Row[] = [
  mk("reward.grant_claimable", { campaign: "Volume Ladder · October", task: "Buy $300 across CPI markets", amount: 40, reward_kind: "usdc" }, 2, false, "/rewards/campaign/a"),
  mk("funds.deposit_done", { amount: 500, account: "spot" }, 4.5, false, "/wallet"),
  mk("reward.voucher_expiring", { face_value: 25, expires_at: "2026-10-14T01:00:00Z" }, 29.5, true, "/vouchers"),
  mk("account.new_session", { device: "Chrome · macOS", location: "Singapore", at: "2026-10-13T01:12:00Z" }, 30, true, "/settings"),
  mk("reward.referral_joined", { username: "maria_lopez" }, 96, true, "/affiliate"),
  mk("funds.withdraw_done", { amount: 200, account: "spot" }, 97, true, "/wallet"),
];

const allRead = (rows: Row[]) => rows.map((r) => ({ ...r, read_at: r.read_at ?? ago(0.1) }));

/** All 35 types, unread, longest copy variants (mock §06). */
export const ALL_TYPES: Row[] = [
  // Trading
  mk("settled.win", { event_name: BTC, option_label: "Up", side: "long", side_labels: UPDOWN, pnl: 38.2, margin: 25, leverage: 1 }, 0.4, false),
  mk("settled.loss", { event_name: "Will the Fed cut rates in October?", option_label: "No", side: "long", pnl: -25, margin: 25, leverage: 1 }, 17, false),
  mk("settled.flat", { event_name: "Manchester City vs Arsenal — Winner", option_label: "Yes", side: "long", pnl: 0, margin: 50, leverage: 1 }, 0.5, false),
  mk("settled.round_batch", { series: "Bitcoin — up or down?", n: 4, net: 12.4 }, 17.2, false),
  mk("autoclose.tight", { ratio: 83.4 }, 0.6, false),
  mk("autoclose.soon", { ratio: 96.1 }, 17.4, false),
  mk("autoclose.done", { event_name: "Will Tesla close above $300 on Oct 13?", option_label: "No", side: "long", pnl: -60, margin: 20, leverage: 3 }, 0.7, false),
  mk("trade.bought", { event_name: BTC, option_label: "Yes", side: "long", margin: 25, leverage: 2 }, 17.6, false),
  mk("trade.cashed_out", { event_name: "Will the Fed cut rates in October?", option_label: "Yes", side: "long", pnl: 4.1, margin: 50, leverage: 1 }, 0.8, false),
  // Account
  mk("funds.deposit_done", { amount: 500, account: "spot" }, 250, false),
  mk("funds.deposit_failed", { amount: 500, account: "spot" }, 29, false),
  mk("funds.withdraw_submitted", { amount: 200, account: "spot" }, 0.9, false),
  mk("funds.withdraw_done", { amount: 200, account: "spot" }, 251, false),
  mk("funds.withdraw_failed", { amount: 200, account: "spot" }, 29.2, false),
  mk("funds.recovery_update", { status: "completed", amount: 1200, token: "USDT", network: "Polygon" }, 1, false),
  mk("funds.credit", { amount: 15, description: "Trading competition · October week 2" }, 252, false),
  mk("reward.voucher_issued", { face_value: 25, source: "referral", expires_at: "2026-10-20T01:00:00Z" }, 29.4, false),
  mk("reward.voucher_expiring", { face_value: 25, expires_at: "2026-10-14T01:00:00Z" }, 1.1, false),
  mk("reward.voucher_expired", { face_value: 25, source: "referral" }, 253, false),
  mk("reward.voucher_earnings_unlocked", { amount: 10, description: "Tier 2" }, 29.6, false),
  mk("reward.grant_claimable", { campaign: "Volume Ladder · October", task: "Buy $300 across CPI markets", amount: 40, reward_kind: "usdc" }, 1.2, false),
  mk("reward.grant_expiring", { campaign: "Volume Ladder · October", task: "Buy $300 across CPI markets", amount: 40, reward_kind: "usdc", ends_at: "2026-10-14T01:00:00Z" }, 254, false),
  mk("reward.task_claimable", { task: "Trade 3 days in a row", points: 150 }, 29.8, false),
  mk("reward.referral_joined", { username: "maria_lopez" }, 1.3, false),
  mk("reward.airdrop_credited", { event_name: BTC, option_label: "Yes", side: "long", amount: 10, expires_at: "2026-10-20T01:00:00Z" }, 255, false),
  mk("reward.airdrop_expiring", { event_name: BTC, option_label: "Yes", side: "long", expires_at: "2026-10-14T01:00:00Z" }, 30.1, false),
  mk("reward.treasure_opened", { points: 120, tier: "silver" }, 1.4, false),
  mk("account.new_session", { device: "Chrome · macOS", location: "Singapore", at: "2026-10-13T01:12:00Z" }, 256, false),
  mk("account.password_changed", {}, 30.3, false),
  mk("account.email_changed", { email: "alex.carter@example.com" }, 1.5, false),
  mk("account.2fa_on", {}, 257, false),
  mk("account.2fa_off", {}, 30.5, false),
  mk("account.api_key_created", { label: "Market-maker bot", key_prefix: "omx_live_7f3a" }, 1.6, false),
  mk("account.api_key_revoked", { label: "Market-maker bot", key_prefix: "omx_live_7f3a" }, 258, false),
  mk("account.wallet_linked", { address: "0x3b4e780d12e1b0f4a9c8d7e6f5a4b3c2d1e0c6b3", platform: "polymarket" }, 30.7, false),
];

/** Updates feed (v2, CPO V1–V5 / A1–A9): the five `system.*` types as alex sees them. */
export const UPDATES_FEED: Row[] = [
  mk("system.watchlist_live", { event_name: "Los Angeles Dodgers vs New York Yankees", event_id: "demo-live-mlb" }, 0.75, false, "/trade?event=demo-live-mlb"),
  mk("system.maintenance", { kind: "maintenance", title: "Scheduled maintenance · Oct 15", summary: "Base deposits & withdrawals paused 02:00–04:00 UTC · trading unaffected" }, 1.5, false, "/announcements/0a000001-0000-4000-8000-000000000001"),
  mk("system.announcement", { kind: "announcement", title: "Crypto rounds now settle in under 2 minutes", summary: "Faster settlement for every crypto quick round from Oct 20" }, 3, false, "/announcements/0a000001-0000-4000-8000-000000000002"),
  mk("system.campaign_ending", { campaign: "CPI Print Week", ends_at: new Date(2026, 9, 13, 23, 59).toISOString() }, 15, true, "/rewards/campaign/x"),
  mk("system.announcement", { kind: "announcement", title: "Autumn Volume Ladder: trade $500, unlock up to $50", summary: "Oct 12 – Oct 31 · every $500 of volume unlocks the next Voucher tier" }, 28.5, true, "/announcements/0a000001-0000-4000-8000-000000000003"),
  mk("system.campaign_live", { campaign: "World Cup Qualifiers", task: "Buy $500 across World Cup markets", ends_at: new Date(2026, 9, 31, 23, 59).toISOString() }, 12 * 24 + 4.5, true, "/rewards/campaign/y"),
];

const UNREAD_BOTH: Record<NotificationTab, number> = { trading: 2, account: 2, updates: 0 };
const UNREAD_NONE: Record<NotificationTab, number> = { trading: 0, account: 0, updates: 0 };
const UNREAD_ALL3: Record<NotificationTab, number> = { trading: 2, account: 2, updates: 3 };
const FEED3: Row[] = [...TRADING_FEED, ...ACCOUNT_FEED, ...UPDATES_FEED];

/* ------------------------------ bell / badges ------------------------------ */

const BellRow = ({ count, label }: { count: number; label: string }) => (
  <div className="flex items-center gap-3">
    <NotificationBell variant="desktop" preview={{ count }} />
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

export const BellStatesPreview = () => (
  <div className="flex flex-wrap items-center gap-8 p-6">
    <BellRow count={0} label="0 unread · no badge" />
    <BellRow count={7} label="1–99" />
    <BellRow count={120} label="≥100 → 99+" />
    <div className="flex items-center gap-3">
      <NotificationBell variant="mobile" preview={{ count: 12 }} />
      <span className="text-xs text-muted-foreground">mobile 14px / 9px</span>
    </div>
  </div>
);

/* ------------------------------ popover ------------------------------ */

const PopoverBox = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex justify-end px-6 pt-4" style={{ height: 640 }}>
    {children}
  </div>
);

export const PopoverTradingPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 4, open: true, rows: [...TRADING_FEED, ...ACCOUNT_FEED], tab: "trading", byTab: UNREAD_BOTH, now: NOW }} />
  </PopoverBox>
);
export const PopoverAccountPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 4, open: true, rows: [...TRADING_FEED, ...ACCOUNT_FEED], tab: "account", byTab: UNREAD_BOTH, now: NOW }} />
  </PopoverBox>
);
export const PopoverAllReadPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 0, open: true, rows: allRead([...TRADING_FEED, ...ACCOUNT_FEED]), tab: "trading", byTab: UNREAD_NONE, now: NOW }} />
  </PopoverBox>
);
export const PopoverEmptyTabPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 2, open: true, rows: TRADING_FEED, tab: "account", byTab: { trading: 2, account: 0, updates: 0 }, now: NOW }} />
  </PopoverBox>
);
/** Trading tab empty = the "all clear" lynx (empty-celebrate). */
export const PopoverEmptyTradingPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 2, open: true, rows: ACCOUNT_FEED, tab: "trading", byTab: { trading: 0, account: 2, updates: 0 }, now: NOW }} />
  </PopoverBox>
);
/** v2 Updates tab (NT-20): 3 unread today, campaign rows read. */
export const PopoverUpdatesPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 7, open: true, rows: FEED3, tab: "updates", byTab: UNREAD_ALL3, now: NOW }} />
  </PopoverBox>
);
/** Updates tab empty = the waiting lynx (empty-no-starred-event). */
export const PopoverUpdatesEmptyPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 4, open: true, rows: [...TRADING_FEED, ...ACCOUNT_FEED], tab: "updates", byTab: UNREAD_BOTH, now: NOW }} />
  </PopoverBox>
);
export const PopoverLoadingPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 0, open: true, rows: [], state: "loading", byTab: UNREAD_NONE, now: NOW }} />
  </PopoverBox>
);
export const PopoverErrorPreview = () => (
  <PopoverBox>
    <NotificationBell variant="desktop" preview={{ count: 0, open: true, rows: [], state: "error", byTab: UNREAD_NONE, now: NOW }} />
  </PopoverBox>
);

/** The bare panel (no portal) — the 400-wide body as a component for width / overflow checks. */
export const PanelBarePreview = () => (
  <div className="p-6">
    <NotificationsPanel
      rows={[...TRADING_FEED, ...ACCOUNT_FEED]}
      byTab={UNREAD_BOTH}
      hasAnyUnread
      tab="trading"
      onTab={noop}
      onOpen={noop}
      onMarkAll={noop}
      onSeeAll={noop}
      now={NOW}
    />
  </div>
);

/* ------------------------------ desktop page ------------------------------ */

/** Desktop page body (CPO 2026-10-14 ①: content-page title row, no DSH / back; N2: Load more). */
const DesktopPage = ({ tab, rows, state, unread = UNREAD_BOTH, more }: { tab: NotificationTab; rows: Row[]; state?: "loading" | "error" | "ready"; unread?: Record<NotificationTab, number>; more?: boolean }) => {
  const visible = rows.filter((r) => tabOf(r) === tab);
  const hasUnread = visible.some((r) => !r.read_at);
  const footer = more ? <NotificationLoadMore onClick={noop} /> : <NotificationEndNote tab={tab} />;
  return (
    <div className="px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-bold leading-[30px] tracking-[-0.01em] text-foreground">Notifications</h1>
        {hasUnread && (
          <button type="button" className="pb-1 text-[13px] font-medium text-primary">
            Mark all read
          </button>
        )}
      </div>
      <div className="mt-[18px]">
        <NotificationTabs value={tab} onChange={noop} unread={unread} variant="opening" />
      </div>
      <div className="-mx-2">
        <NotificationList rows={visible} tab={tab} state={state} onOpen={noop} dense={false} now={NOW} footer={visible.length ? footer : undefined} />
      </div>
    </div>
  );
};

export const PageDesktopTradingPreview = () => <DesktopPage tab="trading" rows={[...TRADING_FEED, ...ACCOUNT_FEED]} more />;
export const PageDesktopTradingEndPreview = () => <DesktopPage tab="trading" rows={[...TRADING_FEED, ...ACCOUNT_FEED]} />;
export const PageDesktopAccountPreview = () => <DesktopPage tab="account" rows={[...TRADING_FEED, ...ACCOUNT_FEED]} />;
export const PageDesktopEmptyPreview = () => <DesktopPage tab="account" rows={[]} />;
export const PageDesktopUpdatesPreview = () => <DesktopPage tab="updates" rows={FEED3} unread={UNREAD_ALL3} />;

/* ------------------------------ mobile ------------------------------ */

export const MobileBrandBarPreview = () => (
  <div className="pb-3">
    <MobileHeader
      variant="brand"
      showBack={false}
      rightContent={
        <div className="-mr-2 flex items-center gap-1">
          <NotificationBell variant="mobile" preview={{ count: 4 }} />
          <LanguageIconButton />
        </div>
      }
    />
  </div>
);

export const MobileMenuRowPreview = () => (
  <div className="px-4 py-3">
    <MobileDrawerListItem
      icon={Bell}
      label="Notifications"
      right={<UnreadCountPill count={4} />}
      onClick={noop}
    />
  </div>
);

const MobilePage = ({ tab, rows, state, markAll = true, unread }: { tab: NotificationTab; rows: Row[]; state?: "loading" | "error" | "ready"; markAll?: boolean; unread?: Record<NotificationTab, number> }) => {
  const visible = rows.filter((r) => tabOf(r) === tab);
  return (
    <div className="pb-6">
      <MobileHeader
        variant="inner"
        title="Notifications"
        showBack
        showLogo={false}
        flushBottom
        rightContent={
          markAll ? (
            <div className="-mr-2 flex items-center gap-1">
              <MobileHeaderIconButton aria-label="Mark all read" onClick={noop}>
                <CheckCheck className="h-5 w-5" strokeWidth={1.5} />
              </MobileHeaderIconButton>
            </div>
          ) : undefined
        }
      />
      <div className="px-4">
        <NotificationTabs value={tab} onChange={noop} unread={unread ?? (markAll ? UNREAD_BOTH : UNREAD_NONE)} variant="opening" />
      </div>
      <NotificationList rows={visible} tab={tab} state={state} onOpen={noop} dense mobile now={NOW} />
    </div>
  );
};

export const PageMobileTradingPreview = () => <MobilePage tab="trading" rows={[...TRADING_FEED, ...ACCOUNT_FEED]} />;
export const PageMobileAccountPreview = () => <MobilePage tab="account" rows={[...TRADING_FEED, ...ACCOUNT_FEED]} />;
export const PageMobileEmptyPreview = () => <MobilePage tab="account" rows={[]} markAll={false} />;
export const PageMobileUpdatesPreview = () => <MobilePage tab="updates" rows={FEED3} unread={UNREAD_ALL3} />;
export const PageMobileEmptyTradingPreview = () => <MobilePage tab="trading" rows={[]} markAll={false} />;
export const PageMobileLoadingPreview = () => <MobilePage tab="trading" rows={[]} state="loading" markAll={false} />;
export const PageMobileErrorPreview = () => <MobilePage tab="trading" rows={[]} state="error" markAll={false} />;

/* ------------------------------ rows ------------------------------ */

export const RowStatesPreview = () => (
  <div className="py-2">
    <NotificationRow row={TRADING_FEED[0]} onOpen={noop} now={NOW} />
    <NotificationRow row={{ ...TRADING_FEED[0], read_at: ago(0.1) }} onOpen={noop} now={NOW} />
  </div>
);

export const AllTypesTradingPreview = () => (
  <div className="py-2">
    {ALL_TYPES.filter((r) => tabOf(r) === "trading").map((r) => (
      <NotificationRow key={r.id} row={r} onOpen={noop} now={NOW} />
    ))}
  </div>
);
export const AllTypesAccountPreview = () => (
  <div className="py-2">
    {ALL_TYPES.filter((r) => tabOf(r) === "account").map((r) => (
      <NotificationRow key={r.id} row={r} onOpen={noop} now={NOW} />
    ))}
  </div>
);

export const AllTypesUpdatesPreview = () => (
  <div className="py-2">
    {UPDATES_FEED.map((r) => (
      <NotificationRow key={r.id} row={{ ...r, read_at: null }} onOpen={noop} now={NOW} />
    ))}
  </div>
);

/** Unknown type → default branch: Bell, muted, raw type as title, no body. */
export const RowUnknownTypePreview = () => (
  <div className="py-2">
    <NotificationRow row={mk("ops.unknown_type", { title: "x" }, 1, false)} onOpen={noop} now={NOW} />
  </div>
);
