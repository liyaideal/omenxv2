/**
 * Wallet Lite R1 previews — archive round (batches 1–3).
 *
 * Truth Rule (§16.1.1): every demo below mounts the PRODUCTION component with
 * fixture props — LiteAuthGate / AuthGateOverlay / AuthContent / HeroEquityCard /
 * SavedAddressRowView / SavedAddressActionsList / ProductLineBadge /
 * TransactionHistory. No hand-copied markup.
 *
 * Fixtures use relative dates (hoursAgo) so the docs never go stale.
 */
import { useState } from "react";
import { ChevronRight, HelpCircle, Plus, X } from "lucide-react";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { LiteAuthGate } from "@/components/portfolio/lite/LiteAuthGate";
import { AuthContent } from "@/components/auth/AuthContent";
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
import {
  HeroEquityCard,
  SavedAddressRowView,
  SavedAddressActionsList,
  type SavedAddressView,
} from "@/pages/Wallet";
import {
  TransactionHistory,
  type Transaction,
  type TransactionType,
} from "@/components/wallet/TransactionHistory";
import type { AuthStep } from "@/hooks/useAuth";


const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

/* ---------------- 1 · Wallet auth gate (Lite vs Pro) ---------------- */

const GateUnderlay = () => (
  <div className="space-y-3 p-4">
    <div className="h-24 rounded-[18px] border border-border bg-card" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-28 rounded-xl border border-border bg-card" />
      <div className="h-28 rounded-xl border border-border bg-card" />
    </div>
  </div>
);

export const WalletGateLitePreview = () => (
  <LiteAuthGate
    forceSignedOut
    title="Sign in to view your wallet"
    description="Deposit, withdraw and move funds between your accounts by signing in."
  >
    <GateUnderlay />
  </LiteAuthGate>
);

export const WalletGateProPreview = () => (
  <AuthGateOverlay
    title="Sign in to view your wallet"
    description="Manage your funds and saved addresses by signing in."
  >
    <GateUnderlay />
  </AuthGateOverlay>
);

/* ---------------- 2 · Lite auth layer — three steps ---------------- */

const AuthShell = ({
  step,
  variant,
}: {
  step: AuthStep;
  variant: "desktop" | "mobile";
}) => {
  const [s, setS] = useState<AuthStep>(step);
  const [loading, setLoading] = useState(false);
  return (
    <div
      className={
        variant === "mobile"
          ? "mx-auto w-full max-w-[375px] rounded-t-3xl border border-border bg-background px-5 pt-4 pb-6"
          : "mx-auto w-full max-w-md rounded-xl border border-border/50 bg-background p-6"
      }
    >
      <AuthContent
        step={s}
        setStep={setS}
        isLoading={loading}
        setIsLoading={setLoading}
        variant={variant}
      />
    </div>
  );
};

export const AuthLiteLoginDesktopPreview = () => <AuthShell step="login" variant="desktop" />;
export const AuthLiteCreateWalletDesktopPreview = () => <AuthShell step="createWallet" variant="desktop" />;
export const AuthLiteCompleteProfileDesktopPreview = () => <AuthShell step="completeProfile" variant="desktop" />;
export const AuthLiteLoginMobilePreview = () => <AuthShell step="login" variant="mobile" />;
export const AuthLiteCreateWalletMobilePreview = () => <AuthShell step="createWallet" variant="mobile" />;
export const AuthLiteCompleteProfileMobilePreview = () => <AuthShell step="completeProfile" variant="mobile" />;

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
    date: d.toISOString(),
    timestamp: d.getTime(),
    status: "completed",
    ...extra,
  };
};

const ICON_MATRIX_TXS: Transaction[] = [
  mk("1", "deposit", 1000, "USDC deposit · Base", { network: "Base", account: "spot" }),
  mk("2", "withdraw", 200, "USDC withdraw · Base", { network: "Base", account: "futures", status: "processing" }),
  mk("3", "trade_profit", 42.18, "Settled: BTC ≥ $150k · Won", { account: "futures" }),
  mk("4", "trade_loss", 18.4, "Settled: Bitcoin · Up · Lost", { account: "futures" }),
  mk("5", "platform_credit", 25, "Platform credit", { account: "spot" }),
  mk("6", "bonus", 10, "Trial position voucher TPV-DEMO-S1", { account: "spot" }),
  mk("7", "fee", 1.25, "Trading fee", { account: "futures" }),
  mk("8", "transfer_to_futures", 500, "Transfer to Boost", { account: "spot" }),
  mk("9", "transfer_to_spot", 250, "Transfer from Boost", { account: "spot" }),
];

export const TxIconMatrixPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory transactions={ICON_MATRIX_TXS} />
  </div>
);

/* ---------------- 6 · HeroEquityCard equityNote ---------------- */

const HeroDemo = ({ note }: { note?: string }) => {
  const [hidden, setHidden] = useState(false);
  return (
    <HeroEquityCard
      equity={10_004.95}
      hidden={hidden}
      onToggleHidden={() => setHidden((h) => !h)}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      equityNote={note}
      compact
    />
  );
};

export const HeroEquityNoteLitePreview = () => <HeroDemo note="does not include open trade profit" />;
export const HeroEquityNoteProPreview = () => <HeroDemo />;

/* ============================================================
 * Wallet audit round (2026-08-27) · W-1 … W-16
 * Every case below mounts a PRODUCTION component with fixture props.
 * ============================================================ */

/* ---------------- W-1 / W-2 · Pending confirmations ---------------- */

const PENDING_FIXTURE = {
  rows: [
    {
      id: "pc1",
      type: "deposit",
      amount: 800,
      description: "USDC deposit incoming",
      status: "processing",
      network: "Base",
      tx_hash: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d0719a8b7c6d5e4f3a2b1c0d9e8f",
      created_at: hoursAgo(0.05).toISOString(),
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
    <TransactionHistory transactions={[]} />
  </div>
);

export const TxEmptyFilteredPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card p-4">
    <TransactionHistory
      transactions={[mk("3", "trade_profit", 42.18, "Settled: BTC ≥ $150k · Won", { account: "futures" })]}
      fixture={{ initialFilter: "withdraw" }}
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
    <TransactionHistory transactions={TRANSFER_LEG_TXS} />
  </div>
);

/* ---------------- W-6 · Status — all five ---------------- */

const STATUS_TXS: Transaction[] = [
  mk("1", "deposit", 250, "USDC deposit · Base", { network: "Base", account: "spot", status: "pending" }),
  mk("2", "deposit", 250, "USDC deposit · Base", { network: "Base", account: "spot", status: "processing" }),
  mk("3", "deposit", 250, "USDC deposit · Base", { network: "Base", account: "spot", status: "completed" }),
  mk("4", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "failed" }),
  mk("5", "withdraw", -250, "USDC withdraw · Base", { network: "Base", account: "futures", status: "rejected" }),
];

export const TxStatusMatrixPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory transactions={STATUS_TXS} />
  </div>
);

/* ---------------- W-7 · Unknown type fallback ---------------- */

export const TxUnknownTypePreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory
      transactions={[
        mk("1", "future_type_not_yet_mapped" as TransactionType, 12.5, "Unmapped ledger entry", {
          account: "spot",
        }),
      ]}
    />
  </div>
);

/* ---------------- W-8 · Expanded row detail ---------------- */

export const TxExpandedDetailPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory
      transactions={[
        mk("1", "deposit", 800, "USDC deposit · Base", {
          network: "Base",
          account: "spot",
          status: "processing",
          fee: 0.35,
          txHash: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d0719a8b7c6d5e4f3a2b1c0d9e8f",
        }),
      ]}
      fixture={{ initialExpandedId: "1" }}
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
    <TransactionHistory transactions={PRO_ONLY_TXS} />
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
  return (
    <HeroEquityCard
      equity={10_004.95}
      hidden={hidden}
      onToggleHidden={() => setHidden((h) => !h)}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      equityNote="does not include open trade profit"
      compact
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
    <WalletDeposit demoAcknowledged account="spot" />
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
      <WalletWithdraw demoAvailableBalance={8720.42} />
    </div>
  </WithdrawSubmitProvider>
);
