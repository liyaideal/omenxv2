// Mobile Header System v1 (DESIGN.md §10) — every case mounts the REAL
// production MobileHeader at 375px. No re-drawn copies.
import { useState } from "react";
import { Share2, Star, Bell, ChevronDown } from "lucide-react";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { Logo } from "@/components/Logo";

const Body = ({ children, tall }: { children?: React.ReactNode; tall?: boolean }) => (
  <div className={tall ? "h-[220px] px-4 py-3" : "px-4 py-3"}>
    <div className="text-[11px] text-muted-foreground">{children}</div>
  </div>
);

/** A · brand bar, top of page (divider transparent). */
export const HeaderBrandTopPreview = () => (
  <div className="bg-background">
    <MobileHeader variant="brand" showBack={false} />
    <Body>Lite roots: /, /events, /portfolio, /wallet — logo lg, no back, no title.</Body>
  </div>
);

/** A · brand bar after 8px of scroll (divider solid). */
export const HeaderBrandScrolledPreview = () => (
  <div className="bg-background">
    <div className="border-b border-border">
      <MobileHeader variant="brand" showBack={false} />
    </div>
    <Body>Scrolled &gt; 8px — the divider fades in.</Body>
  </div>
);

/** A · brand bar + one compact control (Portfolio tab switcher shape). */
export const HeaderBrandControlPreview = () => (
  <div className="bg-background">
    <MobileHeader
      variant="brand"
      showBack={false}
      rightContent={
        <button className="flex h-9 w-auto items-center gap-1 rounded-lg bg-secondary px-3 pr-2.5 text-[13px] font-medium">
          Positions (3)
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      }
    />
    <Body>Right slot: ONE compact h-9 bg-secondary control (never a text pill).</Body>
  </div>
);

/** B · title only. */
export const HeaderInnerTitlePreview = () => (
  <div className="bg-background">
    <MobileHeader title="Settings" showBack showLogo={false} />
    <Body>Sentence-case single-line title, back 36×36 left, 36px spacer right.</Body>
  </div>
);

/** B · one icon in the right slot. */
export const HeaderInnerOneIconPreview = () => (
  <div className="bg-background">
    <MobileHeader
      title="Leaderboard"
      showBack
      showLogo={false}
      rightContent={
        <div className="-mr-2 flex items-center gap-1">
          <MobileHeaderIconButton aria-label="Share">
            <Share2 className="h-5 w-5" strokeWidth={1.5} />
          </MobileHeaderIconButton>
        </div>
      }
    />
    <Body>MobileHeaderIconButton — w-5 h-5, strokeWidth 1.5, muted.</Body>
  </div>
);

/** B · two icons (the slot maximum), one in an active semantic colour. */
export const HeaderInnerTwoIconsPreview = () => (
  <div className="bg-background">
    <MobileHeader
      title="Settlement detail"
      showBack
      showLogo={false}
      rightContent={
        <div className="-mr-2 flex items-center gap-1">
          <MobileHeaderIconButton aria-label="Watchlist" className="text-trading-yellow">
            <Star className="h-5 w-5 fill-trading-yellow" strokeWidth={1.5} />
          </MobileHeaderIconButton>
          <MobileHeaderIconButton aria-label="Alerts">
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </MobileHeaderIconButton>
        </div>
      }
    />
    <Body>Two icon buttons is the hard cap. Active = semantic colour.</Body>
  </div>
);

/** B · trade page: title fades in once the in-page heading scrolls out. */
export const HeaderInnerTitleHiddenPreview = () => {
  const [hidden, setHidden] = useState(true);
  return (
    <div className="bg-background">
      <MobileHeader
        title="Will BTC close above $100k?"
        titleHidden={hidden}
        showBack
        showLogo={false}
        backTo="/events"
        rightContent={
          <div className="-mr-2 flex items-center gap-1">
            <MobileHeaderIconButton aria-label="Watchlist">
              <Star className="h-5 w-5" strokeWidth={1.5} />
            </MobileHeaderIconButton>
          </div>
        }
      />
      <div className="px-4 py-3">
        <button
          onClick={() => setHidden((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-[12px]"
        >
          {hidden ? "Show title (scrolled)" : "Hide title (at top)"}
        </button>
      </div>
    </div>
  );
};

/** B · overlong title truncates, never wraps. */
export const HeaderInnerLongTitlePreview = () => (
  <div className="bg-background">
    <MobileHeader
      title="Will the Fed cut rates by 50bps at the September FOMC?"
      showBack
      showLogo={false}
    />
    <Body>One line, ellipsis. Titles must stay ≤24 chars in practice.</Body>
  </div>
);

/** B · flushBottom hands the divider to a sticky sub-bar. */
export const HeaderInnerSubBarPreview = () => (
  <div className="h-[240px] overflow-y-auto bg-background">
    <MobileHeader title="Rewards" showBack showLogo={false} flushBottom />
    <div className="sticky top-[var(--mobile-header-h)] z-30 flex gap-4 border-b border-border bg-background px-4">
      {["Campaigns", "Referral", "Vouchers"].map((t, i) => (
        <span
          key={t}
          className={`py-2.5 text-[13px] ${i === 0 ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
        >
          {t}
        </span>
      ))}
    </div>
    <div className="px-4 py-3 text-[11px] text-muted-foreground">
      Sub-bar sticks at top-[var(--mobile-header-h)]; header divider is transparent.
    </div>
  </div>
);

/** Don't pairs — hand-drawn on purpose: these compositions are banned. */
export const HeaderDontPreview = () => (
  <div className="space-y-3 bg-background p-3">
    <div className="rounded-lg border border-trading-red/40">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-9 w-9 -ml-2 flex items-center justify-center text-muted-foreground">‹</div>
        <Logo size="md" showMainnetBadge={false} />
        <div className="flex-1" />
      </div>
      <div className="px-4 pb-2 text-[11px] text-trading-red">
        Don't: logo + back button together.
      </div>
    </div>
    <div className="rounded-lg border border-trading-red/40">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-9 w-9 -ml-2 flex items-center justify-center text-muted-foreground">‹</div>
        <span className="flex-1 text-center text-sm font-semibold">Deposit</span>
        <div className="h-9 w-9 -mr-2 flex items-center justify-center text-muted-foreground">✕</div>
      </div>
      <div className="px-4 pb-2 text-[11px] text-trading-red">
        Don't: back and an X close in the same bar.
      </div>
    </div>
  </div>
);