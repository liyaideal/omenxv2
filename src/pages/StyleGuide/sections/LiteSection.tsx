// ============================================================
// Lite (consumer surface) playground — every component shipped in
// R3a / R3b-1 / R3b-2 with all of its visual states, driven by static
// mock props. Production components are used as-is; nothing here is
// reachable from a product page.
// ============================================================
import { useState } from "react";
import { Link } from "react-router-dom";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LiteBoostSelector } from "@/components/lite/contract/LiteBoostSelector";
import { LiteContractOrderPanel } from "@/components/lite/contract/LiteContractOrderPanel";
import { LiteContractChart } from "@/components/lite/contract/LiteContractChart";
import { LiteCashOutFlow } from "@/components/lite/contract/LiteCashOutFlow";
import { LiteMarketActivity } from "@/components/lite/contract/LiteMarketActivity";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { LiteSentimentBar } from "@/components/lite/contract/LiteSentimentBar";
import { LiteMarketBoard, type BoardOption } from "@/components/lite/multi/LiteMarketBoard";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { LiveSettledSwitch } from "@/components/lite/LiveSettledSwitch";
import { LiteSettledCard } from "@/components/lite/LiteSettledCard";
import { LiteEventCard } from "@/components/lite/LiteEventCard";
import type { EventRow } from "@/hooks/useMarketListData";
import { Star, ExternalLink } from "lucide-react";
import {
  LiteSettledSeriesCard,
  LiteSettledSeriesDayRow,
  type SettledSeries,
} from "@/components/lite/LiteSettledSeriesCard";
import type { ResolvedEvent } from "@/hooks/useResolvedEvents";

// Static settled-card fixtures — four states, no data access.
const settledDemo = (
  state: "won" | "lost" | "neutral" | "negative",
): ResolvedEvent => {
  const negative = state === "negative";
  return {
    id: `demo-${state}`,
    name: negative
      ? "Will NVDA close higher today?"
      : "Will BTC close above $70K this week?",
    category: negative ? "stocks" : "crypto",
    description: null,
    volume: null,
    is_resolved: true,
    settled_at: new Date(Date.now() - 3_600_000).toISOString(),
    winning_option_id: negative ? "o2" : "o1",
    imageUrl: null,
    options: [
      {
        id: "o1",
        event_id: `demo-${state}`,
        label: negative ? "Up" : "Yes",
        price: 0.6,
        final_price: negative ? 0 : 1,
        is_winner: !negative,
      },
      {
        id: "o2",
        event_id: `demo-${state}`,
        label: negative ? "Not Up" : "No",
        price: 0.4,
        final_price: negative ? 1 : 0,
        is_winner: negative,
      },
    ],
    sideLabels: negative ? { yes: "Up", no: "Not Up" } : undefined,
    productLines: [negative ? "spot" : "futures"],
    userParticipated: state === "won" || state === "lost",
    userPnl: state === "won" ? 12.4 : state === "lost" ? -5 : null,
  };
};
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { boostTiers } from "@/hooks/useCategoryBoostConfigs";

// Static daily-stock series fixture (two states: with / without a user result).
const seriesDemo = (userResult: number | null): SettledSeries => ({
  ticker: "NVDA",
  company: "NVIDIA",
  days: [settledDemo("negative"), settledDemo("won"), settledDemo("neutral")],
  userResult,
});

/** Small label chip that names the state being demonstrated. */
const StateChip = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
    {children}
  </div>
);

/**
 * Mounting-context chip. Exactly three values are allowed platform-wide —
 * "shared" is banned because it hides where a component actually mounts.
 */
type Ctx = "desktop-rail" | "mobile-drawer" | "both";
const CTX_TEXT: Record<Ctx, string> = {
  "desktop-rail": "Desktop · right rail",
  "mobile-drawer": "Mobile · bottom drawer",
  both: "Desktop & Mobile · same component",
};
const ContextChip = ({ ctx }: { ctx: Ctx }) => (
  <span className="mb-2 ml-2 inline-flex rounded-full border border-border/60 bg-transparent px-2 py-0.5 text-[10px] font-medium tracking-[0.06em] text-muted-foreground/80">
    {CTX_TEXT[ctx]}
  </span>
);

const Cell = ({
  label,
  ctx = "both",
  children,
}: {
  label: string;
  ctx?: Ctx;
  children: React.ReactNode;
}) => (
  <div className="min-w-0">
    <div className="flex flex-wrap items-center">
      <StateChip>{label}</StateChip>
      <ContextChip ctx={ctx} />
    </div>
    {children}
  </div>
);

/**
 * 375px-wide bordered frame used to demonstrate MOBILE mounting contexts.
 * The real MobileDrawer portals to <body>, so drawer compositions here use a
 * static replica of its chrome (handle + rounded top + border) — the panel
 * inside is the production component with variant="mobile".
 */
const MobileFrame = ({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: string;
}) => (
  <div className="w-[375px] max-w-full shrink-0">
    <div className="mb-1 font-mono text-[10px] text-muted-foreground/70">
      375px · mobile{note ? ` · ${note}` : ""}
    </div>
    <div className="overflow-hidden rounded-xl border border-dashed border-border bg-background">
      {children}
    </div>
  </div>
);

/** Static replica of MobileDrawer chrome (drawer is portalled in production). */
const FakeDrawerChrome = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-t-2xl border-t border-border bg-card px-4 pb-4 pt-2">
    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
    {children}
  </div>
);

/** Production order panel in its mobile framing, driven by local state. */
const MobileDrawerOrderPanel = () => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");
  const [boost, setBoost] = useState(5);
  return (
    <LiteContractOrderPanel
      {...baseOrderProps}
      variant="mobile"
      blocked={false}
      side={side}
      onSideChange={setSide}
      amount={amount}
      onAmountChange={setAmount}
      boost={boost}
      onBoostChange={setBoost}
    />
  );
};

/** Where every Lite component mounts, on each surface. */
const WHERE_ROWS: {
  name: string;
  desktop: string;
  mobile: string;
  openedBy: string;
  states: number;
}[] = [
  {
    name: "LiteContractOrderPanel",
    desktop: "right rail card, always visible",
    mobile: "body of the buy MobileDrawer",
    openedBy: "sticky bottom Buy Yes / Buy No buttons",
    states: 7,
  },
  {
    name: "LiteBoostSelector",
    desktop: "inside the right-rail order card",
    mobile: "inside the drawer order card",
    openedBy: "always rendered when boost is enabled",
    states: 7,
  },
  {
    name: "LiteContractChart",
    desktop: "main column, above the rules card",
    mobile: "body, under the question block",
    openedBy: "always visible (unresolved markets)",
    states: 4,
  },
  {
    name: "LiteSentimentBar",
    desktop: "main column, above the chart",
    mobile: "body, under the chart (compact)",
    openedBy: "always visible",
    states: 3,
  },
  {
    name: "LitePositionCard",
    desktop: "main column, under the rules card",
    mobile: "same slot, compact labels",
    openedBy: "rendered only when a holding exists",
    states: 5,
  },
  {
    name: "LiteCashOutFlow",
    desktop: "centered Dialog",
    mobile: "bottom MobileDrawer",
    openedBy: "Cash out footer button on the contract AND spot position cards",
    states: 3,
  },
  {
    name: "LiteMarketActivity",
    desktop: "main column, below the position card",
    mobile: "same slot, 4 rows instead of 8",
    openedBy: "always visible — same component on contract and spot pages",
    states: 2,
  },
  {
    name: "LiteOutcomeCard",
    desktop: "replaces the whole main column",
    mobile: "replaces the body stack",
    openedBy: "events.is_resolved = true — contract AND daily up/down pages",
    states: 3,
  },
  {
    name: "LiveSettledSwitch",
    desktop: "markets list, right of the sector rail (same row)",
    mobile: "same row, shrink-0 next to the scrolling rail",
    openedBy: "always visible on the Lite markets list; Settled routes to /resolved",
    states: 2,
  },
  {
    name: "LiteSettledCard",
    desktop: "settled list grid (1/2/3 cols), grouped by settle date",
    mobile: "same grid, single column",
    openedBy: "LiteSettledPage (/resolved on the Lite surface) — non-daily events only",
    states: 4,
  },
  {
    name: "LiteSettledSeriesCard",
    desktop: "\"Daily stocks\" section above the time groups (2 cols)",
    mobile: "same section, single column",
    openedBy: "one card per ticker; tap sets ?series={TICKER} on /resolved",
    states: 2,
  },
  {
    name: "LiteSettledSeriesDayRow",
    desktop: "series view ledger, newest first, 20 per page",
    mobile: "same rows",
    openedBy: "/resolved?series={TICKER} — row tap opens /resolved/{eventId}",
    states: 3,
  },
  {
    name: "LiteSettledPage",
    desktop: "full page — list view (daily-stock series + time groups) or series view",
    mobile: "same page, MobileHeader \"Settled\" + BottomNav",
    openedBy: "/resolved when surface = lite",
    states: 4,
  },
  {
    name: "LiteSettledEventDetail",
    desktop: "public event page — max-w-2xl column; daily stocks add \"How the day went\"",
    mobile: "same column, MobileHeader preset B (back to /resolved)",
    openedBy: "/resolved/:eventId when surface = lite; nothing personal beyond the outcome summary",
    states: 4,
  },
  {
    name: "LiteOrderPanel (spot)",
    desktop: "right rail of the Lite daily up/down page",
    mobile: "body of its buy drawer",
    openedBy: "sticky bottom dual buy bar",
    states: 3,
  },
  {
    name: "LiteEventCard",
    desktop: "live markets list grid (1/2/3 cols)",
    mobile: "same grid, single column",
    openedBy: "LiteEventsPage (/events on the Lite surface); tap opens /trade or /spot",
    states: 2,
  },
  {
    name: "Sector rail (LiteEventsPage)",
    desktop: "row above the grid, left of the Live/Settled switch",
    mobile: "same row, horizontally scrolling",
    openedBy: "always visible; pills render only for categories with live events",
    states: 3,
  },
  {
    name: "LiteEventsPage",
    desktop: "full page — title opening, sector rail, card grid, Pro escape line",
    mobile: "same page, MobileHeader preset A (logo only) + BottomNav",
    openedBy: "/events when surface = lite",
    states: 4,
  },
  {
    name: "LiteStockChart (spot)",
    desktop: "main column of the Lite daily up/down page",
    mobile: "body, under the price row",
    openedBy: "always visible; odds series follows the selected side",
    states: 4,
  },
];

const WhereThingsLive = () => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full min-w-[720px] text-left text-xs">
      <thead className="bg-muted/30 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <tr>
          <th className="px-3 py-2 font-semibold">Component</th>
          <th className="px-3 py-2 font-semibold">Desktop placement</th>
          <th className="px-3 py-2 font-semibold">Mobile placement</th>
          <th className="px-3 py-2 font-semibold">Opened by</th>
          <th className="px-3 py-2 text-right font-semibold">States</th>
        </tr>
      </thead>
      <tbody>
        {WHERE_ROWS.map((r) => (
          <tr key={r.name} className="border-t border-border/60">
            <td className="px-3 py-2 font-mono text-[11px] text-foreground">{r.name}</td>
            <td className="px-3 py-2 text-muted-foreground">{r.desktop}</td>
            <td className="px-3 py-2 text-muted-foreground">{r.mobile}</td>
            <td className="px-3 py-2 text-muted-foreground">{r.openedBy}</td>
            <td className="px-3 py-2 text-right font-mono text-foreground">{r.states}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Grid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) => (
  <div
    className={cn(
      "grid gap-6",
      cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
    )}
  >
    {children}
  </div>
);

// ------------------------------------------------- Markets list (live)
// Static EventRow fixture — no hooks, no data access.
type MarketVariant =
  | "default"
  | "closing"
  | "new"
  | "endsSoon"
  | "trending"
  | "intraday"
  | "intradayBoost";

const marketDemo = (variant: MarketVariant): EventRow => ({
  id: `demo-live-${variant}`,
  // Intraday fixtures carry a real daily up/down slug so the shipped
  // detector recognises them exactly as it does in production.
  eventId:
    variant === "intraday" || variant === "intradayBoost"
      ? "us-hood-updown-20260731"
      : `demo-live-${variant}`,
  eventName:
    variant === "closing"
      ? "Will the Fed cut rates in September?"
      : variant === "new"
        ? "Will the next iPhone ship a foldable?"
        : variant === "endsSoon"
          ? "Will ETH close above $4K today?"
          : variant === "trending"
            ? "Who takes the box office crown this weekend?"
            : variant === "intraday" || variant === "intradayBoost"
              ? "Robinhood (HOOD) — will close higher today?"
              : "Will BTC close above $70K this week?",
  eventIcon: "",
  category:
    variant === "closing"
      ? "macro"
      : variant === "intraday" || variant === "intradayBoost"
        ? "stocks"
        : "crypto",
  categoryLabel:
    variant === "closing"
      ? "Macro"
      : variant === "intraday" || variant === "intradayBoost"
        ? "Stocks"
        : "Crypto",
  productLines: variant === "intraday" ? ["spot"] : ["futures"],
  eventSubtype: null,
  lifecycleStatus: "active",
  basePrice: null,
  imageUrl: null,
  change1h: 0.8,
  change4h: -1.2,
  change24h: 3.4,
  volume1h: 12_000,
  volume4h: 48_000,
  volume24h: variant === "trending" ? 4_800_000 : 184_000,
  totalVolume: variant === "closing" ? 2_400_000 : 860_000,
  openInterest: 320_000,
  expiry: new Date(
    Date.now() +
      (variant === "endsSoon"
        ? 2.2
        : variant === "closing"
          ? 5
          : variant === "intraday"
            ? 6 + 40 / 60
            : variant === "intradayBoost"
              ? 1 + 20 / 60
              : 72) *
        3_600_000,
  ),
  createdAt: new Date(
    Date.now() - (variant === "new" ? 3 * 3_600_000 : 86_400_000 * 3),
  ).toISOString(),
  isNew: variant === "new",
  isClosingSoon: variant === "closing",
  topMarket: { label: "Yes" },
  childCount: 0,
  children: [],
});

const RAIL_PILL = "shrink-0 rounded-full px-[18px] py-[9px] text-[13px]";

// ------------------------------------------------ List badge system v2
const ListBadgeMatrix = () => (
  <div className="space-y-3">
    <StateChip>
      Max 2 badges · fill order: STATUS → Intraday → Boost · Lucide icons only
    </StateChip>
    <Grid cols={2}>
      <Cell label="Status · Ends soon (settles &lt; 4h) + Boost">
        <LiteEventCard market={marketDemo("endsSoon")} boostMax={5} />
      </Cell>
      <Cell label="Status · New (created &lt; 24h) + Boost">
        <LiteEventCard market={marketDemo("new")} boostMax={5} />
      </Cell>
      <Cell label="Status · Trending (24h volume in the top 20%)">
        <LiteEventCard market={marketDemo("trending")} trendingCutoff={1_000_000} />
      </Cell>
      <Cell label="Attribute only · Boost, no status">
        <LiteEventCard market={marketDemo("default")} boostMax={5} />
      </Cell>
      <Cell label="Attribute · Intraday, morning (settles later today)">
        <LiteEventCard market={marketDemo("intraday")} />
      </Cell>
      <Cell label="Attribute · Intraday, afternoon (< 4h) + Boost — no Ends soon">
        <LiteEventCard market={marketDemo("intradayBoost")} boostMax={5} />
      </Cell>
    </Grid>
    <p className="text-xs text-muted-foreground">
      A card shows at most <strong>two</strong> pills, filled in a fixed order:{" "}
      <strong>STATUS → Intraday → Boost</strong>; anything past the cap is dropped,
      Boost first. STATUS priority is fixed —{" "}
      <strong>Ends soon &gt; New &gt; Trending</strong>, at most one ever renders, and
      Trending is skipped entirely when fewer than 5 live events are loaded. Intraday
      marks events that open and settle inside the same trading day; it is a solid
      orange pill (<code>--badge-intraday</code>) and carries its own countdown to
      settle. Intraday events are <strong>exempt from New and Ends soon</strong> — a
      daily event is trivially new every morning and ends-soon every afternoon — so
      the only status they may carry is Trending, and the amber Ends-soon pill can
      never appear next to Intraday. The exemption is badge-only: ordering still uses
      the real settle time. Boost is contract-only; spot events never carry one.
      Settled cards keep their own result tag and are not part of this system.
    </p>
  </div>
);

const ListSortAnnotation = () => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      List sort · live markets
    </div>
    <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
      <li>Events settling in under 4h come first, soonest first.</li>
      <li>Everything else by 24h volume (fallback total volume), highest first.</li>
      <li>
        Events created in the last 24h that would rank below position 6 are lifted
        into the top 6, keeping their relative order and never displacing an
        Ends-soon event — they always land after the Ends-soon block, and the lift
        is skipped entirely when Ends-soon events already fill the top 6.
      </li>
    </ol>
    <p className="mt-2 text-xs text-muted-foreground">
      Applies to “All” and to each sector filter (scoped to the filtered set).
      Watchlist keeps the user’s own order; the settled list is unchanged.
    </p>
  </div>
);

const RAIL_ACTIVE = "bg-white text-[#0A0B0D] font-semibold";
const RAIL_IDLE = "border-[1.5px] border-[#2B2F38] text-[#C9CED6]";

const SectorRailDemo = () => {
  const [active, setActive] = useState("all");
  const pills = [
    "all",
    "Stocks",
    "Crypto",
    "Macro",
    "Tech",
    "Entertainment",
    "Politics",
    "Finance",
    "Social",
  ];
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-3">
      {pills.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setActive(p)}
          className={cn(RAIL_PILL, active === p ? RAIL_ACTIVE : RAIL_IDLE)}
        >
          {p === "all" ? "All" : p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setActive("watchlist")}
        className={cn(
          RAIL_PILL,
          "flex items-center gap-1.5",
          active === "watchlist" ? RAIL_ACTIVE : RAIL_IDLE,
        )}
      >
        <Star
          className={cn(
            "h-3.5 w-3.5",
            active === "watchlist"
              ? "fill-[#0A0B0D] text-[#0A0B0D]"
              : "text-trading-yellow",
          )}
          strokeWidth={1.5}
        />
        Watchlist
      </button>
      <span className={cn(RAIL_PILL, RAIL_IDLE, "flex items-center gap-1")}>
        Sports
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </div>
  );
};

// ---------------------------------------------------------------- Boost
const BoostPlayground = () => {
  const [values, setValues] = useState<Record<string, number>>({
    2: 1,
    5: 1,
    10: 5,
    20: 1,
    50: 1,
    custom: 7,
    tray: 1,
  });
  const set = (k: string) => (v: number) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-6">
      <Grid cols={3}>
        {[2, 5, 10, 20, 50].map((max) => (
          <Cell key={max} label={`Ladder · max ${max}×`}>
            <div className="rounded-2xl border border-border bg-card p-4">
              <LiteBoostSelector
                maxBoost={max}
                tiers={boostTiers(max)}
                value={values[String(max)]}
                onChange={set(String(max))}
                variant="desktop"
              />
            </div>
          </Cell>
        ))}
        <Cell label="Custom value active (7×)">
          <div className="rounded-2xl border border-border bg-card p-4">
            <LiteBoostSelector
              maxBoost={50}
              tiers={boostTiers(50)}
              value={values.custom}
              onChange={set("custom")}
              variant="desktop"
            />
          </div>
        </Cell>
      </Grid>
      <Grid>
        <Cell label="Custom tray open · at 1× baseline (empty input)">
          <div className="rounded-2xl border border-border bg-card p-4">
            <LiteBoostSelector
              maxBoost={20}
              tiers={boostTiers(20)}
              value={values.tray}
              onChange={set("tray")}
              variant="desktop"
              defaultTrayOpen
            />
          </div>
        </Cell>
        <Cell label="Mobile variant" ctx="mobile-drawer">
          <div className="rounded-2xl border border-border bg-card p-4">
            <LiteBoostSelector
              maxBoost={10}
              tiers={boostTiers(10)}
              value={values["10"]}
              onChange={set("10")}
              variant="mobile"
            />
          </div>
        </Cell>
      </Grid>
    </div>
  );
};

// ------------------------------------------------------- Contract order card
const baseOrderProps = {
  eventName: "Playground market",
  yesLabel: "Yes",
  noLabel: "No",
  yesPrice: 0.58,
  noPrice: 0.42,
  yesOptionId: "pg-yes",
  noOptionId: "pg-no",
  yesOptionLabel: "Yes",
  noOptionLabel: "No",
  boostEnabled: true,
  boostMax: 20,
  boostTiers: boostTiers(20),
  countdownText: "02:14:09",
  variant: "desktop" as const,
  onRequestAuth: () => undefined,
};

const OrderCardDemo = ({
  label,
  amount0,
  boost0,
  blocked,
  blockedReason,
  heldSideLabel,
  heldCurrentValue,
  heldQty,
  boostLoading,
}: {
  label: string;
  amount0: string;
  boost0: number;
  blocked?: boolean;
  blockedReason?: string;
  heldSideLabel?: string | null;
  heldCurrentValue?: number | null;
  heldQty?: number | null;
  boostLoading?: boolean;
}) => {
  const [side, setSide] = useState<"yes" | "no">(heldSideLabel === "Yes" ? "no" : "yes");
  const [amount, setAmount] = useState(amount0);
  const [boost, setBoost] = useState(boost0);
  return (
    <Cell label={label} ctx="desktop-rail">
      <div className="max-w-[380px]">
        <LiteContractOrderPanel
          {...baseOrderProps}
          blocked={!!blocked}
          blockedReason={blockedReason}
          side={side}
          onSideChange={setSide}
          amount={amount}
          onAmountChange={setAmount}
          boost={boost}
          onBoostChange={setBoost}
          boostLoading={boostLoading}
          heldSideLabel={heldSideLabel}
          heldCurrentValue={heldCurrentValue}
          heldQty={heldQty}
        />
      </div>
    </Cell>
  );
};

/** The auto-close cell never disappears — these are its four texts. */
const AutoCloseStates = () => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {[
      ["No amount yet", "—"],
      ["Boost 1× (none)", "None"],
      ["Boost 5× estimate", "≈ 41¢"],
      ["Cushioned account", "None at this balance"],
    ].map(([l, v]) => (
      <div key={l} className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {l}
        </div>
        <div className="font-mono text-sm font-semibold text-foreground">{v}</div>
      </div>
    ))}
  </div>
);

// ------------------------------------------------------------ Position card
const PositionStates = () => {
  const [open, setOpen] = useState<null | "full" | "partial" | "busy">(null);
  const common = {
    sideLabel: "Yes",
    isYes: true,
    putIn: 120,
    onCashOut: () => setOpen("full"),
  };
  return (
    <div className="space-y-6">
      <Grid cols={2}>
        <Cell label="In profit · 5× Boost">
          <LitePositionCard
            {...common}
            boost={5}
            nowWorth={144}
            profit={24}
            autoCloseText="≈ 41¢"
          />
        </Cell>
        <Cell label="At a loss · 5× Boost">
          <LitePositionCard
            {...common}
            sideLabel="No"
            isYes={false}
            boost={5}
            nowWorth={92.4}
            profit={-27.6}
            autoCloseText="≈ 63¢"
          />
        </Cell>
        <Cell label="Boost 1× · auto-close None">
          <LitePositionCard {...common} boost={1} nowWorth={131} profit={11} autoCloseText="None" />
        </Cell>
        <Cell label="Cushioned · None at this balance">
          <LitePositionCard
            {...common}
            boost={3}
            nowWorth={118.2}
            profit={-1.8}
            autoCloseText="None at this balance"
          />
        </Cell>
      </Grid>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen("full")}>
          Cash out · default 100%
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen("partial")}>
          Cash out · partial 37%
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen("busy")}>
          Cash out · busy CTA
        </Button>
      </div>

      <LiteCashOutFlow
        open={open !== null}
        onOpenChange={(o) => !o && setOpen(null)}
        isMobile={false}
        positionId="playground"
        positionIndex={0}
        currentValue={144}
        sizeNum={240}
        sideLabel="Yes"
        defaultPct={open === "partial" ? 37 : 100}
        forceBusy={open === "busy"}
        onDone={() => setOpen(null)}
      />
    </div>
  );
};

// ------------------------------------------------------------------ Section
export const LiteSection = ({ isMobile }: { isMobile: boolean }) => {
  const activity = [
    { id: "a1", isYes: true, label: "Yes", amount: 25, boost: 5, createdAt: new Date(Date.now() - 120_000).toISOString() },
    { id: "a2", isYes: false, label: "No", amount: 140, boost: 1, createdAt: new Date(Date.now() - 900_000).toISOString() },
    { id: "a3", isYes: true, label: "Yes", amount: 7, boost: 20, createdAt: new Date(Date.now() - 5_400_000).toISOString() },
    { id: "a4", isYes: false, label: "No", amount: 1250, boost: 3, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
    { id: "a5", isYes: true, label: "Yes", amount: 55, boost: 1, createdAt: new Date(Date.now() - 100_800_000).toISOString() },
  ];

  // Multi-market feed: option labels, No legs carry the legacy "No: " prefix.
  const activityMulti = [
    { id: "m1", isYes: true, label: "Max Verstappen", amount: 25, boost: 2, createdAt: new Date(Date.now() - 15_000).toISOString() },
    { id: "m2", isYes: false, label: "No: Lando Norris", amount: 140, boost: 1, createdAt: new Date(Date.now() - 600_000).toISOString() },
    { id: "m3", isYes: true, label: "Charles Leclerc", amount: 1250, boost: 5, createdAt: new Date(Date.now() - 7_200_000).toISOString() },
  ];

  return (
    <SectionWrapper
      id="lite"
      title="Lite — consumer surface"
      description="Every Lite component with all of its states. Static mock props; nothing here is reachable from a product page."
    >
      <div className="space-y-12">
        <SubSection
          title="Where things live"
          description="Mounting map for the Lite surface. Every demo below carries one of exactly three context chips: Desktop · right rail / Mobile · bottom drawer / Desktop & Mobile · same component."
        >
          <WhereThingsLive />
        </SubSection>

        <SubSection title="Boost selector" description="Ladders derive from category_boost_configs.max_leverage — never hardcoded.">
          <BoostPlayground />
        </SubSection>

        <SubSection
          title="Contract order card"
          description="Desktop rail variant. The auto-close slot always renders — see the text matrix below."
        >
          <div className="space-y-6">
            <Grid cols={3}>
              <OrderCardDemo label="Empty · $0" amount0="" boost0={1} />
              <OrderCardDemo label="Amount at 1× (auto-close None)" amount0="50" boost0={1} />
              <OrderCardDemo label="Amount at 5×" amount0="50" boost0={5} />
              <OrderCardDemo
                label="Netting notice only (no qty known → no figure)"
                amount0="80"
                boost0={2}
                heldSideLabel="Yes"
                heldCurrentValue={144}
              />
              <OrderCardDemo
                label="Netting · full net (190 of 300 shares)"
                amount0="80"
                boost0={1}
                heldSideLabel="Yes"
                heldCurrentValue={144}
                heldQty={300}
              />
              <OrderCardDemo
                label="Netting · partial (476 vs 300 shares)"
                amount0="200"
                boost0={1}
                heldSideLabel="Yes"
                heldCurrentValue={144}
                heldQty={300}
              />
              <OrderCardDemo label="Blocked · Closed" amount0="50" boost0={5} blocked blockedReason="Closed" />
              <OrderCardDemo label="Blocked · Settled" amount0="" boost0={1} blocked blockedReason="Settled" />
              <OrderCardDemo label="Boost config loading (skeleton)" amount0="25" boost0={1} boostLoading />
            </Grid>
            <div>
              <StateChip>Est. auto-close · all four texts</StateChip>
              <AutoCloseStates />
            </div>
          </div>
        </SubSection>

        <SubSection title="Your call — position card + Cash out" description="Money axis for profit only; market axis for side identity.">
          <PositionStates />
        </SubSection>

        <SubSection
          title="Markets list"
          description="The live Lite list (/events): grid card + sector rail. The Live | Settled switch is demoed once under the settled outcome card — not duplicated here."
        >
          <div className="space-y-6">
            <Grid cols={2}>
              <Cell label="Live market card · default">
                <LiteEventCard market={marketDemo("default")} />
              </Cell>
              <Cell label="Live market card · closing soon footer">
                <LiteEventCard market={marketDemo("closing")} />
              </Cell>
            </Grid>
            <ListBadgeMatrix />
            <ListSortAnnotation />
            <div>
              <StateChip>Sector rail · pills render only for categories with live events</StateChip>
              <SectorRailDemo />
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Settled market card"
          description="Grid card on the Lite settled list. Three swaps vs. the live card: result/neutral tag, single winner row, past-tense footer."
        >
          <Grid cols={3}>
            <Cell label="Won · participated">
              <LiteSettledCard event={settledDemo("won")} onSelect={() => undefined} />
            </Cell>
            <Cell label="Lost · participated">
              <LiteSettledCard event={settledDemo("lost")} onSelect={() => undefined} />
            </Cell>
            <Cell label="Neutral · not participated">
              <LiteSettledCard event={settledDemo("neutral")} onSelect={() => undefined} />
            </Cell>
            <Cell label="Negative-alias winner (never renders the raw label)">
              <LiteSettledCard event={settledDemo("negative")} onSelect={() => undefined} />
            </Cell>
          </Grid>
        </SubSection>

        <SubSection
          title="Daily-stock series"
          description="Daily up/down days collapse into one card per ticker; the series view lists the days."
        >
          <div className="space-y-6">
            <Grid cols={2}>
              <Cell label="With the viewer's latest result">
                <LiteSettledSeriesCard series={seriesDemo(12.4)} onSelect={() => undefined} />
              </Cell>
              <Cell label="No participation">
                <LiteSettledSeriesCard series={seriesDemo(null)} onSelect={() => undefined} />
              </Cell>
            </Grid>
            <div>
              <StateChip>Series view · day rows</StateChip>
              <div className="rounded-2xl border border-border bg-card p-2">
                <LiteSettledSeriesDayRow event={settledDemo("won")} onSelect={() => undefined} />
                <LiteSettledSeriesDayRow event={settledDemo("lost")} onSelect={() => undefined} />
                <LiteSettledSeriesDayRow event={settledDemo("negative")} onSelect={() => undefined} />
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection title="Settled outcome card">
          <div className="mb-6">
            <StateChip>Live / Settled switch · both states</StateChip>
            <Grid>
              <Cell label="Live selected (markets list default)">
                <LiveSettledSwitch value="live" onSelect={() => undefined} />
              </Cell>
              <Cell label="Settled selected (resolved browser)">
                <LiveSettledSwitch value="settled" onSelect={() => undefined} />
              </Cell>
            </Grid>
          </div>
          <Grid cols={3}>
            <Cell label="Won · with holding">
              <LiteOutcomeCard
                settledAt={new Date().toISOString()}
                winnerLabel="Yes"
                winnerIsYes
                loserLabel="No"
                sourceName="Coinbase"
                sourceUrl="https://example.com"
                summary="Closed above the target at the cash close."
                holding={{ sideLabel: "Yes", isYesSide: true, boost: 5, putIn: 120, paidOut: 206.9, profit: 86.9 }}
                onSeeHow={() => undefined}
                onBrowse={() => undefined}
              />
            </Cell>
            <Cell label="Lost · with holding">
              <LiteOutcomeCard
                settledAt={new Date().toISOString()}
                winnerLabel="No"
                winnerIsYes={false}
                loserLabel="Yes"
                summary="Closed below the target."
                holding={{ sideLabel: "Yes", isYesSide: true, boost: 3, putIn: 120, paidOut: 0, profit: -120 }}
                onSeeHow={() => undefined}
                onBrowse={() => undefined}
              />
            </Cell>
            <Cell label="Signed out / no holding">
              <LiteOutcomeCard
                settledAt={new Date().toISOString()}
                winnerLabel="Yes"
                winnerIsYes
                loserLabel="No"
                holding={null}
                onSeeHow={() => undefined}
                onBrowse={() => undefined}
              />
            </Cell>
          </Grid>
        </SubSection>

        <SubSection title="Contract chart">
          <Grid>
            <Cell label="Odds only · Yes side selected">
              <LiteContractChart
                underlyingLabel={null}
                basePrice={null}
                currentPrice={null}
                yesOdds={0.58}
                yesLabel="Yes"
                noLabel="No"
                side="yes"
              />
            </Cell>
            <Cell label="Odds only · No side selected (100 − Yes)">
              <LiteContractChart
                underlyingLabel={null}
                basePrice={null}
                currentPrice={null}
                yesOdds={0.58}
                yesLabel="Yes"
                noLabel="No"
                side="no"
              />
            </Cell>
            <Cell label="Odds + underlying toggle · Yes side">
              <LiteContractChart
                underlyingLabel="BTC price"
                basePrice={64200}
                currentPrice={65310}
                yesOdds={0.58}
                yesLabel="Yes"
                noLabel="No"
                side="yes"
              />
            </Cell>
            <Cell label="Odds + underlying toggle · No side">
              <LiteContractChart
                underlyingLabel="BTC price"
                basePrice={64200}
                currentPrice={65310}
                yesOdds={0.58}
                yesLabel="Up"
                noLabel="Down"
                side="no"
              />
            </Cell>
          </Grid>
        </SubSection>

        <SubSection title="Crowd sentiment bar">
          <div className="space-y-4">
            {[8, 52, 94].map((p) => (
              <div key={p}>
                <StateChip>{p}% Yes</StateChip>
                <LiteSentimentBar yesLabel="Yes" noLabel="No" yesPct={p} />
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Market activity"
          description="Anonymised all-user feed from market_activity — never the viewer's own owner-scoped fills."
        >
          <Grid cols={3}>
            <Cell label="Populated · Yes / No">
              <LiteMarketActivity rows={activity} yesLabel="Yes" noLabel="No" />
            </Cell>
            <Cell label="Alias labels · Up / Down (alignment proof)">
              <LiteMarketActivity rows={activity} yesLabel="Up" noLabel="Down" />
            </Cell>
            <Cell label="Multi-market · time | action | context | amount">
              <LiteMarketActivity
                rows={activityMulti}
                yesLabel="Yes"
                noLabel="No"
                showOptionLabel
              />
            </Cell>
            <Cell label="Empty">
              <LiteMarketActivity rows={[]} yesLabel="Yes" noLabel="No" />
            </Cell>
          </Grid>
        </SubSection>

        <SubSection
          title="Mobile mounting contexts"
          description="How the same components mount on mobile: inside the buy drawer, behind a sticky dual buy bar, and with compact position labels. Rendered in a 375px frame so the difference is visible on a desktop screen."
        >
          <div className="flex flex-wrap gap-6">
            <MobileFrame note="buy drawer (statically open)">
              <FakeDrawerChrome>
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-yes/14 px-2 py-0.5 text-[11px] font-semibold text-yes">
                      Yes
                    </span>
                    <span className="truncate text-sm font-semibold">
                      Playground market
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    02:14:09 left · 58% chance
                  </div>
                </div>
                <MobileDrawerOrderPanel />
              </FakeDrawerChrome>
            </MobileFrame>

            <MobileFrame note="sticky bottom buy bar">
              <div className="border-t border-border bg-background/90 px-4 pb-4 pt-3">
                <div className="mx-auto flex max-w-md gap-2">
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-center rounded-xl bg-yes py-2.5 font-display font-bold leading-tight text-[#04222c]"
                  >
                    <span className="text-sm">Buy Yes</span>
                    <span className="font-mono text-[13px]">58¢</span>
                    <span className="font-mono text-[10px] opacity-75">5× BOOST</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-center rounded-xl border border-no/25 bg-no/14 py-2.5 font-display font-bold leading-tight text-no"
                  >
                    <span className="text-sm">Buy No</span>
                    <span className="font-mono text-[13px]">42¢</span>
                    <span className="font-mono text-[10px] opacity-75">5× BOOST</span>
                  </button>
                </div>
              </div>
            </MobileFrame>

            <MobileFrame note="position card · compact labels">
              <div className="p-3">
                <LitePositionCard
                  sideLabel="Yes"
                  isYes
                  boost={5}
                  putIn={120}
                  nowWorth={144}
                  profit={24}
                  autoCloseText="≈ 41¢"
                  compact
                  onCashOut={() => undefined}
                />
              </div>
            </MobileFrame>
          </div>
        </SubSection>

        <SubSection title="Lite spot order card" description="Daily up/down markets. Full playground lives in the Lite spot section.">
          <LiteSpotStates isMobile={isMobile} />
        </SubSection>

        <SubSection title="Multi-market board (3+ options)">
          <p className="mb-3 text-sm text-muted-foreground">
            Events with 3+ options replace the sentiment bar and the standalone chart with the
            market board: one row per option, independent Yes / No chips, a 4px dual-tone strip,
            and an inline accordion chart under the selected row. Binary events never render this.
          </p>
          <MultiMarketStates />
        </SubSection>

        <SubSection title="Mobile header (preset B)">
          <p className="text-sm text-muted-foreground">
            Lite trade pages use the standard MobileHeader preset B (back arrow + title). It is
            specified once in{" "}
            <Link to="/style-guide#mobile-patterns" className="text-yes underline">
              Mobile patterns
            </Link>{" "}
            and is not duplicated here.
          </p>
        </SubSection>
      </div>
    </SectionWrapper>
  );
};

// ---------------------------------------------------- Multi-market states
const MULTI_OPTIONS: BoardOption[] = [
  { id: "m1", label: "Above $130K", yesPrice: 0.02, settled: true, outcomeYes: false },
  { id: "m2", label: "Above $120K", yesPrice: 0.12 },
  { id: "m3", label: "$110K – $120K", yesPrice: 0.34, heldSide: "yes" },
  { id: "m4", label: "$100K – $110K", yesPrice: 0.41 },
  { id: "m5", label: "Below $100K", yesPrice: 0.13, heldSide: "no" },
];

const MultiMarketStates = () => {
  const [selDesktop, setSelDesktop] = useState<{ id: string; side: "yes" | "no" }>({
    id: "m3",
    side: "yes",
  });
  const [selMobile, setSelMobile] = useState<{ id: string; side: "yes" | "no" }>({
    id: "m4",
    side: "no",
  });
  return (
    <Grid cols={2}>
      <Cell label="Desktop · row selected, chart open">
        <LiteMarketBoard
          options={MULTI_OPTIONS}
          volumeText="Vol $30.0M"
          selectedId={selDesktop.id}
          selectedSide={selDesktop.side}
          onSelect={(id, side) => setSelDesktop({ id, side })}
        />
      </Cell>
      <Cell label="Mobile · compact rows, no inline chart">
        <LiteMarketBoard
          compact
          showChart={false}
          options={MULTI_OPTIONS}
          volumeText="Vol $30.0M"
          selectedId={selMobile.id}
          selectedSide={selMobile.side}
          onSelect={(id, side) => setSelMobile({ id, side })}
        />
      </Cell>
      <Cell label="Order rail · same-option opposite side blocked">
        <LiteContractOrderPanel
          eventName="Where does Bitcoin end July?"
          marketContextLabel="$110K – $120K"
          blockNotice="You already back Yes on this market. Cash out first, then switch sides."
          yesLabel="Yes"
          noLabel="No"
          yesPrice={0.34}
          noPrice={0.66}
          yesOptionId="m3"
          noOptionId="m3"
          yesOptionLabel="$110K – $120K"
          noOptionLabel="No: $110K – $120K"
          blocked={false}
          side="no"
          onSideChange={() => undefined}
          amount="25"
          onAmountChange={() => undefined}
          boost={1}
          onBoostChange={() => undefined}
          boostEnabled
          boostMax={10}
          boostTiers={boostTiers(10)}
          countdownText="09:51:19"
          variant="desktop"
          onRequestAuth={() => undefined}
        />
      </Cell>
    </Grid>
  );
};

// -------------------------------------------------------- Lite spot states
const LiteSpotStates = ({ isMobile }: { isMobile: boolean }) => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("50");
  const shared = {
    eventName: "AAPL daily up/down",
    eventId: "pg-spot",
    countdownText: "01:02:03",
    yesLabel: "Up",
    noLabel: "Down",
    yesPrice: 0.54,
    noPrice: 0.46,
    yesOptionId: "pg-up",
    noOptionId: "pg-down",
    yesOptionLabel: "Up",
    noOptionLabel: "Not Up",
    side,
    onSideChange: setSide,
    variant: (isMobile ? "mobile" : "desktop") as "mobile" | "desktop",
    onRequestAuth: () => undefined,
  };
  return (
    <Grid cols={3}>
      <Cell label="Empty">
        <LiteOrderPanel {...shared} blocked={false} amount={amountA} onAmountChange={setAmountA} />
      </Cell>
      <Cell label="Filled">
        <LiteOrderPanel {...shared} blocked={false} amount={amountB} onAmountChange={setAmountB} />
      </Cell>
      <Cell label="Blocked · market frozen">
        <LiteOrderPanel
          {...shared}
          blocked
          blockedReason="Market frozen"
          amount={amountB}
          onAmountChange={setAmountB}
        />
      </Cell>
    </Grid>
  );
};

export default LiteSection;