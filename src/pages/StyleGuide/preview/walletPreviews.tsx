/**
 * Wallet · Dual-Account 2b previews — style-guide iframe demos.
 *
 * Truth Rule (§16.1.1): renders the same production components used by
 * /wallet, /events header, and TransactionHistory. Composition-only pieces
 * (Band 1 Total Equity + dual-account cards, header HoverCard content)
 * mirror the exact JSX from Wallet.tsx / EventsDesktopHeader.tsx so the
 * spec cannot drift silently — any change there must be mirrored here.
 *
 * NOTE (2026-07-21 Trial Bonus sunset): Trial Bonus has been fully
 * decommissioned. Demos below intentionally do NOT render a Trial tile
 * on the Futures card or a Trial row in the HoverCard.
 */
import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Eye, EyeOff, Info, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeTotalEquity, formatEquityUsd } from "@/lib/equity";
import { TransferForm } from "@/components/wallet/TransferForm";
import { AccountPickerRows, type AccountKind } from "@/components/wallet/AccountPicker";
import {
  TransactionHistory,
  type Transaction,
} from "@/components/wallet/TransactionHistory";

/* ---------- Band 1 Total Equity + Band 2 dual-account cards ---------- */

const DEMO = {
  spot: 1284.53,
  balance: 8720.42, // futures available
};

// MIRROR: must stay in sync with src/pages/Wallet.tsx desktop Band 1 + Band 2
// (grep "Band 1 · Total Equity" in Wallet.tsx). 改生产必改此处。
export const WalletEquityBandsPreview = () => {
  const [hidden, setHidden] = useState(false);
  const total = computeTotalEquity({
    spotBalance: DEMO.spot,
    balance: DEMO.balance,
  });
  const mask = (n: number) => (hidden ? "••••••" : `$${formatEquityUsd(n)}`);

  return (
    <div className="space-y-6">
      {/* Band 1 · Total Equity 总览条 (hero gradient — §5 exception, Wallet Total Equity Card) */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-trading-green/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <WalletIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Est. Total Equity
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-3xl font-bold whitespace-nowrap">{mask(total)}</span>
                <button
                  type="button"
                  onClick={() => setHidden((h) => !h)}
                  className="text-muted-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Toggle balance visibility"
                >
                  {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                Spot + Futures · does not include unrealized PnL
              </div>
            </div>
          </div>
          <div className="flex gap-2 lg:shrink-0">
            <Button className="btn-trading-green h-11 px-5">
              <ArrowDownLeft className="w-4 h-4 mr-1.5" /> Deposit
            </Button>
            <Button variant="outline" className="h-11 px-5 border-border/50 hover:bg-muted/50 rounded-xl">
              <ArrowUpRight className="w-4 h-4 mr-1.5" /> Withdraw
            </Button>
            <Button variant="outline" className="h-11 px-5 border-border/50 hover:bg-muted/50 rounded-xl">
              <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Transfer
            </Button>
          </div>
        </div>
      </section>

      {/* Band 2 · Dual account cards (stats-card, no hero gradient). Account subtotal
          only lives on Band 1 — do NOT reintroduce a Futures "Total" cell here.
          Post Trial-Bonus sunset the Futures card has a single Available tile. */}
      <section className="grid grid-cols-2 gap-6">
        {/* Spot Account — mirrors Wallet.tsx Spot card */}
        <div className="stats-card p-6 relative">
          <button
            type="button"
            className="absolute top-4 right-4 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
            aria-label="Transfer to Spot"
            title="Transfer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
          <div className="text-sm font-medium text-muted-foreground">Spot Account</div>
          <div className="mt-2 font-mono text-2xl font-semibold">${formatEquityUsd(DEMO.spot)}</div>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="text-xs text-muted-foreground mb-1">Available (USDC)</div>
              <div className="font-mono text-sm font-semibold">${formatEquityUsd(DEMO.spot)}</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-3">
            Funds US-stock spot trading. Not shared with Futures.
          </div>
        </div>

        {/* Futures Account — mirrors Wallet.tsx Futures card. No "Total" cell, no Trial cell. */}
        <div className="stats-card p-6 relative">
          <button
            type="button"
            className="absolute top-4 right-4 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
            aria-label="Transfer to Futures"
            title="Transfer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
          <div className="text-sm font-medium text-muted-foreground">Futures Account</div>
          <div className="mt-2 font-mono text-2xl font-semibold">${formatEquityUsd(DEMO.balance)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">Available</span>
                <Info className="w-3 h-3 text-muted-foreground/60" />
              </div>
              <div className="font-mono text-sm font-semibold">${formatEquityUsd(DEMO.balance)}</div>
            </div>
          </div>
        </div>
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

// MIRROR: must stay in sync with src/components/EventsDesktopHeader.tsx
// Equity HoverCardContent block. 改生产必改此处。
export const EquityHoverCardPreview = () => {
  const total = computeTotalEquity({
    spotBalance: DEMO.spot,
    balance: DEMO.balance,
  });
  return (
    <div className="mx-auto w-[260px] rounded-lg border border-border bg-popover p-3 shadow-md">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        Total Equity
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Spot Account</span>
          <span className="font-mono">${formatEquityUsd(DEMO.spot)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Futures Account</span>
          <span className="font-mono">${formatEquityUsd(DEMO.balance)}</span>
        </div>
      </div>
      <div className="my-2 border-t border-border/50" />
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Total Equity</span>
        <span className="font-mono font-bold">${formatEquityUsd(total)}</span>
      </div>
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors"
      >
        <ArrowLeftRight className="w-3 h-3" /> Transfer ›
      </button>
    </div>
  );
};

/* ---------- TransactionHistory account badges + transfer icon row ---------- */

const now = Date.now();
const mkTx = (t: Partial<Transaction> & { id: string; type: Transaction["type"]; amount: number }): Transaction => ({
  description: "",
  date: new Date(now - 3600_000).toISOString(),
  timestamp: now - 3600_000,
  status: "completed",
  ...t,
});

const DEMO_TXS: Transaction[] = [
  mkTx({
    id: "t1",
    type: "transfer_to_spot",
    amount: 250,
    description: "Transfer · Futures → Spot",
    account: "spot",
  }),
  mkTx({
    id: "t2",
    type: "transfer_to_futures",
    amount: 500,
    description: "Transfer · Spot → Futures",
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
      <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] rounded-full">SPOT</Badge>
      <span className="text-xs text-muted-foreground">Spot Account row</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge className="border-primary/30 bg-primary/10 text-primary text-[10px] rounded-full">FUTURES</Badge>
      <span className="text-xs text-muted-foreground">Futures Account row</span>
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
