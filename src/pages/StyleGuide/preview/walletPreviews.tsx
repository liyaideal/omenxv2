/**
 * Wallet · Dual-Account 2b previews — style-guide iframe demos.
 *
 * Truth Rule (§16.1.1): renders the same production components used by
 * /wallet, /events header, and TransactionHistory. Composition-only pieces
 * All demos below mount production components (Wallet.tsx bands, the
 * EventsDesktopHeader HoverCard body, TransactionHistory, TransferForm,
 * AccountPickerRows, H2eRewardsCard) with mock props — no replica markup.
 *
 * NOTE (2026-07-21 Trial Bonus sunset): Trial Bonus has been fully
 * decommissioned. Demos below intentionally do NOT render a Trial tile
 * on the Futures card or a Trial row in the HoverCard.
 */
import { useState } from "react";
import { ArrowLeftRight, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeTotalEquity } from "@/lib/equity";
import { EquityHoverCardBody } from "@/components/EventsDesktopHeader";
import { TransferForm } from "@/components/wallet/TransferForm";
import { AccountPickerRows, type AccountKind } from "@/components/wallet/AccountPicker";
import {
  HeroEquityCard,
  SpotAccountCard,
  FuturesAccountCard,
} from "@/pages/Wallet";
import {
  TransactionHistory,
  type Transaction,
} from "@/components/wallet/TransactionHistory";

/* ---------- Band 1 Total Equity + Band 2 dual-account cards ---------- */

const DEMO = {
  spot: 1284.53,
  balance: 8720.42, // futures available
};

/**
 * Static stand-ins for the two tooltip components /wallet injects into the
 * Boost card. They are props, so the card itself stays the production one.
 */
const DemoInfoTip = ({ text }: { text: string }) => (
  <span title={text} className="text-muted-foreground/70">
    <Info className="w-3 h-3" />
  </span>
);
const DemoAvailableTooltip = () => <DemoInfoTip text="Funds available for trading and withdrawal." />;

// LIVE: renders the PRODUCTION HeroEquityCard / SpotAccountCard /
// FuturesAccountCard exported from src/pages/Wallet.tsx — no replica markup,
// so this demo cannot drift from /wallet.
export const WalletEquityBandsPreview = () => {
  const [hidden, setHidden] = useState(false);
  const isMobile = useIsMobile();
  const total = computeTotalEquity({
    spotBalance: DEMO.spot,
    balance: DEMO.balance,
  });
  const noop = () => {};

  // Mirrors the /wallet mobile branch verbatim: compact hero + compact account
  // cards stacked with space-y-3 (Wallet.tsx mobile return).
  if (isMobile) {
    return (
      <div className="space-y-4">
        <HeroEquityCard
          equity={total}
          hidden={hidden}
          onToggleHidden={() => setHidden((h) => !h)}
          onDeposit={noop}
          onWithdraw={noop}
          onTransfer={noop}
          compact
        />
        <section className="space-y-3">
          <SpotAccountCard balance={DEMO.spot} hidden={hidden} onTransfer={noop} compact />
          <FuturesAccountCard
            balance={DEMO.balance}
            hidden={hidden}
            onTransfer={noop}
            marginInUse={1_240}
            unrealizedPnL={86.4}
            AvailableTooltip={DemoAvailableTooltip}
            boostMax={10}
            compact
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroEquityCard
        equity={total}
        hidden={hidden}
        onToggleHidden={() => setHidden((h) => !h)}
        onDeposit={noop}
        onWithdraw={noop}
        onTransfer={noop}
      />
      <section className="grid grid-cols-2 gap-6">
        <SpotAccountCard balance={DEMO.spot} hidden={hidden} onTransfer={noop} />
        <FuturesAccountCard
          balance={DEMO.balance}
          hidden={hidden}
          onTransfer={noop}
          marginInUse={1_240}
          unrealizedPnL={86.4}
          AvailableTooltip={DemoAvailableTooltip}
          boostMax={10}
        />
      </section>
    </div>
  );
};

/* ---------- TransferForm state coverage (real component, props-driven) ---------- */

const TransferShell = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-card p-4">{children}</div>
);

export const TransferFormNormalPreview = () => (
  <TransferShell>
    <TransferForm
      demoOverride={{ balance: 8720.42, spotBalance: 1284.53, initialAmount: "250" }}
    />
  </TransferShell>
);

export const TransferFormInsufficientPreview = () => (
  <TransferShell>
    <TransferForm
      demoOverride={{ balance: 10, spotBalance: 1284.53, initialAmount: "500" }}
    />
  </TransferShell>
);

export const TransferFormZeroPreview = () => (
  <TransferShell>
    <TransferForm demoOverride={{ balance: 8720.42, spotBalance: 1284.53, initialAmount: "" }} />
  </TransferShell>
);

/* ---------- Deposit "Deposit to" pre-screen ---------- */

export const DepositToPickerPreview = () => {
  const [selected, setSelected] = useState<AccountKind | null>("spot");
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-card p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold">Deposit to</div>
        <div className="text-xs text-muted-foreground">
          Pick which account should receive the funds.
        </div>
      </div>
      <AccountPickerRows selected={selected} onSelect={setSelected} />
    </div>
  );
};

/* ---------- Header Equity HoverCard content ---------- */

// LIVE: renders the production EquityHoverCardBody exported from
// src/components/EventsDesktopHeader.tsx — the popover shell below only
// reproduces HoverCardContent's own container classes.
export const EquityHoverCardPreview = () => (
  <div className="mx-auto w-[260px] rounded-lg border border-border bg-popover p-3 shadow-md">
    <EquityHoverCardBody spotBalance={DEMO.spot} balance={DEMO.balance} />
  </div>
);

/* ---------- TransactionHistory account badges + transfer icon row ---------- */

// Docs fixtures use relative offsets (repo hoursAgo pattern) so the rendered
// text is identical whenever the preview is opened.
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const mkTx = (t: Partial<Transaction> & { id: string; type: Transaction["type"]; amount: number }): Transaction => ({
  description: "",
  date: hoursAgo(1).toISOString(),
  timestamp: hoursAgo(1).getTime(),
  status: "completed",
  ...t,
});

const DEMO_TXS: Transaction[] = [
  mkTx({
    id: "t1",
    type: "transfer_to_spot",
    amount: 250,
    description: "Transfer · Boost → Standard",
    account: "spot",
  }),
  mkTx({
    id: "t2",
    type: "transfer_to_futures",
    amount: 500,
    description: "Transfer · Standard → Boost",
    account: "futures",
  }),
  mkTx({
    id: "t3",
    type: "deposit",
    amount: 1000,
    description: "USDC deposit · Base",
    network: "Base",
    account: "spot",
    status: "completed",
  }),
  mkTx({
    id: "t4",
    type: "withdraw",
    amount: 200,
    description: "USDC withdraw · Base",
    network: "Base",
    account: "futures",
    status: "processing",
  }),
  mkTx({
    id: "t5",
    type: "trade_profit",
    amount: 42.18,
    description: "BTC ≥ $150k · resolved YES",
    account: "futures",
  }),
];

export const TransactionHistoryPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory transactions={DEMO_TXS} />
  </div>
);

/* ---------- Legend chip: quick reference for account badges ---------- */

export const AccountBadgeLegendPreview = () => (
  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
    <div className="flex items-center gap-2">
      <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] rounded-full">STANDARD</Badge>
      <span className="text-xs text-muted-foreground">Standard Account row</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge className="border-primary/30 bg-primary/10 text-primary text-[10px] rounded-full">BOOST</Badge>
      <span className="text-xs text-muted-foreground">Boost Account row</span>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
      Transfer icon (bidirectional)
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Info className="w-3.5 h-3.5" />
      Mobile: badges only appear on the second row (§8 Don't)
    </div>
  </div>
);
