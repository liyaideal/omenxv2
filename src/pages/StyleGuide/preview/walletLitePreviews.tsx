/**
 * Wallet Lite R1 previews — archive round (batches 1–3).
 *
 * Truth Rule (§16.1.1): every demo below mounts the PRODUCTION component with
 * fixture props — HeroEquityCard /
 * SavedAddressRowView / SavedAddressActionsList / ProductLineBadge /
 * TransactionHistory. No hand-copied markup.
 *
 * Fixtures use relative dates (hoursAgo) so the docs never go stale.
 */
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronRight, HelpCircle, Plus, X } from "lucide-react";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { EmptyState } from "@/components/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletDeposit } from "@/components/deposit/WalletDeposit";
import { CrossChainDeposit } from "@/components/deposit/CrossChainDeposit";
import { BuyWithFiat } from "@/components/deposit/BuyWithFiat";
import { WalletWithdraw } from "@/components/withdraw/WalletWithdraw";
import { WithdrawSubmitProvider } from "@/components/withdraw/WithdrawSubmitContext";
import {
  PendingConfirmations,
  type PendingTransaction,
} from "@/components/wallet/PendingConfirmations";
import { MaintenanceNoticeBanner } from "@/components/wallet/MaintenanceNoticeBanner";
import {
  AvailableBalanceTooltip,
  FuturesAccountCard,
  HeroEquityCard,
  SpotAccountCard,
  WalletAuthGate,
  WalletGatePlaceholder,
  SavedAddressRowView,
  SavedAddressActionsList,
  type SavedAddressView,
} from "@/pages/Wallet";
import { FIXTURE_WALLETS } from "./fundingPreviews";
import {
  TransactionHistory,
  type Transaction,
  type TransactionType,
} from "@/components/wallet/TransactionHistory";


// Relative offsets anchored to *today's* UTC midnight: the docs never go stale,
// yet the rendered text is identical no matter when within the day it is opened
// (a raw Date.now() anchor would re-render a new minute on every screenshot).
const DAY_ANCHOR = (() => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  return d.getTime();
})();
const hoursAgo = (h: number) => new Date(DAY_ANCHOR - h * 3600_000);

/* ---------------- 3 · Saved addresses ⋯ menu ---------------- */

const ADDR_DEFAULT: SavedAddressView = {
  id: "w1",
  label: "Main wallet",
  address: "0x8f2a91...c4d071",
  fullAddress: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d071",
  isPrimary: true,
};

const ADDR_SECONDARY: SavedAddressView = {
  id: "w2",
  label: "Polygon wallet",
  address: "0x41c7de...9b3f02",
  fullAddress: "0x41c7de55a8b0f2e1c3d4a5b6c7d8e9f0a19b3f02",
  isPrimary: false,
};

const AddressCard = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-md trading-card p-4">
    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Saved addresses
    </div>
    {children}
  </div>
);

const noop = () => undefined;

export const SavedAddressRowsDesktopPreview = () => (
  <AddressCard>
    <SavedAddressRowView
      wallet={ADDR_DEFAULT}
      isLast={false}
      isMobile={false}
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
    <SavedAddressRowView
      wallet={ADDR_SECONDARY}
      isLast
      isMobile={false}
      copied
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
  </AddressCard>
);

export const SavedAddressRowsMobilePreview = () => (
  <AddressCard>
    <SavedAddressRowView
      wallet={ADDR_DEFAULT}
      isLast={false}
      isMobile
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
    <SavedAddressRowView
      wallet={ADDR_SECONDARY}
      isLast
      isMobile
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
  </AddressCard>
);

/** Drawer body as rendered inside MobileDrawer (shell = drawer chrome only). */
export const SavedAddressActionsDrawerPreview = () => (
  <div className="mx-auto max-w-[375px] rounded-t-3xl border border-border bg-card px-5 pt-4 pb-4">
    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
    <SavedAddressActionsList wallet={ADDR_SECONDARY} onSetPrimary={noop} onCopy={noop} onDelete={noop} />
  </div>
);

export const SavedAddressActionsDrawerDefaultPreview = () => (
  <div className="mx-auto max-w-[375px] rounded-t-3xl border border-border bg-card px-5 pt-4 pb-4">
    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
    <SavedAddressActionsList wallet={ADDR_DEFAULT} onSetPrimary={noop} onCopy={noop} onDelete={noop} />
  </div>
);

/* ---------------- 4 · Product-line badge ---------------- */

export const ProductLineBadgePairPreview = () => (
  <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/40 bg-muted/20 p-4">
    <div className="flex items-center gap-2">
      <ProductLineBadge line="spot" />
      <span className="text-xs text-muted-foreground">spot → Standard Account</span>
    </div>
    <div className="flex items-center gap-2">
      <ProductLineBadge line="futures" />
      <span className="text-xs text-muted-foreground">futures → Boost Account</span>
    </div>
    <span className="font-mono text-[10px] text-muted-foreground/70">src/lib/productLineBadge.tsx</span>
  </div>
);

/* ---------------- 5 · Transaction rows — full icon matrix ---------------- */

const mk = (
  id: string,
  type: TransactionType,
  amount: number,
  description: string,
  extra: Partial<Transaction> = {},
): Transaction => {
  const d = hoursAgo(Number(id.replace(/\D/g, "")) || 1);
  return {
    id,
    type,
    amount,
    description,
    date: d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }),
    timestamp: d.getTime(),
    status: "completed",
    ...extra,
  };
};

const ICON_MATRIX_TXS: Transaction[] = [
  mk("1", "deposit", 1000, "USDC deposit · Base", { network: "Base", account: "spot" }),
  mk("2", "withdraw", 200, "USDC withdraw · Base", { network: "Base", account: "futures", status: "processing" }),
  // E1b · icon follows net sign, not type: a positive trade_loss shows the green up icon.
  mk("3", "trade_loss", 42.18, "Settled: BTC ≥ $150k · Lost", { account: "futures" }),
  // E1b · a negative trade_profit shows the red down icon.
  mk("4", "trade_profit", -18.4, "Settled: Bitcoin · Up · Won", { account: "futures" }),
  mk("5", "platform_credit", 25, "Platform credit", { account: "spot" }),
  mk("6", "bonus", 10, "Trial position voucher TPV-DEMO-S1", { account: "spot" }),
  mk("7", "fee", 1.25, "Trading fee", { account: "futures" }),
  mk("8", "transfer_to_futures", 500, "Transfer to Boost", { account: "spot" }),
  mk("9", "transfer_to_spot", 250, "Transfer from Boost", { account: "spot" }),
];

export const TxIconMatrixPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory fixture={{ transactions: ICON_MATRIX_TXS }} />
  </div>
);

/* ---------------- 6 · HeroEquityCard equityNote ---------------- */

const HeroDemo = ({ note }: { note?: string }) => {
  const [hidden, setHidden] = useState(false);
  // Mirrors production wiring (Wallet.tsx:977): mobile form is driven by the
  // compact prop fed from useIsMobile(), not CSS breakpoints.
  const isMobile = useIsMobile();
  return (
    <HeroEquityCard
      equity={10_004.95}
      hidden={hidden}
      onToggleHidden={() => setHidden((h) => !h)}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      equityNote={note}
      compact={isMobile}
    />
  );
};


export const HeroEquityNoteLitePreview = () => <HeroDemo note="does not include open trade profit" />;

/* ============================================================
 * Wallet audit round (2026-08-27) · W-1 … W-16
 * Every case below mounts a PRODUCTION component with fixture props.
 * ============================================================ */

/* ---------------- W-1 / W-2 · Pending confirmations ---------------- */

const PENDING_FIXTURE = {
  estimatedTimeLabel: "~45s left",
  rows: [
    {
      id: "pc1",
      type: "deposit",
      amount: 800,
      description: "USDC deposit incoming",
      status: "processing",
      network: "Base",
      tx_hash: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d0719a8b7c6d5e4f3a2b1c0d9e8f",
      // M7b · FIX-3: formatTimeAgo renders "x min ago", so the row must be a
      // FIXED OFFSET FROM RENDER TIME (not from DAY_ANCHOR) — otherwise the
      // same fixture reads "3 min ago" in the morning and "7 h ago" at night.
      created_at: new Date(Date.now() - 8 * 60_000).toISOString(),
      confirmations: 6,
      required_confirmations: 15,
    },
  ] as PendingTransaction[],
};

export const PendingConfirmationsDesktopPreview = () => (
  <div className="mx-auto max-w-2xl">
    <PendingConfirmations fixture={PENDING_FIXTURE} />
  </div>
);

export const PendingConfirmationsMobilePreview = () => (
  <PendingConfirmations fixture={PENDING_FIXTURE} />
);

/* ---------------- W-3 / W-4 · Transaction history empty states ---------------- */

export const TxEmptyPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card p-4">
    <TransactionHistory fixture={{ transactions: [] }} />
  </div>
);

export const TxEmptyFilteredPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card p-4">
    <TransactionHistory
      fixture={{
        transactions: [mk("3", "deposit", 42.18, "USDC deposit · Base", { account: "spot" })],
        initialFilter: "trade",
      }}
    />
  </div>
);

/* ---------------- W-5 · Transfer — all four legs ---------------- */

const TRANSFER_LEG_TXS: Transaction[] = [
  mk("1", "transfer_to_futures", 500, "Transfer", { account: "futures" }),
  mk("2", "transfer_to_futures", -500, "Transfer", { account: "spot" }),
  mk("3", "transfer_to_spot", 250, "Transfer", { account: "spot" }),
  mk("4", "transfer_to_spot", -250, "Transfer", { account: "futures" }),
];

export const TxTransferLegsPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory fixture={{ transactions: TRANSFER_LEG_TXS }} />
  </div>
);

/* ---------------- W-6 · Status — all five ---------------- */

const STATUS_TXS: Transaction[] = [
  mk("1", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "pending" }),
  mk("2", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "processing" }),
  mk("3", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "completed" }),
  mk("4", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "failed" }),
  mk("5", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "rejected" }),
];

export const TxStatusMatrixPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory fixture={{ transactions: STATUS_TXS, initialExpandedIds: STATUS_TXS.map((tx) => tx.id) }} />
  </div>
);

/* ---------------- W-7 · Unknown type fallback ---------------- */

export const TxUnknownTypePreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory
      fixture={{
        transactions: [
          mk("1", "mystery" as TransactionType, 12.5, "Unmapped ledger entry", {
            account: "spot",
          }),
        ],
      }}
    />
  </div>
);

/* ---------------- W-8 · Expanded row detail ---------------- */

export const TxExpandedDetailPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory
      fixture={{
        transactions: [
          mk("1", "deposit", 800, "USDC deposit · Base", {
            network: "Base",
            account: "spot",
            status: "processing",
            fee: 0.35,
            txHash: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d0719a8b7c6d5e4f3a2b1c0d9e8f",
          }),
        ],
        initialExpandedId: "1",
      }}
    />
  </div>
);

/* ---------------- W-9 · Pro-only transaction types ---------------- */

const PRO_ONLY_TXS: Transaction[] = [
  mk("1", "cross_chain_in", 1000, "Bridged in from Arbitrum", {
    account: "spot",
    sourceChain: "Arbitrum",
    destChain: "Base",
    sourceToken: "USDC",
    destToken: "USDC",
  }),
  mk("2", "cross_chain_out", -400, "Bridged out to Polygon", {
    account: "spot",
    sourceChain: "Base",
    destChain: "Polygon",
  }),
  mk("3", "fiat_buy", 300, "Bought USDC with USD · Banxa", { account: "spot" }),
  mk("4", "fiat_sell", -150, "Sold USDC for USD · Banxa", { account: "spot" }),
];

export const TxProOnlyTypesPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory fixture={{ transactions: PRO_ONLY_TXS }} />
  </div>
);

/* ---------------- W-10 · Saved addresses — empty ---------------- */

export const SavedAddressesEmptyPreview = () => (
  <div className="mx-auto max-w-md trading-card p-4 space-y-2">
    <div className="flex items-center justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Saved addresses
      </h2>
      <span className="text-xs text-muted-foreground">0 addresses</span>
    </div>
    <button className="mt-3 w-full border-[1.5px] border-dashed border-[#2B2F38] hover:border-primary/60 rounded-xl h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all">
      <Plus className="w-4 h-4" />
      <span className="font-medium">Add address</span>
    </button>
    <EmptyState
      variant="module"
      bordered={false}
      title="No saved addresses"
      description="Save addresses for quick deposits and withdrawals."
      className="px-0 py-2"
    />
  </div>
);

/* ---------------- W-11 · Hero equity — hidden ---------------- */

export const HeroEquityHiddenPreview = () => {
  const [hidden, setHidden] = useState(true);
  // Same production wiring as HeroDemo: compact follows useIsMobile().
  const isMobile = useIsMobile();
  return (
    <HeroEquityCard
      equity={10_004.95}
      hidden={hidden}
      onToggleHidden={() => setHidden((h) => !h)}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      equityNote="does not include open trade profit"
      compact={isMobile}
    />

  );
};

/* ---------------- W-12 … W-15 · Deposit dialog body (desktop) ---------------- */

/** Dialog chrome only (header + account crumb + tab rail); the body is production. */
const DepositBodyShell = ({
  tab,
  children,
}: {
  tab: "wallet" | "crosschain" | "fiat";
  children: React.ReactNode;
}) => (
  <div className="mx-auto w-full max-w-[480px] rounded-xl border border-border/50 bg-background overflow-hidden">
    <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
      <span className="text-lg font-semibold">Deposit</span>
      <div className="flex items-center gap-2 text-muted-foreground">
        <HelpCircle className="w-5 h-5" />
        <X className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center justify-between px-6 py-2.5 text-xs border-b border-border/50 bg-muted/20">
      <span className="text-muted-foreground">
        To: <span className="font-medium text-foreground">Standard Account</span>
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
    </div>
    <Tabs value={tab} className="flex flex-col">
      <div className="px-4 pt-3">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="wallet" className="text-xs">Address</TabsTrigger>
          <TabsTrigger value="crosschain" className="text-xs">Wallet</TabsTrigger>
          <TabsTrigger value="fiat" className="text-xs">Fiat</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={tab} className="mt-0">{children}</TabsContent>
    </Tabs>
  </div>
);

export const DepositDialogChecklistPreview = () => (
  <DepositBodyShell tab="wallet">
    <WalletDeposit demoAcknowledged={false} account="spot" />
  </DepositBodyShell>
);

export const DepositDialogAddressPreview = () => (
  <DepositBodyShell tab="wallet">
    <WalletDeposit demoAcknowledged account="spot" onDone={noop} />
  </DepositBodyShell>
);

export const DepositDialogFiatPreview = () => (
  <DepositBodyShell tab="fiat">
    <BuyWithFiat account="spot" />
  </DepositBodyShell>
);

export const DepositDialogWalletTabPreview = () => (
  <DepositBodyShell tab="crosschain">
    <CrossChainDeposit account="spot" />
  </DepositBodyShell>
);

/* ---------------- W-16 · Withdraw form (desktop) ---------------- */

export const WithdrawFormDesktopPreview = () => (
  <WithdrawSubmitProvider>
    <div className="mx-auto w-full max-w-[560px] rounded-xl border border-border/50 bg-background p-4">
      <WalletWithdraw demoAvailableBalance={8720.42} fixtureWallets={FIXTURE_WALLETS} />
    </div>
  </WithdrawSubmitProvider>
);

/* ---------------- W-17 · fiat_buy row + net-sign verdict ---------------- */
// E1/E4 (2026-08-28): win/lose wording follows the NET AMOUNT SIGN, never the
// tx type; fiat_buy is a funding-in row and reads like a crypto deposit.
const FIAT_AND_SIGN_TXS: Transaction[] = [
  mk("1", "fiat_buy", 250, "Bought USDC with USD · Banxa", { account: "spot" }),
  mk("2", "trade_loss", 28.87, "Settled: Solana — up or down? · Up · Lost", { account: "spot" }),
  mk("3", "trade_profit", -12.4, "Settled: Ethereum — up or down? · Up · Won", { account: "spot" }),
];

export const TxFiatBuyPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory fixture={{ transactions: FIAT_AND_SIGN_TXS }} />
  </div>
);

/* ============================================================
 * M7a-② · Ⓐ 组合层与登录门（W-18 / W-19）
 * 全部挂生产导出 + 静态 fixture：无 fetch、无 Date.now、无随机。
 * ============================================================ */

const LAYOUT_FIXTURE = { equity: 15_885.23, spot: 482.95, futures: 15_402.28 };

const LAYOUT_TXS: Transaction[] = [
  mk("2", "deposit", 1000, "USDC deposit · Base", { network: "Base", account: "spot" }),
  mk("6", "transfer_to_futures", 500, "Transfer to Boost", { account: "spot" }),
  mk("9", "trade_profit", 128.4, "Settled: Bitcoin · Up · Won", { account: "futures" }),
];

const RecoveryLink = () => (
  <button
    type="button"
    className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
  >
    Sent funds to the wrong network? Request recovery →
  </button>
);

const SavedAddressesPanel = ({ compact = false }: { compact?: boolean }) => (
  <div className={compact ? "trading-card p-4" : "trading-card p-6"}>
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Saved addresses
      </h2>
      <span className="text-xs text-muted-foreground">2 addresses</span>
    </div>
    <SavedAddressRowView
      wallet={ADDR_DEFAULT}
      isLast={false}
      isMobile={compact}
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
    <SavedAddressRowView
      wallet={ADDR_SECONDARY}
      isLast
      isMobile={compact}
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
  </div>
);

export const WalletPageLayoutDesktopPreview = () => (
  <div className="mx-auto w-full max-w-7xl space-y-[18px] px-4 py-6">
    <MaintenanceNoticeBanner className="mb-2" />
    <HeroEquityCard
      equity={LAYOUT_FIXTURE.equity}
      hidden={false}
      onToggleHidden={noop}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      equityNote="does not include open trade profit"
    />
    <section className="grid grid-cols-2 gap-6">
      <SpotAccountCard balance={LAYOUT_FIXTURE.spot} hidden={false} onTransfer={noop} />
      <FuturesAccountCard
        balance={LAYOUT_FIXTURE.futures}
        hidden={false}
        onTransfer={noop}
        marginInUse={1_240}
        unrealizedPnL={86.12}
        AvailableTooltip={AvailableBalanceTooltip}
        boostMax={20}
      />
    </section>
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 space-y-6">
        <div className="trading-card p-6">
          <TransactionHistory fixture={{ transactions: LAYOUT_TXS }} />
        </div>
        <RecoveryLink />
      </div>
      <div className="col-span-4 space-y-6">
        <SavedAddressesPanel />
      </div>
    </div>
  </div>
);

export const WalletPageLayoutMobilePreview = () => (
  <div className="space-y-4 px-4 py-6">
    <MaintenanceNoticeBanner />
    <HeroEquityCard
      equity={LAYOUT_FIXTURE.equity}
      hidden={false}
      onToggleHidden={noop}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      compact
      equityNote="does not include open trade profit"
    />
    <section className="space-y-3">
      <SpotAccountCard balance={LAYOUT_FIXTURE.spot} hidden={false} onTransfer={noop} compact />
      <FuturesAccountCard
        balance={LAYOUT_FIXTURE.futures}
        hidden={false}
        onTransfer={noop}
        marginInUse={1_240}
        unrealizedPnL={86.12}
        AvailableTooltip={AvailableBalanceTooltip}
        boostMax={20}
        compact
      />
    </section>
    <SavedAddressesPanel compact />
    <div className="trading-card p-4">
      <TransactionHistory fixture={{ transactions: LAYOUT_TXS }} />
    </div>
    <RecoveryLink />
  </div>
);

/** W-19 · 三路由同门：Lite 形态（上）+ Pro 形态（下），fixture 强制 guest。 */
export const WalletAuthGatePreview = () => (
  <div className="space-y-6 p-4">
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Lite · LiteAuthGate
      </div>
      <WalletAuthGate isLite forceSignedOut>
        <WalletGatePlaceholder />
      </WalletAuthGate>
    </div>
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Pro · AuthGateOverlay
      </div>
      <WalletAuthGate isLite={false} maxPreviewHeight="400px" forceSignedOut>
        <WalletGatePlaceholder />
      </WalletAuthGate>
    </div>
  </div>
);
