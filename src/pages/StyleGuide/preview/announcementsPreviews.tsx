/**
 * Announcements previews (CPO 2026-10-13, Notifications v2 mock A1–A9).
 *
 * Truth Rule (§16.1.1): every case mounts the PRODUCTION component with
 * display-only fixtures — the list rows, the article, the rail, the window
 * card, the Markdown renderer and the empty / unavailable states are the real
 * ones. Page chrome (header / footer) is the live page's job; it is not
 * re-drawn here. "now" is frozen at 2026-10-13 14:30 local.
 */
import { MobileHeader } from "@/components/MobileHeader";
import { KindChip, WindowCard } from "@/components/announcements/AnnouncementParts";
import { AnnouncementDetailView, AnnouncementListView } from "@/components/announcements/AnnouncementViews";
import { MarkdownBody } from "@/components/announcements/MarkdownBody";
import type { Announcement, AnnouncementListRow } from "@/lib/announcements";
import { AnnouncementKindLedger } from "../components/AnnouncementKindLedger";

const noop = () => undefined;
export const NOW = new Date(2026, 9, 13, 14, 30);
const at = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m - 1, d, h, min).toISOString();

/* ------------------------------ fixtures ------------------------------ */

export const MAINTENANCE: Announcement = {
  id: "0a000001-0000-4000-8000-000000000001",
  kind: "maintenance",
  title: "Scheduled maintenance · Oct 15",
  summary: "Base deposits & withdrawals paused 02:00–04:00 UTC · trading unaffected",
  body_md:
    "Our custody provider is upgrading its Base infrastructure. During the window, on-chain deposits and withdrawals on Base will be queued and processed once the upgrade completes.\n\n### What this means for you\n\n- Trading, cash out and settlement keep running as normal.\n- Deposits sent during the window are credited after 04:00 UTC — usually within 30 minutes.\n- Withdrawals submitted during the window stay **Pending** until the upgrade completes.\n\nIf you need funds on-chain before the window, submit your withdrawal before `Oct 15, 01:30 UTC`. Track live status on the [Wallet](/wallet) page.",
  cta_label: "Go to Wallet",
  cta_href: "/wallet",
  window_starts_at: "2026-10-15T02:00:00Z",
  window_ends_at: "2026-10-15T04:00:00Z",
  affects: "Base deposits & withdrawals",
  not_affected: "trading, cash out, settlement",
  published_at: at(2026, 10, 13, 15, 2),
};

export const PRODUCT: Announcement = {
  id: "0a000001-0000-4000-8000-000000000002",
  kind: "announcement",
  title: "Crypto rounds now settle in under 2 minutes",
  summary: "Faster settlement for every crypto quick round from Oct 20",
  body_md:
    "From **Oct 20**, every crypto quick round (BTC, ETH, SOL up / down) settles within two minutes of the round closing. Settlement used to wait for the next index print, which could take up to ten minutes on quiet markets.\n\n### What changes\n\n- Settled rounds show up in Portfolio › Settled within 2 minutes.\n- Your result notification arrives at the same time.\n- Nothing changes about the price source — the reference index and the mark are the same.\n\nRead how settlement works in the [Methodology](https://help.omenx.com/guide) page.",
  cta_label: "Trade crypto rounds",
  cta_href: "/spot",
  window_starts_at: null,
  window_ends_at: null,
  affects: null,
  not_affected: null,
  published_at: at(2026, 10, 13, 11, 30),
};

/** A campaign launched straight from an announcement (CPO A6 revised): image + reward table. */
export const CAMPAIGN: Announcement = {
  id: "0a000001-0000-4000-8000-000000000003",
  kind: "announcement",
  title: "Autumn Volume Ladder: trade $500, unlock up to $50",
  summary: "Oct 12 – Oct 31 · every $500 of volume unlocks the next Voucher tier",
  body_md:
    "![Autumn Volume Ladder](/assets/desktop/whats-worth-watching.png)\n\nNo sign-up, no landing page — every trade you place between **Oct 12 and Oct 31** counts. Climb the ladder and claim each tier in Rewards as soon as you reach it.\n\n### Tiers\n\n| Volume | Reward | Claim by |\n|---|---|---|\n| $500 | $5 Voucher | Nov 7 |\n| $2,000 | $15 Voucher | Nov 7 |\n| $5,000 | $30 Voucher | Nov 7 |\n| $10,000 | $50 Voucher | Nov 7 |\n\n### Rules\n\n1. Volume = filled Buy orders on any event, Lite or Pro; cash outs don't count.\n2. Boost positions count at face value, not margin.\n3. Vouchers expire 14 days after claiming.\n\n> Questions? Ask in [Discord](https://discord.gg/omenx).",
  cta_label: "Open Rewards",
  cta_href: "/rewards",
  window_starts_at: null,
  window_ends_at: null,
  affects: null,
  not_affected: null,
  published_at: at(2026, 10, 12, 10, 0),
};

const row = (a: Announcement): AnnouncementListRow => ({ id: a.id, kind: a.kind, title: a.title, summary: a.summary, published_at: a.published_at });

export const LIST: AnnouncementListRow[] = [
  row(MAINTENANCE),
  row(PRODUCT),
  row(CAMPAIGN),
  { id: "a4", kind: "announcement", title: "NFL, MLB and NHL lines are here", summary: "Spreads, totals and moneylines on every major US game, with live scoreboards", published_at: at(2026, 10, 11, 9, 0) },
  { id: "a5", kind: "announcement", title: "Payout tier now tracks your last 30 days", summary: "Voucher tiers roll on a 30-day volume window instead of lifetime volume", published_at: at(2026, 10, 8, 14, 0) },
  { id: "a6", kind: "announcement", title: "OmenX now speaks 7 languages", summary: "简体中文, 繁體中文, 日本語, 한국어, Tiếng Việt and Русский join English", published_at: at(2026, 9, 30, 10, 0) },
];

/* ------------------------------ list ------------------------------ */

const DesktopList = (p: { rows: AnnouncementListRow[]; state?: "loading" | "error" | "ready"; hasMore?: boolean }) => (
  <div className="px-6 py-10">
    <AnnouncementListView rows={p.rows} state={p.state} hasMore={p.hasMore} now={NOW} onOpen={noop} onLoadMore={noop} onRetry={noop} />
  </div>
);

export const ListDesktopPreview = () => <DesktopList rows={LIST} hasMore />;
export const ListDesktopEndPreview = () => <DesktopList rows={LIST} />;
export const ListDesktopEmptyPreview = () => <DesktopList rows={[]} />;
export const ListDesktopLoadingPreview = () => <DesktopList rows={[]} state="loading" />;
export const ListDesktopErrorPreview = () => <DesktopList rows={[]} state="error" />;

const MobileList = (p: { rows: AnnouncementListRow[]; state?: "loading" | "error" | "ready"; hasMore?: boolean }) => (
  <div>
    <MobileHeader variant="inner" title="Announcements" showBack showLogo={false} />
    <AnnouncementListView rows={p.rows} state={p.state} hasMore={p.hasMore} mobile now={NOW} onOpen={noop} onLoadMore={noop} onRetry={noop} />
  </div>
);

export const ListMobilePreview = () => <MobileList rows={LIST} hasMore />;
export const ListMobileEmptyPreview = () => <MobileList rows={[]} />;

/* ------------------------------ detail ------------------------------ */

const recentFor = (a: Announcement | null) => LIST.filter((r) => r.id !== a?.id).slice(0, 3);

const DesktopDetail = (p: { a: Announcement | null; fromNotifications?: boolean; state?: "loading" | "error" | "ready" }) => (
  <div className="px-6 py-10">
    <AnnouncementDetailView a={p.a} state={p.state} recent={recentFor(p.a)} fromNotifications={p.fromNotifications} now={NOW} onNavigate={noop} onOpen={noop} onSeeAll={noop} onRetry={noop} />
  </div>
);

export const DetailDesktopMaintenancePreview = () => <DesktopDetail a={MAINTENANCE} fromNotifications />;
export const DetailDesktopAnnouncementPreview = () => <DesktopDetail a={PRODUCT} />;
export const DetailDesktopCampaignPreview = () => <DesktopDetail a={CAMPAIGN} />;
export const DetailDesktopUnavailablePreview = () => <DesktopDetail a={null} />;
export const DetailDesktopLoadingPreview = () => <DesktopDetail a={null} state="loading" />;

const MobileDetail = (p: { a: Announcement | null; fromNotifications?: boolean; title: string }) => (
  <div>
    <MobileHeader variant="inner" title={p.title} showBack showLogo={false} />
    <AnnouncementDetailView a={p.a} recent={recentFor(p.a)} fromNotifications={p.fromNotifications} mobile now={NOW} onNavigate={noop} onOpen={noop} onSeeAll={noop} />
  </div>
);

export const DetailMobileMaintenancePreview = () => <MobileDetail a={MAINTENANCE} title="Maintenance" fromNotifications />;
export const DetailMobileCampaignPreview = () => <MobileDetail a={CAMPAIGN} title="Announcement" />;
export const DetailMobileUnavailablePreview = () => <MobileDetail a={null} title="Announcements" />;

/* ------------------------------ parts ------------------------------ */

export const KindChipsPreview = () => (
  <div className="flex flex-wrap items-center gap-4 p-6">
    <KindChip kind="announcement" />
    <KindChip kind="maintenance" />
  </div>
);

/** AN-14 — kind → icon → chip → notification type, read from ANNOUNCEMENT_KIND (zero hand-copy). */
export const KindLedgerPreview = () => <AnnouncementKindLedger />;

export const WindowCardPreview = () => (
  <div className="space-y-3 p-6">
    <WindowCard a={MAINTENANCE} />
    <WindowCard a={{ ...MAINTENANCE, window_starts_at: "2026-10-15T22:00:00Z", window_ends_at: "2026-10-16T02:00:00Z", not_affected: null }} />
    <WindowCard a={{ ...MAINTENANCE, window_ends_at: null, affects: null, not_affected: null }} />
  </div>
);

const KITCHEN_SINK = `## Heading two

Paragraph with **bold**, *italic*, \`inline code\`, an [internal link](/wallet) and an [external link](https://omenx.com).

### Heading three

- Unordered one
- Unordered two with **bold**

1. Ordered one
2. Ordered two

> A quote line, muted with a left rule.

| Tier | Volume | Reward |
|---|---:|---|
| 1 | $500 | $5 Voucher |
| 2 | $2,000 | $15 Voucher |

---

![Banner](/assets/desktop/whats-worth-watching.png)

Trailing paragraph. <script>alert(1)</script> renders as text.`;

export const MarkdownKitchenSinkPreview = () => (
  <div className="p-6">
    <MarkdownBody source={KITCHEN_SINK} />
  </div>
);
