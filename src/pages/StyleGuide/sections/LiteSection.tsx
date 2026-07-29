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

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <StateChip>{label}</StateChip>
    {children}
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
        <Cell label="Mobile variant">
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
    <Cell label={label}>
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
  ];

  return (
    <SectionWrapper
      id="lite"
      title="Lite — consumer surface"
      description="Every Lite component with all of its states. Static mock props; nothing here is reachable from a product page."
      platform="shared"
    >
      <div className="space-y-12">
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
            <Cell label="Odds only (no underlying)">
              <LiteContractChart
                underlyingLabel={null}
                basePrice={null}
                currentPrice={null}
                yesOdds={0.58}
                yesLabel="Yes"
              />
            </Cell>
            <Cell label="Odds + underlying (toggle)">
              <LiteContractChart
                underlyingLabel="BTC price"
                basePrice={64200}
                currentPrice={65310}
                yesOdds={0.58}
                yesLabel="Yes"
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
          <Grid>
            <Cell label="Populated">
              <LiteMarketActivity rows={activity} yesLabel="Yes" noLabel="No" />
            </Cell>
            <Cell label="Empty">
              <LiteMarketActivity rows={[]} yesLabel="Yes" noLabel="No" />
            </Cell>
          </Grid>
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