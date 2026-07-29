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
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { LiteOrderPanel } from "@/components/lite/trade/LiteOrderPanel";
import { boostTiers } from "@/hooks/useCategoryBoostConfigs";

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
    openedBy: "Cash out footer button on the position card",
    states: 3,
  },
  {
    name: "LiteMarketActivity",
    desktop: "main column, below the position card",
    mobile: "same slot, 4 rows instead of 8",
    openedBy: "always visible",
    states: 2,
  },
  {
    name: "LiteOutcomeCard",
    desktop: "replaces the whole main column",
    mobile: "replaces the body stack",
    openedBy: "events.is_resolved = true",
    states: 3,
  },
  {
    name: "LiteOrderPanel (spot)",
    desktop: "right rail of the Lite daily up/down page",
    mobile: "body of its buy drawer",
    openedBy: "sticky bottom dual buy bar",
    states: 3,
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
  boostLoading,
}: {
  label: string;
  amount0: string;
  boost0: number;
  blocked?: boolean;
  blockedReason?: string;
  heldSideLabel?: string | null;
  heldCurrentValue?: number | null;
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
    { id: "a1", isYes: true, amount: 25, boost: 5, createdAt: new Date(Date.now() - 120_000).toISOString() },
    { id: "a2", isYes: false, amount: 140, boost: 1, createdAt: new Date(Date.now() - 900_000).toISOString() },
    { id: "a3", isYes: true, amount: 7, boost: 20, createdAt: new Date(Date.now() - 5_400_000).toISOString() },
    { id: "a4", isYes: false, amount: 1250, boost: 3, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
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
                label="Netting notice (holds Yes, buying No)"
                amount0="80"
                boost0={2}
                heldSideLabel="Yes"
                heldCurrentValue={144}
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

        <SubSection title="Settled outcome card">
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